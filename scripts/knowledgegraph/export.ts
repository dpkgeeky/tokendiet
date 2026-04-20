import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import Graph from "graphology";
import { CommunityMap, ExportOptions, GraphReport } from "./types.js";

export function exportAll(
  graph: Graph,
  communities: CommunityMap,
  reportData: GraphReport,
  options: ExportOptions
): void {
  mkdirSync(options.outputDir, { recursive: true });

  toJSON(graph, communities, options);
  toObsidian(graph, communities, options);
  toHTML(graph, communities, options);

  writeFileSync(join(options.outputDir, "report.md"), reportData.markdown);
}

function toJSON(graph: Graph, communities: CommunityMap, options: ExportOptions): void {
  const strings: string[] = [];
  const stringIndex = new Map<string, number>();
  function intern(s: string): number {
    let idx = stringIndex.get(s);
    if (idx === undefined) {
      idx = strings.length;
      strings.push(s);
      stringIndex.set(s, idx);
    }
    return idx;
  }

  const idToIdx = new Map<string, number>();
  const nodes: Array<[number, string, number, number, number | undefined, number | undefined]> = [];
  let idx = 0;

  graph.forEachNode((id, attrs) => {
    idToIdx.set(id, idx);
    nodes.push([idx, attrs.label, intern(attrs.type), intern(attrs.sourceFile), attrs.location, attrs.community]);
    idx++;
  });

  const edges: Array<[number, number, number, number]> = [];
  graph.forEachEdge((_e, attrs, source, target) => {
    const si = idToIdx.get(source);
    const ti = idToIdx.get(target);
    if (si !== undefined && ti !== undefined) {
      edges.push([si, ti, intern(attrs.relationship), intern(attrs.confidence)]);
    }
  });

  const compactCommunities: Record<string, number[]> = {};
  for (const [cid, members] of Object.entries(communities)) {
    compactCommunities[cid] = members.map((m: string) => idToIdx.get(m)).filter((i): i is number => i !== undefined);
  }

  const data = {
    project: options.projectName,
    generated: new Date().toISOString(),
    strings,
    format: ["idx", "label", "type*", "sourceFile*", "location", "community"],
    edgeFormat: ["source", "target", "relationship*", "confidence*"],
    nodes,
    edges,
    communities: compactCommunities,
  };

  writeFileSync(join(options.outputDir, "graph.json"), JSON.stringify(data));
}

