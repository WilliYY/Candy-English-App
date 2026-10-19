# Ficha de publicação Google Play — rascunho

Este documento prepara conteúdo e decisões para revisão na Play Console.
Não comprova publicação, aprovação, testes físicos ou conformidade integral.
Não colocar senhas, chaves ou dados de alunos neste arquivo.

## Conteúdo proposto

**Nome:** Candy English

**Descrição curta:** Aulas, atividades e acompanhamento da sua jornada na Candy English.

**Descrição completa:**

Leve sua rotina Candy English com você. O aplicativo conecta alunos,
professores e a equipe da escola ao mesmo sistema usado no site.

Alunos podem acompanhar aulas e materiais, responder atividades, consultar
feedback, acessar contratos e atualizar o perfil. Professores encontram seus
recursos de ensino e acompanhamento. A administração tem acesso às operações
autorizadas da escola, incluindo agenda e controle financeiro interno.

Os recursos disponíveis dependem do perfil de acesso. Para entrar, use a conta
fornecida pela Candy English e as mesmas credenciais do site. É necessária
conexão à internet para consultar e atualizar dados do sistema.

O aplicativo não realiza pagamentos online. O controle financeiro é utilizado
pela equipe autorizada da escola.

**Política de privacidade:** https://candyenglish.com.br/privacidade

**Site:** https://candyenglish.com.br

**Categoria proposta:** Educação. Confirmar no Console.

## Etapas que exigem confirmação do responsável

- Conta desenvolvedora: confirmar titularidade e estado de verificação. A escola
  deve avaliar conta organizacional, documentação empresarial e D-U-N-S; não
  escolher um tipo nem preencher identidade por suposição.
- Contato de suporte público e nome legal: confirmar valores antes de enviar.
- Público etário: declarar as idades reais atendidas; não selecionar somente
  adultos para evitar requisitos. Se incluir crianças, revisar Families Policy.
- Publicidade: não foi identificado SDK publicitário na lista de dependências;
  confirmar comportamento do build e integrações antes da declaração definitiva.
- Classificação de conteúdo: responder o questionário com o comportamento real,
  incluindo mensagens e conteúdo educacional; não inventar uma classificação.
- Acesso do revisor: preparar contas demonstrativas com dados fictícios e
  instruções em inglês. Nunca entregar uma conta administrativa real ou
  dados financeiros de produção à revisão.
- Exclusão de conta: atualmente o acesso é provisionado pela escola, sem
  cadastro público na tela de login do app. Conferir todo o fluxo e as regras
  aplicáveis antes da submissão; desativação não equivale à exclusão exigida
  quando o aplicativo permite criar conta ou encaminha a cadastro externo.

## Segurança dos dados — inventário para revisão, não declaração pronta

O app pode transmitir dados pessoais e escolares ao backend autenticado:
nome, email, contatos, perfil, avatar/fotos selecionadas, dados do responsável,
atividades e arquivos enviados, mensagens e dados operacionais restritos por
perfil. O financeiro administrativo inclui informações de pagamento interno.
Catty e listening usam integrações de IA do backend; revisar finalidade,
provedores, compartilhamento, retenção e público antes de preencher Data safety.
O uso de HTTPS e armazenamento seguro de sessão não dispensa essas declarações.

A política web existente responde publicamente, e o app disponibiliza seu link
no login e no painel de todos os perfis. Ainda é necessário conferir se o texto
abrange todos os dados e SDKs da versão móvel final. Push não deve ser declarado
como ativo só porque `expo-notifications` consta nas dependências.

## Arquivos visuais e artefato

- Ícone Android já existe nos assets; conferir nitidez na loja e no aparelho.
- Gerar feature graphic e screenshots a partir da versão aprovada, com dados
  fictícios. Nunca usar telas financeiras ou cadastros reais como imagens da loja.
- Conferir target API efetivo e assinatura no AAB final, não apenas no SDK.
- Primeiro distribuir um APK de preview para teste físico. Depois, enviar AAB
  para teste interno; o perfil inicial de submit mantém a versão em rascunho.
- Contas pessoais novas podem precisar de 12 testadores inscritos em teste
  fechado durante 14 dias consecutivos antes de pedir acesso à produção.

## Referências oficiais consultadas em 19/10/2026

- [Cadastro e taxa da Play Console](https://support.google.com/googleplay/android-developer/answer/6112435?hl=pt-BR)
- [Tipo de conta desenvolvedora](https://support.google.com/googleplay/android-developer/answer/13634885?hl=pt-BR)
- [Testes para contas pessoais novas](https://support.google.com/googleplay/android-developer/answer/14151465?hl=pt-BR)
- [Target API](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)
- [Verificação e registro no Brasil](https://developer.android.com/developer-verification/guides/google-play-console)
- [Segurança dos dados](https://support.google.com/googleplay/android-developer/answer/10787469?hl=pt-BR)
- [Exclusão de contas](https://support.google.com/googleplay/android-developer/answer/13327111?hl=pt-BR)
- [Público-alvo e conteúdo](https://support.google.com/googleplay/android-developer/answer/9867159?hl=pt-BR)
- [Envio Android pelo EAS](https://docs.expo.dev/submit/android/)
