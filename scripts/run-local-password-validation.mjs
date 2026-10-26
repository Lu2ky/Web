import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const evidenceDir = join("tests", "evidencia");
mkdirSync(evidenceDir, { recursive: true });

const files = {
  unit: join(evidenceDir, "mi-perfil-cambio-contrasena-local-unit.txt"),
  e2e: join(evidenceDir, "mi-perfil-cambio-contrasena-local-e2e.txt"),
  report: join(evidenceDir, "mi-perfil-cambio-contrasena-local-reporte.md"),
};

function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    env: process.env,
    stdio: "pipe",
  });

  if (result.error) {
    return {
      code: 1,
      output: `${result.error.message}\n`,
    };
  }

  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  return {
    code: typeof result.status === "number" ? result.status : 1,
    output: [stdout, stderr].filter(Boolean).join("\n").trim() + "\n",
  };
}

const nodeCmd = process.execPath;

const unit = run(nodeCmd, [
  "node_modules/vitest/vitest.mjs",
  "run",
  "src/components/Account/UserProfile.changePassword.test.jsx",
]);
writeFileSync(files.unit, unit.output, "utf8");

const e2e = run(nodeCmd, [
  "node_modules/playwright/cli.js",
  "test",
  "-c",
  "playwright.config.js",
  "tests/e2e/user-profile-change-password.e2e.spec.js",
  "tests/e2e/user-profile-change-password.security.e2e.spec.js",
  "--reporter=list",
  "--workers=1",
]);
writeFileSync(files.e2e, e2e.output, "utf8");

const today = new Date().toISOString().slice(0, 10);
const status = unit.code === 0 && e2e.code === 0 ? "CONFIRMADO" : "CON FALLAS";

const report = [
  "# Reporte local - Cambio de contrasena",
  "",
  `Fecha: ${today}`,
  "Entorno: local (playwright.config.js + vitest)",
  "",
  "## Resultado final",
  `- Estado funcional local: ${status}`,
  `- Unitarias del flujo de cambio: ${unit.code === 0 ? "OK" : "FALLA"}`,
  `- E2E local (funcional + seguridad cliente): ${e2e.code === 0 ? "OK" : "FALLA"}`,
  "",
  "## Evidencias principales",
  "- tests/evidencia/mi-perfil-cambio-contrasena-local-unit.txt",
  "- tests/evidencia/mi-perfil-cambio-contrasena-local-e2e.txt",
  "",
  "## Comandos ejecutados",
  "- npx vitest run src/components/Account/UserProfile.changePassword.test.jsx",
  "- npx playwright test -c playwright.config.js tests/e2e/user-profile-change-password.e2e.spec.js tests/e2e/user-profile-change-password.security.e2e.spec.js --reporter=list --workers=1",
  "",
  "## Nota",
  "- Este reporte valida el flujo en local. No evalua persistencia real de backend live.",
  "",
].join("\n");

writeFileSync(files.report, report, "utf8");

console.log("Evidencias generadas:");
console.log(`- ${files.unit}`);
console.log(`- ${files.e2e}`);
console.log(`- ${files.report}`);

if (unit.code !== 0 || e2e.code !== 0) {
  process.exit(1);
}
