import { useCallback, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, BarChart3, ChevronDown, FileJson, FileSpreadsheet, FileText, Menu, MessageSquare, Sparkles, UploadCloud, X } from 'lucide-react';
import { FeatureCheck, InsightsVisual, JsonNetworkVisual, SpreadsheetVisual } from '@/components/LandingVisuals';

type LandingStateProps = {
  onFileUploaded: (fileName: string) => void;
};

type FaqItem = {
  question: string;
  answer: string;
};

const faqItems: FaqItem[] = [
  { question: 'Quais formatos são aceitos?', answer: 'Você pode carregar arquivos CSV, XLSX, XLS e JSON. A TabulaRAG identifica automaticamente as colunas e prepara os dados para a conversa.' },
  { question: 'Meus dados ficam salvos?', answer: 'Nesta experiência, os dados são processados localmente no navegador e não são enviados para terceiros. Você pode explorar o fluxo sem criar uma conta.' },
  { question: 'Há limite de linhas?', answer: 'A demonstração foi preparada para datasets tabulares de até 50 mil linhas. Para arquivos maiores, recomendamos dividir os dados em partes.' },
  { question: 'Posso fazer perguntas em português?', answer: 'Sim. Pergunte em português, de forma natural, sobre totais, filtros, médias, tendências e relações entre as colunas.' },
  { question: 'O que acontece depois do upload?', answer: 'A TabulaRAG cria um resumo do arquivo, identifica os tipos de dados e abre um workspace para você começar a conversar com a sua tabela.' },
];

