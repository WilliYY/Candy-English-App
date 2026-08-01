# Candy English App

Aplicativo nativo Android e iOS do Candy English para alunos, professoras e
administração.

O aplicativo usará o mesmo backend, banco PostgreSQL, usuários, permissões e
dados do projeto web Candy English.

## Status

Autenticação segura, sessão persistente, painéis por role, módulos nativos,
mensagens, aulas com materiais/vocabulário, contratos PDF protegidos, perfil
compartilhado com avatar otimizado, Candy XP com ranking, materiais, rascunho e
entrega de atividades, Catty autenticada com histórico compartilhado e aula ao
vivo com manutenção sincronizada, central de avisos do aluno para aulas,
detalhes, criação e edição protegida do planejamento de aulas da teacher,
incluindo conflito entre site/aparelho, criação, edição, duplicação e exclusão
confirmada de homeworks da teacher, fila nativa de entregas, feedback e liberação
de nova tentativa com conflito seguro, editor nativo de campos interativos com
posição compatível com o site, tarefas, correções e conquistas, além de homeworks
`TEXT`/interativas com desenho, listening e envio já estão implementados. A
teacher também acessa somente contratos gerais ou dos próprios alunos
vinculados e converte pré-cadastros próprios/atribuídos com confirmação dupla,
agenda e financeiro incompletos protegidos e repetição idempotente. O Candy XP
da teacher sincroniza a jornada pedagógica e um ranking interno somente de
teachers, sem expor respostas ou dados privados dos alunos. O Catty Learning da
teacher envia sugestões pendentes para aprovação do Admin e
personaliza temas somente dos alunos vinculados, usando a mesma validação e os
mesmos registros do site, sem expor e-mail, mensagens ou memória interna.
O ADMIN já possui gestão nativa de usuários, com busca, filtros, paginação,
detalhe seguro, criação, edição, ativação/desativação confirmada e redefinição
de senha com revogação imediata das sessões, sem expor credenciais ou dados de
sessão e com proteção contra conflitos com o site.
Também possui fila completa de pré-cadastros, com busca, etapa, unidade,
paginação e detalhe administrativo de contato, responsável, financeiro,
agenda e prontidão para conversão. A conversão administrativa cria a conta
`STUDENT` pela mesma transação do site, exige confirmação explícita quando
agenda ou financeiro estão incompletos, impede sobrescrita concorrente e não
guarda nem devolve a senha inicial.
O Financeiro do ADMIN já possui visão mensal nativa por unidade, resumo de
previsto, recebido, pendente, atrasado e cadastros incompletos, com busca,
filtros, paginação e atualização conectada a cada 15 segundos. O detalhe permite
ajustar valor, observação e situação do pagamento; a área operacional registra
gastos e mostra o histórico recente. Escritas exigem confirmação explícita,
versão atual e operação idempotente, sincronizam com o site e não enviam CPF ou
endereço ao celular. O módulo continua sendo controle interno, sem cobrança
online.
O ADMIN também possui agenda mensal por unidade e fila diária pesquisável,
com contagens de aulas, presenças, faltas e reposições, atualização a cada 15
segundos e cartões operacionais com horário, telefone e observações internas.
Essa agenda continua separada das contas e aulas pedagógicas do AVA.
Cada ocorrência abre um detalhe com histórico do aluno e ações confirmadas de
presença, falta, reset e criação de reposição. As escritas usam a versão atual e
uma operação idempotente, impedem reposição ativa duplicada e sincronizam com o
mesmo banco de dados usado pelo site.
Arquivos protegidos usam download autenticado, cache
temporário validado e limpeza no logout. A implementação das
demais operações de escrita segue conforme
[`docs/spec.md`](docs/spec.md) e [`tasks/plan.md`](tasks/plan.md).

## Documentação

- [`docs/spec.md`](docs/spec.md): escopo, arquitetura, segurança e critérios de
  sucesso.
- [`docs/adr/0001-mobile-auth.md`](docs/adr/0001-mobile-auth.md): decisão de
  autenticação e armazenamento de tokens.
- [`docs/distribuicao.md`](docs/distribuicao.md): comunicação com o site,
  previews, downloads, lojas e atualizações.
- [`docs/teacher-smoke.md`](docs/teacher-smoke.md): matriz de isolamento e
  verificação automatizada completa do perfil teacher.
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
npm.cmd run verify:teacher
```

O projeto usa Expo Router em `src/app`, TypeScript estrito, Jest Expo e os
assets reais da marca Candy English.

O backend precisa receber primeiro a migration
`20260730121000_mobile_sessions`. Sem ela, o login do aplicativo não funciona.
