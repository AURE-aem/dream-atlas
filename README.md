# Dream Atlas

**Dream Atlas** is a multi-agent dream memory system. 

Specialized AI agents collaborate to preserve, enrich, connect, and organize dream memories into a living Atlas of motifs, paths, and constellations.

Deterministic memory infrastructure and AI agents work together: **code discovers structure**, while **agents provide language, narration, and reflection**.

### Core Philosophy
* **Every preserved dream becomes a star.** Concrete motifs create paths between memories, and recurring patterns become durable constellations.
* **Rich Enrichment:** Specialized agents generate titles, narration, observations, motif families, image directions, reflection questions, constellation insights, and natural language explanations describing why memories become connected.
* **Ethical Boundary:** Dream Atlas *never* diagnoses the user, assigns psychological meaning, or claims a definitive interpretation of a dream.
* **Imaginative Layer:** Storytelling agents provide clearly labeled, imaginative reflections based *only* on recurring motifs present in the archive.

---

## Visual Experience & Design

### Silver Threads in the Atlas
The landing Atlas is woven from a full web of fine silver threads rather than a rigid graph. Every meaningful relationship remains visible in the resting sky, featuring:
* Straight, luminous filaments
* Soft bloom effect
* Travelling sparks of the sixth visual edition

The web breathes as one quiet field; focusing on a dream dims that field and lights all of the star's own paths.

> **Performance Strategy:** Performance comes from composition rather than deleting relationships. The complete web is collapsed into three SVG paths (*a broad glow*, *a sharp silver core*, and *one moving glint*) instead of rendering and animating three separate elements for every edge.

### A River of Dreams (Timeline)
The Timeline is designed to feel like a living river of dreams rather than a database laid out on a ruler:
* A fine silver current drifts through the archive, shimmering like water and breathing with changing light.
* Dreams and dates glow in their own irregular rhythms, like fireflies appearing over dark water.
* Animation relies mainly on transforms and opacity. The interface respects `prefers-reduced-motion`, preserving the atmosphere without sacrificing performance.

### Dream Memory as a Living Canvas
A Dream Memory is an explorable board rather than a fixed document:
* **Navigation:** Trackpad/wheel zooms toward the pointer, dragging moves across the memory, and touch devices support panning and pinch-to-zoom.
* **Rendering:** Movement is painted through `requestAnimationFrame` without rerendering the full memory on every pointer update. Typography rerenders sharply at every settled magnification.

> **The Immutable Core:** The dreamer's exact words are sacred. Atlas asks AI to quote the complete original fragment verbatim, character for character, and a deterministic post-generation guard restores that exact quote if a model ever omits or paraphrases it.

**Preservation Sequence:**
`Fragment` → `“Atlas is remembering”` → `Preserved Card`

---

## Product Routes

| Route | Description |
| :--- | :--- |
| `/` | The living Dream Atlas |
| `/preserve` | Calm memory-preservation flow |
| `/dreams` | Premium Dream Cards and chronological Timeline |
| `/dreams/[id]` | Full Dream Memory reading view |
| `/dream-atlas` | Compatibility redirect to `/` |

---

## Multi-Agent System

Dream Atlas uses a collection of specialized agents rather than a single general-purpose prompt. Each agent has a narrow responsibility and contributes one layer of enrichment to the final memory.

### Current Agents
* `Archivist.Title`
* `Archivist.Narration`
* `Observer.Observation`
* `Cartographer.ImagePrompt`
* `PatternKeeper.Motifs`
* `Reflector.Questions`
* `MotifStoryteller`
* `MemoryMatchmaker` *(experimental)*
* `ConstellationWeaver`

---

## Architecture

The orchestrator strictly separates probabilistic language work from deterministic memory infrastructure:

```text
Memory.Retrieve
       ↓
Archivist.Title
Archivist.Narration
       ↓
Observer.Observation
Cartographer.ImagePrompt
PatternKeeper.Motifs
       ↓
Memory.Match
Reflector.Questions
MotifStoryteller.Interpret
       ↓
Memory.Save
       ↓
ConstellationWeaver.Match
       ↓
ConstellationWeaver.Narrate
       ↓
Constellation.Save
       ↓
Atlas.Update
```

* `MemoryMatchmaker` currently operates as an experimental relationship explanation agent and does not yet influence Atlas structure.
* **Deterministic Ownership:** Deterministic systems own storage, validation, memory retrieval, motif scoring, relationship discovery, graph construction, constellation membership, statistics, and lifecycle management.
* **Storage:** The local runtime stores each user's memories in `data/dreams` and constellations in `data/constellations`. Both directories are empty in a new installation. Writes are atomic.

---

## Getting Started

### Run Locally

1. **Install and start the development server:**
   ```bash
   npm install
   npm run dev
   ```

2. **Environment Configuration:**  
   Dream Atlas is designed to run with its multi-agent AI pipeline enabled. Configure your environment variables:
   ```env
   DREAM_AI_ENABLED=true
   OPENAI_API_KEY=<OpenAI-compatible or OpenRouter-compatible key>
   ```
   *(Optional)* Use `OPENAI_TEXT_MODEL` to select a specific model.

### Quality Checks

Run the verification suite before committing:
```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

---

### Playwright E2E Tests

Install dependencies and the Chromium browser:

```bash
npm ci
npx playwright install chromium
```

Create a `.env.local` file based on `.env.example` and replace both placeholders with random values containing at least 32 characters:

```env
SESSION_SECRET=replace-with-a-random-secret
TEST_API_TOKEN=replace-with-a-random-test-api-token
```

The OpenAI API key is not required to run the authentication E2E tests.

Run the complete Playwright test suite:

```bash
npm run test:e2e
```

Run the desktop and mobile projects separately:

```bash
npx playwright test --project=desktop-chrome
npx playwright test --project=mobile-chrome
```

Additional commands:

```bash
npm run test:e2e:headed
npm run test:e2e:report
```

Playwright starts the application automatically at `http://localhost:3000`. To test another running environment, set the `PLAYWRIGHT_BASE_URL` environment variable.

---

## Hackathon Demo Walkthrough

1. Open the Atlas and hover over a star.
2. Open its **Dream Memory**.
3. Return to the main view and show a named constellation.
4. Preserve a dream containing a returning motif (e.g., *water*, *forest*, *moon*, *door*, *darkness*).
5. Choose **"See it become a star"**.
6. Watch as the Atlas focuses the new silver star and reveals its strengthened constellation.

---

*See [the Dream Bible](docs/dream-bible.md) and [the Architecture Note](docs/architecture.md) for detailed product and engineering constraints.*
