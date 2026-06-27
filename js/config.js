/**
 * ============================================================================
 * CONFIGURAÇÃO DO FRONT-END
 * ============================================================================
 *
 * Projeto:
 * Controle de retirada de alimentos — Almoço Junino 2026
 *
 * Objetivo:
 * Centralizar a URL da API e os parâmetros de funcionamento da interface.
 *
 * Versão: 1.1
 * Data: 27/06/2026
 * ============================================================================
 */

(function () {
  'use strict';

  window.APP_CONFIG = Object.freeze({
    /**
     * URL da implantação oficial do Google Apps Script.
     *
     * Deve ser utilizada a URL terminada em /exec.
     */
    API_URL:
      'https://script.google.com/macros/s/AKfycbw7mZNb3Y7PdNtROsRdtZDzFtuX-AFJtE3kmn9Hs9_aw-0dmOxLzKv2DUy5zW_6EPIqEw/exec',

    /**
     * Identificação do operador enviada para o histórico.
     *
     * Poderemos futuramente permitir que o operador informe seu nome
     * ou escolha o caixa ao abrir o sistema.
     */
    OPERADOR_PADRAO: 'Caixa 01',

    /**
     * Tempo máximo de espera por uma resposta da API.
     */
    REQUEST_TIMEOUT_MS: 15000,

    /**
     * Tempo para retornar automaticamente à tela inicial após uma retirada.
     */
    AUTO_RESET_SUCCESS_MS: 4500,

    /**
     * Biblioteca utilizada para leitura opcional de QR Code.
     */
    QR_LIBRARY_URL:
      'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
  });
})();