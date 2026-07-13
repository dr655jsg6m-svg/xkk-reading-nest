import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 8787);
createApp().listen(port, () => {
  console.log(`xkk读到哪了 MCP server: http://localhost:${port}/mcp`);
});
