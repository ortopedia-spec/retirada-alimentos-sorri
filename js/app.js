/**
 * ============================================================================
 * INTERFACE — CONTROLE DE RETIRADA DE ALIMENTOS
 * ============================================================================
 *
 * Projeto:
 * Controle de retirada de alimentos — Almoço Junino 2026
 *
 * Objetivo:
 * Controlar a interface de consulta e retirada para funcionários e pacientes.
 *
 * Regras:
 * - Matrícula: de 1 a 4 dígitos.
 * - CPF: 11 dígitos.
 * - Funcionários não possuem acompanhantes.
 * - Pacientes podem possuir acompanhantes.
 * - Cada alimento permite selecionar uma quantidade.
 * - A quantidade máxima é limitada ao saldo devolvido pelo servidor.
 * - O Apps Script realiza novamente todas as validações antes da gravação.
 *
 * Versão: 2.1
 * Data: 29/06/2026
 * ============================================================================
 */

(function () {
  'use strict';

  const APP_STATES = Object.freeze({
    IDLE: 'IDLE',
    LOADING: 'LOADING',
    PARTICIPANT_FOUND: 'PARTICIPANT_FOUND',
    CONFIRMING: 'CONFIRMING',
    SAVING: 'SAVING',
    SUCCESS: 'SUCCESS',
    NOT_FOUND: 'NOT_FOUND',
    ERROR: 'ERROR'
  });

  const ITEM_STATUS = Object.freeze({
    AVAILABLE: 'DISPONIVEL',
    REDEEMED: 'RETIRADO',
    BLOCKED: 'SEM_DIREITO',
    INACTIVE: 'INATIVO'
  });

  const ICONS = Object.freeze({
    check: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m5 12 4 4L19 6"/>
      </svg>
    `,

    plus: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14"/>
        <path d="M5 12h14"/>
      </svg>
    `,

    minus: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12h14"/>
      </svg>
    `,

    lock: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="11" width="14" height="10" rx="2"/>
        <path d="M8 11V8a4 4 0 0 1 8 0v3"/>
      </svg>
    `,

    alert: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 9v4"/>
        <path d="M12 17h.01"/>
        <path
          d="M10.3 4.4 2.8 17.5A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.5L13.7 4.4a2 2 0 0 0-3.4 0Z"
        />
      </svg>
    `,

    food: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 3v18"/>
        <path d="M8 3v8a4 4 0 0 1-4 4"/>
        <path d="M14 3v18"/>
        <path d="M14 3c3 0 6 3 6 7v2c0 2-1.5 3.5-3.5 3.5H14"/>
      </svg>
    `,

    cachorro_quente: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M5.2 8.2c-2.2 1.3-3.1 4.1-1.8 6.3 1.3 2.2 4.1 3 6.3 1.8l9.1-5.3c2.2-1.3 3-4.1 1.8-6.3-1.3-2.2-4.1-3-6.3-1.8Z"
        />
        <path d="m7.2 13.3 9.6-5.6"/>
        <path d="M8.5 9.2c.8.2 1.3.8 1.8 1.4.6.7 1.1 1.2 2 1.4"/>
      </svg>
    `,

    caldo_mandioca: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9h16l-1.1 7.1A4 4 0 0 1 15 19H9a4 4 0 0 1-3.9-2.9Z"/>
        <path d="M8 5c0 1 1 1.5 1 2.5"/>
        <path d="M12 4c0 1 1 1.5 1 2.5"/>
        <path d="M16 5c0 1 1 1.5 1 2.5"/>
      </svg>
    `,

    pipoca: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6 9 1.4 11h9.2L18 9"/>
        <path d="M6 9h12"/>
        <path d="M8.5 9 10 20"/>
        <path d="m15.5 9-1.5 11"/>
        <path d="M7 8a2.5 2.5 0 0 1 3.8-2.1A3 3 0 0 1 16 7.5c0 .2 0 .3-.1.5"/>
        <path d="M10.8 5.9A2.5 2.5 0 0 1 15 4.5"/>
      </svg>
    `,

    canjica: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 10h16l-1 6a4 4 0 0 1-4 3H9a4 4 0 0 1-4-3Z"/>
        <path d="M7 10c.5-2.8 2.2-4 5-4s4.5 1.2 5 4"/>
        <circle cx="9" cy="9" r=".7"/>
        <circle cx="12" cy="8" r=".7"/>
        <circle cx="15" cy="9" r=".7"/>
      </svg>
    `,

    bolo: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 9h14v10H5Z"/>
        <path d="M5 13h14"/>
        <path d="M8 6h8l3 3H5Z"/>
        <path d="M9 16h6"/>
      </svg>
    `,

    refrigerante: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 7h10l-1 14H8Z"/>
        <path d="M6 7h12"/>
        <path d="m10 3 4 4"/>
        <path d="M10 12h4"/>
      </svg>
    `,

    doces_tipicos: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m8 7 8 10"/>
        <path d="m16 7-8 10"/>
        <path d="M6 5 3 7l2 3"/>
        <path d="m18 5 3 2-2 3"/>
        <path d="M8 7c2-2 6-2 8 0l2 3c-2 3-4 5-6 7-2-2-4-4-6-7Z"/>
      </svg>
    `
  });

  const state = {
    appState: APP_STATES.IDLE,
    identificadorDigitado: '',
    identificacaoAtual: null,
    participante: null,
    quantidades: new Map(),
    resetTimer: null,
    qrScanner: null,
    qrReading: false,
    lastFocusedElement: null
  };

  const elements = {};

  document.addEventListener(
    'DOMContentLoaded',
    init
  );

  function init() {
    cacheElements();
    configurarTextosIniciais();
    bindEvents();
    atualizarDisplayIdentificador();
    setAppState(APP_STATES.IDLE);
    registrarServiceWorker();
  }

  function cacheElements() {
    elements.screens = {
      idle: document.getElementById(
        'screen-idle'
      ),

      loading: document.getElementById(
        'screen-loading'
      ),

      participant: document.getElementById(
        'screen-participant'
      ),

      result: document.getElementById(
        'screen-result'
      )
    };

    elements.entryTitle =
      document.getElementById(
        'initial-title'
      );

    elements.entryDescription =
      document.querySelector(
        '#screen-idle .entry-copy p'
      );

    elements.input =
      document.getElementById(
        'matricula-input'
      );

    elements.display =
      document.getElementById(
        'display-matricula'
      );

    elements.keypad =
      document.querySelector(
        '.keypad'
      );

    elements.btnClear =
      document.getElementById(
        'btn-clear'
      );

    elements.btnBackspace =
      document.getElementById(
        'btn-backspace'
      );

    elements.btnSearch =
      document.getElementById(
        'btn-search'
      );

    elements.btnOpenQr =
      document.getElementById(
        'btn-open-qr'
      );

    elements.loadingTitle =
      document.querySelector(
        '#screen-loading h2'
      );

    elements.cardEyebrow =
      document.querySelector(
        '#screen-participant .card-eyebrow'
      );

    elements.participantName =
      document.getElementById(
        'participant-name'
      );

    elements.participantMatricula =
      document.getElementById(
        'participant-matricula'
      );

    elements.itemsContainer =
      document.getElementById(
        'items-container'
      );

    elements.selectionBar =
      document.getElementById(
        'selection-bar'
      );

    elements.selectionCount =
      document.getElementById(
        'selection-count'
      );

    elements.btnConfirmOpen =
      document.getElementById(
        'btn-confirm-open'
      );

    elements.confirmationSheet =
      document.getElementById(
        'confirmation-sheet'
      );

    elements.confirmationTitle =
      document.getElementById(
        'confirmation-title'
      );

    elements.confirmationParticipant =
      document.getElementById(
        'confirmation-participant'
      );

    elements.confirmationList =
      document.getElementById(
        'confirmation-list'
      );

    elements.btnCancelConfirmation =
      document.getElementById(
        'btn-cancel-confirmation'
      );

    elements.btnConfirmSave =
      document.getElementById(
        'btn-confirm-save'
      );

    elements.resultCard =
      document.getElementById(
        'result-card'
      );

    elements.resultIcon =
      document.getElementById(
        'result-icon'
      );

    elements.resultTitle =
      document.getElementById(
        'result-title'
      );

    elements.resultMessage =
      document.getElementById(
        'result-message'
      );

    elements.resultDetails =
      document.getElementById(
        'result-details'
      );

    elements.btnNewSearch =
      document.getElementById(
        'btn-new-search'
      );

    elements.btnCloseQr =
      document.getElementById(
        'btn-close-qr'
      );

    elements.qrSheet =
      document.getElementById(
        'qr-sheet'
      );

    elements.qrReader =
      document.getElementById(
        'qr-reader'
      );

    elements.qrMessage =
      document.getElementById(
        'qr-message'
      );

    elements.toastRegion =
      document.getElementById(
        'toast-region'
      );
  }

  function configurarTextosIniciais() {
    if (elements.entryTitle) {
      elements.entryTitle.textContent =
        'Digite a matrícula ou CPF';
    }

    if (elements.entryDescription) {
      elements.entryDescription.textContent =
        'Funcionários usam a matrícula. Pacientes usam o CPF.';
    }

    elements.btnSearch.textContent =
      'Consultar participante';

    elements.input.maxLength = 11;

    elements.input.setAttribute(
      'aria-label',
      'Matrícula ou CPF'
    );
  }

  function bindEvents() {
    elements.keypad.addEventListener(
      'click',
      handleKeypadClick
    );

    elements.btnClear.addEventListener(
      'click',
      limparIdentificador
    );

    elements.btnBackspace.addEventListener(
      'click',
      apagarUltimoDigito
    );

    elements.btnSearch.addEventListener(
      'click',
      consultarParticipante
    );

    elements.input.addEventListener(
      'input',
      handleInputChange
    );

    elements.input.addEventListener(
      'keydown',
      handleInputKeydown
    );

    document.addEventListener(
      'keydown',
      handleGlobalKeydown
    );

    elements.itemsContainer.addEventListener(
      'click',
      handleItemsClick
    );

    elements.btnConfirmOpen.addEventListener(
      'click',
      openConfirmation
    );

    elements.btnCancelConfirmation.addEventListener(
      'click',
      closeConfirmation
    );

    elements.btnConfirmSave.addEventListener(
      'click',
      confirmarRetirada
    );

    elements.btnNewSearch.addEventListener(
      'click',
      resetApplication
    );

    elements.btnOpenQr.addEventListener(
      'click',
      openQrReader
    );

    elements.btnCloseQr.addEventListener(
      'click',
      closeQrReader
    );

    elements.confirmationSheet.addEventListener(
      'click',
      handleSheetBackdropClick
    );

    elements.qrSheet.addEventListener(
      'click',
      handleSheetBackdropClick
    );
  }

  function setAppState(
    nextState,
    details
  ) {
    state.appState = nextState;

    clearResetTimer();

    Object.values(
      elements.screens
    ).forEach(function (screen) {
      screen.classList.remove(
        'screen-active'
      );
    });

    elements.selectionBar.hidden = true;

    elements.btnSearch.disabled =
      nextState === APP_STATES.LOADING;

    elements.btnConfirmSave.disabled =
      nextState === APP_STATES.SAVING;

    if (nextState === APP_STATES.IDLE) {
      elements.screens.idle.classList.add(
        'screen-active'
      );

      limparDadosParticipante();
      focarEntrada();

      return;
    }

    if (nextState === APP_STATES.LOADING) {
      elements.loadingTitle.textContent =
        'Consultando participante...';

      elements.screens.loading.classList.add(
        'screen-active'
      );

      return;
    }

    if (
      nextState ===
        APP_STATES.PARTICIPANT_FOUND ||
      nextState ===
        APP_STATES.CONFIRMING
    ) {
      elements.screens.participant.classList.add(
        'screen-active'
      );

      atualizarBarraSelecao();

      return;
    }

    if (nextState === APP_STATES.SAVING) {
      elements.loadingTitle.textContent =
        'Registrando retirada...';

      elements.screens.loading.classList.add(
        'screen-active'
      );

      return;
    }

    if (
      nextState === APP_STATES.SUCCESS ||
      nextState === APP_STATES.NOT_FOUND ||
      nextState === APP_STATES.ERROR
    ) {
      elements.screens.result.classList.add(
        'screen-active'
      );

      renderResultado(
        nextState,
        details || {}
      );
    }
  }

  function handleKeypadClick(event) {
    const button = event.target.closest(
      '[data-digit]'
    );

    if (
      !button ||
      state.appState !== APP_STATES.IDLE
    ) {
      return;
    }

    adicionarDigito(
      button.dataset.digit
    );
  }

  function handleInputChange(event) {
    state.identificadorDigitado =
      sanitizarEntradaNumerica(
        event.target.value
      ).slice(0, 11);

    event.target.value =
      state.identificadorDigitado;

    atualizarDisplayIdentificador();
  }

  function handleInputKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();

      consultarParticipante();
    }
  }

  function handleGlobalKeydown(event) {
    const tagName =
      document.activeElement &&
      document.activeElement.tagName;

    if (
      [
        'BUTTON',
        'TEXTAREA',
        'SELECT'
      ].includes(tagName)
    ) {
      return;
    }

    if (
      state.appState !==
      APP_STATES.IDLE
    ) {
      if (event.key === 'Escape') {
        closeConfirmation();
        closeQrReader();
      }

      return;
    }

    if (/^\d$/.test(event.key)) {
      event.preventDefault();

      adicionarDigito(event.key);

      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();

      apagarUltimoDigito();

      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      consultarParticipante();
    }
  }

  function adicionarDigito(digito) {
    if (
      state.identificadorDigitado.length >=
      11
    ) {
      return;
    }

    state.identificadorDigitado =
      sanitizarEntradaNumerica(
        state.identificadorDigitado +
          digito
      ).slice(0, 11);

    elements.input.value =
      state.identificadorDigitado;

    atualizarDisplayIdentificador();
    focarEntrada();
  }

  function apagarUltimoDigito() {
    state.identificadorDigitado =
      state.identificadorDigitado.slice(
        0,
        -1
      );

    elements.input.value =
      state.identificadorDigitado;

    atualizarDisplayIdentificador();
    focarEntrada();
  }

  function limparIdentificador() {
    state.identificadorDigitado = '';

    elements.input.value = '';

    atualizarDisplayIdentificador();
    focarEntrada();
  }

  function atualizarDisplayIdentificador() {
    const digitos =
      state.identificadorDigitado;

    if (!digitos) {
      elements.display.textContent =
        '000000';

      elements.display.dataset.inputType =
        'VAZIO';

      return;
    }

    elements.display.textContent =
      window.RetiradaAPI
        .formatarIdentificador(
          digitos
        );

    elements.display.dataset.inputType =
      digitos.length <= 4
        ? 'MATRICULA'
        : 'CPF';
  }

  async function consultarParticipante() {
    if (
      state.appState ===
      APP_STATES.LOADING
    ) {
      return;
    }

    let identificacao;

    try {
      identificacao =
        window.RetiradaAPI
          .identificarTipo(
            state.identificadorDigitado
          );

    } catch (error) {
      showToast(
        mapErrorMessage(error),
        'error'
      );

      focarEntrada();

      return;
    }

    state.identificacaoAtual =
      identificacao;

    setAppState(
      APP_STATES.LOADING
    );

    try {
      const response =
        await window.RetiradaAPI
          .buscarParticipante({
            tipoParticipante:
              identificacao
                .tipoParticipante,

            identificador:
              identificacao
                .identificador
          });

      state.participante =
        response.data;

      state.quantidades.clear();

      renderParticipant(
        state.participante
      );

      setAppState(
        APP_STATES.PARTICIPANT_FOUND
      );

    } catch (error) {
      console.error(
        'Erro ao buscar participante:',
        error
      );

      if (
        error.code ===
        'PARTICIPANTE_NAO_ENCONTRADO'
      ) {
        const tipo =
          identificacao
            .tipoParticipante === 'P'
            ? 'CPF'
            : 'Matrícula';

        setAppState(
          APP_STATES.NOT_FOUND,
          {
            title:
              tipo +
              ' não encontrado',

            message:
              'Confira o número informado e tente novamente.'
          }
        );

        return;
      }

      setAppState(
        APP_STATES.ERROR,
        {
          title:
            'Não foi possível consultar',

          message:
            mapErrorMessage(error)
        }
      );
    }
  }

  function renderParticipant(
    participante
  ) {
    const isPatient =
      participante
        .tipoParticipante === 'P';

    const lines = [];

    elements.cardEyebrow.textContent =
      isPatient
        ? 'Paciente'
        : 'Funcionário';

    elements.participantName.textContent =
      participante.nome ||
      'Participante sem nome';

    if (isPatient) {
      lines.push(
        'CPF ' +
          (
            participante
              .cpfMascarado ||
            participante
              .identificadorMascarado ||
            '***.***.***-**'
          )
      );

      if (
        participante
          .quantidadeAcompanhantes === 1
      ) {
        lines.push(
          '1 acompanhante'
        );

      } else if (
        participante
          .quantidadeAcompanhantes > 1
      ) {
        lines.push(
          participante
            .quantidadeAcompanhantes +
            ' acompanhantes'
        );

      } else {
        lines.push(
          'Sem acompanhante'
        );
      }

      lines.push(
        participante.totalPessoas +
          (
            participante.totalPessoas === 1
              ? ' pessoa autorizada'
              : ' pessoas autorizadas'
          )
      );

    } else {
      lines.push(
        'Matrícula ' +
          (
            participante.matricula ||
            participante
              .identificadorMascarado ||
            ''
          )
      );
    }

    if (participante.setor) {
      lines.push(
        'Setor: ' +
          participante.setor
      );
    }

    elements.participantMatricula.textContent =
      lines.join(' • ');

    renderItems(
      participante.itens || []
    );
  }

  function renderItems(itens) {
    elements.itemsContainer
      .replaceChildren();

    const visiveis =
      itens.filter(function (item) {
        return (
          item.ativo !== false &&
          !item.bloqueado &&
          item.status !==
            ITEM_STATUS.INACTIVE
        );
      });

    const disponiveis =
      visiveis.filter(function (item) {
        return (
          Number(
            item.saldoDisponivel
          ) > 0
        );
      });

    const retirados =
      visiveis.filter(function (item) {
        return (
          Number(
            item.saldoDisponivel
          ) <= 0
        );
      });

    elements.itemsContainer.appendChild(
      criarSecaoItens(
        'Disponíveis para retirada',
        disponiveis,
        'Nenhum alimento disponível para retirada.',
        true
      )
    );

    elements.itemsContainer.appendChild(
      criarSecaoItens(
        'Já retirados',
        retirados,
        'Nenhum alimento foi retirado completamente ainda.',
        false
      )
    );
  }

  function criarSecaoItens(
    titulo,
    itens,
    textoVazio,
    permitirQuantidade
  ) {
    const section =
      document.createElement(
        'section'
      );

    section.className =
      'items-section';

    const heading =
      document.createElement(
        'h3'
      );

    heading.textContent =
      titulo;

    section.appendChild(
      heading
    );

    if (!itens.length) {
      const empty =
        document.createElement(
          'p'
        );

      empty.className =
        'empty-section';

      empty.textContent =
        textoVazio;

      section.appendChild(
        empty
      );

      return section;
    }

    const grid =
      document.createElement(
        'div'
      );

    grid.className =
      'items-grid';

    itens.forEach(function (item) {
      grid.appendChild(
        criarItemCard(
          item,
          permitirQuantidade
        )
      );
    });

    section.appendChild(
      grid
    );

    return section;
  }

  function criarItemCard(
    item,
    permitirQuantidade
  ) {
    const quantidadeSelecionada =
      state.quantidades.get(
        item.id
      ) || 0;

    const card =
      document.createElement(
        'article'
      );

    card.className =
      'item-card';

    card.dataset.itemId =
      item.id;

    card.dataset.status =
      item.status ||
      ITEM_STATUS.AVAILABLE;

    card.dataset.selected =
      String(
        quantidadeSelecionada > 0
      );

    const icon =
      document.createElement(
        'span'
      );

    icon.className =
      'item-icon item-icon--' +
      item.id;

    icon.innerHTML =
      ICONS[item.id] ||
      ICONS.food;

    const text =
      document.createElement(
        'span'
      );

    text.className =
      'item-copy';

    const name =
      document.createElement(
        'span'
      );

    name.className =
      'item-name';

    name.textContent =
      item.nome;

    const status =
      document.createElement(
        'span'
      );

    status.className =
      'item-status';

    status.textContent =
      criarTextoStatusItem(
        item
      );

    text.append(
      name,
      status
    );

    if (permitirQuantidade) {
      card.append(
        icon,
        text,
        criarControleQuantidade(
          item,
          quantidadeSelecionada
        )
      );

    } else {
      const indicator =
        document.createElement(
          'span'
        );

      indicator.className =
        'status-indicator';

      indicator.innerHTML =
        ICONS.check;

      card.append(
        icon,
        text,
        indicator
      );
    }

    return card;
  }

  function criarTextoStatusItem(item) {
    const direito =
      Number(
        item.direitoTotal
      ) || 0;

    const retirado =
      Number(
        item.quantidadeRetirada
      ) || 0;

    const saldo =
      Number(
        item.saldoDisponivel
      ) || 0;

    if (saldo <= 0) {
      return (
        'Retirado: ' +
        retirado +
        ' de ' +
        direito
      );
    }

    if (retirado > 0) {
      return (
        'Disponíveis: ' +
        saldo +
        ' de ' +
        direito +
        ' • Já retirados: ' +
        retirado
      );
    }

    return (
      'Disponíveis: ' +
      saldo +
      ' de ' +
      direito
    );
  }

  function criarControleQuantidade(
    item,
    quantidadeSelecionada
  ) {
    const control =
      document.createElement(
        'span'
      );

    control.className =
      'quantity-control';

    control.setAttribute(
      'role',
      'group'
    );

    control.setAttribute(
      'aria-label',
      'Quantidade de ' +
        item.nome
    );

    const minusButton =
      document.createElement(
        'button'
      );

    minusButton.type =
      'button';

    minusButton.className =
      'quantity-button quantity-button-minus';

    minusButton.dataset.quantityAction =
      'decrement';

    minusButton.dataset.itemId =
      item.id;

    minusButton.disabled =
      quantidadeSelecionada <= 0;

    minusButton.setAttribute(
      'aria-label',
      'Diminuir ' +
        item.nome
    );

    minusButton.innerHTML =
      ICONS.minus;

    const value =
      document.createElement(
        'span'
      );

    value.className =
      'quantity-value';

    value.textContent =
      String(
        quantidadeSelecionada
      );

    value.setAttribute(
      'aria-live',
      'polite'
    );

    const plusButton =
      document.createElement(
        'button'
      );

    plusButton.type =
      'button';

    plusButton.className =
      'quantity-button quantity-button-plus';

    plusButton.dataset.quantityAction =
      'increment';

    plusButton.dataset.itemId =
      item.id;

    plusButton.disabled =
      quantidadeSelecionada >=
      Number(
        item.saldoDisponivel || 0
      );

    plusButton.setAttribute(
      'aria-label',
      'Adicionar ' +
        item.nome
    );

    plusButton.innerHTML =
      ICONS.plus;

    control.append(
      minusButton,
      value,
      plusButton
    );

    return control;
  }

  function handleItemsClick(event) {
    const button =
      event.target.closest(
        '[data-quantity-action]'
      );

    if (
      !button ||
      !state.participante
    ) {
      return;
    }

    const itemId =
      button.dataset.itemId;

    const action =
      button.dataset
        .quantityAction;

    const item =
      encontrarItemPorId(
        itemId
      );

    if (!item) {
      return;
    }

    const atual =
      state.quantidades.get(
        itemId
      ) || 0;

    const limite =
      Number(
        item.saldoDisponivel
      ) || 0;

    let proxima =
      atual;

    if (
      action === 'increment'
    ) {
      proxima = Math.min(
        limite,
        atual + 1
      );

    } else if (
      action === 'decrement'
    ) {
      proxima = Math.max(
        0,
        atual - 1
      );
    }

    if (proxima > 0) {
      state.quantidades.set(
        itemId,
        proxima
      );

    } else {
      state.quantidades.delete(
        itemId
      );
    }

    renderItems(
      state.participante.itens || []
    );

    atualizarBarraSelecao();
  }

  function encontrarItemPorId(itemId) {
    const itens =
      state.participante &&
      Array.isArray(
        state.participante.itens
      )
        ? state.participante.itens
        : [];

    return (
      itens.find(function (item) {
        return item.id === itemId;
      }) || null
    );
  }

  function getSelectedItems() {
    const selecionados = [];

    state.quantidades.forEach(
      function (
        quantidade,
        itemId
      ) {
        const item =
          encontrarItemPorId(
            itemId
          );

        if (
          item &&
          quantidade > 0
        ) {
          selecionados.push({
            id: item.id,
            nome: item.nome,
            quantidade:
              quantidade
          });
        }
      }
    );

    return selecionados;
  }

  function atualizarBarraSelecao() {
    const selecionados =
      getSelectedItems();

    const totalItens =
      selecionados.length;

    const totalUnidades =
      selecionados.reduce(
        function (
          sum,
          item
        ) {
          return (
            sum +
            item.quantidade
          );
        },
        0
      );

    elements.selectionBar.hidden =
      totalItens === 0 ||
      state.appState !==
        APP_STATES.PARTICIPANT_FOUND;

    if (totalItens === 0) {
      elements.selectionCount.textContent =
        '0 itens selecionados';

      return;
    }

    const textoItens =
      totalItens === 1
        ? '1 item'
        : totalItens +
          ' itens';

    const textoUnidades =
      totalUnidades === 1
        ? '1 unidade'
        : totalUnidades +
          ' unidades';

    elements.selectionCount.textContent =
      textoUnidades +
      ' em ' +
      textoItens;
  }

  function openConfirmation() {
    const selecionados =
      getSelectedItems();

    if (
      !state.participante ||
      selecionados.length === 0
    ) {
      return;
    }

    state.lastFocusedElement =
      document.activeElement;

    setAppState(
      APP_STATES.CONFIRMING
    );

    elements.confirmationTitle.textContent =
      'Confirmar retirada?';

    elements.confirmationParticipant.textContent =
      state.participante.nome +
      ' • ' +
      state.participante
        .identificadorMascarado;

    elements.confirmationList
      .replaceChildren();

    selecionados.forEach(
      function (item) {
        const li =
          document.createElement(
            'li'
          );

        li.textContent =
          item.quantidade +
          ' × ' +
          item.nome;

        elements.confirmationList
          .appendChild(li);
      }
    );

    elements.confirmationSheet.hidden =
      false;

    elements.btnConfirmSave.focus();
  }

  function closeConfirmation() {
    if (
      elements.confirmationSheet.hidden
    ) {
      return;
    }

    elements.confirmationSheet.hidden =
      true;

    if (
      state.appState ===
      APP_STATES.CONFIRMING
    ) {
      setAppState(
        APP_STATES.PARTICIPANT_FOUND
      );
    }

    if (
      state.lastFocusedElement &&
      typeof state.lastFocusedElement
        .focus === 'function'
    ) {
      state.lastFocusedElement.focus();
    }
  }

  async function confirmarRetirada() {
    const itens =
      getSelectedItems();

    if (
      !state.participante ||
      !state.identificacaoAtual ||
      itens.length === 0 ||
      state.appState ===
        APP_STATES.SAVING
    ) {
      return;
    }

    elements.confirmationSheet.hidden =
      true;

    setAppState(
      APP_STATES.SAVING
    );

    try {
      const response =
        await window.RetiradaAPI
          .registrarRetiradas({
            tipoParticipante:
              state.identificacaoAtual
                .tipoParticipante,

            identificador:
              state.identificacaoAtual
                .identificador,

            itens:
              itens.map(
                function (item) {
                  return {
                    id: item.id,
                    quantidade:
                      item.quantidade
                  };
                }
              )
          });

      const data =
        response.data || {};

      const registrados =
        Array.isArray(
          data.itensRegistrados
        )
          ? data.itensRegistrados
          : [];

      setAppState(
        APP_STATES.SUCCESS,
        {
          title:
            registrados.length
              ? 'Retirada registrada'
              : 'Nenhum item registrado',

          message:
            registrados.length
              ? 'As quantidades foram registradas com sucesso.'
              : 'Nenhuma quantidade pôde ser registrada.',

          data: data
        }
      );

      scheduleAutoReset();

    } catch (error) {
      console.error(
        'Erro ao registrar retirada:',
        error
      );

      setAppState(
        APP_STATES.ERROR,
        {
          title:
            'Não foi possível registrar',

          message:
            mapErrorMessage(error),

          data:
            error.details &&
            error.details.data
        }
      );
    }
  }

  function renderResultado(
    type,
    details
  ) {
    const isSuccess =
      type === APP_STATES.SUCCESS;

    const isNotFound =
      type === APP_STATES.NOT_FOUND;

    elements.resultCard.className =
      'result-card ' +
      (
        isSuccess
          ? 'success'
          : 'error'
      );

    elements.resultIcon.innerHTML =
      isSuccess
        ? ICONS.check
        : ICONS.alert;

    elements.resultTitle.textContent =
      details.title ||
      (
        isSuccess
          ? 'Operação concluída'
          : 'Algo deu errado'
      );

    elements.resultMessage.textContent =
      details.message || '';

    elements.resultDetails
      .replaceChildren();

    if (details.data) {
      renderResultadoDetalhes(
        details.data
      );
    }

    elements.btnNewSearch.textContent =
      isNotFound
        ? 'Tentar novamente'
        : 'Nova consulta';
  }

  function renderResultadoDetalhes(data) {
    const registrados =
      Array.isArray(
        data.itensRegistrados
      )
        ? data.itensRegistrados.map(
            function (item) {
              const nome =
                item.nome ||
                item.item ||
                item.id;

              const quantidade =
                Number(
                  item.quantidade
                ) || 1;

              const saldo =
                Number(
                  item.saldoAposRetirada
                );

              const complemento =
                Number.isFinite(saldo)
                  ? ' • Saldo: ' +
                    saldo
                  : '';

              return (
                quantidade +
                ' × ' +
                nome +
                complemento
              );
            }
          )
        : [];

    if (registrados.length) {
      elements.resultDetails
        .appendChild(
          criarGrupoDetalhe(
            'Itens registrados',
            registrados
          )
        );
    }

    const ignorados =
      Array.isArray(
        data.itensIgnorados
      )
        ? data.itensIgnorados.map(
            function (item) {
              if (
                typeof item ===
                'string'
              ) {
                return item;
              }

              const nome =
                item.nome ||
                item.item ||
                item.id;

              return (
                nome +
                ': ' +
                traduzirMotivoIgnorado(
                  item.motivo,
                  item.saldoDisponivel
                )
              );
            }
          )
        : [];

    if (ignorados.length) {
      elements.resultDetails
        .appendChild(
          criarGrupoDetalhe(
            'Itens não registrados',
            ignorados
          )
        );
    }
  }

  function criarGrupoDetalhe(
    titulo,
    itens
  ) {
    const group =
      document.createElement(
        'div'
      );

    group.className =
      'detail-group';

    const strong =
      document.createElement(
        'strong'
      );

    strong.textContent =
      titulo;

    const list =
      document.createElement(
        'ul'
      );

    itens.forEach(function (item) {
      const li =
        document.createElement(
          'li'
        );

      li.textContent =
        item;

      list.appendChild(li);
    });

    group.append(
      strong,
      list
    );

    return group;
  }

  function traduzirMotivoIgnorado(
    motivo,
    saldoDisponivel
  ) {
    const mensagens = {
      ITEM_NAO_CONFIGURADO:
        'item não configurado',

      ITEM_INATIVO:
        'item inativo',

      COLUNA_NAO_ENCONTRADA:
        'coluna não encontrada',

      SEM_DIREITO:
        'participante sem direito',

      SALDO_ESGOTADO:
        'saldo esgotado',

      QUANTIDADE_MAIOR_QUE_SALDO:
        'quantidade superior ao saldo disponível'
    };

    const mensagem =
      mensagens[motivo] ||
      motivo ||
      'não registrado';

    if (
      motivo ===
        'QUANTIDADE_MAIOR_QUE_SALDO' &&
      Number.isFinite(
        Number(
          saldoDisponivel
        )
      )
    ) {
      return (
        mensagem +
        ' (' +
        saldoDisponivel +
        ')'
      );
    }

    return mensagem;
  }

  function resetApplication() {
    clearResetTimer();
    closeConfirmation();
    closeQrReader();

    state.identificadorDigitado = '';
    state.identificacaoAtual = null;
    state.participante = null;

    state.quantidades.clear();

    elements.input.value = '';

    atualizarDisplayIdentificador();

    setAppState(
      APP_STATES.IDLE
    );
  }

  async function openQrReader() {
    state.lastFocusedElement =
      document.activeElement;

    elements.qrSheet.hidden =
      false;

    elements.qrMessage.textContent =
      'Preparando câmera...';

    try {
      await carregarQrLibrary();

      if (!state.qrScanner) {
        state.qrScanner =
          new window.Html5Qrcode(
            'qr-reader'
          );
      }

      state.qrReading = false;

      await state.qrScanner.start(
        {
          facingMode:
            'environment'
        },

        {
          fps: 8,

          qrbox: {
            width: 220,
            height: 220
          }
        },

        handleQrSuccess,

        function () {}
      );

      elements.qrMessage.textContent =
        'Aponte a câmera para o QR Code da matrícula ou CPF.';

    } catch (error) {
      console.error(
        'Erro ao abrir leitor QR:',
        error
      );

      elements.qrMessage.textContent =
        'Não foi possível abrir a câmera. Use a digitação manual.';
    }
  }

  async function closeQrReader() {
    if (
      state.qrScanner &&
      state.qrScanner.isScanning
    ) {
      try {
        await state.qrScanner.stop();

      } catch (error) {
        console.warn(
          'Erro ao fechar leitor QR:',
          error
        );
      }
    }

    elements.qrSheet.hidden =
      true;

    elements.qrMessage.textContent =
      '';

    if (
      state.lastFocusedElement &&
      typeof state.lastFocusedElement
        .focus === 'function'
    ) {
      state.lastFocusedElement.focus();
    }
  }

  async function handleQrSuccess(
    decodedText
  ) {
    if (state.qrReading) {
      return;
    }

    state.qrReading = true;

    const identificador =
      extrairIdentificadorDoQr(
        decodedText
      );

    await closeQrReader();

    if (!identificador) {
      showToast(
        'QR Code sem matrícula ou CPF reconhecido.',
        'error'
      );

      return;
    }

    state.identificadorDigitado =
      identificador;

    elements.input.value =
      identificador;

    atualizarDisplayIdentificador();
    consultarParticipante();
  }

  function carregarQrLibrary() {
    if (window.Html5Qrcode) {
      return Promise.resolve();
    }

    return new Promise(
      function (
        resolve,
        reject
      ) {
        const script =
          document.createElement(
            'script'
          );

        script.src =
          (
            window.APP_CONFIG &&
            window.APP_CONFIG
              .QR_LIBRARY_URL
          ) || '';

        script.async = true;

        script.onload =
          resolve;

        script.onerror =
          function () {
            reject(
              window.RetiradaAPI
                .criarErroAplicacao(
                  'QR_BIBLIOTECA_ERRO',
                  'Falha ao carregar leitor QR.'
                )
            );
          };

        document.head.appendChild(
          script
        );
      }
    );
  }

  function extrairIdentificadorDoQr(
    texto
  ) {
    const valor =
      String(
        texto || ''
      ).trim();

    try {
      const url =
        new URL(valor);

      const param =
        url.searchParams.get(
          'cpf'
        ) ||
        url.searchParams.get(
          'matricula'
        ) ||
        url.searchParams.get(
          'mat'
        ) ||
        url.searchParams.get(
          'identificador'
        ) ||
        url.searchParams.get(
          'codigo'
        );

      if (param) {
        return sanitizarEntradaNumerica(
          param
        ).slice(0, 11);
      }

    } catch (error) {
      /*
       * QR Codes simples podem conter
       * somente os números.
       */
    }

    return sanitizarEntradaNumerica(
      valor
    ).slice(0, 11);
  }

  function handleSheetBackdropClick(
    event
  ) {
    if (
      event.target ===
      elements.confirmationSheet
    ) {
      closeConfirmation();
    }

    if (
      event.target ===
      elements.qrSheet
    ) {
      closeQrReader();
    }
  }

  function showToast(
    message,
    type
  ) {
    const toast =
      document.createElement(
        'div'
      );

    toast.className =
      (
        'toast ' +
        (type || '')
      ).trim();

    toast.textContent =
      message;

    elements.toastRegion.appendChild(
      toast
    );

    window.setTimeout(
      function () {
        toast.remove();
      },
      4200
    );
  }

  function mapErrorMessage(error) {
    const messages = {
      CONFIG_API_URL_AUSENTE:
        'Configure a URL do Web App em js/config.js.',

      IDENTIFICADOR_VAZIO:
        'Digite a matrícula ou o CPF.',

      IDENTIFICADOR_INVALIDO:
        'Digite uma matrícula de até 4 dígitos ou um CPF com 11 dígitos.',

      MATRICULA_INVALIDA:
        'A matrícula deve possuir até 4 dígitos.',

      CPF_INVALIDO:
        'O CPF informado é inválido.',

      TIMEOUT:
        'A planilha demorou para responder. Tente novamente.',

      ERRO_REDE:
        'Verifique a internet e tente novamente.',

      ERRO_HTTP:
        'O servidor não respondeu corretamente.',

      RESPOSTA_INVALIDA:
        'A resposta do servidor não pôde ser lida.',

      PARTICIPANTE_NAO_ENCONTRADO:
        'Participante não encontrado.',

      CHAVE_BUSCA_DUPLICADA:
        'Existe mais de um cadastro com este identificador.',

      QUANTIDADE_MAIOR_QUE_SALDO:
        'A quantidade escolhida supera o saldo disponível.',

      SALDO_ESGOTADO:
        'O saldo deste item já foi utilizado.',

      ERRO_LOCK:
        'Outro atendimento está gravando agora. Tente novamente em instantes.',

      ERRO_INTERNO:
        'Ocorreu um erro interno na planilha.'
    };

    return (
      messages[
        error && error.code
      ] ||
      (
        error &&
        error.message
      ) ||
      'Não foi possível concluir a operação.'
    );
  }

  function sanitizarEntradaNumerica(
    valor
  ) {
    return String(
      valor || ''
    ).replace(
      /\D+/g,
      ''
    );
  }

  function limparDadosParticipante() {
    elements.cardEyebrow.textContent =
      'Participante';

    elements.participantName.textContent =
      '';

    elements.participantMatricula.textContent =
      '';

    elements.itemsContainer
      .replaceChildren();

    elements.resultDetails
      .replaceChildren();
  }

  function focarEntrada() {
    const touchInterface =
      window.matchMedia(
        '(pointer: coarse)'
      ).matches ||
      window.matchMedia(
        '(hover: none)'
      ).matches;

    if (
      touchInterface ||
      elements.input.readOnly
    ) {
      return;
    }

    window.setTimeout(
      function () {
        elements.input.focus();
      },
      0
    );
  }

  function scheduleAutoReset() {
    const timeoutMs =
      Number(
        window.APP_CONFIG &&
        window.APP_CONFIG
          .AUTO_RESET_SUCCESS_MS
      ) || 4500;

    state.resetTimer =
      window.setTimeout(
        resetApplication,
        timeoutMs
      );
  }

  function clearResetTimer() {
    if (state.resetTimer) {
      window.clearTimeout(
        state.resetTimer
      );

      state.resetTimer =
        null;
    }
  }

  function registrarServiceWorker() {
    if (
      'serviceWorker' in navigator &&
      window.location.protocol !==
        'file:'
    ) {
      navigator.serviceWorker
        .register('sw.js')
        .catch(function (error) {
          console.warn(
            'Service worker não registrado:',
            error
          );
        });
    }
  }
})();