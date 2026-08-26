import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { executeGraphQLQuery } from './src/server/graphqlSchema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI Client (Lazy / Safe)
  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Clean markdown fences and extract pure JSON objects
  const extractCleanJson = (raw: string): string => {
    let clean = raw.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    clean = clean.trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return clean.substring(firstBrace, lastBrace + 1);
    }
    return clean;
  };

  interface AIResponseResult {
    content: string;
    provider: 'openrouter' | 'gemini' | 'deterministic';
    model?: string;
  }

  // OpenRouter API Caller (Primary AI Workhorse)
  const callOpenRouter = async (systemInstruction: string, userPrompt: string, jsonMode = false): Promise<{ content: string; model: string } | null> => {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) return null;

    // Prioritized OpenRouter models for financial reasoning and JSON fidelity
    const candidateModels = [
      'openrouter/auto',
      'google/gemini-2.5-flash',
      'anthropic/claude-3.5-haiku',
      'meta-llama/llama-3.3-70b-instruct',
      'mistralai/mistral-small-24b-instruct-2501',
      'deepseek/deepseek-chat',
      'qwen/qwen-2.5-72b-instruct',
    ];

    for (const model of candidateModels) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey.trim()}`,
            'HTTP-Referer': 'https://aequitas.chain.robinhood.com',
            'X-Title': 'Aequitas Protocol',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: userPrompt }
            ],
            response_format: jsonMode ? { type: 'json_object' } : undefined,
            temperature: 0.2,
            max_tokens: 1500,
          }),
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && typeof content === 'string') {
          console.log(`[OpenRouter AI] Successfully generated response using model: ${model}`);
          return {
            content: extractCleanJson(content),
            model,
          };
        }
      } catch (err) {
        // Try next candidate
      }
    }

    return null;
  };

  // Unified AI Generation Helper (Primary: OpenRouter, Secondary: Gemini SDK)
  const generateAIContent = async (systemInstruction: string, promptText: string, jsonMode = false): Promise<AIResponseResult | null> => {
    // 1. Primary: OpenRouter AI API
    if (process.env.OPENROUTER_API_KEY) {
      const openRouterResult = await callOpenRouter(systemInstruction, promptText, jsonMode);
      if (openRouterResult) {
        return {
          content: openRouterResult.content,
          provider: 'openrouter',
          model: openRouterResult.model,
        };
      }
    }

    // 2. Secondary Fallback: Gemini GenAI SDK
    const ai = getGenAI();
    if (ai) {
      const geminiCandidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3.7-flash'];
      for (const model of geminiCandidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: promptText,
            config: {
              responseMimeType: jsonMode ? 'application/json' : undefined,
              systemInstruction,
              maxOutputTokens: 1500,
            },
          });
          if (response.text) {
            console.log(`[Gemini AI] Fallback generated response using model: ${model}`);
            return {
              content: extractCleanJson(response.text),
              provider: 'gemini',
              model,
            };
          }
        } catch (geminiErr: any) {
          // Try next model if available
        }
      }
    }

    return null;
  };

  // 1. Health Endpoint
  app.get('/api/health', (req, res) => {
    const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
    const hasGemini = !!process.env.GEMINI_API_KEY;

    res.json({
      status: 'ok',
      service: 'Aequitas Protocol - Robinhood Chain Programmable Strategy Engine',
      time: new Date().toISOString(),
      aiConfigured: hasOpenRouter || hasGemini,
      openRouterConfigured: hasOpenRouter,
      geminiConfigured: hasGemini,
    });
  });

  // 2. Robinhood Stock Token Registry Endpoint
  app.get('/api/rhj/assets', async (req, res) => {
    try {
      // In production/mainnet this proxies GET https://api.robinhood.com/rhj/assets
      // We also provide clean JSON registry for Robinhood Chain
      const defaultAssets = [
        {
          symbol: 'AAPL',
          name: 'Apple Inc. Tokenized Stock',
          contractAddress: '0x100000000000000000000000000000000000aApL',
          chainId: 4663,
          logo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=128&auto=format&fit=crop&q=80',
          currentMultiplier: 1.0,
          tradingStatus: 'active',
          decimals: 18,
          sector: 'Technology',
          industry: 'Consumer Electronics',
          marketCap: '$3.42T',
          peRatio: 33.4,
          dividendYield: 0.48,
          beta: 1.12,
          description: 'Apple Inc. tokenized equity on Robinhood Chain with 24/7 instant settlement.',
        },
        {
          symbol: 'NVDA',
          name: 'NVIDIA Corporation Tokenized Stock',
          contractAddress: '0x200000000000000000000000000000000000nVdA',
          chainId: 4663,
          logo: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=128&auto=format&fit=crop&q=80',
          currentMultiplier: 1.0,
          tradingStatus: 'active',
          decimals: 18,
          sector: 'Technology',
          industry: 'Semiconductors',
          marketCap: '$3.15T',
          peRatio: 52.8,
          dividendYield: 0.03,
          beta: 1.75,
          description: 'NVIDIA accelerated computing & AI hardware tokenized asset on Robinhood Chain.',
        },
        {
          symbol: 'GOOGL',
          name: 'Alphabet Inc. Tokenized Stock',
          contractAddress: '0x300000000000000000000000000000000000gOoG',
          chainId: 4663,
          logo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=128&auto=format&fit=crop&q=80',
          currentMultiplier: 1.0,
          tradingStatus: 'active',
          decimals: 18,
          sector: 'Communication Services',
          industry: 'Internet Content & Information',
          marketCap: '$2.28T',
          peRatio: 24.1,
          dividendYield: 0.45,
          beta: 1.05,
          description: 'Alphabet Class A common stock tokenized on Robinhood Chain.',
        },
        {
          symbol: 'AMZN',
          name: 'Amazon.com Inc. Tokenized Stock',
          contractAddress: '0x400000000000000000000000000000000000AmZn',
          chainId: 4663,
          logo: 'https://images.unsplash.com/photo-1523474255658-4af91004901b?w=128&auto=format&fit=crop&q=80',
          currentMultiplier: 1.0,
          tradingStatus: 'active',
          decimals: 18,
          sector: 'Consumer Cyclical',
          industry: 'Internet Retail & Cloud',
          marketCap: '$2.14T',
          peRatio: 41.2,
          dividendYield: 0.0,
          beta: 1.18,
          description: 'Amazon e-commerce & cloud computing infrastructure token.',
        },
        {
          symbol: 'MSFT',
          name: 'Microsoft Corporation Tokenized Stock',
          contractAddress: '0x500000000000000000000000000000000000MsFt',
          chainId: 4663,
          logo: 'https://images.unsplash.com/photo-1642132652075-2b23a9d9e602?w=128&auto=format&fit=crop&q=80',
          currentMultiplier: 1.0,
          tradingStatus: 'active',
          decimals: 18,
          sector: 'Technology',
          industry: 'Software - Infrastructure',
          marketCap: '$3.22T',
          peRatio: 34.6,
          dividendYield: 0.72,
          beta: 0.94,
          description: 'Microsoft enterprise software & Azure token on Robinhood Chain.',
        },
        {
          symbol: 'TSLA',
          name: 'Tesla, Inc. Tokenized Stock',
          contractAddress: '0x600000000000000000000000000000000000tSLa',
          chainId: 4663,
          logo: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=128&auto=format&fit=crop&q=80',
          currentMultiplier: 1.0,
          tradingStatus: 'active',
          decimals: 18,
          sector: 'Consumer Cyclical',
          industry: 'Auto Manufacturers & Clean Tech',
          marketCap: '$790B',
          peRatio: 68.3,
          dividendYield: 0.0,
          beta: 2.34,
          description: 'Tesla EV and clean energy tokenized stock on Robinhood Chain.',
        },
        {
          symbol: 'META',
          name: 'Meta Platforms, Inc. Tokenized Stock',
          contractAddress: '0x700000000000000000000000000000000000mEtA',
          chainId: 4663,
          logo: 'https://images.unsplash.com/photo-1633675254053-d96c7668c3b8?w=128&auto=format&fit=crop&q=80',
          currentMultiplier: 1.0,
          tradingStatus: 'active',
          decimals: 18,
          sector: 'Communication Services',
          industry: 'Internet Content & Information',
          marketCap: '$1.48T',
          peRatio: 26.8,
          dividendYield: 0.35,
          beta: 1.25,
          description: 'Meta Platforms social media & open AI ecosystem token.',
        },
        {
          symbol: 'COIN',
          name: 'Coinbase Global, Inc. Tokenized Stock',
          contractAddress: '0x800000000000000000000000000000000000cOiN',
          chainId: 4663,
          logo: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=128&auto=format&fit=crop&q=80',
          currentMultiplier: 1.0,
          tradingStatus: 'active',
          decimals: 18,
          sector: 'Financial Services',
          industry: 'Financial Data & Stock Exchanges',
          marketCap: '$62B',
          peRatio: 38.5,
          dividendYield: 0.0,
          beta: 2.85,
          description: 'Coinbase crypto infrastructure & financial market token.',
        },
        {
          symbol: 'SPY',
          name: 'SPDR S&P 500 ETF Trust Token',
          contractAddress: '0x900000000000000000000000000000000000sPyE',
          chainId: 4663,
          logo: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=128&auto=format&fit=crop&q=80',
          currentMultiplier: 1.0,
          tradingStatus: 'active',
          decimals: 18,
          sector: 'Index ETF',
          industry: 'Broad Market Equity',
          marketCap: '$580B',
          peRatio: 26.5,
          dividendYield: 1.24,
          beta: 1.0,
          description: 'S&P 500 benchmark ETF token on Robinhood Chain.',
        },
        {
          symbol: 'QQQ',
          name: 'Invesco QQQ Trust Series 1 Token',
          contractAddress: '0xA00000000000000000000000000000000000qQqT',
          chainId: 4663,
          logo: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=128&auto=format&fit=crop&q=80',
          currentMultiplier: 1.0,
          tradingStatus: 'active',
          decimals: 18,
          sector: 'Index ETF',
          industry: 'Nasdaq 100 Tech Equity',
          marketCap: '$290B',
          peRatio: 31.2,
          dividendYield: 0.58,
          beta: 1.15,
          description: 'Nasdaq-100 top non-financial innovators tokenized ETF.',
        },
      ];
      res.json(defaultAssets);
    } catch (err) {
      console.error('Error fetching assets:', err);
      res.status(500).json({ error: 'Failed to fetch asset registry' });
    }
  });

  // 3. Robinhood Stock Token Price Endpoint
  app.get('/api/rhj/prices/:symbol', (req, res) => {
    const symbol = req.params.symbol?.toUpperCase();
    const prices: Record<string, { price: number; change24h: number; change24hPercent: number; high: number; low: number; volume: string }> = {
      AAPL: { price: 234.82, change24h: 3.42, change24hPercent: 1.48, high: 236.15, low: 231.90, volume: '48.2M' },
      NVDA: { price: 138.25, change24h: 4.85, change24hPercent: 3.64, high: 140.10, low: 134.20, volume: '92.4M' },
      GOOGL: { price: 182.60, change24h: -1.15, change24hPercent: -0.63, high: 184.50, low: 181.30, volume: '22.1M' },
      AMZN: { price: 198.40, change24h: 2.10, change24hPercent: 1.07, high: 200.25, low: 196.80, volume: '34.6M' },
      MSFT: { price: 448.90, change24h: 1.75, change24hPercent: 0.39, high: 452.00, low: 446.10, volume: '18.9M' },
      TSLA: { price: 246.50, change24h: -5.40, change24hPercent: -2.14, high: 254.30, low: 244.10, volume: '64.8M' },
      META: { price: 592.10, change24h: 8.60, change24hPercent: 1.47, high: 596.40, low: 585.00, volume: '14.2M' },
      COIN: { price: 218.75, change24h: 11.20, change24hPercent: 5.40, high: 224.50, low: 209.00, volume: '8.4M' },
      SPY: { price: 586.40, change24h: 4.10, change24hPercent: 0.70, high: 588.20, low: 583.90, volume: '56.1M' },
      QQQ: { price: 504.30, change24h: 5.80, change24hPercent: 1.16, high: 507.00, low: 501.20, volume: '41.3M' },
    };

    const quote = prices[symbol] || {
      price: 150.00,
      change24h: 1.20,
      change24hPercent: 0.81,
      high: 153.00,
      low: 148.50,
      volume: '15.0M',
    };

    res.json({
      symbol,
      price: quote.price,
      change24h: quote.change24h,
      change24hPercent: quote.change24hPercent,
      high24h: quote.high,
      low24h: quote.low,
      volume24h: quote.volume,
      timestamp: new Date().toISOString(),
    });
  });

  // 3.5 AI Strategy Generator Endpoint
  app.post('/api/ai/strategy', async (req, res) => {
    const { prompt: userPrompt, userCapital, maxConstraint, currentHoldings } = req.body;
    if (!userPrompt || typeof userPrompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt parameter' });
    }

    try {
      const systemInstruction = `You are Aequitas Protocol, an onchain financial strategy synthesizer built for Robinhood Chain stock tokens.
