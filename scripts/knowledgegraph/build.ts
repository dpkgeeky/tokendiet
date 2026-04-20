import Graph from "graphology";
import { ExtractionResult, GraphNode, GraphEdge } from "./types.js";

export function build(extraction: ExtractionResult): Graph {
  const graph = new Graph({ multi: false, type: "directed" });

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

    const weight = edge.weight ?? confidenceWeight(edge.confidence);

    if (graph.hasDirectedEdge(edge.source, edge.target)) {
      const edgeKey = graph.edge(edge.source, edge.target)!;
      const existing = graph.getEdgeAttributes(edgeKey);
      if (weight > (existing.weight ?? 0)) {
        graph.setEdgeAttribute(edgeKey, "relationship", edge.relationship);
        graph.setEdgeAttribute(edgeKey, "confidence", edge.confidence);
        graph.setEdgeAttribute(edgeKey, "weight", weight);
      }
    } else {
      try {
        graph.addEdge(edge.source, edge.target, {
          relationship: edge.relationship,
          confidence: edge.confidence,
          weight,
        });
      } catch {
        // skip
      }
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
