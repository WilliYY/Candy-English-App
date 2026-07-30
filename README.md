# Candy English App

Aplicativo nativo Android e iOS do Candy English para alunos, professoras e
administração.

O aplicativo usará o mesmo backend, banco PostgreSQL, usuários, permissões e
dados do projeto web Candy English.

## Status

Autenticação segura, sessão persistente, painéis por role, módulos nativos,
mensagens, aulas com materiais/vocabulário, contratos PDF protegidos e
homeworks `TEXT`/interativas com rascunho, desenho, listening e entrega já estão
implementados. Contratos usam download autenticado, cache temporário validado e
limpeza no logout. A implementação das demais operações de escrita segue conforme
[`docs/spec.md`](docs/spec.md) e [`tasks/plan.md`](tasks/plan.md).

## Documentação

- [`docs/spec.md`](docs/spec.md): escopo, arquitetura, segurança e critérios de
  sucesso.
- [`docs/adr/0001-mobile-auth.md`](docs/adr/0001-mobile-auth.md): decisão de
  autenticação e armazenamento de tokens.
- [`tasks/plan.md`](tasks/plan.md): fases e checkpoints.
- [`tasks/todo.md`](tasks/todo.md): tarefas verificáveis.

## Repositório do backend e site

<https://github.com/WilliYY/Candy-English>

## Executar o aplicativo

Requisitos: Node.js 22.13 ou superior e npm.

```powershell
npm.cmd ci
Copy-Item .env.example .env
npm.cmd start
```

Configure `EXPO_PUBLIC_API_URL` com a URL pública HTTPS do backend, sem
`/api/mobile/v1`. Em desenvolvimento, o fallback é `http://localhost:3000` no
iOS/web e `http://10.0.2.2:3000` no emulador Android. Um celular físico precisa
usar uma URL acessível pela rede ou HTTPS.

Atalhos:

```powershell
npm.cmd run android
npm.cmd run ios
npm.cmd run web
```

## Validar

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run doctor
npx.cmd expo install --check
```

O projeto usa Expo Router em `src/app`, TypeScript estrito, Jest Expo e os
assets reais da marca Candy English.

O backend precisa receber primeiro a migration
`20260730121000_mobile_sessions`. Sem ela, o login do aplicativo não funciona.
