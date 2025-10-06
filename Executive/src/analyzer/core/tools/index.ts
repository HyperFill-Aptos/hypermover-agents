import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MarketManager } from "../../../services/market-manager.js";
import { AptosOrderbookClient } from "../../client/aptos-orderbook-client.js";

const marketSelectionSchema = z.object({
    marketName: z.string().describe("Name of the market (e.g., 'hypermover')")
});

const getOrderBookSchema = z.object({
    marketName: z.string().describe("Name of the market"),
    symbol: z.string().describe("Trading pair symbol (e.g., 'APT_USDT')")
});

const getBestOrderSchema = z.object({
    marketName: z.string().describe("Name of the market"),
    baseAsset: z.string().describe("Base asset (e.g., 'APT')"),
    quoteAsset: z.string().describe("Quote asset (e.g., 'USDT')"),
    side: z.enum(['bid', 'ask']).describe("Order side - 'bid' for buy orders, 'ask' for sell orders")
});

const checkFundsSchema = z.object({
    marketName: z.string().describe("Name of the market"),
    asset: z.string().describe("Asset to check funds for (e.g., 'APT', 'USDT')")
});

export function registerTools(server: McpServer, marketManager: MarketManager) {

    const getMarketClient = (marketName: string): AptosOrderbookClient | null => {
        const client = marketManager.getMarketClient(marketName);
        if (!client) {
            throw new Error(`Market '${marketName}' not found or not supported`);
        }
        return client;
    };

    server.registerTool(
        "get_supported_markets",
        {
            title: "Get Supported Markets",
            description: "Get list of all supported markets",
        },
        async () => {
            try {
                const markets = marketManager.getMarketList();
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(markets, null, 2)
                    }]
                };
            } catch (err: any) {
                return {
                    content: [{
                        type: "text",
                        text: `Error fetching supported markets: ${err.message}`
                    }]
                };
            }
        }
    );

    server.registerTool(
        "get_orderbook",
        {
            title: "Get Order Book",
            description: "Retrieve the order book for a trading pair",
            inputSchema: getOrderBookSchema.shape,
        },
        async ({ marketName, symbol }) => {
            try {
                const client = getMarketClient(marketName);
                const result = await client!.getOrderBook(symbol);
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }]
                };
            } catch (err: any) {
                return {
                    content: [{
                        type: "text",
                        text: `Error fetching orderbook for ${symbol} from ${marketName}: ${err.message}`
                    }]
                };
            }
        }
    );

    server.registerTool(
        "get_best_order",
        {
            title: "Get Best Order",
            description: "Get the best bid or ask order for a trading pair",
            inputSchema: getBestOrderSchema.shape,
        },
        async ({ marketName, baseAsset, quoteAsset, side }) => {
            try {
                const client = getMarketClient(marketName);
                const result = await client!.getBestOrder(baseAsset, quoteAsset, side);
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }]
                };
            } catch (err: any) {
                return {
                    content: [{
                        type: "text",
                        text: `Error fetching best ${side} for ${baseAsset}/${quoteAsset} from ${marketName}: ${err.message}`
                    }]
                };
            }
        }
    );

    server.registerTool(
        "get_best_bid",
        {
            title: "Get Best Bid",
            description: "Get the best bid (buy) order for a trading pair",
            inputSchema: z.object({
                marketName: z.string().describe("Name of the market"),
                baseAsset: z.string().describe("Base asset (e.g., 'APT')"),
                quoteAsset: z.string().describe("Quote asset (e.g., 'USDT')")
            }).shape,
        },
        async ({ marketName, baseAsset, quoteAsset }) => {
            try {
                const client = getMarketClient(marketName);
                const result = await client!.getBestBid(baseAsset, quoteAsset);
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }]
                };
            } catch (err: any) {
                return {
                    content: [{
                        type: "text",
                        text: `Error fetching best bid for ${baseAsset}/${quoteAsset} from ${marketName}: ${err.message}`
                    }]
                };
            }
        }
    );

    server.registerTool(
        "get_best_ask",
        {
            title: "Get Best Ask",
            description: "Get the best ask (sell) order for a trading pair",
            inputSchema: z.object({
                marketName: z.string().describe("Name of the market"),
                baseAsset: z.string().describe("Base asset (e.g., 'APT')"),
                quoteAsset: z.string().describe("Quote asset (e.g., 'USDT')")
            }).shape,
        },
        async ({ marketName, baseAsset, quoteAsset }) => {
            try {
                const client = getMarketClient(marketName);
                const result = await client!.getBestAsk(baseAsset, quoteAsset);
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }]
                };
            } catch (err: any) {
                return {
                    content: [{
                        type: "text",
                        text: `Error fetching best ask for ${baseAsset}/${quoteAsset} from ${marketName}: ${err.message}`
                    }]
                };
            }
        }
    );

    server.registerTool(
        "check_available_funds",
        {
            title: "Check Available Funds",
            description: "Check locked/available funds for a specific asset",
            inputSchema: checkFundsSchema.shape,
        },
        async ({ marketName, asset }) => {
            try {
                const client = getMarketClient(marketName);
                const result = await client!.checkAvailableFunds(asset);
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }]
                };
            } catch (err: any) {
                return {
                    content: [{
                        type: "text",
                        text: `Error checking funds for ${asset} in ${marketName}: ${err.message}`
                    }]
                };
            }
        }
    );

    server.registerTool(
        "get_market_overview",
        {
            title: "Get Market Overview",
            description: "Get comprehensive market data including orderbook, best orders, and spread for a trading pair",
            inputSchema: z.object({
                marketName: z.string().describe("Name of the market"),
                baseAsset: z.string().describe("Base asset (e.g., 'APT')"),
                quoteAsset: z.string().describe("Quote asset (e.g., 'USDT')")
            }).shape,
        },
        async ({ marketName, baseAsset, quoteAsset }) => {
            try {
                const client = getMarketClient(marketName);
                const result = await client!.getMarketOverview(baseAsset, quoteAsset);
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }]
                };
            } catch (err: any) {
                return {
                    content: [{
                        type: "text",
                        text: `Error fetching market overview for ${baseAsset}/${quoteAsset} from ${marketName}: ${err.message}`
                    }]
                };
            }
        }
    );

    server.registerTool(
        "get_settlement_health",
        {
            title: "Get Settlement Health",
            description: "Check the health status of the Aptos connection",
            inputSchema: marketSelectionSchema.shape,
        },
        async ({ marketName }) => {
            try {
                const client = getMarketClient(marketName);
                const result = await client!.getSettlementHealth();
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }]
                };
            } catch (err: any) {
                return {
                    content: [{
                        type: "text",
                        text: `Error checking settlement health for ${marketName}: ${err.message}`
                    }]
                };
            }
        }
    );

    server.registerTool(
        "format_symbol",
        {
            title: "Format Trading Symbol",
            description: "Format base and quote assets into a trading symbol",
            inputSchema: z.object({
                baseAsset: z.string().describe("Base asset (e.g., 'APT')"),
                quoteAsset: z.string().describe("Quote asset (e.g., 'USDT')")
            }).shape,
        },
        async ({ baseAsset, quoteAsset }) => {
            try {
                const symbol = AptosOrderbookClient.formatSymbol(baseAsset, quoteAsset);
                return {
                    content: [{
                        type: "text",
                        text: `Formatted symbol: ${symbol}`
                    }]
                };
            } catch (err: any) {
                return {
                    content: [{
                        type: "text",
                        text: `Error formatting symbol: ${err.message}`
                    }]
                };
            }
        }
    );

    server.registerTool(
        "parse_symbol",
        {
            title: "Parse Trading Symbol",
            description: "Parse a trading symbol into base and quote assets",
            inputSchema: z.object({
                symbol: z.string().describe("Trading symbol (e.g., 'APT_USDT')")
            }).shape,
        },
        async ({ symbol }) => {
            try {
                const parsed = AptosOrderbookClient.parseSymbol(symbol);
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(parsed, null, 2)
                    }]
                };
            } catch (err: any) {
                return {
                    content: [{
                        type: "text",
                        text: `Error parsing symbol: ${err.message}`
                    }]
                };
            }
        }
    );
}


