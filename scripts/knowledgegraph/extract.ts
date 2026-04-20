import { readFileSync } from "fs";
import { basename, extname, dirname, join } from "path";
import {
  GraphNode,
  GraphEdge,
  ExtractionResult,
  SUPPORTED_EXTENSIONS,
} from "./types.js";

const METHOD_BLACKLIST = new Set([
  "if", "for", "while", "switch", "catch", "return", "throw", "new",
  "super", "else", "typeof", "delete", "case", "try", "do",
]);

export function extract(files: string[], rootDir: string): ExtractionResult {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  let totalTokens = 0;
  const importMap = new Map<string, string>();
  const seenCallPairs = new Set<string>();

  for (const file of files) {
    const fullPath = join(rootDir, file);
    let content: string;
    try {
      content = readFileSync(fullPath, "utf-8");
    } catch {
      continue;
    }

    totalTokens += estimateTokens(content);
    const ext = extname(file).toLowerCase();
    const lang = SUPPORTED_EXTENSIONS[ext];

    const fileId = sanitizeId(file);
    nodes.push({
      id: fileId,
      label: file,
      type: "file",
      sourceFile: file,
    });

    if (lang === "typescript" || lang === "javascript") {
      extractTS(content, file, fileId, nodes, edges, importMap, seenCallPairs);
    } else if (lang === "python") {
      extractPython(content, file, fileId, nodes, edges, importMap);
    } else if (lang === "go") {
      extractGo(content, file, fileId, nodes, edges, importMap);
    } else if (lang === "rust") {
      extractRust(content, file, fileId, nodes, edges, importMap);
    } else if (lang === "java" || lang === "kotlin" || lang === "c_sharp") {
      extractJavaLike(content, file, fileId, nodes, edges, importMap);
    } else {
      extractGeneric(content, file, fileId, nodes, edges);
    }

    if (isTestFile(file)) {
      extractTestEntities(content, file, fileId, nodes, edges);
    }
  }

  inferCrossFileEdges(nodes, edges);
  inferTestEdges(nodes, edges);

  return { nodes, edges, tokenCount: totalTokens, files };
}

const TEST_FILE_PATTERNS = [
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /__tests__\//,
  /test_.*\.py$/,
  /.*_test\.go$/,
  /tests?\//,
];

function isTestFile(file: string): boolean {
  return TEST_FILE_PATTERNS.some((p) => p.test(file));
}

