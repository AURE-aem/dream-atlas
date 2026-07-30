# Dream Atlas

Dream Atlas is an AI-assisted dream memory system.

Every preserved dream becomes a star. Concrete motifs create paths between
memories, and recurring patterns become durable constellations. AI helps shape
titles, narration, motifs, constellation names, and reflection questions—but
never diagnoses the user or tells them what a dream definitively means. The
Motif Storyteller can add a clearly labeled, playful fairy-tale reflection
based only on the archive's most frequently recurring motifs.

## Empty by default

Every new Dream Atlas starts with an empty sky. User memories are created only
through that user's own preservation flow; the application does not ship with
preloaded dreams or constellations.

The synthetic showcase archive is distributed as a separate, optional library.
The core application contains only a format-agnostic importer and has no
knowledge of the demo records. The importer accepts either the unpacked folder
or the separate ZIP directly:

```bash
npm run demo:import -- Dream-Atlas-Demo-Dream-Library-v1 --force
npm run demo:import -- Dream-Atlas-Demo-Dream-Library-v1.zip --force
```

The importer first checks the supplied path and then the current folder's nearby
ancestors, looking for both a directory and a same-named ZIP. The command
therefore works when either form was downloaded beside a versioned application
folder. ZIP contents are unpacked only into a temporary test location. Restart
the development server after importing. Omit `--force` when importing into an
already empty Atlas; with `--force`, existing local dream and constellation JSON
files are replaced.

## Silver threads in the Atlas

The landing Atlas is woven from the full web of fine silver threads rather than
a rigid graph. Every meaningful relationship remains visible in the resting
sky, with the straight, luminous filaments, soft bloom, and travelling sparks
of the sixth visual edition. The web breathes as one quiet field; focusing a
dream dims that field and lights all of the star's own paths.

Performance comes from composition rather than deleting relationships. The
complete web is collapsed into three SVG paths—a broad glow, a sharp silver
core, and one moving glint—instead of rendering and animating three separate
elements for every edge. The Atlas therefore keeps the rich luminous mesh while
the browser paints only a handful of connection layers.

## A river of dreams

The Timeline is not meant to feel like a database laid out on a ruler. It is a
living river of dreams: a fine silver current drifts through the archive,
shimmers like water, breathes with changing light, and bends with the calm
movement of a sleeping serpent. Dreams and dates glow in their own irregular
rhythms, like fireflies appearing over dark water. The motion stays deliberately
slow and subtle, so following the trail feels closer to watching moonlight on a
stream than reading a conventional activity feed.

The effect is built from one lightweight flowing SVG path and independently
timed pulses for its memories. Animation relies mainly on transforms and
opacity, and the interface respects `prefers-reduced-motion`, preserving the
atmosphere without sacrificing comfort or performance.

## Dream Memory as a living canvas

A Dream Memory is an explorable board rather than a fixed document. The wheel
or trackpad zooms toward the pointer, dragging moves across the memory, and
touch devices support panning and pinch-to-zoom. Movement is painted through
`requestAnimationFrame`, without rerendering the full memory on every pointer
update. Text selection is suspended only while the board is being moved, links
and controls keep their native actions, and zoom is committed through layout
scaling rather than a permanently enlarged bitmap layer so the typography
rerenders sharply at every settled magnification.

The dreamer's exact words are the immutable core of the experience. Atlas asks
AI to quote the complete original fragment verbatim, character for character,
and a deterministic post-generation guard restores that exact quote if a model
ever omits or paraphrases it. The interface always presents this core openly in
a distinct italic typeface with a restrained silver glow; it is never hidden
behind a disclosure. Titles, atmosphere, motifs, observations, and stories may
be shaped around it, but only the original fragment is guaranteed never to be
rewritten.

Preservation follows one deliberate sequence: fragment → “Atlas is remembering”
→ preserved card. The abandoned prototype path selector is not part of this
flow and no choice is selected automatically. The automatic remembering view
stays visible for one calm, consistent interval even when a warm local pipeline
finishes almost instantly, so it never appears as an accidental flash. A card
is shown only after the server has read the newly written memory back from the
archive, and the Atlas and Dream Cards routes are invalidated immediately so
the new star is visible on the next navigation. The development command clears
the Next.js build cache before launching,
preventing an obsolete prototype screen from surviving when a new edition is
unpacked over an older local copy.

## How the separate 38-dream demo library was created

The separately distributed showcase library contains 38 entirely synthetic
dreams; it contains no user dreams or personal data. The collection was
designed as an ensemble rather than 38 variations of one voice:

- its visual and literary registers range across noir, fairy tale,
  bureaucratic surrealism, analog horror, brutalism, retro science fiction,
  paper collage, magical realism, and quiet domestic dreaming;
- each dream contains layered, veiled meaning without declaring one definitive
  interpretation;