function toObsidian(graph: Graph, communities: CommunityMap, options: ExportOptions): void {
  const vaultDir = join(options.outputDir, "obsidian-vault");
  const obsidianDir = join(vaultDir, ".obsidian");
  mkdirSync(vaultDir, { recursive: true });
  mkdirSync(obsidianDir, { recursive: true });

  const labelToFile = new Map<string, string>();
  const usedNames = new Set<string>();

  graph.forEachNode((id, attrs) => {
    let name = sanitizeFileName(attrs.label || id);
    if (usedNames.has(name)) {
      let counter = 2;
      while (usedNames.has(`${name}_${counter}`)) counter++;
      name = `${name}_${counter}`;
    }
    usedNames.add(name);
    labelToFile.set(id, name);
  });

  graph.forEachNode((id, attrs) => {
    const fileName = labelToFile.get(id)!;
    const lines: string[] = [];

    lines.push(`---`);
    lines.push(`source_file: "${attrs.sourceFile || ""}"`);
    lines.push(`type: ${attrs.type || "unknown"}`);
    lines.push(`community: ${attrs.community ?? -1}`);
    if (attrs.location) lines.push(`location: ${attrs.location}`);
    lines.push(`---`);
    lines.push(``);

    const tags: string[] = [];
    if (attrs.type) tags.push(`#tokendiet/${attrs.type}`);
    if (attrs.community !== undefined && attrs.community >= 0) {
      tags.push(`#tokendiet/community-${attrs.community}`);
    }
    if (tags.length > 0) lines.push(tags.join(" "));
    lines.push(``);

    const neighbors = new Set<string>();
    graph.forEachEdge(id, (_e, edgeAttrs, source, target) => {
      const other = source === id ? target : source;
      const otherFile = labelToFile.get(other);
      if (otherFile) {
        neighbors.add(otherFile);
        const rel = edgeAttrs.relationship || "related";
        const conf = edgeAttrs.confidence || "";
        lines.push(`- ${rel} [[${otherFile}]]${conf === "AMBIGUOUS" ? " _(ambiguous)_" : ""}`);
      }
    });

    if (attrs.sourceFile) {
      lines.push(``);
      lines.push(`> Source: \`${attrs.sourceFile}${attrs.location ? `:${attrs.location}` : ""}\``);
    }

    writeFileSync(join(vaultDir, `${fileName}.md`), lines.join("\n"));
  });

  const sortedCommunities = Object.entries(communities)
    .sort((a, b) => b[1].length - a[1].length);

  for (const [cid, members] of sortedCommunities) {
    const lines: string[] = [];
    lines.push(`---`);
    lines.push(`type: community`);
    lines.push(`community_id: ${cid}`);
    lines.push(`member_count: ${members.length}`);
    lines.push(`---`);
    lines.push(``);
    lines.push(`# Community ${cid}`);
    lines.push(``);
    lines.push(`#tokendiet/community-${cid}`);
    lines.push(``);

    lines.push(`## Members (${members.length})`);
    for (const m of members) {
      const file = labelToFile.get(m);
      if (file) lines.push(`- [[${file}]]`);
    }
    lines.push(``);

    const bridgeNodes = members
      .filter((m: string) => graph.hasNode(m))
      .map((m: string) => ({ id: m, degree: graph.degree(m), label: graph.getNodeAttributes(m).label as string }))
      .sort((a: { degree: number }, b: { degree: number }) => b.degree - a.degree)
      .slice(0, 5);

    if (bridgeNodes.length > 0) {
      lines.push(`## Bridge Nodes`);
      for (const bn of bridgeNodes) {
        const file = labelToFile.get(bn.id);
        lines.push(`- [[${file}]] (${bn.degree} connections)`);
      }
      lines.push(``);
    }

    const connectedCommunities = new Set<string>();
    for (const m of members) {
      if (!graph.hasNode(m)) continue;
      graph.forEachEdge(m, (_e, _attrs, source, target) => {
        const other = source === m ? target : source;
        if (graph.hasNode(other)) {
          const otherComm = graph.getNodeAttributes(other).community;
          if (otherComm !== undefined && String(otherComm) !== cid) {
            connectedCommunities.add(String(otherComm));
          }
        }
      });
    }

    if (connectedCommunities.size > 0) {
      lines.push(`## Connected Communities`);
      for (const cc of connectedCommunities) {
        lines.push(`- [[_COMMUNITY_${cc}]]`);
      }
      lines.push(``);
    }

    lines.push(`## Dataview Query`);
    lines.push("```dataview");
    lines.push(`TABLE source_file, type`);
    lines.push(`FROM #tokendiet/community-${cid}`);
    lines.push(`SORT type ASC`);
    lines.push("```");

    writeFileSync(join(vaultDir, `_COMMUNITY_${cid}.md`), lines.join("\n"));
  }

  const colorGroups: Array<{ query: string; color: { a: number; rgb: number } }> = [];
  const palette = [0x4285F4, 0xEA4335, 0xFBBC04, 0x34A853, 0xFF6D01, 0x46BDC6, 0x7BAAF7, 0xF07B72, 0xFCD04F, 0x71C287];

  for (const [cid] of sortedCommunities) {
    const idx = parseInt(cid) % palette.length;
    colorGroups.push({
      query: `tag:#tokendiet/community-${cid}`,
      color: { a: 1, rgb: palette[idx] },
    });
  }

  const graphConfig = {
    collapse: { "color-groups": false, "query": false },
    search: "",
    showTags: false,
    showAttachments: false,
    showOrphans: true,
    "colorGroups": colorGroups,
    "close": false,
  };

  writeFileSync(join(obsidianDir, "graph.json"), JSON.stringify(graphConfig, null, 2));

  const appConfig = {
    livePreview: true,
    showFrontmatter: false,
  };
  writeFileSync(join(obsidianDir, "app.json"), JSON.stringify(appConfig, null, 2));
}

