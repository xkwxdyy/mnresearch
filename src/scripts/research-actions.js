(function(global) {
  const store = global.MNResearchStore
  const dataAPI = global.MNResearchData
  const researchCore = global.MNResearch && global.MNResearch.core

  const strategyCycle = [
    "exploring",
    "promising",
    "stalled",
    "blocked",
    "failed",
    "succeeded"
  ]
  const REUSABLE_INPUT_HISTORY_FIELDS = {
    "new-judgment-type": "judgment-type",
    "edit-judgment-type": "judgment-type",
    "new-judgment-status": "judgment-status",
    "edit-judgment-status": "judgment-status",
    "new-strategy-method-tags": "strategy-type",
    "edit-strategy-method-tags": "strategy-type",
    "new-strategy-branch-intent": "strategy-branch-intent",
    "edit-strategy-branch-intent": "strategy-branch-intent",
    "branch-link-role": "branch-role",
    "branch-link-contribution": "branch-contribution",
    "new-example-type": "example-type",
    "edit-example-type": "example-type",
    "new-obstacle-type": "obstacle-type",
    "edit-obstacle-type": "obstacle-type",
    "new-insight-type": "insight-type",
    "edit-insight-type": "insight-type"
  }
  const SECTION_TAB_MAP = {
    timeline: true,
    overview: true,
    formulation: true,
    judgments: true,
    strategies: true,
    examples: true,
    obstacles: true,
    insights: true,
    literature: true
  }
  let literatureSearchTimer = null
  const literatureSearchDelay = 280

  function getApp() {
    return global.MNResearchApp
  }

  function inputValue(selector) {
    const node = document.querySelector(`[data-input="${selector}"]`)
    return node ? String(node.value || "").trim() : ""
  }

  function clearInput(selector) {
    const node = document.querySelector(`[data-input="${selector}"]`)
    if (node) node.value = ""
  }

  function normalizeStringList(value) {
    if (dataAPI && typeof dataAPI.normalizeStringList === "function") {
      return dataAPI.normalizeStringList(value)
    }
    return Array.isArray(value) ? value.filter(Boolean) : []
  }

  function serializeStringList(value) {
    if (dataAPI && typeof dataAPI.serializeStringList === "function") {
      return dataAPI.serializeStringList(value)
    }
    return JSON.stringify(normalizeStringList(value))
  }

  function inputValues(selector, labelMap) {
    const rawValue = inputValue(selector)
    if (!rawValue) return []
    const values = normalizeStringList(rawValue)
    if (dataAPI && typeof dataAPI.resolveMappedValues === "function" && labelMap) {
      return dataAPI.resolveMappedValues(values, labelMap)
    }
    return values
  }

  function normalizeMarkdownText(value) {
    const text = String(value == null ? "" : value)
    if (global.MNResearchMarkdown && typeof global.MNResearchMarkdown.stripLatexLeftRightInInlineMath === "function") {
      return global.MNResearchMarkdown.stripLatexLeftRightInInlineMath(text)
    }
    return text
  }

  function markdownValue(selector) {
    return normalizeMarkdownText(inputValue(selector))
  }

  function markdownLines(selector) {
    return splitLines(inputValue(selector)).map(normalizeMarkdownText).filter(Boolean)
  }

  function isComposingInput(target) {
    return !!(target && target.getAttribute && target.getAttribute("data-composing") === "true")
  }

  function closeHtmlSelects(exceptRoot) {
    const roots = document.querySelectorAll(".html-select.is-open")
    Array.prototype.forEach.call(roots, function(root) {
      if (exceptRoot && root === exceptRoot) return
      root.classList.remove("is-open")
      const trigger = root.querySelector(".html-select-trigger")
      if (trigger) trigger.setAttribute("aria-expanded", "false")
    })
  }

  function normalizeComparableText(value) {
    if (dataAPI && typeof dataAPI.normalizeComparableText === "function") {
      return dataAPI.normalizeComparableText(value)
    }
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim().toLowerCase()
  }

  function resolveMappedValue(value, labels) {
    if (dataAPI && typeof dataAPI.resolveMappedValue === "function") {
      return dataAPI.resolveMappedValue(value, labels)
    }
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim()
  }

  function closeHistoryInputs(exceptRoot) {
    const roots = document.querySelectorAll(".history-input.is-open, .history-tag-input.is-open")
    Array.prototype.forEach.call(roots, function(root) {
      if (exceptRoot && root === exceptRoot) return
      root.classList.remove("is-open")
    })
  }

  function getHistoryTagValues(root) {
    if (!root) return []
    const hidden = root.querySelector('[data-input]')
    return normalizeStringList(hidden ? hidden.value : [])
  }

  function renderHistoryTagChips(root, values) {
    const list = root ? root.querySelector('[data-history-tag-list]') : null
    if (!list) return
    const inputName = root.getAttribute("data-history-tag-input") || ""
    list.innerHTML = normalizeStringList(values).map(function(value) {
      return `
        <span class="chip history-tag-chip">
          <span>${value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")}</span>
          <button
            class="history-tag-remove"
            data-action="remove-history-tag"
            data-tag-input="${inputName.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"
            data-tag-value="${value.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"
            type="button"
            aria-label="${(`移除标签 ${value}`).replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"
          >×</button>
        </span>
      `
    }).join("")
  }

  function writeHistoryTagValues(root, values) {
    if (!root) return
    const hidden = root.querySelector('[data-input]')
    if (!hidden) return
    const normalizedValues = normalizeStringList(values)
    hidden.value = serializeStringList(normalizedValues)
    renderHistoryTagChips(root, normalizedValues)
  }

  function updateHistoryTagInputMenu(root) {
    if (!root) return
    const input = root.querySelector(".history-tag-input-control")
    const empty = root.querySelector(".history-input-empty")
    const options = root.querySelectorAll(".history-input-option")
    const selectedValues = getHistoryTagValues(root)
    const selectedMap = {}
    normalizeStringList(selectedValues).forEach(function(value) {
      selectedMap[normalizeComparableText(value)] = true
    })
    const query = normalizeComparableText(input && input.value)
    let visibleCount = 0

    Array.prototype.forEach.call(options, function(option) {
      const searchable = option.getAttribute("data-searchable") || normalizeComparableText(option.textContent || "")
      const suggestionValue = normalizeComparableText(option.getAttribute("data-suggestion-value") || option.textContent || "")
      const hidden = selectedMap[suggestionValue] || (!!query && searchable.indexOf(query) === -1)
      option.hidden = hidden
      if (!hidden) visibleCount += 1
    })

    if (empty) {
      empty.hidden = visibleCount > 0
    }

    root.classList.toggle("is-open", visibleCount > 0 || !!query)
  }

  function commitHistoryTagValue(root, rawValue) {
    if (!root) return
    const value = String(rawValue || "").replace(/\s+/g, " ").trim()
    if (!value) return
    const nextValues = getHistoryTagValues(root)
    nextValues.push(value)
    writeHistoryTagValues(root, nextValues)
    const input = root.querySelector(".history-tag-input-control")
    if (input) {
      input.value = ""
      input.focus()
    }
    updateHistoryTagInputMenu(root)
  }

  function removeHistoryTagValue(root, rawValue) {
    if (!root) return
    const targetKey = normalizeComparableText(rawValue)
    const nextValues = getHistoryTagValues(root).filter(function(value) {
      return normalizeComparableText(value) !== targetKey
    })
    writeHistoryTagValues(root, nextValues)
    updateHistoryTagInputMenu(root)
  }

  function updateHistoryInputMenu(root) {
    if (!root) return
    const input = root.querySelector(".history-input-control")
    const empty = root.querySelector(".history-input-empty")
    const options = root.querySelectorAll(".history-input-option")
    const query = normalizeComparableText(input && input.value)
    let visibleCount = 0

    Array.prototype.forEach.call(options, function(option) {
      const searchable = option.getAttribute("data-searchable") || normalizeComparableText(option.textContent)
      const isVisible = !!query && searchable.indexOf(query) >= 0
      option.hidden = !isVisible
      if (isVisible) visibleCount += 1
    })

    if (empty) {
      empty.hidden = !query || visibleCount > 0
    }
    root.classList.toggle("is-open", !!query)
  }

  function upsertUiInputHistory(app, fieldKey, value) {
    if (!app || !app.ui) return
    const normalizedFieldKey = String(fieldKey || "").replace(/\s+/g, " ").trim()
    const normalizedValue = String(value || "").replace(/\s+/g, " ").trim()
    if (!normalizedFieldKey || !normalizedValue) return

    const nextHistory = app.ui.inputHistory && typeof app.ui.inputHistory === "object"
      ? Object.assign({}, app.ui.inputHistory)
      : {}
    const nextList = Array.isArray(nextHistory[normalizedFieldKey])
      ? nextHistory[normalizedFieldKey].slice()
      : []
    const matchKey = normalizeComparableText(normalizedValue)
    const now = dataAPI && typeof dataAPI.nowISO === "function" ? dataAPI.nowISO() : new Date().toISOString()
    const index = nextList.findIndex(function(entry) {
      return normalizeComparableText(entry && entry.value) === matchKey
    })

    if (index >= 0) {
      nextList[index] = Object.assign({}, nextList[index], {
        value: normalizedValue,
        count: Math.max(1, parseInt(nextList[index].count, 10) || 1) + 1,
        updatedAt: now
      })
    } else {
      nextList.push({
        value: normalizedValue,
        count: 1,
        updatedAt: now
      })
    }

    nextHistory[normalizedFieldKey] = nextList
      .sort(function(left, right) {
        const rightTime = new Date(right.updatedAt || 0).getTime() || 0
        const leftTime = new Date(left.updatedAt || 0).getTime() || 0
        if (rightTime !== leftTime) return rightTime - leftTime
        if ((right.count || 0) !== (left.count || 0)) return (right.count || 0) - (left.count || 0)
        return String(left.value || "").localeCompare(String(right.value || ""), "zh-CN")
      })
      .slice(0, 40)

    app.ui.inputHistory = nextHistory
  }

  function recordReusableInput(app, inputName, value) {
    const historyKey = REUSABLE_INPUT_HISTORY_FIELDS[inputName]
    const normalizedValue = String(value || "").replace(/\s+/g, " ").trim()
    if (!historyKey || !normalizedValue) return
    upsertUiInputHistory(app, historyKey, normalizedValue)
    if (global.MNResearchBridge && typeof global.MNResearchBridge.recordReusableInput === "function") {
      global.MNResearchBridge.recordReusableInput(historyKey, normalizedValue)
    }
  }

  function recordReusableInputs(app, inputName, values) {
    normalizeStringList(values).forEach(function(value) {
      recordReusableInput(app, inputName, value)
    })
  }

  function ensureFocusDraft(app) {
    if (!app.ui.focusDraft) {
      app.ui.focusDraft = {
        query: "",
        selectedType: null,
        selectedId: null
      }
    }
    return app.ui.focusDraft
  }

  function resetFocusDraft(app, questionId) {
    app.ui.focusDraft = {
      query: "",
      selectedType: questionId ? "question" : null,
      selectedId: questionId || null
    }
    app.ui.focusLinkQuery = ""
  }

  function resetLiteratureState(app, state, questionId) {
    clearScheduledLiteratureSearch()
    app.ui.literatureQuery = ""
    app.ui.literatureSearchPending = false
    app.ui.literatureSearchResults = []
    app.ui.literatureSearchError = ""
    app.ui.literatureSearchLastQuery = ""
    app.ui.literatureSearchPanelExpanded = false
    const targets = getLiteratureTargets(state, questionId)
    const defaultTarget = targets[0] || null
    app.ui.literatureTargetType = defaultTarget ? defaultTarget.type : null
    app.ui.literatureTargetId = defaultTarget ? defaultTarget.entityId : null
  }

  function normalizeSectionTab(value) {
    const tab = String(value || "timeline")
    return SECTION_TAB_MAP[tab] ? tab : "timeline"
  }

  function mapBranchRoleToIntent(role) {
    const rawValue = String(role || "")
    const value = resolveMappedValue(rawValue, dataAPI.BRANCH_ROLE_LABELS)
    const normalized = normalizeComparableText(rawValue)
    if (!rawValue.trim()) return ""
    if (value === "parallel_angle") return "parallel_angle"
    if (value === "tooling_track") return "tooling_track"
    if (value === "counterexample_track") return "counterexample_track"
    if (value === "reformulation") return "reformulation_track"
    if (value === "subproblem" || value === "prerequisite" || value === "special_case") return "spawn_subquestion"
    if (normalized.indexOf("平行") >= 0) return "parallel_angle"
    if (normalized.indexOf("工具") >= 0) return "tooling_track"
    if (normalized.indexOf("反例") >= 0) return "counterexample_track"
    if (normalized.indexOf("改写") >= 0 || normalized.indexOf("重述") >= 0 || normalized.indexOf("改述") >= 0) {
      return "reformulation_track"
    }
    if (normalized.indexOf("前置") >= 0 || normalized.indexOf("子问题") >= 0 || normalized.indexOf("子題") >= 0) {
      return "spawn_subquestion"
    }
    return "spawn_subquestion"
  }

  function resolveStrategyBranchIntentKey(value) {
    return resolveMappedValue(value, dataAPI.STRATEGY_BRANCH_INTENT_LABELS)
  }

  function setPendingSectionJump(app, section, behavior) {
    app.ui.pendingSectionJump = {
      section: normalizeSectionTab(section),
      behavior: behavior === "auto" ? "auto" : "smooth"
    }
  }

  function clearPendingSectionJump(app) {
    app.ui.pendingSectionJump = null
  }

  function activateQuestionSection(app, state, questionId, tab, options) {
    const nextQuestionId = String(questionId || "")
    const nextQuestion = nextQuestionId ? store.getQuestionById(nextQuestionId) : null
    const nextTab = normalizeSectionTab(tab || "timeline")
    const settings = options || {}
    const questionChanged = state.activeQuestionId !== nextQuestionId
    if (!nextQuestion) return

    app.ui.workspaceMode = "workbench"
    app.ui.activeTab = nextTab
    clearDeleteTarget(app)
    clearEditTarget(app)
    app.ui.summaryFocusId = null
    if (settings.scroll) {
      setPendingSectionJump(app, nextTab, settings.behavior)
    } else {
      clearPendingSectionJump(app)
    }

    if (questionChanged || settings.resetFocusDraft) {
      resetFocusDraft(app, nextQuestionId)
    }
    if (questionChanged || settings.resetLiteratureState) {
      resetLiteratureState(app, state, nextQuestionId)
    } else if (nextTab !== "literature") {
      clearScheduledLiteratureSearch()
    }
    if (nextTab === "literature" && global.MNResearchBridge) {
      app.ui.literatureSearchPending = false
      global.MNResearchBridge.requestCurrentDocumentLiterature()
    }

    if (questionChanged) {
      store.dispatch({ type: "SET_ACTIVE_QUESTION", payload: nextQuestionId })
      return
    }
    app.render()
  }

  function clearScheduledLiteratureSearch() {
    if (!literatureSearchTimer) return
    global.clearTimeout(literatureSearchTimer)
    literatureSearchTimer = null
  }

  function runLiteratureSearch(app) {
    clearScheduledLiteratureSearch()
    if (!app) return
    if (!global.MNResearchBridge || typeof global.MNResearchBridge.requestLiteratureSearch !== "function") {
      app.ui.literatureSearchPending = false
      app.ui.literatureSearchError = "文献搜索桥接不可用"
      app.render()
      return
    }
    app.ui.literatureSearchPending = true
    app.ui.literatureSearchError = ""
    global.MNResearchBridge.requestLiteratureSearch(app.ui.literatureQuery || "", 24)
    app.render()
  }

  function scheduleLiteratureSearch(app, delay) {
    clearScheduledLiteratureSearch()
    literatureSearchTimer = global.setTimeout(function() {
      literatureSearchTimer = null
      runLiteratureSearch(app)
    }, typeof delay === "number" ? delay : literatureSearchDelay)
  }

  function clearDeleteTarget(app) {
    app.ui.questionDeleteId = null
    app.ui.deleteTargetType = null
    app.ui.deleteTargetId = null
    app.ui.deleteTargetParentId = null
    app.ui.timelineEventModalId = null
  }

  function clearEditTarget(app) {
    app.ui.editTargetType = null
    app.ui.editTargetId = null
    app.ui.editTargetParentId = null
    app.ui.timelineEventModalId = null
  }

  function openDeleteTarget(app, type, id, parentId) {
    clearDeleteTarget(app)
    clearEditTarget(app)
    if (type === "question") {
      app.ui.questionDeleteId = id || null
    }
    app.ui.deleteTargetType = type || null
    app.ui.deleteTargetId = id || null
    app.ui.deleteTargetParentId = parentId || null
    app.ui.summaryFocusId = null
  }

  function openEditTarget(app, type, id, parentId) {
    clearEditTarget(app)
    clearDeleteTarget(app)
    app.ui.editTargetType = type || null
    app.ui.editTargetId = id || null
    app.ui.editTargetParentId = parentId || null
    app.ui.summaryFocusId = null
    app.ui.timelineEventModalId = null
  }

  function getFocusState(state) {
    const focusState = state && state.focusState && typeof state.focusState === "object"
      ? state.focusState
      : {}
    return {
      questionId: typeof focusState.questionId === "string" ? focusState.questionId : null,
      entityType: typeof focusState.entityType === "string" ? focusState.entityType : null,
      entityId: typeof focusState.entityId === "string" ? focusState.entityId : null
    }
  }

  function buildFocusState(state, questionId, entityType, entityId) {
    const nextQuestionId = typeof questionId === "string" && store.getQuestionById(questionId) ? questionId : null
    if (!nextQuestionId) {
      return {
        questionId: null,
        entityType: null,
        entityId: null
      }
    }

    if (entityType === "strategy") {
      const strategy = state.strategies.find(function(item) {
        return item.id === entityId && item.questionId === nextQuestionId
      })
      if (!strategy) {
        return {
          questionId: nextQuestionId,
          entityType: null,
          entityId: null
        }
      }
      return {
        questionId: nextQuestionId,
        entityType: "strategy",
        entityId: strategy.id
      }
    }

    if (entityType === "action") {
      const actionItem = state.actions.find(function(item) {
        return item.id === entityId && item.questionId === nextQuestionId
      })
      if (!actionItem) {
        return {
          questionId: nextQuestionId,
          entityType: null,
          entityId: null
        }
      }
      return {
        questionId: nextQuestionId,
        entityType: "action",
        entityId: actionItem.id
      }
    }

    return {
      questionId: nextQuestionId,
      entityType: null,
      entityId: null
    }
  }

  function setFocusState(state, questionId, entityType, entityId) {
    store.dispatch({
      type: "UPDATE_FOCUS_STATE",
      payload: buildFocusState(state, questionId, entityType, entityId)
    })
  }

  function createTimelineEvent(payload) {
    store.dispatch({
      type: "ADD_TIMELINE_EVENT",
      payload: Object.assign({
        id: dataAPI.createId("timeline")
      }, payload)
    })
  }

  function buildDiffSummary(label, previousValue, nextValue) {
    const previousText = String(previousValue || "").trim() || "空"
    const nextText = String(nextValue || "").trim() || "空"
    return `${label}：${previousText} -> ${nextText}`
  }

  function recordSystemEvent(questionId, options) {
    if (!questionId) return
    const details = options || {}
    createTimelineEvent({
      questionId: questionId,
      relatedEntityType: details.relatedEntityType || "",
      relatedEntityId: details.relatedEntityId || "",
      eventType: details.eventType || "system_change",
      noteType: "",
      source: "system",
      label: details.label || "系统记录",
      content: details.content || buildDiffSummary(details.label || "系统记录", details.previousValue, details.nextValue),
      previousValue: details.previousValue || "",
      nextValue: details.nextValue || ""
    })
  }

  function getQuestionFeedbackStatusLabel(status) {
    return dataAPI.QUESTION_FEEDBACK_STATUS_LABELS[status] || status || "待回流"
  }

  function buildQuestionFeedbackTimelineContent(summaryLine, detailBlocks) {
    const blocks = [String(summaryLine || "").trim()]
    ;(Array.isArray(detailBlocks) ? detailBlocks : []).forEach(function(block) {
      const text = String(block || "").trim()
      if (text) blocks.push(text)
    })
    return blocks.filter(Boolean).join("\n\n")
  }

  function recordQuestionFeedbackEvents(question, branchSummary, feedbackStatus, feedbackSummary, nextStrategyStatus) {
    const parentQuestion = question && question.parentId ? store.getQuestionById(question.parentId) : null
    const sourceStrategy = branchSummary && branchSummary.sourceType === "strategy"
      ? store.getStrategyById(branchSummary.sourceId)
      : null
    const sourceQuestion = branchSummary && branchSummary.sourceType === "question"
      ? store.getQuestionById(branchSummary.sourceId)
      : null
    const previousStatusLabel = getQuestionFeedbackStatusLabel(branchSummary && branchSummary.feedbackStatus)
    const nextStatusLabel = getQuestionFeedbackStatusLabel(feedbackStatus)
    const previousSummaryText = String(branchSummary && branchSummary.feedbackSummary || "").trim()
    const summaryText = String(feedbackSummary || "").trim()
    const strategyStatusChanged = !!(sourceStrategy && nextStrategyStatus && nextStrategyStatus !== "keep" && nextStrategyStatus !== sourceStrategy.status)
    const strategyStatusDetail = strategyStatusChanged
      ? `来源策略状态：${dataAPI.STRATEGY_STATUS_LABELS[sourceStrategy.status] || sourceStrategy.status || "未设置"} -> ${dataAPI.STRATEGY_STATUS_LABELS[nextStrategyStatus] || nextStrategyStatus}`
      : ""
    const sourceDetail = sourceStrategy
      ? `来源策略：${sourceStrategy.name}`
      : sourceQuestion
        ? `来源问题：${sourceQuestion.title}`
        : (branchSummary && branchSummary.sourceTitle
          ? `来源：${branchSummary.sourceTitle}`
          : "")
    const summaryDetail = summaryText
      ? `回流摘要：\n${summaryText}`
      : "回流摘要：未填写。"

    if (previousStatusLabel === nextStatusLabel && previousSummaryText === summaryText && !strategyStatusChanged) {
      return
    }

    recordSystemEvent(question.id, {
      label: "结果回流",
      relatedEntityType: parentQuestion ? "question" : "",
      relatedEntityId: parentQuestion ? parentQuestion.id : "",
      eventType: "branch_feedback",
      previousValue: previousStatusLabel,
      nextValue: nextStatusLabel,
      content: buildQuestionFeedbackTimelineContent(`结果回流：${nextStatusLabel}`, [
        parentQuestion ? `母问题：${parentQuestion.title}` : "",
        sourceDetail,
        summaryDetail,
        strategyStatusDetail
      ])
    })

    if (parentQuestion) {
      recordSystemEvent(parentQuestion.id, {
        label: "子问题结果回流",
        relatedEntityType: "question",
        relatedEntityId: question.id,
        eventType: "branch_feedback",
        previousValue: previousStatusLabel,
        nextValue: nextStatusLabel,
        content: buildQuestionFeedbackTimelineContent(`子问题「${question.title}」回流：${nextStatusLabel}`, [
          sourceDetail,
          summaryDetail,
          strategyStatusDetail
        ])
      })
    }
  }

  function recordManualFocusEvent(state, noteType, content) {
    const focusState = getFocusState(state)
    if (!focusState.questionId || !noteType || !content) return false
    createTimelineEvent({
      questionId: focusState.questionId,
      relatedEntityType: focusState.entityType || "",
      relatedEntityId: focusState.entityId || "",
      eventType: "quick_note",
      noteType: noteType,
      source: "manual",
      label: dataAPI.TIMELINE_NOTE_TYPE_LABELS[noteType] || noteType,
      content: content
    })
    return true
  }

  function getLiteratureTargets(state, questionId) {
    if (!questionId) return []
    const question = store.getQuestionById(questionId)
    const targets = []
    if (question) {
      targets.push({
        type: "question",
        entityId: question.id,
        questionId: question.id,
        label: `问题 · ${question.title}`
      })
    }

    const currentFocus = store.getCurrentFocus()
    const currentFocusQuestionId = currentFocus ? getFocusQuestionId(state, currentFocus, questionId) : null
    if (currentFocus && currentFocusQuestionId === questionId) {
      targets.push({
        type: "focus-session",
        entityId: currentFocus.id,
        questionId: questionId,
        label: `专注会话 · ${currentFocus.title}`
      })
    }

    state.judgments
      .filter(function(item) { return item.questionId === questionId })
      .forEach(function(item) {
        targets.push({
          type: "judgment",
          entityId: item.id,
          questionId: questionId,
          label: `判断 · ${item.content}`
        })
      })

    state.strategies
      .filter(function(item) { return item.questionId === questionId })
      .forEach(function(item) {
        targets.push({
          type: "strategy",
          entityId: item.id,
          questionId: questionId,
          label: `策略 · ${item.name}`
        })
      })

    state.obstacles
      .filter(function(item) { return item.questionId === questionId })
      .forEach(function(item) {
        targets.push({
          type: "obstacle",
          entityId: item.id,
          questionId: questionId,
          label: `障碍 · ${item.content}`
        })
      })

    state.examples
      .filter(function(item) { return item.questionId === questionId })
      .forEach(function(item) {
        targets.push({
          type: "example",
          entityId: item.id,
          questionId: questionId,
          label: `样例 · ${item.content}`
        })
      })

    state.insights
      .filter(function(item) { return item.questionId === questionId })
      .forEach(function(item) {
        targets.push({
          type: "insight",
          entityId: item.id,
          questionId: questionId,
          label: `认识 · ${item.content}`
        })
      })

    return targets
  }

  function getSelectedLiteratureTarget(state, app, fallbackQuestionId) {
    const questionId = fallbackQuestionId || state.activeQuestionId || null
    const targets = getLiteratureTargets(state, questionId)
    const selectedType = app.ui.literatureTargetType
    const selectedId = app.ui.literatureTargetId
    return targets.find(function(target) {
      return target.type === selectedType && target.entityId === selectedId
    }) || targets[0] || null
  }

  function resolveFocusTarget(state, app, target) {
    const draft = ensureFocusDraft(app)
    const explicitType = target.getAttribute("data-focus-type")
    const explicitEntityId = target.getAttribute("data-focus-entity-id")
    const directQuestionId = target.getAttribute("data-question-id")
    const selectedType = explicitType || draft.selectedType
    const selectedId = explicitEntityId || directQuestionId || draft.selectedId

    if (!selectedType || !selectedId) return null

    if (selectedType === "question") {
      const question = store.getQuestionById(selectedId)
      if (!question) return null
      return {
        type: "question",
        entityId: question.id,
        questionId: question.id,
        title: question.title,
        description: question.description || ""
      }
    }

    if (selectedType === "judgment") {
      const judgment = state.judgments.find(function(item) { return item.id === selectedId })
      if (!judgment) return null
      return {
        type: "judgment",
        entityId: judgment.id,
        questionId: judgment.questionId,
        title: judgment.content,
        description: judgment.content || ""
      }
    }

    if (selectedType === "strategy") {
      const strategy = state.strategies.find(function(item) { return item.id === selectedId })
      if (!strategy) return null
      return {
        type: "strategy",
        entityId: strategy.id,
        questionId: strategy.questionId,
        title: strategy.name,
        description: strategy.description || strategy.rationale || ""
      }
    }

    if (selectedType === "action") {
      const actionItem = state.actions.find(function(item) { return item.id === selectedId })
      if (!actionItem) return null
      return {
        type: "action",
        entityId: actionItem.id,
        questionId: actionItem.questionId,
        title: actionItem.title,
        description: actionItem.description || ""
      }
    }

    if (selectedType === "obstacle") {
      const obstacle = state.obstacles.find(function(item) { return item.id === selectedId })
      if (!obstacle) return null
      return {
        type: "obstacle",
        entityId: obstacle.id,
        questionId: obstacle.questionId,
        title: obstacle.content,
        description: obstacle.clueDescription || obstacle.content || ""
      }
    }

    if (selectedType === "example") {
      const example = state.examples.find(function(item) { return item.id === selectedId })
      if (!example) return null
      return {
        type: "example",
        entityId: example.id,
        questionId: example.questionId,
        title: example.content,
        description: example.conclusion || example.content || ""
      }
    }

    if (selectedType === "insight") {
      const insight = state.insights.find(function(item) { return item.id === selectedId })
      if (!insight) return null
      return {
        type: "insight",
        entityId: insight.id,
        questionId: insight.questionId,
        title: insight.content,
        description: insight.content || ""
      }
    }

    if (selectedType === "literature") {
      const literature = state.literature.find(function(item) { return item.id === selectedId })
      if (!literature) return null
      return {
        type: "literature",
        entityId: literature.id,
        questionId: Array.isArray(literature.questionIds) && literature.questionIds.length ? literature.questionIds[0] : null,
        title: literature.title,
        description: literature.notes || literature.authors || ""
      }
    }

    return null
  }

  function getFocusQuestionId(state, focus, fallbackQuestionId) {
    if (!focus) return fallbackQuestionId || null
    if (focus.type === "question") return focus.entityId || fallbackQuestionId || null
    if (focus.type === "judgment") {
      const judgment = state.judgments.find(function(item) { return item.id === focus.entityId })
      return judgment ? judgment.questionId : (fallbackQuestionId || null)
    }
    if (focus.type === "strategy") {
      const strategy = state.strategies.find(function(item) { return item.id === focus.entityId })
      return strategy ? strategy.questionId : (fallbackQuestionId || null)
    }
    if (focus.type === "action") {
      const actionItem = state.actions.find(function(item) { return item.id === focus.entityId })
      return actionItem ? actionItem.questionId : (fallbackQuestionId || null)
    }
    if (focus.type === "obstacle") {
      const obstacle = state.obstacles.find(function(item) { return item.id === focus.entityId })
      return obstacle ? obstacle.questionId : (fallbackQuestionId || null)
    }
    if (focus.type === "example") {
      const example = state.examples.find(function(item) { return item.id === focus.entityId })
      return example ? example.questionId : (fallbackQuestionId || null)
    }
    if (focus.type === "insight") {
      const insight = state.insights.find(function(item) { return item.id === focus.entityId })
      return insight ? insight.questionId : (fallbackQuestionId || null)
    }
    if (focus.type === "literature") {
      const literature = state.literature.find(function(item) { return item.id === focus.entityId })
      return literature && Array.isArray(literature.questionIds) && literature.questionIds.length
        ? literature.questionIds[0]
        : (fallbackQuestionId || null)
    }
    return fallbackQuestionId || null
  }

  function logProgress(payload) {
    store.dispatch({
      type: "ADD_PROGRESS_ENTRY",
      payload: Object.assign({
        id: dataAPI.createId("progress")
      }, payload)
    })
  }

  function getQuestionIdForEntity(state, type, entityId) {
    if (researchCore && typeof researchCore.getQuestionIdForEntity === "function") {
      return researchCore.getQuestionIdForEntity(state, type, entityId)
    }
    if (!entityId) return null
    if (type === "question") return entityId
    if (type === "judgment") {
      const judgment = state.judgments.find(function(item) { return item.id === entityId })
      return judgment ? judgment.questionId : null
    }
    if (type === "strategy") {
      const strategy = state.strategies.find(function(item) { return item.id === entityId })
      return strategy ? strategy.questionId : null
    }
    if (type === "action") {
      const actionItem = state.actions.find(function(item) { return item.id === entityId })
      return actionItem ? actionItem.questionId : null
    }
    if (type === "obstacle") {
      const obstacle = state.obstacles.find(function(item) { return item.id === entityId })
      return obstacle ? obstacle.questionId : null
    }
    if (type === "example") {
      const example = state.examples.find(function(item) { return item.id === entityId })
      return example ? example.questionId : null
    }
    if (type === "insight") {
      const insight = state.insights.find(function(item) { return item.id === entityId })
      return insight ? insight.questionId : null
    }
    if (type === "literature") {
      const literature = state.literature.find(function(item) { return item.id === entityId })
      return literature && Array.isArray(literature.questionIds) && literature.questionIds.length ? literature.questionIds[0] : null
    }
    return null
  }

  function splitLines(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map(function(item) { return item.trim() })
      .filter(Boolean)
  }

  function handleAction(action, target) {
    const app = getApp()
    const state = store.getState()

    switch (action) {
      case "show-dashboard":
        clearPendingSectionJump(app)
        app.ui.activeTab = "timeline"
        app.ui.workspaceMode = "dashboard"
        clearDeleteTarget(app)
        clearEditTarget(app)
        resetFocusDraft(app, null)
        resetLiteratureState(app, state, null)
        store.dispatch({ type: "SET_ACTIVE_QUESTION", payload: null })
        return
      case "show-focus-view":
        app.ui.workspaceMode = "focus"
        clearDeleteTarget(app)
        clearEditTarget(app)
        app.ui.summaryFocusId = null
        app.render()
        return
      case "toggle-settings":
        app.ui.settingsOpen = !app.ui.settingsOpen
        app.render()
        return
      case "toggle-html-select": {
        const root = target.closest(".html-select")
        if (!root) return
        const willOpen = !root.classList.contains("is-open")
        closeHtmlSelects(root)
        closeHistoryInputs()
        if (willOpen) {
          root.classList.add("is-open")
          target.setAttribute("aria-expanded", "true")
        } else {
          root.classList.remove("is-open")
          target.setAttribute("aria-expanded", "false")
        }
        return
      }
      case "pick-html-select": {
        const root = target.closest(".html-select")
        if (!root) return
        const value = target.getAttribute("data-select-value") || ""
        const hidden = root.querySelector('[data-input]')
        const triggerLabel = root.querySelector(".html-select-trigger-label")
        const options = root.querySelectorAll(".html-select-option")
        const optionLabel = target.querySelector(".html-select-option-label")
        if (hidden) hidden.value = value
        if (triggerLabel) {
          triggerLabel.innerHTML = optionLabel ? optionLabel.innerHTML : (target.getAttribute("data-select-label") || target.textContent || "")
        }
        Array.prototype.forEach.call(options, function(option) {
          option.classList.toggle("is-selected", option === target)
        })
        closeHtmlSelects()
        if (hidden) handleInput(hidden)
        return
      }
      case "pick-history-suggestion": {
        const value = target.getAttribute("data-suggestion-value") || target.textContent || ""
        const tagRoot = target.closest(".history-tag-input")
        if (tagRoot) {
          commitHistoryTagValue(tagRoot, value)
          return
        }
        const root = target.closest(".history-input")
        if (!root) return
        const input = root.querySelector(".history-input-control")
        if (input) {
          input.value = value
          input.focus()
        }
        closeHistoryInputs()
        return
      }
      case "remove-history-tag": {
        const inputName = target.getAttribute("data-tag-input") || ""
        const root = inputName ? document.querySelector(`[data-history-tag-input="${inputName}"]`) : target.closest(".history-tag-input")
        removeHistoryTagValue(root, target.getAttribute("data-tag-value") || "")
        return
      }
      case "toggle-sidebar":
        app.ui.sidebarCollapsed = !app.ui.sidebarCollapsed
        app.render()
        return
      case "open-delete-modal":
        openDeleteTarget(
          app,
          target.getAttribute("data-delete-type"),
          target.getAttribute("data-delete-id"),
          target.getAttribute("data-delete-parent-id")
        )
        app.render()
        return
      case "open-edit-modal":
        openEditTarget(
          app,
          target.getAttribute("data-edit-type"),
          target.getAttribute("data-edit-id"),
          target.getAttribute("data-edit-parent-id")
        )
        app.render()
        return
      case "move-question-item": {
        const entityType = target.getAttribute("data-item-type") || ""
        const itemId = target.getAttribute("data-item-id") || ""
        const direction = Number(target.getAttribute("data-direction") || 0)
        if (!entityType || !itemId || !direction) return
        store.dispatch({
          type: "MOVE_QUESTION_ITEM",
          payload: {
            entityType: entityType,
            id: itemId,
            direction: direction < 0 ? -1 : 1
          }
        })
        return
      }
      case "open-question-delete-modal":
        openDeleteTarget(app, "question", target.getAttribute("data-question-id"), null)
        app.render()
        return
      case "close-question-delete-modal":
      case "close-delete-modal":
        clearDeleteTarget(app)
        app.render()
        return
      case "close-edit-modal":
        clearEditTarget(app)
        app.render()
        return
      case "toggle-focus-panel":
        app.ui.workspaceMode = app.ui.workspaceMode === "focus" ? "workbench" : "focus"
        clearDeleteTarget(app)
        clearEditTarget(app)
        app.render()
        return
      case "link-focus-item": {
        const focusId = target.getAttribute("data-focus-id")
        const itemType = target.getAttribute("data-link-type")
        const itemId = target.getAttribute("data-link-id")
        const itemTitle = target.getAttribute("data-link-title") || ""
        const focus = state.focusSessions.find(function(item) { return item.id === focusId })
        if (!focus || !itemType || !itemId) return
        const linkedItems = Array.isArray(focus.linkedItems) ? focus.linkedItems.slice() : []
        const exists = linkedItems.some(function(item) {
          return item.type === itemType && item.id === itemId
        })
        if (exists) return
        linkedItems.push({
          type: itemType,
          id: itemId,
          title: itemTitle,
          linkedAt: dataAPI.nowISO()
        })
        store.dispatch({
          type: "UPDATE_FOCUS_SESSION",
          payload: {
            focusSessionId: focusId,
            linkedItems: linkedItems
          }
        })
        logProgress({
          focusSessionId: focusId,
          action: "item_linked",
          details: `关联${itemTitle}`,
          entityType: itemType,
          entityId: itemId
        })
        return
      }
      case "apply-suggested-action": {
        const relatedType = target.getAttribute("data-related-type")
        const relatedId = target.getAttribute("data-related-id")
        const suggestedTab = target.getAttribute("data-target-tab") || "judgments"
        const questionId = getQuestionIdForEntity(state, relatedType, relatedId)
        if (!questionId) return
        activateQuestionSection(app, state, questionId, suggestedTab, {
          scroll: true,
          resetFocusDraft: true,
          resetLiteratureState: true
        })
        return
      }
      case "select-focus-target":
        ensureFocusDraft(app)
        app.ui.focusDraft.selectedType = target.getAttribute("data-focus-type") || null
        app.ui.focusDraft.selectedId = target.getAttribute("data-focus-entity-id") || null
        app.render()
        return
      case "select-literature-target":
        app.ui.literatureTargetType = target.getAttribute("data-bind-type") || null
        app.ui.literatureTargetId = target.getAttribute("data-bind-id") || null
        app.render()
        return
      case "open-timeline-event-modal":
        clearDeleteTarget(app)
        clearEditTarget(app)
        app.ui.timelineEventModalId = target.getAttribute("data-timeline-id") || null
        app.ui.summaryFocusId = null
        app.render()
        return
      case "close-timeline-event-modal":
        app.ui.timelineEventModalId = null
        app.render()
        return
      case "toggle-focus-actions":
        app.ui.focusActionsExpanded = !app.ui.focusActionsExpanded
        app.render()
        return
      case "toggle-focus-only-current-entity":
        app.ui.focusOnlyCurrentEntity = !app.ui.focusOnlyCurrentEntity
        app.render()
        return
      case "toggle-focus-include-children":
        app.ui.focusIncludeChildQuestions = !app.ui.focusIncludeChildQuestions
        app.render()
        return
      case "set-focus-entity": {
        const focusState = getFocusState(state)
        if (!focusState.questionId) return
        setFocusState(state, focusState.questionId, target.getAttribute("data-entity-type"), target.getAttribute("data-entity-id"))
        app.ui.workspaceMode = "focus"
        app.render()
        return
      }
      case "submit-focus-event": {
        const noteType = target.getAttribute("data-note-type") || ""
        const content = markdownValue("focus-quick-input")
        if (!noteType || !content) return
        if (!recordManualFocusEvent(state, noteType, content)) return
        clearInput("focus-quick-input")
        app.ui.timelineEventModalId = null
        app.render()
        return
      }
      case "promote-timeline-event": {
        const timelineId = target.getAttribute("data-timeline-id")
        const promoteType = target.getAttribute("data-promote-type")
        const timelineEvent = state.timelineEvents.find(function(item) { return item.id === timelineId })
        if (!timelineEvent || !promoteType || !timelineEvent.questionId) return
        if (promoteType === "insight") {
          const insightId = dataAPI.createId("insight")
          store.dispatch({
            type: "ADD_INSIGHT",
            payload: {
              id: insightId,
              type: "observation",
              content: timelineEvent.content,
              questionId: timelineEvent.questionId
            }
          })
          store.dispatch({
            type: "UPDATE_TIMELINE_EVENT",
            payload: {
              id: timelineEvent.id,
              updates: {
                promotedEntityType: "insight",
                promotedEntityId: insightId
              }
            }
          })
          recordSystemEvent(timelineEvent.questionId, {
            label: "升格为认识",
            relatedEntityType: "insight",
            relatedEntityId: insightId,
            content: `从时间线事件升格为认识：${timelineEvent.content}`
          })
        } else if (promoteType === "obstacle") {
          const obstacleId = dataAPI.createId("obstacle")
          store.dispatch({
            type: "ADD_OBSTACLE",
            payload: {
              id: obstacleId,
              type: "technical",
              content: timelineEvent.content,
              questionId: timelineEvent.questionId,
              affectedStrategyIds: [],
              isCoreProblem: false,
              hasClue: false,
              clueDescription: ""
            }
          })
          store.dispatch({
            type: "UPDATE_TIMELINE_EVENT",
            payload: {
              id: timelineEvent.id,
              updates: {
                promotedEntityType: "obstacle",
                promotedEntityId: obstacleId
              }
            }
          })
          recordSystemEvent(timelineEvent.questionId, {
            label: "升格为障碍",
            relatedEntityType: "obstacle",
            relatedEntityId: obstacleId,
            content: `从时间线事件升格为障碍：${timelineEvent.content}`
          })
        }
        app.ui.timelineEventModalId = timelineId
        app.render()
        return
      }
      case "toggle-literature-search-panel":
        app.ui.literatureSearchPanelExpanded = !app.ui.literatureSearchPanelExpanded
        if (app.ui.literatureSearchPanelExpanded && global.MNResearchBridge) {
          global.MNResearchBridge.requestCurrentDocumentLiterature()
        }
        app.render()
        return
      case "add-root-question": {
        const now = dataAPI.nowISO()
        const newQuestionId = dataAPI.createId("q")
        clearPendingSectionJump(app)
        app.ui.workspaceMode = "workbench"
        app.ui.activeTab = "formulation"
        clearDeleteTarget(app)
        clearEditTarget(app)
        resetFocusDraft(app, newQuestionId)
        resetLiteratureState(app, state, newQuestionId)
        setPendingSectionJump(app, "formulation")
        store.dispatch({
          type: "ADD_QUESTION",
          payload: {
            id: newQuestionId,
            title: `新问题 ${state.questions.filter((item) => item.parentId === null).length + 1}`,
            description: "先写下问题表述，再补判断和策略。",
            status: "active",
            parentId: null,
            order: state.questions.filter((item) => item.parentId === null).length,
            createdAt: now,
            updatedAt: now
          }
        })
        recordSystemEvent(newQuestionId, {
          label: "新增问题",
          relatedEntityType: "question",
          relatedEntityId: newQuestionId,
          content: `新增问题：新问题 ${state.questions.filter((item) => item.parentId === null).length + 1}`
        })
        return
      }
      case "add-child-question": {
        const parentId = target.getAttribute("data-parent-id")
        const parent = store.getQuestionById(parentId)
        const sourceStrategyId = target.getAttribute("data-source-strategy-id")
        const sourceStrategy = sourceStrategyId ? store.getStrategyById(sourceStrategyId) : null
        const branchRole = target.getAttribute("data-branch-role") || "subproblem"
        const contributionType = target.getAttribute("data-contribution-type") || "answer_parent"
        if (!parentId || !parent) return
        const now = dataAPI.nowISO()
        const newQuestionId = dataAPI.createId("q")
        clearPendingSectionJump(app)
        app.ui.workspaceMode = "workbench"
        app.ui.activeTab = "formulation"
        clearDeleteTarget(app)
        clearEditTarget(app)
        resetFocusDraft(app, newQuestionId)
        resetLiteratureState(app, state, newQuestionId)
        setPendingSectionJump(app, "formulation")
        store.dispatch({
          type: "ADD_QUESTION",
          payload: {
            id: newQuestionId,
            title: sourceStrategy
              ? `围绕「${sourceStrategy.name.slice(0, 12)}」的新子问题`
              : `围绕「${parent.title.slice(0, 10)}」的新子问题`,
            description: sourceStrategy
              ? `从策略「${sourceStrategy.name}」拆出的研究子问题。`
              : "继续把这个分支拆细。",
            status: "active",
            parentId: parentId,
            order: state.questions.filter((item) => item.parentId === parentId).length,
            branchMeta: {
              parentRelationType: branchRole,
              feedBackStatus: "pending",
              feedBackSummary: "",
              successCriteria: "",
              originSummary: sourceStrategy
                ? `来自策略「${sourceStrategy.name}」`
                : ""
            },
            createdAt: now,
            updatedAt: now
          }
        })
        if (sourceStrategy) {
          store.dispatch({
            type: "ADD_BRANCH_LINK",
            payload: {
              id: dataAPI.createId("branch"),
              sourceType: "strategy",
              sourceId: sourceStrategy.id,
              targetType: "question",
              targetId: newQuestionId,
              relationType: "spawn_question",
              branchRole: branchRole,
              contributionType: contributionType,
              status: "active",
              note: `从策略「${sourceStrategy.name}」升格出的子问题`
            }
          })
          store.dispatch({
            type: "UPDATE_STRATEGY",
            payload: {
              id: sourceStrategy.id,
              updates: {
                branchIntent: resolveStrategyBranchIntentKey(sourceStrategy.branchIntent) === "direct_attack"
                  ? (mapBranchRoleToIntent(branchRole) || sourceStrategy.branchIntent)
                  : sourceStrategy.branchIntent,
                outcomeMode: "promoted_to_question"
              }
            }
          })
        }
        recordSystemEvent(newQuestionId, {
          label: "新增子问题",
          relatedEntityType: "question",
          relatedEntityId: newQuestionId,
          content: `新增子问题：${sourceStrategy
            ? `围绕「${sourceStrategy.name.slice(0, 12)}」的新子问题`
            : `围绕「${parent.title.slice(0, 10)}」的新子问题`}`
        })
        return
      }
      case "select-question":
        app.ui.workspaceMode = "workbench"
        activateQuestionSection(app, state, target.getAttribute("data-question-id"), "timeline", {
          scroll: false,
          resetFocusDraft: true,
          resetLiteratureState: true
        })
        return
      case "set-question-status": {
        const questionId = target.getAttribute("data-question-id")
        const nextStatus = target.getAttribute("data-question-status") || "active"
        const question = store.getQuestionById(questionId)
        if (!questionId || !question) return
        app.ui.activeTab = "overview"
        store.dispatch({
          type: "UPDATE_QUESTION",
          payload: {
            id: questionId,
            updates: {
              status: nextStatus
            }
          }
        })
        return
      }
      case "toggle-question-feedback": {
        const questionId = target.getAttribute("data-question-id")
        const question = store.getQuestionById(questionId)
        const branchSummary = researchCore && typeof researchCore.getQuestionBranchSummary === "function"
          ? researchCore.getQuestionBranchSummary(state, questionId)
          : null
        if (!questionId || !question || !branchSummary || !branchSummary.isChild || branchSummary.isOrphan) return
        const nextFeedbackStatus = branchSummary.feedbackStatus === "fed_back" ? "pending" : "fed_back"
        store.dispatch({
          type: "UPDATE_QUESTION",
          payload: {
            id: questionId,
            updates: {
              branchMeta: Object.assign({}, question.branchMeta || {}, {
                feedBackStatus: nextFeedbackStatus,
                feedBackSummary: nextFeedbackStatus === "fed_back"
                  ? ((question.branchMeta && question.branchMeta.feedBackSummary) || "这条子问题的结果已回流到母问题推进。")
                  : ""
              })
            }
          }
        })
        if (branchSummary.primaryLink) {
          store.dispatch({
            type: "UPDATE_BRANCH_LINK",
            payload: {
              id: branchSummary.primaryLink.id,
              updates: {
                status: nextFeedbackStatus === "fed_back" ? "fed_back" : "active"
              }
            }
          })
        }
        recordQuestionFeedbackEvents(
          question,
          branchSummary,
          nextFeedbackStatus,
          nextFeedbackStatus === "fed_back"
            ? ((question.branchMeta && question.branchMeta.feedBackSummary) || "这条子问题的结果已经回流到母问题推进。")
            : "",
          "keep"
        )
        return
      }
      case "confirm-delete-question": {
        const questionId = target.getAttribute("data-question-id") || app.ui.questionDeleteId || app.ui.deleteTargetId
        const question = store.getQuestionById(questionId)
        const impact = researchCore && typeof researchCore.computeQuestionDeleteImpact === "function"
          ? researchCore.computeQuestionDeleteImpact(state, questionId)
          : null

        if (!questionId || !question) return

        store.dispatch({
          type: "DELETE_QUESTION",
          payload: {
            id: questionId
          }
        })

        const nextState = store.getState()
        const nextActiveQuestionId = nextState.activeQuestionId || null
        clearDeleteTarget(app)
        clearEditTarget(app)
        app.ui.summaryFocusId = null
        app.ui.activeTab = nextActiveQuestionId ? "timeline" : "timeline"
        resetFocusDraft(app, nextActiveQuestionId)

        if (impact) {
          const detailParts = []
          if (impact.counts.questions > 1) {
            detailParts.push(`删除 ${impact.counts.questions} 个问题节点`)
          } else {
            detailParts.push("删除 1 个问题节点")
          }
          if (impact.counts.judgments) detailParts.push(`清理 ${impact.counts.judgments} 条判断`)
          if (impact.counts.strategies) detailParts.push(`清理 ${impact.counts.strategies} 条策略`)
          if (impact.counts.actions) detailParts.push(`清理 ${impact.counts.actions} 个动作`)
          if (impact.counts.examples) detailParts.push(`清理 ${impact.counts.examples} 个样例`)
          if (impact.counts.obstacles) detailParts.push(`清理 ${impact.counts.obstacles} 个障碍`)
          if (impact.counts.insights) detailParts.push(`清理 ${impact.counts.insights} 条认识`)
          if (impact.counts.timelineEvents) detailParts.push(`清理 ${impact.counts.timelineEvents} 条时间线事件`)
          logProgress({
            action: "question_deleted",
            details: `${question.title} 已删除。${detailParts.join("，")}。`,
            entityType: "question"
          })
        }
        app.render()
        return
      }
      case "set-current-formulation": {
        const formulationId = target.getAttribute("data-formulation-id")
        const questionId = target.getAttribute("data-question-id")
        if (!formulationId || !questionId) return
        store.dispatch({
          type: "SET_CURRENT_FORMULATION",
          payload: {
            questionId,
            formulationId
          }
        })
        return
      }
      case "confirm-delete-entity": {
        const deleteType = target.getAttribute("data-delete-type") || app.ui.deleteTargetType
        const deleteId = target.getAttribute("data-delete-id") || app.ui.deleteTargetId
        const parentId = target.getAttribute("data-delete-parent-id") || app.ui.deleteTargetParentId
        if (!deleteType || !deleteId) return

        if (deleteType === "question") {
          handleAction("confirm-delete-question", target)
          return
        }

        if (deleteType === "formulation") {
          store.dispatch({
            type: "DELETE_FORMULATION",
            payload: {
              id: deleteId,
              questionId: parentId || null
            }
          })
        } else if (deleteType === "judgment") {
          store.dispatch({ type: "DELETE_JUDGMENT", payload: { id: deleteId } })
        } else if (deleteType === "strategy") {
          store.dispatch({ type: "DELETE_STRATEGY", payload: { id: deleteId } })
        } else if (deleteType === "example") {
          store.dispatch({ type: "DELETE_EXAMPLE", payload: { id: deleteId } })
        } else if (deleteType === "obstacle") {
          store.dispatch({ type: "DELETE_OBSTACLE", payload: { id: deleteId } })
        } else if (deleteType === "insight") {
          store.dispatch({ type: "DELETE_INSIGHT", payload: { id: deleteId } })
        } else if (deleteType === "action-item") {
          store.dispatch({ type: "DELETE_ACTION_ITEM", payload: { id: deleteId } })
        } else if (deleteType === "timeline-event") {
          store.dispatch({ type: "DELETE_TIMELINE_EVENT", payload: { id: deleteId } })
        } else if (deleteType === "focus-session") {
          store.dispatch({ type: "DELETE_FOCUS_SESSION", payload: { id: deleteId } })
        } else {
          return
        }

        clearDeleteTarget(app)
        clearEditTarget(app)
        const nextState = store.getState()
        if (deleteType === "focus-session" && !nextState.activeQuestionId) {
          app.ui.activeTab = "timeline"
        }
        app.render()
        return
      }
      case "save-edit-entity": {
        const editType = target.getAttribute("data-edit-type") || app.ui.editTargetType
        const editId = target.getAttribute("data-edit-id") || app.ui.editTargetId
        const parentId = target.getAttribute("data-edit-parent-id") || app.ui.editTargetParentId
        if (!editType || !editId) return

        if (editType === "question") {
          const question = store.getQuestionById(editId)
          const title = markdownValue("edit-question-title")
          const status = inputValue("edit-question-status") || "active"
          const previousTitle = question ? String(question.title || "") : ""
          const previousStatus = question ? String(question.status || "") : ""
          const formulations = state.formulations.filter(function(item) {
            return item.questionId === editId
          })
          const description = formulations.length
            ? (question && question.description ? question.description : "")
            : markdownValue("edit-question-description")
          const previousDescription = question ? String(question.description || "") : ""
          const descriptionChanged = question && description !== String(question.description || "")
          if (!question || !title) return
          store.dispatch({
            type: "UPDATE_QUESTION",
            payload: {
              id: editId,
              updates: formulations.length
                ? {
                    title,
                    status
                  }
                : {
                    title,
                    description,
                    status
                  }
            }
          })
          if (title !== previousTitle) {
            recordSystemEvent(editId, {
              label: "问题标题",
              relatedEntityType: "question",
              relatedEntityId: editId,
              previousValue: previousTitle,
              nextValue: title
            })
          }
          if (status !== previousStatus) {
            recordSystemEvent(editId, {
              label: "问题状态",
              relatedEntityType: "question",
              relatedEntityId: editId,
              previousValue: dataAPI.STATUS_LABELS[previousStatus] || previousStatus,
              nextValue: dataAPI.STATUS_LABELS[status] || status
            })
          }
          if (!formulations.length && descriptionChanged) {
            recordSystemEvent(editId, {
              label: "问题表述",
              relatedEntityType: "question",
              relatedEntityId: editId,
              previousValue: previousDescription,
              nextValue: description
            })
          }
          if (!formulations.length && description && descriptionChanged) {
            store.dispatch({
              type: "ADD_FORMULATION",
              payload: {
                id: dataAPI.createId("formulation"),
                questionId: editId,
                content: description,
                constraints: [],
                reason: "首次从问题编辑落为表述版本。",
                isAbandoned: false
              }
            })
          }
        } else if (editType === "new-formulation") {
          const questionId = parentId || editId
          const question = store.getQuestionById(questionId)
          const content = markdownValue("new-formulation-content")
          if (!questionId || !question || !content) return
          const previousContent = String(question.description || "")
          store.dispatch({
            type: "ADD_FORMULATION",
            payload: {
              id: dataAPI.createId("formulation"),
              questionId: questionId,
              content: content,
              constraints: markdownLines("new-formulation-constraints"),
              reason: markdownValue("new-formulation-reason"),
              isAbandoned: false
            }
          })
          recordSystemEvent(questionId, {
            label: "问题表述",
            relatedEntityType: "question",
            relatedEntityId: questionId,
            previousValue: previousContent,
            nextValue: content
          })
        } else if (editType === "new-judgment") {
          const questionId = parentId || editId
          const content = markdownValue("new-judgment-content")
          if (!questionId || !content) return
          const judgmentId = dataAPI.createId("judgment")
          store.dispatch({
            type: "ADD_JUDGMENT",
            payload: {
              id: judgmentId,
              content,
              type: inputValue("new-judgment-type") || "",
              status: inputValue("new-judgment-status") || "",
              questionId,
              changeReason: markdownValue("new-judgment-reason"),
              supportingIds: [],
              contradictingIds: []
            }
          })
          recordSystemEvent(questionId, {
            label: "新增判断",
            relatedEntityType: "judgment",
            relatedEntityId: judgmentId,
            content: `新增判断：${content}`
          })
          recordReusableInput(app, "new-judgment-type", inputValue("new-judgment-type"))
          recordReusableInput(app, "new-judgment-status", inputValue("new-judgment-status"))
        } else if (editType === "new-strategy") {
          const questionId = parentId || editId
          const name = markdownValue("new-strategy-name")
          if (!questionId || !name) return
          const status = inputValue("new-strategy-status") || "exploring"
          const failureReason = markdownValue("new-strategy-failure")
          const methodTags = inputValues("new-strategy-method-tags", dataAPI.STRATEGY_METHOD_TAG_LABELS || dataAPI.STRATEGY_TYPE_LABELS)
          const strategyId = dataAPI.createId("strategy")
          store.dispatch({
            type: "ADD_STRATEGY",
            payload: {
              id: strategyId,
              name,
              type: methodTags[0] || "",
              methodTags: methodTags,
              description: markdownValue("new-strategy-description"),
              rationale: markdownValue("new-strategy-rationale"),
              status,
              questionId,
              parentId: null,
              branchIntent: inputValue("new-strategy-branch-intent") || "",
              outcomeMode: "stay_strategy",
              order: state.strategies.filter(function(item) { return item.questionId === questionId }).length,
              nextAction: markdownValue("new-strategy-next"),
              failureReason: status === "blocked" || status === "failed" ? failureReason : ""
            }
          })
          recordSystemEvent(questionId, {
            label: "新增策略",
            relatedEntityType: "strategy",
            relatedEntityId: strategyId,
            content: `新增策略：${name}`
          })
          recordReusableInputs(app, "new-strategy-method-tags", methodTags)
          recordReusableInput(app, "new-strategy-branch-intent", inputValue("new-strategy-branch-intent"))
        } else if (editType === "branch-link") {
          const strategy = store.getStrategyById(editId)
          const targetQuestionId = inputValue("branch-link-question-id")
          const targetQuestion = store.getQuestionById(targetQuestionId)
          if (!strategy || !targetQuestionId || !targetQuestion) return
          const branchRole = inputValue("branch-link-role") || ""
          const contributionType = inputValue("branch-link-contribution") || ""
          const branchNote = markdownValue("branch-link-note")
          const mappedIntent = mapBranchRoleToIntent(branchRole)
          store.dispatch({
            type: "ADD_BRANCH_LINK",
            payload: {
              id: dataAPI.createId("branch"),
              sourceType: "strategy",
              sourceId: strategy.id,
              targetType: "question",
              targetId: targetQuestionId,
              relationType: "link_existing_question",
              branchRole: branchRole,
              contributionType: contributionType,
              status: "active",
              note: branchNote
            }
          })
          store.dispatch({
            type: "UPDATE_QUESTION",
            payload: {
              id: targetQuestionId,
              updates: {
                branchMeta: Object.assign({}, targetQuestion.branchMeta || {}, {
                  parentRelationType: branchRole,
                  originSummary: branchNote || ((targetQuestion.branchMeta && targetQuestion.branchMeta.originSummary) || `与策略「${strategy.name}」建立分支关联。`)
                })
              }
            }
          })
          store.dispatch({
            type: "UPDATE_STRATEGY",
            payload: {
              id: strategy.id,
              updates: {
                branchIntent: mappedIntent || strategy.branchIntent || "",
                outcomeMode: "linked_question"
              }
            }
          })
          recordReusableInput(app, "branch-link-role", branchRole)
          recordReusableInput(app, "branch-link-contribution", contributionType)
        } else if (editType === "new-example") {
          const questionId = parentId || editId
          const content = markdownValue("new-example-content")
          if (!questionId || !content) return
          store.dispatch({
            type: "ADD_EXAMPLE",
            payload: {
              id: dataAPI.createId("example"),
              type: inputValue("new-example-type") || "",
              content,
              questionId,
              relatedJudgmentIds: [],
              conclusion: markdownValue("new-example-conclusion"),
              isKey: inputValue("new-example-key") === "yes"
            }
          })
          recordReusableInput(app, "new-example-type", inputValue("new-example-type"))
        } else if (editType === "new-obstacle") {
          const questionId = parentId || editId
          const content = markdownValue("new-obstacle-content")
          if (!questionId || !content) return
          const obstacleId = dataAPI.createId("obstacle")
          store.dispatch({
            type: "ADD_OBSTACLE",
            payload: {
              id: obstacleId,
              type: inputValue("new-obstacle-type") || "",
              content,
              questionId,
              affectedStrategyIds: [],
              isCoreProblem: inputValue("new-obstacle-core") === "yes",
              hasClue: inputValue("new-obstacle-has-clue") === "yes",
              clueDescription: markdownValue("new-obstacle-clue")
            }
          })
          recordSystemEvent(questionId, {
            label: "新增障碍",
            relatedEntityType: "obstacle",
            relatedEntityId: obstacleId,
            content: `新增障碍：${content}`
          })
          recordReusableInput(app, "new-obstacle-type", inputValue("new-obstacle-type"))
        } else if (editType === "new-insight") {
          const questionId = parentId || editId
          const content = markdownValue("new-insight-content")
          if (!questionId || !content) return
          const insightId = dataAPI.createId("insight")
          store.dispatch({
            type: "ADD_INSIGHT",
            payload: {
              id: insightId,
              type: inputValue("new-insight-type") || "",
              content,
              questionId
            }
          })
          recordSystemEvent(questionId, {
            label: "新增认识",
            relatedEntityType: "insight",
            relatedEntityId: insightId,
            content: `新增认识：${content}`
          })
          recordReusableInput(app, "new-insight-type", inputValue("new-insight-type"))
        } else if (editType === "formulation") {
          const formulation = state.formulations.find(function(item) { return item.id === editId })
          const content = markdownValue("edit-formulation-content")
          if (!content) return
          store.dispatch({
            type: "UPDATE_FORMULATION",
            payload: {
              id: editId,
              updates: {
                content,
                constraints: markdownLines("edit-formulation-constraints"),
                reason: markdownValue("edit-formulation-reason"),
                isAbandoned: inputValue("edit-formulation-abandoned") === "yes"
              }
            }
          })
          if (formulation && content !== String(formulation.content || "")) {
            recordSystemEvent(formulation.questionId, {
              label: "问题表述",
              relatedEntityType: "question",
              relatedEntityId: formulation.questionId,
              previousValue: formulation.content || "",
              nextValue: content
            })
          }
        } else if (editType === "judgment") {
          const judgment = state.judgments.find(function(item) { return item.id === editId })
          const content = markdownValue("edit-judgment-content")
          if (!content) return
          store.dispatch({
            type: "UPDATE_JUDGMENT",
            payload: {
              id: editId,
              updates: {
                content,
                type: inputValue("edit-judgment-type") || "",
                status: inputValue("edit-judgment-status") || "",
                changeReason: markdownValue("edit-judgment-reason")
              }
            }
          })
          if (judgment && content !== String(judgment.content || "")) {
            recordSystemEvent(judgment.questionId, {
              label: "判断内容",
              relatedEntityType: "judgment",
              relatedEntityId: judgment.id,
              previousValue: judgment.content || "",
              nextValue: content
            })
          }
          recordReusableInput(app, "edit-judgment-type", inputValue("edit-judgment-type"))
          recordReusableInput(app, "edit-judgment-status", inputValue("edit-judgment-status"))
        } else if (editType === "strategy") {
          const strategy = state.strategies.find(function(item) { return item.id === editId })
          const name = markdownValue("edit-strategy-name")
          if (!name) return
          const status = inputValue("edit-strategy-status") || "exploring"
          const failureReason = markdownValue("edit-strategy-failure")
          const methodTags = inputValues("edit-strategy-method-tags", dataAPI.STRATEGY_METHOD_TAG_LABELS || dataAPI.STRATEGY_TYPE_LABELS)
          store.dispatch({
            type: "UPDATE_STRATEGY",
            payload: {
              id: editId,
              updates: {
                name,
                type: methodTags[0] || "",
                methodTags: methodTags,
                branchIntent: inputValue("edit-strategy-branch-intent") || "",
                description: markdownValue("edit-strategy-description"),
                rationale: markdownValue("edit-strategy-rationale"),
                status,
                nextAction: markdownValue("edit-strategy-next"),
                failureReason: status === "blocked" || status === "failed" ? failureReason : ""
              }
            }
          })
          if (strategy && name !== String(strategy.name || "")) {
            recordSystemEvent(strategy.questionId, {
              label: "策略名称",
              relatedEntityType: "strategy",
              relatedEntityId: strategy.id,
              previousValue: strategy.name || "",
              nextValue: name
            })
          }
          if (strategy && status !== String(strategy.status || "")) {
            recordSystemEvent(strategy.questionId, {
              label: "策略状态",
              relatedEntityType: "strategy",
              relatedEntityId: strategy.id,
              previousValue: dataAPI.STRATEGY_STATUS_LABELS[strategy.status] || strategy.status,
              nextValue: dataAPI.STRATEGY_STATUS_LABELS[status] || status
            })
          }
          recordReusableInputs(app, "edit-strategy-method-tags", methodTags)
          recordReusableInput(app, "edit-strategy-branch-intent", inputValue("edit-strategy-branch-intent"))
        } else if (editType === "question-feedback") {
          const question = store.getQuestionById(editId)
          const branchSummary = researchCore && typeof researchCore.getQuestionBranchSummary === "function"
            ? researchCore.getQuestionBranchSummary(state, editId)
            : null
          const feedbackStatus = inputValue("feedback-status") || "pending"
          const feedbackSummary = markdownValue("feedback-summary")
          if (!question || !branchSummary || !branchSummary.primaryLink) return
          store.dispatch({
            type: "UPDATE_QUESTION",
            payload: {
              id: editId,
              updates: {
                branchMeta: Object.assign({}, question.branchMeta || {}, {
                  parentRelationType: question.branchMeta && question.branchMeta.parentRelationType
                    ? question.branchMeta.parentRelationType
                    : (branchSummary.branchRole || ""),
                  feedBackStatus: feedbackStatus,
                  feedBackSummary: feedbackSummary
                })
              }
            }
          })
          store.dispatch({
            type: "UPDATE_BRANCH_LINK",
            payload: {
              id: branchSummary.primaryLink.id,
              updates: {
                status: feedbackStatus === "fed_back" ? "fed_back" : feedbackStatus === "partial" ? "partial" : "active",
                note: feedbackSummary || branchSummary.originSummary || branchSummary.primaryLink.note || ""
              }
            }
          })
          if (branchSummary.sourceType === "strategy") {
            const nextStrategyStatus = inputValue("feedback-strategy-status") || "keep"
            if (nextStrategyStatus !== "keep") {
              store.dispatch({
                type: "UPDATE_STRATEGY",
                payload: {
                  id: branchSummary.sourceId,
                  updates: {
                    status: nextStrategyStatus
                  }
                }
              })
            }
            recordQuestionFeedbackEvents(question, branchSummary, feedbackStatus, feedbackSummary, nextStrategyStatus)
          } else {
            recordQuestionFeedbackEvents(question, branchSummary, feedbackStatus, feedbackSummary, "keep")
          }
        } else if (editType === "example") {
          const example = state.examples.find(function(item) { return item.id === editId })
          const content = markdownValue("edit-example-content")
          if (!content) return
          store.dispatch({
            type: "UPDATE_EXAMPLE",
            payload: {
              id: editId,
              updates: {
                type: inputValue("edit-example-type") || "",
                content,
                conclusion: markdownValue("edit-example-conclusion"),
                isKey: inputValue("edit-example-key") === "yes"
              }
            }
          })
          if (example && content !== String(example.content || "")) {
            recordSystemEvent(example.questionId, {
              label: "样例内容",
              relatedEntityType: "example",
              relatedEntityId: example.id,
              previousValue: example.content || "",
              nextValue: content
            })
          }
          recordReusableInput(app, "edit-example-type", inputValue("edit-example-type"))
        } else if (editType === "obstacle") {
          const obstacle = state.obstacles.find(function(item) { return item.id === editId })
          const content = markdownValue("edit-obstacle-content")
          if (!content) return
          store.dispatch({
            type: "UPDATE_OBSTACLE",
            payload: {
              id: editId,
              updates: {
                type: inputValue("edit-obstacle-type") || "",
                content,
                isCoreProblem: inputValue("edit-obstacle-core") === "yes",
                hasClue: inputValue("edit-obstacle-has-clue") === "yes",
                clueDescription: markdownValue("edit-obstacle-clue")
              }
            }
          })
          if (obstacle && content !== String(obstacle.content || "")) {
            recordSystemEvent(obstacle.questionId, {
              label: "障碍内容",
              relatedEntityType: "obstacle",
              relatedEntityId: obstacle.id,
              previousValue: obstacle.content || "",
              nextValue: content
            })
          }
          recordReusableInput(app, "edit-obstacle-type", inputValue("edit-obstacle-type"))
        } else if (editType === "insight") {
          const insight = state.insights.find(function(item) { return item.id === editId })
          const content = markdownValue("edit-insight-content")
          if (!content) return
          store.dispatch({
            type: "UPDATE_INSIGHT",
            payload: {
              id: editId,
              updates: {
                type: inputValue("edit-insight-type") || "",
                content
              }
            }
          })
          if (insight && content !== String(insight.content || "")) {
            recordSystemEvent(insight.questionId, {
              label: "认识内容",
              relatedEntityType: "insight",
              relatedEntityId: insight.id,
              previousValue: insight.content || "",
              nextValue: content
            })
          }
          recordReusableInput(app, "edit-insight-type", inputValue("edit-insight-type"))
        } else if (editType === "timeline-event") {
          const timelineEvent = store.getTimelineEventById(editId)
          const content = markdownValue("edit-timeline-content")
          if (!timelineEvent || !content) return
          store.dispatch({
            type: "UPDATE_TIMELINE_EVENT",
            payload: {
              id: editId,
              updates: {
                content: content
              }
            }
          })
        } else if (editType === "promote-event-action") {
          const timelineEvent = store.getTimelineEventById(editId)
          const title = markdownValue("promote-action-title")
          if (!timelineEvent || !title) return
          const actionId = dataAPI.createId("action")
          store.dispatch({
            type: "ADD_ACTION_ITEM",
            payload: {
              id: actionId,
              questionId: timelineEvent.questionId,
              strategyId: timelineEvent.relatedEntityType === "strategy" ? timelineEvent.relatedEntityId : "",
              title,
              description: markdownValue("promote-action-description"),
              status: inputValue("promote-action-status") || "queued",
              sourceTimelineEventId: timelineEvent.id
            }
          })
          store.dispatch({
            type: "UPDATE_TIMELINE_EVENT",
            payload: {
              id: timelineEvent.id,
              updates: {
                promotedEntityType: "action",
                promotedEntityId: actionId
              }
            }
          })
          recordSystemEvent(timelineEvent.questionId, {
            label: "升格为动作",
            relatedEntityType: "action",
            relatedEntityId: actionId,
            content: `从时间线事件升格为动作：${title}`
          })
        } else if (editType === "action-item") {
          const actionItem = store.getActionById(editId)
          const title = markdownValue("edit-action-title")
          if (!actionItem || !title) return
          const nextStatus = inputValue("edit-action-status") || actionItem.status || "queued"
          store.dispatch({
            type: "UPDATE_ACTION_ITEM",
            payload: {
              id: editId,
              updates: {
                title,
                description: markdownValue("edit-action-description"),
                status: nextStatus
              }
            }
          })
          if (title !== String(actionItem.title || "")) {
            recordSystemEvent(actionItem.questionId, {
              label: "动作标题",
              relatedEntityType: "action",
              relatedEntityId: actionItem.id,
              previousValue: actionItem.title || "",
              nextValue: title
            })
          }
          if (nextStatus !== String(actionItem.status || "")) {
            recordSystemEvent(actionItem.questionId, {
              label: "动作状态",
              relatedEntityType: "action",
              relatedEntityId: actionItem.id,
              previousValue: dataAPI.ACTION_STATUS_LABELS[actionItem.status] || actionItem.status,
              nextValue: dataAPI.ACTION_STATUS_LABELS[nextStatus] || nextStatus
            })
          }
        } else if (editType === "focus-session") {
          const title = markdownValue("edit-focus-title")
          if (!title) return
          store.dispatch({
            type: "UPDATE_FOCUS_SESSION",
            payload: {
              focusSessionId: editId,
              title,
              description: markdownValue("edit-focus-description"),
              nextContinuePoint: markdownValue("edit-focus-next"),
              confidenceLevel: inputValue("edit-focus-confidence") || "medium"
            }
          })
        } else {
          return
        }

        clearEditTarget(app)
        app.render()
        return
      }
      case "update-question": {
        const questionId = target.getAttribute("data-question-id")
        if (!questionId) return
        const title = markdownValue("question-title")
        const description = markdownValue("question-description")
        const status = inputValue("question-status") || "active"
        if (!title) return
        store.dispatch({
          type: "UPDATE_QUESTION",
          payload: {
            id: questionId,
            updates: {
              title,
              description,
              status
            }
          }
        })
        return
      }
      case "add-formulation": {
        const questionId = target.getAttribute("data-question-id")
        const question = store.getQuestionById(questionId)
        const content = markdownValue("formulation-content")
        if (!questionId || !question || !content) return
        const previousContent = String(question.description || "")
        store.dispatch({
          type: "ADD_FORMULATION",
          payload: {
            id: dataAPI.createId("formulation"),
            questionId: questionId,
            content: content,
            constraints: markdownLines("formulation-constraints"),
            reason: markdownValue("formulation-reason"),
            isAbandoned: false
          }
        })
        clearInput("formulation-content")
        clearInput("formulation-constraints")
        clearInput("formulation-reason")
        recordSystemEvent(questionId, {
          label: "问题表述",
          relatedEntityType: "question",
          relatedEntityId: questionId,
          previousValue: previousContent,
          nextValue: content
        })
        return
      }
      case "switch-tab":
        clearPendingSectionJump(app)
        app.ui.activeTab = target.getAttribute("data-tab") || "timeline"
        if (app.ui.activeTab !== "literature") {
          clearScheduledLiteratureSearch()
        }
        if (app.ui.activeTab === "literature" && global.MNResearchBridge) {
          app.ui.literatureSearchPending = false
          global.MNResearchBridge.requestCurrentDocumentLiterature()
        }
        app.render()
        return
      case "jump-to-section":
        activateQuestionSection(
          app,
          state,
          target.getAttribute("data-question-id"),
          target.getAttribute("data-target-tab") || "timeline",
          {
            scroll: true
          }
        )
        return
      case "request-literature-search":
        runLiteratureSearch(app)
        return
      case "request-current-document-literature":
        if (!global.MNResearchBridge) return
        global.MNResearchBridge.requestCurrentDocumentLiterature()
        return
      case "search-literature-in-library":
        if (!global.MNResearchBridge) return
        global.MNResearchBridge.searchLiteratureInLibrary(
          (app.ui.literatureQuery || app.ui.literatureSearchLastQuery || "").trim(),
          ""
        )
        return
      case "bind-literature-to-target": {
        const targetInfo = getSelectedLiteratureTarget(state, app, state.activeQuestionId)
        const literatureId = target.getAttribute("data-literature-id")
        const literatureTitle = target.getAttribute("data-literature-title") || ""
        if (!targetInfo || !literatureId) return
        const payload = {
          id: literatureId,
          title: literatureTitle,
          titleAlt: target.getAttribute("data-literature-title-alt") || "",
          authors: target.getAttribute("data-literature-authors") || "",
          year: target.getAttribute("data-literature-year") || "",
          referenceType: target.getAttribute("data-literature-type") || "",
          venue: target.getAttribute("data-literature-venue") || "",
          keywords: target.getAttribute("data-literature-keywords") || "",
          abstract: target.getAttribute("data-literature-abstract") || "",
          doi: target.getAttribute("data-literature-doi") || "",
          md5: target.getAttribute("data-literature-md5") || "",
          libraryType: target.getAttribute("data-literature-library-type") || "",
          hasCover: target.getAttribute("data-literature-has-cover") === "1"
        }

        store.batch(function() {
          store.dispatch({
            type: "LINK_LITERATURE_TO_TARGET",
            payload: {
              literature: payload,
              target: targetInfo
            }
          })

          if (targetInfo.type === "focus-session") {
            const focus = state.focusSessions.find(function(item) { return item.id === targetInfo.entityId })
            if (focus) {
              const linkedItems = Array.isArray(focus.linkedItems) ? focus.linkedItems.slice() : []
              const exists = linkedItems.some(function(item) {
                return item.type === "literature" && item.id === payload.id
              })
              if (!exists) {
                linkedItems.push({
                  type: "literature",
                  id: payload.id,
                  title: payload.title,
                  linkedAt: dataAPI.nowISO()
                })
                store.dispatch({
                  type: "UPDATE_FOCUS_SESSION",
                  payload: {
                    focusSessionId: focus.id,
                    linkedItems: linkedItems
                  }
                })
              }
            }
          }
        }, "bind-literature")
        return
      }
      case "unlink-literature-target": {
        const targetInfo = getSelectedLiteratureTarget(state, app, state.activeQuestionId)
        const literatureId = target.getAttribute("data-literature-id")
        if (!targetInfo || !literatureId) return
        store.batch(function() {
          store.dispatch({
            type: "UNLINK_LITERATURE_TARGET",
            payload: {
              id: literatureId,
              targetType: targetInfo.type,
              targetId: targetInfo.entityId
            }
          })
          if (targetInfo.type === "focus-session") {
            const focus = state.focusSessions.find(function(item) { return item.id === targetInfo.entityId })
            if (focus) {
              store.dispatch({
                type: "UPDATE_FOCUS_SESSION",
                payload: {
                  focusSessionId: focus.id,
                  linkedItems: (Array.isArray(focus.linkedItems) ? focus.linkedItems : []).filter(function(item) {
                    return !(item.type === "literature" && item.id === literatureId)
                  })
                }
              })
            }
          }
        }, "unlink-literature")
        return
      }
      case "open-literature-card":
        if (global.MNResearchBridge) {
          global.MNResearchBridge.openLiteratureCard(
            target.getAttribute("data-literature-id") || "",
            target.getAttribute("data-open-mode") || "focusCard"
          )
        }
        return
      case "add-judgment": {
        const questionId = target.getAttribute("data-question-id")
        const content = markdownValue("judgment-content")
        if (!content || !questionId) return
        const judgmentId = dataAPI.createId("judgment")
        store.dispatch({
          type: "ADD_JUDGMENT",
          payload: {
            id: judgmentId,
            content,
            type: inputValue("judgment-type") || "candidate_proposition",
            status: inputValue("judgment-status") || "",
            questionId,
            supportingIds: [],
            contradictingIds: []
          }
        })
        recordSystemEvent(questionId, {
          label: "新增判断",
          relatedEntityType: "judgment",
          relatedEntityId: judgmentId,
          content: `新增判断：${content}`
        })
        recordReusableInput(app, "new-judgment-status", inputValue("judgment-status"))
        clearInput("judgment-content")
        return
      }
      case "add-strategy": {
        const questionId = target.getAttribute("data-question-id")
        const name = markdownValue("strategy-name")
        const description = markdownValue("strategy-description")
        const rationale = markdownValue("strategy-rationale")
        const status = inputValue("strategy-status") || "exploring"
        const methodTags = inputValues("strategy-method-tags", dataAPI.STRATEGY_METHOD_TAG_LABELS || dataAPI.STRATEGY_TYPE_LABELS)
        if (!questionId || !name) return
        const strategyId = dataAPI.createId("strategy")
        store.dispatch({
          type: "ADD_STRATEGY",
          payload: {
            id: strategyId,
            name,
            type: methodTags[0] || "",
            methodTags: methodTags,
            description,
            rationale,
            status: status,
            questionId,
            parentId: null,
            order: state.strategies.filter((item) => item.questionId === questionId).length,
            nextAction: markdownValue("strategy-next"),
            failureReason: status === "blocked" || status === "failed"
              ? markdownValue("strategy-failure")
              : ""
          }
        })
        recordSystemEvent(questionId, {
          label: "新增策略",
          relatedEntityType: "strategy",
          relatedEntityId: strategyId,
          content: `新增策略：${name}`
        })
        clearInput("strategy-name")
        clearInput("strategy-description")
        clearInput("strategy-rationale")
        clearInput("strategy-next")
        clearInput("strategy-failure")
        return
      }
      case "cycle-strategy-status": {
        const strategyId = target.getAttribute("data-strategy-id")
        const strategy = state.strategies.find((item) => item.id === strategyId)
        if (!strategy) return
        const currentIndex = strategyCycle.indexOf(strategy.status)
        const nextStatus = strategyCycle[(currentIndex + 1) % strategyCycle.length]
        store.dispatch({
          type: "UPDATE_STRATEGY_STATUS",
          payload: { id: strategyId, status: nextStatus }
        })
        recordSystemEvent(strategy.questionId, {
          label: "策略状态",
          relatedEntityType: "strategy",
          relatedEntityId: strategy.id,
          previousValue: dataAPI.STRATEGY_STATUS_LABELS[strategy.status] || strategy.status,
          nextValue: dataAPI.STRATEGY_STATUS_LABELS[nextStatus] || nextStatus
        })
        return
      }
      case "add-example": {
        const questionId = target.getAttribute("data-question-id")
        const content = markdownValue("example-content")
        if (!questionId || !content) return
        store.dispatch({
          type: "ADD_EXAMPLE",
          payload: {
            id: dataAPI.createId("example"),
            type: inputValue("example-type") || "sample",
            content,
            questionId,
            relatedJudgmentIds: [],
            conclusion: markdownValue("example-conclusion"),
            isKey: false
          }
        })
        clearInput("example-content")
        clearInput("example-conclusion")
        return
      }
      case "add-obstacle": {
        const questionId = target.getAttribute("data-question-id")
        const content = markdownValue("obstacle-content")
        if (!questionId || !content) return
        const obstacleId = dataAPI.createId("obstacle")
        store.dispatch({
          type: "ADD_OBSTACLE",
          payload: {
            id: obstacleId,
            type: inputValue("obstacle-type") || "technical",
            content,
            questionId,
            affectedStrategyIds: [],
            isCoreProblem: inputValue("obstacle-core") === "yes",
            hasClue: inputValue("obstacle-has-clue") === "yes",
            clueDescription: markdownValue("obstacle-clue")
          }
        })
        recordSystemEvent(questionId, {
          label: "新增障碍",
          relatedEntityType: "obstacle",
          relatedEntityId: obstacleId,
          content: `新增障碍：${content}`
        })
        clearInput("obstacle-content")
        clearInput("obstacle-clue")
        return
      }
      case "add-insight": {
        const questionId = target.getAttribute("data-question-id")
        const content = markdownValue("insight-content")
        if (!questionId || !content) return
        const insightId = dataAPI.createId("insight")
        store.dispatch({
          type: "ADD_INSIGHT",
          payload: {
            id: insightId,
            type: inputValue("insight-type") || "observation",
            content,
            questionId
          }
        })
        recordSystemEvent(questionId, {
          label: "新增认识",
          relatedEntityType: "insight",
          relatedEntityId: insightId,
          content: `新增认识：${content}`
        })
        clearInput("insight-content")
        return
      }
      case "start-focus": {
        const focusTarget = resolveFocusTarget(state, app, target)
        if (!focusTarget) return
        setFocusState(state, focusTarget.questionId || state.activeQuestionId || null, focusTarget.type === "question" ? null : focusTarget.type, focusTarget.type === "question" ? null : focusTarget.entityId)
        app.ui.workspaceMode = "focus"
        app.ui.timelineEventModalId = null
        app.ui.focusOnlyCurrentEntity = false
        clearInput("focus-description")
        return
      }
      case "pause-focus":
        store.dispatch({
          type: "UPDATE_FOCUS_SESSION",
          payload: { focusSessionId: target.getAttribute("data-focus-id"), status: "paused" }
        })
        logProgress({
          focusSessionId: target.getAttribute("data-focus-id"),
          action: "paused"
        })
        return
      case "resume-focus":
        store.dispatch({
          type: "UPDATE_FOCUS_SESSION",
          payload: { focusSessionId: target.getAttribute("data-focus-id"), status: "active" }
        })
        logProgress({
          focusSessionId: target.getAttribute("data-focus-id"),
          action: "resumed"
        })
        return
      case "complete-focus":
        clearDeleteTarget(app)
        clearEditTarget(app)
        app.ui.summaryFocusId = target.getAttribute("data-focus-id")
        app.render()
        return
      case "close-summary-modal":
        app.ui.summaryFocusId = null
        app.render()
        return
      case "save-summary": {
        const focusId = target.getAttribute("data-focus-id")
        const focus = state.focusSessions.find((item) => item.id === focusId)
        if (!focus) return

        const relatedQuestionId = getFocusQuestionId(state, focus, state.activeQuestionId)
        const whatWasDone = markdownValue("summary-what-was-done")
        const keyConclusion = markdownValue("summary-key-conclusion")
        const nextSteps = markdownValue("summary-next-steps")
        const confidence = inputValue("summary-confidence") || "medium"
        const exampleLines = markdownLines("summary-new-examples")
        const insightLines = markdownLines("summary-new-insights")
        const obstacleLines = markdownLines("summary-new-obstacles")
        const createdExampleIds = []
        const createdInsightIds = []
        const createdObstacleIds = []

        store.batch(function() {
          if (relatedQuestionId && keyConclusion) {
            store.dispatch({
              type: "ADD_JUDGMENT",
              payload: {
                id: dataAPI.createId("judgment"),
                content: keyConclusion,
                type: "candidate_proposition",
                status: "",
                questionId: relatedQuestionId,
                supportingIds: [],
                contradictingIds: []
              }
            })
          }

          if (relatedQuestionId) {
            exampleLines.forEach(function(line) {
              const exampleId = dataAPI.createId("example")
              store.dispatch({
                type: "ADD_EXAMPLE",
                payload: {
                  id: exampleId,
                  type: /反例|counterexample/i.test(line) ? "counterexample" : "sample",
                  content: line,
                  questionId: relatedQuestionId,
                  relatedJudgmentIds: [],
                  conclusion: keyConclusion || whatWasDone,
                  isKey: confidence === "high"
                }
              })
              createdExampleIds.push(exampleId)
            })

            insightLines.forEach(function(line) {
              const insightId = dataAPI.createId("insight")
              store.dispatch({
                type: "ADD_INSIGHT",
                payload: {
                  id: insightId,
                  type: "observation",
                  content: line,
                  questionId: relatedQuestionId,
                  sourceSessionId: focusId,
                  stability: confidence === "high" ? "stable" : confidence === "medium" ? "moderate" : "tentative"
                }
              })
              createdInsightIds.push(insightId)
            })

            obstacleLines.forEach(function(line) {
              const obstacleId = dataAPI.createId("obstacle")
              store.dispatch({
                type: "ADD_OBSTACLE",
                payload: {
                  id: obstacleId,
                  type: "technical",
                  content: line,
                  questionId: relatedQuestionId,
                  affectedStrategyIds: [],
                  isCoreProblem: /核心|关键|瓶颈/.test(line),
                  hasClue: false,
                  clueDescription: ""
                }
              })
              createdObstacleIds.push(obstacleId)
            })

            if (nextSteps) {
              store.dispatch({
                type: "ADD_STRATEGY",
                payload: {
                  id: dataAPI.createId("strategy"),
                  name: "下一步动作",
                  type: "direct_advance",
                  description: nextSteps,
                  rationale: whatWasDone || keyConclusion || "来自会话总结",
                  status: "exploring",
                  questionId: relatedQuestionId,
                  parentId: null,
                  order: state.strategies.filter((item) => item.questionId === relatedQuestionId).length
                }
              })
            }
          }

          store.dispatch({
            type: "UPDATE_FOCUS_SESSION",
            payload: {
              focusSessionId: focusId,
              status: "completed",
              endTime: dataAPI.nowISO(),
              summary: keyConclusion || whatWasDone || "",
              newExampleIds: createdExampleIds,
              newInsightIds: createdInsightIds,
              newObstacleIds: createdObstacleIds,
              nextContinuePoint: nextSteps || "",
              confidenceLevel: confidence
            }
          })
          logProgress({
            focusSessionId: focusId,
            action: "completed",
            details: keyConclusion || whatWasDone || "完成专注会话"
          })
        }, "complete-focus")
        app.ui.summaryFocusId = null
        clearDeleteTarget(app)
        clearEditTarget(app)
        app.ui.focusPanelExpanded = false
        resetFocusDraft(app, relatedQuestionId || state.activeQuestionId || null)
        app.render()
        return
      }
      case "request-save":
        if (global.MNResearchBridge) {
          global.MNResearchBridge.flushSave(store.getState(), "manual-save")
        }
        return
      case "request-import":
        if (global.MNResearchBridge) global.MNResearchBridge.requestImport()
        return
      case "request-export":
        if (global.MNResearchBridge) global.MNResearchBridge.requestExport()
        return
      case "request-backup":
        if (global.MNResearchBridge) global.MNResearchBridge.requestBackup()
        return
      default:
        return
    }
  }

  function handleInput(target) {
    const app = getApp()
    const key = target.getAttribute("data-input")
    const state = store.getState()
    if (isComposingInput(target)) {
      return
    }
    const historyRoot = target.closest(".history-input")
    if (historyRoot) {
      closeHtmlSelects()
      updateHistoryInputMenu(historyRoot)
      return
    }
    if (key === "sidebar-query") {
      app.ui.sidebarQuery = target.value || ""
      app.render()
      return
    }
    if (key === "focus-query") {
      ensureFocusDraft(app)
      app.ui.focusDraft.query = target.value || ""
      app.render()
      return
    }
    if (key === "focus-link-query") {
      app.ui.focusLinkQuery = target.value || ""
      app.render()
      return
    }
    if (key === "literature-query") {
      app.ui.literatureQuery = target.value || ""
      app.ui.literatureSearchError = ""
      scheduleLiteratureSearch(app)
      return
    }
    if (key === "focus-bound-question") {
      setFocusState(state, target.value || null, null, null)
      app.ui.focusOnlyCurrentEntity = false
      app.render()
      return
    }
    if (key === "focus-bound-entity") {
      const rawValue = String(target.value || "")
      if (!rawValue) {
        const focusState = getFocusState(state)
        setFocusState(state, focusState.questionId, null, null)
        app.ui.focusOnlyCurrentEntity = false
        app.render()
        return
      }
      const parts = rawValue.split("::")
      const focusState = getFocusState(state)
      setFocusState(state, focusState.questionId, parts[0] || null, parts[1] || null)
      app.ui.focusOnlyCurrentEntity = false
      app.render()
      return
    }
    if (key === "focus-filter-type") {
      app.ui.focusFilterType = target.value || "all"
      app.render()
      return
    }
    if (key === "focus-filter-source") {
      app.ui.focusFilterSource = target.value || "all"
      app.render()
      return
    }
    if (key === "action-status") {
      const actionId = target.getAttribute("data-action-id") || ""
      const actionItem = actionId ? store.getActionById(actionId) : null
      const nextStatus = target.value || "queued"
      if (!actionItem || actionItem.status === nextStatus) {
        app.render()
        return
      }
      store.dispatch({
        type: "UPDATE_ACTION_STATUS",
        payload: {
          id: actionId,
          status: nextStatus
        }
      })
      recordSystemEvent(actionItem.questionId, {
        label: "动作状态",
        relatedEntityType: "action",
        relatedEntityId: actionItem.id,
        previousValue: dataAPI.ACTION_STATUS_LABELS[actionItem.status] || actionItem.status,
        nextValue: dataAPI.ACTION_STATUS_LABELS[nextStatus] || nextStatus
      })
      app.render()
    }
  }

  function handleTagDraftInput(target) {
    if (isComposingInput(target)) return
    const root = target.closest(".history-tag-input")
    if (!root) return
    closeHtmlSelects()
    updateHistoryTagInputMenu(root)
  }

  function attach() {
    document.addEventListener("click", (event) => {
      const actionTarget = event.target.closest("[data-action]")
      if (!actionTarget) {
        if (!event.target.closest(".html-select")) {
          closeHtmlSelects()
        }
        if (!event.target.closest(".history-input") && !event.target.closest(".history-tag-input")) {
          closeHistoryInputs()
        } else {
          const historyRoot = event.target.closest(".history-input")
          const tagRoot = event.target.closest(".history-tag-input")
          if (historyRoot) updateHistoryInputMenu(historyRoot)
          if (tagRoot) updateHistoryTagInputMenu(tagRoot)
        }
        return
      }
      event.preventDefault()
      handleAction(actionTarget.getAttribute("data-action"), actionTarget)
    })

    document.addEventListener("input", (event) => {
      const tagDraftTarget = event.target.closest("[data-tag-draft-input]")
      if (tagDraftTarget) {
        if (event.isComposing || isComposingInput(tagDraftTarget)) return
        handleTagDraftInput(tagDraftTarget)
        return
      }
      const inputTarget = event.target.closest("[data-input]")
      if (!inputTarget) return
      if (event.isComposing || isComposingInput(inputTarget)) return
      handleInput(inputTarget)
    })

    document.addEventListener("change", (event) => {
      const tagDraftTarget = event.target.closest("[data-tag-draft-input]")
      if (tagDraftTarget) {
        if (event.isComposing || isComposingInput(tagDraftTarget)) return
        handleTagDraftInput(tagDraftTarget)
        return
      }
      const inputTarget = event.target.closest("[data-input]")
      if (!inputTarget) return
      if (event.isComposing || isComposingInput(inputTarget)) return
      handleInput(inputTarget)
    })

    document.addEventListener("keydown", (event) => {
      const tagDraftTarget = event.target.closest("[data-tag-draft-input]")
      if (tagDraftTarget) {
        if (event.isComposing || isComposingInput(tagDraftTarget)) return
        if (event.key === "Escape") {
          closeHistoryInputs()
          return
        }
        if (event.key === "Enter" || event.key === "," || event.key === "，") {
          event.preventDefault()
          commitHistoryTagValue(tagDraftTarget.closest(".history-tag-input"), tagDraftTarget.value || "")
          return
        }
        if (event.key === "Backspace" && !(tagDraftTarget.value || "").trim()) {
          const root = tagDraftTarget.closest(".history-tag-input")
          const values = getHistoryTagValues(root)
          if (values.length) {
            event.preventDefault()
            removeHistoryTagValue(root, values[values.length - 1])
          }
          return
        }
        return
      }
      const inputTarget = event.target.closest("[data-input]")
      if (!inputTarget) return
      if (event.isComposing || isComposingInput(inputTarget)) return
      if (event.key === "Escape" && inputTarget.closest(".history-input")) {
        closeHistoryInputs()
        return
      }
      if (inputTarget.getAttribute("data-input") !== "literature-query") return
      if (event.key !== "Enter") return
      event.preventDefault()
      const app = getApp()
      if (!app) return
      app.ui.literatureQuery = inputTarget.value || ""
      runLiteratureSearch(app)
    })

    document.addEventListener("compositionstart", (event) => {
      const inputTarget = event.target.closest("[data-input], [data-tag-draft-input]")
      if (!inputTarget) return
      inputTarget.setAttribute("data-composing", "true")
    })

    document.addEventListener("compositionend", (event) => {
      const inputTarget = event.target.closest("[data-input], [data-tag-draft-input]")
      if (!inputTarget) return
      inputTarget.setAttribute("data-composing", "false")
      if (inputTarget.hasAttribute("data-tag-draft-input")) {
        handleTagDraftInput(inputTarget)
        return
      }
      handleInput(inputTarget)
    })
  }

  global.MNResearchActions = {
    attach
  }
})(window)
