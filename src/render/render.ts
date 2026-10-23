import { writeSection } from "@/agents/renderer/agent";
import type { Render } from "./contract";
import { createRender } from "./create-render";

/** The renderer called by the workflow: prose sections written by the writer model. */
export const render: Render = createRender(writeSection);
