# Candy English Mobile — tarefas

## Aprovação

- [x] Aprovar `docs/spec.md`.
- [x] Confirmar cofre `APIs e senhas` somente no site.
- [x] Confirmar financeiro sem pagamento online.

## Fundação

- [x] Inicializar Git do aplicativo.
  - Aceite: repositório local com `.gitignore`, sem segredos ou builds.
  - Verificação: `git status --short --branch`.
- [x] Criar Expo TypeScript com Expo Router.
  - Aceite: tela inicial abre em development build.
  - Verificação: `npx.cmd expo-doctor`.
- [x] Configurar lint, typecheck e Jest Expo.
  - Aceite: os três comandos executam e passam.
  - Verificação: `npm.cmd run lint`, `npm.cmd run typecheck`,
    `npm.cmd run test`.
- [ ] Criar tema Candy e primitivas acessíveis.
  - Aceite: tipografia, cores, espaçamento, botões, campos e estados comuns.
  - Verificação: testes de componente e inspeção em aparelho.
- [ ] Criar cliente HTTP e contratos base.
  - Aceite: sucesso, erro, timeout, cancelamento e request ID tipados.
  - Verificação: testes unitários inicialmente vermelhos e depois verdes.

## Autenticação

- [x] Escrever ADR da autenticação móvel.
- [ ] Escrever testes de login, refresh, replay, logout e revogação.
- [x] Adicionar migration de `MobileSession` e `MobileDevice`.
- [x] Extrair verificação de credenciais compartilhada sem quebrar Auth.js.
- [x] Implementar `/api/mobile/v1/auth/login`.
- [x] Implementar `/api/mobile/v1/auth/refresh`.
- [x] Implementar `/api/mobile/v1/auth/logout`.
- [x] Implementar `/api/mobile/v1/auth/me`.
- [x] Implementar SecureStore e restauração de sessão no app.
- [x] Implementar roteamento por `STUDENT`, `TEACHER` e `ADMIN`.
- [ ] Executar smokes de auth web e móvel.

## STUDENT

- [x] Contrato e endpoint de bootstrap/resumo.
- [x] Tela de resumo com estados completos.
- [x] Aulas e materiais protegidos.
- [x] Download e cache seguro de arquivos.
- [x] Lista e detalhe de homework.
- [x] Rascunho e envio idempotente de homework.
- [x] Renderização dos campos interativos suportados.
- [x] Feedback de homework.
- [x] Mensagens com teacher vinculada.
- [x] Contratos protegidos.
- [x] Perfil e avatar.
- [x] Candy XP, ranking e atividades.
- [x] Submissão Candy XP.
- [x] Catty autenticada.
- [x] Aula ao vivo/manutenção.
- [x] Notificações do aluno.
- [ ] Smoke completo `STUDENT`.

## TEACHER

- [x] Resumo da teacher.
- [x] Alunos vinculados.
- [x] Aulas e materiais.
- [x] Criação e edição de aula interativa.
- [x] Homework: criar, duplicar, editar e excluir.
- [x] Editor nativo de campos interativos.
- [x] Fila de submissões e feedback.
- [x] Mensagens com alunos vinculados.
- [x] Contratos permitidos.
- [x] Pré-cadastros próprios/atribuídos.
- [x] Conversão autorizada de pré-cadastro.
- [x] Candy XP permitido.
- [x] Catty Learning e artefatos permitidos.
- [x] Secretaria limitada.
- [x] Testes negativos de vínculo.
  - Verificação: `npm.cmd run verify:mobile-teacher` no backend e matriz em
    `docs/teacher-smoke.md`.
- [x] Smoke completo `TEACHER`.
  - Verificação: `npm.cmd run verify:teacher`.

## ADMIN

- [x] Resumo administrativo.
- [x] Usuários: listar, buscar e detalhar.
- [x] Criar, editar, ativar e desativar usuário.
- [x] Redefinição de senha com revogação.
- [ ] Pré-cadastros completos.
- [ ] Conversão transacional.
- [ ] Financeiro por unidade.
- [ ] Pagamentos, parcelas, gastos e logs.
- [ ] Agenda mensal e fila diária.
- [ ] Presença, falta, reposição e histórico.
- [ ] Contratos.
- [ ] Manutenção e opções operacionais seguras.
- [ ] Candy XP administrativo.
- [ ] Administração permitida da Catty.
- [ ] Supervisão das áreas teacher/student.
- [ ] Confirmações de ações destrutivas.
- [ ] Testes negativos de role.
- [ ] Smoke completo `ADMIN`.

## Sincronização e resiliência

- [ ] Escrever ADR da sincronização.
- [ ] Criar cursor de mudanças.
- [ ] Revalidar ao foreground e reconnect.
- [ ] Atualizar telas abertas em até 15 segundos.
- [ ] Detectar conflito de rascunho.
- [ ] Retry idempotente de upload.
- [ ] Registrar e remover push tokens inválidos.
- [x] Limpar cache, tokens e temporários no logout.
- [ ] Testar perda e retorno de conexão.

## Entrega

- [ ] Validar Prisma.
- [ ] Rodar testes backend móveis.
- [ ] Rodar smokes existentes afetados.
- [ ] Rodar typecheck, lint e build do site.
- [ ] Rodar testes, typecheck, lint e Expo Doctor do app.
- [ ] Rodar auditorias de dependências e assinaturas.
- [ ] Revisar diff e segredos.
- [ ] Testar Android físico.
- [ ] Gerar preview Android.
- [ ] Gerar preview iOS.
- [ ] Testar acessibilidade e tamanhos de fonte.
- [ ] Atualizar documentação do site e do app.
- [ ] Commitar fatias atômicas.
- [ ] Fazer push do site.
- [ ] Configurar remoto e fazer push do aplicativo.
- [ ] Preparar publicação somente após aprovação do preview.
