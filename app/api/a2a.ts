// A2A protocol communication module
// This file provides a provider-agnostic function for sending a task to a remote A2A agent.

export interface SendA2ATaskParams {
  agentBaseUrl: string;
  skillId: string;
  taskId: string;
  messageText: string;
  sessionId?: string;
}

export interface A2AResponse {
  jsonrpc: string;
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export async function sendA2ATask({
  agentBaseUrl,
  skillId,
  taskId,
  messageText,
  sessionId,
}: SendA2ATaskParams): Promise<A2AResponse> {
  const url = `${agentBaseUrl}/rpc`;
  const payload = {
    jsonrpc: "2.0",
    id: `a2a-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    method: "tasks/send",
    params: {
      id: taskId,
      sessionId,
      message: {
        role: "user",
        parts: [{ type: "text", text: messageText }],
      },
    },
  };
  console.log('[A2A] Sending request to', url, 'with payload:', JSON.stringify(payload));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[A2A] HTTP error: ${response.status} ${response.statusText}`, errorText);
      return {
        jsonrpc: "2.0",
        id: payload.id,
        error: {
          code: response.status,
          message: `A2A HTTP error: ${response.status} - ${errorText}`,
        },
      };
    }
    const responseData = await response.json();
    console.log('[A2A] Received response:', JSON.stringify(responseData));
    return responseData;
  } catch (err) {
    console.error('[A2A] Error:', err);
    return {
      jsonrpc: "2.0",
      id: payload.id,
      error: {
        code: -32000,
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }
} 