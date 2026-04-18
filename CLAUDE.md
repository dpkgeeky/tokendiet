# TokenDiet - Claude Code Plugin for 70%+ Token Reduction

## Core Mission

Every skill in this plugin exists to reduce Claude Code token consumption by 70%+.

## Plugin Structure

```
tokendiet/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── skills/
│   ├── promptcompressor/
│   │   └── SKILL.md             # Caveman compressor (pure MD)
│   ├── promptoptimizer/
│   │   └── SKILL.md             # Haiku optimizer (pure MD)
│   └── knowledgegraph/
│       ├── SKILL.md             # KG-based context pruning orchestrator
│       └── scripts/
│           ├── detect.ts        # File detection & filtering
│           ├── extract.ts       # Entity/relationship extraction (AST)
│           ├── build.ts         # Graph construction (graphology)
│           ├── cluster.ts       # Community detection (Louvain)
│           ├── report.ts        # Markdown report generation
│           └── export.ts        # Obsidian vault + HTML + JSON export
├── package.json                 # TypeScript deps
└── tsconfig.json
```

## Skill 1: PromptCompressor (`/tokendiet:promptcompressor`)

- **Goal**: Immediate 60-70% token reduction on any prompt text
- **Technique**: Caveman speak compression rules:
  - Strip articles (a, an, the), pronouns, filler words
  - Abbreviate common words (function->fn, return->ret, etc.)
  - Remove politeness ("please", "could you", "I would like")
  - Collapse whitespace, remove redundant punctuation
  - Preserve technical terms, variable names, code verbatim
- **Output**: Compressed text + token count before/after + % reduction
- **Implementation**: Pure SKILL.md, no scripts needed

## Skill 2: PromptOptimizer (`/tokendiet:promptoptimizer`)

- **Goal**: Structural optimization for 70%+ reduction via smarter prompting
- **Technique**: Analyzes prompt and provides:
  1. Token waste analysis - identifies redundancy, over-specification, repeated context
  2. Haiku suggestions - each optimization tip as a 5-7-5 haiku (concise by design)
  3. Optimized rewrite - restructured prompt that achieves same intent with fewer tokens
  4. Token budget - before/after count + % saved
- **Implementation**: Pure SKILL.md, no scripts needed

## Skill 3: KnowledgeGraph (`/tokendiet:knowledgegraph`)

- **Goal**: 70%+ token reduction by replacing verbose codebase context with a compressed knowledge graph that Claude can reference instead of reading full files
- **How it saves tokens**:
  - Instead of Claude reading 50 files (massive token cost), it reads 1 graph summary
  - Clusters identify which code is related - only relevant clusters get loaded
  - Query/path subcommands fetch surgical context instead of broad file reads
  - Obsidian vault = human-navigable cache; JSON = Claude-consumable compressed context
- **Adapted from**: https://github.com/safishamsi/graphify (rewritten from Python to TypeScript)
- **Pipeline**: `detect -> extract -> build -> cluster -> report -> export`

### TypeScript Modules

| Module | Purpose | Replaces (Python) |
|---|---|---|
| `detect.ts` | Scan workspace, filter files by extension | `detect.py` |
| `extract.ts` | AST parsing via `web-tree-sitter`; extract classes, functions, imports, call graphs as nodes/edges with confidence (EXTRACTED/INFERRED/AMBIGUOUS) | `extract.py` |
| `build.ts` | Construct graph using `graphology` | `build.py` (NetworkX) |
| `cluster.ts` | Community detection via `graphology-communities-louvain` | `cluster.py` (Leiden/graspologic) |
| `report.ts` | Compressed markdown report: topology summary, god nodes, communities, gaps | `report.py` |
| `export.ts` | Obsidian vault + HTML (vis.js) + JSON | `export.py` |

### Export Formats

1. **Obsidian Vault** (primary output for humans):
   - One markdown file per node with YAML frontmatter (`source_file`, `type`, `community`, `location`)
   - Wikilinks (`[[NodeName]]`) between connected nodes for Obsidian native graph view
   - Community overview notes (`_COMMUNITY_N.md`) with cohesion metrics, member lists, bridge nodes
   - Tags: `#tokendiet/code`, `#tokendiet/EXTRACTED`, `#tokendiet/community-N`
   - `.obsidian/graph.json` auto-generated to color nodes by community
   - Dataview queries embedded in community notes
   - Output: `tokendiet-out/obsidian-vault/`
2. **Compressed JSON** (Claude-consumable graph context - node-link format with community mappings)
3. **HTML** (interactive vis.js visualization)

### Subcommands

- `/tokendiet:knowledgegraph` - Build full graph, output token savings estimate
- `/tokendiet:knowledgegraph query <term>` - Fetch only relevant subgraph (surgical context)
- `/tokendiet:knowledgegraph path <A> <B>` - Minimal path between entities (smallest context needed)
- `/tokendiet:knowledgegraph context <task>` - Given a task description, return only the relevant cluster(s) as compressed context

## Dependencies (package.json)

- `graphology` + `graphology-communities-louvain` + `graphology-shortest-path` - graph + clustering
- `web-tree-sitter` - AST parsing (replaces Python tree-sitter)
- `tsx` - run TS scripts directly
- `typescript` (dev)

## Implementation Steps

1. Plugin manifest (`.claude-plugin/plugin.json`) + `package.json` + `tsconfig.json`
2. PromptCompressor SKILL.md
3. PromptOptimizer SKILL.md
4. KnowledgeGraph TS modules: detect -> extract -> build -> cluster -> report -> export (Obsidian vault primary)
5. KnowledgeGraph SKILL.md orchestrator
6. Test all skills, verify 70%+ token reduction

## Tech Constraints

- NO Python code anywhere - all skills are either pure MD or TypeScript
- Skills 1 & 2 are pure SKILL.md files (no scripts)
- Skill 3 uses TypeScript scripts orchestrated by SKILL.md
