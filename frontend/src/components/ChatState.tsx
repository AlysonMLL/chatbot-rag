import { useState } from 'react';
import { Menu, Plus } from 'lucide-react';
import FilePanel from '@/components/FilePanel';
import ChatInterface from '@/components/ChatInterface';
import type { UploadInfo } from '@/types';

type ChatStateProps = {
  file: UploadInfo;
  onReset: () => void;
};

export default function ChatState({ file, onReset }: ChatStateProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen min-h-screen overflow-hidden bg-[#0a0a0f] text-gray-100">
      {/* Overlay para Mobile */}
      <div 
        className={`fixed inset-0 z-30 bg-black/60 transition-opacity lg:hidden ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} 
        onClick={() => setIsSidebarOpen(false)} 
      />

      {/* Sidebar Lateral Esquerda */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[min(86vw,340px)] -translate-x-full bg-[#101017] transition-transform duration-300 lg:relative lg:z-10 lg:w-[320px] lg:translate-x-0 xl:w-[360px] ${isSidebarOpen ? 'translate-x-0' : ''}`}>
        <FilePanel file={file} onReset={onReset} onClose={() => setIsSidebarOpen(false)} />
      </aside>

      {/* Área Principal de Chat */}
      <main className="relative flex min-w-0 flex-1 flex-col bg-[#0a0a0f]">
        <div className="pointer-events-none absolute left-1/2 top-[-180px] h-[420px] w-[600px] -translate-x-1/2 rounded-full bg-purple-600/8 blur-[140px]" />
        
        <header className="relative z-10 flex h-16 flex-shrink-0 items-center justify-between px-4 md:px-8">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white lg:hidden" 
            aria-label="Abrir informações do arquivo"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="hidden min-w-0 items-center gap-3 lg:flex">
            <span className="truncate text-sm font-medium text-gray-300">{file.filename}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            <span className="text-xs text-gray-500">Pronto para conversar</span>
          </div>

          <button 
            onClick={onReset} 
            className="ml-auto flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white" 
            title="Carregar novo arquivo"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo arquivo</span>
          </button>
        </header>

        <ChatInterface fileId={file.file_id} fileName={file.filename} />
      </main>
    </div>
  );
}