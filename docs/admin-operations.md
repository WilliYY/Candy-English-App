# Manutenção e operação no aplicativo ADMIN

## Fluxo nativo

1. O card `Manutenção` abre o estado operacional compartilhado.
2. A tela atualiza a cada 15 segundos e também aceita atualização manual.
3. O ADMIN vê se os alunos estão em operação normal ou bloqueados por
   manutenção, a última versão da configuração e o uso total agregado do
   armazenamento.
4. Ativar ou desativar exige confirmação explícita. A tentativa conserva o
   mesmo `operationId` quando falha, permitindo retry idempotente.
5. Uma mudança feita no site ou em outro aparelho gera conflito e exige
   recarregar antes de tentar de novo.

## Limites de segurança

- A tela existe somente para role `ADMIN` e usa Bearer token no header.
- O app não recebe nomes, caminhos ou listagem de arquivos.
- O cofre de APIs e senhas, variáveis de ambiente e detalhes internos do
  servidor permanecem exclusivos do site.
- O valor de armazenamento é apenas um total em bytes, formatado localmente.
- Ativar manutenção bloqueia alunos; admins e teachers continuam acessando para
  corrigir conteúdos e configurações.

## Verificação

```powershell
npm.cmd test -- --runInBand src/features/admin-operations/__tests__/admin-operations-screen-test.tsx
npm.cmd test -- --runInBand src/lib/api/__tests__/mobile-api-client-test.ts
npm.cmd run verify:teacher
```
