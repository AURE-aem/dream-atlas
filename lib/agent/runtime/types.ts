export type AgentStatus = "success" | "fallback" | "error";

export type AgentTraceEntry = {
  agent: string;
  status: AgentStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  error?: string;
};

export type AgentRunResult<T> = {
  value: T;
  trace: AgentTraceEntry;
};

export type AgentTask<T> = {
  name: string;
  run: () => Promise<T>;
  fallback?: () => T | Promise<T>;
  fallbackWhen?: (value: T) => boolean;
};
