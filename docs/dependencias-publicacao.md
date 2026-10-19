# Dependências e publicação — 19/10/2026

## Alterações verificadas

O Expo Doctor identificou 21 dependências diretas fora do conjunto recomendado
do SDK 57. Foram alinhadas às versões recomendadas, mantendo o SDK 57, React
19.2.3 e os mesmos recursos do aplicativo. React Native/preset passaram para
0.86.3, Expo para 57.0.30 e Jest Expo para 57.0.6.

O lock anterior causava ERESOLVE entre Jest Expo e o preset React Native. A
resolução foi feita isoladamente e validada com peers estritos, preservando
Reanimated 4.5.3 e Worklets 0.10.3, sem overrides permanentes e sem adicionar
dependências diretas. Instalação limpa com `npm ci --ignore-scripts
--strict-peer-deps --no-audit --no-fund` passou. Não usar `--force`,
`--legacy-peer-deps` nem o downgrade Expo 44 sugerido pelo audit automático.

A auditoria identificou um alerta crítico em `shell-quote@1.10.0`, transitivo
de React DevTools. Foi atualizado para 1.12.0 dentro do range permitido.
Também foram atualizados os patches compatíveis de `@xmldom/xmldom`, `js-yaml`
e `brace-expansion`, sem alterar o manifest ou o SDK.

## Pendências reais

Após essas correções, `npm audit --omit=dev` aponta **0 críticos, 47 altos e
17 moderados**. São 64 entradas com propagação pelas árvores Expo/Metro/Jest;
não representam 64 falhas independentes no aplicativo instalado. Omitir dev
no npm não separa perfeitamente tooling de código nativo, pois pacotes Expo
e React Native também carregam ferramentas em suas dependências/peers.
As origens remanescentes incluem seis pacotes: `braces`,
`decode-uri-component`, `image-size`, `node-forge`, `sprintf-js` e `uuid`.

- **Risco possível no app:** `expo-router` usa `query-string@7.1.3`, que inclui
  `decode-uri-component@0.2.2`. A correção indicada 0.5.0 está fora do range
  permitido. URLs malformadas podem causar consumo excessivo de CPU. Reavaliar
  upstream/mitigação e testar links nativos antes da distribuição pública.
- **Tooling:** `node-forge@1.4.0` apresenta falha de verificação de assinatura,
  e o advisory consultado não informa versão corrigida. `braces@3.0.3` também
  não tinha patch publicado; a correção de `image-size@1.2.1` exige major.
  Não processar certificados, imagens ou padrões não confiáveis no tooling
  como se a atualização do SDK tivesse eliminado esses riscos.
- A preparação de APK não equivale a aprovação para distribuição pública.
  Conferir avisos atualizados, alcance dos módulos no binário e comportamento
  de links antes do lançamento; não afirmar que o audit ficou zerado.

## Revisão do caminho de links nativos

A revisão do código instalado de `expo-router@57.0.28` confirmou que os links
nativos padrão, iniciais e com o app aberto, passam por `redirectSystemPath`
antes de `getStateFromURL`. Entretanto, o linking config fornece o fork Expo
de `getStateFromPath`, cuja leitura da query usa `URLSearchParams`, e não a
chamada `queryString.parse` do parser genérico separado de React Navigation.
Assim, não foi comprovado que a entrada nativa padrão alcance a função
afetada pelo advisory de `decode-uri-component`.

As evidências estão em `node_modules/expo-router/build/getLinkingConfig.js`,
`build/link/linking.js`, `build/fork/useLinking.native.js` e
`build/fork/getStateFromPath-forks.js`. O parser genérico permanece em
`build/react-navigation/core/getStateFromPath.js`.

Não foi adicionado um hook apenas para declarar o alerta resolvido: ele não
cobriria web, `legacy_subscribe` ou todas as entradas internas, e a dependência
afetada continuaria no lock. Também não foram executados payloads de alto
custo. Manter a pendência para revisão antes da distribuição pública, com
checagem de upstream e testes de links no APK; reavaliar até 26/10/2026 ou antes
do lançamento, o que ocorrer primeiro. A revisão não comprova ausência de
outros caminhos alcançáveis no binário.

- [NativeIntent no SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/router/#nativeintent)
- [Tratamento oficial de links nativos](https://docs.expo.dev/router/advanced/native-intent/#rewrite-incoming-native-deep-links)

## Referências dos advisories

- [shell-quote corrigido](https://github.com/advisories/GHSA-pqg4-j6r4-53mv)
- [decode-uri-component](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr)
- [node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv)
- [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
- [image-size](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr)
