# Plano de implementação: Candy English Mobile

## Visão geral

Construir o aplicativo em fatias verticais, mantendo o site utilizável após
cada mudança. A fundação e o contrato vêm primeiro; depois entram os fluxos
completos de `STUDENT`, `TEACHER` e `ADMIN`.

## Decisões de arquitetura

- Backend e PostgreSQL atuais continuam como fonte única.
- API REST versionada em `/api/mobile/v1`.
- Serviços de domínio compartilhados evitam divergência entre server actions e
  API.
- Sessão móvel usa access token curto e refresh token opaco rotativo.
- Aplicativo é nativo com Expo Router, sem WebView para os módulos.
- Cofre de APIs/senhas permanece exclusivo do site.
- Sincronização usa revalidação, cursor de mudanças e push com payload mínimo.

## Fases

### Fase 0 — Especificação e segurança

- Aprovar `docs/spec.md`.
- Registrar ADRs de API, autenticação móvel e sincronização.
- Mapear endpoints, recursos, roles e ownership.
- Criar testes de contrato inicialmente vermelhos.

### Checkpoint

- Especificação aprovada.
- Nenhuma alteração de runtime ou banco executada.

### Fase 1 — Fundação do app

- Inicializar Expo TypeScript.
- Configurar Expo Router, lint, typecheck e testes.
- Criar tema Candy e componentes essenciais.
- Criar cliente HTTP, envelope de resposta e tratamento de erros.
- Criar cache, estado offline e limpeza de sessão.

### Checkpoint

- App abre em Android.
- Testes, lint e typecheck passam.
- Estados loading, vazio, erro e offline demonstráveis.

### Fase 2 — Autenticação ponta a ponta

- Adicionar modelos `MobileSession` e `MobileDevice`.
- Extrair verificação de credenciais reutilizável.
- Implementar login, refresh, logout e `me`.
- Integrar SecureStore no app.
- Testar revogação por logout, senha, usuário inativo e `sessionVersion`.

### Checkpoint

- Três roles entram com contas reais de teste.
- Token roubado/reutilizado e refresh antigo são recusados.
- Login web continua funcionando.

### Fase 3 — STUDENT

- Bootstrap e resumo.
- Aulas, materiais e arquivos.
- Homework, rascunho, envio e feedback.
- Mensagens e contratos.
- Candy XP, ranking, atividades e perfil.
- Catty e aula ao vivo conforme configuração.
- Notificações do aluno.

### Checkpoint

- Fluxo estudante completo em Android real.
- Ownership testado em todos os recursos.
- Alterações feitas no app aparecem no site.

### Fase 4 — TEACHER

- Resumo e alunos vinculados.
- Aulas, materiais e editor interativo.
- Homework, submissões e feedback.
- Mensagens e contratos.
- Pré-cadastro e conversão permitida.
- Candy XP e Catty dentro do escopo da teacher.
- Secretaria limitada.

### Checkpoint

- Teacher não acessa aluno não vinculado.
- Fluxos criados no app aparecem no site.
- Fluxos criados no site aparecem no app.

### Fase 5 — ADMIN

- Resumo e usuários.
- Pré-cadastros e conversão.
- Financeiro completo por unidade.
- Agenda completa.
- Contratos, manutenção e configurações operacionais.
- Candy XP e administração permitida da Catty.
- Supervisão teacher/student.

### Checkpoint

- Ações destrutivas exigem confirmação.
- Financeiro e agenda passam em testes de transação e idempotência.
- Nenhum endpoint administrativo aceita role do cliente.

### Fase 6 — Sincronização, notificações e resiliência

- Cursor de mudanças.
- Revalidação foreground/reconnect.
- Push tokens, envio e remoção de tokens inválidos.
- Conflitos de rascunho e retry de upload.
- Limpeza de cache e temporários.

### Checkpoint

- Sincronização em até 15 segundos com ambos os clientes abertos.
- Funcionamento comprovado após perda e retorno de conexão.
- Payloads de push não contêm dados sensíveis.

### Fase 7 — Qualidade e distribuição

- Testes completos por role.
- Auditoria de segurança e dependências.
- Teste visual e acessibilidade em tamanhos representativos.
- Build preview Android e iOS.
- Teste interno.
- Preparação de loja, privacidade e publicação após aprovação.

## Riscos e mitigação

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Duplicar regras entre site e API | Alto | Extrair serviços de domínio antes de cada endpoint |
| Escopo administrativo muito grande | Alto | Fatias por módulo com checkpoints e commits atômicos |
| IDOR/vazamento entre alunos | Crítico | Testes de ownership antes da implementação |
| Sessão móvel roubada | Crítico | Refresh hash, rotação, SecureStore e revogação |
| App antigo após mudança da API | Alto | `/v1`, contratos e mudanças aditivas |
| Conflito offline | Médio | Versão do registro e confirmação explícita |
| Upload pesado | Médio | Limite, retry idempotente e limpeza de temporários |
| Regressão no site | Alto | Build e smokes do site a cada fatia backend |
| Dependência comprometida | Alto | Instalação sem scripts, revisão e audit do lockfile |
| Publicação sem contas | Médio | Preview interno primeiro; lojas são checkpoint separado |

## Ordem obrigatória

1. Especificação.
2. Contratos.
3. Sessão móvel.
4. Primeira fatia STUDENT.
5. Demais módulos STUDENT.
6. TEACHER.
7. ADMIN.
8. Sincronização avançada.
9. Distribuição.

Não iniciar telas administrativas antes de autenticação, autorização e contrato
estarem comprovados.
