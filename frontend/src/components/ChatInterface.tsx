/* O que há aqui:
- Componente de UI para o Chat com a IA.
- Gerenciamento de estado das mensagens (user e assistant) e status de digitação.
- Integração real via `fetch` POST com o endpoint FastAPI (`/api/chat`).
- Renderização formatada das respostas (Markdown-like) para tabelas e negrito.

Função do arquivo: Interface de Interação Analítica.
É o componente central da experiência do usuário, onde a linguagem natural é transformada
em consultas de dados. 
*/


import { useEffect, useRef, useState } from 'react';
import { ChevronDown, FilePlus2, FileText, Search, AlertCircle, BarChart2, Mic, Paperclip, Plus, Send, Sparkles, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { API_URL } from '@/config';

type Message = { id: number; role: 'user' | 'assistant'; content: string };
type ChatInterfaceProps = { fileId: string; fileName: string };
type ModelOption = { name: string; provider: string };

const modelOptions: ModelOption[] = [
  { name: 'gemini-3.5-flash', provider: 'Google' },
  { name: 'gemini-3.5-flash-lite', provider: 'Google' },
];

const suggestedQuestions = [
  { icon: FileText, text: 'Faça um resumo geral sobre os dados deste arquivo.' },
  { icon: Search, text: 'Quais são as colunas principais e seus tipos?' },
  { icon: AlertCircle, text: 'Identifique se existem valores nulos ou anomalias.' },
  { icon: BarChart2, text: 'Quais tendências ou padrões você consegue notar?' },
];

export default function ChatInterface({ fileId, fileName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([{ 
    id: 0, 
    role: 'assistant', 
    content: `Arquivo **${fileName}** carregado com sucesso! A IA já tem acesso ao seu conteúdo completo na memória. Você pode me perguntar qualquer coisa sobre esses dados — totais, filtros, médias, tendências e muito mais.` 
  }]);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState(modelOptions[0]);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nextId = useRef(1);

  // Auto-scroll
  useEffect(() => { 
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Função REAL de requisição à API
  const sendMessage = async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText || isTyping) return;
    
    const userMsg: Message = { id: nextId.current++, role: 'user', content: cleanText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    
    // Reseta a altura do textarea
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: fileId,
          question: cleanText,
          history: messages.slice(1).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.detail ?? 'A IA está sobrecarregada, tente de novo.');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { id: nextId.current++, role: 'assistant', content: data.answer }]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
      setMessages((prev) => [...prev, { id: nextId.current++, role: 'assistant', content: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (event?: React.FormEvent) => { 
    if (event) event.preventDefault(); 
    sendMessage(input); 
  };

  // Auto-resize do textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative z-10 flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-custom px-4 py-8 md:px-8 lg:px-12">
        <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-end gap-7">
          {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
          {isTyping && <TypingIndicator />}
          
          {messages.length === 1 && !isTyping && (
            <div className="animate-fade-in-up pb-4">
              <p className="mb-3 px-1 text-xs text-gray-500">Experimente perguntar:</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {suggestedQuestions.map((question) => (
                  <button 
                    key={question.text} 
                    onClick={() => sendMessage(question.text)} 
                    className="flex items-center gap-3 rounded-xl border border-white/10 glass p-3 text-left transition-colors hover:border-purple-500/30 hover:bg-white/10"
                  >
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/5">
                      <question.icon className="h-4 w-4 text-gray-400" />
                    </span>
                    <span className="text-sm text-gray-300">{question.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-full flex-shrink-0 px-4 pb-4 pt-2 md:px-8 md:pb-6">
        <div className="mx-auto max-w-4xl">
          <form onSubmit={handleSubmit} className="relative rounded-2xl border border-white/10 bg-[#1b1b22] shadow-2xl transition-colors focus-within:border-purple-500/50">
            <textarea 
              ref={textareaRef}
              value={input} 
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              rows={1}
              placeholder={isTyping ? "Aguarde a IA responder..." : "Pergunte algo sobre seus dados (ex: 'Me mostre a soma de...')..."} 
              className="w-full resize-none bg-transparent px-5 pb-16 pt-5 text-sm text-white outline-none placeholder:text-gray-500 scrollbar-custom disabled:opacity-50" 
              style={{ maxHeight: '200px' }}
            />
            
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                {/* Menu Anexos (Em Breve) */}
                <div className="relative">
                  <button type="button" onClick={() => { setIsAttachMenuOpen(!isAttachMenuOpen); setIsModelMenuOpen(false); }} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/10 hover:text-white" aria-label="Adicionar arquivo">
                    <Plus className="h-5 w-5" />
                  </button>
                  {isAttachMenuOpen && (
                    <div className="absolute bottom-12 left-0 z-30 w-56 rounded-xl border border-white/10 bg-[#202027] p-1.5 shadow-2xl animate-fade-in-up">
                      <button disabled type="button" className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-gray-400 opacity-60 cursor-not-allowed">
                        <span className="flex items-center gap-2"><Paperclip className="h-3.5 w-3.5" /> Anexar arquivo</span>
                        <span className="text-[9px] uppercase tracking-wider text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">Em breve</span>
                      </button>
                      <button disabled type="button" className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-gray-400 opacity-60 cursor-not-allowed mt-1">
                        <span className="flex items-center gap-2"><FilePlus2 className="h-3.5 w-3.5" /> Adicionar contexto</span>
                        <span className="text-[9px] uppercase tracking-wider text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">Em breve</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Menu Modelos */}
                <div className="relative">
                  <button type="button" onClick={() => { setIsModelMenuOpen(!isModelMenuOpen); setIsAttachMenuOpen(false); }} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-gray-400 transition-colors hover:bg-white/10 hover:text-white">
                    <span className="max-w-[145px] truncate">{selectedModel.name}</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isModelMenuOpen && (
                    <div className="absolute bottom-12 left-0 z-30 w-64 rounded-xl border border-white/10 bg-[#202027] p-1.5 shadow-2xl animate-fade-in-up">
                      <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">Modelo de IA</p>
                      {modelOptions.map((model) => (
                        <button type="button" key={model.name} onClick={() => { setSelectedModel(model); setIsModelMenuOpen(false); }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs transition-colors hover:bg-white/10 ${selectedModel.name === model.name ? 'bg-purple-500/10 text-purple-300 font-medium' : 'text-gray-300'}`}>
                          <span>{model.name}</span>
                          <span className="text-[10px] text-gray-600">{model.provider}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Controles da Direita */}
              <div className="flex items-center gap-2">
                <button disabled type="button" className="hidden h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/10 hover:text-white sm:flex opacity-50 cursor-not-allowed" title="Em breve" aria-label="Usar microfone">
                  <Mic className="h-4 w-4" />
                </button>
                <button type="submit" onClick={() => handleSubmit()} disabled={!input.trim() || isTyping} className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Enviar mensagem">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </form>
          <p className="mt-3 text-center text-xs text-gray-600">TabulaRAG pode cometer erros. Verifique os cálculos críticos em seu dataset original.</p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-4 animate-fade-in-up ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg mt-1 ${isUser ? 'bg-white/10' : 'bg-gradient-to-br from-purple-500 to-blue-600'}`}>
        {isUser ? <User className="h-4 w-4 text-gray-300" /> : <Sparkles className="h-4 w-4 text-white" />}
      </div>
      <div className={`max-w-[85%] text-sm leading-relaxed overflow-x-hidden ${isUser ? 'rounded-2xl rounded-tr-sm bg-white/10 px-5 py-3' : 'pt-1.5'}`}>
        <FormattedContent content={message.content} />
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-4 animate-fade-in">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg mt-1 bg-gradient-to-br from-purple-500 to-blue-600">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="flex items-center gap-1.5 pt-3">
        <span className="typing-dot h-2 w-2 rounded-full bg-purple-400" />
        <span className="typing-dot h-2 w-2 rounded-full bg-blue-400" style={{ animationDelay: '0.2s' }} />
        <span className="typing-dot h-2 w-2 rounded-full bg-cyan-400" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );
}

function FormattedContent({ content }: { content: string }) {
  return (
    <div className="space-y-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        table: ({node, ...props}) => (
          <div className="overflow-x-auto scrollbar-custom my-4 rounded-lg border border-white/10 bg-black/20">
            <table className="min-w-full divide-y divide-white/10 text-xs" {...props} />
          </div>
        ),
        thead: ({node, ...props}) => <thead className="bg-white/5" {...props} />,
        th: ({node, ...props}) => <th className="px-4 py-3 text-left font-medium text-gray-300 uppercase tracking-wider" {...props} />,
        td: ({node, ...props}) => <td className="px-4 py-3 whitespace-nowrap text-gray-400 border-b border-white/5" {...props} />,
        p: ({node, ...props}) => <p className="text-gray-300 leading-relaxed" {...props} />,
        a: ({node, ...props}) => <a className="text-purple-400 hover:text-purple-300 hover:underline transition-colors" {...props} />,
        strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
        ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 text-gray-300 marker:text-gray-500" {...props} />,
        ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-2 text-gray-300 marker:text-gray-500" {...props} />,
        code: ({node, className, children, ...props}: any) => {
          const isInline = !String(children).includes('\n');
          return isInline ? (
            <code className="bg-white/10 text-purple-300 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>
          ) : (
            <div className="bg-black/30 rounded-lg p-4 overflow-x-auto border border-white/10 my-4">
              <code className="text-sm font-mono text-gray-300" {...props}>{children}</code>
            </div>
          );
        }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}