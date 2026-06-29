/**
 * ============================================================================
 * CLIENTE DA API — CONTROLE DE RETIRADA DE ALIMENTOS
 * ============================================================================
 *
 * Projeto:
 * Controle de retirada de alimentos — Almoço Junino 2026
 *
 * Objetivo:
 * Realizar a comunicação entre a interface web e o Google Apps Script.
 *
 * Regras:
 * - Todas as consultas utilizam POST.
 * - Matrícula: de 1 a 4 dígitos.
 * - Também aceita matrícula antiga formatada com até 6 dígitos e zeros.
 * - CPF: exatamente 11 dígitos.
 * - CPF nunca é colocado na URL.
 * - Requisições utilizam text/plain para evitar preflight CORS.
 * - O servidor permanece responsável por validar cotas e saldos.
 *
 * Compatibilidade:
 * - Mantém as funções utilizadas pela interface anterior.
 * - Aceita itens como IDs simples ou objetos com quantidade.
 *
 * Versão: 2.1
 * Data: 29/06/2026
 * ============================================================================
 */

(function () {
  'use strict';

  /**
   * Erro padronizado da aplicação.
   */
  class RetiradaApiError extends Error {
    constructor(code, message, details) {
      super(message || 'Não foi possível concluir a operação.');

      this.name = 'RetiradaApiError';
      this.code = code || 'ERRO_INTERNO';
      this.details = details || null;
    }
  }


  /**
   * Retorna as configurações globais da aplicação.
   */
  function obterConfiguracao_() {
    return window.APP_CONFIG || {};
  }


  /**
   * Retorna e valida a URL do Web App.
   */
  function obterApiUrl_() {
    const config = obterConfiguracao_();
    const apiUrl = String(config.API_URL || '').trim();

    if (
      !apiUrl ||
      apiUrl === 'COLE_AQUI_A_URL_DO_WEB_APP' ||
      !/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/i.test(apiUrl)
    ) {
      throw criarErroAplicacao(
        'CONFIG_API_URL_AUSENTE',
        'Configure a URL válida do Web App em js/config.js.'
      );
    }

    return apiUrl;
  }


  /**
   * Retorna o tempo máximo permitido para a requisição.
   */
  function obterTimeout_() {
    const config = obterConfiguracao_();
    const timeout = Number(config.REQUEST_TIMEOUT_MS);

    if (
      Number.isFinite(timeout) &&
      timeout >= 1000
    ) {
      return timeout;
    }

    return 15000;
  }


  /**
   * Retorna somente os dígitos de um valor.
   */
  function somenteDigitos(valor) {
    return String(
      valor === null || valor === undefined
        ? ''
        : valor
    ).replace(/\D/g, '');
  }


  /**
   * Remove zeros à esquerda da matrícula.
   */
  function normalizarMatriculaInterna_(valor) {
    const digitos = somenteDigitos(valor);

    if (!digitos) {
      return '';
    }

    const semZeros = digitos.replace(/^0+/, '');

    return semZeros || '0';
  }


  /**
   * Mantém compatibilidade com a interface anterior.
   *
   * A matrícula é exibida com seis posições.
   * Um CPF com 11 dígitos não é alterado.
   */
  function normalizarMatricula(valor) {
    const digitos = somenteDigitos(valor);

    if (!digitos) {
      return '';
    }

    if (digitos.length === 11) {
      return digitos;
    }

    const matricula = normalizarMatriculaInterna_(digitos);

    return matricula.padStart(6, '0');
  }


  /**
   * Detecta se o valor representa matrícula ou CPF.
   */
  function identificarTipo(valor, tipoExplicito) {
    const digitos = somenteDigitos(valor);
    const tipoInformado = normalizarTipo_(tipoExplicito);

    if (!digitos) {
      throw criarErroAplicacao(
        'IDENTIFICADOR_VAZIO',
        'Informe a matrícula ou o CPF.'
      );
    }

    if (tipoInformado === 'F') {
      const matricula = normalizarMatriculaInterna_(digitos);

      if (
        matricula.length < 1 ||
        matricula.length > 4
      ) {
        throw criarErroAplicacao(
          'MATRICULA_INVALIDA',
          'A matrícula deve possuir até 4 dígitos.'
        );
      }

      return {
        tipoParticipante: 'F',
        identificador: matricula,
        identificadorDigitado: digitos,
        identificadorExibicao: matricula.padStart(6, '0')
      };
    }

    if (tipoInformado === 'P') {
      if (digitos.length !== 11) {
        throw criarErroAplicacao(
          'CPF_INVALIDO',
          'O CPF deve possuir 11 dígitos.'
        );
      }

      return {
        tipoParticipante: 'P',
        identificador: digitos,
        identificadorDigitado: digitos,
        identificadorExibicao: formatarCpf_(digitos)
      };
    }

    /*
     * Matrícula digitada normalmente.
     */
    if (
      digitos.length >= 1 &&
      digitos.length <= 4
    ) {
      const matricula = normalizarMatriculaInterna_(digitos);

      return {
        tipoParticipante: 'F',
        identificador: matricula,
        identificadorDigitado: digitos,
        identificadorExibicao: matricula.padStart(6, '0')
      };
    }

    /*
     * Compatibilidade com matrículas como 000003.
     */
    if (
      digitos.length >= 5 &&
      digitos.length <= 6 &&
      /^0+/.test(digitos)
    ) {
      const matricula = normalizarMatriculaInterna_(digitos);

      if (matricula.length <= 4) {
        return {
          tipoParticipante: 'F',
          identificador: matricula,
          identificadorDigitado: digitos,
          identificadorExibicao: matricula.padStart(6, '0')
        };
      }
    }

    if (digitos.length === 11) {
      return {
        tipoParticipante: 'P',
        identificador: digitos,
        identificadorDigitado: digitos,
        identificadorExibicao: formatarCpf_(digitos)
      };
    }

    throw criarErroAplicacao(
      'IDENTIFICADOR_INVALIDO',
      'Digite uma matrícula de até 4 dígitos ou um CPF com 11 dígitos.'
    );
  }


  /**
   * Normaliza o tipo do participante.
   */
  function normalizarTipo_(tipo) {
    const valor = String(tipo || '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

    if (
      valor === 'F' ||
      valor === 'FUNCIONARIO'
    ) {
      return 'F';
    }

    if (
      valor === 'P' ||
      valor === 'PACIENTE'
    ) {
      return 'P';
    }

    return '';
  }


  /**
   * Formata um CPF completo apenas para o campo de digitação local.
   *
   * O CPF recebido da API continuará mascarado pelo servidor.
   */
  function formatarCpf_(cpf) {
    const digitos = somenteDigitos(cpf).slice(0, 11);

    if (digitos.length !== 11) {
      return digitos;
    }

    return (
      digitos.slice(0, 3) +
      '.' +
      digitos.slice(3, 6) +
      '.' +
      digitos.slice(6, 9) +
      '-' +
      digitos.slice(9)
    );
  }


  /**
   * Retorna uma representação adequada para o visor.
   */
  function formatarIdentificador(valor, tipoExplicito) {
    const digitos = somenteDigitos(valor);

    if (!digitos) {
      return '';
    }

    try {
      return identificarTipo(
        digitos,
        tipoExplicito
      ).identificadorExibicao;

    } catch (error) {
      /*
       * Durante a digitação de CPF, exibe os números ainda incompletos.
       */
      if (digitos.length > 4) {
        return formatarCpfParcial_(digitos);
      }

      return normalizarMatricula(digitos);
    }
  }


  /**
   * Formata progressivamente o CPF durante a digitação.
   */
  function formatarCpfParcial_(valor) {
    const digitos = somenteDigitos(valor).slice(0, 11);

    if (digitos.length <= 3) {
      return digitos;
    }

    if (digitos.length <= 6) {
      return (
        digitos.slice(0, 3) +
        '.' +
        digitos.slice(3)
      );
    }

    if (digitos.length <= 9) {
      return (
        digitos.slice(0, 3) +
        '.' +
        digitos.slice(3, 6) +
        '.' +
        digitos.slice(6)
      );
    }

    return (
      digitos.slice(0, 3) +
      '.' +
      digitos.slice(3, 6) +
      '.' +
      digitos.slice(6, 9) +
      '-' +
      digitos.slice(9)
    );
  }


  /**
   * Consulta um funcionário ou paciente.
   *
   * Aceita:
   * buscarParticipante("3")
   * buscarParticipante("12345678909")
   * buscarParticipante({
   *   identificador: "12345678909",
   *   tipoParticipante: "P"
   * })
   */
  async function buscarParticipante(entrada) {
    const requisicao = normalizarEntradaIdentificacao_(entrada);

    const identificacao = identificarTipo(
      requisicao.identificador,
      requisicao.tipoParticipante
    );

    const response = await executarPost_({
      action: 'buscarParticipante',
      tipoParticipante:
        identificacao.tipoParticipante,
      identificador:
        identificacao.identificador
    });

    return normalizarRespostaSucesso_(
      response,
      'Participante localizado.'
    );
  }


  /**
   * Registra as retiradas.
   *
   * Formatos aceitos:
   *
   * {
   *   matricula: "3",
   *   itens: ["bolo", "pipoca"]
   * }
   *
   * {
   *   identificador: "12345678909",
   *   tipoParticipante: "P",
   *   itens: [
   *     { id: "cachorro_quente", quantidade: 2 }
   *   ]
   * }
   */
  async function registrarRetiradas(dados) {
    const payload = dados || {};

    const entradaIdentificacao = {
      tipoParticipante:
        payload.tipoParticipante ||
        payload.tipo ||
        '',

      identificador:
        payload.identificador ||
        payload.cpf ||
        payload.matricula ||
        ''
    };

    const identificacao = identificarTipo(
      entradaIdentificacao.identificador,
      entradaIdentificacao.tipoParticipante
    );

    const itens = normalizarItens_(payload.itens);

    if (itens.length === 0) {
      throw criarErroAplicacao(
        'NENHUM_ITEM_INFORMADO',
        'Selecione pelo menos um alimento.'
      );
    }

    const config = obterConfiguracao_();

    const response = await executarPost_({
      action: 'registrarRetiradas',

      tipoParticipante:
        identificacao.tipoParticipante,

      identificador:
        identificacao.identificador,

      itens: itens,

      operador:
        String(
          payload.operador ||
          config.OPERADOR_PADRAO ||
          'Caixa 01'
        ).trim()
    });

    return normalizarRespostaSucesso_(
      response,
      'Retirada registrada com sucesso.'
    );
  }


  /**
   * Consulta o estado da API.
   */
  async function health() {
    const response = await executarPost_({
      action: 'health'
    });

    return normalizarRespostaSucesso_(
      response,
      'API disponível.'
    );
  }


  /**
   * Normaliza a entrada de identificação.
   */
  function normalizarEntradaIdentificacao_(entrada) {
    if (
      entrada &&
      typeof entrada === 'object' &&
      !Array.isArray(entrada)
    ) {
      return {
        tipoParticipante:
          entrada.tipoParticipante ||
          entrada.tipo ||
          '',

        identificador:
          entrada.identificador ||
          entrada.cpf ||
          entrada.matricula ||
          entrada.raMatCpf ||
          ''
      };
    }

    return {
      tipoParticipante: '',
      identificador: entrada
    };
  }


  /**
   * Normaliza a lista de itens.
   */
  function normalizarItens_(itensRecebidos) {
    let itens = itensRecebidos;

    if (!Array.isArray(itens)) {
      itens = itens ? [itens] : [];
    }

    const agrupados = new Map();

    itens.forEach(function (item) {
      let id = '';
      let quantidade = 1;

      if (
        item &&
        typeof item === 'object' &&
        !Array.isArray(item)
      ) {
        id = String(
          item.id ||
          item.itemId ||
          item.item ||
          ''
        ).trim();

        quantidade = Number(
          item.quantidade ||
          item.qtd ||
          1
        );

      } else {
        id = String(item || '').trim();
        quantidade = 1;
      }

      if (
        !id ||
        !Number.isFinite(quantidade) ||
        quantidade <= 0
      ) {
        return;
      }

      quantidade = Math.floor(quantidade);

      agrupados.set(
        id,
        (agrupados.get(id) || 0) +
          quantidade
      );
    });

    return Array.from(
      agrupados.entries()
    ).map(function (entry) {
      return {
        id: entry[0],
        quantidade: entry[1]
      };
    });
  }


  /**
   * Executa uma requisição POST para o Apps Script.
   */
  async function executarPost_(payload) {
    const apiUrl = obterApiUrl_();
    const timeoutMs = obterTimeout_();
    const controller = new AbortController();

    const timeoutId = window.setTimeout(
      function () {
        controller.abort();
      },
      timeoutMs
    );

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',

        /*
         * text/plain é uma requisição simples e evita preflight CORS.
         */
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8'
        },

        body: JSON.stringify(payload),
        cache: 'no-store',
        redirect: 'follow',
        credentials: 'omit',
        signal: controller.signal
      });

      if (!response.ok) {
        throw criarErroAplicacao(
          'ERRO_HTTP',
          'O servidor respondeu com HTTP ' +
            response.status +
            '.',
          {
            status: response.status
          }
        );
      }

      const texto = await response.text();

      let json;

      try {
        json = JSON.parse(texto);

      } catch (error) {
        throw criarErroAplicacao(
          'RESPOSTA_INVALIDA',
          'A resposta do servidor não pôde ser interpretada.',
          {
            respostaRecebida:
              texto.slice(0, 300)
          }
        );
      }

      validarRespostaApi_(json);

      return json;

    } catch (error) {
      if (
        error &&
        error.name === 'AbortError'
      ) {
        throw criarErroAplicacao(
          'TIMEOUT',
          'A planilha demorou para responder.'
        );
      }

      if (error instanceof RetiradaApiError) {
        throw error;
      }

      throw criarErroAplicacao(
        'ERRO_REDE',
        'Não foi possível acessar o servidor.',
        {
          causa:
            error && error.message
              ? error.message
              : String(error)
        }
      );

    } finally {
      window.clearTimeout(timeoutId);
    }
  }


  /**
   * Verifica se a API devolveu erro.
   *
   * Aceita tanto o formato atual quanto o formato da versão anterior.
   */
  function validarRespostaApi_(response) {
    if (
      !response ||
      typeof response !== 'object'
    ) {
      throw criarErroAplicacao(
        'RESPOSTA_INVALIDA',
        'O servidor devolveu uma resposta vazia.'
      );
    }

    if (response.success === false) {
      const errorData =
        response.error &&
        typeof response.error === 'object'
          ? response.error
          : response;

      throw criarErroAplicacao(
        errorData.code ||
          response.code ||
          'ERRO_INTERNO',

        errorData.message ||
          response.message ||
          'Não foi possível concluir a operação.',

        response
      );
    }
  }


  /**
   * Padroniza a resposta de sucesso para o app.js.
   */
  function normalizarRespostaSucesso_(
    response,
    mensagemPadrao
  ) {
    return {
      success: true,

      message:
        response.message ||
        mensagemPadrao ||
        'Operação concluída.',

      data:
        response.data !== undefined
          ? response.data
          : response
    };
  }


  /**
   * Cria um erro padronizado.
   */
  function criarErroAplicacao(
    code,
    message,
    details
  ) {
    return new RetiradaApiError(
      code,
      message,
      details
    );
  }


  /**
   * API pública utilizada pelo app.js.
   */
  window.RetiradaAPI = Object.freeze({
    buscarParticipante:
      buscarParticipante,

    registrarRetiradas:
      registrarRetiradas,

    health:
      health,

    identificarTipo:
      identificarTipo,

    formatarIdentificador:
      formatarIdentificador,

    normalizarMatricula:
      normalizarMatricula,

    somenteDigitos:
      somenteDigitos,

    criarErroAplicacao:
      criarErroAplicacao
  });
})();