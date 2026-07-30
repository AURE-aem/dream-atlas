import Link from "next/link";
import type { CSSProperties } from "react";

import {
  formatDreamTime,
  getDreamDisplayTitle,
} from "@/components/memory/memoryUtils";
import type { TimelineGroup } from "@/components/memory/types";

const NODE_WAVE_OFFSETS = [0, -7, -10, -5, 3, 9, 8, 2, -6, -9, -4, 4, 10, 7, 0];

export default function MemoryTimeline({ groups }: { groups: TimelineGroup[] }) {
  const entries = groups
    .flatMap((group) =>
      group.items.map((item) => ({
        ...item,
        groupLabel: group.label,
      })),
    )
    .reverse();

  return (
    <section aria-label="Dream memory timeline" className="pt-2">
      <div className="mb-3 flex items-center justify-end">
        <p className="text-[9px] uppercase tracking-[0.28em] text-white/22">
          Earliest
          <span className="mx-3 text-slate-100/30">···</span>
          latest
        </p>
      </div>

      <div className="timeline-scroll -mx-5 overflow-x-auto px-5 pb-7 sm:-mx-8 sm:px-8">
        <div className="timeline-trail relative flex w-max min-w-full pb-7 pt-32">
          <svg
            aria-hidden="true"
            className="timeline-waterline pointer-events-none absolute left-6 right-6 top-12 h-20"
            preserveAspectRatio="none"
            viewBox="0 0 1600 80"
          >
            <defs>
              <linearGradient id="timeline-water-gradient" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#f8fafc" stopOpacity="0" />
                <stop offset="0.12" stopColor="#e2e8f0" stopOpacity="0.48" />
                <stop offset="0.34" stopColor="#c4b5fd" stopOpacity="0.72" />
                <stop offset="0.55" stopColor="#bae6fd" stopOpacity="0.58" />
                <stop offset="0.76" stopColor="#ddd6fe" stopOpacity="0.68" />
                <stop offset="1" stopColor="#f8fafc" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              className="timeline-water-path timeline-water-path--body"
              d="M0 42 C80 14 160 14 240 42 S400 70 480 42 S640 14 720 42 S880 70 960 42 S1120 14 1200 42 S1360 70 1440 42 S1540 22 1600 42"
              pathLength="1000"
            />
            <path
              className="timeline-water-path timeline-water-path--current"
              d="M0 42 C80 14 160 14 240 42 S400 70 480 42 S640 14 720 42 S880 70 960 42 S1120 14 1200 42 S1360 70 1440 42 S1540 22 1600 42"
              pathLength="1000"
            />
            <path
              className="timeline-water-path timeline-water-path--spark"
              d="M0 42 C80 14 160 14 240 42 S400 70 480 42 S640 14 720 42 S880 70 960 42 S1120 14 1200 42 S1360 70 1440 42 S1540 22 1600 42"
              pathLength="1000"
            />
          </svg>
          {entries.map(({ dream, groupLabel }, index) => (
            <Link
              key={dream.id}
              href={`/dreams/${dream.id}`}
              className="timeline-memory group relative w-[13.5rem] shrink-0 px-5 pb-3 pt-7 sm:w-[15rem]"
              style={
                {
                  "--timeline-delay": `${-((index * 1.73) % 19)}s`,
                  "--timeline-duration": `${15 + (index % 6) * 1.7}s`,
                  "--timeline-wave-y": `${NODE_WAVE_OFFSETS[index % NODE_WAVE_OFFSETS.length]}px`,
                } as CSSProperties
              }
            >
              <span className="timeline-firefly-date absolute -top-[5rem] left-5 text-[8px] uppercase tracking-[0.25em] text-white/28 transition duration-500 group-hover:text-slate-100/60">
                {groupLabel}
              </span>
              <span className="timeline-memory-star absolute -top-[3rem] left-5 h-2 w-2 rounded-full" />
              <span className="absolute -top-[2.35rem] left-[1.44rem] h-9 w-px bg-gradient-to-b from-slate-100/24 to-transparent transition duration-500 group-hover:from-slate-100/50" />

              <span className="timeline-firefly-dream block transition duration-500 group-hover:-translate-y-0.5">
                <span className="mb-3 block text-[8px] tracking-[0.24em] text-white/16">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="block font-serif text-lg leading-snug text-white/62 transition duration-500 group-hover:text-white">
                  {getDreamDisplayTitle(dream)}
                </span>
                <span className="mt-3 block min-h-9 text-[11px] leading-5 text-white/25 transition duration-500 group-hover:text-white/40">
                  {dream.recurringSymbols
                    .slice(0, 3)
                    .map(({ symbol }) => symbol)
                  .join(" · ") || "A preserved memory"}
                </span>
                <span className="mt-4 flex items-center gap-3 text-[10px] text-white/22">
                  <span className="timeline-firefly-time">
                    {formatDreamTime(dream.createdAt)}
                  </span>
                  <span className="h-px w-4 bg-white/10 transition-all duration-500 group-hover:w-8 group-hover:bg-slate-100/34" />
                  <span className="transition duration-500 group-hover:text-white/62">
                    return
                  </span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-xl border-t border-white/[0.055] px-5 pt-7 text-center">
        <p className="text-[9px] uppercase tracking-[0.28em] text-slate-100/34">
          {entries.length} preserved {entries.length === 1 ? "memory" : "memories"}
        </p>
        <p className="mt-3 font-serif text-sm italic leading-6 text-white/25">
          A quiet trail of what found its way back.
        </p>
      </div>
    </section>
  );
}
