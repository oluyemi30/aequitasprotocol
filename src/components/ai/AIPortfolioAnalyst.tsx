import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  ShieldAlert, 
  AlertTriangle, 
  Info, 
  Bot, 
  User, 
  TrendingDown, 
  TrendingUp, 
  RefreshCw, 
  CheckCircle2,
  HelpCircle,
  BrainCircuit
} from 'lucide-react';
import { PortfolioSummary, AIAnalysisResult, AIChatMessage, RiskSignal } from '../../types';
import { generateDeterministicAIAnalysis } from '../../lib/portfolio';

interface AIPortfolioAnalystProps {
  portfolio: PortfolioSummary | null;
}

export const AIPortfolioAnalyst: React.FC<AIPortfolioAnalystProps> = ({ portfolio }) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);

  // Fetch or calculate AI analysis on portfolio changes
  useEffect(() => {
    if (!portfolio || portfolio.holdings.length === 0) {
      setAnalysis(null);
      return;
    }

    let isMounted = true;
    async function loadAnalysis() {
      setIsLoadingAnalysis(true);
      try {
        const response = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ portfolioSummary: portfolio }),
        });

        if (response.ok) {
          const data = await response.json();
          if (isMounted && data && !data.fallback) {
            setAnalysis({
              executiveSummary: data.executiveSummary,
              riskSignals: data.riskSignals || [],
              insights: data.insights || [],
              suggestedQuestions: data.suggestedQuestions || [],
              sectorDistribution: data.sectorDistribution || [],
              isAIPowered: true,
            });
            setIsLoadingAnalysis(false);
            return;
          }
        }
      } catch (err) {
        console.warn('API analysis call failed, using deterministic engine:', err);
      }

      // Fallback deterministic analysis
      if (isMounted) {
        const deterministic = generateDeterministicAIAnalysis(portfolio);
        setAnalysis(deterministic);
        setIsLoadingAnalysis(false);
      }
    }

    loadAnalysis();
    return () => {
      isMounted = false;
    };
  }, [portfolio]);

  // Handle user question in "Ask StockLens"
  const handleAskQuestion = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || isAsking || !portfolio) return;

    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsAsking(true);

    try {
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, portfolioSummary: portfolio }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.answer && !data.fallback) {
          const assistantMsg: AIChatMessage = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: data.answer,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setIsAsking(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Ask AI endpoint error, using calculation fallback:', err);
    }

    // Deterministic mathematical copilot answer fallback
    let fallbackAnswer = '';
    const qLower = q.toLowerCase();

    // Check for specific asset drop simulation query (e.g. "What happens if NVDA falls 10%?")
    const matchingHolding = portfolio.holdings.find(h => 
      qLower.includes(h.token.symbol.toLowerCase()) || qLower.includes(h.token.name.toLowerCase())
    );

    const percentMatch = q.match(/(\d+)%/);
    const dropPercent = percentMatch ? parseFloat(percentMatch[1]) : 10;

    if (matchingHolding) {
      const assetDelta = (matchingHolding.value ?? 0) * (dropPercent / 100);
      const portfolioDeltaPercent = (portfolio?.totalValue ?? 0) > 0 ? (assetDelta / portfolio.totalValue) * 100 : 0;
      const isFall = qLower.includes('fall') || qLower.includes('drop') || qLower.includes('decrease') || qLower.includes('crash');
      
      fallbackAnswer = `If ${matchingHolding.token.symbol} ${isFall ? 'falls' : 'moves'} ${dropPercent}%, your portfolio would ${isFall ? 'decrease' : 'change'} by approximately $${assetDelta.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${portfolioDeltaPercent.toFixed(2)}%), assuming all other assets on Robinhood Chain remain unchanged.\n\nPosition Details:\n• Holding: ${matchingHolding.balanceFormatted} ${matchingHolding.token.symbol}\n• Current Position Value: $${(matchingHolding.value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}\n• Portfolio Weight: ${matchingHolding.allocationPercentage ?? 0}%\n\nAequitas Protocol AI provides informational analysis and simulations only. It is not financial advice.`;
    } else if (qLower.includes('risk') || qLower.includes('concentrat')) {
      const top = portfolio?.topHolding;
      fallbackAnswer = `Your primary concentration risk is in ${top?.token?.symbol || 'your top asset'} (${top?.allocationPercentage ?? 0}% allocation) and the Technology sector. A localized drawdown in high-beta tech equities will drive the majority of portfolio volatility.\n\nAequitas Protocol AI provides informational analysis and simulations only. It is not financial advice.`;
    } else {
      const topSymbol = portfolio?.topHolding?.token?.symbol || 'N/A';
      const topVal = portfolio?.topHolding?.value ?? 0;
      const totalVal = portfolio?.totalValue ?? 0;
      fallbackAnswer = `Based on your current Robinhood Chain portfolio ($${totalVal.toLocaleString()} across ${portfolio?.assetCount ?? 0} assets), your largest exposure is ${topSymbol} ($${topVal.toLocaleString()}). Onchain token settlement enables immediate liquidity and transparent custody verification at all times.\n\nAequitas Protocol AI provides informational analysis and simulations only. It is not financial advice.`;
    }

    const assistantMsg: AIChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: fallbackAnswer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsAsking(false);
  };

  const getSignalBadgeColor = (level: RiskSignal['level']) => {
    switch (level) {
      case 'HIGH':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'LOW':
        return 'bg-[#ADF802]/10 text-[#ADF802] border-[#ADF802]/30';
    }
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-white/10 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ADF802] to-[#5E5CE6] flex items-center justify-center text-black shadow-md">
            <BrainCircuit className="w-4 h-4 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Aequitas AI</h2>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider bg-[#ADF802]/10 text-[#ADF802] border border-[#ADF802]/20">
                Portfolio Copilot
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Quantitative risk evaluation & scenario simulation assistant.
            </p>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#ADF802] animate-pulse" />
          <span className="font-semibold text-slate-300">Robinhood Chain Ready</span>
        </div>
      </div>

      {/* Section 1: Executive Summary & Risk Signals */}
      {isLoadingAnalysis ? (
        <div className="p-6 rounded-xl glass-panel border border-white/10 animate-pulse space-y-3">
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-4 bg-white/10 rounded w-1/2" />
        </div>
      ) : analysis ? (
        <div className="space-y-4">
          {/* Executive summary block */}
          <div className="p-4 rounded-xl glass-panel border border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#ADF802] mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Executive Risk Summary
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {analysis.executiveSummary}
            </p>
          </div>

          {/* Risk signals badges */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Detected Risk Signals
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {analysis.riskSignals.length === 0 ? (
                <div className="p-3 rounded-lg glass-panel text-xs text-slate-400">
                  No critical risk signals flagged.
                </div>
              ) : (
                analysis.riskSignals.map((signal, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl glass-panel hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getSignalBadgeColor(signal.level)}`}>
                        {signal.level} RISK
                      </span>
                      <span className="text-[10px] uppercase font-mono text-slate-500">{signal.category}</span>
                    </div>
                    <div className="text-xs font-bold text-white">{signal.title}</div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">{signal.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Section 2: "Ask Aequitas" Interactive Copilot */}
      <div className="pt-4 border-t border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-[#ADF802]" />
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Ask Aequitas Copilot
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Real-Time Math Engine</span>
        </div>

        {/* Suggested Quick Questions */}
        {analysis?.suggestedQuestions && analysis.suggestedQuestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {analysis.suggestedQuestions.map((sq, i) => (
              <button
                key={i}
                onClick={() => handleAskQuestion(sq)}
                disabled={isAsking}
                className="text-[11px] px-2.5 py-1 rounded-lg glass-panel hover:border-[#ADF802]/40 hover:text-[#ADF802] text-slate-300 transition-colors text-left disabled:opacity-50"
              >
                "{sq}"
              </button>
            ))}
          </div>
        )}

        {/* Chat Stream History */}
        {messages.length > 0 && (
          <div className="space-y-3 max-h-80 overflow-y-auto p-3 rounded-xl glass-panel border border-white/10">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 text-xs ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-[#ADF802]/10 border border-[#ADF802]/30 flex items-center justify-center text-[#ADF802] shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-xl max-w-[85%] whitespace-pre-line leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#ADF802]/10 text-white border border-[#ADF802]/30'
                      : 'glass-panel-elevated text-slate-200 border border-white/10 font-sans'
                  }`}
                >
                  {msg.content}
                  <div className="text-[9px] text-slate-500 mt-1 font-mono">{msg.timestamp}</div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
            {isAsking && (
              <div className="flex items-center gap-2 text-xs text-[#ADF802] animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Aequitas AI is computing scenario impact...</span>
              </div>
            )}
          </div>
        )}

        {/* Chat input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskQuestion(inputQuery);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about concentration, scenarios (e.g. What if NVDA falls 10%?)..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isAsking}
            className="flex-1 px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#ADF802]/60"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isAsking}
            className="px-4 py-2 rounded-xl bg-[#ADF802] hover:bg-[#9ee002] text-black text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#ADF802]/10 disabled:opacity-50 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </form>

        {/* Required Financial Disclaimer */}
        <div className="pt-2 flex items-start gap-1.5 text-[10px] text-slate-500 leading-tight">
          <Info className="w-3.5 h-3.5 shrink-0 text-slate-500 mt-0.5" />
          <span>
            <strong>Disclaimer:</strong> Aequitas AI provides informational analysis and simulations only. It is not financial advice.
          </span>
        </div>

      </div>

    </div>
  );
};
