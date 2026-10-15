import { Activity, Braces, Check, CircleDot, FileSpreadsheet, Network, Sparkles } from 'lucide-react';

export function SpreadsheetVisual() {
  const rows = [
    ['Maria Silva', 'Eletrônicos', 'R$ 899,70', 'Entregue'],
    ['João Costa', 'Vestuário', 'R$ 179,00', 'Pendente'],
    ['Ana Souza', 'Livros', 'R$ 124,50', 'Entregue'],
    ['Pedro Lima', 'Eletrônicos', 'R$ 1.599,00', 'Enviado'],
  ];

  return (
    <div className="feature-visual visual-spreadsheet relative min-h-97.5 overflow-hidden rounded-4xl border border-black/10 bg-[#f7f7f5] p-5 shadow-[0_28px_70px_rgba(22,25,35,0.12)]">
      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full border-18 border-[#ff695c]/80" />
      <div className="absolute -bottom-10 -left-8 h-32 w-32 rotate-12 border-14 border-[#6e8cff]/80" />
      <div className="absolute left-10 top-10 h-5 w-5 rounded-full bg-[#f6c453] shadow-[0_0_0_10px_rgba(246,196,83,0.14)]" />
      <div className="absolute bottom-16 right-12 h-4 w-4 rounded-full bg-[#49bb88]" />
      <div className="absolute left-1/2 top-3 h-20 w-px -rotate-45 bg-black/10" />

      <div className="relative z-10 mx-auto mt-12 max-w-107.5 -rotate-3 rounded-2xl border border-black/10 bg-white p-4 shadow-[0_22px_45px_rgba(20,25,40,0.16)] transition-transform duration-500 hover:rotate-0">
        <div className="mb-4 flex items-center justify-between border-b border-black/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e7f5ef]">
              <FileSpreadsheet className="h-4 w-4 text-[#269466]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#242631]">vendas_2026.xlsx</p>
              <p className="text-[10px] text-black/40">12.847 registros</p>
            </div>
          </div>
          <span className="rounded-full bg-[#f0edff] px-2 py-1 text-[10px] font-semibold text-[#7055d6]">LIVE</span>
        </div>
        <div className="overflow-hidden rounded-xl border border-black/10">
          <div className="grid grid-cols-4 bg-[#f1f2f4] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-black/45">
            <span>Cliente</span><span>Categoria</span><span>Valor</span><span>Status</span>
          </div>
          {rows.map((row) => (
            <div key={row[0]} className="grid grid-cols-4 border-t border-black/5 px-3 py-3 text-[10px] text-[#525461]">
              <span className="truncate font-medium text-[#252832]">{row[0]}</span>
              <span className="truncate">{row[1]}</span>
              <span>{row[2]}</span>
              <span className={row[3] === 'Pendente' ? 'text-[#d68d1e]' : 'text-[#299b6d]'}>{row[3]}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-[10px] text-black/40">
          <span>Última atualização agora</span>
          <span className="flex items-center gap-1 text-[#299b6d]"><CircleDot className="h-2.5 w-2.5" /> Sincronizado</span>
        </div>
      </div>
    </div>
  );
}

export function JsonNetworkVisual() {
  const nodes = [
    { className: 'left-[12%] top-[22%]', color: 'bg-[#ff695c]' },
    { className: 'left-[12%] top-[63%]', color: 'bg-[#6e8cff]' },
    { className: 'left-[46%] top-[12%]', color: 'bg-[#f6c453]' },
    { className: 'left-[46%] top-[48%]', color: 'bg-[#49bb88]' },
    { className: 'left-[46%] top-[82%]', color: 'bg-[#a179ee]' },
    { className: 'right-[12%] top-[36%]', color: 'bg-[#ff695c]' },
    { className: 'right-[12%] top-[72%]', color: 'bg-[#49bb88]' },
  ];

  return (
    <div className="feature-visual relative min-h-97.5 overflow-hidden rounded-4xl border border-black/10 bg-[#131722] p-5 shadow-[0_28px_70px_rgba(22,25,35,0.18)]">
      <div className="absolute -left-20 -top-20 h-52 w-52 rounded-full bg-[#6e8cff]/10 blur-3xl" />
      <div className="absolute -bottom-24 -right-16 h-60 w-60 rounded-full bg-[#a179ee]/10 blur-3xl" />
      <svg className="absolute inset-0 h-full w-full opacity-40" viewBox="0 0 500 390" aria-hidden="true">
        <path d="M85 100 L230 55 L415 155 M85 100 L230 205 L415 155 M85 245 L230 205 L415 280 M230 55 L230 205 L230 320" fill="none" stroke="#93a4d6" strokeWidth="1" strokeDasharray="5 7" />
      </svg>
      {nodes.map((node, index) => (
        <span key={index} className={`absolute z-10 h-4 w-4 rounded-full ${node.color} shadow-[0_0_18px_currentColor] ${node.className}`} />
      ))}
      <div className="relative z-20 mx-auto mt-12 max-w-82.5 rounded-2xl border border-white/10 bg-[#1d2230]/90 p-5 shadow-2xl backdrop-blur-md transition-transform duration-500 hover:-translate-y-2">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-white/80"><Braces className="h-4 w-4 text-[#f6c453]" /> dataset.json</div>
          <div className="flex gap-1.5"><span className="h-2 w-2 rounded-full bg-[#ff695c]" /><span className="h-2 w-2 rounded-full bg-[#f6c453]" /><span className="h-2 w-2 rounded-full bg-[#49bb88]" /></div>
        </div>
        <div className="space-y-2 font-mono text-[11px] leading-5">
          <p className="text-white/35">{'{'}</p>
          <p className="pl-4 text-[#9fd1ff]">&quot;insight&quot;: <span className="text-[#b9e2a7]">&quot;growth_detected&quot;</span>,</p>
          <p className="pl-4 text-[#9fd1ff]">&quot;confidence&quot;: <span className="text-[#f6c453]">0.94</span>,</p>
          <p className="pl-4 text-[#9fd1ff]">&quot;segments&quot;: <span className="text-[#b9e2a7]">[&quot;retail&quot;, &quot;online&quot;]</span>,</p>
          <p className="pl-4 text-[#9fd1ff]">&quot;action&quot;: <span className="text-[#b9e2a7]">&quot;explore&quot;</span></p>
          <p className="text-white/35">{'}'}</p>
        </div>
        <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-[10px] text-white/40"><Network className="h-3.5 w-3.5 text-[#a179ee]" /> Processando relações entre colunas</div>
      </div>
    </div>
  );
}

export function InsightsVisual() {
  const bars = [42, 68, 51, 84, 61, 92, 73];
  return (
    <div className="feature-visual relative min-h-97.5 overflow-hidden rounded-4xl border border-black/10 bg-[#f7f7f5] p-5 shadow-[0_28px_70px_rgba(22,25,35,0.12)]">
      <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full border-16 border-[#49bb88]/75" />
      <div className="absolute right-8 top-9 h-16 w-16 rotate-12 border-8 border-[#f6c453]/85" />
      <div className="absolute bottom-12 right-10 h-5 w-5 rounded-full bg-[#ff695c]" />
      <div className="relative z-10 mx-auto mt-12 max-w-102.5 rounded-2xl border border-black/10 bg-white p-5 shadow-[0_22px_45px_rgba(20,25,40,0.15)] transition-transform duration-500 hover:-translate-y-1.5">
        <div className="mb-7 flex items-start justify-between">
          <div><p className="text-xs font-semibold text-[#252832]">Performance de vendas</p><p className="mt-1 text-[10px] text-black/40">Resumo gerado pela IA</p></div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0edff]"><Sparkles className="h-4 w-4 text-[#7055d6]" /></div>
        </div>
        <div className="relative h-36 border-b border-l border-black/10 pl-4">
          <div className="absolute inset-x-4 bottom-0 flex h-full items-end justify-between gap-3">
            {bars.map((height, index) => <span key={index} className="w-full rounded-t-md bg-linear-to-t from-[#6e8cff] to-[#a179ee] opacity-80 transition-all duration-500 hover:opacity-100" style={{ height: `${height}%` }} />)}
          </div>
          <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 380 145" preserveAspectRatio="none" aria-hidden="true"><path d="M5 116 C60 120 75 80 120 92 S185 103 220 58 S292 75 365 22" fill="none" stroke="#ff695c" strokeWidth="3" strokeLinecap="round" /></svg>
        </div>
        <div className="mt-4 flex items-center justify-between"><div><p className="text-[10px] text-black/40">Crescimento mensal</p><p className="mt-1 text-xl font-bold text-[#252832]">+28,4%</p></div><div className="flex items-center gap-1 text-[10px] font-semibold text-[#299b6d]"><Activity className="h-3.5 w-3.5" /> acima da média</div></div>
      </div>
    </div>
  );
}

export function FeatureCheck({ children }: { children: string }) {
  return <li className="flex items-center gap-3 text-sm text-[#5a5e68]"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e5e0ff] text-[#7055d6]"><Check className="h-3 w-3" /></span>{children}</li>;
}
