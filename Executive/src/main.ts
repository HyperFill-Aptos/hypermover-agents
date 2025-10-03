import ExecutiveApp from "./server/server.js";

async function main() {
    const mcp_servers = [ExecutiveApp];
    mcp_servers.map((server, index) => {
        let port = (index + 4) * 1000;
        server.listen(port, () => console.log(server.get("name") + " MCP server listening on :" + port));
    });
}

main().then(res => console.log("happening...", res)).catch(err => {
    console.log(err);
});
