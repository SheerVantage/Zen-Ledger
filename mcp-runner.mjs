import { spawn } from 'child_process';

const mcpUrl = "https://stitch.googleapis.com/mcp";
const apiKey = "\"X-Goog-Api-Key: AQ.Ab8RN6J25LwvMJOw-dk4qnfVBxr_H5xV7Qsdx4XrKBgf7puciQ\"";

const child = spawn("npx.cmd", ["-y", "mcp-remote", mcpUrl, "--header", apiKey], {
  stdio: ['pipe', 'pipe', 'inherit'],
  shell: true
});

child.stdout.on('data', (data) => {
  const messages = data.toString().split('\n').filter(l => l.trim().length > 0);
  for (const msg of messages) {
    try {
      const parsed = JSON.parse(msg);
      if (parsed.id === 1) {
         console.log("Initialized!");
         // send tool call
         const toolCall = {
           jsonrpc: "2.0",
           id: 2,
           method: "tools/call",
           params: {
             name: "list_projects",
             arguments: {}
           }
         };
         child.stdin.write(JSON.stringify(toolCall) + "\n");
      } else if (parsed.id === 2) {
         console.log("Projects:", JSON.stringify(parsed.result, null, 2));
         process.exit(0);
      } else {
        console.log("Other msg:", msg);
      }
    } catch(e) {
      console.log("Raw output:", msg);
    }
  }
});

const initMsg = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "antigravity", version: "1.0.0" }
  }
};

child.stdin.write(JSON.stringify(initMsg) + "\n");

setTimeout(() => {
  console.log("Timeout reached.");
  process.exit(1);
}, 10000);
