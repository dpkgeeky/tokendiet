# TokenDiet - Claude Code Skill for 70%+ Token Reduction

## Core Mission

Every tool in this skill exists to reduce Claude Code token consumption by 70%+.

## Skill Structure

```
tokendiet/
├── SKILL.md                     # Unified skill with argument routing
├── scripts/
│   └── knowledgegraph/
│       ├── index.ts             # CLI entry point (build/query/path/context)
│       ├── detect.ts            # File detection & filtering
│       ├── extract.ts           # Entity/relationship extraction (AST)
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
- `/tokendiet promptcompressor` (or `compress`) -> pure markdown compression rules
- `/tokendiet promptoptimizer` (or `optimize`) -> pure markdown optimization analysis

## Tool 1: PromptCompressor (on-demand only)

- **Goal**: Immediate 60-70% token reduction on any prompt text
- **Technique**: Caveman speak compression rules (strip filler, abbreviate, remove politeness)
- **Implementation**: Pure markdown in SKILL.md, no scripts needed
- **Invocation**: Only via explicit `/tokendiet compress` — not auto-triggered

## Tool 2: PromptOptimizer (auto-triggered)

- **Goal**: Structural optimization for 70%+ reduction via smarter prompting
- **Technique**: Identifies waste patterns, delivers advice as 5-7-5 haikus, produces optimized rewrite
- **Implementation**: Pure markdown in SKILL.md, no scripts needed

## Tool 3: KnowledgeGraph (auto-triggered)

- **Goal**: 70%+ token reduction by replacing verbose codebase context with a compressed knowledge graph
- **Pipeline**: `detect -> extract -> build -> cluster -> report -> export`
- **Output directory**: `knowledgegraph/` (in project root)
- **Implementation**: TypeScript scripts using `web-tree-sitter` (AST), `graphology` (graph), `graphology-communities-louvain` (clustering)
- **Path resolution**: Uses `${CLAUDE_SKILL_DIR}` to locate scripts regardless of install location
- **Subcommands**: build, query, path, context

## Installation

Symlink into `.claude/skills/tokendiet/` (project) or `~/.claude/skills/tokendiet/` (user). Run `npm install` inside the skill directory for knowledgegraph dependencies.

## Dependencies (package.json)

- `graphology` + `graphology-communities-louvain` + `graphology-shortest-path` - graph + clustering
- `web-tree-sitter` - AST parsing
- `tsx` - run TS scripts directly
- `typescript` (dev)

## Tech Constraints

- No Python code -- all tools are either pure markdown or TypeScript
- PromptCompressor and PromptOptimizer are embedded in SKILL.md (no external scripts)
- KnowledgeGraph uses TypeScript scripts orchestrated by SKILL.md via `${CLAUDE_SKILL_DIR}`
