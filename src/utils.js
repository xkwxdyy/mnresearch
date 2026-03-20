class MNResearchConfig {
  static init(mainPath) {
    this.mainPath = mainPath
    this.windowFrameKey = "MNResearch_WindowFrame"
    this.lastState = null
    this.activeDataFolder = ""
    this.addonMeta = this.normalizeAddonMeta(MNUtil.readJSON(`${mainPath}/mnaddon.json`))
    const paths = this.refreshStoragePaths({ preferExisting: true })
    this.ensureFolder(paths.dataFolder)
  }

  static normalizeAddonMeta(rawMeta) {
    const meta = rawMeta && typeof rawMeta === "object" ? rawMeta : {}
    return {
      addonid: String(meta.addonid || "marginnote.extension.mnresearch"),
      author: String(meta.author || ""),
      title: String(meta.title || "MN Research"),
      version: String(meta.version || ""),
      marginnote_version_min: String(meta.marginnote_version_min || ""),
      cert_key: String(meta.cert_key || "")
    }
  }

  static ensureFolder(path) {
    if (!path) return
    if (!MNUtil.isfileExists(path)) {
      NSFileManager.defaultManager().createDirectoryAtPathWithIntermediateDirectoriesAttributes(
        path,
        true,
        undefined
      )
    }
  }

  static resolvePathLike(value) {
    try {
      let path = value
      if (typeof path === "function") {
        path = path.call(MNUtil)
      } else if (path && typeof path === "object") {
        try {
          if (typeof path.path === "function") {
            path = path.path()
          } else if (typeof path.path === "string") {
            path = path.path
          }
        } catch (_) {
          path = ""
        }
      }

      path = String(path || "").trim()
      if (!path) return ""
      if (path === "undefined" || path === "null" || path === "(null)" || path === "[object Object]") {
        return ""
      }
      if (/^(undefined|null)(\/|$)/.test(path)) {
        return ""
      }
      return path.replace(/\/+$/, "")
    } catch (_) {
      return ""
    }
  }

  static joinPath(base, suffix) {
    const left = this.resolvePathLike(base)
    const right = String(suffix || "").trim().replace(/^\/+/, "")
    if (!left) return ""
    if (!right) return left
    return `${left}/${right}`
  }

  static getDocumentsBasePath() {
    try {
      return this.resolvePathLike(NSSearchPathForDirectoriesInDomains(9, 1, true).firstObject)
    } catch (_) {
      return ""
    }
  }

  static getDataFolderCandidates() {
    const candidates = []
    const push = (path) => {
      const text = this.resolvePathLike(path)
      if (!text) return
      if (candidates.indexOf(text) >= 0) return
      candidates.push(text)
    }

    push(this.joinPath(MNUtil && MNUtil.dbFolder, "data/mnresearch"))
    push(this.joinPath(MNUtil && MNUtil.documentFolder, "mnresearch"))
    push(this.joinPath(this.getDocumentsBasePath(), "mnresearch"))

    return candidates
  }

  static getStateFileCandidates() {
    return this.getDataFolderCandidates().map((folder) => this.joinPath(folder, "mnresearch-state.json"))
  }

  static getBackupFileCandidates() {
    return this.getDataFolderCandidates().map((folder) => this.joinPath(folder, "mnresearch-state.backup.json"))
  }

  static getInputHistoryFileCandidates() {
    return this.getDataFolderCandidates().map((folder) => this.joinPath(folder, "mnresearch-input-history.json"))
  }

  static getParentFolder(path) {
    const text = this.resolvePathLike(path)
    if (!text) return ""
    return text.split("/").slice(0, -1).join("/")
  }

  static resolveDataFolder(options = {}) {
    const active = this.resolvePathLike(this.activeDataFolder)
    if (active) {
      return active
    }

    const candidates = this.getDataFolderCandidates()
    if (options.preferExisting === true) {
      for (let i = 0; i < candidates.length; i += 1) {
        const folder = candidates[i]
        const statePath = this.joinPath(folder, "mnresearch-state.json")
        const backupPath = this.joinPath(folder, "mnresearch-state.backup.json")
        if ((statePath && MNUtil.isfileExists(statePath)) || (backupPath && MNUtil.isfileExists(backupPath))) {
          this.activeDataFolder = folder
          return folder
        }
      }
    }

    const fallback = candidates[0] || ""
    this.activeDataFolder = fallback
    return fallback
  }

  static refreshStoragePaths(options = {}) {
    const dataFolder = this.resolveDataFolder(options)
    this.dataFolder = dataFolder
    this.stateFilePath = dataFolder ? this.joinPath(dataFolder, "mnresearch-state.json") : ""
    this.backupFilePath = dataFolder ? this.joinPath(dataFolder, "mnresearch-state.backup.json") : ""
    this.inputHistoryFilePath = dataFolder ? this.joinPath(dataFolder, "mnresearch-input-history.json") : ""
    return {
      dataFolder: this.dataFolder,
      stateFilePath: this.stateFilePath,
      backupFilePath: this.backupFilePath,
      inputHistoryFilePath: this.inputHistoryFilePath
    }
  }

  static ensureStorageReady(options = {}) {
    const paths = this.refreshStoragePaths(options)
    if (!paths.dataFolder || !paths.stateFilePath || !paths.backupFilePath) {
      throw new Error("研究数据目录不可用")
    }
    this.ensureFolder(paths.dataFolder)
    return paths
  }

  static writeJSONSafely(path, payload, source) {
    if (!path) {
      MNResearchUtils.log("写入路径为空", source, { path }, "ERROR")
      return false
    }

    const writeOk = MNUtil.writeJSON(path, payload)
    if (!writeOk) {
      return false
    }

    const persisted = MNUtil.readJSON(path)
    if (!persisted || typeof persisted !== "object") {
      MNResearchUtils.log("写入后校验失败：文件不可读", source, { path }, "ERROR")
      return false
    }

    if (payload && payload.updatedAt && persisted.updatedAt !== payload.updatedAt) {
      MNResearchUtils.log("写入后校验失败：时间戳不匹配", source, {
        path,
        expected: payload.updatedAt,
        actual: persisted.updatedAt
      }, "ERROR")
      return false
    }

    return true
  }

  static getTempExportBasePath() {
    const candidates = []
    const push = (path) => {
      const text = this.resolvePathLike(path)
      if (!text) return
      if (candidates.indexOf(text) >= 0) return
      candidates.push(text)
    }

    push(MNUtil && MNUtil.tempFolder)
    push(MNUtil && MNUtil.tempPath)
    push(MNUtil && MNUtil.cacheFolder)
    push(this.getDocumentsBasePath())
    push(this.joinPath(MNUtil && MNUtil.dbFolder, "data"))

    return candidates[0] || ""
  }

  static generateTimestamp() {
    const date = new Date()
    const pad = (value) => String(value).padStart(2, "0")
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
      "-",
      pad(date.getHours()),
      pad(date.getMinutes()),
      pad(date.getSeconds())
    ].join("")
  }

  static deepClone(value) {
    return JSON.parse(JSON.stringify(value))
  }

  static normalizeReusableInputValue(value) {
    return String(value == null ? "" : value)
      .replace(/\s+/g, " ")
      .trim()
  }

  static normalizeReusableInputMatchKey(value) {
    return this.normalizeReusableInputValue(value).toLowerCase()
  }

  static createEmptyInputHistory() {
    return {
      type: "mnresearch-input-history",
      version: "1.0.0",
      updatedAt: new Date().toISOString(),
      fields: {}
    }
  }

  static normalizeInputHistoryPayload(payload) {
    const base = this.createEmptyInputHistory()
    const source = payload && typeof payload === "object" ? payload : {}
    const fieldSource = source.fields && typeof source.fields === "object" ? source.fields : source
    const reservedKeys = {
      type: true,
      version: true,
      updatedAt: true
    }

    if (typeof source.updatedAt === "string" && source.updatedAt) {
      base.updatedAt = source.updatedAt
    }

    Object.keys(fieldSource || {}).forEach((fieldKey) => {
      if (!source.fields && reservedKeys[fieldKey]) return
      const normalizedFieldKey = this.normalizeReusableInputValue(fieldKey)
      if (!normalizedFieldKey) return

      const rawEntries = Array.isArray(fieldSource[fieldKey]) ? fieldSource[fieldKey] : []
      const mergedEntries = {}

      rawEntries.forEach((entry) => {
        const rawValue = entry && typeof entry === "object" && !Array.isArray(entry)
          ? entry.value
          : entry
        const normalizedValue = this.normalizeReusableInputValue(rawValue)
        if (!normalizedValue) return

        const matchKey = this.normalizeReusableInputMatchKey(normalizedValue)
        const count = entry && typeof entry === "object" && !Array.isArray(entry)
          ? Math.max(1, parseInt(entry.count, 10) || 1)
          : 1
        const updatedAt = entry && typeof entry === "object" && !Array.isArray(entry) && typeof entry.updatedAt === "string" && entry.updatedAt
          ? entry.updatedAt
          : base.updatedAt

        if (!mergedEntries[matchKey]) {
          mergedEntries[matchKey] = {
            value: normalizedValue,
            count,
            updatedAt
          }
          return
        }

        mergedEntries[matchKey].count += count
        if (new Date(updatedAt).getTime() >= new Date(mergedEntries[matchKey].updatedAt).getTime()) {
          mergedEntries[matchKey].value = normalizedValue
          mergedEntries[matchKey].updatedAt = updatedAt
        }
      })

      const entries = Object.keys(mergedEntries)
        .map((key) => mergedEntries[key])
        .sort((left, right) => {
          const rightTime = new Date(right.updatedAt || 0).getTime() || 0
          const leftTime = new Date(left.updatedAt || 0).getTime() || 0
          if (rightTime !== leftTime) return rightTime - leftTime
          if ((right.count || 0) !== (left.count || 0)) return (right.count || 0) - (left.count || 0)
          return String(left.value || "").localeCompare(String(right.value || ""), "zh-CN")
        })

      if (entries.length) {
        base.fields[normalizedFieldKey] = entries.slice(0, 40)
      }
    })

    return base
  }

  static createEmptyState() {
    return {
      questions: [],
      literature: [],
      timelineEvents: [],
      actions: [],
      focusSessions: [],
      progressLog: [],
      formulations: [],
      judgments: [],
      examples: [],
      strategies: [],
      obstacles: [],
      insights: [],
      branchLinks: [],
      focusState: {
        questionId: null,
        entityType: null,
        entityId: null
      },
      currentFocusId: null,
      activeQuestionId: null
    }
  }

  static getQuestionIdForEntity(state, type, entityId) {
    if (!state || !entityId) return null
    if (type === "question") return entityId
    if (type === "literature") {
      const literature = Array.isArray(state.literature)
        ? state.literature.find((entry) => entry && entry.id === entityId)
        : null
      return literature && Array.isArray(literature.questionIds) && literature.questionIds.length
        ? literature.questionIds[0]
        : null
    }

    const collectionMap = {
      judgment: "judgments",
      strategy: "strategies",
      action: "actions",
      obstacle: "obstacles",
      example: "examples",
      insight: "insights"
    }
    const collectionKey = collectionMap[type]
    if (!collectionKey || !Array.isArray(state[collectionKey])) {
      return null
    }

    const item = state[collectionKey].find((entry) => entry && entry.id === entityId)
    return item && typeof item.questionId === "string" ? item.questionId : null
  }

  static normalizeLiteratureSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return null
    const id = String(snapshot.id || "").trim()
    if (!id) return null
    return {
      id,
      source: String(snapshot.source || "mnliterature"),
      libraryType: String(snapshot.libraryType || ""),
      title: String(snapshot.title || ""),
      titleAlt: String(snapshot.titleAlt || ""),
      authors: String(snapshot.authors || ""),
      year: String(snapshot.year || ""),
      referenceType: String(snapshot.referenceType || ""),
      venue: String(snapshot.venue || ""),
      keywords: String(snapshot.keywords || ""),
      abstract: String(snapshot.abstract || ""),
      doi: String(snapshot.doi || ""),
      md5: String(snapshot.md5 || "").toLowerCase(),
      hasCover: snapshot.hasCover === true
    }
  }

  static normalizeFocusSession(session) {
    const next = this.deepClone(session || {})
    delete next.notes
    next.id = String(next.id || "")
    next.type = String(next.type || "question")
    next.entityId = String(next.entityId || "")
    next.title = String(next.title || "")
    next.description = String(next.description || "")
    next.status = String(next.status || "active")
    next.linkedItems = Array.isArray(next.linkedItems) ? next.linkedItems : []
    next.newExampleIds = Array.isArray(next.newExampleIds) ? next.newExampleIds : []
    next.newInsightIds = Array.isArray(next.newInsightIds) ? next.newInsightIds : []
    next.newObstacleIds = Array.isArray(next.newObstacleIds) ? next.newObstacleIds : []
    next.createdAt = next.createdAt || new Date().toISOString()
    next.updatedAt = next.updatedAt || next.createdAt
    return next
  }

  static normalizeProgressEntry(entry) {
    const next = this.deepClone(entry || {})
    if (String(next.entityType || "") === "focus-note") {
      return null
    }
    return next
  }

  static applyExternalReadingModeToState(rawState, payload = {}) {
    const state = this.normalizeStatePayload(rawState)
    const enabled = payload.enabled === true
    const bindingId = String(payload.bindingId || "").trim()
    const source = String(payload.source || "mnliterature").trim() || "mnliterature"
    const reason = String(payload.reason || "").trim()
    const now = new Date().toISOString()
    const focusSessionId = typeof state.currentFocusId === "string" ? state.currentFocusId : ""
    const focusIndex = Array.isArray(state.focusSessions)
      ? state.focusSessions.findIndex((item) => item && item.id === focusSessionId)
      : -1

    if (focusIndex < 0) {
      return {
        state,
        changed: false,
        focusSessionId: null,
        currentReading: null,
        skipped: "no-active-focus"
      }
    }

    const focus = this.deepClone(state.focusSessions[focusIndex] || {})
    const previousReading = focus.currentReading && typeof focus.currentReading === "object"
      ? focus.currentReading
      : null
    let changed = false
    let progressEntry = null

    if (!enabled || !bindingId) {
      if (previousReading && previousReading.bindingId) {
        focus.currentReading = null
        focus.updatedAt = now
        changed = true
        progressEntry = {
          id: `progress-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          focusSessionId: focus.id,
          action: "reading_stopped",
          details: `停止阅读：${previousReading.title || previousReading.bindingId}`,
          entityType: "literature",
          entityId: previousReading.bindingId,
          createdAt: now,
          updatedAt: now
        }
      }

      if (changed) {
        state.focusSessions[focusIndex] = focus
        if (progressEntry) {
          state.progressLog.push(progressEntry)
        }
      }

      return {
        state,
        changed,
        focusSessionId: focus.id,
        currentReading: null,
        skipped: changed ? "" : "already-stopped"
      }
    }

    if (focus.status && focus.status !== "active") {
      return {
        state,
        changed: false,
        focusSessionId: focus.id,
        currentReading: previousReading,
        skipped: "inactive-focus"
      }
    }

    const literature = this.normalizeLiteratureSnapshot(payload.literature || { id: bindingId }) || { id: bindingId }
    const questionId = this.getQuestionIdForEntity(state, focus.type, focus.entityId) || (focus.type === "question" ? focus.entityId : null)
    const nextReading = {
      enabled: true,
      bindingId: literature.id,
      source,
      reason,
      title: literature.title || "",
      authors: literature.authors || "",
      year: literature.year || "",
      referenceType: literature.referenceType || "",
      venue: literature.venue || "",
      doi: literature.doi || "",
      md5: literature.md5 || "",
      libraryType: literature.libraryType || "",
      syncedAt: now
    }

    const sameBinding = previousReading && previousReading.bindingId === nextReading.bindingId
    const previousSignature = previousReading
      ? [
        previousReading.bindingId || "",
        previousReading.title || "",
        previousReading.authors || "",
        previousReading.year || "",
        previousReading.venue || "",
        previousReading.doi || ""
      ].join("||")
      : ""
    const nextSignature = [
      nextReading.bindingId || "",
      nextReading.title || "",
      nextReading.authors || "",
      nextReading.year || "",
      nextReading.venue || "",
      nextReading.doi || ""
    ].join("||")

    if (!sameBinding || previousSignature !== nextSignature) {
      focus.currentReading = nextReading
      focus.updatedAt = now
      changed = true
      progressEntry = {
        id: `progress-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        focusSessionId: focus.id,
        action: sameBinding ? "reading_updated" : (previousReading && previousReading.bindingId ? "reading_switched" : "reading_started"),
        details: previousReading && previousReading.bindingId && previousReading.bindingId !== nextReading.bindingId
          ? `切换阅读：${previousReading.title || previousReading.bindingId} -> ${nextReading.title || nextReading.bindingId}`
          : `开始阅读：${nextReading.title || nextReading.bindingId}`,
        entityType: "literature",
        entityId: nextReading.bindingId,
        createdAt: now,
        updatedAt: now
      }
    }

    const linkedItems = Array.isArray(focus.linkedItems) ? focus.linkedItems.slice() : []
    if (!linkedItems.some((item) => item && item.type === "literature" && item.id === literature.id)) {
      linkedItems.push({
        type: "literature",
        id: literature.id,
        title: literature.title || literature.id,
        linkedAt: now
      })
      focus.linkedItems = linkedItems
      focus.updatedAt = now
      changed = true
    }

    const linkedTarget = {
      type: "focus-session",
      entityId: focus.id,
      questionId: questionId || null,
      label: `专注会话 · ${String(focus.title || "未命名会话")}`,
      linkedAt: now
    }
    const literatureIndex = Array.isArray(state.literature)
      ? state.literature.findIndex((item) => item && item.id === literature.id)
      : -1

    if (literatureIndex >= 0) {
      const existing = this.deepClone(state.literature[literatureIndex] || {})
      const linkedTargets = Array.isArray(existing.linkedTargets) ? existing.linkedTargets.slice() : []
      const hadLinkedTarget = linkedTargets.some((target) => target && target.type === linkedTarget.type && target.entityId === linkedTarget.entityId)
      if (!hadLinkedTarget) {
        linkedTargets.push(linkedTarget)
      }
      const questionIds = Array.isArray(existing.questionIds) ? existing.questionIds.slice() : []
      const hadQuestionId = questionId ? questionIds.indexOf(questionId) >= 0 : true
      if (questionId && !hadQuestionId) {
        questionIds.push(questionId)
      }
      const mergedLiterature = Object.assign({}, existing, literature, {
        linkedTargets,
        questionIds,
        updatedAt: now
      })
      const literatureChanged = !hadLinkedTarget ||
        !hadQuestionId ||
        [
          "title",
          "titleAlt",
          "authors",
          "year",
          "referenceType",
          "venue",
          "keywords",
          "abstract",
          "doi",
          "md5",
          "libraryType",
          "source"
        ].some((key) => String(existing[key] || "") !== String(mergedLiterature[key] || "")) ||
        (!!existing.hasCover !== !!mergedLiterature.hasCover)

      if (literatureChanged) {
        state.literature[literatureIndex] = mergedLiterature
        changed = true
      }
    } else {
      state.literature.push(Object.assign({}, literature, {
        linkedTargets: [linkedTarget],
        questionIds: questionId ? [questionId] : [],
        createdAt: now,
        updatedAt: now
      }))
      changed = true
    }

    state.focusSessions[focusIndex] = focus
    if (progressEntry) {
      state.progressLog.push(progressEntry)
    }

    return {
      state,
      changed,
      focusSessionId: focus.id,
      currentReading: focus.currentReading || null,
      skipped: ""
    }
  }

  static normalizeStatePayload(payload) {
    let source = payload

    if (!source || typeof source !== "object") {
      return this.createEmptyState()
    }

    if (source.data && typeof source.data === "object") {
      source = source.data
    }

    const state = this.createEmptyState()
    const arrayKeys = [
      "questions",
      "literature",
      "timelineEvents",
      "actions",
      "focusSessions",
      "progressLog",
      "formulations",
      "judgments",
      "examples",
      "strategies",
      "obstacles",
      "insights",
      "branchLinks"
    ]

    arrayKeys.forEach((key) => {
      if (Array.isArray(source[key])) {
        state[key] = this.deepClone(source[key])
      }
    })

    state.focusSessions = state.focusSessions.map((item) => this.normalizeFocusSession(item))
    state.progressLog = state.progressLog
      .map((item) => this.normalizeProgressEntry(item))
      .filter(Boolean)

    if (source.focusState && typeof source.focusState === "object") {
      state.focusState = {
        questionId: typeof source.focusState.questionId === "string" || source.focusState.questionId === null
          ? source.focusState.questionId
          : null,
        entityType: typeof source.focusState.entityType === "string" || source.focusState.entityType === null
          ? source.focusState.entityType
          : null,
        entityId: typeof source.focusState.entityId === "string" || source.focusState.entityId === null
          ? source.focusState.entityId
          : null
      }
    }

    if (typeof source.currentFocusId === "string" || source.currentFocusId === null) {
      state.currentFocusId = source.currentFocusId
    }
    if (typeof source.activeQuestionId === "string" || source.activeQuestionId === null) {
      state.activeQuestionId = source.activeQuestionId
    }

    return state
  }

  static parseIncomingStatePayload(payload) {
    if (payload === undefined || payload === null || payload === "") {
      return null
    }

    if (typeof payload === "object") {
      return this.normalizeStatePayload(payload)
    }

    if (typeof payload === "string") {
      return this.normalizeStatePayload(JSON.parse(payload))
    }

    return this.normalizeStatePayload(JSON.parse(String(payload)))
  }

  static createStateEnvelope(state, reason = "save") {
    return {
      type: "mnresearch-state",
      version: "1.0.0",
      reason,
      updatedAt: new Date().toISOString(),
      data: this.normalizeStatePayload(state)
    }
  }

  static loadStateEnvelope() {
    this.refreshStoragePaths({ preferExisting: true })

    const candidates = this.getStateFileCandidates().concat(this.getBackupFileCandidates())
    for (let i = 0; i < candidates.length; i += 1) {
      const filePath = candidates[i]
      if (!filePath || !MNUtil.isfileExists(filePath)) {
        continue
      }

      const envelope = MNUtil.readJSON(filePath)
      if (!envelope || typeof envelope !== "object") {
        continue
      }

      this.activeDataFolder = this.getParentFolder(filePath)
      this.refreshStoragePaths()

      if (!envelope.data) {
        return this.createStateEnvelope(envelope, "normalize")
      }

      envelope.data = this.normalizeStatePayload(envelope.data)
      return envelope
    }

    return this.createStateEnvelope(this.createEmptyState(), "init")
  }

  static loadStateData() {
    const envelope = this.loadStateEnvelope()
    this.lastState = this.deepClone(envelope.data)
    return envelope.data
  }

  static loadInputHistory() {
    try {
      const paths = this.ensureStorageReady({ preferExisting: true })
      if (!paths.inputHistoryFilePath || !MNUtil.isfileExists(paths.inputHistoryFilePath)) {
        return this.createEmptyInputHistory()
      }
      const payload = MNUtil.readJSON(paths.inputHistoryFilePath)
      return this.normalizeInputHistoryPayload(payload)
    } catch (error) {
      MNResearchUtils.addErrorLog(error, "MNResearchConfig.loadInputHistory")
      return this.createEmptyInputHistory()
    }
  }

  static saveStateData(state, options = {}) {
    try {
      const paths = this.ensureStorageReady({ preferExisting: true })
      const envelope = this.createStateEnvelope(state, options.reason || "save")
      const writeOk = this.writeJSONSafely(paths.stateFilePath, envelope, "MNResearchConfig.saveStateData")
      if (!writeOk) {
        return false
      }

      if (options.writeBackup !== false) {
        this.writeJSONSafely(paths.backupFilePath, envelope, "MNResearchConfig.saveStateData.backup")
      }

      this.lastState = this.deepClone(envelope.data)
      return true
    } catch (error) {
      MNResearchUtils.addErrorLog(error, "MNResearchConfig.saveStateData")
      return false
    }
  }

  static saveBackupSnapshot(state, reason = "backup") {
    try {
      const paths = this.ensureStorageReady({ preferExisting: true })
      return this.writeJSONSafely(
        paths.backupFilePath,
        this.createStateEnvelope(state, reason),
        "MNResearchConfig.saveBackupSnapshot"
      )
    } catch (error) {
      MNResearchUtils.addErrorLog(error, "MNResearchConfig.saveBackupSnapshot")
      return false
    }
  }

  static saveInputHistory(history) {
    try {
      const paths = this.ensureStorageReady({ preferExisting: true })
      const payload = this.normalizeInputHistoryPayload(history)
      payload.updatedAt = new Date().toISOString()
      return this.writeJSONSafely(
        paths.inputHistoryFilePath,
        payload,
        "MNResearchConfig.saveInputHistory"
      )
    } catch (error) {
      MNResearchUtils.addErrorLog(error, "MNResearchConfig.saveInputHistory")
      return false
    }
  }

  static recordReusableInput(fieldKey, value) {
    const normalizedFieldKey = this.normalizeReusableInputValue(fieldKey)
    const normalizedValue = this.normalizeReusableInputValue(value)
    if (!normalizedFieldKey || !normalizedValue) {
      return false
    }

    const payload = this.loadInputHistory()
    const nextFields = payload.fields && typeof payload.fields === "object"
      ? this.deepClone(payload.fields)
      : {}
    const list = Array.isArray(nextFields[normalizedFieldKey])
      ? nextFields[normalizedFieldKey].slice()
      : []
    const matchKey = this.normalizeReusableInputMatchKey(normalizedValue)
    const now = new Date().toISOString()
    const index = list.findIndex((entry) => {
      return this.normalizeReusableInputMatchKey(entry && entry.value) === matchKey
    })

    if (index >= 0) {
      list[index] = Object.assign({}, list[index], {
        value: normalizedValue,
        count: Math.max(1, parseInt(list[index].count, 10) || 1) + 1,
        updatedAt: now
      })
    } else {
      list.push({
        value: normalizedValue,
        count: 1,
        updatedAt: now
      })
    }

    nextFields[normalizedFieldKey] = list
      .sort((left, right) => {
        const rightTime = new Date(right.updatedAt || 0).getTime() || 0
        const leftTime = new Date(left.updatedAt || 0).getTime() || 0
        if (rightTime !== leftTime) return rightTime - leftTime
        if ((right.count || 0) !== (left.count || 0)) return (right.count || 0) - (left.count || 0)
        return String(left.value || "").localeCompare(String(right.value || ""), "zh-CN")
      })
      .slice(0, 40)

    return this.saveInputHistory({
      fields: nextFields
    })
  }

  static exportStateToFile(state, filePrefix = "mnresearch-state") {
    try {
      const exportBasePath = this.getTempExportBasePath()
      if (!exportBasePath) {
        MNResearchUtils.log("导出目录为空", "MNResearchConfig.exportStateToFile", {}, "ERROR")
        return null
      }
      this.ensureFolder(exportBasePath)

      const filename = `${filePrefix}-${this.generateTimestamp()}.json`
      const filepath = `${exportBasePath}/${filename}`
      const envelope = this.createStateEnvelope(state, "export")
      const writeOk = this.writeJSONSafely(filepath, envelope, "MNResearchConfig.exportStateToFile")
      if (!writeOk) {
        return null
      }

      MNUtil.saveFile(filepath, ["public.json"])
      return filepath
    } catch (error) {
      MNResearchUtils.addErrorLog(error, "MNResearchConfig.exportStateToFile")
      return null
    }
  }

  static async importStateFromFile() {
    try {
      let payload = null
      if (typeof MNUtil.importJSONFromFile === "function") {
        payload = await MNUtil.importJSONFromFile()
      } else if (typeof MNUtil.importFile === "function") {
        const filePath = await MNUtil.importFile("public.json")
        if (filePath) {
          payload = MNUtil.readJSON(filePath)
        }
      } else if (typeof MNUtil.openFile === "function") {
        const filePath = MNUtil.openFile(["public.json"])
        if (filePath) {
          payload = MNUtil.readJSON(filePath)
        }
      }

      if (!payload) {
        return null
      }

      return this.normalizeStatePayload(payload)
    } catch (error) {
      MNResearchUtils.addErrorLog(error, "MNResearchConfig.importStateFromFile")
      return null
    }
  }
}

