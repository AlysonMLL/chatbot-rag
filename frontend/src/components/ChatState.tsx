import { Table2, Plus } from 'lucide-react';
import FilePanel from './FilePanel';
import ChatInterface from './ChatInterface';

type ChatStateProps = {
  fileName: string;
  onReset: () => void;
};

export default function ChatState({ fileName, onReset }: ChatStateProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] bg-grid relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-[-5%] left-[10%] w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[140px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Table2 className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">TabulaRAG</span>
          <span className="ml-2 px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
            Online
          </span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-lg glass hover:bg-white/10 transition-colors text-sm text-gray-300"
        >
          <Plus className="w-4 h-4" />
          Novo Arquivo
        </button>
      </nav>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pb-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <FilePanel fileName={fileName} />
          <ChatInterface fileName={fileName} />
        </div>
      </div>
    </div>
  );
}
