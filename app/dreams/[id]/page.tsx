import Link from "next/link";
import { notFound } from "next/navigation";

import DreamNarration from "@/components/memory/DreamNarration";
import { getDreamDisplayTitle } from "@/components/memory/memoryUtils";
import DreamMemoryBoard from "@/components/memory/DreamMemoryBoard";
import { constellationRepository } from "@/lib/constellation/fileRepository";
import { dreamRepository } from "@/lib/dream/fileRepository";
import {
  createPlayfulInterpretationFallback,
  rankRecurringMotifs,
} from "@/lib/dream/motifs";

export const dynamic = "force-dynamic";

export default async function DreamMemoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dream = await dreamRepository.findById(id).catch(() => null);

  if (!dream) {
    notFound();
  }

  const [constellations, allDreams] = await Promise.all([
    constellationRepository.findAll(),
    dreamRepository.findAll(),
  ]);
  const constellation =
    constellations.find((item) => item.id === dream.constellationId) ??
    constellations.find((item) => item.dreamIds.includes(dream.id));
  const relatedIds = new Set([
    ...(constellation?.dreamIds ?? []),
    ...(dream.memoryContext?.relatedDreamIds ?? []),
  ]);
  relatedIds.delete(dream.id);

  const relatedDreams = Array.from(relatedIds)
    .map((dreamId) => allDreams.find((item) => item.id === dreamId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 4);
  const chronologicalDreams = [...allDreams].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );
  const memoryNumber =
    chronologicalDreams.findIndex((item) => item.id === dream.id) + 1;
  const title = getDreamDisplayTitle(dream);
  const playfulInterpretation =
    dream.playfulInterpretation ??
    createPlayfulInterpretationFallback(
      rankRecurringMotifs({
        currentSymbols: dream.recurringSymbols,
        previousDreams: allDreams.filter((item) => item.id !== dream.id),
      }),
    );

  return (
    <main className="relative h-[100svh] w-full min-w-0 overflow-hidden bg-[#03050d] text-white">
      <div className="pointer-events-none fixed -inset-10 bg-[url('/dream-atlas-galaxy-v2.webp')] bg-cover bg-[center_top] opacity-50" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_68%_24%,rgba(139,92,246,.12),transparent_26%),linear-gradient(180deg,rgba(3,5,13,.36)_0%,rgba(3,5,13,.78)_58%,#03050d_100%)]" />

      <DreamMemoryBoard>
      <div className="relative mx-auto max-w-[1320px] px-5 pb-14 pt-6 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between gap-4">
          <Link
            href="/dreams"
            className="text-[10px] uppercase tracking-[0.27em] text-white/48 transition hover:text-white"
          >
            ← Dream Cards
          </Link>
          <Link
            href={`/?selected=${encodeURIComponent(dream.id)}`}
            className="rounded-full border border-white/14 bg-white/[0.04] px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-white/64 backdrop-blur-md transition hover:border-white/32 hover:bg-white/[0.08] hover:text-white"
          >
            Find in Atlas
          </Link>
        </nav>

        <section className="grid items-center gap-7 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-10 lg:py-10">
          <header className="max-w-5xl">
            <p className="text-[10px] uppercase tracking-[0.38em] text-slate-200/48">
              Dream Memory {String(Math.max(memoryNumber, 1)).padStart(2, "0")}
              <span className="mx-3 text-white/18">·</span>
              {formatDate(dream.createdAt)}
            </p>
            <h1 className="mt-5 max-w-5xl font-serif text-4xl leading-[1.01] tracking-[-0.04em] text-white sm:text-6xl lg:text-[4.6rem]">
              {title}
            </h1>
            {dream.observation && (
              <p className="mt-5 max-w-3xl text-[15px] leading-7 text-white/52 sm:text-base">
                {dream.observation}
              </p>
            )}
            <p className="mt-3 text-xs leading-6 text-white/30">
              A gentle observation drawn from this memory—not a meaning assigned
              to it.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={`/?selected=${encodeURIComponent(dream.id)}`}
                data-testid="dream-memory-find-in-atlas"
                className="rounded-full bg-slate-50 px-7 py-3.5 text-sm font-medium text-slate-950 transition hover:scale-[1.02] hover:bg-white"
              >
                See its place in the Atlas <span className="ml-2">→</span>
              </Link>
              <Link
                href="/preserve"
                className="rounded-full border border-white/14 bg-white/[0.035] px-7 py-3.5 text-sm text-white/64 backdrop-blur-md transition hover:border-white/30 hover:text-white"
              >
                Preserve another
              </Link>
            </div>
          </header>

          <div className="relative mx-auto hidden aspect-square w-full max-w-[17rem] items-center justify-center lg:flex">
            <div className="absolute inset-[8%] rounded-full bg-violet-300/[0.055] blur-3xl" />
            <svg
              viewBox="0 0 360 360"
              className="relative h-full w-full overflow-visible"
              role="img"
              aria-label={`${relatedDreams.length} memories connected to this dream`}
            >
              <defs>
                <radialGradient id="memoryStar">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="55%" stopColor="#f5f3ff" />
                  <stop offset="100%" stopColor="#c4b5fd" />
                </radialGradient>
                <filter id="memoryGlow" x="-300%" y="-300%" width="600%" height="600%">
                  <feGaussianBlur stdDeviation="7" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {relatedDreams.slice(0, 4).map((related, index) => {
                const points = [
                  { x: 72, y: 92 },
                  { x: 292, y: 76 },
                  { x: 302, y: 278 },
                  { x: 68, y: 286 },
                ];
                const point = points[index];

                return (
                  <g key={related.id}>
                    <line
                      x1="180"
                      y1="180"
                      x2={point.x}
                      y2={point.y}
                      stroke="rgba(221,214,254,.46)"
                      strokeWidth="0.8"
                      filter="url(#memoryGlow)"
                    />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="3"
                      fill="rgba(248,250,252,.9)"
                      filter="url(#memoryGlow)"
                    />
                  </g>
                );
              })}
              <circle
                cx="180"
                cy="180"
                r="48"
                fill="rgba(196,181,253,.045)"
                stroke="rgba(221,214,254,.24)"
                strokeWidth="0.7"
              />
              <circle
                cx="180"
                cy="180"
                r="23"
                fill="rgba(248,250,252,.04)"
                stroke="rgba(248,250,252,.48)"
                strokeWidth="0.8"
              />
              <path
                d="M180 151 L184 176 L208 180 L184 184 L180 209 L176 184 L152 180 L176 176 Z"
                fill="url(#memoryStar)"
                filter="url(#memoryGlow)"
              />
            </svg>
            <div className="absolute bottom-4 left-1/2 w-full -translate-x-1/2 text-center">
              <p className="text-[9px] uppercase tracking-[0.32em] text-white/30">
                {relatedDreams.length
                  ? `${relatedDreams.length} connected ${relatedDreams.length === 1 ? "memory" : "memories"}`
                  : "A solitary star—for now"}
              </p>
              {constellation && (
                <p className="mt-3 font-serif text-xl text-white/68">
                  {constellation.name}
                </p>
              )}
            </div>
          </div>
        </section>

        <section
          className="mb-6 overflow-hidden rounded-[2rem] border border-white/[0.09] bg-[#080b16]/58 px-6 py-6 shadow-[0_24px_90px_rgba(0,0,0,.24)] backdrop-blur-xl sm:px-8 lg:grid lg:grid-cols-[1.25fr_repeat(3,1fr)] lg:gap-0 lg:py-7"
          aria-labelledby="memory-origin-title"
        >
          <div className="pb-6 lg:pr-8 lg:pb-0">
            <SectionLabel>Follow the trace</SectionLabel>
            <h2
              id="memory-origin-title"
              className="mt-3 font-serif text-2xl leading-tight text-white/82"
            >
              How this dream
              <br />
              became a star
            </h2>
          </div>
          <OriginStep
            number="01"
            title="You remembered"
            description="Your original fragment stays intact, in your own words."
          />
          <OriginStep
            number="02"
            title="The memory took shape"
            description="AI gave it a title and gentle retelling—without deciding what it means."
          />
          <OriginStep
            number="03"
            title="A trace returned"
            description="The Atlas compared motifs with earlier dreams. Repeated details create paths."
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
          <article className="relative overflow-hidden rounded-[2.25rem] border border-white/[0.1] bg-[#080b16]/76 p-7 shadow-[0_40px_140px_rgba(0,0,0,.52)] backdrop-blur-xl sm:p-9 lg:p-10">
            <div className="pointer-events-none absolute right-[-7rem] top-[-9rem] h-80 w-80 rounded-full bg-violet-300/[0.07] blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-4">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/12" />
                <span className="text-xl text-slate-100/78 drop-shadow-[0_0_15px_rgba(248,250,252,.65)]">
                  ✦
                </span>
                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/12" />
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                <SectionLabel>The heart of this Dream Memory</SectionLabel>
                <OriginTag>Core quoted exactly · never rewritten</OriginTag>
              </div>
              <div className="mt-5">
                <DreamNarration
                  narration={dream.narration}
                  originalDream={dream.originalDream}
                />
              </div>
            </div>
          </article>

          <aside className="space-y-4">
            <section className="rounded-[2rem] border border-white/[0.09] bg-[#080b16]/68 p-6 shadow-[0_30px_90px_rgba(0,0,0,.3)] backdrop-blur-xl">
              <SectionLabel>What returned</SectionLabel>
              <SourceLine>
                Compared with {Math.max(allDreams.length - 1, 0)} earlier{" "}
                {allDreams.length === 2 ? "memory" : "memories"}
              </SourceLine>
              <p className="mt-5 font-serif text-2xl leading-8 text-white/78">
                {constellation?.name ?? "A solitary star—for now"}
              </p>
              <p className="mt-4 text-sm leading-7 text-white/44">
                {constellation?.summary ??
                  dream.memoryContext?.summary ??
                  "No earlier memory shares these fragments yet."}
              </p>
            </section>

            {dream.recurringSymbols.length > 0 && (
              <section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-lg">
                <SectionLabel>Traces in this dream</SectionLabel>
                <SourceLine>Details noticed in your original fragment</SourceLine>
                <div className="mt-5 flex flex-wrap gap-2">
                  {dream.recurringSymbols.map(({ symbol }) => (
                    <Link
                      key={symbol}
                      href={`/?symbol=${encodeURIComponent(symbol)}`}
                      className="rounded-full border border-white/[0.1] px-3 py-2 text-xs capitalize text-white/50 transition hover:border-slate-100/28 hover:text-white"
                    >
                      {symbol}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {relatedDreams.length > 0 && (
              <section className="rounded-[2rem] border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-lg">
                <SectionLabel>Where these traces returned</SectionLabel>
                <SourceLine>Linked by shared motifs—not by interpretation</SourceLine>
                <div className="mt-4 divide-y divide-white/[0.07]">
                  {relatedDreams.map((related) => (
                    <Link
                      key={related.id}
                      href={`/dreams/${related.id}`}
                      className="group flex items-center justify-between gap-4 py-4 text-sm text-white/46 transition hover:text-white"
                    >
                      <span>{getDreamDisplayTitle(related)}</span>
                      <span className="text-white/20 transition group-hover:translate-x-1 group-hover:text-white/64">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </section>

        <section className="mt-6 grid gap-6 overflow-hidden rounded-[2.25rem] border border-violet-200/[0.12] bg-[linear-gradient(125deg,rgba(139,92,246,.1),rgba(8,11,22,.78)_45%)] p-7 shadow-[0_30px_100px_rgba(0,0,0,.34)] backdrop-blur-xl sm:p-9 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-center">
          <div>
            <SectionLabel>A fairy tale from what returned</SectionLabel>
            <SourceLine>Optional AI story · made from recurring motifs</SourceLine>
            <h2 className="mt-4 font-serif text-3xl leading-tight text-white/88">
              {playfulInterpretation.title}
            </h2>
            {playfulInterpretation.motifs.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {playfulInterpretation.motifs.map((motif) => (
                  <span
                    key={motif}
                    className="rounded-full border border-violet-100/[0.12] bg-violet-100/[0.045] px-3 py-1.5 text-[11px] capitalize text-violet-50/54"
                  >
                    {motif}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-white/[0.08] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="font-serif text-xl leading-[1.65] text-white/72 sm:text-2xl">
              {playfulInterpretation.text}
            </p>
            <p className="mt-5 text-[10px] uppercase tracking-[0.24em] text-white/28">
              A playful fairy-tale reflection · not a diagnosis
            </p>
          </div>
        </section>

        {dream.reflectionQuestions?.length ? (
          <section className="mx-auto max-w-6xl py-16">
            <div className="text-center">
              <SectionLabel>Questions to return with</SectionLabel>
              <h2 className="mt-5 font-serif text-4xl tracking-[-0.025em] text-white/90 sm:text-5xl">
                Leave a little space
                <br />
                around the memory.
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {dream.reflectionQuestions.map((question, index) => (
                <div
                  key={question}
                  className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.025] p-6 backdrop-blur-lg"
                >
                  <p className="text-[10px] text-slate-100/28">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-5 text-sm leading-7 text-white/58">
                    {question}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
      </DreamMemoryBoard>
    </main>
  );
}

function SectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-[10px] uppercase tracking-[0.3em] text-slate-100/36 ${className}`}
    >
      {children}
    </p>
  );
}

function OriginTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-slate-100/[0.1] bg-slate-100/[0.035] px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] text-slate-100/38">
      {children}
    </span>
  );
}

function SourceLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 text-[10px] leading-5 text-white/26">
      <span className="mr-2 text-slate-100/42">↳</span>
      {children}
    </p>
  );
}

function OriginStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative border-t border-white/[0.07] py-5 first-of-type:border-t-0 lg:border-l lg:border-t-0 lg:px-6 lg:py-0">
      <p className="text-[9px] tracking-[0.24em] text-slate-100/28">
        {number}
      </p>
      <h3 className="mt-3 font-serif text-lg text-white/72">{title}</h3>
      <p className="mt-2 text-xs leading-6 text-white/36">{description}</p>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
