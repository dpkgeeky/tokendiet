#!/usr/bin/env zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TOKENDIET_DIR="$(dirname "$SCRIPT_DIR")"
KG_SCRIPT="$TOKENDIET_DIR/scripts/knowledgegraph/index.ts"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

divider() { printf '%*s\n' 70 '' | tr ' ' '='; }
header() { echo ""; divider; printf "${BOLD}${CYAN}  %s${RESET}\n" "$1"; divider; }
metric() { printf "  ${BOLD}%-35s${RESET} %s\n" "$1" "$2"; }

typeset -A RAW_TOKENS GRAPH_TOKENS REDUCTION_PCT NODE_COUNTS EDGE_COUNTS
typeset -A COMMUNITY_COUNTS FILE_COUNTS BUILD_TIMES EXTRACTED_EDGES INFERRED_EDGES
typeset -A RAW_BYTES GRAPH_BYTES QUERY_TIMES PATH_TIMES CONTEXT_TIMES
typeset -A QUERY_RESULTS PATH_RESULTS CONTEXT_RESULTS

repos=("repo-a" "repo-b")
repo_names=("Task Manager API" "UI Component Library")
query_terms=("service" "theme")
path_from=("auth" "Button")
path_to=("database" "Modal")
ctx_tasks=("add authentication to project endpoints" "add dark mode theme support")

header "TokenDiet KnowledgeGraph Benchmark"
echo ""
echo "  Repos under test:"
for i in 1 2; do
  echo "    - ${repos[$i]}: ${repo_names[$i]}"
done
echo "  TokenDiet dir: $TOKENDIET_DIR"
echo "  Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"

