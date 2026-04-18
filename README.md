# TokenDiet

Claude Code plugin for **70%+ token consumption reduction**. Three skills that compress prompts, optimize prompt structure, and build knowledge graphs to replace expensive full-file context loading.

> Tested on its own codebase: **88% token reduction** (11,743 raw tokens → 1,363 graph tokens).

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Option 1: Local Development (--plugin-dir)](#option-1-local-development---plugin-dir)
  - [Option 2: Install to User Scope](#option-2-install-to-user-scope)
  - [Option 3: Install to Project Scope](#option-3-install-to-project-scope)
- [Setup](#setup)
- [Skills](#skills)
  - [PromptCompressor](#1-promptcompressor)
  - [PromptOptimizer](#2-promptoptimizer)
  - [KnowledgeGraph](#3-knowledgegraph)
- [Obsidian Integration](#obsidian-integration)
- [Token Optimization Workflow](#token-optimization-workflow)
- [Outputs](#outputs)
- [Supported Languages](#supported-languages)
- [Uninstall](#uninstall)
- [License](#license)

---

## Prerequisites

- [Claude Code](https://claude.ai/code) CLI installed and authenticated
- Node.js 18+
- npm

---

## Installation

### Option 1: Local Development (`--plugin-dir`)

Clone the repo anywhere on your machine and point Claude Code at it:

```bash
# Clone TokenDiet
git clone https://github.com/dpkgeeky/tokendiet.git ~/tokendiet

# Install dependencies
cd ~/tokendiet && npm install

# Launch Claude Code in ANY project with TokenDiet loaded
cd /path/to/your/project
claude --plugin-dir ~/tokendiet
```

This loads TokenDiet for that session only. Use this for testing or one-off usage.

### Option 2: Install to User Scope

Installs TokenDiet globally for your user — available in every Claude Code session:

```bash
# Clone
git clone https://github.com/dpkgeeky/tokendiet.git ~/tokendiet
cd ~/tokendiet && npm install

# Install as user-scoped plugin
claude plugin install ~/tokendiet --scope user
```

### Option 3: Install to Project Scope

Installs TokenDiet for a specific project — shared with your team via version control:

```bash
# From your project directory
cd /path/to/your/project
claude plugin install ~/tokendiet --scope project
```

This adds the plugin reference to your project's `.claude/` config so all team members get it.

---

## Setup

After installation, verify the plugin is loaded:

```bash
# Inside a Claude Code session, run:
/plugin
```

You should see `tokendiet` listed with three skills:
- `tokendiet:promptcompressor`
- `tokendiet:promptoptimizer`
- `tokendiet:knowledgegraph`

If you made changes to the plugin and need to reload without restarting:

```
/reload-plugins
```

---

## Skills

### 1. PromptCompressor

Caveman-speak compression that strips filler, abbreviates common words, and removes politeness — achieving **60-70% token reduction** on any text.

**Invoke:**

```
/tokendiet:promptcompressor Please write a function that calculates the total price of items in a shopping cart, including the tax rate that should be passed as a parameter
```

**Output:**

```
## Compressed

write fn calc total price items in cart, incl tax rate passed as param

## Stats
- Before: ~30 tokens
- After: ~14 tokens
- Saved: ~53% reduction
```

**What it does:**
- Strips articles (a, an, the), pronouns, filler words
- Removes politeness ("please", "could you", "I would like")
- Abbreviates common terms (function→fn, return→ret, database→db, etc.)
- Collapses structure ("and"→+, "or"→/, "leads to"→->)
- Preserves code, file paths, technical terms, and numbers verbatim

**When to use:** Before pasting long prompts or context into Claude Code. Compress first, then send.

---

### 2. PromptOptimizer

Analyzes prompt structure and delivers optimization advice as **5-7-5 haikus** — each suggestion is poetic and concise. Produces a full optimized rewrite targeting **70%+ reduction**.

**Invoke:**

```
/tokendiet:promptoptimizer You are a helpful coding assistant. I would like you to please help me write a Python function. The function should take a list of numbers as input. It should then calculate the average of those numbers. Please make sure to handle the case where the list is empty. If the list is empty, the function should return 0.
```

**Output:**

```
## Token Waste Analysis

1. Redundancy: "I would like you to please help me write" + "Please make sure"
2. Over-specification: full description can be said in 4 words
3. Verbose framing: "You are a helpful coding assistant"
4. Unnecessary detail: type hints/docstrings are default behavior

## Haiku Suggestions

### 1. Redundant Asks
> strip the double please
> one clear ask beats two polite
> tokens fall like leaves

### 2. Over-specification
> average of list —
> four words hold the full intent
> let the rest dissolve

## Optimized Rewrite

Python fn: avg of number list, ret 0 if empty

## Stats
- Before: ~85 tokens
- After: ~12 tokens
- Saved: ~86% reduction
```

**What it detects:**
- Redundancy (same instruction repeated differently)
- Over-specification (details Claude can infer)
- Verbose framing (unnecessary introductions)
- Repeated context (info already in files/conversation)
- Meta-instructions ("you are an AI...")
- Default behavior instructions (things Claude does anyway)

**When to use:** When you want to understand *why* your prompts are expensive and get structural advice, not just compression.

---

### 3. KnowledgeGraph

Builds a compressed knowledge graph of your codebase — entities, relationships, and communities — so Claude can reference the graph instead of reading every file. This is the **highest-impact skill** for large codebases.

#### Build the Graph

```
/tokendiet:knowledgegraph
```

or explicitly:

```
/tokendiet:knowledgegraph build
```

This runs the full pipeline: **detect → extract → build → cluster → report → export**

Output:

```
Detecting files in /path/to/project...
Found 15 files
Extracted 87 nodes, 451 edges
Found 9 communities

Token Savings:
  Raw codebase tokens:        ~11,743
  Compressed graph tokens:    ~1,363
  Reduction:                  88%
```

#### Query the Graph

Search for entities without reading files:

```
/tokendiet:knowledgegraph query auth
```

Returns matching nodes with their connections — surgical context retrieval.

#### Find Paths

Understand how two pieces of code connect without reading intermediate files:

```
/tokendiet:knowledgegraph path UserService DatabaseClient
```

Returns the shortest path between entities with hop count.

#### Get Task Context

Before starting any coding task, get only the relevant context:

```
/tokendiet:knowledgegraph context add authentication to the API routes
```

Returns only the clusters and nodes relevant to your task description — instead of Claude reading the entire codebase.

---

## Obsidian Integration

The KnowledgeGraph skill outputs a full Obsidian vault at `tokendiet-out/obsidian-vault/`. Open it in [Obsidian](https://obsidian.md/) to use the **native graph view**.

**What's in the vault:**

| Component | Description |
|-----------|-------------|
| `<EntityName>.md` | One note per code entity (class, function, file) with YAML frontmatter |
| `_COMMUNITY_N.md` | Community overview notes with member lists, bridge nodes, Dataview queries |
| `[[wikilinks]]` | Connections between entities — powers Obsidian's graph view |
| `.obsidian/graph.json` | Auto-generated config that colors nodes by community |
| Tags | `#tokendiet/code`, `#tokendiet/community-N` for filtering |

**To use:**

1. Run `/tokendiet:knowledgegraph`
2. Open Obsidian → "Open folder as vault" → select `tokendiet-out/obsidian-vault/`
3. Click the graph view icon (or `Ctrl/Cmd + G`)
4. Nodes are colored by community — zoom, filter, and explore

**Dataview support:** Community notes include embedded Dataview queries. Install the [Dataview plugin](https://github.com/blacksmithgu/obsidian-dataview) in Obsidian for dynamic filtering tables.

---

## Token Optimization Workflow

The recommended workflow for maximum token savings in any project:

```
Step 1: Build the graph once
  /tokendiet:knowledgegraph

Step 2: Before each coding task, load minimal context
  /tokendiet:knowledgegraph context <describe your task>

Step 3: Compress any long prompts before sending
  /tokendiet:promptcompressor <your long prompt>

Step 4: For prompt engineering, get structural advice
  /tokendiet:promptoptimizer <your prompt>
```

**Why this works:**
- **KnowledgeGraph** replaces reading N files with 1 compressed graph (~70-90% savings)
- **Context subcommand** loads only relevant clusters instead of full codebase
- **PromptCompressor** reduces the remaining prompt text by 60-70%
- **PromptOptimizer** helps you write better prompts that need fewer tokens from the start

---

## Outputs

After running `/tokendiet:knowledgegraph`, find everything in `tokendiet-out/`:

```
tokendiet-out/
├── obsidian-vault/          # Open in Obsidian for native graph view
│   ├── .obsidian/
│   │   ├── graph.json       # Community-colored graph config
│   │   └── app.json         # Obsidian app settings
│   ├── _COMMUNITY_0.md      # Community overview notes
│   ├── _COMMUNITY_1.md
│   ├── EntityName.md         # One note per code entity
│   └── ...
├── graph.json               # Claude-consumable compressed context
├── graph.html               # Interactive vis.js visualization (open in browser)
└── report.md                # Analysis report with token savings
```

Add `tokendiet-out/` to your `.gitignore` — it's generated output:

```bash
echo "tokendiet-out/" >> .gitignore
```

---

## Supported Languages

The KnowledgeGraph extractor supports AST-level extraction for:

| Language | Entities Extracted |
|----------|-------------------|
| TypeScript / JavaScript | classes, functions, arrow functions, methods, interfaces, types, imports, call graph |
| Python | classes, functions, methods, imports |
| Go | structs, interfaces, functions, methods (with receivers), imports |
| Rust | structs, traits, functions, impl methods, use statements |
| Java / Kotlin / C# | classes, interfaces, methods, imports |

Additionally, these file types are detected and included as file-level nodes:

Ruby, PHP, C, C++, Swift, Scala, Vue, Svelte, Lua, Bash, Markdown, JSON, YAML, TOML

---

## Uninstall

```bash
# Remove user-scoped plugin
claude plugin uninstall tokendiet

# Or remove project-scoped plugin
claude plugin uninstall tokendiet --scope project
```

If you used `--plugin-dir`, just stop passing the flag.

---

## License

MIT
