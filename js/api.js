(function () {
  'use strict';

  const DEFAULT_TIMEOUT_MS = 15000;

  function normalizarMatricula(valor) {
    const apenasNumeros = String(valor || '').replace(/\s+/g, '').replace(/\D+/g, '');
    if (!apenasNumeros) {
      return '';
    }
    return apenasNumeros.padStart(6, '0');
  }

  function criarErroAplicacao(code, message, details) {
    const error = new Error(message || 'Não foi possível concluir a operação.');
    error.code = code || 'ERRO_DESCONHECIDO';
    error.details = details || null;
    return error;
  }

  function obterConfig() {
    return window.APP_CONFIG || {};
  }

  function obterApiUrl() {
    const apiUrl = (obterConfig().API_URL || '').trim();
    if (!apiUrl || apiUrl === 'COLE_AQUI_A_URL_DO_WEB_APP') {
      throw criarErroAplicacao(
        'CONFIG_API_URL_AUSENTE',
        'Configure a URL do Web App em js/config.js antes de consultar.'
      );
    }
    return apiUrl;
  }

  async function fetchComTimeout(url, options) {
    const timeoutMs = Number(obterConfig().REQUEST_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, Object.assign({}, options, { signal: controller.signal }));
    } catch (error) {
      if (error.name === 'AbortError') {
        throw criarErroAplicacao('TIMEOUT', 'Tempo limite excedido ao comunicar com a planilha.');
      }
      throw criarErroAplicacao('ERRO_REDE', 'Não foi possível conectar ao servidor.', error);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function lerJsonSeguro(response) {
    const texto = await response.text();
    try {
      return JSON.parse(texto);
    } catch (error) {
      throw criarErroAplicacao('RESPOSTA_INVALIDA', 'O servidor retornou uma resposta inválida.', {
        status: response.status,
        body: texto,
        error
      });
    }
  }

  function tratarRespostaApi(payload) {
    if (!payload || typeof payload !== 'object') {
      throw criarErroAplicacao('RESPOSTA_INVALIDA', 'A resposta do servidor está vazia ou inválida.');
    }

    if (payload.success === false) {
      throw criarErroAplicacao(payload.code, payload.message, payload);
    }

    return payload;
  }

  async function buscarParticipante(matricula) {
    const apiUrl = obterApiUrl();
    const url = new URL(apiUrl);
    url.searchParams.set('action', 'buscarParticipante');
    url.searchParams.set('matricula', normalizarMatricula(matricula));

    const response = await fetchComTimeout(url.toString(), {
      method: 'GET',
      redirect: 'follow'
    });
    return tratarRespostaApi(await lerJsonSeguro(response));
  }

  async function registrarRetiradas(payload) {
    const apiUrl = obterApiUrl();
    const body = {
      action: 'registrarRetiradas',
      matricula: normalizarMatricula(payload.matricula),
      itens: Array.isArray(payload.itens) ? payload.itens : [],
      operador: payload.operador || obterConfig().OPERADOR_PADRAO || 'Caixa 01'
    };

    const response = await fetchComTimeout(apiUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(body)
    });
    return tratarRespostaApi(await lerJsonSeguro(response));
  }

  window.RetiradaAPI = {
    normalizarMatricula,
    buscarParticipante,
    registrarRetiradas,
    criarErroAplicacao
  };
})();
