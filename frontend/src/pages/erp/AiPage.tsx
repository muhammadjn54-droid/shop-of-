import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bot,
  Send,
  Sparkles,
  User,
  RefreshCw,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  PackageCheck,
  ShoppingBag,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Trash2,
} from 'lucide-react';
import { aiApi } from '../../api/erp';
import type { AiChatResponse, AiInsights, AiInsightItem, AiRecommendationItem } from '../../types/erp';
import { formatDateTime, formatMoney, formatNumber } from '../../utils/formatters';
import {
  PageHeader,
  Card,
  SectionTitle,
  StatCard,
  Empty,
  Spinner,
  btnPrimary,
  btnSecondary,
  inputCls,
} from '../../components/erp/ErpUI';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  note?: string;
  mode?: string;
  time?: string;
}

const suggestions = [
  'Кадом молҳоро харидан лозим?',
  'Фурӯши имрӯз чӣ қадар аст?',
  'Молҳои серфурӯш кадоманд?',
  'Ҳолати қарзҳо чӣ гуна аст?',
  'Фоидаи 30 рӯзи охир чӣ қадар аст?',
  'Маслиҳат барои зиёд кардани фурӯш',
];

export const AiPage = () => {
  const [insights, setInsights] = useState<AiInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await aiApi.insights();
      setInsights(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Хатогӣ ҳангоми боргирии маълумоти AI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || thinking) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { role: 'user', content: message, time }]);
    setInput('');
    setThinking(true);

    try {
      const res: AiChatResponse = await aiApi.chat(
        message,
        messages.slice(-8).map((m) => ({ role: m.role, content: m.content }))
      );
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          note: res.note,
          mode: res.mode,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Хатогии AI');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Мутаассифона, ҷавоб гирифтан имконнопазир шуд. Пайвасти серверро санҷед.',
          mode: 'error',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  // Helper to extract numeric stats safely
  const stats = insights?.stats;
  const metrics = insights?.metrics;
  const revenueToday = stats?.revenueToday ?? metrics?.today?.revenue ?? 0;
  const revenue30 = stats?.revenue30 ?? metrics?.last30Days?.revenue ?? 0;
  const profit30 = stats?.profit30 ?? metrics?.last30Days?.netProfit ?? metrics?.last30Days?.grossProfit ?? 0;
  const debtTotal = stats?.outstandingDebt ?? metrics?.debts?.outstanding ?? 0;
  const lowStockCount = stats?.lowStockCount ?? metrics?.products?.lowStock?.length ?? 0;
  const stockVal = stats?.stockValue ?? metrics?.products?.stockValue ?? 0;

  return (
    <div className="flex-1 flex flex-col space-y-3">
      <PageHeader
        icon={Bot}
        title="AI ёрдамчӣ"
        subtitle="Таҳлили ҳушманди фурӯш, фоида, қарзҳо ва молҳои каммонда дар мағоза"
        onRefresh={load}
      >
        <button
          type="button"
          className={btnSecondary}
          onClick={() => setMessages([])}
          disabled={!messages.length}
          title="Тоза кардани чат"
        >
          <Trash2 className="w-3.5 h-3.5" /> Тоза кардан
        </button>
      </PageHeader>

      {/* Top summary stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <StatCard
          label="Фурӯши имрӯз"
          value={formatMoney(revenueToday)}
          tone="green"
        />
        <StatCard
          label="Фурӯши 30 рӯз"
          value={formatMoney(revenue30)}
          tone="blue"
        />
        <StatCard
          label="Фоидаи 30 рӯз"
          value={formatMoney(profit30)}
          tone="green"
        />
        <StatCard
          label="Қарзҳои муштариён"
          value={formatMoney(debtTotal)}
          tone={debtTotal > 0 ? 'rose' : 'slate'}
        />
        <StatCard
          label="Молҳои каммонда"
          value={`${formatNumber(lowStockCount)} намуд`}
          tone={lowStockCount > 0 ? 'amber' : 'slate'}
        />
        <StatCard
          label="Арзиши мол дар анбор"
          value={formatMoney(stockVal)}
          tone="slate"
        />
      </div>

      {loading ? (
        <Card><Spinner label="Таҳлили маълумотҳои мағоза..." /></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
          {/* Main Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="flex flex-col h-[600px] overflow-hidden">
              <SectionTitle
                title="Муколама бо AI ёрдамчӣ"
                subtitle={insights ? `Маълумот аз: ${formatDateTime(insights.generatedAt)}` : undefined}
                action={
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Фаъол (Online)
                  </div>
                }
              />

              {/* Chat Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#fbfcfd] dark:bg-slate-950/40">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#107c41]/10 text-[#107c41] flex items-center justify-center shadow-xs mb-3 ring-8 ring-[#107c41]/5">
                      <Bot className="w-7 h-7" />
                    </div>
                    <h3 className="text-sm font-bold text-[#1e293b] dark:text-slate-100">
                      Салом! Ман AI ёрдамчии мағозаи шумо ҳастам
                    </h3>
                    <p className="text-xs text-[#64748b] dark:text-slate-400 max-w-md mt-1.5 mb-5 leading-relaxed">
                      Ман метавонам дар таҳлили фурӯши имрӯз, фоида, қарздорон ва молҳое, ки дар анбор кам мондаанд, кӯмак кунам.
                    </p>

                    {/* Quick suggestion buttons */}
                    <div className="w-full max-w-lg">
                      <p className="text-[11px] font-semibold text-[#94a3b8] dark:text-slate-500 uppercase tracking-wider mb-2.5">
                        Саволҳои омода:
                      </p>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            className="px-3 py-1.5 rounded-full border border-[#cbd5e1] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-[#475569] dark:text-slate-200 hover:border-[#107c41] hover:text-[#107c41] dark:hover:border-emerald-500 dark:hover:text-emerald-400 shadow-2xs transition-all cursor-pointer hover:scale-[1.02]"
                            onClick={() => send(s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-2.5 items-end ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-[#107c41] text-white flex items-center justify-center shrink-0 shadow-2xs mb-1">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs whitespace-pre-wrap ${
                        message.role === 'user'
                          ? 'bg-[#107c41] text-white rounded-br-xs'
                          : 'bg-white dark:bg-slate-850 border border-[#e2e8f0] dark:border-slate-700/80 text-[#1e293b] dark:text-slate-200 rounded-bl-xs'
                      }`}
                    >
                      <div>{message.content}</div>

                      <div className="flex items-center justify-between gap-3 mt-1.5 pt-1 border-t border-black/5 dark:border-white/5 text-[10px] opacity-75">
                        <span>{message.time || ''}</span>
                        {message.mode === 'local' && (
                          <span className="text-[9px]">Аналитикаи маҳаллӣ</span>
                        )}
                      </div>

                      {message.note && (
                        <div className="mt-1 text-[9px] text-[#94a3b8] dark:text-slate-400 border-t border-dashed border-[#e2e8f0] dark:border-slate-700 pt-1">
                          {message.note}
                        </div>
                      )}
                    </div>

                    {message.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-[#475569] dark:text-slate-200 flex items-center justify-center shrink-0 mb-1">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                {thinking && (
                  <div className="flex gap-2.5 justify-start items-center">
                    <div className="w-7 h-7 rounded-full bg-[#107c41] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white dark:bg-slate-850 border border-[#e2e8f0] dark:border-slate-700/80 rounded-2xl rounded-bl-xs px-3.5 py-2 text-xs text-[#64748b] dark:text-slate-300 flex items-center gap-2 shadow-2xs">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#107c41]" />
                      <span>AI дар ҳоли таҳлил ва фикрронӣ...</span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="p-3 border-t border-[#e2e8f0] dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
              >
                <input
                  className={inputCls}
                  placeholder="Саволи худро нависед... (масалан: фурӯши имрӯз чӣ қадар аст?)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={thinking}
                />
                <button
                  type="submit"
                  className={btnPrimary}
                  disabled={!input.trim() || thinking}
                  title="Фиристодан"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Фиристодан</span>
                </button>
              </form>
            </Card>
          </div>

          {/* Right Column: Insights & Recommendations */}
          <div className="space-y-3">
            {/* Automated Business Insights */}
            <Card>
              <SectionTitle
                title="Мушоҳидаҳо ва инсайтҳо"
                subtitle="Хулосаи автоматии система"
                action={<Sparkles className="w-4 h-4 text-amber-500" />}
              />
              <div className="p-3 space-y-2.5 max-h-[290px] overflow-y-auto">
                {!insights?.insights?.length ? (
                  <Empty>То ҳол мушоҳидае ёфт нашуд.</Empty>
                ) : (
                  insights.insights.map((item, index) => {
                    const isObj = typeof item === 'object' && item !== null;
                    const title = isObj ? (item as AiInsightItem).title : undefined;
                    const msg = isObj ? (item as AiInsightItem).message : String(item);
                    const action = isObj ? (item as AiInsightItem).action : undefined;
                    const sev = isObj ? (item as AiInsightItem).severity : 'info';

                    const iconColor =
                      sev === 'critical'
                        ? 'text-rose-500'
                        : sev === 'warning'
                        ? 'text-amber-500'
                        : sev === 'success'
                        ? 'text-emerald-500'
                        : 'text-blue-500';

                    return (
                      <div
                        key={index}
                        className="p-2.5 rounded-md border border-[#e2e8f0] dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-950/30 text-[11px] leading-snug space-y-1"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-[#1e293b] dark:text-slate-100">
                          <Lightbulb className={`w-3.5 h-3.5 ${iconColor} shrink-0`} />
                          <span>{title || 'Таҳлили муҳим'}</span>
                        </div>
                        <p className="text-[#475569] dark:text-slate-300 pl-5">{msg}</p>
                        {action && (
                          <div className="pl-5 pt-1">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-[#107c41]/10 text-[#107c41] dark:text-emerald-400">
                              Маслиҳат: {action}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            {/* Smart Purchase Recommendations */}
            <Card>
              <SectionTitle
                title="Тавсияҳо барои харид"
                subtitle="Молҳое, ки кам мондаанд"
                action={<PackageCheck className="w-4 h-4 text-[#107c41]" />}
              />
              <div className="p-3 space-y-2 max-h-[290px] overflow-y-auto">
                {!insights?.recommendations?.length ? (
                  <Empty>Ҳамаи молҳо дар анбор кофӣ ҳастанд.</Empty>
                ) : (
                  insights.recommendations.map((rec, index) => {
                    const isObj = typeof rec === 'object' && rec !== null;
                    const name = isObj ? (rec as AiRecommendationItem).name : String(rec);
                    const qty = isObj ? (rec as AiRecommendationItem).recommendedQuantity : undefined;
                    const cost = isObj ? (rec as AiRecommendationItem).estimatedCost : undefined;
                    const reason = isObj ? (rec as AiRecommendationItem).reason : undefined;

                    return (
                      <div
                        key={index}
                        className="p-2.5 rounded-md border border-[#e2e8f0] dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-2 shadow-2xs"
                      >
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#107c41]/10 text-[#107c41] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-[#1e293b] dark:text-slate-100">{name}</p>
                            {reason && (
                              <p className="text-[10px] text-[#64748b] dark:text-slate-400">{reason}</p>
                            )}
                          </div>
                        </div>

                        {qty !== undefined && (
                          <div className="text-right shrink-0">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                              +{qty} дона
                            </span>
                            {cost !== undefined && cost > 0 && (
                              <p className="text-[10px] text-[#64748b] dark:text-slate-400 mt-0.5">
                                ~{formatMoney(cost)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiPage;
