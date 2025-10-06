# Hypermover Financial Agents (Unified)

A unified Model Context Protocol (MCP) server that combines Executive, Market Analyzer, and Pricer into a single service, plus a Python client that orchestrates workflows.

- Unified MCP server: `Executive` (port 5000)
- Client: `Client` (Python, CrewAI), connects to the unified server
- Analyzer and Pricer sources merged under `Executive/src/analyzer` and `Executive/src/pricer`

## Requirements
- Node.js 20+ (tested with Node 22)
- npm 8+
- Python 3.10+

## Setup
1) Install Node dependencies for the unified server:
```bash
npm --prefix Executive install
```

2) Install Python dependencies for the client:
```bash
pip install -r Client/requirements.txt
```

3) Configure environment (optional but recommended):
Create a `.env` in repo root or export env vars before running `Executive`:
```bash
# Required for signing transactions
AGENT_ACCOUNT=0xYOUR_APTOS_ACCOUNT_HEX
AGENT_PRIVATE_KEY=0xYOUR_ED25519_PRIVATE_KEY_HEX

# Optional
BOT_API_URL=http://localhost:8001
```
Notes:
- If `AGENT_PRIVATE_KEY` is not set, the server will start using an ephemeral account. Read-only tools will work, but any signing operations will fail.

## Run the Unified Server
- Development (TypeScript):
```bash
npm --prefix Executive run dev
```

- Production build:
```bash
npm --prefix Executive run build
npm --prefix Executive start
```
The MCP server listens on: `http://localhost:5000/mcp`.

## Quick Test (MCP via PowerShell on Windows)
Initialize a session and list tools using a persistent session ID:
```powershell
$init = @{jsonrpc='2.0'; id=1; method='initialize'; params=@{capabilities=@{}}} | ConvertTo-Json -Compress
$r1 = Invoke-WebRequest -UseBasicParsing -Uri http://localhost:5000/mcp -Method POST -ContentType 'application/json' -Body $init
$sid = $r1.Headers['mcp-session-id']

$list = @{jsonrpc='2.0'; id=2; method='tools/list'} | ConvertTo-Json -Compress
$r2 = Invoke-WebRequest -UseBasicParsing -Uri http://localhost:5000/mcp -Method POST -Headers @{'mcp-session-id'=$sid} -ContentType 'application/json' -Body $list
$r2.Content
```

## Run the Client
The client already targets the unified server at `http://localhost:5000/mcp`.
```bash
python Client/main.py
```
It will orchestrate research, pricing, and execution using the combined toolset.

## Project Layout (key files)
- `Executive/src/server/unified-server.ts` – Unified MCP server wiring
- `Executive/src/core/tools/index.ts` – Executive tools
- `Executive/src/analyzer/...` – Analyzer client and tools
- `Executive/src/pricer/...` – Pricer client and tools
- `Executive/src/services/config.ts` – Network and addresses
- `Client/main.py` – CrewAI client using MCP tools

## Available Tools (high level)
- Executive: move assets between vault and wallet, place/cancel orders, start/stop/modify market maker bot, get bot status
- Analyzer: get_supported_markets, get_orderbook, get_best_bid/ask/order, check_available_funds, get_market_overview, format/parse symbol, get_settlement_health
- Pricer: fetch_vault_balance, fetch_oracle_price, get_available_assets, get_user_share_balance

## Troubleshooting
- JSON parse error when calling `/mcp`: ensure your HTTP body is valid JSON. On Windows, prefer the PowerShell example above instead of quoting JSON inside `curl.exe`.
- "Hex string is too short" at startup: set `AGENT_PRIVATE_KEY` to a valid 0x-prefixed Ed25519 private key. Without it, the server falls back to an ephemeral account and signing operations will fail.
- Port conflicts: ensure nothing else is using port 5000, or change the port in `Executive/src/main.ts`.

## Notes
- Top-level `MarketAnalyzer` and `Pricer` packages were merged and removed. All their code now lives under `Executive/src/analyzer` and `Executive/src/pricer`.
