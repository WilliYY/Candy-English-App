# Especificação: Candy English Mobile

## Status

Aprovada pelo usuário em 2026-07-30.

## Objetivo

Criar um aplicativo nativo único para Android e iOS que use as mesmas contas,
regras, arquivos e dados do Candy English atual. O site e o aplicativo serão
dois clientes do mesmo sistema, com o PostgreSQL existente como fonte única.

O aplicativo atenderá:

- `STUDENT`: rotina pedagógica completa.
- `TEACHER`: rotina pedagógica, alunos vinculados e Secretaria limitada.
- `ADMIN`: AVA e Secretaria administrativa.

## Premissas aprovadas

1. O aplicativo será React Native com Expo e TypeScript, sem WebView como
   implementação das telas.
2. O backend continuará no projeto Next.js atual.
3. O banco continuará sendo o PostgreSQL atual, acessado somente pelo backend
   via Prisma.
4. O login móvel aceitará as mesmas credenciais do site, mas usará sessões
   móveis próprias, revogáveis e vinculadas a `User.sessionVersion`.
5. Financeiro continuará sendo controle interno; esta fase não criará cobrança
   nem pagamento online.
6. O cofre `APIs e senhas` continuará exclusivo do site. Segredos de
   infraestrutura não serão enviados para celulares.
7. Todas as demais áreas atuais de `STUDENT`, `TEACHER` e `ADMIN` fazem parte
   do escopo final, entregues em incrementos verificáveis.
8. Recursos ainda desativados no site, como aula ao vivo em manutenção,
   continuarão respeitando o mesmo estado no aplicativo.

## Experiência por perfil

### STUDENT

- Login, saída e gerenciamento da sessão do aparelho.
- Resumo com próximas ações, progresso e avisos.
- Aulas e materiais protegidos.
- Homework simples legado e homework interativo, incluindo rascunho,
  envio, atualização de versão e feedback.
- Atividades e ranking interno Candy XP permitidos.
- Mensagens com teacher vinculada.
- Contratos protegidos.
- Perfil e avatar.
- Aula ao vivo quando habilitada.
- Catty autenticada com o mesmo escopo seguro do site.
- Notificações de aula, mensagem, tarefa, correção e conquista.

### TEACHER

- Resumo operacional.
- Alunos vinculados e dados permitidos.
- Aulas, materiais e atividades interativas.
- Criação, duplicação e gestão de homework.
- Fila de submissões e feedback.
- Mensagens com alunos vinculados.
- Contratos permitidos.
- Pré-cadastros próprios ou atribuídos e conversão autorizada.
- Candy XP dentro das permissões atuais.
- Catty Learning e artefatos dos alunos dentro das permissões atuais.
- Acesso à Secretaria limitada, sem financeiro geral, agenda completa,
  credenciais ou administração.

### ADMIN

- Resumo operacional.
- Usuários, ativação, desativação, edição permitida e redefinição de senha.
- Supervisão das áreas teacher e student.
- Pré-cadastros, revisão e conversão transacional.
- Financeiro por unidade, alunos, pagamentos, parcelas, gastos e logs.
- Agenda, recorrências, presença, reposição e histórico.
- Contratos.
- Configuração de manutenção e opções operacionais seguras.
- Candy XP: atividades, liberações, correções e indicadores.
- Administração da Catty permitida pelo sistema atual.
- Relatórios operacionais existentes.
- Sem acesso móvel ao cofre `APIs e senhas`.

## Arquitetura

```text
apps móveis Expo
      |
      | HTTPS + JSON + access token
      v
/api/mobile/v1 no Next.js atual
      |
      | serviços de domínio compartilhados
      v
Prisma 7 -> PostgreSQL 17
      |
      +-> storage protegido
      +-> notificações Expo
```

### Separação de responsabilidades

- O app renderiza telas, mantém cache e envia intenções do usuário.
- A API autentica, autoriza, valida e executa regras de negócio.
- O app nunca escolhe a própria role nem decide se pode acessar um registro.
- O app nunca acessa PostgreSQL ou storage privado diretamente.
- Server actions existentes serão gradualmente extraídas para serviços de
  domínio reutilizáveis pelo site e pela API, sem duplicar regras.

## Contrato da API

Base: `/api/mobile/v1`.

Formato de sucesso:

```json
{
  "data": {},
  "meta": {
    "requestId": "req_..."
  }
}
```

