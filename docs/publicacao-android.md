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
abaixo explicitamente pendentes. O primeiro APK interno foi gerado na
continuação; nenhum AAB foi gerado nem versão enviada à loja.

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
  manifesto Android; iOS não declara uso do microfone. A inspeção simples do
  APK abaixo acrescenta evidências, mas não substitui análise com aapt e teste
  em aparelho.
- `check:release --online` aprovado: health/privacidade públicos e sessão/
  financeiro sem token rejeitados. `--require-linked` bloqueou o build antes
  do vínculo e passou depois da confirmação do projeto EAS real.
- Backend corrigido e publicado no Oracle em `03abe15`, sem migration: conflitos
  financeiros em ambos os sentidos, versão após salvar no site e resumo de
  gastos sem truncar o total. Build local/Docker e smokes de servidor, auth,
  avatar e auth móvel aprovados; serviço saudável.

O financeiro foi verificado com fixtures e testes de regressão, não com
alterações de pagamentos reais. A revisão confirmou o uso das mesmas tabelas
do site. Teste físico autenticado do app e paridade completa das telas não foram
comprovados nesta preparação; o backlog funcional continua em `tasks/todo.md`.

### Bloqueios e próximas etapas

Na retomada de 19/10/2026, o acesso pelo Chrome foi confirmado em ambos os
serviços. O impedimento anterior do controle do navegador foi superado pela
integração de navegador disponível; não houve extração de cookies ou tokens.

- **Google Play:** rascunho `Candy English` criado na conta pessoal existente,
  em português do Brasil, como aplicativo gratuito, com o identificador
  `br.com.candyenglish.app`. O Console confirmou a disponibilidade do pacote.
  O responsável autorizou explicitamente o aceite dos termos e declarações
  necessários à criação. O endereço público de privacidade foi salvo no
  rascunho, sem enviar uma versão para revisão ou publicar o app.
  As descrições curta e completa de `ficha-google-play.md` também foram salvas
  como rascunho, e a categoria foi definida como Educação; imagens e
  screenshots ainda estão pendentes.
