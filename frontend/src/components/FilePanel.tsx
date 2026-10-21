import { useState } from 'react';
import { ChevronDown, ChevronRight, Columns3, Database, FileSpreadsheet, Hash, Info, Rows3, X } from 'lucide-react';
import type { UploadInfo } from '@/types';

type FilePanelProps = {
  file: UploadInfo;
  onReset: () => void;
  onClose?: () => void;
};

export default function FilePanel({ file, onReset, onClose }: FilePanelProps) {
  const [showColumns, setShowColumns] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  // Formatação de tamanho e fatiamento da prévia
  const sizeLabel = file.size_mb < 0.01 ? '< 0,01 MB' : `${file.size_mb.toLocaleString('pt-BR')} MB`;
  const previewColumns = file.columns.slice(0, 5);
  const previewRows = file.preview ? file.preview.map((row) => row.slice(0, 5)) : [];

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#101017]">
      {/* Topo / Logo */}
      <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/[0.06] px-5">
        <img src="/TabulaRAG_Branco.png" alt="TabulaRAG" className="h-16 w-auto object-contain" />
        {onClose && (
          <button 
            onClick={onClose} 
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-white/10 hover:text-white lg:hidden" 
            aria-label="Fechar informações do arquivo"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Conteúdo com Scroll */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-custom">
        
        {/* Bloco do Arquivo Ativo + Botão Trocar */}
        <div className="border-b border-white/[0.06] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-500/10 border border-green-500/20">
              <FileSpreadsheet className="h-5 w-5 text-green-400" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-white" title={file.filename}>
                {file.filename}
              </h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                Arquivo carregado
              </p>
            </div>
          </div>

          <button 
            onClick={onReset} 
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Database className="h-3.5 w-3.5" />
            Trocar arquivo
          </button>
        </div>

        {/* Resumo de Métricas do Arquivo */}
        <div className="border-b border-white/[0.06] p-5 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">
            Resumo do arquivo
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/[0.04] p-3 border border-white/5">
              <div className="mb-1 flex items-center gap-2 text-gray-500">
                <Rows3 className="h-3.5 w-3.5" />
                <span className="text-xs">Linhas</span>
              </div>
              <p className="text-lg font-bold text-purple-300">
                {file.rows.toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="rounded-xl bg-white/[0.04] p-3 border border-white/5">
              <div className="mb-1 flex items-center gap-2 text-gray-500">
                <Columns3 className="h-3.5 w-3.5" />
                <span className="text-xs">Colunas</span>
              </div>
              <p className="text-lg font-bold text-blue-300">
                {file.columns_count.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-3 border border-white/5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <Database className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Tamanho</p>
              <p className="text-sm font-semibold text-gray-200">{sizeLabel}</p>
            </div>
          </div>

          {/* Aviso do backend (caso tenha feito alguma consolidação/trata de dados) */}
          {file.note && (
            <div className="flex gap-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-300">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-400" />
              <p className="leading-relaxed">{file.note}</p>
            </div>
          )}
        </div>

        {/* Seções Expansíveis (Colunas e Prévia) */}
        <div className="space-y-5 p-5">
          {/* Colunas */}
          <section>
            <button 
              onClick={() => setShowColumns(!showColumns)} 
              className="mb-3 flex w-full items-center gap-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 transition-colors hover:text-white"
            >
              {showColumns ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Columns3 className="h-4 w-4 text-purple-400" />
              Colunas
              <span className="ml-auto text-xs font-mono font-normal text-gray-500">
                {file.columns.length}
              </span>
            </button>

            {showColumns && (
              <div className="space-y-1.5 animate-fade-in max-h-60 overflow-y-auto scrollbar-custom pr-1">
                {file.columns.map((col, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between rounded-lg px-2.5 py-1.5 bg-white/[0.02] hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Hash className="h-3 w-3 flex-shrink-0 text-gray-500" />
                      <span className="truncate font-mono text-xs text-gray-300" title={col.name}>
                        {col.name}
                      </span>
                    </div>
                    <span className="ml-2 flex-shrink-0 rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-gray-500">
                      {col.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Prévia dos Dados */}
          <section>
            <button 
              onClick={() => setShowPreview(!showPreview)} 
              className="mb-3 flex w-full items-center gap-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 transition-colors hover:text-white"
            >
              {showPreview ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <FileSpreadsheet className="h-4 w-4 text-blue-400" />
              Prévia dos dados
            </button>

            {showPreview && (
              <div className="animate-fade-in">
                <div className="overflow-x-auto scrollbar-custom rounded-lg border border-white/10 bg-black/30 p-2">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        {previewColumns.map((col, i) => (
                          <th key={i} className="whitespace-nowrap px-2 py-1.5 text-left font-mono font-medium text-gray-400">
                            {col.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="whitespace-nowrap px-2 py-1.5 text-gray-400 font-mono">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-center text-[10px] text-gray-600">
                  Mostrando {file.preview?.length || 0} de {file.rows.toLocaleString('pt-BR')} linhas
                </p>
              </div>
            )}
          </section>
        </div>

      </div>
    </div>
  );
}