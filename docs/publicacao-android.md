# Preparação para publicação Android

## Objetivo e limites

Preparar o Candy English para testes e posterior publicação na Google Play,
usando o mesmo backend HTTPS, contas e banco do site. O financeiro deve ler e
alterar os mesmos registros, preservando permissões, histórico e controle de
conflitos. Esta tarefa não cria outro banco nem pagamentos online.

## Plano de execução — 19/10/2026

1. **Conferir a integração e o backend móvel.** Revisar sessões, permissões e
   operações financeiras; corrigir somente problemas comprovados e relevantes
   para a publicação. Validar com testes direcionados e consultas sem escrita
   aos endpoints públicos de produção.
2. **Preparar configuração de distribuição.** Manter o servidor local para
   desenvolvimento, definir HTTPS oficial nos perfis preview/produção e
   distinguir APK para aparelhos de teste do AAB da loja. Verificar configuração,
   tipos, lint, testes e exportação Android antes de iniciar build remoto.
3. **Conferir acessos de publicação.** Confirmar autenticação Expo/EAS e acesso
   à Play Console sem imprimir segredos. Vincular somente contas comprovadas.
   Não inventar identificadores de projeto, chaves, contas ou declarações legais.
4. **Preparar a ficha e a sequência de lançamento.** Registrar requisitos de
   privacidade, classificação, público, acesso do revisor, testes e assinatura.
   Gerar preview quando os acessos permitirem; validar em Android físico antes
   da primeira versão pública.
5. **Entregar evidências e bloqueios.** Registrar comandos, resultados,
   alterações e pendências. Commit/push das mudanças desta tarefa; preservar
   alterações locais anteriores. Publicação depende dos acessos reais e das
   etapas da loja, não apenas de ter uma conta Gmail.

## Estado inicial verificado

- O aplicativo é Expo/React Native e possui cliente de `/api/mobile/v1`.
- O backend público respondeu `200` em `/api/health` e `401` nos endpoints
  protegidos de sessão e financeiro administrativo, sem fornecer dados.
- O financeiro nativo consulta periodicamente a API, enquanto a tela está ativa.
- A configuração local usa um endereço de desenvolvimento; não deve ser
  incorporada ao build de distribuição.
- O identificador Android local já é `br.com.candyenglish.app`; confirmar sua
  disponibilidade na Play Console antes da primeira publicação.
- Existem alterações anteriores em `.gitignore`, `app.json`, `expo-env.d.ts`
  e um `eas.json` ainda não versionado. Preservá-las durante a preparação.
- Nenhum APK/AAB foi localizado. O projeto ainda não possui `extra.eas.projectId`.
- Autenticação, build remoto e acesso à conta desenvolvedora ainda precisam
  de verificação; nenhum sucesso é presumido por arquivos locais existentes.

## Evidências finais

Preparação técnica concluída em 19/10/2026, com os bloqueios de publicação
abaixo explicitamente pendentes. Nenhum APK/AAB foi gerado ou enviado à loja.

- Instalação limpa com peers estritos aprovada; dependências diretas alinhadas
  ao Expo SDK 57 e patches transitivos compatíveis instalados.
- `expo install --check`: dependências atualizadas. Expo Doctor: **20/20**.
- TypeScript e ESLint aprovados. O lint ignora `.expo` e `output`, gerados,
  sem editar arquivos gerenciados nem suprimir a análise do código-fonte.
- Suíte final: **38 suítes e 117 testes aprovados**, incluindo o aviso de recorte
  dos gastos. As primeiras execuções frias sob carga atingiram limites de tempo;
  a execução final sem build paralelo passou, sem aumentar timeouts dos testes.
- Exportação Android de produção aprovada após os patches finais, com 1581
  módulos. O bundle contém `https://candyenglish.com.br` e não contém o endereço
  local antigo. Exportar JavaScript/bytecode **não gera um APK/AAB assinado**.
- Introspecção nativa: câmera e gravação de áudio têm `tools:node=remove` no
  manifesto Android; iOS não declara uso do microfone. Confirmar novamente no
  binário final, que ainda depende do EAS/assinatura.
- `check:release --online` aprovado: health/privacidade públicos e sessão/
  financeiro sem token rejeitados. `--require-linked` bloqueia corretamente
  o build enquanto não houver um projeto EAS real vinculado.
- Backend corrigido e publicado no Oracle em `03abe15`, sem migration: conflitos
  financeiros em ambos os sentidos, versão após salvar no site e resumo de
  gastos sem truncar o total. Build local/Docker e smokes de servidor, auth,
  avatar e auth móvel aprovados; serviço saudável.

O financeiro foi verificado com fixtures e testes de regressão, não com
alterações de pagamentos reais. A revisão confirmou o uso das mesmas tabelas
do site. Teste físico autenticado do app e paridade completa das telas não foram
comprovados nesta preparação; o backlog funcional continua em `tasks/todo.md`.

