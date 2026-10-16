import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const PRETTIER_EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".md",
  ".mdx",
]);
const ESLINT_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const IGNORED_DIRS = new Set(["node_modules", ".next", ".git"]);

const readStdin = async () => {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data;
};

const run = (root, bin, args) =>
  spawnSync(process.execPath, [path.join(root, bin), ...args], {
    cwd: root,
    encoding: "utf8",
  });

const stripTrailingWhitespace = (file) => {
  const content = readFileSync(file, "utf8");
  const cleaned = content.replace(/[ \t]+$/gm, "");
  if (cleaned !== content) writeFileSync(file, cleaned);
};

const main = async () => {
  const input = JSON.parse((await readStdin()) || "{}");
  const filePath = input.tool_input?.file_path;
  if (!filePath) return;

  const root = path.resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd());
  const file = path.resolve(filePath);
  const rel = path.relative(root, file);

  if (rel.startsWith("..") || path.isAbsolute(rel)) return;
  if (rel.split(path.sep).some((part) => IGNORED_DIRS.has(part))) return;
  if (!existsSync(file)) return;

  const ext = path.extname(file).toLowerCase();
  if (!PRETTIER_EXTS.has(ext)) return;

  const prettier = run(root, "node_modules/prettier/bin/prettier.cjs", [
    "--config",
    path.join(root, ".prettierrc"),
    "--write",
    file,
  ]);
  if (prettier.status !== 0) {
    process.stderr.write(`Prettier failed on ${rel}:\n${prettier.stderr}${prettier.stdout}`);
    process.exit(2);
  }

  const eslint = ESLINT_EXTS.has(ext)
    ? run(root, "node_modules/eslint/bin/eslint.js", ["--fix", file])
    : null;

  stripTrailingWhitespace(file);

  if (eslint && eslint.status !== 0) {
    process.stderr.write(`ESLint errors in ${rel}:\n${eslint.stdout}${eslint.stderr}`);
    process.exit(2);
  }
};

main().catch((err) => {
  process.stderr.write(`format-and-lint hook error: ${err.message}\n`);
  process.exit(1);
});
