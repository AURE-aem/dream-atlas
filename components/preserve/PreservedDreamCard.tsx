import Link from "next/link";

import DreamNarration from "@/components/memory/DreamNarration";
import type { GeneratedDream } from "@/types/dream";

type Props = {
  dream: GeneratedDream;
  onRestart: () => void;
};

export default function PreservedDreamCard({ dream, onRestart }: Props) {
  return (
    <section className="min-h-screen px-5 pb-20 pt-28 sm:px-8 sm:pt-32">
      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <p className="text-[10px] uppercase tracking-[0.38em] text-slate-200/50">
            Memory preserved
          </p>
          <h1 className="mt-6 font-serif text-4xl tracking-[-0.025em] sm:text-6xl">
            {dream.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/42">
            This memory now has a place in your Atlas. Its details remain
            yours; the system only holds what returned.
          </p>
        </header>

        <article className="relative mt-12 overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#080b16]/76 p-7 shadow-[0_35px_120px_rgba(0,0,0,.5)] backdrop-blur-xl sm:p-10">
          <div className="pointer-events-none absolute right-[-6rem] top-[-8rem] h-72 w-72 rounded-full bg-violet-300/[0.07] blur-3xl" />
          <div className="relative">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/32">
              Dream Card · {formatDate(dream.createdAt)}
            </p>
            <div className="mt-7">
              <DreamNarration
                narration={dream.narration}
                originalDream={dream.originalDream}
                compact
              />
            </div>

            {dream.recurringSymbols.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {dream.recurringSymbols.map(({ symbol }) => (
                  <span
                    key={symbol}
                    className="rounded-full border border-slate-100/12 bg-slate-100/[0.045] px-4 py-2 text-xs capitalize text-slate-100/60"
                  >
                    {symbol}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-10 grid gap-4 border-t border-white/[0.08] pt-8 md:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-5">
                <p className="text-[9px] uppercase tracking-[0.28em] text-white/30">
                  Memory echo
                </p>
                <p className="mt-3 text-sm leading-7 text-white/52">
                  {dream.memoryContext?.summary ??
                    "No earlier memory shares these fragments yet."}
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-5">
                <p className="text-[9px] uppercase tracking-[0.28em] text-white/30">
                  {dream.constellation
                    ? dream.constellation.type === "new_constellation"
                      ? "New constellation"
                      : "Constellation strengthened"
                    : "Atlas position"}
                </p>
                <p className="mt-3 font-serif text-lg text-slate-100/78">
                  {dream.constellation?.constellationName ??
                    "A solitary star—for now"}
                </p>
                <p className="mt-2 text-xs leading-6 text-white/38">
                  {dream.constellation?.summary ??
                    "Its paths will appear when a motif returns in another memory."}
                </p>
              </div>
            </div>

            {dream.reflectionQuestions?.length ? (
              <div className="mt-9 border-t border-white/[0.08] pt-8">
                <p className="text-[9px] uppercase tracking-[0.28em] text-white/30">
                  Questions to return with
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {dream.reflectionQuestions.map((question, index) => (
                    <p
                      key={question}
                      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm leading-6 text-white/48"
                    >
                      <span className="mr-2 text-slate-200/30">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {question}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </article>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={`/?new=${encodeURIComponent(dream.id)}`}
            prefetch={false}
            className="rounded-full bg-slate-50 px-8 py-4 text-center text-sm font-medium text-slate-950 transition hover:scale-[1.02] hover:bg-white"
          >
            See it become a star <span className="ml-2">→</span>
          </Link>
          <Link
            href={`/dreams/${dream.id}`}
            prefetch={false}
            className="rounded-full border border-white/14 bg-white/[0.035] px-8 py-4 text-center text-sm text-white/68 transition hover:border-white/30 hover:text-white"
          >
            Read Dream Memory
          </Link>
          <button
            type="button"
            onClick={onRestart}
            className="px-5 py-4 text-sm text-white/32 transition hover:text-white/70"
          >
            Preserve another
          </button>
        </div>
      </div>
    </section>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
