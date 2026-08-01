# Contratos no aplicativo ADMIN

## Fluxo nativo

1. O card `Contratos` abre o catálogo ADMIN.
2. A lista atualiza a cada 15 segundos e aceita busca, filtro de documentos
   gerais/de alunos e paginação por cursor.
3. O ADMIN informa o título, escolhe documento geral ou aluno ativo e seleciona
   um PDF pelo seletor nativo do aparelho.
4. Antes do envio, o aplicativo mostra uma confirmação com título, vínculo e
   arquivo.
5. A tentativa conserva o mesmo `operationId` quando falha, permitindo retry
   idempotente no backend.
6. O detalhe solicita metadados ADMIN e baixa os bytes pela rota compartilhada
   protegida. O Bearer token fica no header, nunca na URL.

## Proteção local

- Somente PDF com tamanho conhecido entre 1 byte e 8 MB segue para envio.
- O backend repete a verificação e valida a assinatura real do PDF.
- O download usa o cache `protected-contracts`, valida MIME, tamanho e
  assinatura e remove os temporários no logout.
- O app não recebe `storagePath` nem dados pessoais desnecessários.

## Verificação

```powershell
npm.cmd test -- --runInBand src/features/admin-contracts/__tests__/admin-contracts-screen-test.tsx
npm.cmd run verify:teacher
```
