import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(projectRoot, "dist-teacher-smoke");
const npmCliPath = process.env.npm_execpath;

if (!npmCliPath) {
  throw new Error("Execute este smoke com `npm run verify:teacher`.");
}

const steps = [
  ["testes de regressão", ["run", "test"]],
  ["tipagem TypeScript", ["run", "typecheck"]],
  ["lint", ["run", "lint"]],
  ["compatibilidade Expo", ["run", "doctor"]],
  [
    "export Android, iOS e web",
    [
      "exec",
      "--",
      "expo",
      "export",
      "--platform",
      "all",
      "--output-dir",
      outputDirectory,
      "--clear",
    ],
  ],
];

function runStep(label, args) {
  console.log(`\n[teacher smoke] ${label}`);
  const result = spawnSync(process.execPath, [npmCliPath, ...args], {
    cwd: projectRoot,
    env: { ...process.env, CI: "1" },
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${label} falhou com código ${result.status ?? "desconhecido"}.`);
  }
}

try {
  for (const [label, args] of steps) {
    runStep(label, args);
  }

  console.log("\n[teacher smoke] aprovado");
} finally {
  rmSync(outputDirectory, { force: true, recursive: true });
}