- **Expo:** projeto dedicado criado na conta autenticada, separado de outros
  aplicativos: [Candy English no Expo](https://expo.dev/accounts/willmils-team/projects/candy-english-app).
  O identificador real exibido pela criação é
  `7a6b08a9-bcdd-474f-bbd7-d182e648b3d0`. Isso não é uma credencial.
  Na continuação, o responsável autorizou explicitamente o botão `Approve`
  para conectar o EAS CLI à conta e organizações neste computador. O fluxo
  oficial de login no navegador terminou com `Authentication successful` e
  o CLI confirmou `Logged in`, sem copiar códigos de autenticação da página.
  `eas init --id` confirmou o vínculo e gravou somente o projeto e o owner
  `willmils-team` no app config. As permissões de áudio continuam sob controle
  do plugin existente, sem duplicá-las manualmente no manifest do aplicativo.
  `check:release --require-linked --online` passou após o vínculo.
- **Teste obrigatório confirmado no painel:** pelo menos 12 participantes
  inscritos continuamente por 14 dias no teste fechado antes de solicitar
  acesso à produção. Teste interno e APK não substituem esse requisito.

Pendências atuais:

1. A autenticação CLI, o vínculo e o primeiro APK foram concluídos. Falta
   instalar e validar em Android físico; build não comprova funcionamento de
   todos os fluxos no aparelho.
2. A chave de assinatura Android foi criada e armazenada no EAS; não foi
   baixada nem versionada. Não foi criada conta de serviço ou cobrança. Faltam
   revisar as declarações e dados da ficha. O link da
   política foi cadastrado, mas o texto ainda deve ser revisado especificamente
   para armazenamento e integrações da versão móvel final.
3. Depois do APK: testar os perfis em aparelho físico, conferir
   identidade/assinatura, público etário, Data safety e contas demonstrativas
   antes de enviar o AAB para teste interno. Reavaliar também as pendências de
   dependências descritas no documento próprio antes da distribuição pública.

### Primeiro build remoto

- Preview Android: `86057d51-2994-412d-bbb2-ce738b09ffd8`, iniciado em
  19/10/2026, com o commit `5c6ae33` e `versionCode=1`.
- [Acompanhar o build no Expo](https://expo.dev/accounts/willmils-team/projects/candy-english-app/builds/86057d51-2994-412d-bbb2-ce738b09ffd8).
- **Concluído:** a API oficial confirmou `FINISHED` em 19/10/2026 às 22:53
  (`2026-10-20T01:53:28.267Z`). A chave no EAS, o upload de 1,1 MB, o
  fingerprint e o build Android foram concluídos, sem criar builds duplicados.
- O acompanhamento animado do terminal foi encerrado depois de enfileirar o
  build, para evitar redesenho excessivo de logs. O `KeyboardInterrupt` local
  não cancelou o job: consultas oficiais posteriores confirmaram execução e
  conclusão no servidor.
- APK `0.1.0`, código 1, entregue ao responsável por link e cópia local fora
  do repositório. Download HTTP 200; tamanho **110.385.240 bytes**.
- SHA-256: `0f01ecf6f8d3b29bb085a0e456bb49937e04895971b4e0fc6cd99eb2d6cd6679`.
- Checagens locais: integridade ZIP/CRC aprovada; manifest, DEX e recursos
  presentes; identidade `br.com.candyenglish.app` encontrada; bundle contém o
  backend oficial e não contém o endereço local de desenvolvimento. Nenhum
  arquivo `.env` foi encontrado no APK.
- As strings de permissão CAMERA e RECORD_AUDIO não aparecem no manifesto
  binário inspecionado em UTF-8/UTF-16. É uma checagem limitada de strings, não
  uma análise completa com aapt, verificação criptográfica da assinatura ou
  teste físico. Não afirmar que o app foi aberto no celular.
- Não repetir o build por demora ou ausência de URL no terminal. Conferir
  primeiro `eas build:list --platform android --build-profile preview --limit
  10 --json --non-interactive`; a solicitação pode já existir no servidor.
- Não houve envio à Play Store. O objetivo inicial é um APK interno para
  validação em Android físico, sem alterar pagamentos reais durante os testes.

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
npx.cmd --yes eas-cli@25.2.0 init --id 7a6b08a9-bcdd-474f-bbd7-d182e648b3d0
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

## Continuação — 23/10/2026

O responsável autorizou testar o APK em Android simulado e avançar na
publicação, sem contratar serviços pagos. Também autorizou explicitamente os
termos adicionais do GitHub Actions e a licença do Android SDK. Informou que
a escola atende todas as idades, incluindo menores de 13 anos, e autorizou o
e-mail público da Candy como suporte. A página pública `/contato` confirma
`candyenglishbr@gmail.com`; não usar o e-mail de login de um administrador como
contato público por suposição.

### Simulação isolada

O workflow `.github/workflows/android-preview-smoke.yml` usa um runner
**standard** Ubuntu no repositório público, sem plano pago, secrets, login ou
dados reais. Executa manualmente ou quando o próprio workflow muda em `main`.
Baixa somente o APK preview identificado acima, exige seu SHA-256 e verifica
assinatura/pacote com as ferramentas oficiais Android. Um emulador descartável
Android 35/x86_64 instala o binário e procura as marcas da tela nativa de login.

A evidência inclui screenshot anônimo, hierarquia da tela, assinatura,
manifesto, estado final e buffer de crash. O buffer global é preservado, mas a
checagem de crash é filtrada pelo PID do Candy para não atribuir falhas de
outros processos ao app. A captura fica disponível por apenas três dias no
Actions; preservar resultados necessários fora do temporário antes de encerrar.
Não enviar credenciais, logs autenticados ou dados de alunos a esse workflow.

Validação local: TypeScript e lint passaram. A primeira execução da suíte teve
dois testes de homework reprovados; a suíte afetada passou isoladamente (4/4)
e a repetição completa passou com **38 suítes e 117 testes**, sem mudar código,
timeouts ou desativar testes. Isso indica instabilidade na execução inicial,
não comprova por si só sua causa. Os blocos Bash do workflow passaram em
`bash -n`; a revisão também corrigiu o filtro de crash descrito acima.

Esse teste não comprova login autenticado, módulos financeiros ou comportamento
no S23 Ultra. Os testes de componentes usam fixtures; não criar pagamentos
reais para validação. O PC local não tinha SDK/Java/emulador configurados, e o
espaço disponível em C: era insuficiente para uma instalação confortável. Não
foram alterados recursos de virtualização do Windows nem proteções do celular.

**Resultado comprovado:** [run 39981826088](https://github.com/WilliYY/Candy-English-App/actions/runs/39981826088)
concluiu com `success` no commit `3e837b7`. Instalou o APK original, abriu a
apresentação, localizou o botão de entrada pela árvore de acessibilidade e
chegou ao formulário nativo de login. O processo estava ativo e o buffer de
crash filtrado estava vazio. `apksigner verify` confirmou a assinatura V2.
Nenhuma conta ou senha foi usada e nenhum pagamento foi criado ou alterado.

Os ensaios anteriores detectaram duas falhas do ambiente do runner: biblioteca
`libpulse.so.0` ausente e divergência entre os diretórios de AVD das ferramentas.
Foram corrigidas apenas no workflow. A primeira abertura funcional também
mostrou que o app inicia pela apresentação, não pelo login; o teste foi ajustado
para percorrer esse fluxo real, sem mudar o aplicativo nem relaxar a verificação
do formulário. Screenshots anônimos de abertura/login e evidências foram
preservados fora do Git, em `Documents/Codex/outputs/candy-publicacao/`.

### Google Play e AAB

- Painel consultado novamente em 23/10: app ainda não publicado; configuração
  com 1 de 11 tarefas concluídas; **zero testadores** no teste fechado.
- O acesso público continua bloqueado até o teste fechado com **12 pessoas
  inscritas por 14 dias contínuos** e posterior aprovação. Emulador, testes
  internos e relatórios automáticos não substituem participantes reais.
- Rascunho inicial de teste interno criado, com nome e notas de versão salvos.
  Não confundir rascunho com envio do AAB ou distribuição liberada.
- Primeiro AAB solicitado no EAS: build
  `356f05be-b13c-4f22-ada9-88c08a133ece`, versão `0.1.0`, código `2`, perfil
  `production`, commit-fonte `6dd16ce`. Enfileirado em
  `2026-10-23T15:18:12.896Z`. A confirmação inicial `NEW` não comprova conclusão;
  consultar o build antes de repetir ou fazer upload.
- O AAB concluiu com **`FINISHED`** em `2026-10-23T16:02:10.125Z`
  (13:02 em São Paulo). A versão `0.1.0`, código `2`, distribuição `STORE`
  e commit-fonte `6dd16ce` foram conferidos pela consulta oficial do EAS.
  Não repetir esse build. O arquivo foi preservado fora do Git como
  `Documents/Codex/outputs/candy-publicacao/Candy-English-0.1.0-production-356f05be.aab`.
  Possui 76.939.922 bytes; SHA-256
  `0e06e47105c39148e4aae8b3e0eab516624b832c146ae15f45a132534f4a4446`.
  A verificação CRC das 1.766 entradas ZIP passou; manifesto, configuração do
  bundle, DEX e arquivos de assinatura estão presentes. Isso comprova a
  integridade estrutural, não substitui a validação da assinatura nem o teste
  do AAB pelo Google Play. A simulação aprovada acima utilizou o APK de preview.
- O contato público `candyenglishbr@gmail.com` e o site HTTPS foram salvos e
  conferidos na ficha do Google Play. A criação da lista interna restrita ao
  responsável ainda não foi concluída; não foram adicionados alunos nem
  enviados convites.
- O upload pelo Chrome encontrou a necessidade de permitir URLs de arquivo
  na extensão ChatGPT. O responsável autorizou explicitamente essa permissão,
  mas a política da ferramenta bloqueia o acesso a `chrome://extensions`.
  Foi solicitado que ele ative a opção manualmente no perfil Willian. Não
  contornar esse bloqueio por comandos, alteração de perfil ou outra superfície.
  Retomar o upload pelo navegador somente depois da confirmação manual.
- Também foi tentada a alternativa oficial `eas-cli@25.2.0 submit --platform
  android --profile production --id 356f05be-b13c-4f22-ada9-88c08a133ece
  --non-interactive --no-wait`, com destino `internal` e status `draft` já
  definidos em `eas.json`. O comando terminou com código `1`: `Google Service
  Account Keys cannot be set up in --non-interactive mode.` Não houve envio
  confirmado nem chave criada. O responsável autorizou explicitamente criar
  a integração Google Play–Expo restrita ao Candy e guardar a chave no Expo.
- Na conta `willian13258@gmail.com`, foi criado o projeto isolado
  **Candy English Play**, ID `candy-english-play`, sem reutilizar os projetos
  existentes. A aba retornou o título desse projeto e a URL de contas de
  serviço com esse ID. Em seguida, o controle do Chrome ficou indisponível
  (`Debugger unattached` e `Tabs can only be moved between windows in the same
  profile`). Uma retomada pela mesma conexão não resolveu. A aba foi preservada
  para continuação. Não foram confirmadas conta de serviço, chave, ativação
  da API, permissões no Play nem configuração no Expo. O `gcloud` também não
  estava instalado nos locais usuais; não foram extraídas credenciais do
  navegador. Retomar essa configuração no projeto já criado quando a conexão
  estiver operacional, sem repetir a criação nem alterar o acesso a outros
  apps. Manter o rascunho e não declarar teste interno liberado ou publicação.
- A ficha para público infantil exige revisar as políticas Families,
  privacidade, SDKs e tratamento de dados antes da submissão pública. A
  autorização para "todas as idades" não elimina essas exigências.

### Revisão mínima antes de disponibilizar para crianças

A consulta delimitada dos fluxos nativos de Catty e chat não localizou denúncia
de resposta de IA, denúncia/bloqueio de usuário no chat 1:1 nem uma verificação
de idade/consentimento do responsável específica desses módulos. Isso não prova
inexistência em todos os caminhos, mas impede declarar conformidade sem revisar
e validar esses controles. O site possui feedback de respostas da Catty; não
presumir que esse mecanismo exista no app ou que cubra toda denúncia sensível.

As políticas oficiais exigem canal de denúncia dentro do app para IA e UGC;
o Google cita expressamente apps de escolas e requisitos adicionais para
interações infantis. Antes da produção, conferir também os termos aplicáveis
ao provedor de IA e os dados que podem ser processados para menores. Não
declarar público adulto para contornar essas exigências nem enviar contas reais
de alunos a revisores. Teste interno deve permanecer restrito a adultos com
dados de demonstração até a revisão. Nenhum desses módulos foi alterado nesta
continuação.

- [Políticas Families](https://support.google.com/googleplay/android-developer/answer/9893335)
- [Conteúdo gerado por usuários](https://support.google.com/googleplay/android-developer/answer/9876937)
- [Conteúdo gerado por IA](https://support.google.com/googleplay/android-developer/answer/13985936)
- [Público-alvo](https://support.google.com/googleplay/android-developer/answer/9867159)

### Fontes desta continuação

- [Runners GitHub e preços](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [KVM em runners Linux](https://github.blog/changelog/2024-04-02-github-actions-hardware-accelerated-android-virtualization-now-available/)
- [Emulador Android por linha de comando](https://developer.android.com/studio/run/emulator-commandline)
- [Teste fechado para contas pessoais](https://support.google.com/googleplay/android-developer/answer/14151465)
- [Relatório automático pré-lançamento](https://support.google.com/googleplay/android-developer/answer/9842757)

## Fontes oficiais da preparação inicial

- [Configuração dos perfis EAS](https://docs.expo.dev/eas/json/)
- [Ambientes e variáveis públicas](https://docs.expo.dev/eas/environment-variables/)
- [Variáveis Expo e EXPO_NO_DOTENV](https://docs.expo.dev/guides/environment-variables/)
- [Primeira submissão Android](https://docs.expo.dev/submit/android/#first-time-submission)
- [Permissões de áudio](https://docs.expo.dev/versions/v57.0.0/sdk/audio/#configurable-properties)
