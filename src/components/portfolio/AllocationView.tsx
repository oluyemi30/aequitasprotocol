import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieIcon, Layers } from 'lucide-react';
import { Holding } from '../../types';

interface AllocationViewProps {
  holdings: Holding[];
  totalValue: number;
}

const PALETTE = [
  '#ADF802', // lemon green
  '#5E5CE6', // neon purple/indigo
  '#FFB800', // amber
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#38bdf8', // sky
  '#a855f7', // violet
  '#64748b', // slate
];

export const AllocationView: React.FC<AllocationViewProps> = ({ holdings, totalValue }) => {
  const [viewMode, setViewMode] = useState<'asset' | 'sector'>('asset');

  // Asset breakdown data
  const assetData = useMemo(() => {
    return holdings.map((h, i) => ({
      name: h.token.symbol,
      fullName: h.token.name,
      value: h.value,
      percentage: h.allocationPercentage,
      color: PALETTE[i % PALETTE.length],
    }));
  }, [holdings]);

  // Sector breakdown data
  const sectorData = useMemo(() => {
    const map: Record<string, { value: number; count: number }> = {};
    holdings.forEach((h) => {
      const sec = h.token.sector || 'Equities';
      if (!map[sec]) {
        map[sec] = { value: 0, count: 0 };
      }
      map[sec].value += h.value;
      map[sec].count += 1;
    });

    return Object.entries(map).map(([sector, data], i) => ({
      name: sector,
      fullName: `${sector} (${data.count} asset${data.count > 1 ? 's' : ''})`,
      value: data.value,
      percentage: totalValue > 0 ? Number(((data.value / totalValue) * 100).toFixed(2)) : 0,
      color: PALETTE[(i + 1) % PALETTE.length],
    })).sort((a, b) => b.value - a.value);
  }, [holdings, totalValue]);

  const activeData = viewMode === 'asset' ? assetData : sectorData;

  return (
    <div className="glass-panel rounded-xl p-5 border border-white/10">
      {/* Header controls */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-[#ADF802]" />
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Portfolio Allocation
          </h2>
        </div>

        {/* View mode toggle */}
        <div className="inline-flex rounded-lg bg-black/40 p-1 border border-white/10 text-xs">
          <button
            onClick={() => setViewMode('asset')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
              viewMode === 'asset' ? 'bg-[#ADF802]/20 text-[#ADF802] border border-[#ADF802]/30 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            By Asset
          </button>
          <button
            onClick={() => setViewMode('sector')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
              viewMode === 'sector' ? 'bg-[#ADF802]/20 text-[#ADF802] border border-[#ADF802]/30 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            By Sector
          </button>
        </div>
      </div>

      {/* Chart & Legend layout */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Donut chart */}
        <div className="lg:col-span-5 h-56 relative flex items-center justify-center min-h-[224px]">
          {activeData && activeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
              <PieChart>
                <Pie
                  data={activeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {activeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#050505" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl glass-panel-elevated shadow-2xl text-xs backdrop-blur-md border border-white/10">
                          <div className="font-bold text-white">{data.name}</div>
                          <div className="font-mono text-[#ADF802] mt-0.5 font-semibold">
                            ${Number(data.value).toLocaleString('en-US', { minimumFractionDigits: 2 })} ({data.percentage}%)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
              No allocation data available
            </div>
          )}

          {/* Center stats in donut */}
          <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Positions</span>
            <span className="text-xl font-bold font-mono text-white stat-value">{holdings?.length || 0}</span>
          </div>
        </div>

        {/* Legend item list */}
        <div className="lg:col-span-7 space-y-2 max-h-56 overflow-y-auto pr-1">
          {activeData.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between p-2 rounded-lg glass-panel text-xs hover:border-white/20 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-bold text-slate-200 truncate">{item.name}</span>
                <span className="text-[11px] text-slate-400 truncate hidden sm:inline">{item.fullName}</span>
              </div>
              <div className="text-right shrink-0 ml-2 font-mono">
                <span className="text-white font-bold">{item.percentage ?? 0}%</span>
                <span className="text-slate-400 text-[11px] ml-2 hidden sm:inline">
                  ${(item.value ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
