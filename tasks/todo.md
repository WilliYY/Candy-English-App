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
- [ ] Aulas e materiais protegidos.
- [ ] Download e cache seguro de arquivos.
- [ ] Lista e detalhe de homework.
- [ ] Rascunho e envio idempotente de homework.
- [ ] Renderização dos campos interativos suportados.
- [ ] Feedback de homework.
- [ ] Mensagens com teacher vinculada.
- [ ] Contratos protegidos.
- [ ] Perfil e avatar.
- [ ] Candy XP, ranking e atividades.
- [ ] Submissão Candy XP.
- [ ] Catty autenticada.
- [ ] Aula ao vivo/manutenção.
- [ ] Notificações do aluno.
- [ ] Smoke completo `STUDENT`.

## TEACHER

- [x] Resumo da teacher.
- [x] Alunos vinculados.
- [ ] Aulas e materiais.
- [ ] Criação e edição de aula interativa.
- [ ] Homework: criar, duplicar, editar e excluir.
- [ ] Editor nativo de campos interativos.
- [ ] Fila de submissões e feedback.
- [ ] Mensagens com alunos vinculados.
- [ ] Contratos permitidos.
- [x] Pré-cadastros próprios/atribuídos.
- [ ] Conversão autorizada de pré-cadastro.
- [ ] Candy XP permitido.
- [ ] Catty Learning e artefatos permitidos.
- [x] Secretaria limitada.
- [ ] Testes negativos de vínculo.
- [ ] Smoke completo `TEACHER`.

## ADMIN

- [x] Resumo administrativo.
- [ ] Usuários: listar, buscar e detalhar.
- [ ] Criar, editar, ativar e desativar usuário.
- [ ] Redefinição de senha com revogação.
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
- [ ] Limpar cache, tokens e temporários no logout.
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
