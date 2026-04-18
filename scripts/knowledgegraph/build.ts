import Graph from "graphology";
import { ExtractionResult, GraphNode, GraphEdge } from "./types.js";

export function build(extraction: ExtractionResult): Graph {
  const graph = new Graph({ multi: true, type: "directed" });

  const nodeIds = new Set<string>();

  for (const node of extraction.nodes) {
    if (nodeIds.has(node.id)) continue;
    nodeIds.add(node.id);

    graph.addNode(node.id, {
      label: node.label,
      type: node.type,
      sourceFile: node.sourceFile,
      location: node.location,
    });
  }

  for (const edge of extraction.edges) {
    if (edge.target.includes("*")) continue;
    if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) continue;
    if (edge.source === edge.target) continue;

    try {
      graph.addEdge(edge.source, edge.target, {
        relationship: edge.relationship,
        confidence: edge.confidence,
        weight: edge.weight ?? confidenceWeight(edge.confidence),
      });
    } catch {
      // skip duplicate edges in non-multi mode
    }
  }

  graph.setAttribute("tokenCount", extraction.tokenCount);
  graph.setAttribute("fileCount", extraction.files.length);

  return graph;
}

function confidenceWeight(confidence: GraphEdge["confidence"]): number {
  switch (confidence) {
    case "EXTRACTED": return 1.0;
    case "INFERRED": return 0.6;
    case "AMBIGUOUS": return 0.3;
  }
}
