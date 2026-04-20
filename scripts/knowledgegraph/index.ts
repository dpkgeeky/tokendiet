import { resolve, basename } from "path";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { detect } from "./detect.js";
import { extract } from "./extract.js";
import { build } from "./build.js";
import { cluster } from "./cluster.js";
import { report } from "./report.js";
import { exportAll } from "./export.js";
import type { CLIArgs, Subcommand } from "./types.js";
import Graph from "graphology";
import { bidirectional } from "graphology-shortest-path";

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const subcommand = (args[0] || "build") as Subcommand;

  switch (subcommand) {
    case "query":
      return { subcommand, target: args.slice(1).join(" ") };
    case "path":
      return { subcommand, from: args[1], to: args[2] };
    case "context":
      return { subcommand, task: args.slice(1).join(" ") };
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

  if (cliArgs.subcommand === "build") {
    console.log(`Detecting files in ${rootDir}...`);
    const files = detect(rootDir);
    console.log(`Found ${files.length} files`);

    if (files.length === 0) {
      console.log("No supported files found.");
      return;
    }

    console.log(`Extracting entities and relationships...`);
    const extraction = extract(files, rootDir);
    console.log(`Extracted ${extraction.nodes.length} nodes, ${extraction.edges.length} edges`);

    console.log(`Building graph...`);
    const graph = build(extraction);

    console.log(`Clustering...`);
    const communities = cluster(graph);
    console.log(`Found ${Object.keys(communities).length} communities`);

    console.log(`Generating report...`);
    const reportData = report(graph, communities);

    console.log(`Exporting...`);
    exportAll(graph, communities, reportData, { outputDir, projectName });

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

    const matches: Array<{ id: string; label: string; type: string; sourceFile: string; degree: number }> = [];
    graph.forEachNode((id, attrs) => {
      if (attrs.label?.toLowerCase().includes(term) || id.toLowerCase().includes(term)) {
        matches.push({ id, label: attrs.label, type: attrs.type, sourceFile: attrs.sourceFile, degree: graph.degree(id) });
      }
    });

    matches.sort((a, b) => b.degree - a.degree);
    console.log(`Found ${matches.length} matches for "${term}":\n`);
    for (const m of matches.slice(0, 20)) {
      console.log(`  ${m.label} (${m.type}) in ${m.sourceFile} [${m.degree} connections]`);
      graph.forEachEdge(m.id, (_e, attrs, source, target) => {
        const other = source === m.id ? target : source;
        const otherAttrs = graph.getNodeAttributes(other);
        console.log(`    -> ${attrs.relationship} ${otherAttrs.label || other}`);
      });
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

  if (cliArgs.subcommand === "context") {
    const task = (cliArgs.task || "").toLowerCase();
    if (!task) { console.error("Usage: context <task description>"); process.exit(1); }

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
      console.log(`  [${score}] ${attrs.label} (${attrs.type}) in ${attrs.sourceFile}:${attrs.location || "?"}`);
    }
    return;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