function extractTestEntities(
  content: string,
  file: string,
  fileId: string,
  nodes: GraphNode[],
  edges: GraphEdge[]
): void {
  const lines = content.split("\n");
  const describeRe = /^\s*(?:describe|suite)\s*\(\s*['"](.*?)['"]/;
  const itRe = /^\s*(?:it|test|specify)\s*\(\s*['"](.*?)['"]/;
  const pyTestRe = /^(?:def|async def)\s+(test_\w+)/;
  const goTestRe = /^func\s+(Test\w+)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m: RegExpMatchArray | null;

    if ((m = line.match(describeRe))) {
      const testId = sanitizeId(`${file}:test:${m[1]}`);
      nodes.push({ id: testId, label: m[1], type: "test", sourceFile: file, location: i + 1 });
      edges.push({ source: fileId, target: testId, relationship: "contains", confidence: "EXTRACTED" });
    }

    if ((m = line.match(itRe))) {
      const testId = sanitizeId(`${file}:test:${m[1]}`);
      nodes.push({ id: testId, label: m[1], type: "test", sourceFile: file, location: i + 1 });
      edges.push({ source: fileId, target: testId, relationship: "contains", confidence: "EXTRACTED" });
    }

    if ((m = line.match(pyTestRe))) {
      const testId = sanitizeId(`${file}:test:${m[1]}`);
      nodes.push({ id: testId, label: m[1], type: "test", sourceFile: file, location: i + 1 });
      edges.push({ source: fileId, target: testId, relationship: "contains", confidence: "EXTRACTED" });
    }

    if ((m = line.match(goTestRe))) {
      const testId = sanitizeId(`${file}:test:${m[1]}`);
      nodes.push({ id: testId, label: m[1], type: "test", sourceFile: file, location: i + 1 });
      edges.push({ source: fileId, target: testId, relationship: "contains", confidence: "EXTRACTED" });
    }
  }
}

function inferTestEdges(nodes: GraphNode[], edges: GraphEdge[]): void {
  const testFiles = nodes.filter((n) => n.type === "file" && isTestFile(n.sourceFile));
  const nonTestByLabel = new Map<string, string>();

  for (const n of nodes) {
    if (n.type !== "file" && n.type !== "test" && n.type !== "import" && !isTestFile(n.sourceFile)) {
      nonTestByLabel.set(n.label.toLowerCase(), n.id);
    }
  }

  for (const testFile of testFiles) {
    const importEdges = edges.filter((e) => e.source === testFile.id && e.relationship === "imports");
    for (const imp of importEdges) {
      const importNode = nodes.find((n) => n.id === imp.target);
      if (!importNode) continue;
      const importLabel = importNode.label;
      const parts = importLabel.split("/");
      const lastPart = parts[parts.length - 1].replace(/\.[jt]sx?$/, "");

      for (const [label, id] of nonTestByLabel) {
        if (label === lastPart.toLowerCase() || label.includes(lastPart.toLowerCase())) {
          edges.push({ source: testFile.id, target: id, relationship: "tests", confidence: "INFERRED" });
          break;
        }
      }
    }
  }
}

function sanitizeId(s: string): string {
  return s.replace(/[^a-zA-Z0-9_./\\-]/g, "_");
}

function estimateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

function addImport(
  importPath: string,
  file: string,
  fileId: string,
  lineNum: number,
  nodes: GraphNode[],
  edges: GraphEdge[],
  importMap: Map<string, string>
): void {
  let importId = importMap.get(importPath);
  if (!importId) {
    importId = sanitizeId(`import:${importPath}`);
    importMap.set(importPath, importId);
    nodes.push({ id: importId, label: importPath, type: "import", sourceFile: file, location: lineNum });
  }
  edges.push({ source: fileId, target: importId, relationship: "imports", confidence: "EXTRACTED" });
}

function extractTS(
  content: string,
  file: string,
  fileId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  importMap: Map<string, string>,
  seenCallPairs: Set<string>
): void {
  const lines = content.split("\n");

  const importRe = /^import\s+(?:(?:\{[^}]*\}|[\w*]+)\s+from\s+)?['"](.*?)['"]/;
  const classRe = /^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?/;
  const fnRe = /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/;
  const arrowRe = /^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(?/;
  const methodRe = /^\s+(?:async\s+)?(?:static\s+)?(?:get\s+|set\s+)?(\w+)\s*\(/;
  const interfaceRe = /^(?:export\s+)?(?:interface|type)\s+(\w+)/;

  let currentClass: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m: RegExpMatchArray | null;

    if ((m = line.match(importRe))) {
      addImport(m[1], file, fileId, i + 1, nodes, edges, importMap);
    }

    if ((m = line.match(classRe))) {
      const className = m[1];
      const extendsName = m[2];
      const classId = sanitizeId(`${file}:class:${className}`);
      currentClass = classId;
      nodes.push({ id: classId, label: className, type: "class", sourceFile: file, location: i + 1 });
      edges.push({ source: fileId, target: classId, relationship: "contains", confidence: "EXTRACTED" });
      if (extendsName) {
        edges.push({ source: classId, target: `*:class:${extendsName}`, relationship: "extends", confidence: "INFERRED" });
      }
      if (m[3]) {
        for (const impl of m[3].split(",").map((s) => s.trim())) {
          edges.push({ source: classId, target: `*:interface:${impl}`, relationship: "implements", confidence: "INFERRED" });
        }
      }
      continue;
    }

    if ((m = line.match(interfaceRe))) {
      const name = m[1];
      const id = sanitizeId(`${file}:interface:${name}`);
      nodes.push({ id, label: name, type: "interface", sourceFile: file, location: i + 1 });
      edges.push({ source: fileId, target: id, relationship: "contains", confidence: "EXTRACTED" });
      continue;
    }

    if ((m = line.match(fnRe))) {
      const fnName = m[1];
      const fnId = sanitizeId(`${file}:fn:${fnName}`);
      nodes.push({ id: fnId, label: fnName, type: "function", sourceFile: file, location: i + 1 });
      edges.push({ source: fileId, target: fnId, relationship: "contains", confidence: "EXTRACTED" });
      extractCalls(lines, i, file, fnId, edges, seenCallPairs);
      continue;
    }

    if ((m = line.match(arrowRe)) && !line.includes("useState") && !line.includes("useRef")) {
      const fnName = m[1];
      if (/[A-Z]/.test(fnName[0]) || fnName.length > 2) {
        const fnId = sanitizeId(`${file}:fn:${fnName}`);
        nodes.push({ id: fnId, label: fnName, type: "function", sourceFile: file, location: i + 1 });
        edges.push({ source: fileId, target: fnId, relationship: "contains", confidence: "EXTRACTED" });
        extractCalls(lines, i, file, fnId, edges, seenCallPairs);
      }
      continue;
    }

    if (currentClass && (m = line.match(methodRe))) {
      const methodName = m[1];
      if (methodName !== "constructor" && !methodName.startsWith("_") && !METHOD_BLACKLIST.has(methodName)) {
        const methodId = sanitizeId(`${file}:method:${methodName}`);
        nodes.push({ id: methodId, label: methodName, type: "method", sourceFile: file, location: i + 1 });
        edges.push({ source: currentClass, target: methodId, relationship: "method", confidence: "EXTRACTED" });
      }
    }

    if (line.match(/^}/) || (line.match(/^\S/) && currentClass)) {
      if (line.match(/^}/)) currentClass = null;
    }
  }
}

function extractPython(
  content: string,
  file: string,
  fileId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  importMap: Map<string, string>
): void {
  const lines = content.split("\n");

  const importRe1 = /^(?:from\s+([\w.]+)\s+)?import\s+([\w.*,\s]+)/;
  const classRe = /^class\s+(\w+)(?:\(([\w.,\s]*)\))?:/;
  const fnRe = /^(?:    )?def\s+(\w+)\s*\(/;

  let currentClass: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m: RegExpMatchArray | null;

    if ((m = line.match(importRe1))) {
      const module = m[1] || m[2].split(",")[0].trim();
      addImport(module, file, fileId, i + 1, nodes, edges, importMap);
    }

    if ((m = line.match(classRe))) {
      const className = m[1];
      const classId = sanitizeId(`${file}:class:${className}`);
      currentClass = classId;
      nodes.push({ id: classId, label: className, type: "class", sourceFile: file, location: i + 1 });
      edges.push({ source: fileId, target: classId, relationship: "contains", confidence: "EXTRACTED" });
      if (m[2]) {
        for (const base of m[2].split(",").map((s) => s.trim()).filter(Boolean)) {
          edges.push({ source: classId, target: `*:class:${base}`, relationship: "extends", confidence: "INFERRED" });
        }
      }
      continue;
    }

    if ((m = line.match(fnRe))) {
      const fnName = m[1];
      if (fnName.startsWith("__") && fnName !== "__init__") continue;
      const isMethod = line.startsWith("    ") && currentClass;
      const fnId = sanitizeId(`${file}:${isMethod ? "method" : "fn"}:${fnName}`);
      nodes.push({
        id: fnId,
        label: fnName,
        type: isMethod ? "method" : "function",
        sourceFile: file,
        location: i + 1,
      });
      if (isMethod && currentClass) {
        edges.push({ source: currentClass, target: fnId, relationship: "method", confidence: "EXTRACTED" });
      } else {
        edges.push({ source: fileId, target: fnId, relationship: "contains", confidence: "EXTRACTED" });
      }
    }

    if (line.match(/^\S/) && !line.match(/^class\s/) && !line.startsWith("#") && !line.startsWith("@") && line.trim().length > 0) {
      if (!line.match(/^(?:def|import|from|class)\s/)) {
        currentClass = null;
      }
    }
  }
}

function extractGo(
  content: string,
  file: string,
  fileId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  importMap: Map<string, string>
): void {
  const lines = content.split("\n");
  const fnRe = /^func\s+(?:\((\w+)\s+\*?(\w+)\)\s+)?(\w+)\s*\(/;
  const structRe = /^type\s+(\w+)\s+struct\s*\{/;
  const interfaceRe = /^type\s+(\w+)\s+interface\s*\{/;
  const importRe = /^\s+"([\w./]+)"/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m: RegExpMatchArray | null;

    if ((m = line.match(importRe))) {
      addImport(m[1], file, fileId, i + 1, nodes, edges, importMap);
    }

    if ((m = line.match(structRe))) {
      const id = sanitizeId(`${file}:class:${m[1]}`);
      nodes.push({ id, label: m[1], type: "class", sourceFile: file, location: i + 1 });
      edges.push({ source: fileId, target: id, relationship: "contains", confidence: "EXTRACTED" });
    }

    if ((m = line.match(interfaceRe))) {
      const id = sanitizeId(`${file}:interface:${m[1]}`);
      nodes.push({ id, label: m[1], type: "interface", sourceFile: file, location: i + 1 });
      edges.push({ source: fileId, target: id, relationship: "contains", confidence: "EXTRACTED" });
    }

    if ((m = line.match(fnRe))) {
      const receiverType = m[2];
      const fnName = m[3];
      if (receiverType) {
        const methodId = sanitizeId(`${file}:method:${receiverType}.${fnName}`);
        nodes.push({ id: methodId, label: `${receiverType}.${fnName}`, type: "method", sourceFile: file, location: i + 1 });
        edges.push({ source: sanitizeId(`${file}:class:${receiverType}`), target: methodId, relationship: "method", confidence: "EXTRACTED" });
      } else {
        const fnId = sanitizeId(`${file}:fn:${fnName}`);
        nodes.push({ id: fnId, label: fnName, type: "function", sourceFile: file, location: i + 1 });
        edges.push({ source: fileId, target: fnId, relationship: "contains", confidence: "EXTRACTED" });
      }
    }
  }
}

function extractRust(
  content: string,
  file: string,
  fileId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  importMap: Map<string, string>
): void {
  const lines = content.split("\n");
  const fnRe = /^(?:pub\s+)?(?:async\s+)?fn\s+(\w+)/;
  const structRe = /^(?:pub\s+)?struct\s+(\w+)/;
  const implRe = /^impl(?:<[^>]*>)?\s+(\w+)/;
  const traitRe = /^(?:pub\s+)?trait\s+(\w+)/;
  const useRe = /^use\s+([\w:]+)/;

  let currentImpl: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m: RegExpMatchArray | null;

    if ((m = line.match(useRe))) {
      addImport(m[1], file, fileId, i + 1, nodes, edges, importMap);
    }

    if ((m = line.match(structRe))) {
      const id = sanitizeId(`${file}:class:${m[1]}`);
      nodes.push({ id, label: m[1], type: "class", sourceFile: file, location: i + 1 });
      edges.push({ source: fileId, target: id, relationship: "contains", confidence: "EXTRACTED" });
    }

    if ((m = line.match(traitRe))) {
      const id = sanitizeId(`${file}:interface:${m[1]}`);
      nodes.push({ id, label: m[1], type: "interface", sourceFile: file, location: i + 1 });
      edges.push({ source: fileId, target: id, relationship: "contains", confidence: "EXTRACTED" });
    }

    if ((m = line.match(implRe))) {
      currentImpl = sanitizeId(`${file}:class:${m[1]}`);
    }

    if ((m = line.match(fnRe))) {
      if (currentImpl && line.startsWith("    ")) {
        const methodId = sanitizeId(`${file}:method:${m[1]}`);
        nodes.push({ id: methodId, label: m[1], type: "method", sourceFile: file, location: i + 1 });
        edges.push({ source: currentImpl, target: methodId, relationship: "method", confidence: "EXTRACTED" });
      } else {
        const fnId = sanitizeId(`${file}:fn:${m[1]}`);
        nodes.push({ id: fnId, label: m[1], type: "function", sourceFile: file, location: i + 1 });
        edges.push({ source: fileId, target: fnId, relationship: "contains", confidence: "EXTRACTED" });
        currentImpl = null;
      }
    }
  }
}

function extractJavaLike(
  content: string,
  file: string,
  fileId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  importMap: Map<string, string>
): void {
  const lines = content.split("\n");
  const classRe = /^(?:public\s+|private\s+|protected\s+)?(?:abstract\s+)?(?:class|interface)\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?/;
  const methodRe = /^\s+(?:public\s+|private\s+|protected\s+)?(?:static\s+)?(?:[\w<>[\],\s]+)\s+(\w+)\s*\(/;
  const importRe = /^import\s+([\w.]+);/;

  let currentClass: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m: RegExpMatchArray | null;

    if ((m = line.match(importRe))) {
      addImport(m[1], file, fileId, i + 1, nodes, edges, importMap);
    }

    if ((m = line.match(classRe))) {
      const className = m[1];
      const classId = sanitizeId(`${file}:class:${className}`);
      currentClass = classId;
      nodes.push({ id: classId, label: className, type: "class", sourceFile: file, location: i + 1 });
      edges.push({ source: fileId, target: classId, relationship: "contains", confidence: "EXTRACTED" });
      if (m[2]) {
        edges.push({ source: classId, target: `*:class:${m[2]}`, relationship: "extends", confidence: "INFERRED" });
      }
    }

    if (currentClass && (m = line.match(methodRe))) {
      const name = m[1];
      if (!METHOD_BLACKLIST.has(name)) {
        const methodId = sanitizeId(`${file}:method:${name}`);
        nodes.push({ id: methodId, label: name, type: "method", sourceFile: file, location: i + 1 });
        edges.push({ source: currentClass, target: methodId, relationship: "method", confidence: "EXTRACTED" });
      }
    }
  }
}

function extractGeneric(
  content: string,
  file: string,
  fileId: string,
  nodes: GraphNode[],
  edges: GraphEdge[]
): void {
  const lines = content.split("\n");
  const fnPatterns = [
    /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
    /^def\s+(\w+)/,
    /^func\s+(\w+)/,
    /^(?:pub\s+)?fn\s+(\w+)/,
    /^sub\s+(\w+)/,
  ];

  for (let i = 0; i < lines.length; i++) {
    for (const re of fnPatterns) {
      const m = lines[i].match(re);
      if (m) {
        const fnId = sanitizeId(`${file}:fn:${m[1]}`);
        nodes.push({ id: fnId, label: m[1], type: "function", sourceFile: file, location: i + 1 });
        edges.push({ source: fileId, target: fnId, relationship: "contains", confidence: "EXTRACTED" });
        break;
      }
    }
  }
}

function extractCalls(
  lines: string[],
  startLine: number,
  file: string,
  fnId: string,
  edges: GraphEdge[],
  seenCallPairs: Set<string>
): void {
  const callRe = /\b([a-zA-Z_]\w+)\s*\(/g;
  const builtins = new Set([
    "if", "for", "while", "switch", "catch", "return", "throw", "new",
    "typeof", "instanceof", "void", "delete", "await", "yield",
    "console", "require", "import", "export", "super", "this",
    "parseInt", "parseFloat", "isNaN", "isFinite", "setTimeout", "setInterval",
    "clearTimeout", "clearInterval", "Promise", "Array", "Object", "String",
    "Number", "Boolean", "Map", "Set", "JSON", "Math", "Date", "RegExp", "Error",
  ]);

  let braceDepth = 0;
  let started = false;

  for (let i = startLine; i < Math.min(startLine + 50, lines.length); i++) {
    const line = lines[i];
    for (const ch of line) {
      if (ch === "{") { braceDepth++; started = true; }
      if (ch === "}") braceDepth--;
    }

    if (started && braceDepth <= 0) break;

    let m: RegExpExecArray | null;
    while ((m = callRe.exec(line)) !== null) {
      const callee = m[1];
      if (!builtins.has(callee) && callee.length > 1) {
        const pairKey = `${fnId}:${callee}`;
        if (seenCallPairs.has(pairKey)) continue;
        seenCallPairs.add(pairKey);
        edges.push({
          source: fnId,
          target: `*:fn:${callee}`,
          relationship: "calls",
          confidence: "INFERRED",
        });
      }
    }
  }
}

function inferCrossFileEdges(nodes: GraphNode[], edges: GraphEdge[]): void {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const fnByLabel = new Map<string, string[]>();

  for (const n of nodes) {
    if (n.type === "function" || n.type === "method" || n.type === "class" || n.type === "interface") {
      const list = fnByLabel.get(n.label) || [];
      list.push(n.id);
      fnByLabel.set(n.label, list);
    }
  }

  const resolved: GraphEdge[] = [];
  for (const edge of edges) {
    if (edge.target.startsWith("*:")) {
      const parts = edge.target.split(":");
      const name = parts[parts.length - 1];
      const candidates = fnByLabel.get(name) || [];
      const sameFileCandidates = candidates.filter((c) => {
        const node = nodeById.get(c);
        return node && node.sourceFile === nodeById.get(edge.source)?.sourceFile;
      });

      const targets = sameFileCandidates.length > 0 ? sameFileCandidates : candidates;
      for (const target of targets.slice(0, 1)) {
        if (target !== edge.source) {
          resolved.push({ ...edge, target, confidence: candidates.length === 1 ? "INFERRED" : "AMBIGUOUS" });
        }
      }
    }
  }

  edges.push(...resolved);
}