Your sole job is to translate user natural language financial goals into a strict, mathematically sound stock token allocation strategy.

Supported Robinhood Stock Tokens:
- NVDA (NVIDIA - Semiconductor / AI Hardware)
- MSFT (Microsoft - Cloud & Enterprise AI)
- GOOGL (Alphabet - Search, Gemini AI, Cloud)
- AAPL (Apple - Consumer Hardware & Ecosystem)
- AMZN (Amazon - AWS Cloud, Retail AI)
- META (Meta - Social Media, Llama AI)
- TSLA (Tesla - Autonomous Driving, Robotics)
- COIN (Coinbase - Crypto & Web3 infrastructure)
- SPY (SPDR S&P 500 Index ETF)
- QQQ (Invesco Nasdaq 100 Index ETF)

Rules:
1. ONLY use the 10 supported symbols above. Map "GOOG" to "GOOGL". Reject non-supported tokens.
2. The sum of asset allocations MUST equal EXACTLY 1.0 (100%).
3. No single asset allocation may be negative or 0.
4. If user specifies a maximum allocation constraint (e.g. "No asset above 35%"), every asset must have allocation <= 0.35.
5. If user mentions a capital amount (e.g. "$1000", "$500"), set capital to that number. Default to ${userCapital || 1000} if unspecified.
6. Provide a concise financial objective and clear institutional rationale.
7. NEVER produce arbitrary bytecode, fake transaction hashes, or non-token assets.
8. Output pure JSON matching the schema below.`;

      const promptText = `User Request: "${userPrompt}"
