"""
Executa o código gerado pelo modelo em um PROCESSO SEPARADO (iniciado por analise.py).

Lê um pickle do stdin ({"df": DataFrame, "code": str}), executa o código com builtins
restritos e devolve um JSON na saída padrão, depois do marcador @@RESULTADO@@.
"""

import builtins
import contextlib
import io
import json
import pickle
import sys

PERMITIDOS = [
    "abs", "all", "any", "bool", "dict", "enumerate", "filter", "float", "int", "len", "list",
    "map", "max", "min", "print", "range", "reversed", "round", "set", "slice", "sorted",
    "str", "sum", "tuple", "zip", "isinstance",
]


def formatar(valor) -> str:
    import pandas as pd

    if isinstance(valor, pd.DataFrame):
        return valor.head(50).to_string(max_cols=25, max_colwidth=40)
    if isinstance(valor, pd.Series):
        return valor.head(50).to_string()
    return str(valor)


def main() -> None:
    dados = pickle.load(sys.stdin.buffer)
    import numpy as np
    import pandas as pd

    seguros = {nome: getattr(builtins, nome) for nome in PERMITIDOS}
    espaco = {"df": dados["df"], "pd": pd, "np": np, "__builtins__": seguros}
    saida = io.StringIO()
    try:
        with contextlib.redirect_stdout(saida):
            exec(compile(dados["code"], "<analise>", "exec"), espaco)
        texto = formatar(espaco["resultado"]) if "resultado" in espaco else saida.getvalue()
        if not texto.strip():
            raise ValueError("O código não definiu a variável `resultado`.")
        resposta = {"ok": True, "output": texto[:6000]}
    except BaseException as e:  # inclui SystemExit e KeyboardInterrupt
        resposta = {"ok": False, "error": f"{type(e).__name__}: {e}"[:500]}
    sys.stdout.write("\n@@RESULTADO@@" + json.dumps(resposta, ensure_ascii=False))


if __name__ == "__main__":
    main()