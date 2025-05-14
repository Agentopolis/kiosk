// TypeScript interface for AgentCard (A2A schema, simplified for text-only outputMode)
export interface AgentCard {
  name: string;
  url: string;
  version: string;
  capabilities: {
    streaming?: boolean;
    pushNotifications?: boolean;
    stateTransitionHistory?: boolean;
  };
  skills: AgentSkill[];
  description?: string | null;
  provider?: AgentProvider | null;
  documentationUrl?: string | null;
  authentication?: AgentAuthentication | null;
  defaultInputModes?: string[];
  defaultOutputModes?: string[];
}

export interface AgentSkill {
  id: string;
  name: string;
  description?: string | null;
  tags?: string[] | null;
  examples?: string[] | null;
  inputModes?: string[] | null;
  outputModes?: string[] | null;
}

export interface AgentProvider {
  organization: string;
  url?: string | null;
}

export interface AgentAuthentication {
  schemes: string[];
  credentials?: string | null;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: object;
  // agentUrl and skillId are now only for client-side mapping, not sent to server
  a2aAgent: {
    agentBaseUrl: string;
    skillId: string;
    taskId: string;
    // sessionId?: string; // Add if you have session info
  };
}

const AGENT_REGISTRY_KEY = "a2a_agent_registry";

export function getRegisteredAgents(): AgentCard[] {
  const data = localStorage.getItem(AGENT_REGISTRY_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as AgentCard[];
  } catch {
    return [];
  }
}

export function addAgent(agent: AgentCard): void {
  const agents = getRegisteredAgents();
  // Prevent duplicates by URL
  const filtered = agents.filter(a => a.url !== agent.url);
  filtered.push(agent);
  localStorage.setItem(AGENT_REGISTRY_KEY, JSON.stringify(filtered));
}

export function removeAgent(url: string): void {
  const agents = getRegisteredAgents();
  const filtered = agents.filter(a => a.url !== url);
  localStorage.setItem(AGENT_REGISTRY_KEY, JSON.stringify(filtered));
}

export function getAgentByUrl(url: string): AgentCard | undefined {
  return getRegisteredAgents().find(a => a.url === url);
}

export async function fetchAgentCard(baseUrl: string): Promise<AgentCard> {
  const agentCardUrl = `${baseUrl.replace(/\/$/, "")}/.well-known/agent.json`;
  const response = await fetch(agentCardUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch agent card from ${agentCardUrl}`);
  }
  const card = await response.json();
  // Optionally: validate card structure here
  return card as AgentCard;
}

// Helper to generate a valid OpenAI tool name
function makeToolName(agentName: string, skillId: string): string {
  // Only letters, numbers, underscores, dashes
  const safeAgent = agentName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeSkill = skillId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${safeAgent}_${safeSkill}`;
}

// Returns the tools config for the server (OpenAI-compatible)
export function agentRegistryToToolsConfig(agents: AgentCard[]): Record<string, ToolDefinition> {
  const tools: Record<string, ToolDefinition> = {};
  for (const agent of agents) {
    for (const skill of agent.skills) {
      if (
        (skill.inputModes?.includes("text") ?? true) &&
        (skill.outputModes?.includes("text") ?? true)
      ) {
        const toolName = makeToolName(agent.name, skill.id);
        tools[toolName] = {
          name: toolName,
          description: skill.description || skill.name,
          parameters: {
            type: "object",
            properties: {
              input: {
                type: "string",
                description: `Text input for skill '${skill.name}' of agent '${agent.name}'`,
              },
            },
            required: ["input"],
          },
          a2aAgent: {
            agentBaseUrl: agent.url,
            skillId: skill.id,
            taskId: skill.id, // Placeholder: use skill.id as taskId if no better value
            // sessionId: undefined, // Add if you have session info
          },
        };
      }
    }
  }
  // Debug log
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.log("[A2A] Tools config sent to server:", tools);
  }
  return tools;
}

// Returns a mapping from tool name to { agentUrl, skillId } for client-side routing
export function getAgentSkillMap(agents: AgentCard[]): Record<string, { agentUrl: string; skillId: string }> {
  const map: Record<string, { agentUrl: string; skillId: string }> = {};
  for (const agent of agents) {
    for (const skill of agent.skills) {
      if (
        (skill.inputModes?.includes("text") ?? true) &&
        (skill.outputModes?.includes("text") ?? true)
      ) {
        const toolName = makeToolName(agent.name, skill.id);
        map[toolName] = {
          agentUrl: agent.url,
          skillId: skill.id,
        };
      }
    }
  }
  // Debug log
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.log("[A2A] Tool name to agent/skill map:", map);
  }
  return map;
} 