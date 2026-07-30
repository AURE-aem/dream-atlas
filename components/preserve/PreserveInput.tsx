type Props = {
  value: string;
  error: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export default function PreserveInput({
  value,
  error,
  onChange,
  onSubmit,
}: Props) {
  const remaining = 3000 - value.length;

  return (
    <section className="flex min-h-screen items-center px-5 py-28 sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-center text-[10px] uppercase tracking-[0.38em] text-slate-200/45">
          Preserve a dream
        </p>
        <h1 className="mx-auto mt-7 max-w-2xl text-center font-serif text-4xl leading-tight tracking-[-0.02em] sm:text-6xl">
          Begin with the fragment
          <br />
          that stayed.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-center text-sm leading-7 text-white/42">
          It does not need to be complete. A place, an image, a movement—give
          the Atlas enough to remember.
        </p>

        <div className="mt-12 rounded-[2rem] border border-white/10 bg-[#080b16]/70 p-5 shadow-[0_34px_100px_rgba(0,0,0,.44)] backdrop-blur-xl sm:p-7">
          <label htmlFor="dream-fragment" className="sr-only">
            What do you remember from your dream?
          </label>
          <textarea
            id="dream-fragment"
            autoFocus
            value={value}
            maxLength={3000}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                onSubmit();
              }
            }}
            placeholder="I was walking through a flooded corridor. Every door was closed, except one..."
            className="min-h-64 w-full resize-none bg-transparent p-2 font-serif text-xl leading-9 text-white outline-none placeholder:text-white/18 sm:text-2xl sm:leading-10"
          />
          <div className="mt-4 flex flex-col gap-4 border-t border-white/[0.08] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/28">
              {new Intl.NumberFormat("en-US").format(remaining)} characters remain
            </p>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!value.trim()}
              className="rounded-full bg-slate-50 px-7 py-3.5 text-sm font-medium text-slate-950 transition hover:scale-[1.02] hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
            >
              Preserve this memory <span className="ml-2">→</span>
            </button>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mx-auto mt-5 max-w-xl rounded-2xl border border-red-300/15 bg-red-950/30 px-5 py-3 text-center text-sm text-red-100/80"
          >
            {error}
          </p>
        )}
        <p className="mt-6 text-center text-xs text-white/25">
          Ctrl/⌘ + Enter to preserve · Your dream is remembered, never
          interpreted.
        </p>
      </div>
    </section>
  );
}
