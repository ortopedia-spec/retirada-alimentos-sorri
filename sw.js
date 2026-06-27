/**
 * ============================================================================
 * SERVICE WORKER
 * ============================================================================
 *
 * Projeto:
 * Controle de retirada de alimentos — Almoço Junino 2026
 *
 * Estratégia:
 * - HTML, CSS, JavaScript e manifesto: rede primeiro.
 * - Imagens e ícones: cache primeiro.
 * - Requisições externas e chamadas à API: nunca armazenadas.
 * - Exclusão automática de versões antigas do cache.
 *
 * Versão: 2.0
 * Data: 27/06/2026
 * ============================================================================
 */

const CACHE_NAME = 'retirada-alimentos-static-v2';

const STATIC_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/config.js',
  './js/api.js',
  './js/app.js',
  './manifest.webmanifest',
  './assets/icons/icon.svg',
  './assets/logo/logo.svg'
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
 * Remove caches antigos e assume imediatamente o controle das páginas abertas.
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
 * Controla as requisições realizadas pela aplicação.
 */
self.addEventListener('fetch', function (event) {
  const request = event.request;

  /*
   * O Service Worker só deve tratar requisições GET.
   * Requisições POST da retirada nunca devem ser interceptadas.
   */
  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);

  /*
   * Não intercepta:
   * - Google Apps Script;
   * - bibliotecas externas;
   * - qualquer outro domínio.
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
   * Navegação entre páginas:
   * tenta buscar a versão atual na rede e usa o cache apenas como alternativa.
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
   * Arquivos que podem mudar durante o desenvolvimento:
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
   * Imagens, ícones e demais arquivos estáticos:
   * cache primeiro, rede como alternativa.
   */
  event.respondWith(
    caches.match(request).then(function (cachedResponse) {
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
 * Atualiza o cache somente quando a resposta for válida e pertencer
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

  caches.open(CACHE_NAME).then(function (cache) {
    cache.put(request, responseClone);
  });
}