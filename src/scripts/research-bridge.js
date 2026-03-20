(function(global) {
  const queue = []
  let running = false
  let saveTimer = null

  function encodeValue(value) {
    return encodeURIComponent(String(value == null ? "" : value))
  }

  function buildURL(action, params) {
    const pairs = []
    const payload = params || {}
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) return
      pairs.push(`${encodeValue(key)}=${encodeValue(payload[key])}`)
    })
    return `${"mnresearch"}://${action}${pairs.length ? "?" + pairs.join("&") : ""}`
  }

  function flushQueue() {
    if (running || !queue.length) return
    running = true
    const url = queue.shift()
    try {
      window.location.href = url
    } catch (error) {
      if (global.console && console.warn) {
        console.warn("[MNResearchBridge] post failed", error)
      }
    }
    setTimeout(() => {
      running = false
      flushQueue()
    }, 24)
  }

  function sendSavePayload(payload, reason) {
    const saveReason = reason || "autosave"
    const maxChunkLength = 1400

    if (global.MNResearchApp && typeof global.MNResearchApp.markSavePending === "function") {
      global.MNResearchApp.markSavePending(saveReason)
    }

    if (payload.length <= maxChunkLength) {
      bridge.post("saveState", {
        payload,
        reason: saveReason
      })
      return
    }

    const token = `save-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const chunks = []
    for (let index = 0; index < payload.length; index += maxChunkLength) {
      chunks.push(payload.slice(index, index + maxChunkLength))
    }

    bridge.post("beginSaveState", {
      token,
      totalChunks: chunks.length,
      reason: saveReason
    })

    chunks.forEach((chunk, index) => {
      bridge.post("saveStateChunk", {
        token,
        index,
        chunk
      })
    })

    bridge.post("commitSaveState", { token })
  }

  const bridge = {
    post(action, params) {
      queue.push(buildURL(action, params))
      flushQueue()
    },

    log(message) {
      bridge.post("htmlLog", { message })
    },

    scheduleSave(state, reason) {
      if (saveTimer) {
        clearTimeout(saveTimer)
      }
      saveTimer = setTimeout(() => {
        saveTimer = null
        sendSavePayload(JSON.stringify(state), reason || "autosave")
      }, 420)
    },

    flushSave(state, reason) {
      if (saveTimer) {
        clearTimeout(saveTimer)
        saveTimer = null
      }
      sendSavePayload(JSON.stringify(state), reason || "manual-save")
    },

    notifyReady() {
      bridge.post("ready")
    },

    requestCurrentState() {
      bridge.post("requestCurrentState")
    },

    requestInputHistory() {
      bridge.post("requestInputHistory")
    },

    requestExport() {
      bridge.post("requestExport")
    },

    requestImport() {
      bridge.post("requestImport")
    },

    requestBackup() {
      bridge.post("requestBackup")
    },

    requestLiteratureSearch(query, limit) {
      bridge.post("requestLiteratureSearch", {
        query: query || "",
        limit: typeof limit === "number" ? limit : 20
      })
    },

    requestCurrentDocumentLiterature() {
      bridge.post("requestCurrentDocumentLiterature")
    },

    searchLiteratureInLibrary(query, view) {
      bridge.post("searchLiteratureInLibrary", {
        query: query || "",
        view: view || ""
      })
    },

    openLiteratureCard(noteId, mode) {
      bridge.post("openLiteratureCard", {
        noteId: noteId || "",
        mode: mode || "focusCard"
      })
    },

    recordReusableInput(field, value) {
      if (!field || !value) return
      bridge.post("recordReusableInput", {
        field: field,
        value: value
      })
    }
  }

  global.MNResearchBridge = bridge
})(window)
