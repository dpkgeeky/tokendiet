import { createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type { GraphNode, GraphEdge } from "./types.js";

interface FileCacheEntry {
  hash: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface FileCache {
  version: number;
  files: Record<string, FileCacheEntry>;
}

const CACHE_VERSION = 1;

export function loadCache(outputDir: string): FileCache | null {
  const cachePath = join(outputDir, "cache.json");
  if (!existsSync(cachePath)) return null;

  try {
    const data = JSON.parse(readFileSync(cachePath, "utf-8"));
    if (data.version !== CACHE_VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveCache(outputDir: string, cache: FileCache): void {
  const cachePath = join(outputDir, "cache.json");
  writeFileSync(cachePath, JSON.stringify(cache));
}

export function hashFile(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

export interface IncrementalResult {
  changedFiles: string[];
  unchangedFiles: string[];
  deletedFiles: string[];
  cachedNodes: GraphNode[];
  cachedEdges: GraphEdge[];
}

export function diffFiles(
  detectedFiles: string[],
  fileContents: Map<string, string>,
  cache: FileCache | null
): IncrementalResult {
  if (!cache) {
    return {
      changedFiles: detectedFiles,
      unchangedFiles: [],
      deletedFiles: [],
      cachedNodes: [],
      cachedEdges: [],
    };
  }

  const changedFiles: string[] = [];
  const unchangedFiles: string[] = [];
  const cachedNodes: GraphNode[] = [];
  const cachedEdges: GraphEdge[] = [];
  const detectedSet = new Set(detectedFiles);

  for (const file of detectedFiles) {
    const content = fileContents.get(file);
    if (!content) {
      changedFiles.push(file);
      continue;
    }

    const hash = hashFile(content);
    const cached = cache.files[file];

    if (cached && cached.hash === hash) {
      unchangedFiles.push(file);
      cachedNodes.push(...cached.nodes);
      cachedEdges.push(...cached.edges);
    } else {
      changedFiles.push(file);
    }
  }

  const deletedFiles = Object.keys(cache.files).filter((f) => !detectedSet.has(f));

  return { changedFiles, unchangedFiles, deletedFiles, cachedNodes, cachedEdges };
}

export function buildCache(
  files: string[],
  fileContents: Map<string, string>,
  allNodes: GraphNode[],
  allEdges: GraphEdge[]
): FileCache {
  const cache: FileCache = { version: CACHE_VERSION, files: {} };

  const nodesByFile = new Map<string, GraphNode[]>();
  const edgesByFile = new Map<string, GraphEdge[]>();

  for (const node of allNodes) {
    const file = node.sourceFile;
    if (!nodesByFile.has(file)) nodesByFile.set(file, []);
    nodesByFile.get(file)!.push(node);
  }

  for (const edge of allEdges) {
    const sourceNode = allNodes.find((n) => n.id === edge.source);
    if (sourceNode) {
      const file = sourceNode.sourceFile;
      if (!edgesByFile.has(file)) edgesByFile.set(file, []);
      edgesByFile.get(file)!.push(edge);
    }
  }

  for (const file of files) {
    const content = fileContents.get(file);
    if (!content) continue;
    cache.files[file] = {
      hash: hashFile(content),
      nodes: nodesByFile.get(file) || [],
      edges: edgesByFile.get(file) || [],
    };
  }

  return cache;
}

export { FileCache, CACHE_VERSION };
