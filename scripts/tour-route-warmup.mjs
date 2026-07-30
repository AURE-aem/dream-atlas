import assert from "node:assert/strict";

export async function warmTourRoutes(
  url,
  { includeDemoMemory, fetchImplementation = fetch },
) {
  await Promise.all([
    warmRoute(`${url}/preserve`, { fetchImplementation }),
    warmRoute(`${url}/dreams`, { fetchImplementation }),
    warmRoute(`${url}/dreams?view=timeline`, { fetchImplementation }),
  ]);

  if (!includeDemoMemory) return;

  const response = await fetchImplementation(`${url}/api/dreams`, {
    cache: "no-store",
  });
  assert.ok(
    response.ok,
    `Dream list warm-up returned ${response.status}.`,
  );
  const payload = await response.json();
  const firstDreamId = payload?.dreams?.[0]?.id;
  assert.ok(firstDreamId, "The demo library contains no dream to precompile.");
  await warmRoute(`${url}/dreams/${encodeURIComponent(firstDreamId)}`, {
    fetchImplementation,
  });
}

export async function warmRoute(
  url,
  { fetchImplementation = fetch } = {},
) {
  const response = await fetchImplementation(url, { cache: "no-store" });
  assert.ok(
    response.ok,
    `Route warm-up returned ${response.status}: ${url}`,
  );
}
