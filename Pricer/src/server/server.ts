import express, { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { registerTools } from "../core/tools/index.js";
import { AptosVaultClient } from "../client/aptos-vault-client.js";
import { config } from "../services/config.js";

const app = express();
app.use(express.json());

const server = new McpServer({ name: "pricer-server", version: "1.0.0" });
const vaultClient = new AptosVaultClient({
    vaultAddress: config.vaultAddress,
    account: config.account,
    nodeUrl: config.nodeUrl
});
registerTools(server, vaultClient);

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
app.set("name", "Pricer");

export default app;