function toHTML(graph: Graph, communities: CommunityMap, options: ExportOptions): void {
  const nodes: Array<{ id: string; label: string; group: number; size: number }> = [];
  const edges: Array<{ from: string; to: string; label: string; color: string; dashes: boolean }> = [];

  const maxDegree = Math.max(1, ...Array.from({ length: graph.order }, (_, i) => {
    const node = graph.nodes()[i];
    return node ? graph.degree(node) : 0;
  }));

  graph.forEachNode((id, attrs) => {
    const degree = graph.degree(id);
    nodes.push({
      id,
      label: attrs.label || id,
      group: attrs.community ?? 0,
      size: 10 + (degree / maxDegree) * 40,
    });
  });

  graph.forEachEdge((_e, attrs, source, target) => {
    const conf = attrs.confidence || "EXTRACTED";
    const color = conf === "EXTRACTED" ? "#333333" : conf === "INFERRED" ? "#888888" : "#CCCCCC";
    edges.push({
      from: source,
      to: target,
      label: attrs.relationship || "",
      color,
      dashes: conf === "AMBIGUOUS",
    });
  });

  const html = `<!DOCTYPE html>
<html>
<head>
<title>${options.projectName} - Knowledge Graph</title>
<script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
<style>
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #1a1a2e; color: #eee; }
#graph { width: 100vw; height: 100vh; }
#controls { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); padding: 12px; border-radius: 8px; z-index: 10; }
#search { padding: 6px 10px; border-radius: 4px; border: 1px solid #555; background: #2a2a3e; color: #eee; width: 200px; }
#info { position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); padding: 12px; border-radius: 8px; max-width: 300px; display: none; }
select { padding: 4px; background: #2a2a3e; color: #eee; border: 1px solid #555; border-radius: 4px; margin-left: 8px; }
</style>
</head>
<body>
<div id="controls">
  <input id="search" placeholder="Search nodes..." oninput="filterNodes(this.value)">
  <select id="communityFilter" onchange="filterCommunity(this.value)">
    <option value="all">All communities</option>
    ${Object.keys(communities).map((c) => `<option value="${c}">Community ${c}</option>`).join("\n    ")}
  </select>
</div>
<div id="graph"></div>
<div id="info"><h3 id="infoTitle"></h3><div id="infoBody"></div></div>
<script>
var nodesData = ${JSON.stringify(nodes)};
var edgesData = ${JSON.stringify(edges)};
var nodes = new vis.DataSet(nodesData);
var edges = new vis.DataSet(edgesData);
var container = document.getElementById("graph");
var network = new vis.Network(container, { nodes: nodes, edges: edges }, {
  physics: { stabilization: { iterations: 150 }, barnesHut: { gravitationalConstant: -3000 } },
  nodes: { shape: "dot", font: { color: "#eee", size: 12 } },
  edges: { arrows: "to", font: { size: 8, color: "#aaa" }, smooth: { type: "curvedCW" } },
  interaction: { hover: true, tooltipDelay: 100 }
});
network.on("click", function(p) {
  if (p.nodes.length > 0) {
    var n = nodesData.find(function(x) { return x.id === p.nodes[0]; });
    document.getElementById("info").style.display = "block";
    document.getElementById("infoTitle").textContent = n.label;
    document.getElementById("infoBody").innerHTML = "Community: " + n.group + "<br>Connections: " + network.getConnectedNodes(p.nodes[0]).length;
  } else {
    document.getElementById("info").style.display = "none";
  }
});
function filterNodes(q) {
  q = q.toLowerCase();
  nodesData.forEach(function(n) { nodes.update({ id: n.id, hidden: q && !n.label.toLowerCase().includes(q) }); });
}
function filterCommunity(c) {
  nodesData.forEach(function(n) { nodes.update({ id: n.id, hidden: c !== "all" && String(n.group) !== c }); });
}
</script>
</body>
</html>`;

  writeFileSync(join(options.outputDir, "graph.html"), html);
}

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, "_").replace(/\s+/g, "_").slice(0, 100);
}
