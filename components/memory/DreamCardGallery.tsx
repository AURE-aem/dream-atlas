import Link from "next/link";

import {
  formatCompactDate,
  getDreamDisplayTitle,
  getDreamPreview,
} from "@/components/memory/memoryUtils";
import type { GeneratedDream } from "@/types/dream";

const cardAtmospheres = [
  "from-[#151229] via-[#0c1224] to-[#070a13]",
  "from-[#10202a] via-[#101525] to-[#080914]",
  "from-[#23152b] via-[#111126] to-[#070a13]",
  "from-[#161d30] via-[#11121f] to-[#080914]",
] as const;

export default function DreamCardGallery({
  dreams,
}: {
  dreams: GeneratedDream[];
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {dreams.map((dream, index) => (
        <Link
          key={dream.id}
          href={`/dreams/${dream.id}`}
          className={`group relative flex min-h-[27rem] overflow-hidden rounded-[2rem] border border-white/[0.08] bg-gradient-to-br ${
            cardAtmospheres[index % cardAtmospheres.length]
          } p-7 shadow-[0_24px_70px_rgba(0,0,0,.28)] transition duration-500 hover:-translate-y-1.5 hover:border-slate-100/20 hover:shadow-[0_34px_90px_rgba(0,0,0,.48)] sm:p-8`}
        >
          <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:radial-gradient(circle_at_74%_18%,rgba(226,232,240,.24)_0_1px,transparent_1.6px),radial-gradient(circle_at_24%_70%,rgba(196,181,253,.18)_0_1px,transparent_1.4px)] [background-size:57px_61px,43px_47px]" />
          <div className="pointer-events-none absolute right-[-20%] top-[-10%] h-60 w-60 rounded-full bg-slate-200/[0.055] blur-3xl transition duration-700 group-hover:bg-violet-200/[0.09]" />

          <div className="relative flex w-full flex-col">
            <div className="flex items-center justify-between gap-4 text-[9px] uppercase tracking-[0.25em] text-white/28">
              <span>Dream Card {String(dreams.length - index).padStart(2, "0")}</span>
              <span>{formatCompactDate(dream.createdAt)}</span>
            </div>

            <span className="mt-10 text-3xl text-slate-100/75 transition duration-500 group-hover:text-white group-hover:drop-shadow-[0_0_18px_rgba(248,250,252,.65)]">
              ✦
            </span>
            <h2 className="mt-5 font-serif text-3xl leading-tight tracking-[-0.025em] text-white/92">
              {getDreamDisplayTitle(dream)}
            </h2>
            <p className="mt-5 line-clamp-4 text-sm leading-7 text-white/42">
              {getDreamPreview(dream)}
            </p>

            <div className="mt-auto pt-8">
              <div className="flex flex-wrap gap-2">
                {dream.recurringSymbols.slice(0, 3).map(({ symbol }) => (
                  <span
                    key={symbol}
                    className="rounded-full border border-white/[0.08] px-3 py-1.5 text-[10px] capitalize text-white/38"
                  >
                    {symbol}
                  </span>
                ))}
              </div>
              <p className="mt-6 border-t border-white/[0.07] pt-5 text-xs text-slate-100/48 transition group-hover:text-white/80">
                Return to this memory <span className="ml-2">→</span>
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
