/**
 * ============================================================================
 * SERVICE WORKER
 * ============================================================================
 *
 * Projeto:
 * Controle de retirada de alimentos — Almoço Junino 2026
 *
 * Objetivo:
 * Controlar o cache dos arquivos estáticos da versão 2.1 de homologação.
 *
 * Estratégia:
 * - HTML, CSS, JavaScript e manifesto: rede primeiro.
 * - Imagens e ícones: cache primeiro.
 * - Chamadas externas e Google Apps Script: não interceptadas.
 * - Requisições POST: não interceptadas.
 * - Caches antigos: removidos automaticamente.
 *
 * Versão: 4.0
 * Data: 29/06/2026
 * ============================================================================
 */

const CACHE_NAME = 'retirada-alimentos-static-v4';

const STATIC_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/config.js',
  './js/api.js',
  './js/mobile-touch.js',
  './js/app.js',
  './manifest.webmanifest',
  './assets/icons/icon.svg',
  './assets/logo/sorri-bauru-header.png'
];


/**
 * Instala o Service Worker e pré-carrega os arquivos essenciais.
 */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});


/**
 * Remove caches antigos e assume o controle das páginas abertas.
 */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function (cacheName) {
              return cacheName !== CACHE_NAME;
            })
            .map(function (cacheName) {
              return caches.delete(cacheName);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});


/**
 * Controla as requisições da aplicação.
 */
self.addEventListener('fetch', function (event) {
  const request = event.request;

  /*
   * Requisições POST e demais métodos nunca são interceptados.
   */
  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);

  /*
   * Não intercepta chamadas para outros domínios.
   *
   * Isso inclui:
   * - Google Apps Script;
   * - biblioteca do leitor de QR Code;
   * - qualquer serviço externo.
   */
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  /*
   * URLs com parâmetros não são armazenadas.
   */
  if (requestUrl.search) {
    return;
  }

  /*
   * Navegação:
   * rede primeiro, com index.html em cache como alternativa.
   */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          atualizarCache_(request, response);
          return response;
        })
        .catch(function () {
          return caches.match('./index.html');
        })
    );

    return;
  }

  const pathname = requestUrl.pathname.toLowerCase();

  const arquivoAtualizavel =
    pathname.endsWith('.html') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.webmanifest');

  /*
   * Arquivos que podem sofrer atualização frequente:
   * rede primeiro, cache como alternativa.
   */
  if (arquivoAtualizavel) {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          atualizarCache_(request, response);
          return response;
        })
        .catch(function () {
          return caches.match(request);
        })
    );

    return;
  }

  /*
   * Imagens e ícones:
   * cache primeiro, rede como alternativa.
   */
  event.respondWith(
    caches
      .match(request)
      .then(function (cachedResponse) {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then(function (networkResponse) {
          atualizarCache_(request, networkResponse);
          return networkResponse;
        });
      })
  );
});


/**
 * Atualiza o cache somente quando a resposta é válida e pertence
 * ao mesmo domínio da aplicação.
 */
function atualizarCache_(request, response) {
  if (
    !response ||
    !response.ok ||
    response.type !== 'basic'
  ) {
    return;
  }

  const responseClone = response.clone();

  caches
    .open(CACHE_NAME)
    .then(function (cache) {
      return cache.put(
        request,
        responseClone
      );
    });
}