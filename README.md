# Agentopolis Kiosk: A2A-Enabled Chat UI

This project is an advanced chat application from Agentopolis, built upon the [assistant-ui](https://github.com/Yonom/assistant-ui) chat application. It has been enhanced to support the Agent-to-Agent (A2A) protocol, allowing users to register and interact with remote A2A-compliant AI agents.

## Overview

The core functionality allows a user to interact with a primary client AI. This client AI can, in turn, discover and utilize the skills of other specialized AI agents that adhere to the A2A specification. This creates a powerful, extensible system where a local assistant can leverage a distributed network of agents for various tasks.

### Key Features

- **A2A Agent Registration:** Users can register A2A-compliant agents by providing their base URL. The application fetches the agent's "Agent Card" (typically found at `/.well-known/agent.json`) to learn about its capabilities and skills.
- **Local Agent Registry:** Registered agent details (Agent Cards) are stored in the browser's local storage, making them persistent for the user across sessions.
- **Dynamic Tool Invocation:** The client AI can dynamically use the skills of registered A2A agents as tools. When a user's query is best handled by a remote agent, the client AI will:
    1. Identify the appropriate A2A agent and skill from the local registry.
    2. Make an A2A protocol call (JSON-RPC `tasks/send`) to the remote agent's skill endpoint.
    3. Receive the result from the A2A agent.
    4. Incorporate the result into its response to the user.
- **Transparent Tool Use:** The UI provides feedback when a remote A2A agent is being called, showing the user that the client AI is working with another specialized agent.

## Getting Started

First, ensure you have an OpenAI API key, as the primary client AI uses an OpenAI model (e.g., GPT-4o). Add your key to a `.env.local` file in the root of the `downtown/chat` directory:

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Then, to run the development server (assuming you are in the `downtown/chat` directory):

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port specified, e.g., 3001) with your browser to see the result.

### Using A2A Agents

1.  **Register an A2A Agent:**
    *   In the chat interface, find the "Registered Agents" section in the sidebar.
    *   Click the "+" (Add Agent) button.
    *   Enter the base URL of an A2A-compliant agent (e.g., `https://a2a-demos.agentopolis.ai/hair-salon`).
    *   The application will fetch the agent card and ask for confirmation.
    *   Once confirmed, the agent and its skills will be available to your client AI.

2.  **Interact with the Client AI:**
    *   Chat normally with your client AI. If your query can be handled by a registered A2A agent's skill, the client AI should attempt to use it.
    *   For example, if you have registered the Hair Salon A2A agent, you can ask: "What services does the hair salon offer?"
    *   The UI should indicate when the A2A agent is being called.

## Technical Details

- **Frontend:** Built with Next.js and React, utilizing the `assistant-ui` library for the core chat interface.
- **A2A Communication:** Implemented in `downtown/chat/app/api/a2a.ts` for making A2A protocol calls.
- **Tool Handling:** The backend chat route (`downtown/chat/app/api/chat/route.ts`) processes tool calls from the primary AI, maps them to A2A agents, invokes the A2A call, and returns the result.
- **Agent Registry:** Managed in `downtown/chat/lib/agent-registry.ts` using browser local storage.
