"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import LogoutButton from "@/components/auth/LogoutButton";
import DreamCardGallery from "@/components/memory/DreamCardGallery";
import MemorySearch from "@/components/memory/MemorySearch";
import MemoryTimeline from "@/components/memory/MemoryTimeline";
import { groupTimeline, rankDreams } from "@/components/memory/memoryUtils";
import type { GeneratedDream } from "@/types/dream";

type DreamsResponse = { dreams: GeneratedDream[] };
type MemoryView = "cards" | "timeline";

export default function MemoryExplorer({
  initialView = "cards",
}: {
  initialView?: MemoryView;
}) {
  const [dreams, setDreams] = useState<GeneratedDream[]>([]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<MemoryView>(initialView);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDreams() {
      try {
        const response = await fetch("/api/dreams", { cache: "no-store" });
        const data = (await response.json()) as DreamsResponse | { error?: string };
        if (!response.ok) {
          throw new Error(
            "error" in data && data.error
              ? data.error
              : "Could not open dream memory.",
          );
        }
        const loaded = "dreams" in data ? data.dreams : [];
        setDreams(
          [...loaded].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Something interrupted the archive.",
        );
      } finally {
        setLoading(false);
      }
    }
    void loadDreams();
  }, []);

  const ranked = useMemo(() => rankDreams(dreams, query), [dreams, query]);
  const visibleDreams = ranked.map(({ dream }) => dream);
  const timelineGroups = useMemo(() => groupTimeline(ranked), [ranked]);

  return (
    <main className="relative min-h-screen w-full min-w-0 overflow-hidden bg-[#03050d] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[url('/dream-atlas-galaxy-v2.webp')] bg-cover bg-center opacity-20" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(3,5,13,.72),#03050d_66%)]" />

      <div className="relative z-10 mx-auto max-w-[1500px] px-5 pb-20 pt-6 sm:px-8">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-white/64 transition hover:text-white"
          >
            <span>✦</span> Dream Atlas
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/preserve"
              className="rounded-full border border-white/14 bg-white/[0.045] px-3 py-3 text-[10px] uppercase tracking-[0.18em] text-white/64 transition hover:border-white/30 hover:text-white sm:px-5 sm:tracking-[0.22em]"
            >
              Preserve a dream
            </Link>

            <LogoutButton />
          </div>
        </header>

        <section className="pb-10 pt-20 text-center sm:pt-24">
          <p className="text-[10px] uppercase tracking-[0.38em] text-slate-200/42">
            Dream Cards
          </p>
          <h1 className="mt-5 font-serif text-4xl tracking-[-0.035em] sm:text-6xl">
            Your memory, preserved.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/40">
            The Atlas reveals relationships. Dream Cards hold each memory long
            enough for you to return.
          </p>
        </section>

        <div className="mx-auto max-w-3xl">
          <MemorySearch value={query} onChange={setQuery} />
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-5 border-b border-white/[0.08] pb-4">
          <div className="flex gap-8">
            {(["cards", "timeline"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setView(item)}
                className={`text-[10px] uppercase tracking-[0.27em] transition ${
                  view === item
                    ? "text-slate-100"
                    : "text-white/28 hover:text-white/60"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <section className="mt-8">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} />
          ) : ranked.length === 0 ? (
            <EmptyState hasQuery={Boolean(query)} onClear={() => setQuery("")} />
          ) : view === "cards" ? (
            <DreamCardGallery dreams={visibleDreams} />
          ) : (
            <MemoryTimeline groups={timelineGroups} />
          )}
        </section>

        <footer className="mt-16 border-t border-white/[0.06] pt-6 text-center text-xs text-white/25">
          You do not have to remember everything. Follow what returns.
        </footer>
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <div className="py-24 text-center text-sm text-white/35">
      <span className="mr-3 inline-block h-2 w-2 animate-pulse rounded-full bg-slate-100 shadow-[0_0_16px_rgba(248,250,252,.7)]" />
      Opening the archive...
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-red-300/15 bg-red-950/25 p-5 text-center text-sm text-red-100/80">
      {message}
    </div>
  );
}

function EmptyState({
  hasQuery,
  onClear,
}: {
  hasQuery: boolean;
  onClear: () => void;
}) {
  return (
    <div className="py-24 text-center">
      <p className="font-serif text-3xl text-white/65">
        {hasQuery ? "No echo answered." : "The first card is still waiting."}
      </p>
      {hasQuery ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 text-xs text-slate-200/55 hover:text-white"
        >
          Return to all memories
        </button>
      ) : (
        <Link href="/preserve" className="mt-5 inline-block text-xs text-slate-200/55 hover:text-white">
          Preserve your first dream →
        </Link>
      )}
    </div>
  );
}
