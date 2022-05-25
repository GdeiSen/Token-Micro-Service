console.clear();
const { Agent } = require("./src/agent");
const agent = new Agent();
global.agent = agent;
agent.connect();
