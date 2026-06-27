/**
 * ============================================================================
 * APLICAÇÃO FRONT-END
 * ============================================================================
 *
 * Projeto:
 * Controle de retirada de alimentos — Almoço Junino 2026
 *
 * Responsabilidades:
 * - controlar os estados da interface;
 * - receber e normalizar a matrícula;
 * - consultar participantes;
 * - apresentar os alimentos disponíveis e já retirados;
 * - selecionar e confirmar retiradas;
 * - apresentar resultados e erros;
 * - controlar o leitor opcional de QR Code;
 * - apresentar ícones específicos para cada alimento.
 *
 * Versão: 2.0
 * Data: 27/06/2026
 * ============================================================================
 */

(function () {
  'use strict';

  const APP_STATES = {
    IDLE: 'IDLE',
    LOADING: 'LOADING',
    PARTICIPANT_FOUND: 'PARTICIPANT_FOUND',
    NOT_FOUND: 'NOT_FOUND',
    CONFIRMING: 'CONFIRMING',
    SAVING: 'SAVING',
    SUCCESS: 'SUCCESS',
    ERROR: 'ERROR'
  };

  const STATUS_LABELS = {
    DISPONIVEL: 'Disponível',
    RETIRADO: 'Já retirado',
    NAO_AUTORIZADO: 'Não disponível para este participante'
  };

  /**
   * Apenas estas duas seções serão apresentadas.
   *
   * Itens com status NAO_AUTORIZADO continuam podendo existir na API,
   * porém não serão exibidos na interface atual.
   */
  const STATUS_SECTIONS = [
    {
      status: 'DISPONIVEL',
      title: 'Disponíveis para retirada',
      empty: 'Nenhum alimento disponível para retirada.'
    },
    {
      status: 'RETIRADO',
      title: 'Já retirados',
      empty: 'Nenhum alimento foi retirado ainda.'
    }
  ];

  const ICONS = {
    /**
     * Cachorro-quente.
     */
    hotDog:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M5 15.5c-1.8 0-3-1.3-3-3s1.2-3 3-3h14c1.8 0 3 1.3 3 3s-1.2 3-3 3Z"/>' +
        '<path d="M5 9.5c1.1-2.6 3.4-4 7-4s5.9 1.4 7 4"/>' +
        '<path d="M5 15.5c1.1 2.2 3.4 3.5 7 3.5s5.9-1.3 7-3.5"/>' +
        '<path d="m7.5 12.5 2-1.5 2 1.5 2-1.5 2 1.5 2-1.5"/>' +
      '</svg>',

    /**
     * Tigela de caldo ou sopa.
     */
    soup:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M4 11h16c0 5-3.3 8-8 8s-8-3-8-8Z"/>' +
        '<path d="M7 19h10"/>' +
        '<path d="M8 8c-1-1-.6-2 .2-3"/>' +
        '<path d="M12 8c-1-1-.6-2 .2-3"/>' +
        '<path d="M16 8c-1-1-.6-2 .2-3"/>' +
      '</svg>',

    /**
     * Pipoca.
     */
    popcorn:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M6 10h12l-1.2 10H7.2Z"/>' +
        '<path d="M8 10 9 20"/>' +
        '<path d="M12 10v10"/>' +
        '<path d="m16 10-1 10"/>' +
        '<path d="M7 10a3 3 0 1 1 3-3"/>' +
        '<path d="M10 7a3 3 0 1 1 4.8 2.4"/>' +
        '<path d="M14 7a3 3 0 1 1 3 3"/>' +
      '</svg>',

    /**
     * Tigela para canjica.
     */
    canjica:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M4 11h16c0 5-3.2 8-8 8s-8-3-8-8Z"/>' +
        '<path d="M7 19h10"/>' +
        '<circle cx="8" cy="8" r="1"/>' +
        '<circle cx="12" cy="7" r="1"/>' +
        '<circle cx="16" cy="8" r="1"/>' +
        '<circle cx="10" cy="10" r="1"/>' +
        '<circle cx="14" cy="10" r="1"/>' +
      '</svg>',

    /**
     * Fatia de bolo.
     */
    cake:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M5 10 19 6v13H5Z"/>' +
        '<path d="M5 14h14"/>' +
        '<path d="M8 12h.01"/>' +
        '<path d="M12 11h.01"/>' +
        '<path d="M16 10h.01"/>' +
        '<path d="M5 10c2 1 3-1 5 0s3-1 5 0 2-1 4-1"/>' +
      '</svg>',

    /**
     * Copo de refrigerante.
     */
    drink:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M7 8h10l-1 12H8Z"/>' +
        '<path d="M6 8h12"/>' +
        '<path d="m13 8 2-5h3"/>' +
        '<path d="M9 12h6"/>' +
      '</svg>',

    /**
     * Doces.
     */
    candy:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="m8 8 8 8"/>' +
        '<path d="M9.5 6.5a4 4 0 0 1 5.7 0l2.3 2.3a4 4 0 0 1 0 5.7l-3 3a4 4 0 0 1-5.7 0l-2.3-2.3a4 4 0 0 1 0-5.7Z"/>' +
        '<path d="m6.5 9.5-3-1 1 3-2 2 3 1"/>' +
        '<path d="m17.5 14.5 3 1-1-3 2-2-3-1"/>' +
      '</svg>',

    /**
     * Ícone genérico utilizado como alternativa.
     */
    food:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M4 3v18"/>' +
        '<path d="M8 3v8a4 4 0 0 1-4 4"/>' +
        '<path d="M14 3v18"/>' +
        '<path d="M14 3c3 0 6 3 6 7v2c0 2-1.5 3.5-3.5 3.5H14"/>' +
      '</svg>',

    check:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="m5 12 4 4L19 6"/>' +
      '</svg>',

    plus:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M12 5v14"/>' +
        '<path d="M5 12h14"/>' +
      '</svg>',

    lock:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<rect x="5" y="11" width="14" height="10" rx="2"/>' +
        '<path d="M8 11V8a4 4 0 0 1 8 0v3"/>' +
      '</svg>',

    alert:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M12 9v4"/>' +
        '<path d="M12 17h.01"/>' +
        '<path d="M10.3 4.4 2.8 17.5A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.5L13.7 4.4a2 2 0 0 0-3.4 0Z"/>' +
      '</svg>'
  };

  /**
   * Associação entre o ID do alimento e seu ícone.
   */
  const ITEM_ICONS = {
    cachorro_quente_01: ICONS.hotDog,
    cachorro_quente_02: ICONS.hotDog,
    caldo_mandioca: ICONS.soup,
    pipoca: ICONS.popcorn,
    canjica: ICONS.canjica,
    bolo: ICONS.cake,
    refrigerante_01: ICONS.drink,
    refrigerante_02: ICONS.drink,
    doces_tipicos: ICONS.candy
  };

  const state = {
    appState: APP_STATES.IDLE,
    matriculaDigitada: '',
    participante: null,
    selecionados: new Set(),
    resetTimer: null,
    qrScanner: null,
    qrReading: false,
    lastFocusedElement: null
  };

  const elements = {};

  document.addEventListener('DOMContentLoaded', init);

  /**
   * Inicializa a aplicação.
   */
  function init() {
    cacheElements();
    bindEvents();
    setAppState(APP_STATES.IDLE);
    atualizarDisplayMatricula();
    focarEntrada();
    registrarServiceWorker();
  }

  /**
   * Localiza e armazena os elementos do HTML utilizados pela aplicação.
   */
  function cacheElements() {
    elements.screens = {
      idle: document.getElementById('screen-idle'),
      loading: document.getElementById('screen-loading'),
      participant: document.getElementById('screen-participant'),
      result: document.getElementById('screen-result')
    };

    elements.input = document.getElementById('matricula-input');
    elements.display = document.getElementById('display-matricula');
    elements.keypad = document.querySelector('.keypad');

    elements.btnClear = document.getElementById('btn-clear');
    elements.btnBackspace = document.getElementById('btn-backspace');
    elements.btnSearch = document.getElementById('btn-search');

    elements.btnOpenQr = document.getElementById('btn-open-qr');
    elements.btnCloseQr = document.getElementById('btn-close-qr');

    elements.qrSheet = document.getElementById('qr-sheet');
    elements.qrReader = document.getElementById('qr-reader');
    elements.qrMessage = document.getElementById('qr-message');

    elements.participantName =
      document.getElementById('participant-name');

    elements.participantMatricula =
      document.getElementById('participant-matricula');

    elements.itemsContainer =
      document.getElementById('items-container');

    elements.selectionBar =
      document.getElementById('selection-bar');

    elements.selectionCount =
      document.getElementById('selection-count');

    elements.btnConfirmOpen =
      document.getElementById('btn-confirm-open');

    elements.confirmationSheet =
      document.getElementById('confirmation-sheet');

    elements.confirmationTitle =
      document.getElementById('confirmation-title');

    elements.confirmationParticipant =
      document.getElementById('confirmation-participant');

    elements.confirmationList =
      document.getElementById('confirmation-list');

    elements.btnCancelConfirmation =
      document.getElementById('btn-cancel-confirmation');

    elements.btnConfirmSave =
      document.getElementById('btn-confirm-save');

    elements.resultCard =
      document.getElementById('result-card');

    elements.resultIcon =
      document.getElementById('result-icon');

    elements.resultTitle =
      document.getElementById('result-title');

    elements.resultMessage =
      document.getElementById('result-message');

    elements.resultDetails =
      document.getElementById('result-details');

    elements.btnNewSearch =
      document.getElementById('btn-new-search');

    elements.toastRegion =
      document.getElementById('toast-region');
  }

  /**
   * Configura os eventos da interface.
   */
  function bindEvents() {
    elements.keypad.addEventListener(
      'click',
      handleKeypadClick
    );

    elements.btnClear.addEventListener(
      'click',
      limparMatricula
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

  /**
   * Altera o estado atual da aplicação.
   */
  function setAppState(nextState, details) {
    state.appState = nextState;

    clearResetTimer();

    Object.values(elements.screens).forEach(
      function (screen) {
        screen.classList.remove('screen-active');
      }
    );

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
    }

    if (nextState === APP_STATES.LOADING) {
      elements.screens.loading.classList.add(
        'screen-active'
      );
    }

    if (
      nextState === APP_STATES.PARTICIPANT_FOUND
    ) {
      elements.screens.participant.classList.add(
        'screen-active'
      );

      atualizarBarraSelecao();
    }

    if (nextState === APP_STATES.CONFIRMING) {
      elements.screens.participant.classList.add(
        'screen-active'
      );

      atualizarBarraSelecao();
    }

    if (nextState === APP_STATES.SAVING) {
      elements.screens.loading.classList.add(
        'screen-active'
      );

      document.querySelector(
        '#screen-loading h2'
      ).textContent = 'Registrando retirada...';
    } else {
      document.querySelector(
        '#screen-loading h2'
      ).textContent = 'Consultando participante...';
    }

    if (
      nextState === APP_STATES.SUCCESS ||
      nextState === APP_STATES.ERROR ||
      nextState === APP_STATES.NOT_FOUND
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

  /**
   * Trata o clique no teclado numérico virtual.
   */
  function handleKeypadClick(event) {
    const button =
      event.target.closest('[data-digit]');

    if (
      !button ||
      state.appState !== APP_STATES.IDLE
    ) {
      return;
    }

    adicionarDigito(button.dataset.digit);
  }

  /**
   * Trata alterações realizadas pelo teclado físico.
   */
  function handleInputChange(event) {
    state.matriculaDigitada =
      sanitizarEntradaNumerica(
        event.target.value
      );

    event.target.value =
      state.matriculaDigitada;

    atualizarDisplayMatricula();
  }

  /**
   * Consulta ao pressionar Enter.
   */
  function handleInputKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      consultarParticipante();
    }
  }

  /**
   * Controla os atalhos do teclado físico.
   */
  function handleGlobalKeydown(event) {
    if (
      document.activeElement &&
      ['BUTTON', 'TEXTAREA', 'SELECT'].includes(
        document.activeElement.tagName
      )
    ) {
      return;
    }

    if (state.appState !== APP_STATES.IDLE) {
      if (event.key === 'Escape') {
        closeConfirmation();
        closeQrReader();
      }

      return;
    }

    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      adicionarDigito(event.key);
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      apagarUltimoDigito();
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      consultarParticipante();
    }
  }

  /**
   * Adiciona um dígito à matrícula.
   */
  function adicionarDigito(digito) {
    state.matriculaDigitada =
      sanitizarEntradaNumerica(
        state.matriculaDigitada + digito
      ).slice(0, 12);

    elements.input.value =
      state.matriculaDigitada;

    atualizarDisplayMatricula();
    focarEntrada();
  }

  /**
   * Remove o último dígito.
   */
  function apagarUltimoDigito() {
    state.matriculaDigitada =
      state.matriculaDigitada.slice(0, -1);

    elements.input.value =
      state.matriculaDigitada;

    atualizarDisplayMatricula();
    focarEntrada();
  }

  /**
   * Limpa a matrícula.
   */
  function limparMatricula() {
    state.matriculaDigitada = '';
    elements.input.value = '';

    atualizarDisplayMatricula();
    focarEntrada();
  }

  /**
   * Atualiza o visor da matrícula.
   */
  function atualizarDisplayMatricula() {
    const normalizada =
      window.RetiradaAPI.normalizarMatricula(
        state.matriculaDigitada
      );

    elements.display.textContent =
      normalizada || '000000';
  }

  /**
   * Consulta o participante.
   */
  async function consultarParticipante() {
    if (state.appState === APP_STATES.LOADING) {
      return;
    }

    const matricula =
      window.RetiradaAPI.normalizarMatricula(
        state.matriculaDigitada
      );

    if (!matricula) {
      showToast(
        'Digite uma matrícula para consultar.',
        'error'
      );

      focarEntrada();
      return;
    }

    setAppState(APP_STATES.LOADING);

    try {
      const response =
        await window.RetiradaAPI.buscarParticipante(
          matricula
        );

      state.participante = response.data;
      state.selecionados.clear();

      renderParticipant(response.data);

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
        setAppState(
          APP_STATES.NOT_FOUND,
          {
            title: 'Matrícula não encontrada',
            message:
              error.message ||
              'Confira o número e tente novamente.'
          }
        );
      } else {
        setAppState(
          APP_STATES.ERROR,
          {
            title: 'Não foi possível consultar',
            message: mapErrorMessage(error)
          }
        );
      }
    }
  }

  /**
   * Apresenta os dados do participante.
   */
  function renderParticipant(participante) {
    elements.participantName.textContent =
      participante.nome ||
      'Participante sem nome';

    elements.participantMatricula.textContent =
      montarDescricaoParticipante(
        participante
      );

    renderItems(
      participante.itens || []
    );
  }

  /**
   * Monta a descrição contendo matrícula e setor.
   */
  function montarDescricaoParticipante(
    participante
  ) {
    const detalhes = [];

    if (participante.matricula) {
      detalhes.push(
        'Matrícula ' +
        participante.matricula
      );
    }

    if (participante.setor) {
      detalhes.push(
        'Setor: ' +
        participante.setor
      );
    }

    return detalhes.join(' • ');
  }

  /**
   * Renderiza as seções visíveis de alimentos.
   */
  function renderItems(itens) {
    elements.itemsContainer.replaceChildren();

    STATUS_SECTIONS.forEach(
      function (section) {
        const sectionElement =
          document.createElement('section');

        sectionElement.className =
          'items-section';

        const title =
          document.createElement('h3');

        title.textContent =
          section.title;

        sectionElement.appendChild(title);

        const itemsByStatus =
          itens.filter(function (item) {
            return (
              item.status === section.status
            );
          });

        if (!itemsByStatus.length) {
          const empty =
            document.createElement('p');

          empty.className =
            'empty-section';

          empty.textContent =
            section.empty;

          sectionElement.appendChild(empty);
        } else {
          const grid =
            document.createElement('div');

          grid.className =
            'items-grid';

          itemsByStatus.forEach(
            function (item) {
              grid.appendChild(
                criarItemCard(item)
              );
            }
          );

          sectionElement.appendChild(grid);
        }

        elements.itemsContainer.appendChild(
          sectionElement
        );
      }
    );
  }

  /**
   * Cria um cartão de alimento.
   */
  function criarItemCard(item) {
    const isDisponivel =
      item.status === 'DISPONIVEL';

    const selected =
      state.selecionados.has(item.id);

    const card =
      document.createElement('button');

    card.type = 'button';
    card.className = 'item-card';

    card.dataset.itemId = item.id;
    card.dataset.status = item.status;
    card.dataset.selected = String(selected);

    card.disabled = !isDisponivel;

    card.setAttribute(
      'aria-pressed',
      isDisponivel
        ? String(selected)
        : 'false'
    );

    card.setAttribute(
      'aria-label',
      item.nome +
        '. ' +
        (
          STATUS_LABELS[item.status] ||
          item.status
        )
    );

    const icon =
      document.createElement('span');

    icon.className = 'item-icon';
    icon.innerHTML =
      obterIconeItem(item.id);

    const text =
      document.createElement('span');

    const name =
      document.createElement('span');

    name.className = 'item-name';
    name.textContent = item.nome;

    const status =
      document.createElement('span');

    status.className = 'item-status';

    status.textContent =
      STATUS_LABELS[item.status] ||
      item.status;

    text.append(
      name,
      status
    );

    const indicator =
      document.createElement('span');

    indicator.className =
      'status-indicator';

    indicator.innerHTML =
      getIndicatorIcon(
        item.status,
        selected
      );

    card.append(
      icon,
      text,
      indicator
    );

    if (isDisponivel) {
      card.addEventListener(
        'click',
        function () {
          toggleItemSelection(item.id);
        }
      );
    }

    return card;
  }

  /**
   * Retorna o ícone específico do alimento.
   */
  function obterIconeItem(itemId) {
    return (
      ITEM_ICONS[itemId] ||
      ICONS.food
    );
  }

  /**
   * Retorna o ícone do indicador de status.
   */
  function getIndicatorIcon(
    status,
    selected
  ) {
    if (status === 'RETIRADO') {
      return ICONS.check;
    }

    if (status === 'NAO_AUTORIZADO') {
      return ICONS.lock;
    }

    return selected
      ? ICONS.check
      : ICONS.plus;
  }

  /**
   * Seleciona ou desmarca um alimento.
   */
  function toggleItemSelection(itemId) {
    if (state.selecionados.has(itemId)) {
      state.selecionados.delete(itemId);
    } else {
      state.selecionados.add(itemId);
    }

    renderItems(
      state.participante.itens || []
    );

    atualizarBarraSelecao();
  }

  /**
   * Atualiza a barra inferior.
   */
  function atualizarBarraSelecao() {
    const total =
      state.selecionados.size;

    elements.selectionBar.hidden =
      total === 0 ||
      state.appState === APP_STATES.SAVING;

    elements.selectionCount.textContent =
      total === 1
        ? '1 item selecionado'
        : total + ' itens selecionados';
  }

  /**
   * Abre a tela de confirmação.
   */
  function openConfirmation() {
    if (
      !state.participante ||
      !state.selecionados.size
    ) {
      return;
    }

    state.lastFocusedElement =
      document.activeElement;

    setAppState(APP_STATES.CONFIRMING);

    elements.confirmationTitle.textContent =
      'Confirmar retirada para ' +
      state.participante.nome +
      '?';

    elements.confirmationParticipant.textContent =
      montarDescricaoParticipante(
        state.participante
      );

    elements.confirmationList.replaceChildren();

    getSelectedItems().forEach(
      function (item) {
        const li =
          document.createElement('li');

        li.textContent = item.nome;

        elements.confirmationList.appendChild(
          li
        );
      }
    );

    elements.confirmationSheet.hidden =
      false;

    elements.btnConfirmSave.focus();
  }

  /**
   * Fecha a tela de confirmação.
   */
  function closeConfirmation() {
    if (elements.confirmationSheet.hidden) {
      return;
    }

    elements.confirmationSheet.hidden = true;

    if (
      state.appState ===
      APP_STATES.CONFIRMING
    ) {
      setAppState(
        APP_STATES.PARTICIPANT_FOUND
      );
    }

    if (state.lastFocusedElement) {
      state.lastFocusedElement.focus();
    }
  }

  /**
   * Envia a retirada para a API.
   */
  async function confirmarRetirada() {
    if (
      !state.participante ||
      !state.selecionados.size ||
      state.appState === APP_STATES.SAVING
    ) {
      return;
    }

    const itens =
      Array.from(state.selecionados);

    elements.confirmationSheet.hidden =
      true;

    setAppState(APP_STATES.SAVING);

    try {
      const response =
        await window.RetiradaAPI.registrarRetiradas({
          matricula:
            state.participante.matricula,

          itens: itens
        });

      const registrados =
        response.data &&
        Array.isArray(
          response.data.itensRegistrados
        )
          ? response.data.itensRegistrados.length
          : 0;

      setAppState(
        APP_STATES.SUCCESS,
        {
          title: registrados
            ? 'Retirada registrada'
            : 'Nenhum item registrado',

          message:
            response.message ||
            'Operação concluída.',

          data: response.data
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

  /**
   * Apresenta a tela de resultado.
   */
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

    elements.resultDetails.replaceChildren();

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

  /**
   * Apresenta itens registrados e ignorados.
   */
  function renderResultadoDetalhes(data) {
    if (
      Array.isArray(
        data.itensRegistrados
      ) &&
      data.itensRegistrados.length
    ) {
      const registrados =
        data.itensRegistrados.map(
          formatarItemResultado
        );

      elements.resultDetails.appendChild(
        criarGrupoDetalhe(
          'Itens registrados',
          registrados
        )
      );
    }

    if (
      Array.isArray(
        data.itensIgnorados
      ) &&
      data.itensIgnorados.length
    ) {
      const ignorados =
        data.itensIgnorados.map(
          formatarItemIgnorado
        );

      elements.resultDetails.appendChild(
        criarGrupoDetalhe(
          'Itens ignorados',
          ignorados
        )
      );
    }
  }

  /**
   * Converte um item retornado pela API em texto.
   */
  function formatarItemResultado(item) {
    if (
      typeof item === 'string' ||
      typeof item === 'number'
    ) {
      return String(item);
    }

    if (
      !item ||
      typeof item !== 'object'
    ) {
      return 'Item não identificado';
    }

    return String(
      item.nome ||
      item.itemNome ||
      item.label ||
      item.id ||
      item.itemId ||
      'Item não identificado'
    );
  }

  /**
   * Converte um item ignorado em texto.
   */
  function formatarItemIgnorado(item) {
    if (
      typeof item === 'string' ||
      typeof item === 'number'
    ) {
      return String(item);
    }

    if (
      !item ||
      typeof item !== 'object'
    ) {
      return (
        'Item não identificado: ' +
        'não registrado'
      );
    }

    const nome =
      formatarItemResultado(item);

    const motivo =
      String(
        item.motivo ||
        item.reason ||
        item.message ||
        item.erro ||
        'não registrado'
      );

    return nome + ': ' + motivo;
  }

  /**
   * Cria um grupo de detalhes.
   */
  function criarGrupoDetalhe(
    titulo,
    itens
  ) {
    const group =
      document.createElement('div');

    group.className = 'detail-group';

    const strong =
      document.createElement('strong');

    strong.textContent = titulo;

    const list =
      document.createElement('ul');

    itens.forEach(
      function (item) {
        const li =
          document.createElement('li');

        li.textContent = String(item);

        list.appendChild(li);
      }
    );

    group.append(
      strong,
      list
    );

    return group;
  }

  /**
   * Retorna os objetos dos itens selecionados.
   */
  function getSelectedItems() {
    const itens =
      state.participante &&
      Array.isArray(
        state.participante.itens
      )
        ? state.participante.itens
        : [];

    return itens.filter(
      function (item) {
        return state.selecionados.has(
          item.id
        );
      }
    );
  }

  /**
   * Retorna à tela inicial.
   */
  function resetApplication() {
    clearResetTimer();
    closeConfirmation();
    closeQrReader();

    state.matriculaDigitada = '';
    state.participante = null;
    state.selecionados.clear();

    elements.input.value = '';

    atualizarDisplayMatricula();

    setAppState(APP_STATES.IDLE);
  }

  /**
   * Abre o leitor de QR Code.
   */
  async function openQrReader() {
    state.lastFocusedElement =
      document.activeElement;

    elements.qrSheet.hidden = false;

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
          facingMode: 'environment'
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
        'Aponte a câmera para o QR Code.';
    } catch (error) {
      console.error(
        'Erro ao abrir leitor QR:',
        error
      );

      elements.qrMessage.textContent =
        'Não foi possível abrir a câmera. Use a digitação manual.';
    }
  }

  /**
   * Fecha o leitor de QR Code.
   */
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

    elements.qrSheet.hidden = true;
    elements.qrMessage.textContent = '';

    if (state.lastFocusedElement) {
      state.lastFocusedElement.focus();
    }
  }

  /**
   * Trata a leitura de QR Code.
   */
  async function handleQrSuccess(
    decodedText
  ) {
    if (state.qrReading) {
      return;
    }

    state.qrReading = true;

    const matricula =
      extrairMatriculaDoQr(
        decodedText
      );

    await closeQrReader();

    if (!matricula) {
      showToast(
        'QR Code sem matrícula numérica reconhecida.',
        'error'
      );

      return;
    }

    state.matriculaDigitada =
      matricula;

    elements.input.value =
      matricula;

    atualizarDisplayMatricula();
    consultarParticipante();
  }

  /**
   * Carrega a biblioteca de QR Code.
   */
  function carregarQrLibrary() {
    if (window.Html5Qrcode) {
      return Promise.resolve();
    }

    return new Promise(
      function (resolve, reject) {
        const script =
          document.createElement('script');

        script.src =
          (
            window.APP_CONFIG &&
            window.APP_CONFIG.QR_LIBRARY_URL
          ) || '';

        script.async = true;
        script.onload = resolve;

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

        document.head.appendChild(script);
      }
    );
  }

  /**
   * Extrai a matrícula do conteúdo do QR Code.
   */
  function extrairMatriculaDoQr(texto) {
    const valor =
      String(texto || '').trim();

    try {
      const url =
        new URL(valor);

      const param =
        url.searchParams.get('matricula') ||
        url.searchParams.get('mat') ||
        url.searchParams.get('codigo');

      if (param) {
        return sanitizarEntradaNumerica(
          param
        );
      }
    } catch (error) {
      // O QR Code pode conter apenas o número.
    }

    return sanitizarEntradaNumerica(
      valor
    );
  }

  /**
   * Fecha os modais ao clicar no fundo.
   */
  function handleSheetBackdropClick(event) {
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

  /**
   * Apresenta uma mensagem temporária.
   */
  function showToast(
    message,
    type
  ) {
    const toast =
      document.createElement('div');

    toast.className =
      (
        'toast ' +
        (type || '')
      ).trim();

    toast.textContent = message;

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

  /**
   * Converte códigos técnicos em mensagens.
   */
  function mapErrorMessage(error) {
    const messages = {
      CONFIG_API_URL_AUSENTE:
        'Configure a URL do Web App em js/config.js antes de consultar.',

      TIMEOUT:
        'A planilha demorou para responder. Tente novamente.',

      ERRO_REDE:
        'Verifique a internet e tente novamente.',

      RESPOSTA_INVALIDA:
        'A resposta do servidor não pode ser lida. Confira a URL do Web App.',

      PARTICIPANTE_NAO_ENCONTRADO:
        'Matrícula não encontrada.',

      ITEM_NAO_DISPONIVEL:
        'Um ou mais itens não estão mais disponíveis.',

      ERRO_LOCK:
        'Outro atendimento está gravando agora. Tente novamente em instantes.',

      SISTEMA_OCUPADO:
        'Outro atendimento está sendo registrado. Aguarde alguns instantes e tente novamente.',

      ERRO_INTERNO:
        'Ocorreu um erro interno na planilha.'
    };

    return (
      messages[error.code] ||
      error.message ||
      'Não foi possível concluir a operação.'
    );
  }

  /**
   * Mantém somente números.
   */
  function sanitizarEntradaNumerica(valor) {
    return String(valor || '')
      .replace(/\s+/g, '')
      .replace(/\D+/g, '');
  }

  /**
   * Limpa os dados das telas anteriores.
   */
  function limparDadosParticipante() {
    elements.participantName.textContent =
      '';

    elements.participantMatricula.textContent =
      '';

    elements.itemsContainer.replaceChildren();
    elements.resultDetails.replaceChildren();
  }

  /**
   * Devolve o foco ao campo numérico.
   */
  function focarEntrada() {
    window.setTimeout(
      function () {
        elements.input.focus();
      },
      0
    );
  }

  /**
   * Programa o retorno automático.
   */
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

  /**
   * Cancela o retorno automático.
   */
  function clearResetTimer() {
    if (state.resetTimer) {
      window.clearTimeout(
        state.resetTimer
      );

      state.resetTimer = null;
    }
  }

  /**
   * Registra o Service Worker.
   */
  function registrarServiceWorker() {
    if (
      'serviceWorker' in navigator &&
      window.location.protocol !== 'file:'
    ) {
      navigator.serviceWorker
        .register('sw.js')
        .catch(function (error) {
          console.warn(
            'Service Worker não registrado:',
            error
          );
        });
    }
  }
})();