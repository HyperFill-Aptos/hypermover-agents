import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AptosVaultClient } from "../../client/aptos-vault-client.js";

export function registerTools(server: McpServer, vaultClient: AptosVaultClient) {

    server.registerTool(
        "fetch_vault_balance",
        {
            title: "Fetch Vault Balance",
            description: "Fetch the current balance and state of the vault",
        },
        async () => {
            try {
                const result = await vaultClient.fetchVaultBalance();
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
                        text: `Error fetching vault balance: ${err.message}`
                    }]
                };
            }
        }
    );

    server.registerTool(
        "fetch_oracle_price",
        {
            title: "Fetch Oracle Price",
            description: "Fetch price from external oracle (CoinGecko)",
            inputSchema: z.object({
                baseAsset: z.string().describe("Base asset (e.g., 'APT')"),
                quoteAsset: z.string().describe("Quote asset (e.g., 'USD')")
            }).shape,
        },
        async ({ baseAsset, quoteAsset }) => {
            try {
                const result = await vaultClient.fetchOraclePrice(baseAsset, quoteAsset);
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
                        text: `Error fetching oracle price: ${err.message}`
                    }]
                };
            }
        }
    );

    server.registerTool(
        "get_available_assets",
        {
            title: "Get Available Assets",
            description: "Get available assets in the vault for trading",
        },
        async () => {
            try {
                const result = await vaultClient.getAvailableAssets();
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
                        text: `Error getting available assets: ${err.message}`
                    }]
                };
            }
        }
    );

    server.registerTool(
        "get_user_share_balance",
        {
            title: "Get User Share Balance",
            description: "Get the share balance for a specific user",
            inputSchema: z.object({
                userAddress: z.string().describe("User's Aptos address")
            }).shape,
        },
        async ({ userAddress }) => {
            try {
                const result = await vaultClient.getUserShareBalance(userAddress);
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
                        text: `Error getting user share balance: ${err.message}`
                    }]
                };
            }
        }
    );
}
