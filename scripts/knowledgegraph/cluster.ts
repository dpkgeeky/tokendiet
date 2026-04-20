import Graph from "graphology";
import louvain from "graphology-communities-louvain";
import { CommunityMap, NamedCommunityMap } from "./types.js";

export function cluster(graph: Graph): CommunityMap {
  if (graph.order === 0) return {};

  const undirected = new Graph({ type: "undirected" });

  graph.forEachNode((node, attrs) => {
    undirected.addNode(node, attrs);
  });

  graph.forEachEdge((_edge, attrs, source, target) => {
    if (source === target) return;
    if (!undirected.hasEdge(source, target) && !undirected.hasEdge(target, source)) {
      try {
        undirected.addEdge(source, target, { weight: attrs.weight ?? 1 });
      } catch {
        // skip
      }
    }
  });

  const isolated: string[] = [];
  const connected = new Graph({ type: "undirected" });

  undirected.forEachNode((node, attrs) => {
    if (undirected.degree(node) === 0) {
      isolated.push(node);
    } else {
      connected.addNode(node, attrs);
    }
  });

  undirected.forEachEdge((_edge, attrs, source, target) => {
    if (connected.hasNode(source) && connected.hasNode(target)) {
      try {
        connected.addEdge(source, target, attrs);
      } catch {
        // skip
      }
    }
  });

  let communityAssignments: Record<string, number> = {};

  if (connected.order > 0) {
    communityAssignments = louvain(connected, { resolution: 1.0 });
  }

  for (const node of isolated) {
    communityAssignments[node] = -1;
  }

  const communities = splitOversized(communityAssignments, connected, graph.order);

  graph.forEachNode((node) => {
    const community = communities[node] ?? -1;
    graph.setNodeAttribute(node, "community", community);
  });

  return groupByCommunity(communities);
}

function splitOversized(
  assignments: Record<string, number>,
  graph: Graph,
  totalNodes: number
): Record<string, number> {
  const maxSize = Math.max(10, Math.floor(totalNodes * 0.25));
  const byCommunity = groupByCommunity(assignments);
  const result: Record<string, number> = {};
  let nextId = 0;

  const sorted = Object.entries(byCommunity).sort((a, b) => b[1].length - a[1].length);

  for (const [, members] of sorted) {
    if (members.length <= maxSize) {
      for (const node of members) {
        result[node] = nextId;
      }
      nextId++;
    } else {
      const subgraph = new Graph({ type: "undirected" });
      for (const node of members) {
        if (graph.hasNode(node)) {
          subgraph.addNode(node, graph.getNodeAttributes(node));
        }
      }
      for (const node of members) {
        if (!graph.hasNode(node)) continue;
        graph.forEachEdge(node, (_edge, attrs, source, target) => {
          if (subgraph.hasNode(source) && subgraph.hasNode(target) && !subgraph.hasEdge(source, target)) {
            try {
              subgraph.addEdge(source, target, attrs);
            } catch {
              // skip
            }
          }
        });
      }

      if (subgraph.order > 1 && subgraph.size > 0) {
        try {
          const subAssignments = louvain(subgraph, { resolution: 1.5 });
          const subGroups = groupByCommunity(subAssignments);
          for (const [, subMembers] of Object.entries(subGroups)) {
            for (const node of subMembers) {
              result[node] = nextId;
            }
            nextId++;
          }
          continue;
        } catch {
          // fall through
        }
      }

      for (const node of members) {
        result[node] = nextId;
      }
      nextId++;
    }
  }

  return result;
}

function groupByCommunity(assignments: Record<string, number>): CommunityMap {
  const map: CommunityMap = {};
  for (const [node, community] of Object.entries(assignments)) {
    if (!map[community]) map[community] = [];
    map[community].push(node);
  }
  return map;
}

export function nameCommunities(communities: CommunityMap, graph: Graph): NamedCommunityMap {
  const named: NamedCommunityMap = {};

  for (const [cid, members] of Object.entries(communities)) {
    const id = Number(cid);
    const name = deriveCommunityName(members, graph);
    named[id] = { name, members };
  }

  return named;
}

function deriveCommunityName(members: string[], graph: Graph): string {
  const sourceFiles: string[] = [];
  const classLabels: string[] = [];

  for (const m of members) {
    if (!graph.hasNode(m)) continue;
    const attrs = graph.getNodeAttributes(m);
    if (attrs.sourceFile) sourceFiles.push(attrs.sourceFile);
    if (attrs.type === "class") classLabels.push(attrs.label);
  }

  if (classLabels.length > 0 && classLabels.length >= members.length * 0.3) {
    return classLabels[0];
  }

  if (sourceFiles.length === 0) return "misc";

  const dirs = sourceFiles.map((f) => {
    const parts = f.split("/");
    return parts.length > 1 ? parts.slice(0, -1).join("/") : parts[0];
  });

  const dirCounts = new Map<string, number>();
  for (const d of dirs) {
    dirCounts.set(d, (dirCounts.get(d) || 0) + 1);
  }

  let bestDir = "";
  let bestCount = 0;
  for (const [d, count] of dirCounts) {
    if (count > bestCount) { bestDir = d; bestCount = count; }
  }

  const parts = bestDir.split("/");
  return parts[parts.length - 1] || bestDir || "root";
}
