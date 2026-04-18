---
name: knowledgegraph
description: "Build a knowledge graph of the codebase to achieve 70%+ token reduction. Instead of reading entire files, Claude references a compressed graph with entities, relationships, and communities. Outputs Obsidian vault (native graph view), HTML visualization, and JSON. Use when user wants to map, explore, or reduce context loading for a codebase."
allowed-tools:
  - Bash
  - Read
  - Glob
---

You are a knowledge graph builder for token optimization. Your goal is to replace expensive full-file reads with a compressed graph representation, achieving 70%+ token reduction.

## Subcommands

Route based on $ARGUMENTS:

- **No args or "build"**: Run the full pipeline
- **"query \<term\>"**: Search the existing graph
- **"path \<A\> \<B\>"**: Find shortest path between two entities
- **"context \<task\>"**: Get minimal relevant context for a task

## Full Pipeline (build)

Run this command from the project root:

```bash
cd $PROJECT_DIR && npx tsx skills/knowledgegraph/scripts/index.ts build
```

After the build completes, read the generated report:

```bash
cat tokendiet-out/report.md
```

Then tell the user:
1. The token savings achieved (from the report)
2. How many nodes, edges, and communities were found
3. Where the outputs are:
   - `tokendiet-out/obsidian-vault/` — Open in Obsidian for interactive graph view with community-colored nodes
   - `tokendiet-out/graph.html` — Open in browser for vis.js visualization
   - `tokendiet-out/graph.json` — Claude-consumable compressed context
   - `tokendiet-out/report.md` — Full analysis report

## Query Subcommand

```bash
cd $PROJECT_DIR && npx tsx skills/knowledgegraph/scripts/index.ts query $1
```

Show the matching nodes and their connections. This replaces needing to grep/read files — surgical context retrieval.

## Path Subcommand

```bash
cd $PROJECT_DIR && npx tsx skills/knowledgegraph/scripts/index.ts path $1 $2
```

Show the shortest path between two entities. Useful for understanding how two pieces of code are connected without reading intermediate files.

## Context Subcommand

```bash
cd $PROJECT_DIR && npx tsx skills/knowledgegraph/scripts/index.ts context $ARGUMENTS
```

Given a task description, returns only the relevant clusters and nodes. Use this BEFORE starting any coding task to load minimal context instead of reading the full codebase.

## Token Optimization Workflow

When the user starts a new coding task:
1. Run `/tokendiet:knowledgegraph context <task description>`
2. Only read the files identified as relevant
3. This replaces reading all files, saving 70%+ tokens

## Obsidian Vault Output

The vault is structured for Obsidian's native graph view:
- Each code entity is a markdown note with YAML frontmatter
- Wikilinks (`[[NodeName]]`) connect related entities
- Community notes (`_COMMUNITY_N.md`) group related code
- `.obsidian/graph.json` colors nodes by community
- Tags enable filtering: `#tokendiet/code`, `#tokendiet/community-N`
- Dataview queries in community notes for dynamic filtering

Open `tokendiet-out/obsidian-vault/` as an Obsidian vault to explore.