const navItems = [
  { label: 'Recursos', href: '#recursos' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Dúvidas', href: '#duvidas' },
];

export default function LandingState({ onFileUploaded }: LandingStateProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((name: string) => {
    setSelectedFile(name);
    setIsUploading(true);
    setTimeout(() => onFileUploaded(name), 1400);
  }, [onFileUploaded]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file.name);
  }, [handleFile]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file.name);
  }, [handleFile]);

  return (
    <div className="min-h-screen bg-[#ebebeb] text-[#252832]">
      <section className="relative overflow-hidden bg-[#0a0a0f] text-white">
        <div className="absolute inset-0 bg-grid opacity-70" />
        <div className="absolute -left-40 top-16 h-[520px] w-[520px] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute -right-20 bottom-[-180px] h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="absolute right-[28%] top-[22%] h-48 w-48 rotate-45 border border-cyan-400/10" />
        <div className="absolute left-[44%] top-[12%] h-16 w-16 rounded-full border border-purple-400/20" />
        <div className="absolute bottom-16 left-[8%] h-3 w-3 rounded-full bg-cyan-400/70 shadow-[0_0_20px_rgba(34,211,238,0.8)]" />

        <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-12">
          <a href="#top" className="flex items-center" aria-label="TabulaRAG início">
            <img src="/TabulaRAG_Branco.png" alt="TabulaRAG" className="h-9 w-auto object-contain md:h-11" />
          </a>
          <div className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => <a key={item.href} href={item.href} className="text-sm text-gray-400 transition-colors hover:text-white">{item.label}</a>)}
            <button onClick={() => inputRef.current?.click()} className="rounded-lg border border-white/10 bg-white/5 px-5 py-2 text-sm text-white transition-colors hover:bg-white/10">Testar agora</button>
          </div>
          <button className="rounded-lg border border-white/10 p-2 text-gray-300 md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          {isMenuOpen && <div className="absolute right-6 top-16 w-52 rounded-2xl border border-white/10 bg-[#171720]/95 p-2 shadow-2xl backdrop-blur-xl md:hidden">{navItems.map((item) => <a key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} className="block rounded-lg px-4 py-3 text-sm text-gray-300 hover:bg-white/10">{item.label}</a>)}</div>}
        </nav>

        <main id="top" className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-12 md:px-12 md:pb-28 md:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.92fr] lg:gap-20">
            <div className="animate-fade-in-up">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-purple-300"><Sparkles className="h-3.5 w-3.5" /> Assistente inteligente para dados tabulares</div>
              <h1 className="mb-6 text-4xl font-bold leading-[1.08] tracking-tight md:text-5xl lg:text-6xl">Conversar com<br /><span className="text-gradient">Dados Tabulares</span></h1>
              <p className="mb-8 max-w-lg text-lg leading-relaxed text-gray-400">Faça upload de planilhas, CSVs ou JSONs e converse com seus dados em linguagem natural. Encontre insights, gráficos e respostas sem escrever uma linha de código.</p>
              <div className="mb-10 flex flex-wrap gap-3">{[{ icon: MessageSquare, label: 'Perguntas naturais' }, { icon: BarChart3, label: 'Análises automáticas' }, { icon: Sparkles, label: 'Insights com IA' }].map((item) => <div key={item.label} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-gray-300"><item.icon className="h-4 w-4 text-purple-400" />{item.label}</div>)}</div>
              <div className="flex flex-wrap items-center gap-4"><button onClick={() => inputRef.current?.click()} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-[0_0_40px_rgba(168,85,247,0.18)] transition-opacity hover:opacity-90">Começar agora <ArrowRight className="h-4 w-4" /></button><a href="#recursos" className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-300">Conheça os recursos <ArrowDown className="h-4 w-4" /></a></div>
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <div onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} onClick={() => !isUploading && inputRef.current?.click()} className={`relative cursor-pointer rounded-2xl border bg-white/[0.04] p-8 backdrop-blur-2xl transition-all duration-300 md:p-12 ${isDragging ? 'scale-[1.02] border-purple-500/60 bg-purple-500/5 shadow-[0_0_60px_rgba(168,85,247,0.2)]' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.06]'} ${isUploading ? 'pointer-events-none' : ''}`}>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-600/10 via-transparent to-blue-600/10" />
                <div className="relative z-10 flex justify-center gap-4 pb-8"><div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] animate-pulse-glow"><FileSpreadsheet className="h-6 w-6 text-green-400" /></div><div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] animate-pulse-glow" style={{ animationDelay: '0.5s' }}><FileJson className="h-6 w-6 text-yellow-400" /></div><div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] animate-pulse-glow" style={{ animationDelay: '1s' }}><FileText className="h-6 w-6 text-blue-400" /></div></div>
                {!isUploading ? <><div className="relative z-10 mb-4 flex justify-center"><div className={`flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 ${isDragging ? 'scale-110 bg-purple-500/20' : 'bg-white/5'}`}><UploadCloud className={`h-10 w-10 ${isDragging ? 'text-purple-300' : 'text-gray-400'}`} /></div></div><h3 className="relative z-10 mb-2 text-center text-xl font-semibold">{isDragging ? 'Solte o arquivo aqui' : 'Arraste e solte seu arquivo'}</h3><p className="relative z-10 mb-6 text-center text-sm text-gray-500">ou clique para procurar no seu computador</p><div className="relative z-10 flex flex-wrap justify-center gap-2">{['CSV', 'XLSX', 'XLS', 'JSON'].map((format) => <span key={format} className="rounded-md border border-white/5 bg-white/5 px-3 py-1 font-mono text-xs text-gray-400">{format}</span>)}</div></> : <div className="relative z-10 py-6 text-center"><div className="mb-4 flex justify-center"><div className="relative h-16 w-16"><div className="absolute inset-0 rounded-full border-4 border-white/10" /><div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-purple-500" /></div></div><h3 className="mb-1 text-lg font-semibold">Processando arquivo...</h3><p className="mx-auto max-w-xs truncate text-sm text-gray-500">{selectedFile}</p><div className="mx-auto mt-4 h-1.5 max-w-xs overflow-hidden rounded-full bg-white/5"><div className="h-full w-full bg-gradient-to-r from-purple-500 to-blue-500" /></div></div>}
                <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.json" onChange={handleInputChange} className="hidden" />
              </div>
              <p className="mt-4 text-center text-xs text-gray-600">Seus dados são processados localmente. Nenhum dado é compartilhado.</p>
            </div>
          </div>
        </main>
        <div className="relative z-10 mx-auto flex max-w-7xl justify-center pb-8 text-gray-600"><ArrowDown className="h-5 w-5 animate-bounce" /></div>
      </section>

      <section id="recursos" className="bg-[#ebebeb] px-6 py-20 md:px-12 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 max-w-2xl md:mb-28"><p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#7055d6]">Uma nova forma de analisar</p><h2 className="text-3xl font-bold leading-tight tracking-tight text-[#252832] md:text-5xl">Do arquivo bruto ao insight claro.</h2><p className="mt-5 text-lg leading-relaxed text-[#6c707b]">A TabulaRAG organiza a complexidade dos seus dados para que você possa se concentrar nas decisões que realmente importam.</p></div>
          <div className="space-y-24 md:space-y-36">
            <FeatureRow eyebrow="01 / CARREGUE E EXPLORE" title="Suas planilhas, agora prontas para conversar." description="Conecte seus arquivos CSV e Excel em poucos segundos. A estrutura da tabela é reconhecida automaticamente, preservando os nomes das colunas e o contexto dos seus dados." checks={['Leitura de CSV, XLSX, XLS e JSON', 'Visualização rápida das primeiras linhas', 'Detecção automática de tipos e colunas']} visual={<SpreadsheetVisual />} />
            <FeatureRow reverse eyebrow="02 / ENTENDA O CONTEXTO" title="Processamento inteligente, sem caixa-preta." description="A inteligência da TabulaRAG conecta campos, identifica padrões e traduz a linguagem dos dados. Tudo isso em uma interface visual e fácil de acompanhar." checks={['Relações entre colunas identificadas', 'Respostas baseadas no seu próprio arquivo', 'Consultas em português e linguagem natural']} visual={<JsonNetworkVisual />} />
            <FeatureRow eyebrow="03 / DECIDA COM CONFIANÇA" title="Insights que chegam antes da próxima reunião." description="Pergunte, compare e descubra tendências em segundos. Receba resumos objetivos e visualizações que ajudam sua equipe a enxergar o próximo passo." checks={['Resumos executivos instantâneos', 'Médias, totais, filtros e tendências', 'Visualizações claras para compartilhar']} visual={<InsightsVisual />} />
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-[#ebebeb] px-6 pb-24 md:px-12 md:pb-32">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-[#252832] px-6 py-12 text-white md:px-16 md:py-16"><div className="grid gap-10 md:grid-cols-3">{[{ number: '01', title: 'Faça upload', text: 'Escolha uma planilha ou arquivo JSON para começar.' }, { number: '02', title: 'Faça perguntas', text: 'Converse com os dados usando as suas próprias palavras.' }, { number: '03', title: 'Aja com clareza', text: 'Transforme respostas em decisões mais rápidas.' }].map((step) => <div key={step.number} className="border-l border-white/15 pl-5"><p className="mb-8 font-mono text-sm text-[#a179ee]">{step.number}</p><h3 className="mb-3 text-xl font-semibold">{step.title}</h3><p className="text-sm leading-relaxed text-white/55">{step.text}</p></div>)}</div></div>
      </section>

      <section id="duvidas" className="bg-[#ebebeb] px-6 pb-24 md:px-12 md:pb-36">
        <div className="mx-auto max-w-3xl"><div className="mb-10 text-center"><p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#7055d6]">Dúvidas frequentes</p><h2 className="text-3xl font-bold tracking-tight text-[#252832] md:text-4xl">Tudo claro antes de começar.</h2></div><div className="space-y-3">{faqItems.map((item, index) => { const isOpen = openFaq === index; return <div key={item.question} className={`rounded-2xl border transition-colors ${isOpen ? 'border-[#c9bff5] bg-white/70' : 'border-black/10 bg-white/35'}`}><button onClick={() => setOpenFaq(isOpen ? null : index)} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-sm font-semibold text-[#30333c] md:px-6"><span>{item.question}</span><ChevronDown className={`h-5 w-5 flex-shrink-0 text-[#7055d6] transition-transform ${isOpen ? 'rotate-180' : ''}`} /></button>{isOpen && <p className="max-w-2xl px-5 pb-5 text-sm leading-relaxed text-[#676b76] md:px-6">{item.answer}</p>}</div>; })}</div></div>
      </section>

      <footer className="bg-[#0a0a0f] px-6 py-12 text-white md:px-12 md:py-16"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-10 md:flex-row"><div><img src="/TabulaRAG_Branco.png" alt="TabulaRAG" className="h-10 w-auto object-contain" /><p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-500">Dados complexos, conversas simples.</p></div><div className="grid grid-cols-2 gap-x-16 gap-y-8 text-sm sm:grid-cols-3"><FooterColumn title="Produto" links={['Recursos', 'Como funciona', 'Perguntas frequentes']} /><FooterColumn title="Recursos" links={['Documentação', 'Notas de versão', 'Contato']} /><FooterColumn title="Legal" links={['Privacidade', 'Termos de uso']} /></div></div><div className="mt-12 border-t border-white/10 pt-6 text-xs text-gray-600">© 2026 TabulaRAG. Feito para transformar dados em clareza.</div></div></footer>
    </div>
  );
}

function FeatureRow({ eyebrow, title, description, checks, visual, reverse = false }: { eyebrow: string; title: string; description: string; checks: string[]; visual: React.ReactNode; reverse?: boolean }) {
  return <article className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-20 ${reverse ? 'lg:flex-row-reverse' : ''}`}><div className={reverse ? 'lg:order-2' : ''}><p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#7055d6]">{eyebrow}</p><h3 className="max-w-xl text-3xl font-bold leading-tight tracking-tight text-[#252832] md:text-4xl">{title}</h3><p className="mt-5 max-w-lg text-base leading-relaxed text-[#6c707b]">{description}</p><ul className="mt-7 space-y-3">{checks.map((check) => <FeatureCheck key={check}>{check}</FeatureCheck>)}</ul></div><div className={reverse ? 'lg:order-1' : ''}>{visual}</div></article>;
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return <div><h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-white/70">{title}</h4><ul className="space-y-3">{links.map((link) => <li key={link}><a href="#" className="text-sm text-gray-500 transition-colors hover:text-white">{link}</a></li>)}</ul></div>;
}
