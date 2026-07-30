"use client";

import { useEffect, useRef } from "react";

type MemorySearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function MemorySearch({ value, onChange }: MemorySearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  return (
    <label className="group block rounded-2xl border border-white/10 bg-white/[0.025] px-5 shadow-[0_25px_80px_rgba(0,0,0,0.22)] transition focus-within:border-slate-100/35 focus-within:bg-white/[0.04] focus-within:shadow-[0_0_45px_rgba(226,232,240,0.07)]">
      <span className="sr-only">Ask your memory</span>
      <div className="flex items-center gap-4 py-5">
        <span className="text-2xl text-slate-200/55">⌕</span>
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ask your memory..."
          className="min-w-0 flex-1 bg-transparent text-lg font-light text-white outline-none placeholder:text-white/28 md:text-xl"
        />
        {!value && (
          <span className="hidden rounded-md border border-white/10 px-2 py-1 text-[10px] text-white/25 sm:inline">
            Ctrl K
          </span>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-full px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-white/30 transition hover:bg-white/[0.06] hover:text-white/70"
          >
            Clear
          </button>
        )}
      </div>
    </label>
  );
}
