import Graph from "graphology";
import { CommunityMap, GraphReport, NamedCommunityMap } from "./types.js";

export function report(graph: Graph, communities: CommunityMap, namedCommunities?: NamedCommunityMap): GraphReport {
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
    const communityName = namedCommunities?.[Number(cid)]?.name || cid;
    lines.push(`### Community ${cid}: ${communityName} (${members.length} nodes)`);
    lines.push(memberLabels.map((l: string) => `- ${l}`).join("\n"));
    if (members.length > 15) lines.push(`- _...and ${members.length - 15} more_`);
    lines.push(``);
  }

  const deadCode = detectDeadCode(graph);
  if (deadCode.length > 0) {
    lines.push(`## Potentially Unused Code`);
    lines.push(`_Entities with no inbound references (may be entry points or dead code)_\n`);
    for (const dc of deadCode.slice(0, 20)) {
      lines.push(`- ${dc.label} (${dc.type}) in ${dc.sourceFile}`);
    }
    if (deadCode.length > 20) lines.push(`- _...and ${deadCode.length - 20} more_`);
    lines.push(``);
  }

  const couplings = detectCrossCommunity(graph, communities);
  if (couplings.length > 0) {
    lines.push(`## Cross-Community Coupling`);
    lines.push(`_Community pairs with high inter-dependency_\n`);
    for (const c of couplings) {
      const nameA = namedCommunities?.[c.a]?.name || String(c.a);
      const nameB = namedCommunities?.[c.b]?.name || String(c.b);
      lines.push(`- ${nameA} ↔ ${nameB}: ${c.edges} edges`);
    }
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
  const strings: string[] = [];
  const stringIndex = new Map<string, number>();
  function intern(s: string): number {
    let idx = stringIndex.get(s);
    if (idx === undefined) { idx = strings.length; strings.push(s); stringIndex.set(s, idx); }
    return idx;
  }

  const idToIdx = new Map<string, number>();
  const nodes: Array<unknown[]> = [];
  let idx = 0;
  graph.forEachNode((id, attrs) => {
    idToIdx.set(id, idx);
    nodes.push([idx, attrs.label, intern(attrs.type), intern(attrs.sourceFile), attrs.location, attrs.community]);
    idx++;
  });

  const edges: Array<unknown[]> = [];
  graph.forEachEdge((_e, attrs, source, target) => {
    const si = idToIdx.get(source);
    const ti = idToIdx.get(target);
    if (si !== undefined && ti !== undefined) {
      edges.push([si, ti, intern(attrs.relationship), intern(attrs.confidence)]);
    }
  });

  const compactComm: Record<string, number[]> = {};
  for (const [cid, members] of Object.entries(communities)) {
    compactComm[cid] = members.map((m: string) => idToIdx.get(m)).filter((i): i is number => i !== undefined);
  }

  const serialized = JSON.stringify({ strings, nodes, edges, communities: compactComm });
  return Math.ceil(serialized.length / 4);
}

function detectDeadCode(graph: Graph): Array<{ label: string; type: string; sourceFile: string }> {
  const deadCode: Array<{ label: string; type: string; sourceFile: string }> = [];

  graph.forEachNode((id, attrs) => {
    if (attrs.type === "file" || attrs.type === "import") return;

    let hasInboundRef = false;
    graph.forEachInEdge(id, (_e, edgeAttrs, source) => {
      if (edgeAttrs.relationship !== "contains") {
        hasInboundRef = true;
      }
    });

    if (!hasInboundRef && attrs.type !== "test") {
      deadCode.push({ label: attrs.label, type: attrs.type, sourceFile: attrs.sourceFile });
    }
  });

  return deadCode.sort((a, b) => a.sourceFile.localeCompare(b.sourceFile));
}

function detectCrossCommunity(graph: Graph, communities: CommunityMap): Array<{ a: number; b: number; edges: number }> {
  const pairCounts = new Map<string, { a: number; b: number; count: number }>();

  graph.forEachEdge((_e, _attrs, source, target) => {
    if (!graph.hasNode(source) || !graph.hasNode(target)) return;
    const commA = graph.getNodeAttributes(source).community;
    const commB = graph.getNodeAttributes(target).community;
    if (commA === undefined || commB === undefined || commA === commB) return;
    if (commA === -1 || commB === -1) return;

    const key = commA < commB ? `${commA}:${commB}` : `${commB}:${commA}`;
    const existing = pairCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      pairCounts.set(key, { a: Math.min(commA, commB), b: Math.max(commA, commB), count: 1 });
    }
  });

  return [...pairCounts.values()]
    .filter((p) => p.count > 5)
    .map((p) => ({ a: p.a, b: p.b, edges: p.count }))
    .sort((a, b) => b.edges - a.edges);
}
