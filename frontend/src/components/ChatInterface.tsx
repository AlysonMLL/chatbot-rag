import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Table2, TrendingUp, Filter, Calculator } from 'lucide-react';

type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  table?: boolean;
};

const suggestedQuestions = [
  { icon: TrendingUp, text: 'Qual o total de vendas por região?' },
  { icon: Filter, text: 'Filtrar pedidos com status "Pendente"' },
  { icon: Calculator, text: 'Calcular a média de valor por pedido' },
  { icon: Table2, text: 'Mostrar os 10 maiores clientes' },
];

const mockResponses: Record<string, string> = {
  'Qual o total de vendas por região?': 'Com base nos dados analisados, aqui está o resumo de vendas por região:\n\n• **Sudeste**: R$ 487.350 (38%) — Maior volume de vendas\n• **Sul**: R$ 298.120 (23%)\n• **Nordeste**: R$ 256.890 (20%)\n• **Norte**: R$ 142.680 (11%)\n• **Centro-Oeste**: R$ 98.540 (8%)\n\nO total geral é **R$ 1.283.580**, com o Sudeste representando 38% das vendas, liderando significativamente.',
  'Filtrar pedidos com status "Pendente"': 'Encontrei **1.247 pedidos** com status "Pendente" no dataset. Isso representa aproximadamente 9.7% do total de 12.847 registros.\n\n**Distribuição por região:**\n• Sudeste: 512 pedidos\n• Sul: 298 pedidos\n• Nordeste: 215 pedidos\n• Norte: 142 pedidos\n• Centro-Oeste: 80 pedidos\n\nDeseja que eu gere uma tabela detalhada com esses pedidos?',
  'Calcular a média de valor por pedido': 'A média de valor por pedido é **R$ 99.92**, calculada sobre o total de R$ 1.283.580 dividido por 12.847 pedidos.\n\n**Estatísticas adicionais:**\n• Mediana: R$ 78.50\n• Desvio padrão: R$ 156.30\n• Menor pedido: R$ 12.90\n• Maior pedido: R$ 4.890.00\n\nA distribuição é assimétrica à direita, indicando que a maioria dos pedidos concentra-se em valores baixos.',
  'Mostrar os 10 maiores clientes': 'Aqui estão os 10 clientes com maior volume de compras:\n\n| # | Cliente | Total (R$) | Pedidos |\n|---|---------|-----------|---------|\n| 1 | Maria Silva | 48.250 | 52 |\n| 2 | Pedro Lima | 41.890 | 38 |\n| 3 | Ana Souza | 37.640 | 41 |\n| 4 | João Costa | 33.120 | 35 |\n| 5 | Carla Dias | 28.560 | 29 |\n| 6 | Bruno Alves | 26.340 | 27 |\n| 7 | Fernanda Rocha | 24.780 | 24 |\n| 8 | Lucas Martins | 22.450 | 23 |\n| 9 | Patricia Gomes | 19.890 | 20 |\n| 10 | Rafael Teixeira | 18.230 | 19 |\n\nEsses 10 clientes representam **R$ 301.250** (23.5%) do faturamento total.',
};

function getMockResponse(question: string): string {
  if (mockResponses[question]) return mockResponses[question];
  return `Analisei sua pergunta sobre "${question}". Com base nos dados do arquivo carregado, encontrei informações relevantes que podem responder à sua consulta. Os dados tabulares contêm 12.847 registros distribuídos em 10 colunas, cobrindo categorias como vendas, clientes, pedidos e regiões. \n\nPara uma resposta mais específica, tente uma das perguntas sugeridas abaixo.`;
}

export default function ChatInterface({ fileName }: { fileName: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      content: `Arquivo **${fileName}** carregado com sucesso! Encontrei 12.847 linhas e 10 colunas. Você pode me perguntar qualquer coisa sobre esses dados — totais, filtros, médias, tendências e muito mais.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    const userMsg: Message = { id: nextId.current++, role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response: Message = {
        id: nextId.current++,
        role: 'assistant',
        content: getMockResponse(text),
      };
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 1400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
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
            Analisando {fileName}
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
              placeholder="Pergunte algo sobre seus dados..."
              className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 rounded-xl px-5 py-3.5 text-sm text-white placeholder-gray-500 outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
        <p className="text-xs text-gray-600 mt-2 text-center">
          TabulaRAG pode cometer erros. Verifique dados críticos.
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
        if (line.startsWith('|')) return <div key={i} className="font-mono text-xs text-gray-300 overflow-x-auto scrollbar-custom whitespace-pre">{line}</div>;
        const boldMatch = line.match(/\*\*(.+?)\*\*/);
        if (boldMatch) {
          const parts = line.split(/\*\*(.+?)\*\*/);
          return (
            <p key={i}>
              {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="font-semibold text-white">{part}</strong> : part)}
            </p>
          );
        }
        if (line.startsWith('• ')) return <p key={i} className="text-gray-300 pl-1">{line}</p>;
        return <p key={i} className="text-gray-300">{line}</p>;
      })}
    </div>
  );
}
