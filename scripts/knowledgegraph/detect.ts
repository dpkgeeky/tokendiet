import { readdirSync, statSync } from "fs";
import { join, extname, relative } from "path";
import { SUPPORTED_EXTENSIONS, IGNORE_DIRS } from "./types.js";

export function detect(rootDir: string): string[] {
  const files: string[] = [];
  walk(rootDir, rootDir, files);
  return files.sort();
}

function walk(dir: string, rootDir: string, results: string[]): void {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (IGNORE_DIRS.has(entry.name)) continue;

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath, rootDir, results);
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS[ext]) {
        const stat = statSync(fullPath);
        if (stat.size < 512_000) {
          results.push(relative(rootDir, fullPath));
        }
      }
    }
  }
}
