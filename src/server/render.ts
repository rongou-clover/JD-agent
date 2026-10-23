import type { Render } from "@/render/contract";

/**
 * The renderer is built in src/render by another stream; this module is the only place that wires it.
 * Until that merge, a turn fails with a clear error instead of rendering.
 */
export const render: Render = async () => {
  throw new Error("Renderer not wired: export the stream A renderer from src/server/render.ts");
};
