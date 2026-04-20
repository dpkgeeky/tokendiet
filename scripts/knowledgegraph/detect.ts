import { readdirSync, statSync, readFileSync, existsSync } from "fs";
import { join, extname, relative } from "path";
import { SUPPORTED_EXTENSIONS, IGNORE_DIRS, IGNORE_ROOT_DIRS } from "./types.js";

export function detect(rootDir: string): string[] {
  const ignorePatterns = loadIgnorePatterns(rootDir);
  const files: string[] = [];
  walk(rootDir, rootDir, files, true, ignorePatterns);
  return files.sort();
}

function loadIgnorePatterns(rootDir: string): RegExp[] {
  const ignorePath = join(rootDir, ".tokendietignore");
  if (!existsSync(ignorePath)) return [];

  const content = readFileSync(ignorePath, "utf-8");
  const patterns: RegExp[] = [];

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    patterns.push(globToRegex(trimmed));
  }
  return patterns;
}

function globToRegex(pattern: string): RegExp {
  let regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "§§")
    .replace(/\*/g, "[^/]*")
    .replace(/§§/g, ".*")
    .replace(/\?/g, "[^/]");

  if (pattern.endsWith("/")) {
    regexStr = regexStr + ".*";
  } else if (!pattern.includes("/")) {
    regexStr = "(^|.*/)" + regexStr + "($|/.*)";
  } else {
    regexStr = "^" + regexStr + "($|/.*)";
  }

  return new RegExp(regexStr);
}

function isIgnored(filePath: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(filePath));
}

function walk(dir: string, rootDir: string, results: string[], isRoot: boolean, ignorePatterns: RegExp[]): void {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (IGNORE_DIRS.has(entry.name)) continue;
    if (isRoot && IGNORE_ROOT_DIRS.has(entry.name)) continue;

    const fullPath = join(dir, entry.name);
    const relPath = relative(rootDir, fullPath);

    if (ignorePatterns.length > 0 && isIgnored(relPath, ignorePatterns)) continue;

    if (entry.isDirectory()) {
      walk(fullPath, rootDir, results, false, ignorePatterns);
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS[ext]) {
        const stat = statSync(fullPath);
        if (stat.size < 512_000) {
          results.push(relPath);
        }
      }
    }
  }
}
