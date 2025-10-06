import express, { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

// Executive tools and clients
import { registerTools as registerExecutiveTools } from "../core/tools/index.js";
import { AptosVaultExecutor } from "../client/aptos-vault-executor.js";
import { MarketMakerBotClient } from "../client/market-maker-bot-client.js";
import { config as executiveConfig } from "../services/config.js";

// MarketAnalyzer tools and manager (local)
import { registerTools as registerAnalyzerTools } from "../analyzer/core/tools/index.js";
import { MarketManager } from "../services/market-manager.js";

// Pricer tools and client (local)
import { registerTools as registerPricerTools } from "../pricer/core/tools/index.js";
import { AptosVaultClient } from "../pricer/client/aptos-vault-client.js";

const app = express();
app.use(express.json());

const server = new McpServer({ name: "unified-server", version: "1.0.0" });

// Executive wiring
const vaultExecutor = new AptosVaultExecutor({
    vaultAddress: executiveConfig.vaultAddress,
    orderbookAddress: executiveConfig.orderbookAddress,
    account: executiveConfig.account,
    privateKey: executiveConfig.privateKey,
    nodeUrl: executiveConfig.nodeUrl
});
const botClient = new MarketMakerBotClient(executiveConfig.botApiUrl);
registerExecutiveTools(server, vaultExecutor, botClient);

// MarketAnalyzer wiring
const marketManager = new MarketManager();
registerAnalyzerTools(server, marketManager);

// Pricer wiring
const vaultClient = new AptosVaultClient({
    vaultAddress: executiveConfig.vaultAddress,
    account: executiveConfig.account,
    nodeUrl: executiveConfig.nodeUrl
});
registerPricerTools(server, vaultClient);

const transports: Record<string, StreamableHTTPServerTransport> = {};

app.post("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport | undefined;

    if (sessionId && transports[sessionId]) {
        transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sid) => {
                transports[sid] = transport!;
            },
        });

        transport.onclose = () => {
            if (transport!.sessionId) delete transports[transport!.sessionId];
        };

        await server.connect(transport);
    } else {
        res.status(400).json({
            jsonrpc: "2.0",
            error: { code: -32000, message: "Bad Request: No valid session ID provided" },
            id: null
        });
        return;
    }

    await transport!.handleRequest(req, res, req.body);
});

const handleSessionRequest = async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
        res.status(400).send("Invalid or missing session ID");
        return;
    }
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
};

app.get("/mcp", handleSessionRequest);
app.delete("/mcp", handleSessionRequest);

app.set("name", "Unified");

export default app;


