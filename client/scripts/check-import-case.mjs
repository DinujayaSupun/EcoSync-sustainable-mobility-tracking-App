import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "src");
const sourceExtensions = new Set([".js", ".jsx", ".ts", ".tsx"]);
const resolveExtensions = [".js", ".jsx", ".ts", ".tsx", ".json", ".css", ".scss", ".sass", ".less"];
const importPattern = /(?:import\s+(?:[^'";]+?\s+from\s+)?|import\s*\(|require\s*\()\s*['"]([^'"]+)['"]/g;

function collectSourceFiles(dir, result = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(fullPath, result);
      continue;
    }

    if (sourceExtensions.has(path.extname(entry.name))) {
      result.push(fullPath);
    }
  }

  return result;
}

function readDirMap(dir) {
  const map = new Map();
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    map.set(entry.name.toLowerCase(), entry.name);
  }
  return map;
}

function resolvePathCaseInsensitive(fromDir, relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);

  let currentDir = fromDir;
  const actualParts = [];

  for (const part of parts) {
    if (part === ".") {
      actualParts.push(".");
      continue;
    }

    if (part === "..") {
      currentDir = path.dirname(currentDir);
      actualParts.push("..");
      continue;
    }

    if (!fs.existsSync(currentDir) || !fs.statSync(currentDir).isDirectory()) {
      return null;
    }

    const dirMap = readDirMap(currentDir);
    const actualName = dirMap.get(part.toLowerCase());
    if (!actualName) {
      return null;
    }

    actualParts.push(actualName);
    currentDir = path.join(currentDir, actualName);
  }

  return {
    absolutePath: currentDir,
    actualParts,
    requestedParts: parts,
  };
}

function compareSegmentCase(result, startIndex = 0) {
  const mismatches = [];
  for (let i = startIndex; i < result.requestedParts.length; i += 1) {
    const requested = result.requestedParts[i];
    const actual = result.actualParts[i];

    if (requested === "." || requested === "..") {
      continue;
    }

    if (!actual) {
      continue;
    }

    if (requested !== actual && requested.toLowerCase() === actual.toLowerCase()) {
      mismatches.push({ index: i, requested, actual });
    }
  }
  return mismatches;
}

function candidateSpecs(specifier) {
  if (path.extname(specifier)) {
    return [{ probe: specifier, mode: "direct" }];
  }

  const probes = [];
  for (const ext of resolveExtensions) {
    probes.push({ probe: `${specifier}${ext}`, mode: "fileNoExt" });
  }
  for (const ext of sourceExtensions) {
    probes.push({ probe: `${specifier}/index${ext}`, mode: "index" });
  }

  return probes;
}

function relativeToProject(filePath) {
  return path.relative(projectRoot, filePath).replace(/\\/g, "/");
}

function main() {
  if (!fs.existsSync(sourceRoot)) {
    console.error("check-import-case: src folder not found");
    process.exit(1);
  }

  const files = collectSourceFiles(sourceRoot);
  const issues = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const fromDir = path.dirname(file);
    let match;

    while ((match = importPattern.exec(content)) !== null) {
      const specifier = match[1];
      if (!specifier.startsWith(".")) {
        continue;
      }

      const candidates = candidateSpecs(specifier);
      let resolved = null;
      let mode = null;

      for (const candidate of candidates) {
        const attempt = resolvePathCaseInsensitive(fromDir, candidate.probe);
        if (attempt && fs.existsSync(attempt.absolutePath)) {
          resolved = attempt;
          mode = candidate.mode;
          break;
        }
      }

      if (!resolved) {
        continue;
      }

      const caseMismatches = compareSegmentCase(resolved);
      if (caseMismatches.length > 0) {
        issues.push({
          file: relativeToProject(file),
          importPath: specifier,
          resolvedPath: relativeToProject(resolved.absolutePath),
        });
        continue;
      }

      if (mode === "fileNoExt") {
        const requestedLast = specifier.split("/").filter(Boolean).at(-1);
        const actualFileName = path.basename(resolved.absolutePath);
        const actualBaseName = actualFileName.slice(0, actualFileName.length - path.extname(actualFileName).length);
        if (requestedLast && requestedLast !== actualBaseName && requestedLast.toLowerCase() === actualBaseName.toLowerCase()) {
          issues.push({
            file: relativeToProject(file),
            importPath: specifier,
            resolvedPath: relativeToProject(resolved.absolutePath),
          });
        }
      }

      if (mode === "index") {
        const requestedLast = specifier.split("/").filter(Boolean).at(-1);
        const actualDirName = path.basename(path.dirname(resolved.absolutePath));
        if (requestedLast && requestedLast !== actualDirName && requestedLast.toLowerCase() === actualDirName.toLowerCase()) {
          issues.push({
            file: relativeToProject(file),
            importPath: specifier,
            resolvedPath: relativeToProject(resolved.absolutePath),
          });
        }
      }
    }
  }

  if (issues.length === 0) {
    console.log("check-import-case: OK");
    process.exit(0);
  }

  console.error("check-import-case: Found import path casing mismatches:");
  for (const issue of issues) {
    console.error(`- ${issue.file}: ${issue.importPath} -> ${issue.resolvedPath}`);
  }
  process.exit(1);
}

main();