User Capital Hint: $${userCapital || 1000}
Constraint Hint: ${maxConstraint ? `Max allocation per asset: ${maxConstraint}%` : 'Not specified'}
Current Wallet Holdings: ${JSON.stringify(currentHoldings || [])}

Synthesize a structured Robinhood Chain stock token strategy now.`;

      const aiResult = await generateAIContent(systemInstruction, promptText, true);
      if (!aiResult || !aiResult.content) {
        return res.json({ fallback: true });
      }

      const parsed = JSON.parse(aiResult.content);
      res.json({
        ...parsed,
        isAiGenerated: true,
        provider: aiResult.provider,
        model: aiResult.model,
      });
    } catch (err) {
      console.warn('AI strategy synthesis error, fallback enabled:', err);
      res.json({ fallback: true });
    }
  });

  // 4. AI Portfolio Analyst Endpoint
  app.post('/api/ai/analyze', async (req, res) => {
    const { portfolioSummary } = req.body;
    if (!portfolioSummary || !portfolioSummary.holdings) {
      return res.status(400).json({ error: 'Missing portfolioSummary payload' });
    }

    try {
      const systemInstruction = 'You are Aequitas Protocol, a quantitative blockchain and portfolio risk analysis engine. Always output valid JSON conforming strictly to the requested schema.';
      const promptText = `You are Aequitas Protocol, an institutional-grade portfolio intelligence assistant built specifically for Robinhood Chain tokenized stocks.
