"""
Fluxo de análise com 2 chamadas ao modelo e execução segura do código gerado.

  1. O modelo recebe a pergunta + contexto do dataset e devolve SÓ código pandas.
  2. O código passa por uma validação (lista de permissões sobre a árvore do Python).
  3. O código é executado em um processo separado, com ambiente limpo e tempo limite.
  4. O modelo explica o resultado em português.

IMPORTANTE: isto reduz muito o risco, mas não é uma "sandbox" perfeita. Em produção, use
também isolamento do ambiente (container, sem segredos no ambiente do processo filho).
"""
import ast
import json
import os
import pickle
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import pandas as pd

RUNNER = Path(__file__).with_name("runner_analise.py")
MAX_CODIGO = 4000
MAX_NOS = 800
TIMEOUT_EXECUCAO = int(os.getenv("TIMEOUT_EXECUCAO", "20"))
MAX_TENTATIVAS_CODIGO = 3


class LLMIndisponivel(Exception):
    """Nenhum modelo conseguiu responder."""


class AnaliseFalhou(Exception):
    """Não foi possível gerar/executar um código válido; a mensagem é segura para o usuário."""


# --------------------------------------------------------------- validação
NOS_PERMITIDOS = (
    ast.Module, ast.Expr, ast.Assign, ast.AugAssign, ast.Name, ast.Load, ast.Store, ast.Constant,
    ast.BinOp, ast.UnaryOp, ast.BoolOp, ast.Compare, ast.Call, ast.keyword, ast.Attribute,
    ast.Subscript, ast.Slice, ast.List, ast.Tuple, ast.Dict, ast.Set, ast.ListComp, ast.DictComp,
    ast.SetComp, ast.GeneratorExp, ast.comprehension, ast.IfExp, ast.If, ast.For, ast.Break,
    ast.Continue, ast.Pass, ast.Lambda, ast.arguments, ast.arg, ast.JoinedStr,
    ast.FormattedValue, ast.Starred, ast.operator, ast.unaryop, ast.boolop, ast.cmpop,
    ast.expr_context,
)

NOMES_PROIBIDOS = {
    "eval", "exec", "compile", "open", "input", "getattr", "setattr", "delattr", "globals",
    "locals", "vars", "dir", "breakpoint", "help", "exit", "quit", "type", "object", "super",
    "memoryview", "bytes", "bytearray", "os", "sys", "subprocess", "importlib", "builtins",
    "pickle", "socket", "shutil", "ctypes",
}

ATRIBUTOS_PROIBIDOS = {
    "eval", "query", "format", "format_map", "system", "popen", "exec", "open", "load", "loads",
    "dump", "dumps", "save", "savez", "savez_compressed", "savetxt", "loadtxt", "genfromtxt",
    "fromfile", "tofile", "memmap", "fromregex", "ctypeslib", "lib", "testing", "f2py",
    "distutils", "io", "compat", "core", "util", "api", "plotting", "plot", "style", "hist",
    "boxplot", "options", "option_context", "set_option", "get_option", "reset_option",
    "describe_option", "os", "sys", "subprocess", "builtins", "importlib", "pickle", "shutil",
    "socket", "ctypes", "mmap",
}

TO_PERMITIDOS = {
    "to_dict", "to_list", "to_numpy", "to_string", "to_frame", "to_datetime", "to_numeric",
    "to_period", "to_timestamp", "to_timedelta",
}


def validar_codigo(codigo: str) -> str | None:
    """Devolve None se o código é aceito, ou uma mensagem explicando o motivo da recusa."""
    if not codigo.strip():
        return "O código está vazio."
    if len(codigo) > MAX_CODIGO:
        return f"O código passa de {MAX_CODIGO} caracteres."
    try:
        arvore = ast.parse(codigo)
    except SyntaxError as e:
        return f"Erro de sintaxe: {e.msg} (linha {e.lineno})."

    total = 0
    for no in ast.walk(arvore):
        total += 1
        if total > MAX_NOS:
            return "O código é grande demais."
        if not isinstance(no, NOS_PERMITIDOS):
            return f"Construção não permitida: {type(no).__name__} (sem import, def, class, while, try, with...)."
        if isinstance(no, ast.Name):
            if no.id.startswith("_") or no.id in NOMES_PROIBIDOS:
                return f"Nome não permitido: `{no.id}`."
        elif isinstance(no, ast.Attribute):
            a = no.attr
            if a.startswith("_"):
                return f"Atributo não permitido: `{a}` (atributos que começam com _)."
            if a in ATRIBUTOS_PROIBIDOS or a.startswith("read_"):
                return f"Atributo/método não permitido: `{a}`."
            if a.startswith("to_") and a not in TO_PERMITIDOS:
                return f"Método não permitido: `{a}` (não é possível exportar dados)."
        elif isinstance(no, ast.Constant) and isinstance(no.value, str) and "__" in no.value:
            return "Textos com '__' não são permitidos."
    return None


# ---------------------------------------------------------------------- execução
def _ambiente_limpo() -> dict[str, str]:
    """Ambiente mínimo para o processo filho: sem chaves de API nem outras variáveis."""
    manter = ("SYSTEMROOT", "PATH", "TEMP", "TMP", "LANG", "LC_ALL")
    return {k: os.environ[k] for k in manter if k in os.environ}


