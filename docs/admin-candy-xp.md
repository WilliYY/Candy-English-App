# Candy XP administrativo no aplicativo

## Fluxo nativo

1. O card `Candy XP` do painel ADMIN abre indicadores de atividades, publicações,
   rascunhos e correções pendentes.
2. A tela permite buscar, filtrar e paginar atividades e mostra o ranking privado
   com somente nome, posição, nível e XP.
3. O detalhe permite editar título, descrição, categoria, nível, XP, status e
   liberação para todos ou para um aluno ativo.
4. O ADMIN consulta perguntas, gabarito e entregas, escreve feedback e confirma
   `Aprovar + XP` ou `Devolver`.
5. Telas abertas atualizam a cada 15 segundos enquanto não há rascunho local.
   Arrastar para atualizar força uma nova leitura.

## Escritas seguras

- Toda alteração pede confirmação explícita antes de chamar a API.
- A versão `expectedUpdatedAt` detecta mudanças feitas no site ou em outro
  aparelho.
- A tentativa mantém o mesmo `operationId` quando falha, permitindo retry
  idempotente sem conceder XP duas vezes.
- Aprovar usa o mesmo ledger `CandyXpEvent` do site e atualiza o perfil derivado
  depois da transação.
- O app não recebe e-mail, telefone, documento, identificador de usuário, caminho
  de avatar ou caminho privado do material.
- O gabarito existe somente no detalhe autenticado da role `ADMIN`; catálogo e
  ranking nunca o carregam.

## Escopo desta entrega

O aplicativo administra atividades já existentes, liberações e correções. Criar,
excluir e substituir o arquivo-base da atividade continuam temporariamente no
site até o fluxo móvel de upload ganhar a mesma validação e limpeza de resíduos.

## Verificação

```powershell
npm.cmd test -- src/features/admin-candy-xp/__tests__
npm.cmd test -- src/lib/api/__tests__/mobile-api-client-test.ts
npm.cmd run verify:teacher
```
