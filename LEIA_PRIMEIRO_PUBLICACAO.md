# Tekoha Finanças v1.14 — Visual renovado + Fotos com IA

Aplicativo web progressivo (PWA) para publicação na Vercel. O site pode ser instalado pela opção **Instalar app** do Chrome no Android. **Não é um APK nativo** e não se conecta automaticamente ao aplicativo Android anterior.

## O que foi entregue

- Interface reformulada em todas as telas: identidade T$K, cartões e fundos ilustrados, navegação desktop/mobile, formulários, painéis, revenda, retiradas, assinaturas e backup.
- Fotos de comprovantes, notas e listas analisadas com IA mediante autorização: usuário escolhe Pessoal, Empresa Tekoha, Reforma Tekoha, Revenda ou Extras antes da foto.
- Função `api/analyze.js` na Vercel conversa com **OpenAI API** por HTTPS. A chave fica em variável de ambiente no servidor, nunca no HTML ou JavaScript do navegador.
- Sugestões de produtos, quantidades, valores, categoria e tipo de documento; exige conferência antes de registrar.
- Listas sem prova de pagamento viram orçamento/planejamento, **não despesa paga**.
- ID por foto/linha impede lançar duas vezes o mesmo item analisado; itens são individuais, sem duplicar o total do cupom.
- Continuam disponíveis: gastos offline, parcelas, CPF x CNPJ, revenda, retiradas pessoais, assinaturas, análises, Excel, backup JSON e ZIP/PDF de fotos.

## Para colocar na Vercel

### 1. Publicar este projeto

Use a **pasta raiz** deste pacote, que contém `api/`, `public/`, `package.json` e `vercel.json`. A Vercel não descompacta um ZIP enviado como se ele fosse um projeto automaticamente; você pode:

- Extrair o ZIP em um computador e enviar os arquivos **mantendo a estrutura de pastas** para um repositório no GitHub; na Vercel clique em **Add New → Project → Import Git Repository** e selecione esse repositório.
- Ou instalar Node.js e Vercel CLI no computador, extrair o ZIP e executar `npx vercel --prod` na pasta do projeto depois de fazer login na conta.

Na importação da Vercel, escolha **Framework Preset: Other** e use **Root Directory: raiz do projeto**. O site está em `public/` e a função está em `api/`.

### 2. Ativar a API, sem expor a chave

Crie uma chave de API na plataforma de desenvolvedores OpenAI: <https://platform.openai.com/api-keys>. Sua assinatura do ChatGPT, mesmo paga, é separada do faturamento da API. Configure faturamento e limites de uso da API antes de ativar.

Na Vercel, acesse **Project → Settings → Environment Variables** e crie:

| Nome | Valor |
|---|---|
| `OPENAI_API_KEY` | Sua chave secreta da API OpenAI; NÃO inclua no código, site, nem conversa. |
| `TEKOHA_APP_CODE` | Código secreto e **único**, preferencialmente aleatório, com no mínimo 32 caracteres. Diferente da chave OpenAI. |
| `OPENAI_VISION_MODEL` | `gpt-4.1-mini` (opcional; requer acesso à API). |

Ative para **Production** e, se for testar prévias, **Preview**. Depois das alterações nas variáveis, faça **Redeploy** para ativá-las. Não versionar `.env.local`, backups JSON, imagens ou notas fiscais no GitHub.

### 3. Configurar no celular

1. No Android, abra o endereço **HTTPS** de produção `https://SEU-PROJETO.vercel.app` no **Google Chrome**.
2. No menu ⋮, selecione **Instalar app** / **Adicionar à tela inicial**, conforme aparecer.
3. Abra o atalho instalado. O ícone T$K aparecerá na tela inicial. Permita acesso à câmera quando o Android pedir e escolha a foto do comprovante.
4. Abra **Fotos e IA**; informe **somente o código TEKOHA_APP_CODE**, nunca a chave OpenAI.
5. Escolha o destino (Pessoal, Empresa, Reforma, Revenda ou Extras), fotografe o documento e toque em **Ler com IA**. Confira itens, data, custo, origem CPF/CNPJ, forma de pagamento e confirme os itens corretos.
6. Opcionalmente, marque leitura automática de novas fotos. Esse recurso só envia a foto enquanto o app estiver aberto, online e com o código de acesso da sessão ativo.

A leitura por IA precisa de internet e pode gerar custos da API. Lançamentos manuais, quando já carregados, podem continuar disponíveis offline. O navegador pode solicitar acesso à câmera e aos arquivos via sistema Android — sem acesso irrestrito ao armazenamento.

### 4. Migrar os dados

A PWA armazena os registros no **armazenamento local do Chrome / domínio Vercel**, não sincroniza automaticamente com o app Android anterior. Antes de trocar de app, gere o backup financeiro JSON e ZIP das fotos **no aplicativo antigo**. Na PWA, use **Planilhas e backup → Restaurar JSON** (ou botão equivalente disponível na tela). As fotos não estão no JSON e não reaparecem automaticamente; mantenha o ZIP e as imagens em local seguro. O app não inclui restauração automática de fotos a partir desse ZIP.

**Evite mudar o domínio depois de começar a usar**, pois o armazenamento local do navegador é separado por origem. Não limpe dados do Chrome, não desinstale o PWA e não apague fotos antes de confirmar seus backups.

### 5. Proteção de dados — muito importante

O site e seu código da interface são públicos se o projeto não tiver restrições de acesso. O PIN local existente no front-end **não é autenticação segura de servidor**. O código de 32 caracteres protege o endpoint de IA de uso casual, mas não protege um usuário com acesso físico ao celular. Considere proteção de acesso na Vercel (se disponível no seu plano), não compartilhe o endereço e não salve backups na pasta pública `public/`.

Os registros e as fotos ficam no dispositivo até você enviá-los explicitamente; ao usar a IA, a imagem selecionada vai à função da Vercel e à OpenAI API para interpretação. A chamada usa `store:false` e não grava a imagem no banco da Vercel por este projeto, mas está sujeita às políticas do serviço de API e da hospedagem. Confira os termos antes de enviar documentos sensíveis. Não envie dados de terceiros sem autorização.

### 6. Testes e limites conhecidos

- 10/10 testes isolados da função de API passaram com resposta **simulada**, sem cobrança e sem fazer chamada à OpenAI.
- Testes de interface em Chromium para **393px e 1340px**, com navegação para Fotos e IA e verificação de erros e largura.
- **Não** foram testados uma chave real, a publicação na Vercel, a instalação no Android físico, a restauração de fotos de um ZIP ou permissões de hardware do seu celular.
- O projeto é **PWA instalável**, não um APK nem atualização automática do pacote Android anterior.
- Se o navegador for aberto sem armazenamento persistente, fotos não ficam disponíveis; habilite armazenamento/permissões no Chrome e confirme backup.

## Teste recomendado após publicação

Em primeiro lugar, use **dados fictícios**: uma lista sem valor, uma compra com dois produtos e uma foto de recibo simples. Confirme que a lista não gera saída de dinheiro, que a compra gera apenas itens (não soma o total outra vez), que o mesmo ID não é duplicado e que o backup JSON pode ser importado com os dados restaurados. Depois teste com dados reais.
