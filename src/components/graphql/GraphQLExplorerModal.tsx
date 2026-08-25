import React, { useState } from 'react';
import {
  Code2,
  Play,
  Copy,
  Check,
  X,
  ExternalLink,
  Terminal,
  Database,
  Sparkles,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { ROBINHOOD_NETWORKS } from '../../lib/robinhood-chain';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chainId: number;
}

const SAMPLE_QUERIES = [
  {
    name: 'Transaction Details',
    desc: 'Query transaction hash, block number, gas used, and value',
    query: `{\n  transaction(\n    hash: "0x99c4c3a698526e9bf4738d783f7511566c65e29b25571fa14676b3703883e0ca"\n  ) {\n    hash\n    blockNumber\n    value\n    gasUsed\n    status\n    from\n    to\n  }\n}`,
  },
  {
    name: 'Robinhood Stock Tokens',
    desc: 'Query tokenized stock assets, contract addresses & prices',
    query: `{\n  tokens {\n    symbol\n    name\n    contractAddress\n    currentPrice\n    change24h\n    marketCap\n    sector\n  }\n}`,
  },
  {
    name: 'Latest Block',
    desc: 'Query latest Robinhood Chain block timestamp and gas',
    query: `{\n  block {\n    number\n    hash\n    timestamp\n    gasUsed\n    transactionsCount\n  }\n}`,
  },
  {
    name: 'Network Status',
    desc: 'Query Robinhood Chain RPC and Blockscout endpoints',
    query: `{\n  network(chainId: 46630) {\n    name\n    chainId\n    rpcUrl\n    explorerUrl\n    blockscoutGraphql\n    status\n  }\n}`,
  },
];

export function GraphQLExplorerModal({ isOpen, onClose, chainId }: Props) {
  const [query, setQuery] = useState<string>(SAMPLE_QUERIES[0].query);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentNetwork = ROBINHOOD_NETWORKS[chainId] || ROBINHOOD_NETWORKS[46630];

  const handleRunQuery = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResult(JSON.stringify({ error: err.message || 'Failed to execute query' }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCurl = () => {
    const origin = window.location.origin;
    const curlCommand = `curl -X POST "${origin}/api/graphql" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ query: query.trim() })}'`;
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0A0D12] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ADF802] to-[#80bd00] flex items-center justify-center text-black font-black text-sm shadow-md">
              <Code2 className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Aequitas GraphQL API
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ADF802]/10 text-[#ADF802] font-mono border border-[#ADF802]/30">
                  /api/graphql
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Execute EVM queries for transactions, stock tokens, and blocks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="px-4 py-2.5 bg-white/[0.02] border-b border-white/5 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 font-medium whitespace-nowrap flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3 h-3 text-[#ADF802]" /> Samples:
          </span>
          {SAMPLE_QUERIES.map((sample) => (
            <button
              key={sample.name}
              onClick={() => {
                setQuery(sample.query);
                setResult(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-mono whitespace-nowrap transition-colors"
            >
              {sample.name}
            </button>
          ))}
        </div>

        {/* Editor & Response Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/10 overflow-y-auto p-4 gap-4">
          
          {/* Query Editor */}
          <div className="flex flex-col h-full space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono flex items-center gap-1.5 text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-[#ADF802]" /> GraphQL Query
              </span>
              <button
                onClick={handleCopyCurl}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
              >
                {copiedCurl ? <Check className="w-3 h-3 text-[#ADF802]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCurl ? 'Copied cURL' : 'Copy cURL'}</span>
              </button>
            </div>

            <div className="flex-1 relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter GraphQL query..."
                rows={12}
                className="w-full h-full min-h-[220px] p-3 rounded-xl bg-black/60 border border-white/10 text-slate-100 font-mono text-xs focus:outline-none focus:border-[#ADF802] transition-colors resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400 font-mono">
                Chain ID: {currentNetwork.chainId}
              </span>
              <button
                onClick={handleRunQuery}
                disabled={isLoading || !query.trim()}
                className="px-4 py-2 rounded-xl bg-[#ADF802] hover:bg-[#9ee002] disabled:opacity-50 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#ADF802]/20 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>Execute Query</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result JSON Viewer */}
          <div className="flex flex-col h-full space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono flex items-center gap-1.5 text-slate-300">
                <Database className="w-3.5 h-3.5 text-[#ADF802]" /> Response JSON
              </span>
              {result && (
                <button
                  onClick={handleCopyResult}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-[#ADF802]" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            <div className="flex-1 min-h-[220px] p-3 rounded-xl bg-black/80 border border-white/10 overflow-auto text-xs font-mono leading-relaxed">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-slate-500 gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#ADF802]" />
                  <span>Fetching from Robinhood Chain...</span>
                </div>
              ) : result ? (
                <pre className="text-lime-300 whitespace-pre-wrap">{result}</pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
                  <Play className="w-6 h-6 text-slate-600 mb-2" />
                  <p>Click "Execute Query" to run your GraphQL request.</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Direct HTTP POST supported at <code className="text-slate-400">/api/graphql</code>
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer / Documentation link */}
        <div className="p-3.5 bg-black/60 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ADF802]" />
            <span>Blockscout & EVM compatible schema active</span>
          </div>
          <a
            href={currentNetwork.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#ADF802] hover:underline"
          >
            <span>Blockscout Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </div>
  );
}
