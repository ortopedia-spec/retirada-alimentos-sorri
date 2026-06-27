# Controle de Retirada de Alimentos

Aplicacao mobile-first para consultar participantes em uma planilha Google Sheets e registrar a retirada de alimentos durante uma festa. O front-end e estatico e pode ser publicado no GitHub Pages. A gravacao oficial acontece em um Google Apps Script publicado como Web App.

## Visao geral da arquitetura

- index.html, css/ e js/: interface estatica hospedavel no GitHub Pages.
- js/config.js: configuracao unica da URL do Web App, operador padrao, timeout e biblioteca opcional de QR Code.
- js/api.js: comunicacao JSON com o Apps Script e normalizacao da matricula.
- js/app.js: estados da aplicacao, teclado numerico, selecao, confirmacao, QR Code opcional, mensagens e retorno automatico.
- apps-script/: arquivos a copiar para um projeto Google Apps Script.
- manifest.webmanifest e sw.js: PWA leve somente para arquivos estaticos. Consultas a planilha nao sao cacheadas.

## Estrutura de arquivos

    /
    index.html
    css/styles.css
    js/config.js
    js/api.js
    js/app.js
    assets/icons/icon.svg
    assets/logo/logo.svg
    apps-script/Code.gs
    apps-script/Config.gs
    apps-script/appsscript.json
    manifest.webmanifest
    sw.js
    README.md

## Planilha Google Sheets

A aba principal deve se chamar Participantes e conter, no minimo:

- MAT
- NOME
- QR_CODE_LINK, se ja existir ou se for usado para gerar QR Codes
- uma coluna para cada alimento configurado em apps-script/Config.gs

Alimentos configurados inicialmente:

- Cachorro-Quente 01
- Cachorro-Quente 02
- Refrigerante 01
- Refrigerante 02
- Bolo
- Canjica
- Paçoca
- Pipoca
- Caldo de Mandioca

Os nomes em ITENS_DISPONIVEIS precisam ser exatamente iguais aos cabecalhos da planilha. Se a planilha estiver usando Pacoca sem cedilha, por exemplo, ajuste o item no Config.gs.

## Configurar o ID da planilha

No arquivo apps-script/Config.gs, troque:

    const SPREADSHEET_ID = 'COLE_AQUI_O_ID_DA_PLANILHA';

O ID fica na URL da planilha, entre /d/ e /edit.

## Publicar o Apps Script como Web App

1. Crie um projeto em script.google.com.
2. Copie apps-script/Code.gs para o arquivo Code.gs.
3. Crie o arquivo Config.gs e copie o conteudo de apps-script/Config.gs.
4. Se for importar o manifesto, use o conteudo de apps-script/appsscript.json.
5. Salve o projeto.
6. Clique em Implantar > Nova implantacao.
7. Escolha o tipo App da Web.
8. Configure Executar como para o proprietario do script.
9. Configure quem pode acessar conforme a operacao. Para GitHub Pages publico, normalmente e necessario permitir acesso a qualquer pessoa com o link.
10. Autorize as permissoes solicitadas pelo Google.
11. Copie a URL terminada em /exec.
12. Nao use a URL de desenvolvimento terminada em /dev no ambiente oficial.

Permissoes necessarias:

- abrir a planilha pelo ID;
- ler os dados dos participantes;
- atualizar a aba Participantes;
- criar ou atualizar a aba Historico_Retiradas;
- usar LockService para evitar duplicidade em operacoes simultaneas.

## Configurar o front-end

Edite js/config.js:

    window.APP_CONFIG = {
      API_URL: 'COLE_AQUI_A_URL_DO_WEB_APP',
      OPERADOR_PADRAO: 'Caixa 01',
      REQUEST_TIMEOUT_MS: 15000,
      AUTO_RESET_SUCCESS_MS: 4500,
      QR_LIBRARY_URL: 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
    };

Troque API_URL pela URL /exec gerada na implantacao do Apps Script. Ajuste OPERADOR_PADRAO se cada caixa usar uma copia configurada do sistema.

## Publicar no GitHub Pages

1. Envie estes arquivos para um repositorio GitHub.
2. No GitHub, abra Settings > Pages.
3. Em Build and deployment, selecione Deploy from a branch.
4. Escolha a branch e a pasta raiz do projeto.
5. Aguarde a URL do GitHub Pages ser publicada.
6. Abra a URL em um celular e faca uma consulta real.

