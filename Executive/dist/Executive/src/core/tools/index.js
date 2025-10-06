import { z } from "zod";
export function registerTools(server, vaultExecutor, botClient) {
    server.registerTool("move_from_vault_to_wallet", {
        title: "Move Assets from Vault to Wallet",
        description: "Move assets from vault to trading wallet for market making",
        inputSchema: z.object({
            amount: z.string().describe("Amount to move (in tokens)")
        }).shape,
    }, async ({ amount }) => {
        try {
            const result = await vaultExecutor.moveFromVaultToWallet(amount);
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }]
            };
        }
        catch (err) {
            return {
                content: [{
                        type: "text",
                        text: `Error moving assets from vault: ${err.message}`
                    }]
            };
        }
    });
    server.registerTool("move_from_wallet_to_vault", {
        title: "Move Assets from Wallet to Vault",
        description: "Return assets and profits from trading wallet back to vault",
        inputSchema: z.object({
            amount: z.string().describe("Amount to return (in tokens)"),
            profitAmount: z.string().describe("Profit amount (in tokens)")
        }).shape,
    }, async ({ amount, profitAmount }) => {
        try {
            const result = await vaultExecutor.moveFromWalletToVault(amount, profitAmount);
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }]
            };
        }
        catch (err) {
            return {
                content: [{
                        type: "text",
                        text: `Error moving assets to vault: ${err.message}`
                    }]
            };
        }
    });
    server.registerTool("place_limit_order", {
        title: "Place Limit Order",
        description: "Place a limit order on the orderbook",
        inputSchema: z.object({
            baseAsset: z.string().describe("Base asset (e.g., 'APT')"),
            quoteAsset: z.string().describe("Quote asset (e.g., 'USDT')"),
            price: z.string().describe("Order price"),
            quantity: z.string().describe("Order quantity"),
            side: z.enum(['bid', 'ask']).describe("Order side")
        }).shape,
    }, async ({ baseAsset, quoteAsset, price, quantity, side }) => {
        try {
            const result = await vaultExecutor.placeLimitOrder(baseAsset, quoteAsset, price, quantity, side);
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }]
            };
        }
        catch (err) {
            return {
                content: [{
                        type: "text",
                        text: `Error placing limit order: ${err.message}`
                    }]
            };
        }
    });
    server.registerTool("cancel_order", {
        title: "Cancel Order",
        description: "Cancel an existing order",
        inputSchema: z.object({
            orderId: z.string().describe("Order ID"),
            side: z.enum(['bid', 'ask']).describe("Order side"),
            baseAsset: z.string().describe("Base asset"),
            quoteAsset: z.string().describe("Quote asset")
        }).shape,
    }, async ({ orderId, side, baseAsset, quoteAsset }) => {
        try {
            const result = await vaultExecutor.cancelOrder(orderId, side, baseAsset, quoteAsset);
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }]
            };
        }
        catch (err) {
            return {
                content: [{
                        type: "text",
                        text: `Error cancelling order: ${err.message}`
                    }]
            };
        }
    });
    server.registerTool("start_market_maker_bot", {
        title: "Start Market Maker Bot",
        description: "Start the market maker bot with specified configuration",
        inputSchema: z.object({
            baseAsset: z.string().describe("Base asset"),
            quoteAsset: z.string().describe("Quote asset"),
            spreadPercentage: z.number().describe("Spread percentage (e.g., 0.5 for 0.5%)"),
            orderQuantity: z.number().describe("Order quantity"),
            referencePrice: z.number().optional().describe("Reference price (optional)")
        }).shape,
    }, async ({ baseAsset, quoteAsset, spreadPercentage, orderQuantity, referencePrice }) => {
        try {
            const result = await botClient.startBot({
                baseAsset,
                quoteAsset,
                spreadPercentage,
                orderQuantity,
                referencePrice
            });
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }]
            };
        }
        catch (err) {
            return {
                content: [{
                        type: "text",
                        text: `Error starting market maker bot: ${err.message}`
                    }]
            };
        }
    });
    server.registerTool("stop_market_maker_bot", {
        title: "Stop Market Maker Bot",
        description: "Stop the running market maker bot",
    }, async () => {
        try {
            const result = await botClient.stopBot();
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }]
            };
        }
        catch (err) {
            return {
                content: [{
                        type: "text",
                        text: `Error stopping market maker bot: ${err.message}`
                    }]
            };
        }
    });
    server.registerTool("get_market_maker_status", {
        title: "Get Market Maker Bot Status",
        description: "Get the current status of the market maker bot",
    }, async () => {
        try {
            const result = await botClient.getBotStatus();
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }]
            };
        }
        catch (err) {
            return {
                content: [{
                        type: "text",
                        text: `Error getting bot status: ${err.message}`
                    }]
            };
        }
    });
    server.registerTool("modify_market_maker_config", {
        title: "Modify Market Maker Config",
        description: "Modify the configuration of the running market maker bot",
        inputSchema: z.object({
            spreadPercentage: z.number().optional().describe("New spread percentage"),
            orderQuantity: z.number().optional().describe("New order quantity"),
            referencePrice: z.number().optional().describe("New reference price")
        }).shape,
    }, async (config) => {
        try {
            const result = await botClient.modifyBotConfig(config);
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }]
            };
        }
        catch (err) {
            return {
                content: [{
                        type: "text",
                        text: `Error modifying bot config: ${err.message}`
                    }]
            };
        }
    });
}
