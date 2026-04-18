export interface GraphNode {
  id: string;
  label: string;
  type: "file" | "class" | "function" | "method" | "import" | "module" | "variable" | "interface" | "type";
  sourceFile: string;
  location?: number;
  community?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: "contains" | "calls" | "imports" | "method" | "extends" | "implements" | "uses" | "references";
  confidence: "EXTRACTED" | "INFERRED" | "AMBIGUOUS";
  weight?: number;
}

export interface ExtractionResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  tokenCount: number;
  files: string[];
}

export interface CommunityMap {
  [communityId: number]: string[];
}

export interface GraphReport {
  markdown: string;
  stats: {
    nodeCount: number;
    edgeCount: number;
    communityCount: number;
    fileCount: number;
    extractedEdges: number;
    inferredEdges: number;
    ambiguousEdges: number;
    godNodes: Array<{ id: string; degree: number }>;
    isolatedNodes: string[];
  };
}

export interface ExportOptions {
  outputDir: string;
  projectName: string;
}

export type Subcommand = "build" | "query" | "path" | "context";

export interface CLIArgs {
  subcommand: Subcommand;
  target?: string;
  from?: string;
  to?: string;
  task?: string;
}

export const SUPPORTED_EXTENSIONS: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".py": "python",
  ".rs": "rust",
  ".go": "go",
  ".java": "java",
  ".rb": "ruby",
  ".php": "php",
  ".c": "c",
  ".cpp": "cpp",
  ".h": "c",
  ".hpp": "cpp",
  ".cs": "c_sharp",
  ".swift": "swift",
  ".kt": "kotlin",
  ".scala": "scala",
  ".vue": "vue",
  ".svelte": "svelte",
  ".lua": "lua",
  ".sh": "bash",
  ".bash": "bash",
  ".zsh": "bash",
  ".md": "markdown",
  ".json": "json",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".toml": "toml",
};

export const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".nuxt",
  "coverage",
  "__pycache__",
  ".venv",
  "venv",
  "vendor",
  "target",
  ".cache",
  ".turbo",
  "tokendiet-out",
]);