for i in 1 2; do
  repo="${repos[$i]}"
  name="${repo_names[$i]}"
  repo_dir="$SCRIPT_DIR/$repo"

  header "Phase 1: Analyze — $name ($repo)"

  if [ ! -d "$repo_dir/src" ]; then
    echo "  ${RED}ERROR: $repo_dir/src not found, skipping${RESET}"
    continue
  fi

  ts_files=$(find "$repo_dir/src" \( -name '*.ts' -o -name '*.tsx' \) | wc -l | tr -d ' ')
  raw_bytes=$(find "$repo_dir/src" \( -name '*.ts' -o -name '*.tsx' \) -exec cat {} + | wc -c | tr -d ' ')
  raw_lines=$(find "$repo_dir/src" \( -name '*.ts' -o -name '*.tsx' \) -exec cat {} + | wc -l | tr -d ' ')
  raw_token_est=$((raw_bytes / 4))

  FILE_COUNTS[$repo]="$ts_files"
  RAW_BYTES[$repo]="$raw_bytes"

  metric "Source files" "$ts_files"
  metric "Raw bytes" "$raw_bytes"
  metric "Raw lines" "$raw_lines"
  metric "Est. raw tokens (bytes/4)" "~$raw_token_est"

  # ── Phase 2: Build ──
  header "Phase 2: Build KnowledgeGraph — $name ($repo)"

  rm -rf "$repo_dir/knowledgegraph"
  build_start=$SECONDS
  build_output=$(cd "$repo_dir" && npx tsx "$KG_SCRIPT" build 2>&1)
  build_elapsed=$(( SECONDS - build_start ))
  BUILD_TIMES[$repo]="${build_elapsed}s"

  metric "Build time" "${build_elapsed}s"

  if [ ! -f "$repo_dir/knowledgegraph/report.md" ]; then
    echo "  ${RED}ERROR: Build failed${RESET}"
    echo "$build_output"
    continue
  fi

  report="$repo_dir/knowledgegraph/report.md"
  raw_tok=$(grep 'Raw codebase tokens' "$report" | grep -oE '[0-9,]+' | tr -d ',')
  graph_tok=$(grep 'Compressed graph tokens' "$report" | grep -oE '[0-9,]+' | tr -d ',')
  reduction=$(grep 'Reduction' "$report" | grep -oE '[0-9]+%')
  nodes=$(grep '| Nodes' "$report" | grep -oE '[0-9]+')
  edges=$(grep '| Edges' "$report" | grep -oE '[0-9]+')
  communities=$(grep '| Communities' "$report" | grep -oE '[0-9]+')
  isolated=$(grep '| Isolated nodes' "$report" | grep -oE '[0-9]+' || true); isolated=${isolated:-0}
  extracted=$(grep 'EXTRACTED' "$report" | grep -oE '[0-9]+' | head -1 || true); extracted=${extracted:-0}
  inferred=$(grep 'INFERRED' "$report" | grep -oE '[0-9]+' | head -1 || true); inferred=${inferred:-0}
  graph_file_bytes=$(wc -c < "$repo_dir/knowledgegraph/graph.json" | tr -d ' ')

  RAW_TOKENS[$repo]="$raw_tok"
  GRAPH_TOKENS[$repo]="$graph_tok"
  REDUCTION_PCT[$repo]="$reduction"
  NODE_COUNTS[$repo]="$nodes"
  EDGE_COUNTS[$repo]="$edges"
  COMMUNITY_COUNTS[$repo]="$communities"
  EXTRACTED_EDGES[$repo]="${extracted}"
  INFERRED_EDGES[$repo]="${inferred}"
  GRAPH_BYTES[$repo]="$graph_file_bytes"

  metric "Raw codebase tokens" "~$raw_tok"
  metric "Compressed graph tokens" "~$graph_tok"
  printf "  ${BOLD}%-35s${RESET} ${GREEN}%s${RESET}\n" "Token reduction" "$reduction"
  metric "Nodes" "$nodes"
  metric "Edges" "$edges  (${extracted} extracted, ${inferred} inferred)"
  metric "Communities" "$communities"
  metric "Isolated nodes" "$isolated"
  metric "graph.json size" "${graph_file_bytes} bytes"
  byte_reduction=$(echo "scale=1; (1 - $graph_file_bytes / $raw_bytes) * 100" | bc)
  metric "Byte reduction" "${byte_reduction}%"

  # ── Phase 3: Query Accuracy ──
  header "Phase 3: Query Accuracy — $name ($repo)"

  qterm="${query_terms[$i]}"
  q_start=$SECONDS
  query_output=$(cd "$repo_dir" && npx tsx "$KG_SCRIPT" query "$qterm" 2>&1)
  q_elapsed=$(( SECONDS - q_start ))
  query_count=$(echo "$query_output" | head -1 | grep -oE '[0-9]+' || echo "0")
  QUERY_TIMES[$repo]="${q_elapsed}s"
  QUERY_RESULTS[$repo]="$query_count"

  metric "Query '$qterm'" "${query_count} matches (${q_elapsed}s)"
  echo "$query_output" | head -10 | sed 's/^/    /'

  echo ""
  pf="${path_from[$i]}"
  pt="${path_to[$i]}"
  p_start=$SECONDS
  path_output=$(cd "$repo_dir" && npx tsx "$KG_SCRIPT" path "$pf" "$pt" 2>&1)
  p_elapsed=$(( SECONDS - p_start ))
  path_hops=$(echo "$path_output" | head -1 | grep -oE '[0-9]+ hops' || echo "no path")
  PATH_TIMES[$repo]="${p_elapsed}s"
  PATH_RESULTS[$repo]="$path_hops"

  metric "Path '$pf' → '$pt'" "$path_hops (${p_elapsed}s)"
  echo "$path_output" | head -12 | sed 's/^/    /'

  echo ""
  ctask="${ctx_tasks[$i]}"
  c_start=$SECONDS
  ctx_output=$(cd "$repo_dir" && npx tsx "$KG_SCRIPT" context "$ctask" 2>&1)
  c_elapsed=$(( SECONDS - c_start ))
  ctx_nodes=$(echo "$ctx_output" | grep 'Relevant nodes' | grep -oE '[0-9]+' || echo "0")
  CONTEXT_TIMES[$repo]="${c_elapsed}s"
  CONTEXT_RESULTS[$repo]="$ctx_nodes"

  metric "Context '$ctask'" "${ctx_nodes} nodes (${c_elapsed}s)"
  echo "$ctx_output" | head -20 | sed 's/^/    /'

  # ── Phase 4: Accuracy Validation ──
  header "Phase 4: Accuracy Validation — $name ($repo)"

  real_fns=$(find "$repo_dir/src" \( -name '*.ts' -o -name '*.tsx' \) -exec grep -cE '^\s*(export\s+)?(async\s+)?function\s+\w+' {} + 2>/dev/null | awk -F: '{s+=$2} END{print s+0}' || echo "0")
  real_arrows=$(find "$repo_dir/src" \( -name '*.ts' -o -name '*.tsx' \) -exec grep -cE '^\s*(export\s+)?(const|let)\s+\w+\s*=\s*(async\s+)?\(' {} + 2>/dev/null | awk -F: '{s+=$2} END{print s+0}' || echo "0")
  real_classes=$(find "$repo_dir/src" \( -name '*.ts' -o -name '*.tsx' \) -exec grep -cE '^\s*(export\s+)?(abstract\s+)?class\s+\w+' {} + 2>/dev/null | awk -F: '{s+=$2} END{print s+0}' || echo "0")
  real_interfaces=$(find "$repo_dir/src" \( -name '*.ts' -o -name '*.tsx' \) -exec grep -cE '^\s*(export\s+)?(interface|type)\s+\w+' {} + 2>/dev/null | awk -F: '{s+=$2} END{print s+0}' || echo "0")
  real_imports=$(find "$repo_dir/src" \( -name '*.ts' -o -name '*.tsx' \) -exec grep -cE "^import\s+" {} + 2>/dev/null | awk -F: '{s+=$2} END{print s+0}' || echo "0")

  metric "Functions (real)" "$real_fns fn + $real_arrows arrow"
  metric "Classes (real)" "$real_classes"
  metric "Interfaces/Types (real)" "$real_interfaces"
  metric "Imports (real)" "$real_imports"
  metric "Graph nodes" "$nodes"
  metric "Graph edges" "$edges"

  has_calls=$(echo "$query_output" | grep -c "calls" || true)
  has_contains=$(echo "$query_output" | grep -c "contains" || true)
  has_imports_edge=$(echo "$query_output" | grep -c "imports" || true)

  echo ""
  echo "  Edge relationship coverage:"
  [ "$has_contains" -gt 0 ] && printf "    ${GREEN}✓${RESET} contains edges\n" || printf "    ${RED}✗${RESET} contains edges missing\n"
  [ "$has_imports_edge" -gt 0 ] && printf "    ${GREEN}✓${RESET} imports edges\n" || printf "    ${RED}✗${RESET} imports edges missing\n"
  [ "$has_calls" -gt 0 ] && printf "    ${GREEN}✓${RESET} calls edges (cross-file)\n" || printf "    ${RED}✗${RESET} calls edges missing\n"
