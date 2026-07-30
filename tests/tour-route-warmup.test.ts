import assert from "node:assert/strict";
import test from "node:test";

import {
  warmRoute,
  warmTourRoutes,
} from "../scripts/tour-route-warmup.mjs";

test("warms native fetch responses by reading the boolean ok property", async () => {
  const requestedUrls: string[] = [];
  const fetchImplementation: typeof fetch = async (url) => {
    requestedUrls.push(String(url));
    return new Response("ready", { status: 200 });
  };

  await warmRoute("http://127.0.0.1:3000/preserve", {
    fetchImplementation,
  });

  assert.deepEqual(requestedUrls, ["http://127.0.0.1:3000/preserve"]);
});

test("warms all demo routes and the first imported dream", async () => {
  const requestedUrls: string[] = [];
  const firstDreamId = "11111111-1111-4111-8111-111111111111";
  const fetchImplementation: typeof fetch = async (url) => {
    const requestedUrl = String(url);
    requestedUrls.push(requestedUrl);
    return requestedUrl.endsWith("/api/dreams")
      ? Response.json({ dreams: [{ id: firstDreamId }] })
      : new Response("ready", { status: 200 });
  };

  await warmTourRoutes("http://127.0.0.1:3000", {
    includeDemoMemory: true,
    fetchImplementation,
  });

  assert.deepEqual(requestedUrls, [
    "http://127.0.0.1:3000/preserve",
    "http://127.0.0.1:3000/dreams",
    "http://127.0.0.1:3000/dreams?view=timeline",
    "http://127.0.0.1:3000/api/dreams",
    `http://127.0.0.1:3000/dreams/${firstDreamId}`,
  ]);
});

test("reports the HTTP status when route warm-up fails", async () => {
  await assert.rejects(
    warmRoute("http://127.0.0.1:3000/dreams", {
      fetchImplementation: async () =>
        new Response("broken", { status: 503 }),
    }),
    /Route warm-up returned 503/,
  );
});
