import UnifiedApp from "./server/unified-server.js";
async function main() {
    const mcp_servers = [UnifiedApp];
    mcp_servers.map((server, index) => {
        let port = 5000;
        server.listen(port, () => console.log(server.get("name") + " MCP server listening on :" + port));
    });
}
main().then(res => console.log("happening...", res)).catch(err => {
    console.log(err);
});
