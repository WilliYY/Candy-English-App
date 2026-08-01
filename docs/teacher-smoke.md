# Smoke do perfil TEACHER

Esta verificação fecha o perfil `TEACHER` em duas camadas: autorização no
backend compartilhado e funcionamento do aplicativo nativo.

## Matriz negativa de vínculos

O backend rejeita ou oculta dados fora do vínculo autenticado nos seguintes
recursos:

| Recurso | Regra verificada |
| --- | --- |
| Aulas e materiais | Somente aulas da própria teacher; aula alheia retorna não encontrada. |
| Criação e edição de aula | Somente aluno vinculado e aula pertencente à teacher. |
| Homeworks e campos interativos | Somente aula, aluno e homework pertencentes ao escopo da teacher. |
| Submissões e feedback | Consulta e alteração limitadas aos homeworks da teacher. |
| Pré-cadastros | Somente registros criados pela teacher ou atribuídos a ela. |
| Contratos | Somente contratos gerais ou de alunos ativos vinculados. |
| Aula ao vivo | Somente sessões pertencentes ao perfil da teacher. |
| Candy XP | Fontes e ranking limitados ao perfil autenticado e à categoria teacher. |
| Catty Learning | Sugestões próprias e artefatos de alunos ativos vinculados. |

Executar no repositório do site/backend:

```powershell
npm.cmd run verify:mobile-teacher
```

Esse comando executa toda a suíte de domínio móvel, autenticação móvel,
TypeScript, lint, validação Prisma e build de produção do backend/site.

## Smoke do aplicativo

Executar neste repositório:

```powershell
npm.cmd run verify:teacher
```

O comando executa todos os testes de regressão, TypeScript, lint, Expo Doctor e
exporta Android, iOS e web. O diretório temporário de exportação é removido
mesmo quando alguma etapa falha.

## Limite desta automação

Antes de liberar uma versão nas lojas, ainda é obrigatório testar em aparelho
físico com o backend HTTPS de produção ou homologação e contas reais de teste
`TEACHER`, `STUDENT` e `ADMIN`. Esse teste conectado valida rede, credenciais,
permissões e dados do ambiente sem substituir as proteções automatizadas.
