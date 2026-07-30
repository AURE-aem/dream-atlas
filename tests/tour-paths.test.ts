import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  materializeDreamLibrarySource,
  resolveDreamLibraryDirectory,
} from "../scripts/dream-library-path.mjs";

test("resolves a demo library placed beside an ancestor project folder", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "dream-atlas-library-path-"));
  const project = path.join(root, "v14", "application", "dream-explorer");
  const library = path.join(root, "Dream-Atlas-Demo-Dream-Library-v1");

  try {
    await Promise.all([
      mkdir(project, { recursive: true }),
      mkdir(path.join(library, "dreams"), { recursive: true }),
      mkdir(path.join(library, "constellations"), { recursive: true }),
    ]);

    assert.equal(
      await resolveDreamLibraryDirectory(
        "../../Dream-Atlas-Demo-Dream-Library-v1",
        { cwd: project },
      ),
      library,
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("keeps an exact valid library path", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "dream-atlas-library-exact-"));

  try {
    await Promise.all([
      mkdir(path.join(root, "dreams"), { recursive: true }),
      mkdir(path.join(root, "constellations"), { recursive: true }),
    ]);

    assert.equal(
      await resolveDreamLibraryDirectory(root, { cwd: path.dirname(root) }),
      root,
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("uses an unpacked library without creating a temporary copy", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "dream-atlas-library-source-"));

  try {
    await Promise.all([
      mkdir(path.join(root, "dreams"), { recursive: true }),
      mkdir(path.join(root, "constellations"), { recursive: true }),
    ]);

    const source = await materializeDreamLibrarySource(root);
    assert.equal(source.directory, root);
    assert.equal(source.sourcePath, root);
    assert.equal(source.kind, "directory");
    await source.cleanup();
    assert.equal(await resolveDreamLibraryDirectory(root), root);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("a missing library error lists both folder and ZIP candidates", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "dream-atlas-library-missing-"));

  try {
    await assert.rejects(
      materializeDreamLibrarySource("Dream-Atlas-Demo-Dream-Library-v1", {
        cwd: root,
        ancestorLimit: 0,
      }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /folder or ZIP/);
        assert.match(
          error.message,
          /Dream-Atlas-Demo-Dream-Library-v1\.zip/,
        );
        return true;
      },
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});
