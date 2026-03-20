(function(global) {
  function debugLog(message, detail) {
    try {
      if (typeof MNResearchUtils !== "undefined" &&
          MNResearchUtils &&
          typeof MNResearchUtils.verboseLog === "function") {
        MNResearchUtils.verboseLog(message, "mnliteratureAdapter", detail)
      }
    } catch (_) {}
  }

  function normalizeText(value) {
    return String(value == null ? "" : value).trim()
  }

  function normalizeMd5(value) {
    return normalizeText(value).toLowerCase()
  }

  function resolvePathLike(value) {
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

  function joinPath(base, leaf) {
    const left = resolvePathLike(base)
    const right = normalizeText(leaf).replace(/^\/+/, "")
    if (!left) return ""
    if (!right) return left
    return `${left}/${right}`
  }

  function normalizeAuthors(authors) {
    if (!Array.isArray(authors)) {
      return normalizeText(authors)
    }
    return authors
      .map(function(author) {
        if (!author) return ""
        if (typeof author === "string") return normalizeText(author)
        return normalizeText(author.text || author.name || author.displayName || author.label)
      })
      .filter(Boolean)
      .join("; ")
  }

  function normalizeVenue(entry) {
    return normalizeText(
      entry.journal ||
      entry.booktitle ||
      entry.publisher ||
      entry.conference ||
      entry.source
    )
  }

  function createSearchBlob(snapshot) {
    return [
      snapshot.title,
      snapshot.titleAlt,
      snapshot.authors,
      snapshot.referenceType,
      snapshot.venue,
      snapshot.year,
      snapshot.keywords
    ]
      .join(" ")
      .toLowerCase()
  }

  function tokenizeQuery(text) {
    return normalizeText(text)
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
  }

  function computeSearchScore(snapshot, queryText, queryTokens) {
    const text = normalizeText(queryText).toLowerCase()
    if (!text) return 0

    const title = normalizeText(snapshot.title).toLowerCase()
    const titleAlt = normalizeText(snapshot.titleAlt).toLowerCase()
    const authors = normalizeText(snapshot.authors).toLowerCase()
    const venue = normalizeText(snapshot.venue).toLowerCase()
    const keywords = normalizeText(snapshot.keywords).toLowerCase()
    const abstract = normalizeText(snapshot.abstract).toLowerCase()
    const doi = normalizeText(snapshot.doi).toLowerCase()
    const year = normalizeText(snapshot.year).toLowerCase()
    let score = 0

    if (doi && doi === text) score += 420
    if (snapshot.id && normalizeText(snapshot.id).toLowerCase() === text) score += 400
    if (title && title === text) score += 320
    if (titleAlt && titleAlt === text) score += 280
    if (title && title.indexOf(text) === 0) score += 260
    if (titleAlt && titleAlt.indexOf(text) === 0) score += 220
    if (title && title.indexOf(text) >= 0) score += 180
    if (titleAlt && titleAlt.indexOf(text) >= 0) score += 140
    if (authors && authors.indexOf(text) >= 0) score += 130
    if (venue && venue.indexOf(text) >= 0) score += 115
    if (keywords && keywords.indexOf(text) >= 0) score += 110
    if (year && year === text) score += 90
    if (abstract && abstract.indexOf(text) >= 0) score += 40

    queryTokens.forEach(function(token) {
      if (token.length <= 1) return
      if (title && title.indexOf(token) >= 0) score += 30
      else if (titleAlt && titleAlt.indexOf(token) >= 0) score += 24
      else if (authors && authors.indexOf(token) >= 0) score += 18
      else if (keywords && keywords.indexOf(token) >= 0) score += 16
      else if (venue && venue.indexOf(token) >= 0) score += 14
      else if (abstract && abstract.indexOf(token) >= 0) score += 6
    })

    return score
  }

  function normalizeSnapshot(entry, libraryType) {
    if (!entry || !normalizeText(entry.id)) return null
    const snapshot = {
      id: normalizeText(entry.id),
      source: "mnliterature",
      libraryType: normalizeText(entry.type || libraryType || "article"),
      title: normalizeText(entry.title || entry.rawTitle),
      titleAlt: normalizeText(entry.titleAlt),
      authors: normalizeAuthors(entry.authors || entry.author),
      year: normalizeText(entry.year),
      referenceType: normalizeText(entry.referenceType || (libraryType === "book" ? "书籍" : "期刊论文")),
      venue: normalizeVenue(entry),
      keywords: Array.isArray(entry.keywords) ? entry.keywords.join("; ") : normalizeText(entry.keywords),
      abstract: normalizeText(entry.abstract),
      doi: normalizeText(entry.doi),
      md5: normalizeMd5(entry.md5 || entry.docMd5 || entry.docmd5 || entry.docMD5),
      hasCover: entry.hasCover === true
    }
    snapshot.searchBlob = createSearchBlob(snapshot)
    return snapshot
  }

  function mergeEntriesById(baseEntries, extraEntries) {
    const map = new Map()
    ;(Array.isArray(baseEntries) ? baseEntries : []).forEach(function(entry) {
      if (!entry || !entry.id) return
      map.set(entry.id, entry)
    })
    ;(Array.isArray(extraEntries) ? extraEntries : []).forEach(function(entry) {
      if (!entry || !entry.id) return
      map.set(entry.id, entry)
    })
    return Array.from(map.values())
  }

  function getInstance() {
    const instance = global.MNLiteratureInstance
    if (!instance) return null
    if (typeof instance.loadLibraryIndex !== "function") return null
    return instance
  }

  function callInstanceAction(methodName) {
    const instance = getInstance()
    if (!instance || typeof instance[methodName] !== "function") return false
    const args = Array.prototype.slice.call(arguments, 1)
    instance[methodName].apply(instance, args)
    return true
  }

  function loadIncrementalEntries() {
    const payloadInfo = readJSONFromCandidatePaths(buildDataFileCandidatePaths(["lit-incremental-index.json"]))
    const payload = payloadInfo ? payloadInfo.data : null
    return Array.isArray(payload && payload.entries) ? payload.entries : []
  }

  function pushUniquePath(paths, value) {
    const normalized = resolvePathLike(value)
    const variants = []
    if (normalized) {
      variants.push(normalized)
      if (normalized.indexOf("/private/var/") === 0) {
        variants.push(normalized.replace(/^\/private/, ""))
      } else if (normalized.indexOf("/var/") === 0) {
        variants.push(`/private${normalized}`)
      }
    }

    variants.forEach(function(path) {
      if (!path || paths.indexOf(path) >= 0) return
      paths.push(path)
    })
  }

  function getLiteratureDataRoots() {
    const roots = []
    const dbFolder = resolvePathLike(MNUtil && MNUtil.dbFolder)
    const documentFolder = resolvePathLike(MNUtil && MNUtil.documentFolder)
    pushUniquePath(roots, joinPath(dbFolder, "data"))
    pushUniquePath(roots, joinPath(documentFolder, "data"))
    pushUniquePath(roots, joinPath(documentFolder, ".MN4NotebookDatabase/data"))

    if (typeof MNResearchConfig !== "undefined" && MNResearchConfig) {
      if (typeof MNResearchConfig.getDataFolderCandidates === "function") {
        MNResearchConfig.getDataFolderCandidates().forEach(function(folder) {
          const normalized = resolvePathLike(folder)
          if (!normalized) return
          const parent = normalized.split("/").slice(0, -1).join("/")
          pushUniquePath(roots, parent)
          pushUniquePath(roots, joinPath(parent, "data"))
          pushUniquePath(roots, joinPath(parent, ".MN4NotebookDatabase/data"))
        })
      }
      if (typeof MNResearchConfig.getDocumentsBasePath === "function") {
        const documentsBasePath = resolvePathLike(MNResearchConfig.getDocumentsBasePath())
        pushUniquePath(roots, joinPath(documentsBasePath, "data"))
        pushUniquePath(roots, joinPath(documentsBasePath, ".MN4NotebookDatabase/data"))
      }
    }

    return roots
  }

  function buildDataFileCandidatePaths(filenames) {
    const paths = []
    getLiteratureDataRoots().forEach(function(root) {
      ;(Array.isArray(filenames) ? filenames : []).forEach(function(filename) {
        pushUniquePath(paths, joinPath(root, filename))
      })
    })
    return paths
  }

  function readJSONFromCandidatePaths(paths) {
    const candidates = Array.isArray(paths) ? paths : []
    for (let index = 0; index < candidates.length; index += 1) {
      const path = candidates[index]
      const payload = MNUtil.readJSON(path)
      if (payload) {
        return {
          data: payload,
          path: path
        }
      }
    }
    return null
  }

  function hasLocalIndex() {
    const candidates = buildDataFileCandidatePaths([
      "lit-article-index-manifest.json",
      "lit-article-index-full-manifest.json",
      "lit-article-index-light-manifest.json",
      "lit-book-index-manifest.json",
      "lit-book-index-full-manifest.json",
      "lit-book-index-light-manifest.json",
      "lit-incremental-index.json"
    ])
    if (readJSONFromCandidatePaths(candidates)) {
      return true
    }
    return candidates.some(function(path) {
      return !!(path && MNUtil.isfileExists(path))
    })
  }

  function getAvailability() {
    const instanceReady = !!getInstance()
    const localIndexReady = hasLocalIndex()
    return {
      instanceReady: instanceReady,
      localIndexReady: localIndexReady,
      canSearchInline: instanceReady || localIndexReady,
      canOpenLibrary: true
    }
  }

  function loadEntriesFromManifest(libraryType) {
    const manifestInfo = readJSONFromCandidatePaths(buildDataFileCandidatePaths([
      `lit-${libraryType}-index-manifest.json`,
      `lit-${libraryType}-index-full-manifest.json`,
      `lit-${libraryType}-index-light-manifest.json`
    ]))
    const manifestPath = manifestInfo ? manifestInfo.path : ""
    const manifest = manifestInfo ? manifestInfo.data : null
    if (!manifest || !Array.isArray(manifest.parts)) return []
    let entries = []
    const manifestFolder = manifestPath.split("/").slice(0, -1).join("/")
    manifest.parts.forEach(function(partInfo) {
      const filename = normalizeText(partInfo && partInfo.filename)
      if (!filename) return
      const partPath = filename.indexOf("/") === 0 ? filename : `${manifestFolder}/${filename}`
      const partData = MNUtil.readJSON(partPath)
      if (partData && Array.isArray(partData.data)) {
        entries = entries.concat(partData.data)
      }
    })
    debugLog("从索引清单加载文献条目", {
      libraryType: libraryType,
      manifestPath: manifestPath,
      entryCount: entries.length
    })
    return entries
  }

  function loadLibraryEntries(libraryType, options) {
    const instance = getInstance()
    if (instance) {
      const result = instance.loadLibraryIndex(libraryType, options || {})
      return Array.isArray(result && result.entries) ? result.entries : []
    }
    return loadEntriesFromManifest(libraryType)
  }

  function getAllSnapshots() {
    const articleEntries = loadLibraryEntries("article", { recoverMd5: false })
    const bookEntries = loadLibraryEntries("book", { recoverMd5: false })
    const incrementalEntries = loadIncrementalEntries()
    const mergedEntries = mergeEntriesById(
      mergeEntriesById(articleEntries, bookEntries),
      incrementalEntries
    )
    return mergedEntries
      .map(function(entry) {
        return normalizeSnapshot(entry, entry && entry.type ? entry.type : "")
      })
      .filter(Boolean)
  }

  function searchSnapshots(query, options) {
    const text = normalizeText(query).toLowerCase()
    const limit = options && Number.isFinite(Number(options.limit)) ? Number(options.limit) : 20
    const availability = getAvailability()
    if (!availability.canSearchInline) {
      debugLog("本地文献搜索不可用", {
        query: text,
        availability: availability
      })
      return []
    }
    const snapshots = getAllSnapshots()
    debugLog("执行本地文献搜索", {
      query: text,
      limit: limit,
      totalSnapshots: snapshots.length,
      availability: availability
    })
    if (!text) {
      return snapshots.slice(0, limit)
    }
    const tokens = tokenizeQuery(text)
    return snapshots
      .map(function(item) {
        return {
          item,
          score: computeSearchScore(item, text, tokens)
        }
      })
      .filter(function(entry) {
        return entry.score > 0
      })
      .sort(function(left, right) {
        if (right.score !== left.score) return right.score - left.score
        const leftYear = parseInt(left.item.year, 10)
        const rightYear = parseInt(right.item.year, 10)
        if (!isNaN(rightYear) && !isNaN(leftYear) && rightYear !== leftYear) {
          return rightYear - leftYear
        }
        return String(left.item.title || "").localeCompare(String(right.item.title || ""), "zh-CN")
      })
      .slice(0, limit)
      .map(function(entry) {
        return entry.item
      })
  }

  function findSnapshotById(noteId) {
    const targetId = normalizeText(noteId)
    if (!targetId) return null
    const instance = getInstance()
    if (instance && typeof instance.findLiteratureEntryById === "function") {
      const info = instance.findLiteratureEntryById(targetId)
      if (info && info.entry) {
        return normalizeSnapshot(info.entry, info.libraryType || info.entry.type || "")
      }
    }
    return getAllSnapshots().find(function(item) { return item.id === targetId }) || null
  }

  function getCurrentDocumentSnapshot() {
    const currentMd5 = normalizeMd5(MNUtil.currentDocmd5)
    if (!currentMd5) return null
    const instance = getInstance()
    if (instance) {
      const noteId = (typeof instance.findLiteratureByCoverMd5 === "function" && instance.findLiteratureByCoverMd5(currentMd5))
        || (typeof instance.findLiteratureByMd5 === "function" && instance.findLiteratureByMd5(currentMd5))
        || (typeof instance.findLiteratureByCoverMd5InLibraryNotes === "function" && instance.findLiteratureByCoverMd5InLibraryNotes(currentMd5))
        || (typeof instance.findLiteratureByMd5InLibraryNotes === "function" && instance.findLiteratureByMd5InLibraryNotes(currentMd5))
      if (noteId) {
        return findSnapshotById(noteId)
      }
    }
    return getAllSnapshots().find(function(item) { return item.md5 === currentMd5 }) || null
  }

  function postAddonBroadcast(params) {
    const payload = []
    Object.keys(params || {}).forEach(function(key) {
      if (params[key] === undefined || params[key] === null || params[key] === "") return
      payload.push(`${key}=${encodeURIComponent(String(params[key]))}`)
    })
    payload.push(`source=${encodeURIComponent("mnresearch")}`)
    debugLog("发送 MNLiterature AddonBroadcast", {
      params: params || {}
    })
    MNUtil.postNotification("AddonBroadcast", {
      message: `mnliterature?${payload.join("&")}`
    })
  }

  function openInMNLiterature(noteId, mode) {
    const action = normalizeText(mode || "focusCard") || "focusCard"
    debugLog("请求打开 MNLiterature", {
      noteId: normalizeText(noteId),
      mode: action,
      availability: getAvailability()
    })
    if (action === "openManager") {
      if (callInstanceAction("openLiteratureLibrary")) return true
      postAddonBroadcast({ action: "openManager" })
      return true
    }
    if (!normalizeText(noteId)) return false
    if (action === "focusCard" && callInstanceAction("handleFocusCard", noteId)) return true
    if (action === "focusCardAndEdit" && callInstanceAction("handleFocusCardAndEdit", noteId)) return true
    if (action === "focusCardAbstract" && callInstanceAction("handleFocusCardAbstract", noteId)) return true
    if (action === "startReading" && callInstanceAction("handleStartReading", noteId)) return true
    postAddonBroadcast({
      action: action,
      noteId: noteId
    })
    return true
  }

  function searchInMNLiterature(query, options) {
    const text = normalizeText(query)
    const view = normalizeText(options && options.view)
    debugLog("请求在 MNLiterature 中继续搜索", {
      query: text,
      view: view,
      availability: getAvailability()
    })
    if (!text) {
      return openInMNLiterature("", "openManager")
    }
    if (callInstanceAction("handleSearchLiterature", text, view ? { view: view } : {})) {
      return true
    }
    postAddonBroadcast({
      action: "searchLiterature",
      query: text,
      view: view
    })
    return true
  }

  global.MNResearchLiteratureAdapter = {
    getAvailability: getAvailability,
    isAvailable: function() {
      return getAvailability().canSearchInline
    },
    getPrimaryLiteratures: getAllSnapshots,
    searchLiteratures: searchSnapshots,
    findLiteratureById: findSnapshotById,
    getCurrentDocumentLiterature: getCurrentDocumentSnapshot,
    openInMNLiterature: openInMNLiterature,
    searchInMNLiterature: searchInMNLiterature
  }
})(typeof globalThis !== "undefined" ? globalThis : this)
