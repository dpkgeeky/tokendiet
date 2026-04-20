# TokenDiet - Claude Code Skill for 70%+ Token Reduction

## Core Mission

Every tool in this skill exists to reduce Claude Code token consumption by 70%+.

## Skill Structure

```
tokendiet/
├── SKILL.md                     # Unified skill with argument routing
├── scripts/
│   └── knowledgegraph/
│       ├── index.ts             # CLI entry point (build/update/query/path/context/impact)
│       ├── cache.ts             # SHA256 hash caching for incremental updates
│       ├── detect.ts            # File detection & filtering + .tokendietignore
│       ├── extract.ts           # Entity/relationship extraction + test detection
│       ├── build.ts             # Graph construction (graphology)
│       ├── cluster.ts           # Community detection (Louvain)
│       ├── report.ts            # Markdown report generation
│       ├── export.ts            # Obsidian vault + HTML + JSON export
│       └── types.ts             # TypeScript interfaces & constants
├── package.json
├── tsconfig.json
├── README.md
└── CLAUDE.md
```

## How It Works

Single SKILL.md routes based on the first argument:
- `/tokendiet knowledgegraph` (or `kg`) -> TypeScript pipeline via `${CLAUDE_SKILL_DIR}/scripts/knowledgegraph/index.ts`
- `/tokendiet promptoptimizer` (or `optimize`) -> pure markdown optimization analysis

## Tool 1: PromptOptimizer (auto-triggered)

- **Goal**: Structural optimization for 70%+ reduction via smarter prompting
- **Technique**: Identifies waste patterns, delivers advice as 5-7-5 haikus, produces optimized rewrite
- **Implementation**: Pure markdown in SKILL.md, no scripts needed

## Tool 2: KnowledgeGraph (auto-triggered)

- **Goal**: 70%+ token reduction by replacing verbose codebase context with a compressed knowledge graph
- **Pipeline**: `detect -> extract -> build -> cluster -> report -> export`
- **Output directory**: `knowledgegraph/` (in project root)
- **Implementation**: TypeScript scripts using `web-tree-sitter` (AST), `graphology` (graph), `graphology-communities-louvain` (clustering)
- **Path resolution**: Uses `${CLAUDE_SKILL_DIR}` to locate scripts regardless of install location
- **Subcommands**: build, update, query, path, context, impact

## KnowledgeGraph Features

### Incremental Updates (cache.ts)
- SHA256 hash caching per file enables `update` subcommand
- Only re-extracts changed/new files, reuses cached nodes/edges for unchanged
- `build --force` bypasses cache for full rebuild
- Cache stored in `knowledgegraph/cache.json`

### Impact Analysis (index.ts)
- `impact <entity> [--depth=N]` — BFS blast-radius from an entity
- Shows all affected entities sorted by hop distance
- Use before modifying high-connectivity code

### Detail Levels (index.ts)
- `--detail=minimal` — entity label/type/file only (~100 tokens)
- `--detail=standard` — labels + 1-hop edges (default)
- `--detail=full` — all edges + locations + community info

### Test Entity Detection (extract.ts)
- Detects test files by path patterns (`*.test.ts`, `*.spec.ts`, `__tests__/*`, etc.)
- Extracts test functions (`describe`, `it`, `test`, `def test_`, `func Test`)
- Creates `TESTED_BY` edges linking tests to tested entities via import analysis

### Community Naming (cluster.ts)
- Auto-derives community names from dominant class (>30% of nodes) or common directory
- Report shows "Community 0: controllers" instead of raw numbers

### Dead Code Detection (report.ts)
- Finds nodes with no inbound references except `contains` from parent file
- Reported in "Potentially Unused Code" section

### Cross-Community Coupling (report.ts)
- Flags community pairs with >5 cross-boundary edges as "tightly coupled"
- Reported in "Cross-Community Coupling" section

### `.tokendietignore` (detect.ts)
- Gitignore-style file exclusion (place in project root)
- Supports `*`, `**`, `?`, trailing `/` for directories
- Reduces graph noise from generated/vendor/irrelevant files

## KnowledgeGraph Optimization Techniques

The following optimizations achieve 74-85% token reduction:

1. **Import Node Deduplication** (`extract.ts`): Shared `importMap` ensures one node per unique import path across all files. Inspired by graphify's `seen_ids` pattern.
2. **Method Blacklist** (`extract.ts`): `METHOD_BLACKLIST` filters false positive methods (`if`, `for`, `while`, etc.) from regex extraction.
3. **Consistent Token Estimation** (`extract.ts`, `report.ts`): Both raw and graph tokens use `content.length / 4` (~4 chars/token).
4. **String Interning** (`export.ts`, `report.ts`, `index.ts`): Repeated strings (types, file paths, relationships, confidence levels) stored once in `strings[]` array, referenced by integer index in JSON output.
5. **Edge Deduplication** (`build.ts`, `extract.ts`): `multi: false` graph with edge upsert (keep highest confidence). `seenCallPairs` prevents duplicate call edges at extraction time. Inspired by graphify's `add_edge()` upsert and code-review-graph's `upsert_edge()`.
6. **Root-Only Dir Filtering** (`detect.ts`, `types.ts`): `IGNORE_ROOT_DIRS` (knowledgegraph, tokendiet-out) only checked at project root, preventing false exclusion of `scripts/knowledgegraph/`.

### JSON Format (graph.json)

String-interned compact format:
- `strings[]`: intern table for repeated values
- `nodes[]`: `[idx, label, type*, sourceFile*, location, community]` (* = interned index)
- `edges[]`: `[sourceIdx, targetIdx, relationship*, confidence*]`
- `loadGraph()` in `index.ts` supports 3 formats: interned (new), compact (legacy), and raw (legacy)

### Reference Implementations

Design patterns adapted from (TypeScript only, no Python code):
- **graphify** (github.com/safishamsi/graphify): `seen_ids` dedup, `seen_call_pairs`, edge upsert, confidence taxonomy
- **code-review-graph** (github.com/tirth8205/code-review-graph): Qualified names, edge upsert semantics, minimal detail level

## Benchmark

Run `zsh test/benchmark.sh` to validate all 3 tools. Uses two test repos in `test/`:

- `test/repo-a/`: Task Manager REST API (19 TS files)
- `test/repo-b/`: UI Component Library (20 TS/TSX files)

5 phases: Analyze, Build KnowledgeGraph, Query Accuracy, Accuracy Validation, PromptOptimizer.

Verified results (2026-04-19):

| Tool | Reduction |
|------|-----------|
| KnowledgeGraph | 80% (repo-a: 74%, repo-b: 85%) |
| PromptOptimizer | 80% |

## Installation

Symlink into `.claude/skills/tokendiet/` (project) or `~/.claude/skills/tokendiet/` (user). Run `npm install` inside the skill directory for knowledgegraph dependencies.

## Dependencies (package.json)

- `graphology` + `graphology-communities-louvain` + `graphology-shortest-path` - graph + clustering
- `tsx` - run TS scripts directly
- `typescript` (dev)

## Tech Constraints

- No Python code -- all tools are either pure markdown or TypeScript
- PromptOptimizer is embedded in SKILL.md (no external scripts)
- KnowledgeGraph uses TypeScript scripts orchestrated by SKILL.md via `${CLAUDE_SKILL_DIR}`
- Extraction is regex-based (not AST/tree-sitter) for zero native dependencies