class MNResearchUtils {
  static webViewController = null
  static addonBar = null
  static errorLog = []
  static verboseLogEnabled = null

  static checkWebViewController() {
    if (!this.webViewController) {
      this.webViewController = researchWebController.new()
      this.webViewController.view.hidden = true
    }

    if (!MNUtil.isDescendantOfStudyView(this.webViewController.view)) {
      MNUtil.studyView.addSubview(this.webViewController.view)
    }

    return this.webViewController
  }

  static log(message, source = "MNResearch", detail, level = "INFO") {
    try {
      MNUtil.log({
        message: String(message || ""),
        source: `MN Research:${source}`,
        detail,
        level
      })
    } catch (_) {}
  }

  static isVerboseLogEnabled() {
    if (typeof this.verboseLogEnabled === "boolean") {
      return this.verboseLogEnabled
    }
    try {
      const raw = NSUserDefaults.standardUserDefaults().objectForKey("MNResearch_VerboseLog")
      this.verboseLogEnabled = (raw === true || raw === 1 || raw === "1" || raw === "true")
    } catch (_) {
      this.verboseLogEnabled = false
    }
    return this.verboseLogEnabled
  }

  static emitMNLog({ level, source, message, detail }) {
    const payload = {
      source: `MN Research:${String(source || "MNResearch")}`,
      message: String(message || ""),
      detail: detail === undefined ? null : detail
    }
    try {
      if (typeof MNLog !== "undefined" && MNLog) {
        const normalizedLevel = String(level || "info").toLowerCase()
        if (normalizedLevel === "error" && typeof MNLog.error === "function") {
          MNLog.error(payload)
          return
        }
        if (typeof MNLog.info === "function") {
          MNLog.info(payload)
          return
        }
      }
    } catch (_) {}

    try {
      MNUtil.log({
        source: payload.source,
        message: payload.message,
        detail: payload.detail,
        level: String(level || "INFO").toUpperCase()
      })
    } catch (_) {}
  }

  static verboseLog(message, source = "debug", detail, level = "info") {
    if (!this.isVerboseLogEnabled()) return
    this.emitMNLog({
      level,
      source,
      message,
      detail
    })
  }

  static addErrorLog(error, source, detail) {
    const payload = {
      source,
      message: error && error.message ? error.message : String(error),
      detail,
      time: new Date().toISOString()
    }
    this.errorLog.push(payload)
    try {
      this.emitMNLog({
        level: "error",
        source,
        message: payload.message,
        detail: payload
      })
      MNUtil.showHUD(`MN Research Error: ${payload.message}`)
    } catch (_) {}
  }
}

const MNResearchRoot = typeof globalThis !== "undefined" ? globalThis : this

MNResearchRoot.MNResearchConfig = MNResearchConfig
MNResearchRoot.MNResearchUtils = MNResearchUtils
