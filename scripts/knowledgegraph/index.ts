import { resolve, basename } from "path";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { detect } from "./detect.js";
import { extract } from "./extract.js";
import { build } from "./build.js";
import { cluster, nameCommunities } from "./cluster.js";
import { report } from "./report.js";
import { exportAll } from "./export.js";
import { loadCache, saveCache, buildCache, diffFiles, hashFile } from "./cache.js";
import type { CLIArgs, Subcommand, DetailLevel } from "./types.js";
import Graph from "graphology";
import { bidirectional } from "graphology-shortest-path";
import { join } from "path";

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const subcommand = (args[0] || "build") as Subcommand;

  let detail: DetailLevel = "standard";
  let force = false;
  let depth = 2;
  const filtered: string[] = [];

  for (const arg of args.slice(1)) {
    if (arg.startsWith("--detail=")) {
      detail = arg.split("=")[1] as DetailLevel;
    } else if (arg === "--force") {
      force = true;
    } else if (arg.startsWith("--depth=")) {
      depth = parseInt(arg.split("=")[1]) || 2;
    } else {
      filtered.push(arg);
    }
  }

  switch (subcommand) {
    case "query":
      return { subcommand, target: filtered.join(" "), detail };
    case "path":
      return { subcommand, from: filtered[0], to: filtered[1], detail };
    case "context":
      return { subcommand, task: filtered.join(" "), detail };
    case "impact":
      return { subcommand, target: filtered.join(" "), depth, detail };
    case "update":
      return { subcommand, force };
    case "build":
      return { subcommand, force };
    default:
      return { subcommand: "build" };
  }
}

function loadGraph(outputDir: string): Graph | null {
  const jsonPath = resolve(outputDir, "graph.json");
  if (!existsSync(jsonPath)) return null;

  const data = JSON.parse(readFileSync(jsonPath, "utf-8"));
  const graph = new Graph({ multi: false, type: "directed" });

  if (data.strings) {
    const strs: string[] = data.strings;
    const idxToId = new Map<number, string>();
    for (const node of data.nodes) {
      const [idx, label, typeIdx, sfIdx, location, community] = node;
      const type = strs[typeIdx];
      const sourceFile = strs[sfIdx];
      const id = `${sourceFile}:${type}:${label}`;
      idxToId.set(idx, id);
      graph.addNode(id, { label, type, sourceFile, location, community });
    }
    for (const edge of data.edges) {
      const [si, ti, relIdx, confIdx] = edge;
      const source = idxToId.get(si);
      const target = idxToId.get(ti);
      if (source && target && !graph.hasDirectedEdge(source, target)) {
        try { graph.addEdge(source, target, { relationship: strs[relIdx], confidence: strs[confIdx] }); } catch { /* skip */ }
      }
    }
  } else if (data.format) {
    const idxToId = new Map<number, string>();
    for (const node of data.nodes) {
      const [idx, label, type, sourceFile, location, community] = node;
      const id = `${sourceFile}:${type}:${label}`;
      idxToId.set(idx, id);
      graph.addNode(id, { label, type, sourceFile, location, community });
    }
    for (const edge of data.edges) {
      const [si, ti, relationship, confidence] = edge;
      const source = idxToId.get(si);
      const target = idxToId.get(ti);
      if (source && target && !graph.hasDirectedEdge(source, target)) {
        try { graph.addEdge(source, target, { relationship, confidence }); } catch { /* skip */ }
      }
    }
  } else {
    for (const node of data.nodes) {
      graph.addNode(node.id, node);
    }
    for (const edge of data.edges) {
      if (!graph.hasDirectedEdge(edge.source, edge.target)) {
        try { graph.addEdge(edge.source, edge.target, edge); } catch { /* skip */ }
      }
    }
  }
  return graph;
}

