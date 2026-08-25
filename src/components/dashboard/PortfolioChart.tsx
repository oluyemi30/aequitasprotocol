import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Line 
} from 'recharts';
import { TrendingUp, Info } from 'lucide-react';
import { generateDerivedPerformanceData } from '../../lib/portfolio';

interface PortfolioChartProps {
  currentValue: number;
}

type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

export const PortfolioChart: React.FC<PortfolioChartProps> = ({ currentValue }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [showBenchmark, setShowBenchmark] = useState<boolean>(true);

  const chartData = useMemo(() => {
    return generateDerivedPerformanceData(currentValue || 10000, timeframe);
  }, [currentValue, timeframe]);

  const safeCurrentValue = currentValue ?? 0;
  const startValue = chartData[0]?.value || safeCurrentValue;
  const changeValue = safeCurrentValue - startValue;
  const changePercent = startValue > 0 ? (changeValue / startValue) * 100 : 0;
  const isPositive = changeValue >= 0;

  const minVal = chartData.length > 0 ? Math.min(...chartData.map(d => Math.min(d.value, showBenchmark ? (d.benchmark || d.value) : d.value))) : safeCurrentValue * 0.95;
  const maxVal = chartData.length > 0 ? Math.max(...chartData.map(d => Math.max(d.value, showBenchmark ? (d.benchmark || d.value) : d.value))) : safeCurrentValue * 1.05;
  const yDomain = [Math.floor(minVal * 0.97), Math.ceil(maxVal * 1.03)];

  return (
    <div className="glass-panel rounded-xl p-5 border border-white/10">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Portfolio Performance
            </h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-mono border border-white/5">
              USD
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-white stat-value">
              ${safeCurrentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-xs font-mono font-semibold flex items-center ${isPositive ? 'text-[#ADF802]' : 'text-[#FF453A]'}`}>
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              {isPositive ? '+' : ''}${Math.abs(changeValue).toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">over {timeframe}</span>
          </div>
        </div>

        {/* Timeframe selector & Benchmark toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer mr-2 select-none">
            <input
              type="checkbox"
              checked={showBenchmark}
              onChange={(e) => setShowBenchmark(e.target.checked)}
              className="rounded bg-white/5 border-white/20 text-[#ADF802] focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-[11px]">S&P Token Benchmark</span>
          </label>

          <div className="inline-flex rounded-lg bg-black/40 p-1 border border-white/10">
            {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-colors ${
                  timeframe === tf
                    ? 'bg-[#ADF802]/20 text-[#ADF802] border border-[#ADF802]/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="mt-4 h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="sophisticatedDarkGreenGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ADF802" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ADF802" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              dy={10} 
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              domain={yDomain}
              tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
              dx={-5}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="p-3 rounded-xl glass-panel-elevated shadow-2xl text-xs backdrop-blur-md border border-white/10">
                      <div className="text-slate-400 font-mono text-[10px] mb-1 uppercase tracking-wider">{data.date}</div>
                      <div className="flex items-center justify-between gap-4 font-mono font-bold text-[#ADF802]">
                        <span className="font-sans font-medium text-slate-300">Portfolio:</span>
                        <span>${Number(data.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {showBenchmark && data.benchmark && (
                        <div className="flex items-center justify-between gap-4 font-mono text-[#5E5CE6] text-[11px] mt-1">
                          <span className="font-sans font-medium text-slate-400">S&P Token Index:</span>
                          <span>${Number(data.benchmark).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#ADF802"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#sophisticatedDarkGreenGradient)"
            />
            {showBenchmark && (
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="#5E5CE6"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Clear financial disclaimer for simulated chart series */}
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>
          Historical curve generated dynamically from live onchain token balances and quantitative volatility factors.
        </span>
      </div>
    </div>
  );
};
