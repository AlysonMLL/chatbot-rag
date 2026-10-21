"""
Preparação do DataFrame antes de enviar ao agente.

- preparar_dataframe: detecta tabelas "empilhadas" (formato longo), em que a mesma
  entidade aparece em várias linhas, cada uma com um bloco diferente de colunas
  preenchido, e consolida em 1 linha por entidade (evita contagem em dobro).
- gerar_contexto: texto curto com o perfil do dataset e regras de resposta,
  usado como prefixo do prompt do agente.
"""
import pandas as pd


def _achar_chave_e_particao(df: pd.DataFrame):
    n = len(df)
    num_cols = df.select_dtypes("number").columns.tolist()
    if n < 20 or len(num_cols) < 3:
        return None

    # Candidatas a chave: colunas que se repetem, mas não são quase constantes.
    candidatas = []
    for col in df.columns:
        nao_nulos = int(df[col].notna().sum())
        if nao_nulos == 0:
            continue
        unicos = int(df[col].nunique(dropna=True))
        if unicos >= 2 and (1 - unicos / nao_nulos) >= 0.2 and unicos >= 0.02 * n:
            candidatas.append((("id" not in str(col).lower()), -unicos, col))
    candidatas.sort(key=lambda t: (t[0], t[1]))  # colunas com "id" primeiro; depois maior cardinalidade

    for _, _, chave in candidatas[:6]:
        outras_num = [c for c in num_cols if c != chave]
        if not outras_num:
            continue
        sub = df[df[chave].notna()]
        grupos = sub.groupby(chave, sort=False)

        # 1) as colunas numéricas não podem se contradizer entre as linhas repetidas
        if not (grupos[outras_num].nunique(dropna=True).max() <= 1).all():
            continue

        # 2) precisa existir uma coluna "de bloco" (poucos valores) que particiona as linhas
        for part in sub.columns:
            if part == chave or sub[part].nunique(dropna=True) > 30 or sub[part].nunique(dropna=True) < 2:
                continue
            # tolera poucas repetições (até 1% das linhas); contradições já foram barradas no passo 1
            if sub.duplicated([chave, part]).sum() > 0.01 * len(sub):
                continue
            # 3) assinatura de bloco: quase toda coluna numérica fica 100% vazia em algum bloco
            vazias = 0
            for c in outras_num:
                por_bloco = sub[c].isna().groupby(sub[part]).all()
                vazias += int(por_bloco.any())
            if vazias / len(outras_num) >= 0.8:
                return chave, part
    return None


def preparar_dataframe(df: pd.DataFrame):
    """Devolve (df_preparado, aviso). Se nada for detectado, devolve (df, None)."""
    achado = _achar_chave_e_particao(df)
    if achado is None:
        return df, None
    chave, part = achado

    sem_chave = df[df[chave].isna()]
    com_chave = df[df[chave].notna()]
    grupos = com_chave.groupby(chave, sort=False)

    constantes = [c for c in com_chave.columns
                  if c != chave and (grupos[c].nunique(dropna=True) <= 1).all()]
    descartadas = [c for c in com_chave.columns if c != chave and c not in constantes]

    consolidado = grupos[constantes].first().reset_index()
    ordem = [c for c in df.columns if c in consolidado.columns]
    consolidado = consolidado[ordem]

    aviso = (
        f"O arquivo original tinha {len(df)} linhas com a coluna `{chave}` repetida "
        f"(blocos de colunas separados por `{part}`). Foi consolidado em "
        f"{len(consolidado)} linhas, uma por `{chave}`, para não contar valores em dobro."
    )
    if descartadas:
        aviso += " Colunas removidas por variarem dentro de cada " + f"`{chave}`: " + ", ".join(descartadas) + "."
    if len(sem_chave):
        aviso += f" {len(sem_chave)} linhas sem `{chave}` foram ignoradas."
    return consolidado, aviso


def gerar_contexto(df: pd.DataFrame, aviso: str | None = None) -> str:
    linhas = [
        "Os dados estão em um DataFrame do pandas chamado `df`.",
        f"Dataset: {len(df)} linhas x {df.shape[1]} colunas.",
    ]
    categoricas = []
    for col in df.columns:
        if not pd.api.types.is_numeric_dtype(df[col]):
            valores = df[col].dropna().unique()
            if 1 < len(valores) <= 12:
                categoricas.append(f"{col}: {', '.join(map(str, valores))}")
    if categoricas:
        linhas.append("Colunas categóricas e seus valores: " + " | ".join(categoricas) + ".")
    vazias = df.isna().mean()
    muito_nulas = [f"{c} ({p:.0%})" for c, p in vazias.items() if p >= 0.5]
    if muito_nulas:
        linhas.append("Colunas com mais de 50% de valores nulos: " + ", ".join(muito_nulas[:15]) + ".")
    if aviso:
        linhas.append("Nota sobre os dados: " + aviso)
    linhas += [
        "Regras de resposta:",
        "- Responda SEMPRE em português do Brasil. Se valores de colunas estiverem em inglês, traduza-os ao responder (ex.: GOALKEEPER = goleiro).",
        "- Em pedidos de 'top N', devolva exatamente N linhas distintas, sem repetir a mesma entidade.",
        "- Antes de somar ou contar por entidade, verifique linhas duplicadas e evite contar a mesma coisa duas vezes.",
        "- Considere valores nulos (NaN) e diga quando um resultado ignora linhas sem dados.",
        "- Em rankings com empate na última posição, avise quem mais empatou (ex.: 'há mais N com o mesmo valor').",
        "- Médias, somas e contagens ignoram nulos: diga em quantas linhas havia dado, em vez de afirmar que usou todas.",
    ]
    return "\n".join(linhas)