Analyze the following Robinhood Chain portfolio holdings:
Total Value: $${portfolioSummary.totalValue}
24H Change: ${portfolioSummary.change24hPercent}% ($${portfolioSummary.change24hAmount})
Asset Count: ${portfolioSummary.assetCount}
Holdings Breakdown:
${JSON.stringify(portfolioSummary.holdings.map((h: any) => ({
  symbol: h.token.symbol,
  name: h.token.name,
  sector: h.token.sector,
  allocation: `${h.allocationPercentage}%`,
  value: `$${h.value}`,
  price: `$${h.price}`,
  beta: h.token.beta,
})), null, 2)}

Provide a strict, professional financial portfolio risk & concentration analysis.
DO NOT provide financial investment recommendations or advice (e.g. do not say "you should buy" or "you should sell"). Focus strictly on exposure, concentration math, sector risk, and onchain stock token characteristics.

Return your response strictly in the following JSON format:
{
  "executiveSummary": "2-3 concise sentences summarizing concentration, dominant sector, and top asset weighting.",
  "riskSignals": [
    {
      "level": "HIGH" | "MEDIUM" | "LOW",
      "title": "ALL-CAPS RISK TITLE",
      "description": "Clear explanation of the concentration or volatility factor.",
      "category": "concentration" | "sector" | "asset_count" | "volatility"
    }
  ],
  "insights": [
    "Insight bullet 1",
    "Insight bullet 2",
    "Insight bullet 3",
    "Insight bullet 4"
  ],
  "suggestedQuestions": [
    "Question 1",
    "Question 2",
    "Question 3"
  ]
}`;

      const aiResult = await generateAIContent(systemInstruction, promptText, true);
      if (!aiResult || !aiResult.content) {
        return res.json({ fallback: true });
      }

      const parsed = JSON.parse(aiResult.content);
      res.json({
        ...parsed,
        isAIPowered: true,
        provider: aiResult.provider,
        model: aiResult.model,
      });
    } catch (err) {
      console.warn('AI portfolio analysis failed, triggering fallback:', err);
      res.json({ fallback: true });
    }
  });

  // 5. AI "Ask Aequitas" Copilot Endpoint
  app.post('/api/ai/ask', async (req, res) => {
    const { question, portfolioSummary } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Missing question parameter' });
    }

    try {
      const systemInstruction = 'You are Aequitas Protocol, an objective fintech quantitative portfolio assistant. Give crisp, mathematically grounded answers with exact dollar and percentage calculations based on the user holdings provided.';
      const promptText = `You are Aequitas Protocol AI, the quantitative portfolio intelligence copilot for Robinhood Chain stock tokens.
