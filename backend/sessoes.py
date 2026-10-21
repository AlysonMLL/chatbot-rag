"""
Armazenamento em memória (RAM) dos arquivos enviados, no lugar da pasta uploads/.

- Cada upload vira uma sessão com ID aleatório (file_id).
- Sessões expiram após ficar um tempo sem uso (TTL).
- Há limite de quantidade e de memória total; ao estourar, as menos usadas saem primeiro.
- Seguro para uso com várias threads (o FastAPI roda rotas `def` em threads).
- Atenção: funciona com UM processo (um worker do uvicorn). Com vários workers,
  cada um teria a sua própria memória.
"""
import threading
import time
import uuid
from dataclasses import dataclass

import pandas as pd


@dataclass
class Sessao:
    df: pd.DataFrame      # já preparado/consolidado
    contexto: str         # texto de contexto do dataset para o agente
    nome: str             # nome original do arquivo (só para exibição)
    bytes_usados: int
    ultimo_uso: float


class SessaoStore:
    def __init__(self, ttl_segundos: int = 1800, max_sessoes: int = 20,
                 limite_mb_total: int = 300, relogio=time.monotonic):
        self._ttl = ttl_segundos
        self._max = max_sessoes
        self._limite_bytes = limite_mb_total * 1024 * 1024
        self._relogio = relogio
        self._sessoes: dict[str, Sessao] = {}
        self._lock = threading.Lock()

    # -- internos (chamar com o lock já adquirido) ---------------------------
    def _remover_expiradas(self) -> None:
        agora = self._relogio()
        for fid in [f for f, s in self._sessoes.items() if agora - s.ultimo_uso > self._ttl]:
            del self._sessoes[fid]

    def _total_bytes(self) -> int:
        return sum(s.bytes_usados for s in self._sessoes.values())

    def _remover_menos_usada(self) -> None:
        fid = min(self._sessoes, key=lambda f: self._sessoes[f].ultimo_uso)
        del self._sessoes[fid]

    # -- API pública ---------------------------------------------------------
    def criar(self, df: pd.DataFrame, contexto: str, nome: str) -> str:
        usados = int(df.memory_usage(deep=True).sum())
        if usados > self._limite_bytes:
            raise ValueError(
                f"O arquivo ocupa {usados / 1024 / 1024:.0f} MB em memória e passa do limite "
                f"de {self._limite_bytes // 1024 // 1024} MB. Use um arquivo menor."
            )
        with self._lock:
            self._remover_expiradas()
            while self._sessoes and (len(self._sessoes) >= self._max
                                     or self._total_bytes() + usados > self._limite_bytes):
                self._remover_menos_usada()
            file_id = uuid.uuid4().hex
            self._sessoes[file_id] = Sessao(df, contexto, nome, usados, self._relogio())
            return file_id

    def obter(self, file_id: str) -> Sessao | None:
        with self._lock:
            self._remover_expiradas()
            sessao = self._sessoes.get(file_id)
            if sessao is not None:
                sessao.ultimo_uso = self._relogio()
            return sessao

    def remover(self, file_id: str) -> bool:
        with self._lock:
            return self._sessoes.pop(file_id, None) is not None

    def __len__(self) -> int:
        with self._lock:
            return len(self._sessoes)