Formato de erro:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Não foi possível salvar os dados.",
    "details": {}
  },
  "meta": {
    "requestId": "req_..."
  }
}
```

Regras:

- Entradas e saídas tipadas e validadas com Zod.
- Recursos de lista paginados.
- Datas em ISO 8601 UTC.
- Mudanças compatíveis e aditivas dentro de `v1`.
- `PATCH` para alterações parciais.
- Escritas sensíveis aceitam chave de idempotência.
- Nenhum erro retorna stack trace, SQL, caminho interno ou segredo.

## Autenticação móvel

### Fluxo

1. `POST /api/mobile/v1/auth/login` valida email e senha usando o mesmo usuário
   e a mesma política de bloqueio do site.
2. O servidor devolve access token curto e refresh token rotativo.
3. O access token fica somente em memória no app.
4. O refresh token fica no `expo-secure-store`.
5. O servidor guarda apenas o hash do refresh token.
6. Renovação invalida o refresh token anterior.
7. Logout, troca de senha, desativação ou mudança de `sessionVersion` revogam
   o acesso.

### Novos dados previstos

- `MobileSession`: usuário, hash do refresh token, expiração, revogação,
  versão da sessão, último uso e timestamps.
- `MobileDevice`: usuário, plataforma, push token protegido, estado ativo e
  timestamps. Não armazenará contatos, localização ou identificadores
  publicitários.

## Sincronização

- Toda escrita retorna o registro confirmado pelo servidor.
- O app invalida e recarrega apenas as consultas afetadas.
- Ao voltar ao primeiro plano ou recuperar internet, dados ativos são
  revalidados.
- Telas operacionais abertas consultam um cursor de mudanças para refletir
  alterações feitas no outro cliente.
- Notificações carregam apenas identificadores mínimos e fazem o app buscar o
  dado autorizado no servidor.
- Rascunhos locais usam versão do registro para detectar conflito.
- Conflitos nunca sobrescrevem silenciosamente uma versão mais nova.
- Operações destrutivas não usam atualização otimista.

Critério de sincronização: uma alteração confirmada deve aparecer no outro
cliente em até 15 segundos quando ambos estiverem abertos e conectados, ou na
próxima retomada/conexão quando um deles estiver inativo.

## Estado local e funcionamento offline

- TanStack Query manterá cache de servidor.
- Dados sensíveis persistidos serão mínimos.
- Logout apagará cache, refresh token e arquivos temporários.
- Conteúdo já aberto poderá ser relido sem conexão quando seguro.
- Rascunhos de respostas poderão ser preservados localmente.
- Ações administrativas e financeiras exigirão conexão.
- Upload interrompido poderá ser repetido sem duplicar o registro.

## Uploads e arquivos

- Document Picker para PDF e imagens.
- Limites de tamanho e tipos iguais ou mais restritos que os do site.
- Validação real no servidor; extensão do arquivo não será confiável.
- Download por rota protegida e temporária.
- Arquivos não serão publicados por URL direta.
- Temporários locais serão removidos após envio, logout ou cancelamento.

## Direção visual

- Reutilizar identidade, linguagem e mascote Candy já existentes.
- Interface nativa, móvel primeiro e adaptada a tablet.
- Navegação principal curta por role; módulos extensos usam pesquisa e seções.
- Uma ação principal clara por tela.
- Estados de carregamento, vazio, erro, offline e permissão em todas as telas.
- Contraste AA, alvos de toque de pelo menos 44x44 pontos, suporte a leitor de
  tela, fonte ampliada e redução de movimento.
- Sem gradientes genéricos, excesso de cards ou aparência de template.

## Ameaças e controles

| Ameaça | Controle obrigatório |
| --- | --- |
| Roubo de token | Access token curto, refresh rotativo com hash e SecureStore |
| Tentativa de mudar role no app | Role lida do servidor em todas as requisições |
| Acesso a dados de outro aluno | Autorização por dono/vínculo em cada recurso |
| Teacher acessando aluno não vinculado | Validação de `StudentTeacherAssignment` |
| Repetição de envio ou pagamento interno | Chave de idempotência e transação |
| Brute force de login | Mesma política de `LoginAttempt` e rate limit do site |
| Upload malicioso | Limite, allowlist de tipo, assinatura e armazenamento privado |
| Cache após logout | Limpeza atômica de tokens, cache e temporários |
| Notificação vazando dados | Payload mínimo sem conteúdo escolar ou financeiro |
| Sessão antiga após troca de senha | Verificação de `sessionVersion` |
| App antigo quebrado por API nova | `/v1`, mudanças aditivas e testes de contrato |
| Ação administrativa acidental | Confirmação explícita e sem otimista destrutivo |

## Stack

### Aplicativo

- Expo estável compatível com o ambiente no momento do scaffold.
- React Native e TypeScript.
- Expo Router.
- TanStack React Query.
- React Hook Form e Zod.
- `expo-secure-store`.
- `expo-notifications`.
- Jest Expo e React Native Testing Library.
- EAS Build e EAS Submit.

### Backend existente

- Next.js 15 App Router.
- React 19.
- TypeScript.
- Prisma 7.
- PostgreSQL 17.
- Auth.js/NextAuth v5 para o site.
- Zod.
- Docker e Docker Compose.

## Estrutura planejada do aplicativo

```text
src/app/                 rotas Expo Router
src/features/auth/       login e sessão
src/features/student/    módulos do aluno
src/features/teacher/    módulos da teacher
src/features/admin/      módulos administrativos
src/components/          componentes compartilhados
src/lib/api/             cliente HTTP e contratos
src/lib/query/           cache e sincronização
src/lib/storage/         SecureStore e temporários
src/theme/               tokens visuais
src/test/                utilidades de teste
assets/                  ícones, fontes e imagens
docs/                    arquitetura e decisões
tasks/                   plano e acompanhamento
```

## Comandos planejados

Aplicativo:

```powershell
npm.cmd run start
npm.cmd run android
npm.cmd run ios
npm.cmd run test
npm.cmd run typecheck
npm.cmd run lint
npx.cmd expo-doctor
npx.cmd eas build --platform android --profile preview
npx.cmd eas build --platform ios --profile preview
```

Backend:

```powershell
npm.cmd run prisma:validate
npm.cmd run test:mobile
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run audit:auth-smoke
```

## Estratégia de testes

- Testes unitários para contratos, autenticação, autorização, conflitos e
  transformação de dados.
- Testes de integração para login, refresh, logout e endpoints por role.
- Testes de componentes para carregamento, vazio, erro, offline e ações.
- Testes de contrato garantem que app e backend concordam.
- Smokes reais com contas de teste `STUDENT`, `TEACHER` e `ADMIN`.
- Validação em Android físico e preview iOS antes de produção.
- Fluxos críticos E2E: login, leitura, escrita, upload, logout e revogação.

## Limites

### Sempre

- Validar input na API.
- Autorizar por role e por dado.
- Escrever teste antes da nova lógica.
- Preservar compatibilidade do site.
- Atualizar documentação junto com mudanças.
- Manter mudanças pequenas, reversíveis e auditáveis.

### Exigem aprovação desta especificação

- Nova autenticação móvel.
- Novos modelos Prisma de sessão e dispositivo.
- Novas dependências do aplicativo.
- Push notifications.
- Uploads pelo aplicativo.

### Nunca

- Expor banco, senha, hash ou segredo no app.
- Colocar token em AsyncStorage ou log.
- Confiar em role ou ID enviados pelo cliente.
- Liberar `APIs e senhas` no celular.
- Criar pagamento online sem projeto e aprovação separados.
- Publicar ou migrar produção antes de validação proporcional.

## Critérios de sucesso

- Um usuário entra no app com a mesma conta do site.
- O app direciona corretamente `STUDENT`, `TEACHER` e `ADMIN`.
- Cada perfil acessa suas funções e nunca dados fora do escopo.
- Site e app usam o mesmo PostgreSQL sem duplicação.
- Alterações sincronizam conforme o critério de 15 segundos.
- Sessões móveis são renováveis, revogáveis e protegidas.
- Uploads e downloads mantêm as permissões atuais.
- Os fluxos críticos dos três perfis passam em testes automatizados e aparelho.
- Typecheck, lint, testes, build e auditorias de dependência passam.
- O app gera builds de preview Android e iOS.
- Documentação, migrations e contratos ficam versionados.

## Questões que podem ser decididas depois da fundação

- Nome público final nas lojas.
- Identificadores permanentes Android e iOS.
- Contas Google Play e Apple Developer.
- Texto da política de privacidade e classificação etária.
- Primeiro grupo de testers.
