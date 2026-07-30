export const ATLAS_MEMORY_PANEL_TEST_ID = "atlas-memory-panel";
export const ATLAS_MEMORY_OPEN_LINK_TEST_ID = "atlas-memory-open-link";
export const ATLAS_PANEL_VIEWPORT_MARGIN = 16;

export function isRectFullyInsideViewport(
  rectangle,
  viewport,
  margin = ATLAS_PANEL_VIEWPORT_MARGIN,
) {
  return (
    rectangle.width > 0 &&
    rectangle.height > 0 &&
    rectangle.x >= margin &&
    rectangle.y >= margin &&
    rectangle.x + rectangle.width <= viewport.width - margin &&
    rectangle.y + rectangle.height <= viewport.height - margin
  );
}
