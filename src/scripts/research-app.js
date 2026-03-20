(function(global) {
  const store = global.MNResearchStore
  const render = global.MNResearchRender
  const bridge = global.MNResearchBridge
  const layoutBreakpoints = {
    compact: 640,
    narrow: 860,
    medium: 1180
  }

  function getNonSaveUiSignature(uiState) {
    const snapshot = Object.assign({}, uiState || {})
    snapshot.saveState = null
    return JSON.stringify(snapshot)
  }

  const app = {
    ui: {
      sidebarCollapsed: false,
      sidebarQuery: "",
      activeTab: "timeline",
      workspaceMode: "dashboard",
      summaryFocusId: null,
      timelineEventModalId: null,
      questionDeleteId: null,
      deleteTargetType: null,
      deleteTargetId: null,
      deleteTargetParentId: null,
      editTargetType: null,
      editTargetId: null,
      editTargetParentId: null,
      literatureQuery: "",
      literatureSearchPending: false,
      literatureSearchResults: [],
      literatureSearchError: "",
      literatureSearchLastQuery: "",
      literatureSearchPanelExpanded: false,
      literatureTargetType: null,
      literatureTargetId: null,
      currentDocumentLiterature: null,
      settingsOpen: false,
      focusFilterType: "all",
      focusFilterSource: "all",
      focusOnlyCurrentEntity: false,
      focusIncludeChildQuestions: false,
      focusActionsExpanded: false,
      focusPanelExpanded: false,
      focusLinkQuery: "",
      layoutMode: "wide",
      focusDraft: {
        query: "",
        selectedType: null,
        selectedId: null
      },
      inputHistory: {},
      meta: {
        title: "MN Research",
        version: "unknown"
      },
      saveState: {
        pending: false,
        lastSavedAt: "",
        lastReason: "",
        lastError: ""
      }
    },

    render() {
      applyLayoutMode()
      render.renderApp(store.getState(), app.ui)
      app.lastRenderedNonSaveUiSignature = getNonSaveUiSignature(app.ui)
    },

    applyNativeState(state, reason) {
      store.load(state, reason || "native")
    },

    setAppMeta(meta) {
      if (!meta || typeof meta !== "object") return
      app.ui.meta = Object.assign({}, app.ui.meta, meta)
      app.render()
    },

    setLiteratureSearchPayload(payload) {
      const next = payload && typeof payload === "object" ? payload : {}
      app.ui.literatureSearchPending = false
      app.ui.literatureSearchResults = Array.isArray(next.results) ? next.results : []
      app.ui.literatureSearchError = String(next.error || "")
      app.ui.literatureSearchLastQuery = String(next.query || app.ui.literatureQuery || "")
      if (app.ui.literatureSearchResults.length || app.ui.literatureSearchError) {
        app.ui.literatureSearchPanelExpanded = true
      }
      app.render()
    },

    setCurrentDocumentLiterature(payload) {
      app.ui.currentDocumentLiterature = payload && typeof payload === "object" ? payload : null
      app.render()
    },

    setInputHistory(payload) {
      const next = payload && typeof payload === "object" ? payload : {}
      app.ui.inputHistory = next.fields && typeof next.fields === "object" ? next.fields : {}
      app.render()
    },

    markSavePending(reason) {
      app.ui.saveState.pending = true
      app.ui.saveState.lastError = ""
      app.ui.saveState.lastReason = reason || "autosave"
      refreshSaveStatus()
    },

    onNativeSaveComplete(timestamp, reason) {
      app.ui.saveState.pending = false
      app.ui.saveState.lastSavedAt = timestamp || new Date().toISOString()
      app.ui.saveState.lastReason = reason || "autosave"
      app.ui.saveState.lastError = ""
      refreshSaveStatus()
    },

    onNativeSaveError(message, reason) {
      app.ui.saveState.pending = false
      app.ui.saveState.lastError = message || "保存失败"
      app.ui.saveState.lastReason = reason || "autosave"
      refreshSaveStatus()
    }
  }

  store.subscribe(function(nextState, context) {
    app.render()
    if (!context.skipNativeSave && bridge) {
      bridge.scheduleSave(nextState, context.reason)
    }
  })

  global.MNResearchApp = app
  global.applyImportedState = function(state) {
    app.applyNativeState(state, "imported")
  }
  global.MNResearchApp.onNativeSaveComplete = app.onNativeSaveComplete
  global.MNResearchApp.onNativeSaveError = app.onNativeSaveError
  global.MNResearchApp.setInputHistory = app.setInputHistory

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp)
  } else {
    startApp()
  }

  function getLayoutMode() {
    const width = Math.max(
      global.innerWidth || 0,
      document.documentElement ? document.documentElement.clientWidth : 0
    )
    if (width <= layoutBreakpoints.compact) return "compact"
    if (width <= layoutBreakpoints.narrow) return "narrow"
    if (width <= layoutBreakpoints.medium) return "medium"
    return "wide"
  }

  function applyLayoutMode() {
    const nextMode = getLayoutMode()
    if (app.ui.layoutMode === nextMode &&
        document.documentElement.getAttribute("data-layout-mode") === nextMode) {
      return
    }
    app.ui.layoutMode = nextMode
    document.documentElement.setAttribute("data-layout-mode", nextMode)
  }

  function handleWindowResize() {
    const previousMode = app.ui.layoutMode
    applyLayoutMode()
    if (previousMode !== app.ui.layoutMode) {
      app.render()
    }
  }

  function refreshSaveStatus() {
    if (app.lastRenderedNonSaveUiSignature !== getNonSaveUiSignature(app.ui)) {
      app.render()
      return
    }
    if (render && typeof render.updateSaveStatus === "function") {
      render.updateSaveStatus(app.ui)
      return
    }
    app.render()
  }

  function startApp() {
    applyLayoutMode()
    if (global.MNResearchActions && typeof global.MNResearchActions.attach === "function") {
      global.MNResearchActions.attach()
    }
    if ((!store.getState().questions || !store.getState().questions.length) &&
        global.MNResearch &&
        global.MNResearch.sample &&
        typeof global.MNResearch.sample.createInitialState === "function") {
      store.load(global.MNResearch.sample.createInitialState(), "sample-seed")
    }
    app.render()
    global.addEventListener("resize", handleWindowResize)
    if (bridge) {
      bridge.notifyReady()
    }
  }
})(window)
