import type {
  AgentRunResult,
  AgentStatus,
  AgentTask,
} from "@/lib/agent/runtime/types";

function createTrace(
  agent: string,
  status: AgentStatus,
  startedAt: Date,
  finishedAt: Date,
  error?: unknown,
) {
  return {
    agent,
    status,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    error:
      error instanceof Error
        ? error.message
        : error
          ? String(error)
          : undefined,
  };
}

export async function runAgent<T>({
  name,
  run,
  fallback,
  fallbackWhen,
}: AgentTask<T>): Promise<AgentRunResult<T>> {
  const startedAt = new Date();

  try {
    const value = await run();
    const finishedAt = new Date();

    return {
      value,
      trace: createTrace(
        name,
        fallbackWhen?.(value) ? "fallback" : "success",
        startedAt,
        finishedAt,
      ),
    };
  } catch (error) {
    if (!fallback) {
      const finishedAt = new Date();
      console.error("Agent execution failed", { agent: name, error });

      throw Object.assign(
        new Error(`Agent ${name} failed.`),
        {
          cause: error,
          trace: createTrace(
            name,
            "error",
            startedAt,
            finishedAt,
            error,
          ),
        },
      );
    }

    const value = await fallback();
    const finishedAt = new Date();

    console.error("Agent used fallback", { agent: name, error });

    return {
      value,
      trace: createTrace(
        name,
        "fallback",
        startedAt,
        finishedAt,
        error,
      ),
    };
  }
}
