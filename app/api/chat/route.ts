import { openai } from "@ai-sdk/openai";
import { jsonSchema, streamText } from "ai";
import { sendA2ATask } from "../a2a";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    console.log("[A2A] Received /api/chat request");
    const { messages, system, tools } = await req.json();
    // Log incoming tools
    console.log("[A2A] Incoming tools payload:", tools);

    const effectiveSystem =
      "You are a helpful assistant specialized for Hair Salon queries. " +
      "When the user asks anything about the salon, its services, prices or durations, you MUST call the function tool `get_info`. " +
      "Pass the user's question as the `question` argument. The tool will return a JSON object like { \"info\": string } containing the raw answer from the salon system. " +
      "After receiving the tool result, respond to the user with a friendly, concise answer derived from the \"info\" field and DO NOT repeat the entire JSON.";
    // Build backend tools dynamically for every tool that carries an a2aAgent block
    const backendTools: Record<string, { description?: string; parameters: object; execute: (args: Record<string, unknown>) => Promise<unknown> }> = {};

    for (const [toolName, toolConfigRaw] of Object.entries(tools ?? {})) {
      const toolConfig = toolConfigRaw as {
        description?: string;
        parameters: object;
        a2aAgent?: {
          agentBaseUrl: string;
          skillId: string;
          taskId: string;
          sessionId?: string;
        };
      };

      if (!toolConfig.a2aAgent) continue; // skip non-A2A tools

      const { agentBaseUrl, skillId, taskId, sessionId } = toolConfig.a2aAgent;

      backendTools[toolName] = {
        description: toolConfig.description,
        parameters: jsonSchema(toolConfig.parameters),
        async execute(args: Record<string, unknown>) {
          console.log(`[A2A] Executing tool '${toolName}' with args`, args);

          // Pass the entire args object as JSON string for messageText by default
          const messageText = JSON.stringify(args);

          const a2aResult = await sendA2ATask({
            agentBaseUrl,
            skillId,
            taskId,
            sessionId,
            messageText,
          });

          console.log(`[A2A] Result from '${toolName}':`, a2aResult);

          if (a2aResult.error) throw new Error(a2aResult.error.message);

          // Try to extract first text part
          type TextPart = { type: string; text?: string };
          const parts: unknown = (a2aResult as { result?: unknown }).result &&
            (a2aResult.result as { status?: unknown }).status &&
            ((a2aResult.result as { status: { message?: unknown } }).status.message as { parts?: unknown }).parts;

          const firstText = Array.isArray(parts)
            ? (parts as TextPart[]).find((p) => p.type === "text")?.text
            : undefined;

          const agentMessage = firstText ?? JSON.stringify(a2aResult.result);

          return { info: agentMessage };
        },
      };
    }

    console.log("[A2A] Inputs to streamText - messages:", JSON.stringify(messages));
    console.log("[A2A] Inputs to streamText - system:", effectiveSystem);
    console.log("[A2A] Inputs to streamText - backendTools:", JSON.stringify(backendTools));

    // Log the tools object that will be sent to the AI SDK (the SDK will automatically
    // strip the execute handlers before sending to the language model).
    console.log("[A2A] Tools passed to model:", JSON.stringify(
      Object.fromEntries(
        Object.entries(backendTools).map(([name, t]) => [
          name,
          { description: t.description, parameters: t.parameters },
        ]),
      ),
    ));

    const result = streamText({
      model: openai("gpt-4o"),
      messages,
      toolCallStreaming: true,
      system: effectiveSystem,
      tools: backendTools,
    });

    // Convert to Edge Response and return directly so that the UI receives the
    // full, unconsumed stream.
    return result.toDataStreamResponse();
  } catch (err) {
    console.error("[A2A] Error in /api/chat:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
