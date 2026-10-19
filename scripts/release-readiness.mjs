import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { expo } = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
const eas = JSON.parse(fs.readFileSync(path.join(root, "eas.json"), "utf8"));
const errors = [];
const apiUrl = "https://candyenglish.com.br";
const requireLinked = process.argv.includes("--require-linked");

if (expo.android?.package !== "br.com.candyenglish.app") {
  errors.push("Conferir o identificador Android antes de criar outra identidade na loja.");
}
for (const [name, buildType] of [["preview", "apk"], ["production", "app-bundle"]]) {
  const profile = eas.build?.[name];
  if (profile?.environment !== name) errors.push(`Ambiente EAS ausente em ${name}.`);
  if (profile?.env?.EXPO_PUBLIC_API_URL !== apiUrl) {
    errors.push(`O build ${name} precisa usar o backend oficial HTTPS.`);
  }
  if (profile?.env?.EXPO_NO_DOTENV !== "1") {
    errors.push(`O build ${name} precisa ignorar o .env local.`);
  }
  if (profile?.android?.buildType !== buildType || profile?.android?.gradleCommand || profile?.developmentClient) {
    errors.push(`O build ${name} precisa gerar ${buildType} sem sobrescrita nativa.`);
  }
}
if (eas.build?.preview?.distribution !== "internal" || eas.build?.production?.distribution !== "store") {
  errors.push("Separar a distribuição interna do build de loja.");
}
if (!eas.build?.production?.autoIncrement || eas.cli?.appVersionSource !== "remote") {
  errors.push("Configurar incremento remoto da versão Android.");
}
if (eas.submit?.production?.android?.track !== "internal" || eas.submit?.production?.android?.releaseStatus !== "draft") {
  errors.push("O envio inicial precisa ser um rascunho no teste interno.");
}
for (const asset of [expo.icon, expo.android?.adaptiveIcon?.foregroundImage]) {
  if (!asset || !fs.existsSync(path.resolve(root, asset))) errors.push("Ícone Android ausente.");
}
const linked = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(expo.extra?.eas?.projectId ?? "");
if (requireLinked && !linked) errors.push("Faça login no Expo/EAS e vincule o projeto com eas init antes do build.");

if (process.argv.includes("--online")) {
  for (const [route, expected] of [["/api/health", 200], ["/api/mobile/v1/auth/me", 401], ["/api/mobile/v1/admin/finance", 401], ["/privacidade", 200]]) {
    try {
      const response = await fetch(`${apiUrl}${route}`, { redirect: "manual", signal: AbortSignal.timeout(15_000) });
      if (response.status !== expected) errors.push(`${route}: esperado ${expected}, recebido ${response.status}.`);
      await response.body?.cancel();
    } catch {
      errors.push(`${route}: não foi possível verificar a disponibilidade HTTPS.`);
    }
  }
}
if (errors.length) {
  for (const error of errors) console.error(`PENDENTE: ${error}`);
  process.exitCode = 1;
} else {
  console.log("Configuração Android conferida: backend oficial, APK de teste e AAB de loja.");
  console.log(linked ? "Projeto EAS vinculado; autenticação e assinatura ainda exigem conferência." : "PENDENTE: vincular a conta Expo/EAS antes do build remoto.");
  console.log("Esta checagem não comprova testes em aparelho, acesso à Play Console ou aprovação na loja.");
}