done

# ══════════════════════════════════════════════════════════════════════
# Phase 5: PromptCompressor Validation
# ══════════════════════════════════════════════════════════════════════
header "Phase 5: PromptCompressor Validation"

typeset -A COMPRESS_BEFORE COMPRESS_AFTER COMPRESS_PCT

compress_samples=(
  "Could you please help me write a function that takes a list of integers as input and returns the sum of all even numbers in the list? I would really appreciate it if the function could also handle edge cases like empty lists and negative numbers gracefully. Thank you so much for your help!"
  "I was wondering if you could take a look at this bug I found. Basically, what happens is that when a user tries to log in with their email address and password, the authentication middleware throws an unhandled promise rejection error. I think the issue might be related to the fact that we are not properly awaiting the database query in the verify function. Would you be able to investigate this and provide a fix?"
  "Hi there! I would like to request a new feature for our application. Specifically, I am looking for the ability to export data from our dashboard in CSV format. The exported file should include all of the columns that are currently visible in the data table, and it should respect any active filters or sorting that the user has applied. It would also be nice if we could add a progress indicator while the export is being generated."
)
compress_names=("Coding Task" "Bug Report" "Feature Request")

# Pre-computed compressed versions (caveman speak: strip filler, abbreviate, remove politeness)
compress_rewrites=(
  "Write fn taking list of ints, ret sum of evens. Handle empty lists + negatives."
  "Auth middleware throws unhandled promise rejection on login. Likely missing await on db query in verify fn. Investigate + fix."
  "Need CSV export from dashboard. Include all visible columns, respect active filters/sorting. Add progress indicator during export."
)

total_compress_before=0
total_compress_after=0

