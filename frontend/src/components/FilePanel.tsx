import { FileSpreadsheet, Database, Columns3, Rows3, Hash, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { useState } from 'react';
import type { UploadInfo } from '@/types';

type FilePanelProps = {
  file: UploadInfo;
};

export default function FilePanel({ file }: FilePanelProps) {
  const [showColumns, setShowColumns] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const previewColumns = file.columns.slice(0, 5);
  const previewRows = file.preview.map((row) => row.slice(0, 5));
  const sizeLabel = file.size_mb < 0.01 ? '< 0,01 MB' : `${file.size_mb.toLocaleString('pt-BR')} MB`;

  return (
    <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0 glass-strong rounded-2xl flex flex-col max-h-[calc(100vh-7rem)] overflow-hidden animate-slide-in">
      {/* Header */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center border border-green-500/20">
            <FileSpreadsheet className="w-5 h-5 text-green-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{file.filename}</h3>
            <p className="text-xs text-gray-500">Arquivo carregado</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-xl p-3">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Rows3 className="w-3.5 h-3.5" />
              <span className="text-xs">Linhas</span>
            </div>
            <p className="text-lg font-bold text-gradient">{file.rows.toLocaleString('pt-BR')}</p>
          </div>
          <div className="glass rounded-xl p-3">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Columns3 className="w-3.5 h-3.5" />
              <span className="text-xs">Colunas</span>
            </div>
            <p className="text-lg font-bold text-gradient">{file.columns_count.toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <div className="glass rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Tamanho</p>
            <p className="text-sm font-semibold">{sizeLabel}</p>
          </div>
        </div>

        {file.note && (
          <div className="glass rounded-xl p-3 flex gap-3">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400 leading-relaxed">{file.note}</p>
          </div>
        )}
      </div>

      {/* Collapsible sections */}
      <div className="flex-1 overflow-y-auto scrollbar-custom px-5 pb-5 space-y-4">
        {/* Columns */}
        <div>
          <button
            onClick={() => setShowColumns(!showColumns)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors w-full mb-2"
          >
            {showColumns ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Columns3 className="w-4 h-4 text-purple-400" />
            Colunas
          </button>
          {showColumns && (
            <div className="space-y-1.5 animate-fade-in">
              {file.columns.map((col, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-lg glass hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Hash className="w-3 h-3 text-gray-600 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                    <span className="text-xs font-mono text-gray-300 truncate">{col.name}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-gray-500 font-mono flex-shrink-0 ml-2">
                    {col.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        <div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors w-full mb-2"
          >
            {showPreview ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
            Prévia dos Dados
          </button>
          {showPreview && (
            <div className="animate-fade-in overflow-x-auto scrollbar-custom">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    {previewColumns.map((col, i) => (
                      <th key={i} className="text-left py-2 px-2 font-mono text-gray-500 font-medium whitespace-nowrap">
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      {row.map((cell, j) => (
                        <td key={j} className="py-2 px-2 text-gray-400 whitespace-nowrap">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-600 mt-2 text-center">
                Mostrando {file.preview.length} de {file.rows.toLocaleString('pt-BR')} linhas
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
