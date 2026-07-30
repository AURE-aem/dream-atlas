import Link from "next/link";

import DreamAtlas from "@/components/DreamAtlas";
import { buildAtlasGraph } from "@/lib/atlas/graph";
import { constellationRepository } from "@/lib/constellation/fileRepository";
import { dreamRepository } from "@/lib/dream/fileRepository";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    selected?: string;
    symbol?: string;
    new?: string;
  }>;
};

export default async function HomePage({ searchParams }: Props) {
  const { selected, symbol, new: newDreamId } = await searchParams;
  const [dreams, constellations] = await Promise.all([
    dreamRepository.findAll(),
    constellationRepository.findAll(),
  ]);
  const sortedDreams = [...dreams].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );
  const graph = buildAtlasGraph(sortedDreams, constellations);

  return (
    <main className="relative min-h-screen w-full min-w-0 overflow-x-clip bg-[#03050d] text-white">
      <div className="pointer-events-none absolute -inset-8 bg-[url('/dream-atlas-galaxy-v2.webp')] bg-cover bg-[center_top] opacity-95" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_48%,transparent_0%,rgba(3,5,13,0.06)_42%,rgba(3,5,13,0.58)_100%),linear-gradient(90deg,rgba(3,5,13,0.06)_0%,rgba(3,5,13,0.12)_60%,rgba(3,5,13,0.66)_100%)]" />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-50 flex items-center justify-between gap-3 px-4 py-5 sm:px-6 md:px-8 md:py-7">
        <Link
          href="/"
          className="pointer-events-auto flex shrink-0 items-center gap-2 text-[9px] uppercase tracking-[0.25em] text-white/78 transition hover:text-white sm:gap-3 sm:text-[11px] sm:tracking-[0.32em]"
        >
          <span className="text-slate-100">✦</span>
          Dream Atlas
        </Link>
        <nav className="pointer-events-auto flex min-w-0 items-center gap-2 text-[8px] uppercase tracking-[0.18em] text-white/42 sm:gap-5 sm:text-[10px] sm:tracking-[0.24em]">
          <Link href="/dreams" className="transition hover:text-white">
            Dream Cards
          </Link>
          <Link
            href="/dreams?view=timeline"
            className="shrink-0 rounded-full border border-white/15 bg-white/[0.06] px-3 py-2.5 text-white/70 backdrop-blur-md transition hover:border-white/35 hover:bg-white/[0.1] hover:text-white sm:px-4"
          >
            Timeline
          </Link>
        </nav>
      </header>

      <div className="atlas-landing-grid relative grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_clamp(20rem,24vw,25rem)]">
        <div
          className="atlas-landing-canvas order-2 min-w-0 lg:order-1"
          data-testid="atlas-landing-canvas"
        >
          <DreamAtlas
            graph={graph}
            selectedDreamId={selected}
            newDreamId={newDreamId}
            initialQuery={symbol}
          />
        </div>

        <aside
          className="atlas-landing-sidebar pointer-events-none relative z-20 order-1 flex min-h-[42rem] flex-col items-start overflow-hidden px-5 pb-8 pt-28 sm:min-h-[44rem] sm:px-9 sm:pb-9 sm:pt-32 lg:pointer-events-auto lg:order-2 lg:z-auto lg:min-h-screen lg:px-8 lg:pb-8 lg:pt-32"
          data-testid="atlas-landing-sidebar"
        >
          <div className="pointer-events-none absolute -inset-y-8 -left-40 right-0 bg-[linear-gradient(90deg,transparent_0%,rgba(3,5,13,.1)_20%,rgba(3,5,13,.46)_66%,rgba(3,5,13,.72)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_48%_38%,rgba(196,181,253,0.1),transparent_32%)]" />

          <div className="pointer-events-auto relative mx-auto w-full max-w-sm text-center lg:mx-0 lg:text-left">
            <p className="text-[10px] uppercase tracking-[0.36em] text-slate-200/45">
              A living map of your memory
            </p>
            <h1
              className="atlas-landing-heading mt-4 font-serif text-[2.35rem] leading-[1.05] tracking-[-0.035em] text-white sm:text-[2.8rem]"
              data-testid="atlas-landing-heading"
            >
              Your dreams
              <br />
              leave traces
              <span className="atlas-cosmic-ellipsis" aria-label="...">
                <span aria-hidden="true">•</span>
                <span aria-hidden="true">•</span>
                <span aria-hidden="true">•</span>
              </span>
            </h1>
            <p className="atlas-landing-copy mx-auto mt-4 max-w-[21rem] text-[13px] leading-6 text-white/48 lg:mx-0">
              Preserve one fragment and it becomes a star. When a place,
              feeling, or symbol returns, the Atlas draws a path back to it.
            </p>

            <Link
              href="/preserve"
              aria-label="Preserve your dream"
              className="atlas-cloud-cta group mx-auto mt-5 flex min-h-[12.75rem] w-full max-w-[18rem] flex-col items-center justify-center px-7 py-6 text-center lg:mx-0"
            >
              <span className="relative z-10 text-[9px] uppercase tracking-[0.3em] text-slate-100/48">
                Begin with what stayed
              </span>
              <span className="relative z-10 mt-3 font-serif text-[1.42rem] leading-[1.2] text-white/84">
                Preserve yours
                <br />
                in your Dream Atlas.
              </span>
              <span className="atlas-cta-star relative z-10 mt-3" aria-hidden="true">
                ✦
              </span>
              <span className="relative z-10 mt-2 border-b border-slate-100/18 pb-2 text-sm tracking-[0.01em] text-slate-100/70 transition group-hover:border-slate-100/55 group-hover:text-white">
                One fragment is enough <span className="ml-2">→</span>
              </span>
            </Link>
          </div>

          <div className="pointer-events-auto relative mt-auto w-full max-w-sm pt-7 text-center lg:text-left">
            <div className="mx-auto mb-4 h-px w-28 bg-gradient-to-r from-transparent via-slate-100/24 to-transparent lg:mx-0" />
            <p
              className="text-[9px] uppercase tracking-[0.22em] text-slate-100/38"
              data-testid="atlas-memory-count"
            >
              {dreams.length} preserved{" "}
              {dreams.length === 1 ? "memory" : "memories"}
              <span className="mx-2 text-white/16">·</span>
              {constellations.length} living constellations
            </p>
            <p className="mt-3 text-xs leading-6 text-white/34">
              AI notices what returns. It never tells you what it means.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
