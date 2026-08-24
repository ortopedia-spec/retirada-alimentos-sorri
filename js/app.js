/**
 * Interface — Controle de entrada no Festival de Música 2026.
 */
(function () {
  'use strict';

  const state = {
    convite: null,
    adultosAgora: 0,
    menoresAgora: 0,
    qrScanner: null,
    qrReading: false
  };

  const el = {};

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cache();
    bind();
    showScreen('idle');
  }

  function cache() {
    el.screens = {
      idle: document.getElementById('screen-idle'),
      loading: document.getElementById('screen-loading'),
      participant: document.getElementById('screen-participant'),
      result: document.getElementById('screen-result')
    };

    el.input = document.getElementById('id-qr-input');
    el.btnSearch = document.getElementById('btn-search');
    el.btnOpenQr = document.getElementById('btn-open-qr');
    el.btnCloseQr = document.getElementById('btn-close-qr');
    el.qrSheet = document.getElementById('qr-sheet');
    el.qrReader = document.getElementById('qr-reader');
    el.qrMessage = document.getElementById('qr-message');

    el.name = document.getElementById('participant-name');
    el.type = document.getElementById('participant-type');
    el.phone = document.getElementById('participant-phone');
    el.user = document.getElementById('participant-user');
    el.statusBadge = document.getElementById('status-badge');

    el.authorityAlert = document.getElementById('authority-alert');
    el.authorityNote = document.getElementById('authority-note');
    el.supportAlert = document.getElementById('support-alert');
    el.supportNote = document.getElementById('support-note');

    el.adultAuthorized = document.getElementById('adult-authorized');
    el.adultUsed = document.getElementById('adult-used');
    el.adultRemaining = document.getElementById('adult-remaining');
    el.adultNow = document.getElementById('adult-now');

    el.minorAuthorized = document.getElementById('minor-authorized');
    el.minorUsed = document.getElementById('minor-used');
    el.minorRemaining = document.getElementById('minor-remaining');
    el.minorNow = document.getElementById('minor-now');

    el.ticketGrid = document.querySelector('.ticket-grid');
    el.btnCancelEntry = document.getElementById('btn-cancel-entry');
    el.btnConfirmOpen = document.getElementById('btn-confirm-open');

    el.confirmationSheet = document.getElementById('confirmation-sheet');
    el.confirmationParticipant = document.getElementById('confirmation-participant');
    el.confirmationList = document.getElementById('confirmation-list');
    el.btnCancelConfirmation = document.getElementById('btn-cancel-confirmation');
    el.btnConfirmSave = document.getElementById('btn-confirm-save');

    el.resultCard = document.getElementById('result-card');
    el.resultIcon = document.getElementById('result-icon');
    el.resultTitle = document.getElementById('result-title');
    el.resultMessage = document.getElementById('result-message');
    el.resultDetails = document.getElementById('result-details');
    el.btnNewSearch = document.getElementById('btn-new-search');
    el.toastRegion = document.getElementById('toast-region');
  }

  function bind() {
    el.btnSearch.addEventListener('click', function () { consultar(el.input.value); });
    el.input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') consultar(el.input.value);
    });

    el.btnOpenQr.addEventListener('click', openQrReader);
    el.btnCloseQr.addEventListener('click', closeQrReader);

    el.ticketGrid.addEventListener('click', handleQuantityClick);
    el.btnCancelEntry.addEventListener('click', reset);
    el.btnConfirmOpen.addEventListener('click', openConfirmation);
    el.btnCancelConfirmation.addEventListener('click', closeConfirmation);
    el.btnConfirmSave.addEventListener('click', salvarEntrada);
    el.btnNewSearch.addEventListener('click', reset);
  }

  async function consultar(idQr) {
    const id = window.EntradaAPI.normalizarIdQr(idQr);
    if (!id) {
      toast('Informe ou leia o QR Code do convite.');
      return;
    }

    showScreen('loading');

    try {
      const response = await window.EntradaAPI.buscarConvite(id);
      state.convite = normalizarConvite(response, id);
      state.adultosAgora = 0;
      state.menoresAgora = 0;
      renderConvite();
      showScreen('participant');
    } catch (error) {
      showResult(false, error.message || 'Convite não localizado.');
    }
  }

  function normalizarConvite(data, fallbackId) {
    const origem = data.convite || data.participante || data;
    const adultosAutorizados = numberValue(origem.adultosAutorizados, origem.adultos_autorizados, origem.quantidadeAdultos, origem.adultos, 0);
    const menoresAutorizados = numberValue(origem.menoresAutorizados, origem.menores_autorizados, origem.quantidadeMenores, origem.menores, 0);
    const adultosEntraram = numberValue(origem.adultosEntraram, origem.adultos_entraram, origem.adultosUtilizados, 0);
    const menoresEntraram = numberValue(origem.menoresEntraram, origem.menores_entraram, origem.menoresUtilizados, 0);

    return {
      idQr: String(origem.idQr || origem.ID_QR || fallbackId || ''),
      nome: textValue(origem.nome, origem.nomeCompleto, origem.NOME, 'Convite'),
      telefone: textValue(origem.telefone, origem.TELEFONE, '—'),
      tipoConvite: textValue(origem.tipoConvite, origem.tipo_convite, origem.TIPO_CONVITE, '—'),
      usuarioParticipante: textValue(origem.usuarioParticipante, origem.nomeUsuarioParticipante, origem.USUARIO_PARTICIPANTE, '—'),
      autoridade: boolValue(origem.autoridade, origem.AUTORIDADE),
      obsAutoridade: textValue(origem.obsAutoridade, origem.observacaoAutoridade, origem.OBS_AUTORIDADE, ''),
      necessitaApoio: boolValue(origem.necessitaApoio, origem.NECESSITA_APOIO),
      tipoApoio: textValue(origem.tipoApoio, origem.TIPO_APOIO, ''),
      adultosAutorizados: adultosAutorizados,
      menoresAutorizados: menoresAutorizados,
      adultosEntraram: adultosEntraram,
      menoresEntraram: menoresEntraram,
      adultosRestantes: Math.max(0, numberValue(origem.adultosRestantes, origem.adultos_restantes, adultosAutorizados - adultosEntraram)),
      menoresRestantes: Math.max(0, numberValue(origem.menoresRestantes, origem.menores_restantes, menoresAutorizados - menoresEntraram))
    };
  }

  function renderConvite() {
    const c = state.convite;
    el.name.textContent = c.nome;
    el.type.textContent = c.tipoConvite;
    el.phone.textContent = c.telefone;
    el.user.textContent = c.usuarioParticipante || '—';

    el.authorityAlert.hidden = !c.autoridade;
    el.authorityNote.textContent = c.obsAutoridade || 'Direcionar para a área reservada.';

    el.supportAlert.hidden = !c.necessitaApoio;
    el.supportNote.textContent = c.tipoApoio || 'Apoio informado no cadastro.';

    el.adultAuthorized.textContent = c.adultosAutorizados;
    el.adultUsed.textContent = c.adultosEntraram;
    el.adultRemaining.textContent = c.adultosRestantes;

    el.minorAuthorized.textContent = c.menoresAutorizados;
    el.minorUsed.textContent = c.menoresEntraram;
    el.minorRemaining.textContent = c.menoresRestantes;

    const totalRestante = c.adultosRestantes + c.menoresRestantes;
    if (totalRestante <= 0) {
      el.statusBadge.textContent = 'COMPLETO';
      el.statusBadge.dataset.status = 'complete';
    } else if (c.adultosEntraram + c.menoresEntraram > 0) {
      el.statusBadge.textContent = 'PARCIAL';
      el.statusBadge.dataset.status = 'partial';
    } else {
      el.statusBadge.textContent = 'NÃO UTILIZADO';
      el.statusBadge.dataset.status = 'available';
    }

    updateQuantities();
  }

  function handleQuantityClick(event) {
    const button = event.target.closest('[data-action][data-type]');
    if (!button || !state.convite) return;

    const type = button.dataset.type;
    const delta = button.dataset.action === 'plus' ? 1 : -1;

    if (type === 'adultos') {
      state.adultosAgora = clamp(state.adultosAgora + delta, 0, state.convite.adultosRestantes);
    } else {
      state.menoresAgora = clamp(state.menoresAgora + delta, 0, state.convite.menoresRestantes);
    }

    updateQuantities();
  }

  function updateQuantities() {
    el.adultNow.textContent = state.adultosAgora;
    el.minorNow.textContent = state.menoresAgora;
    el.btnConfirmOpen.disabled = state.adultosAgora + state.menoresAgora <= 0;
  }

  function openConfirmation() {
    if (!state.convite || state.adultosAgora + state.menoresAgora <= 0) return;

    el.confirmationParticipant.textContent = state.convite.nome;
    el.confirmationList.innerHTML = '';

    if (state.adultosAgora > 0) appendConfirmation('Adultos', state.adultosAgora);
    if (state.menoresAgora > 0) appendConfirmation('Menores', state.menoresAgora);

    el.confirmationSheet.hidden = false;
  }

  function appendConfirmation(label, value) {
    const li = document.createElement('li');
    li.textContent = label + ': ' + value;
    el.confirmationList.appendChild(li);
  }

  function closeConfirmation() {
    el.confirmationSheet.hidden = true;
  }

  async function salvarEntrada() {
    if (!state.convite) return;

    el.btnConfirmSave.disabled = true;

    try {
      const result = await window.EntradaAPI.registrarEntrada({
        idQr: state.convite.idQr,
        adultos: state.adultosAgora,
        menores: state.menoresAgora
      });

      closeConfirmation();
      const atualizado = result.convite || result;
      showResult(true, 'Entrada registrada com sucesso.', atualizado);
    } catch (error) {
      closeConfirmation();
      showResult(false, error.message || 'Não foi possível registrar a entrada.');
    } finally {
      el.btnConfirmSave.disabled = false;
    }
  }

  function showResult(success, message, details) {
    el.resultCard.dataset.result = success ? 'success' : 'error';
    el.resultIcon.textContent = success ? '✓' : '!';
    el.resultTitle.textContent = success ? 'Entrada registrada' : 'Não foi possível concluir';
    el.resultMessage.textContent = message;
    el.resultDetails.innerHTML = '';

    if (success && details) {
      const adultosRestantes = numberValue(details.adultosRestantes, details.adultos_restantes, NaN);
      const menoresRestantes = numberValue(details.menoresRestantes, details.menores_restantes, NaN);
      if (Number.isFinite(adultosRestantes) || Number.isFinite(menoresRestantes)) {
        el.resultDetails.textContent = 'Saldo restante — Adultos: ' + (Number.isFinite(adultosRestantes) ? adultosRestantes : '—') + ' | Menores: ' + (Number.isFinite(menoresRestantes) ? menoresRestantes : '—');
      }
    }

    showScreen('result');
  }

  function showScreen(name) {
    Object.keys(el.screens).forEach(function (key) {
      el.screens[key].classList.toggle('screen-active', key === name);
    });
  }

  function reset() {
    state.convite = null;
    state.adultosAgora = 0;
    state.menoresAgora = 0;
    el.input.value = '';
    closeConfirmation();
    showScreen('idle');
    setTimeout(function () { el.input.focus(); }, 50);
  }

  async function openQrReader() {
    el.qrSheet.hidden = false;
    el.qrMessage.textContent = 'Preparando câmera...';

    try {
      await loadQrLibrary();
      if (!state.qrScanner) state.qrScanner = new window.Html5Qrcode('qr-reader');
      state.qrReading = false;

      await state.qrScanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        handleQrSuccess,
        function () {}
      );

      el.qrMessage.textContent = 'Aponte a câmera para o QR Code do convite.';
    } catch (error) {
      el.qrMessage.textContent = 'Não foi possível acessar a câmera. Você pode informar o ID manualmente.';
    }
  }

  async function handleQrSuccess(decodedText) {
    if (state.qrReading) return;
    state.qrReading = true;
    const id = window.EntradaAPI.normalizarIdQr(decodedText);
    await closeQrReader();
    if (!id) {
      toast('QR Code inválido.');
      return;
    }
    el.input.value = id;
    consultar(id);
  }

  async function closeQrReader() {
    if (state.qrScanner && state.qrScanner.isScanning) {
      try { await state.qrScanner.stop(); } catch (error) {}
    }
    el.qrSheet.hidden = true;
    state.qrReading = false;
  }

  function loadQrLibrary() {
    if (window.Html5Qrcode) return Promise.resolve();

    return new Promise(function (resolve, reject) {
      const script = document.createElement('script');
      script.src = (window.APP_CONFIG || {}).QR_LIBRARY_URL || 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function toast(message) {
    const node = document.createElement('div');
    node.className = 'toast';
    node.textContent = message;
    el.toastRegion.appendChild(node);
    setTimeout(function () { node.remove(); }, 3500);
  }

  function numberValue() {
    for (let i = 0; i < arguments.length; i += 1) {
      const value = Number(arguments[i]);
      if (Number.isFinite(value)) return Math.max(0, Math.floor(value));
    }
    return 0;
  }

  function textValue() {
    for (let i = 0; i < arguments.length; i += 1) {
      const value = arguments[i];
      if (value !== null && value !== undefined && String(value).trim() !== '') return String(value).trim();
    }
    return '';
  }

  function boolValue() {
    for (let i = 0; i < arguments.length; i += 1) {
      const value = arguments[i];
      if (typeof value === 'boolean') return value;
      const text = String(value == null ? '' : value).trim().toLowerCase();
      if (['sim', 's', 'true', '1', 'yes'].includes(text)) return true;
      if (['não', 'nao', 'n', 'false', '0', 'no'].includes(text)) return false;
    }
    return false;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
})();