- each dream carries exactly one small positive accent—a cup of warm tea, a
  steady light, a new leaf, a tiny rainbow—kept subtle enough not to resolve the
  dream's tension;
- concrete motifs intentionally recur across otherwise different stories, so
  the Atlas can reveal meaningful paths and eight durable constellations;
- every record includes an original fragment, expanded narration, concrete
  motifs, a non-diagnostic observation, three reflection questions, a playful
  fairy-tale reading, and an image direction.

The library owns its dream and constellation JSON files and its own README.
None of those records are embedded in the application source or its default
data directories.

## Product routes

- `/` — the living Dream Atlas
- `/preserve` — a calm memory-preservation flow
- `/dreams` — premium Dream Cards and chronological Timeline
- `/dreams/[id]` — the full Dream Memory reading view
- `/dream-atlas` — compatibility redirect to `/`

## Watch the whole application test itself

The guided Playwright tour opens one maximized Chromium window and lets the page
occupy its full visible area. This avoids the blank strip that a fixed emulated
viewport can leave inside a larger Windows browser window. A compact glass cue
names every scene, explains what is about to happen, and shows progress through
the tour. Transitions keep that cue in view while the page changes, so movement
never becomes an unexplained pause. The pointer glides lightly, clicks leave a
restrained silver ripple, and longer holds are reserved for scenes with details
worth reading. The library tour sweeps across five connected stars, searches
for a motif, clicks a real result, opens its Dream Memory, drags the living
canvas, uses all three lower-right zoom controls, and returns to the same star
highlighted in the Atlas. It records a 1280×720 WebM film, screenshots, the
measured presentation time, and a JSON report in `tour-results`. After the final
scene, that same browser window closes; no second review window or tab is
opened. Install Chromium and the WebM encoder once:

```powershell
npm run tour:setup
```

Then choose one isolated tour:

```powershell
# A new empty Atlas, followed by one deterministic local dream
npm run tour:empty

# The separate 38-dream showcase library
npm run tour:demo -- --demo-library Dream-Atlas-Demo-Dream-Library-v1

# The same tour can consume the still-zipped separate library
npm run tour:demo -- --demo-library Dream-Atlas-Demo-Dream-Library-v1.zip

# One real LLM-assisted preservation
$env:OPENAI_API_KEY="your-local-key"
npm run tour:llm
Remove-Item Env:OPENAI_API_KEY
```

Every tour starts the application with a fresh temporary data directory. It
never deletes, imports into, or adds records to the user's normal `data`
directory. The LLM tour creates exactly one temporary dream and verifies that
the language agents completed successfully. The key remains an environment
variable and is neither written to a file nor included in the report.

For a non-interactive check, add `--headless --no-pause`. To keep the isolated
test records for debugging, add `--keep-data`. The visible tour defaults to
`--slow-mo 55 --scene-pause 450 --route-pause 180`; each value is in
milliseconds and can still be adjusted for a different cut. Add `--no-video`
only when screenshots and the JSON report are enough.

During development, use the quick headless tours. They preserve every
regression assertion while removing presentation waits and video recording:

```powershell
npm run tour:empty:quick
npm run tour:demo:quick -- --demo-library ..\Dream-Atlas-Demo-Dream-Library-v1.zip
```

Use one command for the complete static validation:

```powershell
npm run validate
```

## Architecture

The orchestrator separates probabilistic language work from deterministic
memory infrastructure:

```text
Memory.Retrieve + AI enrichment + MotifStoryteller.Interpret
  → Memory.Match
  → Memory.Save
  → ConstellationWeaver.Match
  → ConstellationWeaver.Narrate
  → Constellation.Save
  → Atlas.Update
```

Deterministic code owns validation, file storage, search, filtering, graph
construction, statistics, constellation membership, and lifecycle updates.
AI owns language: title, narration, motif extraction, observational copy,
constellation naming, reflection questions, and the optional playful motif
tale.

The local runtime stores each user's memories in `data/dreams` and
constellations in `data/constellations`, behind repository interfaces. Both
directories are empty in a new installation. Writes are atomic. A production
serverless deployment should replace the file repositories with durable
database adapters.

## Run locally

```bash
npm install
npm run dev
```

AI is optional. Without these variables, deterministic fallbacks keep the
entire demo flow working:

```bash
DREAM_AI_ENABLED=true
OPENAI_API_KEY=...
OPENAI_TEXT_MODEL=gpt-4.1-mini
```

## Quality checks

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

## Hackathon demo

1. Open the Atlas and hover a star.
2. Open its Dream Memory.
3. Return and show a named constellation.
4. Preserve a dream containing a returning motif such as water, forest, moon,
   door, or darkness.
5. Choose **See it become a star**.
6. The Atlas focuses the new silver star and reveals its strengthened
   constellation.

See [the Dream Bible](docs/dream-bible.md) and
[the architecture note](docs/architecture.md) for the product and engineering
constraints.