User's Question: "${question}"

Current Portfolio State on Robinhood Chain:
Total Value: $${portfolioSummary?.totalValue || 0}
Holdings:
${JSON.stringify((portfolioSummary?.holdings || []).map((h: any) => ({
  symbol: h.token.symbol,
  name: h.token.name,
  sector: h.token.sector,
  allocation: `${h.allocationPercentage}%`,
  value: `$${h.value}`,
  price: `$${h.price}`,
  beta: h.token.beta,
})), null, 2)}

Instructions:
1. Answer the user's question accurately with quantitative portfolio math (e.g. if asked about "NVDA falling 10%", compute the exact USD reduction and overall % impact on their portfolio).
2. Maintain institutional clarity and objectivity.
3. NEVER give financial/investment advice (do not tell them to buy/sell).
4. Emphasize that onchain settlement on Robinhood Chain provides instant 24/7 liquidity and transparency.
5. End with the formal disclaimer: "Aequitas Protocol provides informational analysis and simulations only. It is not financial advice."`;

      const aiResult = await generateAIContent(systemInstruction, promptText, false);
      res.json({
        answer: aiResult?.content || 'Unable to generate response at this time.',
        isAIPowered: !!aiResult?.content,
        provider: aiResult?.provider || 'fallback',
        model: aiResult?.model,
      });
    } catch (err) {
      console.warn('AI copilot ask failed, using fallback:', err);
      res.json({ fallback: true });
    }
  });

  // 6. GraphQL API Endpoint for Robinhood Chain & EVM Data
  const handleGraphQL = async (req: express.Request, res: express.Response) => {
    try {
      let query = req.body?.query || req.query?.query;
      let variables = req.body?.variables;
      if (!variables && req.query?.variables) {
        try {
          variables = typeof req.query.variables === 'string' ? JSON.parse(req.query.variables) : req.query.variables;
        } catch {
          variables = undefined;
        }
      }

      if (typeof req.body === 'string' && req.headers['content-type']?.includes('application/graphql')) {
        query = req.body;
      }

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          errors: [{ message: 'Must provide query string.' }],
        });
      }

      const result = await executeGraphQLQuery(query, variables);
      res.json(result);
    } catch (err: any) {
      console.error('GraphQL Execution Error:', err);
      res.status(200).json({
        errors: [{ message: err?.message || 'Internal GraphQL execution error.' }],
      });
    }
  };

  app.post('/api/graphql', handleGraphQL);
  app.get('/api/graphql', handleGraphQL);
  app.post('/graphql', handleGraphQL);
  app.get('/graphql', handleGraphQL);

  // Mount Vite middleware in development, or serve static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aequitas Protocol server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Aequitas Protocol server:', err);
});
