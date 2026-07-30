# Candy English App

Aplicativo nativo Android e iOS do Candy English para alunos, professoras e
administração.

O aplicativo usará o mesmo backend, banco PostgreSQL, usuários, permissões e
dados do projeto web Candy English.

## Status

Especificação aprovada. Implementação incremental em andamento conforme
[`docs/spec.md`](docs/spec.md) e [`tasks/plan.md`](tasks/plan.md).

## Documentação

- [`docs/spec.md`](docs/spec.md): escopo, arquitetura, segurança e critérios de
  sucesso.
- [`tasks/plan.md`](tasks/plan.md): fases e checkpoints.
- [`tasks/todo.md`](tasks/todo.md): tarefas verificáveis.

## Repositório do backend e site

<https://github.com/WilliYY/Candy-English>

## Executar o aplicativo

Requisitos: Node.js 22.13 ou superior e npm.

```powershell
npm.cmd ci
npm.cmd start
```

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
