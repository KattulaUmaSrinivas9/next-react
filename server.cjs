process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: "CommonJS", moduleResolution: "Node" });
process.env.TS_NODE_EXPERIMENTAL_RESOLVER = "true";
require("ts-node/register/transpile-only");
require("./server.ts");

