# Dream Atlas Architecture

## Domain models

### Dream Memory

The persisted `GeneratedDream` shape remains backward-compatible with early
demo records. New records add `reflectionQuestions`, a clearly framed
`playfulInterpretation`, and may link to a `constellationId`. Legacy
`diagnosis` text is readable for migration purposes but is never generated or
shown.

### Constellation

A constellation is its own durable record:

- stable ID and timestamps,
- poetic name and observational summary,
- normalized motifs,
- exact member dream IDs,
- strength and confidence.

## Responsibility boundary

| Deterministic code | AI agents |
| --- | --- |
| Validation and atomic persistence | Title and narration |
| Search and filtering | Motif extraction |
| Memory graph and edge strength | Observational memory copy |
| Constellation candidate membership | Constellation name and summary |
| Create/strengthen lifecycle | Reflection questions |
| Ranked recurring motifs | Playful fairy-tale motif reflection |
| Statistics and API contracts | No clinical diagnosis or factual claims |

AI cannot add or remove constellation members. Constellation Weaver receives a
deterministic candidate and may only name and describe it.

Motif Storyteller receives only motifs already ranked by deterministic code.
Its output is explicitly presented as playful fiction, never as diagnosis,
prediction, advice, or hidden truth.

## Pipeline

1. `Memory.Retrieve` and `Constellation.Retrieve`
2. Archivist, Observer, Pattern Keeper, Guide, Reflector, and Motif Storyteller enrichment
3. `Memory.Match`
4. `Memory.Save`
5. `ConstellationWeaver.Match`
6. `ConstellationWeaver.Narrate`
7. `Constellation.Save`
8. `Atlas.Update`

When AI is disabled, language helpers return deterministic fallbacks and the
trace records `fallback`. Storage and graph tasks continue to report `success`.

## Persistence

`FileDreamRepository` and `FileConstellationRepository` use temporary files and
atomic renames. They are reliable for local and single-process hackathon demos,
but a serverless deployment needs database-backed adapters.
