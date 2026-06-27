/**
 * ============================================================================
 * AJUSTE PARA DISPOSITIVOS TOUCH
 * ============================================================================
 *
 * Objetivo:
 * Impedir que o teclado virtual do celular seja aberto quando o usuário
 * utiliza o teclado numérico próprio da aplicação.
 *
 * O ajuste não interfere no uso do teclado físico em computadores.
 *
 * Versão: 1.0
 * Data: 27/06/2026
 * ============================================================================
 */

(function () {
  'use strict';

  /**
   * Considera como interface touch principal dispositivos com ponteiro
   * grosseiro, normalmente celulares e tablets.
   */
  const IS_TOUCH_INTERFACE =
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(hover: none)').matches;

  if (!IS_TOUCH_INTERFACE) {
    return;
  }

  document.addEventListener('DOMContentLoaded', function () {
    const matriculaInput =
      document.getElementById('matricula-input');

    if (!matriculaInput) {
      return;
    }

    /**
     * Impede que o navegador abra o teclado virtual.
     *
     * O valor continua sendo controlado normalmente pelo app.js por meio
     * dos botões numéricos da página.
     */
    matriculaInput.readOnly = true;
    matriculaInput.inputMode = 'none';
    matriculaInput.setAttribute('inputmode', 'none');
    matriculaInput.setAttribute('tabindex', '-1');

    /**
     * O app.js pode solicitar foco no campo invisível. Em celulares,
     * removemos imediatamente esse foco.
     */
    matriculaInput.addEventListener('focus', function () {
      window.requestAnimationFrame(function () {
        matriculaInput.blur();
      });
    });

    /**
     * Garante que qualquer toque na aplicação feche um teclado virtual
     * que eventualmente já esteja aberto.
     */
    document.addEventListener(
      'pointerdown',
      function (event) {
        if (
          event.pointerType === 'touch' ||
          event.pointerType === 'pen'
        ) {
          matriculaInput.blur();
        }
      },
      true
    );

    document.addEventListener(
      'touchstart',
      function () {
        matriculaInput.blur();
      },
      {
        capture: true,
        passive: true
      }
    );
  });
})();