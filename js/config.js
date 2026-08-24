/**
 * Configuração do front-end — Controle de entrada do Festival de Música 2026.
 */
(function () {
  'use strict';

  window.APP_CONFIG = Object.freeze({
    // Temporariamente permanece apontando para a implantação existente.
    // A próxima etapa será substituir pelo Apps Script específico do teatro.
    API_URL:
      'https://script.google.com/macros/s/AKfycbzLc3wDUrECxyG1U3hSSD27tC6KOPaREHKg483lWhh7sLZZDXyO1eiClqi6Bt324dO7SA/exec',

    OPERADOR_PADRAO: 'Portaria 01',
    REQUEST_TIMEOUT_MS: 15000,

    QR_LIBRARY_URL:
      'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
  });
})();
