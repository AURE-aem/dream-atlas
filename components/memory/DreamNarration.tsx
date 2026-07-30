import { getDreamNarrationParts } from "@/lib/dream/narration";

type Props = {
  narration: string;
  originalDream: string;
  compact?: boolean;
};

export default function DreamNarration({
  narration,
  originalDream,
  compact = false,
}: Props) {
  const { core, surrounding } = getDreamNarrationParts(
    narration,
    originalDream,
  );

  return (
    <div
      className={`dream-narration${compact ? " dream-narration--compact" : ""}`}
    >
      {core && (
        <figure className="dream-core-quote">
          <figcaption className="dream-core-quote__label">
            <span>Your dream</span>
            <span>Unchanged core · quoted verbatim</span>
          </figcaption>
          <blockquote
            className="dream-memory-core whitespace-pre-line"
            title="Your exact original words—the immutable core of this memory"
          >
            “{core}”
          </blockquote>
          <p className="dream-core-quote__promise">
            Preserved exactly as you wrote it.
          </p>
        </figure>
      )}
      {surrounding && (
        <div className="dream-narration__surrounding">
          <p className="dream-narration__label">
            The scene around it · gently shaped by AI
          </p>
          <p className="dream-memory-prose whitespace-pre-line font-serif">
            {surrounding}
          </p>
        </div>
      )}
    </div>
  );
}