async function main(): Promise<void> {
  const cliArgs = parseArgs();
  const rootDir = process.cwd();
  const projectName = basename(rootDir);
  const outputDir = resolve(rootDir, "knowledgegraph");

  if (cliArgs.subcommand === "build" || cliArgs.subcommand === "update") {
    const isIncremental = cliArgs.subcommand === "update" && !cliArgs.force;
    mkdirSync(outputDir, { recursive: true });

    console.log(`Detecting files in ${rootDir}...`);
    const files = detect(rootDir);
    console.log(`Found ${files.length} files`);

    if (files.length === 0) {
      console.log("No supported files found.");
      return;
    }

    const cache = isIncremental ? loadCache(outputDir) : null;

    const fileContents = new Map<string, string>();
    for (const file of files) {
      try {
        fileContents.set(file, readFileSync(join(rootDir, file), "utf-8"));
      } catch { /* skip */ }
    }

    let extraction;
    if (cache) {
      const diff = diffFiles(files, fileContents, cache);
      if (diff.changedFiles.length === 0 && diff.deletedFiles.length === 0) {
        console.log("No changes detected. Graph is up to date.");
        return;
      }
      console.log(`Incremental: ${diff.changedFiles.length} changed, ${diff.unchangedFiles.length} cached, ${diff.deletedFiles.length} deleted`);
      console.log(`Extracting from changed files...`);
      const freshExtraction = extract(diff.changedFiles, rootDir);
      extraction = {
        nodes: [...diff.cachedNodes, ...freshExtraction.nodes],
        edges: [...diff.cachedEdges, ...freshExtraction.edges],
        tokenCount: freshExtraction.tokenCount + diff.unchangedFiles.reduce((sum, f) => sum + Math.ceil((fileContents.get(f)?.length || 0) / 4), 0),
        files,
      };
    } else {
      console.log(`Extracting entities and relationships...`);
      extraction = extract(files, rootDir);
    }
    console.log(`Extracted ${extraction.nodes.length} nodes, ${extraction.edges.length} edges`);

    console.log(`Building graph...`);
    const graph = build(extraction);

    console.log(`Clustering...`);
    const communities = cluster(graph);
    const namedCommunities = nameCommunities(communities, graph);
    console.log(`Found ${Object.keys(communities).length} communities`);

    console.log(`Generating report...`);
    const reportData = report(graph, communities, namedCommunities);

    console.log(`Exporting...`);
    exportAll(graph, communities, reportData, { outputDir, projectName });

    const newCache = buildCache(files, fileContents, extraction.nodes, extraction.edges);
    saveCache(outputDir, newCache);

    console.log(`\nDone! Output in ${outputDir}/`);
    console.log(`- graph.json (Claude-consumable compressed context)`);
    console.log(`- graph.html (interactive visualization)`);
    console.log(`- obsidian-vault/ (open in Obsidian for native graph view)`);
    console.log(`- report.md (analysis report)`);
    console.log(`\n${reportData.markdown.split("\n").slice(0, 15).join("\n")}`);
    return;
  }

  const graph = loadGraph(outputDir);
  if (!graph) {
    console.error("No graph found. Run build first: /tokendiet knowledgegraph build");
    process.exit(1);
  }

  if (cliArgs.subcommand === "query") {
    const term = (cliArgs.target || "").toLowerCase();
    if (!term) { console.error("Usage: query <search term>"); process.exit(1); }
    const detail = cliArgs.detail || "standard";

    const matches: Array<{ id: string; label: string; type: string; sourceFile: string; degree: number }> = [];
    graph.forEachNode((id, attrs) => {
      if (attrs.label?.toLowerCase().includes(term) || id.toLowerCase().includes(term)) {
        matches.push({ id, label: attrs.label, type: attrs.type, sourceFile: attrs.sourceFile, degree: graph.degree(id) });
      }
    });

    matches.sort((a, b) => b.degree - a.degree);
    console.log(`Found ${matches.length} matches for "${term}":\n`);
    for (const m of matches.slice(0, 20)) {
      if (detail === "minimal") {
        console.log(`  ${m.label} (${m.type}) in ${m.sourceFile}`);
      } else {
        console.log(`  ${m.label} (${m.type}) in ${m.sourceFile} [${m.degree} connections]`);
        graph.forEachEdge(m.id, (_e, attrs, source, target) => {
          const other = source === m.id ? target : source;
          const otherAttrs = graph.getNodeAttributes(other);
          if (detail === "full") {
            console.log(`    -> ${attrs.relationship} ${otherAttrs.label || other} (${otherAttrs.type}) in ${otherAttrs.sourceFile}:${otherAttrs.location || "?"}`);
          } else {
            console.log(`    -> ${attrs.relationship} ${otherAttrs.label || other}`);
          }
        });
      }
    }
    return;
  }

  if (cliArgs.subcommand === "path") {
    if (!cliArgs.from || !cliArgs.to) { console.error("Usage: path <from> <to>"); process.exit(1); }

    const findNode = (term: string): string | null => {
      let best: string | null = null;
      graph.forEachNode((id, attrs) => {
        if (attrs.label?.toLowerCase() === term.toLowerCase()) best = id;
        if (!best && (attrs.label?.toLowerCase().includes(term.toLowerCase()) || id.toLowerCase().includes(term.toLowerCase()))) best = id;
      });
      return best;
    };

    const fromNode = findNode(cliArgs.from);
    const toNode = findNode(cliArgs.to);
    if (!fromNode) { console.error(`Node not found: ${cliArgs.from}`); process.exit(1); }
    if (!toNode) { console.error(`Node not found: ${cliArgs.to}`); process.exit(1); }

    const undirected = new Graph({ type: "undirected" });
    graph.forEachNode((id, attrs) => undirected.addNode(id, attrs));
    graph.forEachEdge((_e, attrs, source, target) => {
      if (!undirected.hasEdge(source, target)) {
        try { undirected.addEdge(source, target, attrs); } catch { /* skip */ }
      }
    });

    const path = bidirectional(undirected, fromNode, toNode);
    if (!path) {
      console.log(`No path found between "${cliArgs.from}" and "${cliArgs.to}"`);
      return;
    }

    console.log(`Path from "${cliArgs.from}" to "${cliArgs.to}" (${path.length - 1} hops):\n`);
    for (let i = 0; i < path.length; i++) {
      const attrs = graph.getNodeAttributes(path[i]);
      console.log(`  ${i + 1}. ${attrs.label} (${attrs.type}) in ${attrs.sourceFile}`);
      if (i < path.length - 1) {
        console.log(`     |`);
      }
    }
    return;
  }

  if (cliArgs.subcommand === "impact") {
    const term = (cliArgs.target || "").toLowerCase();
    if (!term) { console.error("Usage: impact <file-or-entity> [--depth=N]"); process.exit(1); }
    const maxDepth = cliArgs.depth || 2;
    const detail = cliArgs.detail || "standard";

    const startNodes: string[] = [];
    graph.forEachNode((id, attrs) => {
      if (attrs.label?.toLowerCase().includes(term) || attrs.sourceFile?.toLowerCase().includes(term) || id.toLowerCase().includes(term)) {
        startNodes.push(id);
      }
    });

    if (startNodes.length === 0) { console.error(`No nodes found matching: ${term}`); process.exit(1); }

    const visited = new Map<string, number>();
    const queue: Array<[string, number]> = startNodes.map((n) => [n, 0]);
    for (const n of startNodes) visited.set(n, 0);

    while (queue.length > 0) {
      const [current, depth] = queue.shift()!;
      if (depth >= maxDepth) continue;

      graph.forEachEdge(current, (_e, _attrs, source, target) => {
        const neighbor = source === current ? target : source;
        if (!visited.has(neighbor)) {
          visited.set(neighbor, depth + 1);
          queue.push([neighbor, depth + 1]);
        }
      });
    }

    const impacted = [...visited.entries()]
      .filter(([id]) => !startNodes.includes(id))
      .sort((a, b) => a[1] - b[1]);

    console.log(`Impact analysis for "${term}" (depth ${maxDepth}):\n`);
    console.log(`  Starting nodes: ${startNodes.length}`);
    console.log(`  Impacted entities: ${impacted.length}\n`);

    for (const [id, dist] of impacted.slice(0, 30)) {
      const attrs = graph.getNodeAttributes(id);
      if (detail === "minimal") {
        console.log(`  [hop ${dist}] ${attrs.label} (${attrs.type})`);
      } else {
        console.log(`  [hop ${dist}] ${attrs.label} (${attrs.type}) in ${attrs.sourceFile}:${attrs.location || "?"}`);
      }
    }
    if (impacted.length > 30) console.log(`  ...and ${impacted.length - 30} more`);
    return;
  }

  if (cliArgs.subcommand === "context") {
    const task = (cliArgs.task || "").toLowerCase();
    if (!task) { console.error("Usage: context <task description>"); process.exit(1); }
    const detail = cliArgs.detail || "standard";

    const taskTokens = task.split(/\s+/);
    const nodeScores = new Map<string, number>();

    graph.forEachNode((id, attrs) => {
      let score = 0;
      for (const token of taskTokens) {
        if (attrs.label?.toLowerCase().includes(token)) score += 3;
        if (attrs.sourceFile?.toLowerCase().includes(token)) score += 2;
        if (id.toLowerCase().includes(token)) score += 1;
      }
      if (score > 0) nodeScores.set(id, score);
    });

    const relevantNodes = [...nodeScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([id]) => id);

    const relevantCommunities = new Set<number>();
    for (const id of relevantNodes) {
      const comm = graph.getNodeAttributes(id).community;
      if (comm !== undefined) relevantCommunities.add(comm);
    }

    console.log(`Context for: "${cliArgs.task}"\n`);
    console.log(`Relevant communities: ${[...relevantCommunities].join(", ")}`);
    console.log(`Relevant nodes: ${relevantNodes.length}\n`);

    for (const id of relevantNodes.slice(0, 15)) {
      const attrs = graph.getNodeAttributes(id);
      const score = nodeScores.get(id) || 0;
      if (detail === "minimal") {
        console.log(`  [${score}] ${attrs.label} (${attrs.type})`);
      } else {
        console.log(`  [${score}] ${attrs.label} (${attrs.type}) in ${attrs.sourceFile}:${attrs.location || "?"}`);
      }
    }
    return;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