## Testar localmente

Para conferir layout e fluxo inicial, abra index.html no navegador.

Para testar PWA e service worker, rode um servidor estatico local na pasta do projeto, por exemplo:

    python -m http.server 8000

Depois acesse http://localhost:8000.

## Ajustar nomes dos alimentos

A lista central fica em apps-script/Config.gs, na constante ITENS_DISPONIVEIS. O front-end nao precisa conhecer essa lista antecipadamente: ele renderiza o que a API retornar.

No futuro, a funcao carregarContextoParticipantes_ pode ser adaptada para ler os alimentos de uma aba Configuracao sem mudar o contrato da API.

## Ajustar interpretacao dos status

A regra fica centralizada em interpretarStatusItem(valor), no Apps Script. As listas configuraveis ficam em VALORES_STATUS:

    const VALORES_STATUS = {
      RETIRADO: ['RETIRADO', 'RETIRADA', 'JA RETIRADO'],
      DISPONIVEL: ['SIM', 'DISPONIVEL', 'PENDENTE', 'X', '1'],
      NAO_AUTORIZADO: ['', 'NAO', 'N', '0']
    };

O codigo remove acentos antes de comparar, entao DISPONÍVEL e DISPONIVEL sao tratados do mesmo modo. Valores desconhecidos sao tratados como NAO_AUTORIZADO para evitar retirada indevida.

## API JSON

Consulta:

    GET ?action=buscarParticipante&matricula=001234

Resposta de sucesso:

    {
      "success": true,
      "data": {
        "matricula": "001234",
        "nome": "Joao da Silva",
        "itens": [
          { "id": "Bolo", "nome": "Bolo", "status": "DISPONIVEL" }
        ]
      }
    }

Registro:

    {
      "action": "registrarRetiradas",
      "matricula": "001234",
      "itens": ["Bolo", "Refrigerante 01"],
      "operador": "Caixa 01"
    }

O POST usa Content-Type text/plain;charset=utf-8 para evitar preflight CORS desnecessario.

## Historico de retiradas

O sistema usa a aba Historico_Retiradas. Se ela nao existir, o Apps Script cria a aba com este cabecalho:

    DATA_HORA | MAT | NOME | ITEM | OPERADOR | STATUS | ID_OPERACAO

Cada alimento registrado gera uma linha individual. O mesmo ID_OPERACAO agrupa os itens confirmados na mesma operacao.

## Concorrencia e duplicidade

O registro usa LockService.getScriptLock(). Depois de obter o lock, o Apps Script rele a planilha, valida cada item novamente, atualiza somente os itens validos e grava o historico em lote. Se outro caixa retirar um item entre a consulta e a confirmacao, esse item volta em itensIgnorados com o motivo.

## QR Code

A digitacao numerica e o fluxo principal. O leitor de QR Code so carrega html5-qrcode quando o operador toca em Ler QR Code. A camera e parada ao fechar o leitor ou apos uma leitura valida.

O QR Code pode conter apenas a matricula ou uma URL com matricula, mat ou codigo na query string.

## Limitacoes de seguranca

Um front-end no GitHub Pages e publico. A URL do Web App tambem fica visivel no navegador. Para eventos internos isso pode ser suficiente, mas nao substitui autenticacao forte. Se houver risco de uso indevido, restrinja acesso no Apps Script, use contas Google autorizadas ou adicione validacoes adicionais no servidor.

## Erros comuns

- Configure a URL do Web App: js/config.js ainda esta com o placeholder.
- Matricula nao encontrada: a coluna MAT nao bate com a matricula normalizada para seis digitos.
- Resposta invalida: a URL pode estar apontando para /dev, para uma pagina de login ou para uma implantacao sem permissao.
- Erro de CORS: confirme que o Apps Script foi publicado como Web App e que o POST usa text/plain;charset=utf-8.
- Erro de permissao: reimplante o Web App, autorize o script e confirme o acesso configurado.
- Item sempre nao autorizado: confira se o cabecalho da coluna do alimento e igual ao nome em ITENS_DISPONIVEIS e ajuste VALORES_STATUS.

## Pontos que dependem da planilha real

- grafia exata de MAT, NOME e dos alimentos;
- valores usados para indicar disponivel, retirado e nao autorizado;
- politica de acesso do Web App;
- necessidade ou nao de autenticacao Google;
- padrao real dos QR Codes existentes.