def executar_codigo(df: pd.DataFrame, codigo: str, timeout: int = TIMEOUT_EXECUCAO) -> tuple[bool, str]:
    """Roda o código em um processo separado. Devolve (ok, saida_ou_erro)."""
    carga = pickle.dumps({"df": df, "code": codigo})
    with tempfile.TemporaryDirectory() as pasta:
        try:
            proc = subprocess.run(
                [sys.executable, "-I", str(RUNNER)],
                input=carga, capture_output=True, timeout=timeout,
                env=_ambiente_limpo(), cwd=pasta,
            )
        except subprocess.TimeoutExpired:
            return False, f"A execução passou do limite de {timeout} s."
    saida = proc.stdout.decode("utf-8", errors="replace")
    marcador = "@@RESULTADO@@"
    if marcador not in saida:
        print(f"[runner] sem resultado. stderr: {proc.stderr.decode('utf-8', 'replace')[-500:]}", file=sys.stderr)
        return False, "A execução do código falhou."
    try:
        dados = json.loads(saida.rsplit(marcador, 1)[1])
    except json.JSONDecodeError:
        return False, "A execução do código devolveu uma saída inválida."
    return (True, dados["output"]) if dados.get("ok") else (False, dados.get("error", "Erro desconhecido."))


# ------------------------------------------------------------------------ modelo
def _chamar_llm_padrao(mensagens: list[tuple[str, str]]) -> str:
    """Chama o primeiro modelo disponível entre LLM_MODEL e LLM_MODEL_FALLBACK."""
    from langchain_openai import ChatOpenAI

    modelos = [m for m in (os.getenv("LLM_MODEL"), os.getenv("LLM_MODEL_FALLBACK")) if m]
    for modelo in modelos:
        try:
            llm = ChatOpenAI(
                model=modelo, api_key=os.getenv("LLM_API_KEY"), base_url=os.getenv("LLM_BASE_URL"),
                temperature=0.1, timeout=60, max_retries=1,
            )
            return str(llm.invoke(mensagens).content)
        except Exception as e:
            print(f"Modelo {modelo} falhou: {e}", file=sys.stderr)
    raise LLMIndisponivel("Nenhum modelo respondeu.")


PROMPT_CODIGO = """Você é um analista de dados que escreve código pandas.
{contexto}

Regras do código:
- O DataFrame já está na variável `df`. Também existem `pd` (pandas) e `np` (numpy). NÃO use import.
- Guarde a resposta final na variável `resultado` (DataFrame, Series ou valor simples). Em rankings, no máximo 50 linhas.
- Não leia nem grave arquivos e não use `query`, `eval`, `format`, `getattr` nem nomes que comecem com `_`.
- Não altere o `df` original: trabalhe em cópias.
- Escreva no máximo 25 linhas e responda APENAS com um bloco ```python ... ```."""

PROMPT_EXPLICACAO = """Você explica resultados de análises de dados em português do Brasil.
{contexto}

Baseie-se SOMENTE no resultado fornecido e não invente números. Seja direto; use lista numerada para
rankings; avise sobre empates e sobre valores nulos ignorados quando o resultado indicar isso. Se o
resultado estiver vazio ou for um erro, diga isso com clareza."""


def extrair_codigo(texto: str) -> str:
    achado = re.search(r"```(?:python|py)?\s*\n(.*?)```", texto, re.DOTALL | re.IGNORECASE)
    return (achado.group(1) if achado else texto).strip()


def responder_pergunta(df: pd.DataFrame, contexto: str, pergunta: str, historico: str = "",
                       chamar_llm=None) -> dict:
    """Devolve {"answer": texto, "code": código}. Levanta LLMIndisponivel ou AnaliseFalhou."""
    chamar_llm = chamar_llm or _chamar_llm_padrao
    mensagens = [
        ("system", PROMPT_CODIGO.format(contexto=contexto)),
        ("human", f"{historico}Pergunta: {pergunta}"),
    ]
    ultimo_erro = ""
    for tentativa in range(1, MAX_TENTATIVAS_CODIGO + 1):
        resposta = chamar_llm(mensagens)
        codigo = extrair_codigo(resposta)

        erro = validar_codigo(codigo)
        if erro is None:
            ok, saida = executar_codigo(df, codigo)
            if ok:
                explicacao = chamar_llm([
                    ("system", PROMPT_EXPLICACAO.format(contexto=contexto)),
                    ("human", f"{historico}Pergunta: {pergunta}\n\nCódigo executado:\n```python\n{codigo}\n```\n\n"
                              f"Resultado:\n{saida}\n\nResponda à pergunta."),
                ])
                return {"answer": explicacao.strip(), "code": codigo}
            erro = saida

        ultimo_erro = erro
        print(f"[analise] tentativa {tentativa} recusada/falhou: {erro}", file=sys.stderr)
        mensagens += [
            ("assistant", resposta),
            ("human", f"O código não pôde ser usado: {erro}\nCorrija e responda de novo APENAS com um bloco ```python```."),
        ]
    raise AnaliseFalhou(
        "Não consegui responder a essa pergunta com segurança. Tente reformulá-la de outro jeito."
    )