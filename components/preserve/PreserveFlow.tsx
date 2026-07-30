"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useReducer, useRef } from "react";

import PreservationProgress from "@/components/preserve/PreservationProgress";
import PreserveInput from "@/components/preserve/PreserveInput";
import PreservedDreamCard from "@/components/preserve/PreservedDreamCard";
import type { AgentTraceEntry } from "@/lib/agent/runtime/types";
import {
  MIN_PRESERVATION_VISIBLE_MS,
  waitForMinimumDuration,
} from "@/lib/dream/preservation";
import type { GeneratedDream } from "@/types/dream";

type PreservedDream = GeneratedDream & {
  persisted: true;
  agentTrace?: AgentTraceEntry[];
  pipelineDurationMs?: number;
};

type State =
  | { step: "input"; fragment: string; error: string }
  | { step: "preserving"; fragment: string; error: string }
  | { step: "complete"; fragment: string; error: string; dream: PreservedDream };

type Action =
  | { type: "edit"; value: string }
  | { type: "submit" }
  | { type: "success"; dream: PreservedDream }
  | { type: "failure"; message: string }
  | { type: "restart" };

const initialState: State = { step: "input", fragment: "", error: "" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "edit":
      return { step: "input", fragment: action.value, error: "" };
    case "submit":
      return { step: "preserving", fragment: state.fragment, error: "" };
    case "success":
      return {
        step: "complete",
        fragment: state.fragment,
        error: "",
        dream: action.dream,
      };
    case "failure":
      return { step: "input", fragment: state.fragment, error: action.message };
    case "restart":
      return initialState;
  }
}

export default function PreserveFlow() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const requestRef = useRef<AbortController | null>(null);
  const submittingRef = useRef(false);

  useEffect(
    () => () => {
      requestRef.current?.abort();
    },
    [],
  );

  async function preserveDream() {
    const fragment = state.fragment.trim();
    if (!fragment || state.step === "preserving" || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    dispatch({ type: "submit" });
    const preservationStartedAt = performance.now();

    try {
      const response = await fetch("/api/dream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ dream: fragment }),
        signal: controller.signal,
      });
      const result = (await response.json()) as PreservedDream | { error?: string };
      if (!response.ok) {
        throw new Error(
          "error" in result && result.error
            ? result.error
            : "The memory could not be preserved.",
        );
      }
      if (!("persisted" in result) || result.persisted !== true) {
        throw new Error(
          "The Atlas could not confirm that the memory was preserved.",
        );
      }

      await waitForMinimumDuration({
        startedAt: preservationStartedAt,
        minimumDurationMs: MIN_PRESERVATION_VISIBLE_MS,
        signal: controller.signal,
      });

      if (!controller.signal.aborted) {
        dispatch({ type: "success", dream: result as PreservedDream });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      dispatch({
        type: "failure",
        message:
          error instanceof Error
            ? error.message
            : "Something interrupted the memory.",
      });
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
      submittingRef.current = false;
    }
  }

  return (
    <main className="relative min-h-screen w-full min-w-0 overflow-hidden bg-[#03050d] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[url('/dream-atlas-galaxy-v2.webp')] bg-cover bg-center opacity-35" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(15,23,42,.14),rgba(3,5,13,.78)_62%,#03050d_100%)]" />

      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 py-5 md:px-8 md:py-7">
        <Link
          href="/"
          prefetch={false}
          className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-white/62 transition hover:text-white"
        >
          <span>←</span> Dream Atlas
        </Link>
        <Link
          href="/dreams"
          prefetch={false}
          className="text-[10px] uppercase tracking-[0.24em] text-white/38 transition hover:text-white"
        >
          Dream Cards
        </Link>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={state.step}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative z-10"
        >
          {state.step === "input" && (
            <PreserveInput
              value={state.fragment}
              error={state.error}
              onChange={(value) => dispatch({ type: "edit", value })}
              onSubmit={preserveDream}
            />
          )}
          {state.step === "preserving" && (
            <PreservationProgress fragment={state.fragment} />
          )}
          {state.step === "complete" && (
            <PreservedDreamCard
              dream={state.dream}
              onRestart={() => dispatch({ type: "restart" })}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