### Bloqueios e próximas etapas

1. Expo/EAS retornou `Not logged in`. É necessário autenticar a conta correta,
   conferir projetos existentes e vincular o app antes de gerar o preview.
2. O acesso à Play Console não foi confirmado: o controle do navegador encerrou
   a inspeção por não identificar a URL atual com segurança. Não foi criado
   cadastro de desenvolvedor, conta de serviço, chave ou cobrança.
3. Após os acessos: gerar APK, testar os perfis em aparelho físico, conferir
   identidade/assinatura, público etário, Data safety e contas demonstrativas
   antes de enviar o AAB para teste interno. Reavaliar também as pendências de
   dependências descritas no documento próprio antes da distribuição pública.

### Arquivos e comandos

- Distribuição: `app.json`, `eas.json`, `package.json`, `package-lock.json`,
  `.gitignore`, `eslint.config.js`, `scripts/release-readiness.mjs`.
- Interface: `src/components/privacy-link.tsx`, telas de login/painel,
  `src/features/admin-finance/admin-finance-activity-screen.tsx` e seu teste.
- Documentação: `README.md`, `docs/distribuicao.md`, este documento,
  `docs/ficha-google-play.md` e `docs/dependencias-publicacao.md`.
- Validações: `npm.cmd test -- --watch=false`, `npm.cmd run typecheck`,
  `npm.cmd run lint`, `npm.cmd run doctor`, `expo install --check`,
  `expo config --type introspect`, `expo export --platform android`,
  `npm.cmd run check:release -- --online`, `eas-cli@25.2.0 whoami`.
- O export de validação e os auxiliares ficaram no temporário da tarefa, sem
  versionar bundles, imagens, cache, credenciais ou dados de alunos. As mudanças
  anteriores geradas em `expo-env.d.ts` e no bloco Expo do `.gitignore` foram
  preservadas separadamente.

## Configuração preparada

- `preview`: APK interno, ambiente EAS `preview`, backend oficial HTTPS.
- `production`: AAB de loja, ambiente EAS `production`, incremento remoto da
  versão Android. Ambos desativam dotenv e não embutem o servidor local.
- `submit.production`: rascunho no teste interno. O perfil de build chamado
  production não significa lançamento público automático.
- O build deve começar pelos scripts `build:android:preview` ou
  `build:android:production`; a checagem anterior exige um projectId EAS real.
  O projectId e o vínculo com a conta devem vir de `eas init`, não de exemplos.
- Microfone e câmera estão bloqueados no Android; o plugin de áudio não pede
  acesso ao microfone no iOS. O código atual seleciona uma imagem da galeria e
  reproduz listening; não implementa captura por câmera nem gravação de áudio.
  Reprodução em segundo plano conserva a configuração anterior.
- A política de privacidade pode ser aberta no login e no painel de todos os
  perfis. Sua presença não substitui revisar Data safety e o texto para o app.
- O conteúdo proposto para a loja está em [`ficha-google-play.md`](ficha-google-play.md),
  com os campos que dependem da identidade e do público real da escola.
- SDK e transitivas receberam atualizações compatíveis; os alertas restantes e
  limites para lançamento público estão em
  [`dependencias-publicacao.md`](dependencias-publicacao.md). A auditoria não
  ficou zerada, e não foram forçadas versões incompatíveis para ocultar avisos.

## Comandos após autenticar a conta

```powershell
npx.cmd --yes eas-cli@25.2.0 login
npx.cmd --yes eas-cli@25.2.0 init
npm.cmd run check:release -- --online
npm.cmd run build:android:preview
```

Depois de aprovar o APK em aparelho físico e preparar a Play Console:

```powershell
npm.cmd run build:android:production
npm.cmd run submit:android
```

O primeiro envio depende do app criado no Console, assinatura e credenciais
adequadas. A documentação Expo atual permite o primeiro upload com EAS Submit;
upload manual também é possível. Nunca colocar uma chave de service account,
keystore ou senha no Git. O rascunho interno deve ser revisado antes de liberar
para testadores. Conta pessoal nova pode exigir teste fechado adicional antes
da solicitação de produção; teste interno não substitui essa exigência.

## Fontes oficiais

- [Configuração dos perfis EAS](https://docs.expo.dev/eas/json/)
- [Ambientes e variáveis públicas](https://docs.expo.dev/eas/environment-variables/)
- [Variáveis Expo e EXPO_NO_DOTENV](https://docs.expo.dev/guides/environment-variables/)
- [Primeira submissão Android](https://docs.expo.dev/submit/android/#first-time-submission)
- [Permissões de áudio](https://docs.expo.dev/versions/v57.0.0/sdk/audio/#configurable-properties)