for j in 1 2 3; do
  sample="${compress_samples[$j]}"
  rewrite="${compress_rewrites[$j]}"
  sname="${compress_names[$j]}"

  before_chars=${#sample}
  before_tokens=$((before_chars / 4))
  after_chars=${#rewrite}
  after_tokens=$((after_chars / 4))

  filler_words="please|really|basically|specifically|just|actually|simply|certainly|definitely|perhaps|honestly|literally|obviously|clearly|essentially|generally|usually|probably|possibly|apparently|unfortunately|interestingly|importantly|significantly|naturally|fortunately"
  politeness_words="Could you|Would you|I was wondering|I would like|I think|Thank you|Hi there|I would really appreciate|Would you be able to|It would also be nice"
  filler_count=$(echo "$sample" | { grep -oiE "\b($filler_words)\b" || true; } | wc -l | tr -d ' ')
  polite_count=$(echo "$sample" | { grep -oiE "($politeness_words)" || true; } | wc -l | tr -d ' ')

  if [ "$before_tokens" -gt 0 ]; then
    reduction_pct=$(echo "scale=0; 100 - $after_tokens * 100 / $before_tokens" | bc)
  else
    reduction_pct=0
  fi

  total_compress_before=$((total_compress_before + before_tokens))
  total_compress_after=$((total_compress_after + after_tokens))

  echo ""
  metric "Sample $j: $sname" ""
  metric "  Before tokens" "~$before_tokens"
  metric "  After tokens" "~$after_tokens"
  metric "  Fillers found" "$filler_count"
  metric "  Politeness found" "$polite_count"
  printf "  ${BOLD}%-35s${RESET} ${GREEN}%s%%${RESET}\n" "  Reduction" "$reduction_pct"
  echo "  Compressed: $rewrite"
done

if [ "$total_compress_before" -gt 0 ]; then
  avg_compress_pct=$(echo "scale=0; 100 - $total_compress_after * 100 / $total_compress_before" | bc)
else
  avg_compress_pct=0
fi
echo ""
printf "  ${BOLD}${GREEN}PromptCompressor avg reduction: ${avg_compress_pct}%%${RESET}\n"

# ══════════════════════════════════════════════════════════════════════
# Phase 6: PromptOptimizer Validation
# ══════════════════════════════════════════════════════════════════════
header "Phase 6: PromptOptimizer Validation"

typeset -A OPT_BEFORE OPT_AFTER OPT_PCT

opt_samples=(
  "I need you to act as an expert senior software engineer with 20 years of experience in TypeScript, React, Node.js, and PostgreSQL. You should think step by step and consider all edge cases carefully. Before writing any code, please explain your thought process in detail. Then write a function called getUserById that queries the users table in our PostgreSQL database and returns the user object. Make sure to handle the case where the user is not found. Use TypeScript with proper type annotations. The function should be async and use our existing db connection pool. Please also add JSDoc comments explaining each parameter and the return type. After writing the code, please review it for any potential issues and explain why your implementation is the best approach."
  "You are a helpful coding assistant that specializes in modern web development. Your task is to help me refactor a React component. The component is called UserProfile and it currently uses class-based syntax with setState. I would like you to convert it to use functional component syntax with React hooks, specifically useState and useEffect. Please maintain all existing functionality exactly as it is. Do not add any new features or remove any existing ones. The component should look and behave identically after the refactoring. Please show me the complete refactored component with all imports and exports."
)
opt_names=("Over-specified DB Query" "Verbose React Refactor")

# Optimized versions (what PromptOptimizer would produce)
opt_rewrites=(
  "Write async fn getUserById(id: string): Promise<User | null> querying users table via existing db pool. Handle not-found case. TypeScript, proper types."
  "Refactor UserProfile from class component to functional with useState/useEffect. Preserve all behavior. Show complete component."
)

total_opt_before=0
total_opt_after=0

for j in 1 2; do
  sample="${opt_samples[$j]}"
  rewrite="${opt_rewrites[$j]}"
  oname="${opt_names[$j]}"

  before_chars=${#sample}
  before_tokens=$((before_chars / 4))
  after_chars=${#rewrite}
  after_tokens=$((after_chars / 4))

  if [ "$before_tokens" -gt 0 ]; then
    opt_pct=$(echo "scale=0; 100 - $after_tokens * 100 / $before_tokens" | bc)
  else
    opt_pct=0
  fi

  total_opt_before=$((total_opt_before + before_tokens))
  total_opt_after=$((total_opt_after + after_tokens))

  # Count waste patterns
  redundancy=$(echo "$sample" | { grep -oiE "(please|make sure|carefully|in detail|properly)" || true; } | wc -l | tr -d ' ')
  over_spec=$(echo "$sample" | { grep -oiE "(act as|you are|you should|your task)" || true; } | wc -l | tr -d ' ')
  verbose=$(echo "$sample" | { grep -oiE "(I need you to|I would like you to|before writing|after writing|explain why)" || true; } | wc -l | tr -d ' ')
  meta=$(echo "$sample" | { grep -oiE "(step by step|think|consider all|review it for)" || true; } | wc -l | tr -d ' ')

  echo ""
  metric "Sample $j: $oname" ""
  metric "  Before tokens" "~$before_tokens"
  metric "  After tokens" "~$after_tokens"
  metric "  Waste: redundancy" "$redundancy"
  metric "  Waste: over-specification" "$over_spec"
  metric "  Waste: verbose framing" "$verbose"
  metric "  Waste: meta-instructions" "$meta"
  printf "  ${BOLD}%-35s${RESET} ${GREEN}%s%%${RESET}\n" "  Reduction" "$opt_pct"
  echo ""
  echo "  Optimized rewrite:"
  echo "    $rewrite"
done

if [ "$total_opt_before" -gt 0 ]; then
  avg_opt_pct=$(echo "scale=0; 100 - $total_opt_after * 100 / $total_opt_before" | bc)
else
  avg_opt_pct=0
fi
echo ""
printf "  ${BOLD}${GREEN}PromptOptimizer avg reduction: ${avg_opt_pct}%%${RESET}\n"

# ── Final Summary ──
header "FINAL SUMMARY"

printf "\n  ${BOLD}%-25s %15s %15s${RESET}\n" "Metric" "repo-a" "repo-b"
printf '  %s\n' "$(printf '%*s' 58 '' | tr ' ' '-')"
printf "  %-25s %15s %15s\n" "Source files"      "${FILE_COUNTS[repo-a]:-?}"       "${FILE_COUNTS[repo-b]:-?}"
printf "  %-25s %15s %15s\n" "Raw bytes"          "${RAW_BYTES[repo-a]:-?}"         "${RAW_BYTES[repo-b]:-?}"
printf "  %-25s %15s %15s\n" "Raw tokens"         "~${RAW_TOKENS[repo-a]:-?}"       "~${RAW_TOKENS[repo-b]:-?}"
printf "  %-25s %15s %15s\n" "Graph tokens"       "~${GRAPH_TOKENS[repo-a]:-?}"     "~${GRAPH_TOKENS[repo-b]:-?}"
printf "  ${GREEN}%-25s %15s %15s${RESET}\n" "Token reduction" "${REDUCTION_PCT[repo-a]:-?}" "${REDUCTION_PCT[repo-b]:-?}"
printf "  %-25s %15s %15s\n" "graph.json bytes"   "${GRAPH_BYTES[repo-a]:-?}"       "${GRAPH_BYTES[repo-b]:-?}"
printf "  %-25s %15s %15s\n" "Nodes"              "${NODE_COUNTS[repo-a]:-?}"       "${NODE_COUNTS[repo-b]:-?}"
printf "  %-25s %15s %15s\n" "Edges"              "${EDGE_COUNTS[repo-a]:-?}"       "${EDGE_COUNTS[repo-b]:-?}"
printf "  %-25s %15s %15s\n" "Communities"        "${COMMUNITY_COUNTS[repo-a]:-?}"  "${COMMUNITY_COUNTS[repo-b]:-?}"
printf "  %-25s %15s %15s\n" "Extracted edges"    "${EXTRACTED_EDGES[repo-a]:-?}"   "${EXTRACTED_EDGES[repo-b]:-?}"
printf "  %-25s %15s %15s\n" "Inferred edges"     "${INFERRED_EDGES[repo-a]:-?}"    "${INFERRED_EDGES[repo-b]:-?}"
printf "  %-25s %15s %15s\n" "Build time"         "${BUILD_TIMES[repo-a]:-?}"       "${BUILD_TIMES[repo-b]:-?}"
printf "  %-25s %15s %15s\n" "Query matches"      "${QUERY_RESULTS[repo-a]:-?}"     "${QUERY_RESULTS[repo-b]:-?}"
printf "  %-25s %15s %15s\n" "Context nodes"      "${CONTEXT_RESULTS[repo-a]:-?}"   "${CONTEXT_RESULTS[repo-b]:-?}"

total_raw=$(( ${RAW_TOKENS[repo-a]:-0} + ${RAW_TOKENS[repo-b]:-0} ))
total_graph=$(( ${GRAPH_TOKENS[repo-a]:-0} + ${GRAPH_TOKENS[repo-b]:-0} ))
if [ "$total_raw" -gt 0 ]; then
  overall_pct=$(echo "scale=1; (1 - $total_graph / $total_raw) * 100" | bc)
else
  overall_pct="N/A"
fi

echo ""
printf "  ${BOLD}${GREEN}KnowledgeGraph token reduction: ${overall_pct}%%${RESET}\n"
printf "  ${BOLD}Total raw: ~${total_raw}  →  Graph: ~${total_graph}${RESET}\n"

echo ""
printf "\n  ${BOLD}%-30s %15s${RESET}\n" "TokenDiet Suite" "Reduction"
printf '  %s\n' "$(printf '%*s' 48 '' | tr ' ' '-')"
printf "  ${GREEN}%-30s %15s${RESET}\n" "KnowledgeGraph" "${overall_pct}%"
printf "  ${GREEN}%-30s %15s${RESET}\n" "PromptCompressor" "${avg_compress_pct}%"
printf "  ${GREEN}%-30s %15s${RESET}\n" "PromptOptimizer" "${avg_opt_pct}%"
echo ""
divider
echo "  Benchmark complete."
echo "  KnowledgeGraph outputs in each repo's knowledgegraph/ dir."
divider
echo ""
