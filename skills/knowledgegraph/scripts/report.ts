import Graph from "graphology";
import { CommunityMap, GraphReport } from "./types.js";

export function report(graph: Graph, communities: CommunityMap): GraphReport {
  const nodeCount = graph.order;
  const edgeCount = graph.size;
  const communityCount = Object.keys(communities).length;
  const fileCount = graph.getAttribute("fileCount") ?? 0;
  const tokenCount = graph.getAttribute("tokenCount") ?? 0;

  let extractedEdges = 0;
  let inferredEdges = 0;
  let ambiguousEdges = 0;

  graph.forEachEdge((_e, attrs) => {
    switch (attrs.confidence) {
      case "EXTRACTED": extractedEdges++; break;
      case "INFERRED": inferredEdges++; break;
      case "AMBIGUOUS": ambiguousEdges++; break;
    }
  });

  const degreeMap: Array<{ id: string; degree: number; label: string }> = [];
  graph.forEachNode((node, attrs) => {
    degreeMap.push({ id: node, degree: graph.degree(node), label: attrs.label });
  });
  degreeMap.sort((a, b) => b.degree - a.degree);

  const godNodes = degreeMap.slice(0, 10).filter((n) => n.degree > 3);
  const isolatedNodes = degreeMap.filter((n) => n.degree === 0).map((n) => n.id);

  const compressedTokens = estimateGraphTokens(graph, communities);
  const savings = tokenCount > 0 ? Math.round((1 - compressedTokens / tokenCount) * 100) : 0;

  const lines: string[] = [];
  lines.push(`# Knowledge Graph Report`);
  lines.push(`_Generated ${new Date().toISOString().split("T")[0]}_\n`);

  lines.push(`## Token Savings`);
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Raw codebase tokens | ~${tokenCount.toLocaleString()} |`);
  lines.push(`| Compressed graph tokens | ~${compressedTokens.toLocaleString()} |`);
  lines.push(`| **Reduction** | **${savings}%** |`);
  lines.push(``);

  lines.push(`## Graph Summary`);
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Files | ${fileCount} |`);
  lines.push(`| Nodes | ${nodeCount} |`);
  lines.push(`| Edges | ${edgeCount} |`);
  lines.push(`| Communities | ${communityCount} |`);
  lines.push(`| Isolated nodes | ${isolatedNodes.length} |`);
  lines.push(``);

  lines.push(`## Edge Confidence`);
  lines.push(`| Level | Count | % |`);
  lines.push(`|-------|-------|---|`);
  if (edgeCount > 0) {
    lines.push(`| EXTRACTED | ${extractedEdges} | ${pct(extractedEdges, edgeCount)} |`);
    lines.push(`| INFERRED | ${inferredEdges} | ${pct(inferredEdges, edgeCount)} |`);
    lines.push(`| AMBIGUOUS | ${ambiguousEdges} | ${pct(ambiguousEdges, edgeCount)} |`);
  }
  lines.push(``);

  if (godNodes.length > 0) {
    lines.push(`## God Nodes (most connected)`);
    lines.push(`| Node | Connections |`);
    lines.push(`|------|-------------|`);
    for (const gn of godNodes) {
      lines.push(`| ${gn.label} | ${gn.degree} |`);
    }
    lines.push(``);
  }

  lines.push(`## Communities`);
  const sortedCommunities = Object.entries(communities)
    .sort((a, b) => b[1].length - a[1].length);

  for (const [cid, members] of sortedCommunities) {
    const memberLabels = members
      .map((m: string) => graph.hasNode(m) ? graph.getNodeAttributes(m).label : m)
      .slice(0, 15);
    lines.push(`### Community ${cid} (${members.length} nodes)`);
    lines.push(memberLabels.map((l: string) => `- ${l}`).join("\n"));
    if (members.length > 15) lines.push(`- _...and ${members.length - 15} more_`);
    lines.push(``);
  }

  if (isolatedNodes.length > 0 && isolatedNodes.length <= 20) {
    lines.push(`## Isolated Nodes`);
    for (const n of isolatedNodes) {
      const label = graph.hasNode(n) ? graph.getNodeAttributes(n).label : n;
      lines.push(`- ${label}`);
    }
    lines.push(``);
  }

  return {
    markdown: lines.join("\n"),
    stats: {
      nodeCount,
      edgeCount,
      communityCount,
      fileCount,
      extractedEdges,
      inferredEdges,
      ambiguousEdges,
      godNodes: godNodes.map((g) => ({ id: g.id, degree: g.degree })),
      isolatedNodes,
    },
  };
}

function pct(n: number, total: number): string {
  return `${Math.round((n / total) * 100)}%`;
}

function estimateGraphTokens(graph: Graph, communities: CommunityMap): number {
  let tokens = 0;
  tokens += graph.order * 8;
  tokens += graph.size * 6;
  tokens += Object.keys(communities).length * 15;
  tokens += 100;
  return tokens;
}
