/**
 * =============================================================================
 * STB APP n2 — Portal View Loader (assets/js/core/portal-view-loader.js)
 * =============================================================================
 * Asynchronous HTML View Loader with In-Memory Caching & Template Extraction
 * Supports 1-Page/1-File architecture (views/*.html)
 * =============================================================================
 */
(function (global) {
  'use strict';

  var _viewCache = {};

  var PortalViewLoader = {
    /**
     * Load an HTML view file with in-memory caching
     * @param {string} viewName - e.g. 'auth', 'dashboard', 'profile'
     * @returns {Promise<string>}
     */
    loadView: async function (viewName) {
      if (_viewCache[viewName]) {
        return _viewCache[viewName];
      }
      try {
        var baseDir = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        var url = baseDir + 'views/' + encodeURIComponent(viewName) + '.html';
        var res = await fetch(url);
        if (!res.ok) {
          throw new Error('HTTP ' + res.status + ' while fetching view: ' + viewName);
        }
        var html = await res.text();
        _viewCache[viewName] = html;
        return html;
      } catch (err) {
        console.warn('PortalViewLoader: Unable to fetch views/' + viewName + '.html', err);
        return '';
      }
    },

    /**
     * Retrieve cached view HTML if available
     * @param {string} viewName
     * @returns {string}
     */
    getCached: function (viewName) {
      return _viewCache[viewName] || '';
    },

    /**
     * Load view and extract an inner <template id="..."> or element by selector
     * @param {string} viewName
     * @param {string} selectorOrTemplateId
     * @returns {Promise<string>}
     */
    getTemplate: async function (viewName, selectorOrTemplateId) {
      var html = await this.loadView(viewName);
      if (!html) return '';
      var parser = new DOMParser();
      var doc = parser.parseFromString(html, 'text/html');
      var el = doc.getElementById(selectorOrTemplateId) || doc.querySelector(selectorOrTemplateId);
      if (el) {
        if (el.tagName && el.tagName.toLowerCase() === 'template') {
          return el.innerHTML;
        }
        return el.outerHTML;
      }
      return html;
    },

    /**
     * Render view HTML directly into target element
     * @param {HTMLElement|string} target
     * @param {string} viewName
     * @returns {Promise<HTMLElement|null>}
     */
    renderInto: async function (target, viewName) {
      var targetEl = (typeof target === 'string') ? document.getElementById(target) : target;
      if (!targetEl) return null;
      var html = await this.loadView(viewName);
      if (html) {
        targetEl.innerHTML = html;
        if (global.lucide && global.lucide.createIcons) {
          global.lucide.createIcons();
        }
      }
      return targetEl;
    },

    /**
     * Preload all views concurrently
     * @param {string[]} viewNames
     */
    preloadAll: async function (viewNames) {
      var names = viewNames || [
        'loader', 'auth', 'dashboard', 'profile',
        'personnel', 'users', 'webapps', 'reference', 'positions', 'settings'
      ];
      await Promise.all(names.map(function (n) { return PortalViewLoader.loadView(n); }));
    }
  };

  global.PortalViewLoader = PortalViewLoader;
})(window);

