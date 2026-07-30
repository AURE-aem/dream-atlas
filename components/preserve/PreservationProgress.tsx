"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const stages = [
  ["Archivist", "shaping the memory"],
  ["Pattern Keeper", "noticing concrete motifs"],
  ["Memory", "searching for earlier echoes"],
  ["Constellation Weaver", "looking for a returning pattern"],
] as const;

export default function PreservationProgress({
  fragment,
}: {
  fragment: string;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActive((value) => Math.min(value + 1, stages.length - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section
      className="flex min-h-screen items-center px-6 py-28"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mx-auto w-full max-w-xl text-center">
        <motion.div
          className="atlas-birth-star mx-auto h-24 w-24"
          animate={{ scale: [0.86, 1.08, 0.94, 1.04, 0.86] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <p className="mt-8 text-[10px] uppercase tracking-[0.38em] text-slate-200/48">
          A memory is becoming a star
        </p>
        <h1 className="mt-5 font-serif text-3xl text-white sm:text-4xl">
          The Atlas is remembering.
        </h1>
        <p className="mx-auto mt-4 max-w-md truncate text-sm italic text-white/28">
          “{fragment}”
        </p>
        <p className="mt-5 text-[10px] uppercase tracking-[0.24em] text-slate-200/34">
          This happens automatically · there is nothing to choose
        </p>

        <div
          className="relative mx-auto mt-12 max-w-md text-left"
          role="progressbar"
          aria-label="Preserving dream"
          aria-valuemin={1}
          aria-valuemax={stages.length}
          aria-valuenow={active + 1}
        >
          <div className="absolute bottom-4 left-[0.9375rem] top-4 w-px bg-gradient-to-b from-slate-100/30 via-slate-100/12 to-transparent" />
          {stages.map(([agent, action], index) => {
            const complete = index < active;
            const current = index === active;
            return (
              <div
                key={agent}
                aria-current={current ? "step" : undefined}
                className={`relative flex items-center gap-5 py-3.5 transition ${
                  current ? "opacity-100" : complete ? "opacity-58" : "opacity-22"
                }`}
              >
                <span
                  className={`relative z-10 grid h-[1.875rem] w-[1.875rem] shrink-0 place-items-center rounded-full border text-[10px] ${
                    current
                      ? "border-slate-100/45 bg-slate-100/12 text-white shadow-[0_0_20px_rgba(226,232,240,.28)]"
                      : "border-slate-100/16 bg-[#080b16] text-slate-100/58"
                  }`}
                >
                  {complete ? "✓" : "✦"}
                </span>
                <div>
                  <p className="text-sm text-white/76">{agent}</p>
                  <p className="mt-1 text-xs text-white/32">{action}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
