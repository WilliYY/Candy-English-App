# Distribuição do Candy English

Este guia descreve como o site, o aplicativo e o backend trabalham juntos e
como disponibilizar o aplicativo para outras pessoas.

## Como site e aplicativo se comunicam

O site e o aplicativo usam o mesmo backend, banco PostgreSQL, contas e regras de
permissão. O backend é a fonte única dos dados.

- Alterações de dados, como uma aula publicada, homework, mensagem, contrato,
  perfil ou Candy XP, aparecem nos dois clientes assim que eles consultam ou
  atualizam a API.
- Uma mudança apenas na aparência ou no código da tela do site não altera
  automaticamente a tela nativa do aplicativo. Essa mudança precisa ser
  implementada e testada nos dois frontends.
- Por orientação do responsável, toda alteração de tela ou funcionalidade no
  site deve incluir a verificação e o ajuste do correspondente no aplicativo;
  não considerar a entrega completa após alterar apenas um dos clientes.
- Mudanças no backend devem manter os contratos da API compatíveis com versões
  do aplicativo que ainda estejam instaladas.
- Cada pessoa entra com sua própria conta. O backend libera somente os recursos
  do seu papel: `STUDENT`, `TEACHER` ou `ADMIN`.

## Estado atual

Preparação de publicação em 19/10/2026: os perfis `preview` e `production` de
`eas.json` apontam explicitamente para `https://candyenglish.com.br` e desativam
o carregamento do `.env` local no build. O primeiro gera APK interno; o segundo,
AAB da loja. `npm.cmd run check:release -- --online` confere a configuração e os
endpoints públicos sem autenticar nem alterar dados. O modo
`npm.cmd run check:release:linked` também exige um projeto EAS vinculado.
Isso não substitui login, assinatura, teste em aparelho e aprovação da loja.
O estado detalhado está em [`publicacao-android.md`](publicacao-android.md).

O código-fonte e os bundles Android, iOS e web são validados durante o
desenvolvimento. O primeiro **APK interno Android 0.1.0** foi gerado pelo EAS
em 19/10/2026, build `86057d51-2994-412d-bbb2-ce738b09ffd8`, código 1, e
entregue ao responsável. Integridade do arquivo e backend oficial foram
conferidos; instalação e fluxos em aparelho físico continuam pendentes.
O app ainda não foi publicado na Play Store. Não há AAB ou IPA de distribuição.

Estado antes de compartilhar com testadores ou enviar à loja:

- [x] Backend HTTPS oficial e `EXPO_PUBLIC_API_URL` nos perfis de build.
- [x] Identificador Android `br.com.candyenglish.app` e rascunho na Play Console.
- [x] Login EAS e vínculo com o projeto dedicado, sem copiar tokens da página.
- [x] Primeiro APK interno gerado, baixado e conferido, sem versionar o binário.
- [ ] Validar login, permissões e fluxos disponíveis em Android físico.
- [ ] Revisar política, Data safety, público, classificação e acesso do revisor;
  completar imagens e contatos da ficha da loja.
- [ ] Gerar AAB após aprovar o preview e executar testes exigidos pela Google.
- [ ] Para iOS, definir bundleIdentifier e preparar a conta Apple Developer;
  essa distribuição ainda não foi iniciada.

Os identificadores do aplicativo devem ser escolhidos antes da primeira
publicação, pois trocá-los depois cria outro aplicativo para as lojas e para os
celulares.

## Primeiro preview para testes

Após definir os identificadores e as contas:

```powershell
npm.cmd ci
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest init
npx.cmd eas-cli@latest build:configure
```

O perfil `preview` do `eas.json` deverá usar `"distribution": "internal"`.
Então os builds poderão ser criados:

```powershell
npx.cmd eas-cli@latest build --platform android --profile preview
npx.cmd eas-cli@latest build --platform ios --profile preview
```

No Android, o preview interno gera um APK instalável e um link compartilhável.
O usuário abre o link no celular, baixa o APK e autoriza a instalação. Esse
canal é apenas para pessoas de confiança, antes da Play Store.

No iPhone, a distribuição ad hoc exige registrar previamente cada aparelho.
Para um grupo maior, o caminho recomendado é enviar o build para o TestFlight e
convidar os testadores pelo e-mail ou link público.

Também é possível usar o teste interno da Google Play. Ele distribui o
aplicativo por um link da loja e evita a instalação manual de APK.

## Publicação nas lojas

Depois que os previews passarem pelos smokes de aluno, professora e
administração:

```powershell
npx.cmd eas-cli@latest build --platform android --profile production
npx.cmd eas-cli@latest build --platform ios --profile production
npx.cmd eas-cli@latest submit --platform android
npx.cmd eas-cli@latest submit --platform ios
```

- Android: o build de produção é um AAB enviado à Google Play. Após a aprovação,
  qualquer pessoa autorizada no país configurado poderá encontrar ou abrir o
  link do aplicativo e tocar em **Instalar**.
- iPhone: o build é enviado ao App Store Connect. Primeiro pode ser liberado no
  TestFlight; após a revisão da Apple, ficará disponível na App Store.

O envio do arquivo não publica automaticamente a ficha da loja. Preço,
classificação etária, privacidade, países, screenshots e versão precisam ser
revisados nas respectivas lojas.

## Como as atualizações chegam

| Tipo de mudança | Como chega ao usuário |
| --- | --- |
| Aula, aviso, mensagem, homework, contrato, perfil ou XP | Pelo backend compartilhado, sem reinstalar |
| Regra ou correção somente no servidor | Pelo backend, preservando compatibilidade da API |
| JavaScript, estilos e imagens compatíveis | Pode usar EAS Update depois que ele for configurado |
| Biblioteca nativa, permissão, plugin ou configuração nativa | Exige novo build e nova versão da loja |

O EAS Update só deve ser ativado depois de configurar `runtimeVersion`, canais
separados para `preview` e `production` e uma estratégia de rollback. Um update
de preview nunca deve ser enviado diretamente ao canal de produção.

Os avisos dentro do app já usam os dados compartilhados do backend. O push que
aparece fora do aplicativo será ativado somente depois de vincular o projeto
Expo/EAS, definir os identificadores finais e testar em aparelhos físicos. O
push enviará apenas um aviso mínimo; o conteúdo completo continuará sendo
buscado pelo app autenticado.

## Checklist antes de compartilhar

- backend público HTTPS saudável e com backup;
- banco e migrations aplicados;
- `EXPO_PUBLIC_API_URL` apontando para produção;
- login, logout e revogação de sessão testados;
- permissões de `STUDENT`, `TEACHER` e `ADMIN` testadas separadamente;
- nenhum segredo, token ou `.env` dentro do build ou do Git;
- download, envio, câmera/fotos, áudio e arquivos testados em aparelho físico;
- política de privacidade e canal de suporte publicados;
- preview aprovado antes do build de produção;
- monitoramento do backend e procedimento de rollback disponíveis.

## Referências oficiais

- [Configurar EAS Build](https://docs.expo.dev/build/setup/)
- [Distribuição interna com EAS Build](https://docs.expo.dev/build/internal-distribution/)
- [Enviar builds às lojas com EAS Submit](https://docs.expo.dev/submit/introduction/)
- [Configurar EAS Update](https://docs.expo.dev/eas-update/getting-started/)
- [Testes na Google Play](https://support.google.com/googleplay/android-developer/answer/9845334?hl=pt-BR)
- [TestFlight](https://developer.apple.com/testflight/)
