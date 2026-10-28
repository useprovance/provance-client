import type { Node } from "@xyflow/react";

const CHOICE_NODE: Node = {
   id: "__choice__",
   type: "choice",
   position: { x: 0, y: 0 },
   data: {},
   draggable: false,
};

export function withChoiceSync(nodes: Node[]): Node[] {
   const real = nodes.filter((n) => n.id !== "__choice__");
   const hasChoice = nodes.some((n) => n.id === "__choice__");
   if (real.length === 0 && !hasChoice) return [CHOICE_NODE];
   if (real.length > 0 && hasChoice) return real;
   return nodes;
}
