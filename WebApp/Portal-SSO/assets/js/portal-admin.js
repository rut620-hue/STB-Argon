/**
 * =============================================================================
 * STB APP n2 — Central Portal Admin Orchestrator & Public Facade (assets/js/portal-admin.js)
 * =============================================================================
 * OOP Modular Architecture Orchestrator for Admin & Superadmin Modules:
 * - #personnel : AdminPersonnel
 * - #users     : AdminUsers
 * - #webapps   : AdminWebapps
 * - #reference : AdminReference
 * - #positions : AdminPositions
 * - #settings  : AdminSettings
 * Maintains 100% lossless compatibility for window.PORTAL_ADMIN facade.
 * =============================================================================
 */
(function (global) {
  'use strict';

  var S = global.AdminShared || {};

  function getApp() {
    return (S.getApp && S.getApp()) || global.PORTAL_APP;
  }

  // ---------------------------------------------------------------------------
  // Public Facade Delegator (100% Lossless Compatibility)
  // ---------------------------------------------------------------------------
  var PORTAL_ADMIN = {
    get ADMIN_STATE() { return (global.AdminShared && global.AdminShared.ADMIN_STATE) || {}; },

    // 1. Personnel Module
    renderPersonnelPage: function () { if (global.AdminPersonnel) global.AdminPersonnel.renderPersonnelPage(); },
    refreshPersonnel: function () { return global.AdminPersonnel ? global.AdminPersonnel.refreshPersonnel() : Promise.resolve(); },
    openPersonnelModal: function (id) { if (global.AdminPersonnel) global.AdminPersonnel.openPersonnelModal(id); },
    submitPersonnelModal: function () { return global.AdminPersonnel ? global.AdminPersonnel.submitPersonnelModal() : Promise.resolve(); },
    deletePersonnel: function (id, name) { return global.AdminPersonnel ? global.AdminPersonnel.deletePersonnel(id, name) : Promise.resolve(); },

    // 2. Users Module
    renderUsersPage: function () { if (global.AdminUsers) global.AdminUsers.renderUsersPage(); },
    refreshUsers: function () { return global.AdminUsers ? global.AdminUsers.refreshUsers() : Promise.resolve(); },
    quickCreateAccountForPersonnel: function (id) { if (global.AdminUsers) global.AdminUsers.quickCreateAccountForPersonnel(id); },
    openUserModal: function (refId, quick) { if (global.AdminUsers) global.AdminUsers.openUserModal(refId, quick); },
    submitUserModal: function (isEdit) { return global.AdminUsers ? global.AdminUsers.submitUserModal(isEdit) : Promise.resolve(); },
    deleteUser: function (id, u) { return global.AdminUsers ? global.AdminUsers.deleteUser(id, u) : Promise.resolve(); },

    // 3. Webapps Module
    renderWebappsPage: function () { if (global.AdminWebapps) global.AdminWebapps.renderWebappsPage(); },
    refreshWebapps: function () { return global.AdminWebapps ? global.AdminWebapps.refreshWebapps() : Promise.resolve(); },
    openWebappModal: function (id) { if (global.AdminWebapps) global.AdminWebapps.openWebappModal(id); },
    submitWebappModal: function () { return global.AdminWebapps ? global.AdminWebapps.submitWebappModal() : Promise.resolve(); },
    deleteWebapp: function (id, name) { return global.AdminWebapps ? global.AdminWebapps.deleteWebapp(id, name) : Promise.resolve(); },
    moveWebapp: function (id, dir) { return global.AdminWebapps ? global.AdminWebapps.moveWebapp(id, dir) : Promise.resolve(); },
    toggleWebappStatus: function (id) { return global.AdminWebapps ? global.AdminWebapps.toggleWebappStatus(id) : Promise.resolve(); },

    // 4. Reference Module
    renderReferencePage: function () { if (global.AdminReference) global.AdminReference.renderReferencePage(); },
    switchRefTab: function (tab) { if (global.AdminReference) global.AdminReference.switchRefTab(tab); },
    setRefParentFilter: function (val) { if (global.AdminReference) global.AdminReference.setRefParentFilter(val); },
    moveReference: function (id, dir) { return global.AdminReference ? global.AdminReference.moveReference(id, dir) : Promise.resolve(); },
    openSingleReferenceModal: function (id) { if (global.AdminReference) global.AdminReference.openSingleReferenceModal(id); },
    submitSingleReferenceModal: function () { return global.AdminReference ? global.AdminReference.submitSingleReferenceModal() : Promise.resolve(); },
    openAddReferenceModal: function (cur) { if (global.AdminReference) global.AdminReference.openAddReferenceModal(cur); },
    addReferenceInputRow: function (v, s) { if (global.AdminReference) global.AdminReference.addReferenceInputRow(v, s); },
    removeReferenceInputRow: function (btn) { if (global.AdminReference) global.AdminReference.removeReferenceInputRow(btn); },
    submitAddReferenceModal: function () { return global.AdminReference ? global.AdminReference.submitAddReferenceModal() : Promise.resolve(); },
    openBatchReferenceModal: function (cur) { if (global.AdminReference) global.AdminReference.openBatchReferenceModal(cur); },
    submitBatchReferenceModal: function () { return global.AdminReference ? global.AdminReference.submitAddReferenceModal() : Promise.resolve(); },
    deleteReference: function (id, v) { return global.AdminReference ? global.AdminReference.deleteReference(id, v) : Promise.resolve(); },

    // 5. Positions Module
    renderPositionsPage: function () { if (global.AdminPositions) global.AdminPositions.renderPositionsPage(); },
    switchPosTab: function (tab) { if (global.AdminPositions) global.AdminPositions.switchPosTab(tab); },
    movePosition: function (id, dir) { return global.AdminPositions ? global.AdminPositions.movePosition(id, dir) : Promise.resolve(); },
    promptAddNewPositionType: function () { return global.AdminPositions ? global.AdminPositions.promptAddNewPositionType() : Promise.resolve(); },
    openSinglePositionModal: function (id) { if (global.AdminPositions) global.AdminPositions.openSinglePositionModal(id); },
    submitSinglePositionModal: function () { return global.AdminPositions ? global.AdminPositions.submitSinglePositionModal() : Promise.resolve(); },
    openAddPositionModal: function (cur) { if (global.AdminPositions) global.AdminPositions.openAddPositionModal(cur); },
    addPositionInputRow: function (n, l) { if (global.AdminPositions) global.AdminPositions.addPositionInputRow(n, l); },
    removePositionInputRow: function (btn) { if (global.AdminPositions) global.AdminPositions.removePositionInputRow(btn); },
    submitAddPositionModal: function () { return global.AdminPositions ? global.AdminPositions.submitAddPositionModal() : Promise.resolve(); },
    openBatchPositionModal: function (cur) { if (global.AdminPositions) global.AdminPositions.openBatchPositionModal(cur); },
    submitBatchPositionModal: function () { return global.AdminPositions ? global.AdminPositions.submitAddPositionModal() : Promise.resolve(); },
    deletePosition: function (id, n) { return global.AdminPositions ? global.AdminPositions.deletePosition(id, n) : Promise.resolve(); },

    // 6. Settings Module
    renderSettingsPage: function () { if (global.AdminSettings) global.AdminSettings.renderSettingsPage(); },
    testDriveFolder: function (inp, lbl) { return global.AdminSettings ? global.AdminSettings.testDriveFolder(inp, lbl) : Promise.resolve(); },
    submitSettings: function () { return global.AdminSettings ? global.AdminSettings.submitSettings() : Promise.resolve(); },
    confirmResetTestData: function () { if (global.AdminSettings) global.AdminSettings.confirmResetTestData(); },
    executeResetTestData: function () { return global.AdminSettings ? global.AdminSettings.executeResetTestData() : Promise.resolve(); }
  };

  global.PORTAL_ADMIN = PORTAL_ADMIN;

  function initAdminRoutes() {
    var app = getApp();
    if (!app || typeof app.registerAdminRoute !== 'function') return;

    app.registerAdminRoute('personnel', async function () {
      if (global.AdminPersonnel) {
        await global.AdminPersonnel.loadPersonnelData(true);
        global.AdminPersonnel.renderPersonnelPage();
      }
    });

    app.registerAdminRoute('users', async function () {
      if (global.AdminPersonnel) await global.AdminPersonnel.loadPersonnelData(true);
      if (global.AdminWebapps) await global.AdminWebapps.loadWebappsData(true);
      if (global.AdminUsers) {
        await global.AdminUsers.loadUsersData(true);
        global.AdminUsers.renderUsersPage();
      }
    });

    app.registerAdminRoute('webapps', async function () {
      if (global.AdminWebapps) {
        await global.AdminWebapps.loadWebappsData(true);
        global.AdminWebapps.renderWebappsPage();
      }
    });

    app.registerAdminRoute('reference', async function () {
      if (global.AdminReference) {
        global.AdminReference.renderReferencePage();
      }
    });

    app.registerAdminRoute('positions', async function () {
      if (global.AdminPositions) {
        global.AdminPositions.renderPositionsPage();
      }
    });

    app.registerAdminRoute('settings', async function () {
      if (global.AdminSettings) {
        global.AdminSettings.renderSettingsPage();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminRoutes);
  } else {
    initAdminRoutes();
  }
})(window);
