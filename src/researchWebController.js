const MNRESEARCH_SCHEME = "mnresearch"
const MNResearchRoot = typeof globalThis !== "undefined" ? globalThis : this

function previewQueryText(text, maxLength) {
  const value = String(text || "").trim()
  if (!value) return ""
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength)}…`
}

function buildMNLiteratureBroadcastMessage(params) {
  const pairs = []
  const payload = Object.assign({ source: "mnresearch" }, params || {})
  Object.keys(payload).forEach(function(key) {
    if (payload[key] === undefined || payload[key] === null || payload[key] === "") return
    pairs.push(`${key}=${encodeURIComponent(String(payload[key]))}`)
  })
  return `mnliterature?${pairs.join("&")}`
}

function postMNLiteratureBroadcast(params) {
  try {
    const message = buildMNLiteratureBroadcastMessage(params)
    MNUtil.postNotification("AddonBroadcast", { message })
    MNResearchUtils.verboseLog("发送 MNLiterature fallback 广播", "researchWebController.mnliteratureFallback", {
      params: params || {},
      message
    })
    return true
  } catch (error) {
    MNResearchUtils.addErrorLog(error, "researchWebController.postMNLiteratureBroadcast", {
      params
    })
    return false
  }
}

var researchWebController = JSB.defineClass("researchWebController : UIViewController <UIWebViewDelegate>", {
  viewDidLoad: function() {
    try {
      self.init()

      let savedFrameStr = NSUserDefaults.standardUserDefaults().objectForKey(MNResearchConfig.windowFrameKey)
      let initialFrame = savedFrameStr
        ? JSON.parse(savedFrameStr)
        : { x: 50, y: 30, width: 960, height: 720 }

      self.view.frame = initialFrame
      self.lastFrame = self.view.frame
      self.currentFrame = self.view.frame

      self.webView = new UIWebView({ x: 10, y: 25, width: 940, height: 685 })
      self.webView.backgroundColor = UIColor.whiteColor()
      self.webView.delegate = self
      self.webView.scalesPageToFit = true
      self.view.addSubview(self.webView)
      self.webViewLoaded = false

      self.createButton("moveButton", "moveButtonTapped:")
      self.moveButton.clickDate = 0
      MNButton.setColor(self.moveButton, "#3a81fb", 0.5)
      MNButton.addPanGesture(self.moveButton, self, "onMoveGesture:")

      self.createButton("closeButton", "closeButtonTapped:")
      self.closeButton.setTitleForState("×", 0)
      self.closeButton.titleLabel.font = UIFont.boldSystemFontOfSize(20)
      MNButton.setColor(self.closeButton, "#e06c75")

      self.createButton("resizeButton")
      self.resizeButton.setTitleForState("↘", 0)
      self.resizeButton.titleLabel.font = UIFont.systemFontOfSize(16)
      MNButton.setColor(self.resizeButton, "#457bd3")
      MNButton.addPanGesture(self.resizeButton, self, "onResizeGesture:")
    } catch (error) {
      MNResearchUtils.addErrorLog(error, "researchWebController.viewDidLoad")
    }
  },

  viewWillLayoutSubviews: function() {
    try {
      if (self.miniMode) {
        return
      }

      if (!self.moveButton || !self.closeButton || !self.resizeButton || !self.webView) {
        return
      }

      let viewFrame = self.view.bounds
      let width = viewFrame.width
      let height = viewFrame.height

      self.moveButton.frame = { x: width * 0.5 - 75, y: 0, width: 150, height: 16 }
      self.closeButton.frame = { x: width - 40, y: 5, width: 30, height: 30 }
      self.resizeButton.frame = { x: width - 34, y: height - 36, width: 30, height: 30 }
      self.webView.frame = { x: 10, y: 25, width: width - 20, height: height - 35 }
    } catch (error) {
      MNResearchUtils.addErrorLog(error, "researchWebController.viewWillLayoutSubviews")
    }
  },

  viewWillDisappear: function(animated) {
    if (self.viewTimer) {
      self.viewTimer.invalidate()
      self.viewTimer = undefined
    }
  },

  webViewShouldStartLoadWithRequestNavigationType: function(webView, request, type) {
    try {
      let config = MNUtil.parseURL(request)
      if (!config || config.scheme !== MNRESEARCH_SCHEME) {
        return true
      }

      self.executeBridgeAction(config)
      return false
    } catch (error) {
      MNResearchUtils.addErrorLog(error, "researchWebController.webViewShouldStartLoadWithRequestNavigationType")
      return false
    }
  },

  webViewDidFinishLoad: function(webView) {
    self.webViewLoaded = true
    self.webAppReady = false
    MNResearchUtils.log("research.html 已加载完成", "researchWebController.webViewDidFinishLoad")
  },

  webViewDidFailLoadWithError: function(webView, error) {
    MNResearchUtils.addErrorLog(error, "researchWebController.webViewDidFailLoadWithError")
  },

  moveButtonTapped: function(button) {
    if (self.miniMode) {
      self.fromMinimode()
    }
  },

  closeButtonTapped: function() {
    if (self.addonBar) {
      self.hide(self.addonBar.frame)
    } else {
      self.hide()
    }
  },

  onMoveGesture: function(gesture) {
    if (self.onAnimate) {
      return
    }

    let locationToMN = gesture.locationInView(MNUtil.studyView)

    if (!self.locationToButton || (!self.miniMode && (Date.now() - self.moveDate) > 100)) {
      let translation = gesture.translationInView(MNUtil.studyView)
      let locationToButton = gesture.locationInView(gesture.view)
      let newY = locationToButton.y - translation.y
      let newX = locationToButton.x - translation.x
      if (gesture.state === 1) {
        self.lastFrame = self.view.frame
        self.locationToButton = { x: newX, y: newY }
      }
    }

    self.moveDate = Date.now()

    let location = {
      x: locationToMN.x - self.locationToButton.x - gesture.view.frame.x,
      y: locationToMN.y - self.locationToButton.y - gesture.view.frame.y
    }

    let frame = self.view.frame
    let studyFrame = MNUtil.studyView.bounds
    let y = MNUtil.constrain(location.y, 0, studyFrame.height - 15)
    let x = location.x

    if (!self.miniMode) {
      if (locationToMN.x < 40) {
        self.toMinimode(MNUtil.genFrame(0, locationToMN.y, 40, 40), self.lastFrame)
        return
      }
      if (locationToMN.x > studyFrame.width - 40) {
        self.toMinimode(MNUtil.genFrame(studyFrame.width - 40, locationToMN.y, 40, 40), self.lastFrame)
        return
      }
    }

    self.setFrame(x, y, frame.width, frame.height)
  },

  onResizeGesture: function(gesture) {
    try {
      if (self.onAnimate) {
        return
      }

      if (gesture.state === 1) {
        self.originalLocationToMN = gesture.locationInView(MNUtil.studyView)
        self.originalFrame = self.view.frame
      }

      if (gesture.state === 2) {
        let locationToMN = gesture.locationInView(MNUtil.studyView)
        let locationDiff = {
          x: locationToMN.x - self.originalLocationToMN.x,
          y: locationToMN.y - self.originalLocationToMN.y
        }
        let frame = self.view.frame
        let studyFrame = MNUtil.studyView.bounds

        frame.width = self.originalFrame.width + locationDiff.x
        frame.height = self.originalFrame.height + locationDiff.y
        frame.width = MNUtil.constrain(frame.width, 520, studyFrame.width)
        frame.height = MNUtil.constrain(frame.height, 420, studyFrame.height - 20)

        if (frame.x + frame.width > studyFrame.width) {
          frame.width = studyFrame.width - frame.x
        }
        if (frame.y + frame.height > studyFrame.height - 20) {
          frame.height = studyFrame.height - frame.y - 20
        }

        self.setFrame(frame)
      }

      if (gesture.state === 3) {
        MNUtil.studyView.bringSubviewToFront(self.view)
        self.persistWindowFrame(self.view.frame)
      }
    } catch (error) {
      MNResearchUtils.addErrorLog(error, "researchWebController.onResizeGesture")
    }
  }
})

researchWebController.prototype.loadHTMLFile = function() {
  try {
    if (this.currentHTMLType === "research" && this.webViewLoaded) {
      return
    }

    let htmlPath = `${MNResearchConfig.mainPath}/research.html`
    if (!MNUtil.isfileExists(htmlPath)) {
      MNUtil.showHUD(`HTML 文件不存在: ${htmlPath}`)
      return
    }

    this.webView.loadFileURLAllowingReadAccessToURL(
      NSURL.fileURLWithPath(htmlPath),
      NSURL.fileURLWithPath(`${MNResearchConfig.mainPath}/`)
    )
    this.currentHTMLType = "research"
    this.webViewLoaded = false
    this.webAppReady = false
  } catch (error) {
    MNResearchUtils.addErrorLog(error, "researchWebController.loadHTMLFile")
  }
}

researchWebController.prototype.persistWindowFrame = function(frame) {
  try {
    const payload = {
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: frame.height
    }
    NSUserDefaults.standardUserDefaults().setObjectForKey(
      JSON.stringify(payload),
      MNResearchConfig.windowFrameKey
    )
  } catch (error) {
    MNResearchUtils.addErrorLog(error, "researchWebController.persistWindowFrame")
  }
}

researchWebController.prototype.runJavaScript = async function(script, delay) {
  if (!this.webView || !this.webView.window) {
    return undefined
  }

  if (this.viewTimer) {
    try {
      this.viewTimer.invalidate()
    } catch (_) {}
    this.viewTimer = undefined
  }

  return new Promise((resolve) => {
    const evaluate = () => {
      try {
        this.webView.evaluateJavaScript(script, (result) => {
          resolve(MNUtil.isNSNull(result) ? undefined : result)
        })
      } catch (error) {
        MNResearchUtils.addErrorLog(error, "researchWebController.runJavaScript")
        resolve(undefined)
      }
    }

    if (delay && Number(delay) > 0) {
      this.viewTimer = NSTimer.scheduledTimerWithTimeInterval(Number(delay), false, () => {
        this.viewTimer = undefined
        evaluate()
      })
      return
    }

    evaluate()
  })
}

researchWebController.prototype.deliverLoadedState = function(state, reason = "load") {
  const payload = MNResearchConfig.normalizeStatePayload(state)
  const addonMeta = MNResearchConfig.normalizeAddonMeta(MNResearchConfig.addonMeta)
  const script = `
    (function() {
      try {
        if (window.MNResearchApp && typeof window.MNResearchApp.setAppMeta === "function") {
          window.MNResearchApp.setAppMeta(${JSON.stringify(addonMeta)});
        }
        if (window.MNResearchApp && typeof window.MNResearchApp.applyNativeState === "function") {
          window.MNResearchApp.applyNativeState(${JSON.stringify(payload)}, ${JSON.stringify(reason)});
          return true;
        }
        return false;
      } catch (error) {
        return { __error: String(error && error.message || error) };
      }
    })();
  `
  this.runJavaScript(script)
}

researchWebController.prototype.deliverInputHistory = function(payload) {
  const normalized = MNResearchConfig.normalizeInputHistoryPayload(payload)
  const script = `
    (function() {
      try {
        if (window.MNResearchApp && typeof window.MNResearchApp.setInputHistory === "function") {
          window.MNResearchApp.setInputHistory(${JSON.stringify(normalized)});
          return true;
        }
        return false;
      } catch (error) {
        return false;
      }
    })();
  `
  this.runJavaScript(script)
}

researchWebController.prototype.notifySaveResult = function(success, reason, detailMessage) {
  const script = `
    (function() {
      try {
        if (!window.MNResearchApp) return false;
        if (${success ? "true" : "false"}) {
          if (typeof window.MNResearchApp.onNativeSaveComplete === "function") {
            window.MNResearchApp.onNativeSaveComplete(${JSON.stringify(new Date().toISOString())}, ${JSON.stringify(reason || "save")});
          }
        } else {
          if (typeof window.MNResearchApp.onNativeSaveError === "function") {
            window.MNResearchApp.onNativeSaveError(${JSON.stringify(detailMessage || "保存失败")}, ${JSON.stringify(reason || "save")});
          }
        }
        return true;
      } catch (error) {
        return false;
      }
    })();
  `
  this.runJavaScript(script)
}

researchWebController.prototype.deliverLiteratureSearchPayload = function(payload) {
  const script = `
    (function() {
      try {
        if (window.MNResearchApp && typeof window.MNResearchApp.setLiteratureSearchPayload === "function") {
          window.MNResearchApp.setLiteratureSearchPayload(${JSON.stringify(payload || {})});
          return true;
        }
        return false;
      } catch (error) {
        return false;
      }
    })();
  `
  this.runJavaScript(script)
}

researchWebController.prototype.deliverCurrentDocumentLiterature = function(payload) {
  const script = `
    (function() {
      try {
        if (window.MNResearchApp && typeof window.MNResearchApp.setCurrentDocumentLiterature === "function") {
          window.MNResearchApp.setCurrentDocumentLiterature(${JSON.stringify(payload || null)});
          return true;
        }
        return false;
      } catch (error) {
        return false;
      }
    })();
  `
  this.runJavaScript(script)
}

researchWebController.prototype.executeBridgeAction = function(config) {
  try {
    const action = String(config.host || "").trim()
    switch (action) {
      case "ready":
        this.webAppReady = true
        this.deliverLoadedState(MNResearchConfig.loadStateData(), "ready")
        this.deliverInputHistory(MNResearchConfig.loadInputHistory())
        this.deliverCurrentDocumentLiterature(
          MNResearchRoot.MNResearchLiteratureAdapter && typeof MNResearchRoot.MNResearchLiteratureAdapter.getCurrentDocumentLiterature === "function"
            ? MNResearchRoot.MNResearchLiteratureAdapter.getCurrentDocumentLiterature()
            : null
        )
        return
      case "htmlLog":
        MNResearchUtils.log(config.params && config.params.message, "web")
        return
      case "saveState": {
        const payload = config.params ? config.params.payload : null
        if (!payload) {
          return
        }
        const state = MNResearchConfig.parseIncomingStatePayload(payload)
        if (!state) {
          return
        }
        const saveOk = MNResearchConfig.saveStateData(state, {
          reason: "web-save",
          writeBackup: true
        })
        if (!saveOk) {
          MNUtil.showHUD("研究数据保存失败")
          this.notifySaveResult(false, config.params && config.params.reason || "web-save", "研究数据保存失败")
          return
        }
        this.notifySaveResult(true, config.params && config.params.reason || "web-save")
        return
      }
      case "beginSaveState": {
        const token = String(config.params && config.params.token || "")
        const totalChunks = parseInt(config.params && config.params.totalChunks, 10)
        if (!token || !totalChunks || totalChunks < 1) {
          return
        }
        this.pendingStateBuffers[token] = {
          totalChunks,
          reason: String(config.params && config.params.reason || "chunked-save"),
          chunks: new Array(totalChunks)
        }
        return
      }
      case "saveStateChunk": {
        const token = String(config.params && config.params.token || "")
        const index = parseInt(config.params && config.params.index, 10)
        if (!token || !this.pendingStateBuffers[token] || isNaN(index) || index < 0) {
          return
        }
        this.pendingStateBuffers[token].chunks[index] = String(config.params && config.params.chunk || "")
        return
      }
      case "commitSaveState": {
        const token = String(config.params && config.params.token || "")
        const entry = token ? this.pendingStateBuffers[token] : null
        if (!entry) {
          return
        }
        delete this.pendingStateBuffers[token]

        const payload = entry.chunks.join("")
        if (!payload) {
          return
        }
        const state = MNResearchConfig.parseIncomingStatePayload(payload)
        if (!state) {
          return
        }
        const saveOk = MNResearchConfig.saveStateData(state, {
          reason: entry.reason || "chunked-save",
          writeBackup: true
        })
        if (!saveOk) {
          MNUtil.showHUD("研究数据保存失败")
          this.notifySaveResult(false, entry.reason || "chunked-save", "研究数据保存失败")
          return
        }
        this.notifySaveResult(true, entry.reason || "chunked-save")
        return
      }
      case "requestCurrentState":
        this.deliverLoadedState(MNResearchConfig.loadStateData(), "request")
        return
      case "requestInputHistory":
        this.deliverInputHistory(MNResearchConfig.loadInputHistory())
        return
      case "recordReusableInput": {
        const field = String(config.params && config.params.field || "")
        const value = String(config.params && config.params.value || "")
        if (!field || !value) {
          return
        }
        MNResearchConfig.recordReusableInput(field, value)
        return
      }
      case "requestExport": {
        const filePath = MNResearchConfig.exportStateToFile(MNResearchConfig.loadStateData())
        if (filePath) {
          MNUtil.showHUD("已导出研究数据")
        } else {
          MNUtil.showHUD("导出研究数据失败")
        }
        return
      }
      case "requestImport": {
        this.importStateFromFileAndDeliver()
        return
      }
      case "requestBackup": {
        const state = MNResearchConfig.loadStateData()
        MNResearchConfig.saveBackupSnapshot(state, "web-backup")
        const exportedPath = MNResearchConfig.exportStateToFile(state, "mnresearch-backup")
        MNUtil.showHUD(exportedPath ? "已备份并导出研究数据" : "已备份到本地")
        return
      }
      case "requestLiteratureSearch": {
        const query = String(config.params && config.params.query || "")
        const limit = parseInt(config.params && config.params.limit, 10)
        const startedAt = Date.now()
        const adapter = MNResearchRoot.MNResearchLiteratureAdapter
        const availability = adapter && typeof adapter.getAvailability === "function"
          ? adapter.getAvailability()
          : {
              canSearchInline: !!(adapter && typeof adapter.searchLiteratures === "function"),
              canOpenLibrary: true,
              instanceReady: false,
              localIndexReady: false
            }
        const isAvailable = !!availability.canSearchInline
        MNResearchUtils.verboseLog("收到文献搜索请求", "researchWebController.requestLiteratureSearch", {
          queryLength: query.length,
          queryPreview: previewQueryText(query, 48),
          limit: isNaN(limit) ? 20 : limit,
          availability
        })
        const results = isAvailable && adapter && typeof adapter.searchLiteratures === "function"
          ? adapter.searchLiteratures(query, { limit: isNaN(limit) ? 20 : limit })
          : []
        const errorMessage = isAvailable
          ? ""
          : (availability.canOpenLibrary
              ? "没读到可用的本地文献索引，这里暂时搜不了。请先在 MNLiterature 打开或重建索引。"
              : "MNLiterature 不可用或尚未建立索引。")
        MNResearchUtils.verboseLog("文献搜索请求完成", "researchWebController.requestLiteratureSearch", {
          queryLength: query.length,
          queryPreview: previewQueryText(query, 48),
          limit: isNaN(limit) ? 20 : limit,
          available: isAvailable,
          availability,
          resultCount: Array.isArray(results) ? results.length : 0,
          topIds: Array.isArray(results)
            ? results.slice(0, 3).map(function(item) {
                return item && item.id ? item.id : ""
              }).filter(Boolean)
            : [],
          costMs: Date.now() - startedAt
        })
        this.deliverLiteratureSearchPayload({
          available: isAvailable,
          query,
          results,
          error: errorMessage
        })
        return
      }
      case "requestCurrentDocumentLiterature": {
        const adapter = MNResearchRoot.MNResearchLiteratureAdapter
        const payload = adapter && typeof adapter.getCurrentDocumentLiterature === "function"
          ? adapter.getCurrentDocumentLiterature()
          : null
        this.deliverCurrentDocumentLiterature(payload || null)
        return
      }
      case "searchLiteratureInLibrary": {
        const query = String(config.params && config.params.query || "")
        const view = String(config.params && config.params.view || "")
        const adapter = MNResearchRoot.MNResearchLiteratureAdapter
        const startedAt = Date.now()
        const ok = adapter && typeof adapter.searchInMNLiterature === "function"
          ? adapter.searchInMNLiterature(query, { view })
          : postMNLiteratureBroadcast({
              action: query.trim() ? "searchLiterature" : "openManager",
              query: query.trim(),
              view
            })
        MNResearchUtils.verboseLog("请求在 MNLiterature 中继续搜索", "researchWebController.searchLiteratureInLibrary", {
          queryLength: query.length,
          queryPreview: previewQueryText(query, 48),
          view,
          usedAdapter: !!(adapter && typeof adapter.searchInMNLiterature === "function"),
          ok,
          costMs: Date.now() - startedAt
        })
        if (!ok) {
          MNUtil.showHUD("无法打开文献库搜索")
        }
        return
      }
      case "openLiteratureCard": {
        const noteId = String(config.params && config.params.noteId || "")
        const mode = String(config.params && config.params.mode || "focusCard")
        const adapter = MNResearchRoot.MNResearchLiteratureAdapter
        const startedAt = Date.now()
        const ok = adapter && typeof adapter.openInMNLiterature === "function"
          ? adapter.openInMNLiterature(noteId, mode)
          : postMNLiteratureBroadcast({
              action: mode || "focusCard",
              noteId
            })
        MNResearchUtils.verboseLog("请求打开文献卡", "researchWebController.openLiteratureCard", {
          noteId,
          mode,
          usedAdapter: !!(adapter && typeof adapter.openInMNLiterature === "function"),
          ok,
          costMs: Date.now() - startedAt
        })
        if (!ok) {
          MNUtil.showHUD("无法打开文献库")
        }
        return
      }
      default:
        MNResearchUtils.log(`未处理的 bridge action: ${action}`, "bridge")
    }
  } catch (error) {
    MNResearchUtils.addErrorLog(error, "researchWebController.executeBridgeAction", {
      config
    })
  }
}

researchWebController.prototype.importStateFromFileAndDeliver = async function() {
  try {
    const state = await MNResearchConfig.importStateFromFile()
    if (!state) {
      MNUtil.showHUD("未导入任何研究数据")
      return
    }

    const saveOk = MNResearchConfig.saveStateData(state, {
      reason: "web-import",
      writeBackup: true
    })
    if (!saveOk) {
      MNUtil.showHUD("导入研究数据失败")
      return
    }

    this.deliverLoadedState(state, "import")
    MNUtil.showHUD("已导入研究数据")
  } catch (error) {
    MNResearchUtils.addErrorLog(error, "researchWebController.importStateFromFileAndDeliver")
    MNUtil.showHUD("导入研究数据失败")
  }
}

researchWebController.prototype.show = async function(beginFrame, endFrame) {
  let savedFrame = null
  if (!endFrame) {
    try {
      let savedFrameStr = NSUserDefaults.standardUserDefaults().objectForKey(MNResearchConfig.windowFrameKey)
      if (savedFrameStr) {
        savedFrame = JSON.parse(savedFrameStr)
      }
    } catch (_) {}
  }

  let targetFrame = endFrame || savedFrame || { x: 50, y: 40, width: 960, height: 720 }
  let studyFrame = MNUtil.studyView.frame

  targetFrame.height = MNUtil.constrain(targetFrame.height, 420, studyFrame.height)
  targetFrame.width = MNUtil.constrain(targetFrame.width, 520, studyFrame.width)
  targetFrame.x = MNUtil.constrain(targetFrame.x, 0, studyFrame.width - targetFrame.width)
  targetFrame.y = MNUtil.constrain(targetFrame.y, 0, studyFrame.height - targetFrame.height)

  if (beginFrame) {
    this.view.frame = beginFrame
  }

  this.view.layer.opacity = 0.2
  this.view.hidden = false

  MNUtil.animate(() => {
    this.view.layer.opacity = 1.0
    this.view.frame = targetFrame
  }).then(() => {
    MNUtil.studyView.bringSubviewToFront(this.view)
    if (this.webViewLoaded && this.webAppReady) {
      this.deliverLoadedState(MNResearchConfig.loadStateData(), "show")
      this.deliverCurrentDocumentLiterature(
        MNResearchRoot.MNResearchLiteratureAdapter && typeof MNResearchRoot.MNResearchLiteratureAdapter.getCurrentDocumentLiterature === "function"
          ? MNResearchRoot.MNResearchLiteratureAdapter.getCurrentDocumentLiterature()
          : null
      )
    }
  })
}

researchWebController.prototype.hide = function(frame) {
  let preFrame = this.view.frame
  this.persistWindowFrame(preFrame)
  this.onAnimate = true
  let preOpacity = this.view.layer.opacity

  MNUtil.animate(() => {
    this.view.layer.opacity = 0.2
    if (frame) {
      this.view.frame = frame
      this.currentFrame = frame
    }
  }, 0.3).then(() => {
    this.onAnimate = false
    this.view.hidden = true
    this.view.layer.opacity = preOpacity
    this.view.frame = preFrame
    this.currentFrame = preFrame
  })
}

researchWebController.prototype.init = function() {
  this.isFirst = true
  this.miniMode = false
  this.onAnimate = false
  this.moveDate = 0
  this.currentHTMLType = null
  this.webAppReady = false
  this.pendingStateBuffers = {}

  if (!this.lastFrame) {
    this.lastFrame = this.view.frame
  }
  if (!this.currentFrame) {
    this.currentFrame = this.view.frame
  }

  this.view.layer.shadowOffset = { width: 0, height: 0 }
  this.view.layer.shadowRadius = 15
  this.view.layer.shadowOpacity = 0.5
  this.view.layer.shadowColor = UIColor.colorWithWhiteAlpha(0.5, 1)
  this.view.layer.cornerRadius = 15
  this.view.layer.opacity = 1.0
  this.view.backgroundColor = UIColor.whiteColor().colorWithAlphaComponent(0.82)
  this.view.layer.borderColor = MNUtil.hexColorAlpha("#9bb2d6", 0.8)
  this.view.layer.borderWidth = 0

  this.highlightColor = UIColor.blendedColor(
    MNUtil.hexColorAlpha("#2c4d81", 0.8),
    MNUtil.app.defaultTextColor,
    0.8
  )
}

researchWebController.prototype.setFrame = function(frame) {
  if (typeof frame === "object") {
    this.view.frame = frame
  } else if (arguments.length === 4) {
    this.view.frame = MNUtil.genFrame(arguments[0], arguments[1], arguments[2], arguments[3])
  }
  this.currentFrame = this.view.frame
}

researchWebController.prototype.setAllButton = function(hidden) {
  if (this.moveButton) {
    this.moveButton.hidden = hidden
  }
  if (this.closeButton) {
    this.closeButton.hidden = hidden
  }
  if (this.resizeButton) {
    this.resizeButton.hidden = hidden
  }
  if (this.webView) {
    this.webView.hidden = hidden
  }
}

researchWebController.prototype.createButton = function(buttonName, targetAction, superview) {
  this[buttonName] = UIButton.buttonWithType(0)
  this[buttonName].autoresizingMask = (1 << 0 | 1 << 3)
  this[buttonName].setTitleColorForState(UIColor.whiteColor(), 0)
  this[buttonName].setTitleColorForState(this.highlightColor, 1)
  this[buttonName].backgroundColor = MNUtil.hexColorAlpha("#9bb2d6", 0.8)
  this[buttonName].layer.cornerRadius = 8
  this[buttonName].layer.masksToBounds = true
  this[buttonName].titleLabel.font = UIFont.systemFontOfSize(16)

  if (targetAction) {
    this[buttonName].addTargetActionForControlEvents(this, targetAction, 1 << 6)
  }

  if (superview) {
    this[superview].addSubview(this[buttonName])
  } else {
    this.view.addSubview(this[buttonName])
  }
}

researchWebController.prototype.toMinimode = function(frame, lastFrame) {
  this.miniMode = true
  this.lastFrame = lastFrame || this.view.frame
  this.currentFrame = this.view.frame
  this.setAllButton(true)

  let color = "#9bb2d6"
  this.view.layer.borderWidth = 0
  this.view.layer.backgroundColor = MNUtil.hexColorAlpha(color, 0.8)
  this.view.layer.borderColor = MNUtil.hexColorAlpha(color, 0.8)

  MNUtil.animate(() => {
    this.setFrame(frame)
  }).then(() => {
    this.moveButton.frame = MNUtil.genFrame(0, 0, 40, 40)
    this.moveButton.hidden = false
    this.moveButton.enabled = true
    this.moveButton.setTitleForState("📚", 0)
    this.moveButton.titleLabel.font = UIFont.systemFontOfSize(20)
    this.moveButton.titleLabel.textAlignment = 1
    this.view.bringSubviewToFront(this.moveButton)
  })
}

researchWebController.prototype.fromMinimode = function() {
  try {
    if (!this.miniMode) {
      return
    }

    let studyFrame = MNUtil.studyView.bounds
    if (this.lastFrame) {
      this.lastFrame.x = MNUtil.constrain(this.lastFrame.x, 0, studyFrame.width - this.lastFrame.width)
      this.lastFrame.y = MNUtil.constrain(this.lastFrame.y, 20, studyFrame.height - this.lastFrame.height - 20)
    } else {
      this.lastFrame = { x: 50, y: 40, width: 960, height: 720 }
    }

    let preOpacity = this.view.layer.opacity
    this.view.layer.opacity = 0
    this.setAllButton(true)
    this.onAnimate = true
    let color = "#9bb2d6"
    this.view.layer.backgroundColor = MNUtil.hexColorAlpha(color, 0.8)
    this.view.layer.borderColor = MNUtil.hexColorAlpha(color, 0.8)

    MNUtil.animate(() => {
      this.view.layer.opacity = preOpacity
      this.setFrame(this.lastFrame.x, this.lastFrame.y, this.lastFrame.width, this.lastFrame.height)
    }).then(() => {
      this.onAnimate = false
      let viewFrame = this.view.bounds
      this.moveButton.frame = { x: viewFrame.width * 0.5 - 75, y: 5, width: 150, height: 10 }
      this.view.layer.borderWidth = 0
      this.view.layer.borderColor = MNUtil.hexColorAlpha(color, 0.0)
      this.view.layer.backgroundColor = MNUtil.hexColorAlpha(color, 0.0)
      this.view.hidden = false
      this.setAllButton(false)
      this.moveButton.setTitleForState("", 0)
    })

    this.miniMode = false
    MNUtil.studyView.bringSubviewToFront(this.view)
  } catch (error) {
    this.onAnimate = false
    this.miniMode = false
    MNResearchUtils.addErrorLog(error, "researchWebController.fromMinimode")
  }
}
