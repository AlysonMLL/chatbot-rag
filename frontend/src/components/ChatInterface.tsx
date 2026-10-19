/* O que há aqui:
- Componente de UI para o Chat com a IA.
- Gerenciamento de estado das mensagens (user e assistant) e status de digitação.
- Integração real via `fetch` POST com o endpoint FastAPI (`/api/chat`).
- Renderização formatada das respostas (Markdown-like) para tabelas e negrito.

Função do arquivo: Interface de Interação Analítica.
É o componente central da experiência do usuário, onde a linguagem natural é transformada
em consultas de dados. Ele se comunica de forma assíncrona com o backend, lidando com 
tempos de resposta dinâmicos do LLM (LangChain) e apresentando os insights retornados.
*/

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Table2, TrendingUp, Filter, Calculator } from 'lucide-react';

type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
};

const suggestedQuestions = [
  { icon: TrendingUp, text: 'Qual o total de vendas por região?' },
  { icon: Filter, text: 'Filtrar pedidos com status "Pendente"' },
  { icon: Calculator, text: 'Calcular a média de valor por pedido' },
  { icon: Table2, text: 'Mostrar os 10 maiores clientes' },
];

export default function ChatInterface({ fileName }: { fileName: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      content: `Arquivo **${fileName}** carregado e indexado com sucesso! A IA já tem acesso ao seu conteúdo completo na memória. Você pode me perguntar qualquer coisa sobre esses dados — totais, filtros, médias, tendências e muito mais.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Função REAL de envio para a API
  const sendMessage = async (text: string) => {
    const userMsg: Message = { id: nextId.current++, role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: fileName,
          question: text,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.detail ?? 'A IA está sobrecarregada, tente de novo.');
      }

      const data = await response.json();
      
      const assistantMsg: Message = {
        id: nextId.current++,
        role: 'assistant',
        content: data.answer, // a resposta da IA
      };
      
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: nextId.current++,
        role: 'assistant',
        content:
          error instanceof TypeError
            ? 'Não consegui conectar ao servidor. Ele está rodando?'
            : error instanceof Error
              ? error.message
              : 'Ocorreu um erro inesperado.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    sendMessage(input.trim());
  };

  return (
    <div className="flex-1 flex flex-col glass rounded-2xl overflow-hidden min-h-[calc(100vh-7rem)] max-h-[calc(100vh-7rem)]">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">TabulaRAG Assistant</h3>
          <p className="text-xs text-green-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Analisando {fileName} via LangChain
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-custom px-4 md:px-8 py-6 space-y-6">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isTyping && (
          <div className="flex gap-3 animate-fade-in">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400 typing-dot" style={{ animationDelay: '0s' }} />
              <span className="w-2 h-2 rounded-full bg-blue-400 typing-dot" style={{ animationDelay: '0.2s' }} />
              <span className="w-2 h-2 rounded-full bg-cyan-400 typing-dot" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}

        {/* Suggested questions (only when few messages) */}
        {messages.length <= 1 && !isTyping && (
          <div className="animate-fade-in-up pt-4">
            <p className="text-xs text-gray-500 mb-3 px-1">Perguntas sugeridas:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q.text)}
                  className="flex items-center gap-3 p-3 rounded-xl glass hover:bg-white/10 hover:border-purple-500/30 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                    <q.icon className="w-4 h-4 text-gray-400 group-hover:text-purple-300 transition-colors" />
                  </div>
                  <span className="text-sm text-gray-300">{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              placeholder={isTyping ? "Aguarde a IA responder..." : "Pergunte algo sobre seus dados (ex: 'Me mostre a soma de...')..."}
              className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 rounded-xl px-5 py-3.5 text-sm text-white placeholder-gray-500 outline-none transition-colors disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
        <p className="text-xs text-gray-600 mt-2 text-center">
          TabulaRAG usa IA e pode cometer erros. Verifique os cálculos críticos.
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 animate-fade-in-up ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        isUser
          ? 'bg-white/10'
          : 'bg-gradient-to-br from-purple-500 to-blue-600'
      }`}>
        {isUser ? <User className="w-4 h-4 text-gray-300" /> : <Sparkles className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-white/10 rounded-2xl rounded-tr-sm'
          : 'glass rounded-2xl rounded-tl-sm'
      }`}>
        <FormattedContent content={message.content} />
      </div>
    </div>
  );
}

function FormattedContent({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.trim() === '') return <div key={i} className="h-1" />;
        // Detecção de tabelas Markdown
        if (line.startsWith('|')) return <div key={i} className="font-mono text-xs text-gray-300 overflow-x-auto scrollbar-custom whitespace-pre bg-black/20 p-2 rounded-md my-2">{line}</div>;
        
        // Renderização simples de negrito
        const boldMatch = line.match(/\*\*(.+?)\*\*/);
        if (boldMatch) {
          const parts = line.split(/\*\*(.+?)\*\*/);
          return (
            <p key={i}>
              {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="font-semibold text-white">{part}</strong> : part)}
            </p>
          );
        }
        
        // Renderização de listas (bullets)
        if (line.trim().startsWith('-') || line.trim().startsWith('* ') || line.trim().match(/^\d+\./)) {
           return <p key={i} className="text-gray-300 pl-4">{line}</p>;
        }
        
        return <p key={i} className="text-gray-300">{line}</p>;
      })}
    </div>
  );
}