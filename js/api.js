/**
 * Cliente da API — Controle de entrada no Festival de Música 2026.
 */
(function () {
  'use strict';

  class EntradaApiError extends Error {
    constructor(code, message, details) {
      super(message || 'Não foi possível concluir a operação.');
      this.name = 'EntradaApiError';
      this.code = code || 'ERRO_INTERNO';
      this.details = details || null;
    }
  }

  function config() {
    return window.APP_CONFIG || {};
  }

  function apiUrl() {
    const value = String(config().API_URL || '').trim();
    if (!value || !/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/i.test(value)) {
      throw new EntradaApiError('CONFIG_API_URL_AUSENTE', 'Configure uma URL válida do Apps Script em js/config.js.');
    }
    return value;
  }

  function timeoutMs() {
    const value = Number(config().REQUEST_TIMEOUT_MS);
    return Number.isFinite(value) && value >= 1000 ? value : 15000;
  }

  function normalizarIdQr(value) {
    return String(value == null ? '' : value).replace(/\D/g, '').trim();
  }

  async function post(payload) {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, timeoutMs());

    try {
      const response = await fetch(apiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (error) {
        throw new EntradaApiError('RESPOSTA_INVALIDA', 'A API retornou uma resposta inválida.');
      }

      if (!response.ok || data.ok === false || data.success === false) {
        throw new EntradaApiError(
          data.code || data.codigo || 'ERRO_API',
          data.message || data.mensagem || 'Não foi possível concluir a operação.',
          data.details || data.detalhes || null
        );
      }

      return data.data || data.result || data;
    } catch (error) {
      if (error instanceof EntradaApiError) throw error;
      if (error && error.name === 'AbortError') {
        throw new EntradaApiError('TIMEOUT', 'A consulta demorou mais do que o esperado.');
      }
      throw new EntradaApiError('FALHA_REDE', 'Não foi possível comunicar com o servidor.', error);
    } finally {
      clearTimeout(timer);
    }
  }

  async function buscarConvite(idQr) {
    const id = normalizarIdQr(idQr);
    if (!id) {
      throw new EntradaApiError('ID_QR_VAZIO', 'Informe ou leia o QR Code do convite.');
    }

    return post({
      action: 'buscarConvite',
      idQr: id
    });
  }

  async function registrarEntrada(dados) {
    const payload = dados || {};
    const idQr = normalizarIdQr(payload.idQr);
    const adultos = Math.max(0, Math.floor(Number(payload.adultos) || 0));
    const menores = Math.max(0, Math.floor(Number(payload.menores) || 0));

    if (!idQr) {
      throw new EntradaApiError('ID_QR_VAZIO', 'Convite sem ID_QR.');
    }
    if (adultos + menores <= 0) {
      throw new EntradaApiError('ENTRADA_VAZIA', 'Informe ao menos uma entrada.');
    }

    return post({
      action: 'registrarEntrada',
      idQr: idQr,
      adultos: adultos,
      menores: menores,
      operador: String(payload.operador || config().OPERADOR_PADRAO || 'Portaria 01').trim()
    });
  }

  async function health() {
    return post({ action: 'health' });
  }

  window.EntradaAPI = Object.freeze({
    buscarConvite: buscarConvite,
    registrarEntrada: registrarEntrada,
    health: health,
    normalizarIdQr: normalizarIdQr,
    EntradaApiError: EntradaApiError
  });
})();
