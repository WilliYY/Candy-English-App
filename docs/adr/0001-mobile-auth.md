# ADR 0001 — Autenticação móvel

## Status

Aceita em 2026-07-30.

## Contexto

O site usa Auth.js com credenciais, mas o aplicativo precisa manter uma sessão
nativa revogável sem salvar senha e sem reutilizar cookie web. Site e app devem
continuar consultando o mesmo usuário e a mesma `sessionVersion`.

## Decisão

- O backend expõe autenticação em `/api/mobile/v1/auth`.
- Access tokens expiram em 15 minutos e existem apenas na memória do app.
- Refresh tokens expiram em 30 dias, são rotativos, vinculados à instalação e
  ficam no `expo-secure-store`.
- O servidor armazena somente SHA-256 dos tokens.
- Cada refresh é de uso único. Replay revoga a família da sessão.
- Logout, usuário inativo e mudança de `sessionVersion` invalidam o acesso.
- A role sempre vem do servidor. O app não escolhe nem amplia permissões.
- A senha é usada somente na requisição de login e nunca é persistida.

## Consequências

- Após reiniciar, o app usa o refresh token para obter um novo access token.
- Android e iOS mantêm a sessão no cofre nativo. A execução web de
  desenvolvimento usa apenas memória e não persiste credenciais.
- O ambiente de produção deve definir `EXPO_PUBLIC_API_URL` com HTTPS.
- O backend precisa aplicar a migration de sessões móveis antes de liberar o
  login em produção.
