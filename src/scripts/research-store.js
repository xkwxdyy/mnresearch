(function(global) {
  const dataAPI = global.MNResearchData
  const researchCore = global.MNResearch && global.MNResearch.core
  let state = dataAPI.createEmptyState()
  const listeners = []
  let batchDepth = 0
  let pendingNotify = null

  function clone(value) {
    return JSON.parse(JSON.stringify(value))
  }

  function normalizeQuestion(question, index) {
    const next = clone(question || {})
    next.id = next.id || dataAPI.createId("q")
    next.title = String(next.title || "新问题")
    next.description = String(next.description || "")
    next.status = next.status || "active"
    next.parentId = typeof next.parentId === "string" ? next.parentId : null
    next.order = typeof next.order === "number" ? next.order : index
    next.formulationIds = Array.isArray(next.formulationIds) ? next.formulationIds : []
    next.currentFormulationId = typeof next.currentFormulationId === "string"
      ? next.currentFormulationId
      : (next.formulationIds.length ? next.formulationIds[next.formulationIds.length - 1] : null)
    next.judgmentIds = Array.isArray(next.judgmentIds) ? next.judgmentIds : []
    next.exampleIds = Array.isArray(next.exampleIds) ? next.exampleIds : []
    next.strategyIds = Array.isArray(next.strategyIds) ? next.strategyIds : []
    next.obstacleIds = Array.isArray(next.obstacleIds) ? next.obstacleIds : []
    next.insightIds = Array.isArray(next.insightIds) ? next.insightIds : []
    next.branchMeta = next.branchMeta && typeof next.branchMeta === "object" ? clone(next.branchMeta) : {}
    next.branchMeta.parentRelationType = dataAPI.resolveMappedValue(next.branchMeta.parentRelationType || "", dataAPI.BRANCH_ROLE_LABELS)
    next.branchMeta.feedBackStatus = dataAPI.resolveMappedValue(next.branchMeta.feedBackStatus || "pending", dataAPI.QUESTION_FEEDBACK_STATUS_LABELS) || "pending"
    next.branchMeta.feedBackSummary = String(next.branchMeta.feedBackSummary || "")
    next.branchMeta.successCriteria = String(next.branchMeta.successCriteria || "")
    next.branchMeta.originSummary = String(next.branchMeta.originSummary || "")
    next.createdAt = next.createdAt || dataAPI.nowISO()
    next.updatedAt = next.updatedAt || next.createdAt
    return next
  }

  function normalizeJudgment(item, index) {
    const next = clone(item || {})
    next.id = String(next.id || dataAPI.createId("judgment"))
    next.content = String(next.content || "")
    next.type = String(next.type || "candidate_proposition")
    next.status = String(next.status || "")
    next.questionId = String(next.questionId || "")
    next.supportingIds = Array.isArray(next.supportingIds) ? next.supportingIds : []
    next.contradictingIds = Array.isArray(next.contradictingIds) ? next.contradictingIds : []
    next.changeReason = String(next.changeReason || "")
    next.order = typeof next.order === "number" ? next.order : index
    next.createdAt = next.createdAt || dataAPI.nowISO()
    next.updatedAt = next.updatedAt || next.createdAt
    return next
  }

  function normalizeExample(item, index) {
    const next = clone(item || {})
    next.id = String(next.id || dataAPI.createId("example"))
    next.type = String(next.type || "sample")
    next.content = String(next.content || "")
    next.questionId = String(next.questionId || "")
    next.relatedJudgmentIds = Array.isArray(next.relatedJudgmentIds) ? next.relatedJudgmentIds : []
    next.conclusion = String(next.conclusion || "")
    next.isKey = next.isKey === true
    next.order = typeof next.order === "number" ? next.order : index
    next.createdAt = next.createdAt || dataAPI.nowISO()
    next.updatedAt = next.updatedAt || next.createdAt
    return next
  }

  function normalizeObstacle(item, index) {
    const next = clone(item || {})
    next.id = String(next.id || dataAPI.createId("obstacle"))
    next.content = String(next.content || "")
    next.type = String(next.type || "technical")
    next.questionId = String(next.questionId || "")
    next.affectedStrategyIds = Array.isArray(next.affectedStrategyIds) ? next.affectedStrategyIds : []
    next.isCoreProblem = next.isCoreProblem === true
    next.hasClue = next.hasClue === true
    next.clueDescription = String(next.clueDescription || "")
    next.order = typeof next.order === "number" ? next.order : index
    next.createdAt = next.createdAt || dataAPI.nowISO()
    next.updatedAt = next.updatedAt || next.createdAt
    return next
  }

  function normalizeInsight(item, index) {
    const next = clone(item || {})
    next.id = String(next.id || dataAPI.createId("insight"))
    next.type = String(next.type || "observation")
    next.content = String(next.content || "")
    next.questionId = String(next.questionId || "")
    next.sourceJudgmentId = typeof next.sourceJudgmentId === "string" ? next.sourceJudgmentId : ""
    next.sourceStrategyId = typeof next.sourceStrategyId === "string" ? next.sourceStrategyId : ""
    next.sourceSessionId = typeof next.sourceSessionId === "string" ? next.sourceSessionId : ""
    next.stability = String(next.stability || "moderate")
    next.order = typeof next.order === "number" ? next.order : index
    next.createdAt = next.createdAt || dataAPI.nowISO()
    next.updatedAt = next.updatedAt || next.createdAt
    return next
  }

  function sortByOrder(items) {
    if (researchCore && typeof researchCore.sortByOrder === "function") {
      return researchCore.sortByOrder(items)
    }
    return (Array.isArray(items) ? items : []).slice().sort((left, right) => {
      const leftOrder = typeof left.order === "number" ? left.order : 0
      const rightOrder = typeof right.order === "number" ? right.order : 0
      if (leftOrder !== rightOrder) return leftOrder - rightOrder
      return String(left.id || "").localeCompare(String(right.id || ""), "zh-CN")
    })
  }

  function normalizeOrderedQuestionItems(items, normalizeItem) {
    const normalized = (Array.isArray(items) ? items : []).map((item, index) => normalizeItem(item, index))
    const buckets = {}
    const nextOrderMap = {}

    normalized.forEach((item) => {
      const questionId = item.questionId || "__missing_question__"
      if (!buckets[questionId]) buckets[questionId] = []
      buckets[questionId].push(item)
    })

    Object.keys(buckets).forEach((questionId) => {
      sortByOrder(buckets[questionId]).forEach((item, index) => {
        nextOrderMap[item.id] = index
      })
    })

    return normalized.map((item) => {
      const nextOrder = nextOrderMap[item.id]
      if (typeof nextOrder !== "number" || item.order === nextOrder) return item
      return normalizeItem(Object.assign({}, item, {
        order: nextOrder
      }), nextOrder)
    })
  }

  function collectOrderedQuestionEntityIds(items, questionId) {
    return sortByOrder((Array.isArray(items) ? items : []).filter((item) => item.questionId === questionId))
      .map((item) => item.id)
  }

  function normalizeLiteratureTarget(target) {
    const next = clone(target || {})
    next.type = String(next.type || "question")
    next.entityId = String(next.entityId || next.id || "")
    next.questionId = typeof next.questionId === "string"
      ? next.questionId
      : (next.type === "question" ? next.entityId : null)
    next.label = String(next.label || next.title || "")
    next.linkedAt = next.linkedAt || dataAPI.nowISO()
    return next
  }

  function buildLiteratureQuestionIds(linkedTargets) {
    const result = []
    ;(Array.isArray(linkedTargets) ? linkedTargets : []).forEach((target) => {
      const questionId = typeof target.questionId === "string" ? target.questionId : null
      if (questionId && result.indexOf(questionId) === -1) {
        result.push(questionId)
      }
    })
    return result
  }

  function normalizeLiteratureItem(item, index) {
    const next = clone(item || {})
    next.id = String(next.id || `literature-${index || 0}`)
    next.source = String(next.source || "mnliterature")
    next.title = String(next.title || "未命名文献")
    next.titleAlt = String(next.titleAlt || "")
    next.authors = String(next.authors || "")
    next.year = String(next.year || "")
    next.referenceType = String(next.referenceType || "")
    next.venue = String(next.venue || "")
    next.keywords = String(next.keywords || "")
    next.abstract = String(next.abstract || "")
    next.doi = String(next.doi || "")
    next.md5 = String(next.md5 || "")
    next.libraryType = String(next.libraryType || "")
    next.hasCover = next.hasCover === true
    const linkedTargetMap = {}
    next.linkedTargets = Array.isArray(next.linkedTargets)
      ? next.linkedTargets
        .map(normalizeLiteratureTarget)
        .filter((target) => {
          if (!target.entityId) return false
          const key = `${target.type}::${target.entityId}`
          if (linkedTargetMap[key]) return false
          linkedTargetMap[key] = true
          return true
        })
      : []
    next.questionIds = next.linkedTargets.length
      ? buildLiteratureQuestionIds(next.linkedTargets)
      : Array.isArray(next.questionIds)
        ? next.questionIds.reduce((result, id) => {
          const text = String(id || "")
          if (!text || result.indexOf(text) >= 0) return result
          result.push(text)
          return result
        }, [])
        : []
    next.createdAt = next.createdAt || dataAPI.nowISO()
    next.updatedAt = next.updatedAt || next.createdAt
    return next
  }

  function normalizeFocusSession(item, index) {
    const next = clone(item || {})
    next.id = String(next.id || dataAPI.createId("focus"))
    next.type = String(next.type || "question")
    next.entityId = String(next.entityId || "")
    next.title = String(next.title || `专注会话 ${index + 1}`)
    next.description = String(next.description || "")
    next.status = String(next.status || "active")
    next.startTime = next.startTime || next.createdAt || dataAPI.nowISO()
    next.endTime = typeof next.endTime === "string" ? next.endTime : ""
    next.linkedItems = Array.isArray(next.linkedItems) ? next.linkedItems : []
    next.newExampleIds = Array.isArray(next.newExampleIds) ? next.newExampleIds : []
    next.newInsightIds = Array.isArray(next.newInsightIds) ? next.newInsightIds : []
    next.newObstacleIds = Array.isArray(next.newObstacleIds) ? next.newObstacleIds : []
    next.createdAt = next.createdAt || dataAPI.nowISO()
    next.updatedAt = next.updatedAt || next.createdAt
    delete next.notes
    return next
  }

  function normalizeStrategy(item, index, meta) {
    const next = clone(item || {})
    next.id = String(next.id || dataAPI.createId("strategy"))
    next.name = String(next.name || `未命名策略 ${index + 1}`)
    next.methodTags = dataAPI.getStrategyMethodTags(next)
    next.type = next.methodTags[0] || dataAPI.resolveMappedValue(next.type || "", dataAPI.STRATEGY_METHOD_TAG_LABELS) || ""
    next.description = String(next.description || "")
    next.rationale = String(next.rationale || "")
    next.status = String(next.status || "exploring")
    next.questionId = String(next.questionId || "")
    next.parentId = typeof next.parentId === "string" ? next.parentId : null
    next.currentObstacleId = String(next.currentObstacleId || "")
    next.nextAction = String(next.nextAction || "")
    next.failureReason = String(next.failureReason || "")
    next.branchIntent = dataAPI.resolveMappedValue(next.branchIntent || "", dataAPI.STRATEGY_BRANCH_INTENT_LABELS) || ""
    next.outcomeMode = String(next.outcomeMode || "stay_strategy")
    next.order = typeof next.order === "number" ? next.order : index
    next.createdAt = next.createdAt || dataAPI.nowISO()
    next.updatedAt = next.updatedAt || next.createdAt

    if (next.rationale && next.description && next.rationale === next.description) {
      next.rationale = ""
      if (meta) meta.hasLegacyStrategyDedup = true
    }

    if (next.failureReason && next.description && next.failureReason === next.description) {
      next.failureReason = ""
      if (meta) meta.hasLegacyStrategyDedup = true
    }

    return next
  }

  const ORDERED_QUESTION_COLLECTIONS = {
    judgment: {
      stateKey: "judgments",
      questionField: "judgmentIds",
      normalize: normalizeJudgment
    },
    strategy: {
      stateKey: "strategies",
      questionField: "strategyIds",
      normalize(item, index) {
        return normalizeStrategy(item, index)
      }
    },
    example: {
      stateKey: "examples",
      questionField: "exampleIds",
      normalize: normalizeExample
    },
    obstacle: {
      stateKey: "obstacles",
      questionField: "obstacleIds",
      normalize: normalizeObstacle
    },
    insight: {
      stateKey: "insights",
      questionField: "insightIds",
      normalize: normalizeInsight
    }
  }

  function normalizeBranchLink(item, index) {
    const next = clone(item || {})
    next.id = String(next.id || dataAPI.createId("branch"))
    next.sourceType = String(next.sourceType || "strategy")
    next.sourceId = String(next.sourceId || "")
    next.targetType = String(next.targetType || "question")
    next.targetId = String(next.targetId || "")
    next.relationType = String(next.relationType || "spawn_question")
    next.branchRole = dataAPI.resolveMappedValue(next.branchRole || "subproblem", dataAPI.BRANCH_ROLE_LABELS) || "subproblem"
    next.contributionType = dataAPI.resolveMappedValue(next.contributionType || "answer_parent", dataAPI.BRANCH_CONTRIBUTION_LABELS) || "answer_parent"
    next.status = String(next.status || "active")
    next.note = String(next.note || "")
    next.order = typeof next.order === "number" ? next.order : index
    next.createdAt = next.createdAt || dataAPI.nowISO()
    next.updatedAt = next.updatedAt || next.createdAt
    return next
  }

  function normalizeProgressEntry(item, index) {
    const next = clone(item || {})
    next.id = String(next.id || dataAPI.createId("progress"))
    next.createdAt = next.createdAt || dataAPI.nowISO()
    next.updatedAt = next.updatedAt || next.createdAt
    if (String(next.entityType || "") === "focus-note") {
      return null
    }
    return next
  }

  function normalizeTimelineEvent(item, index) {
    const next = clone(item || {})
    next.id = String(next.id || dataAPI.createId("timeline"))
    next.questionId = String(next.questionId || "")
    next.relatedEntityType = typeof next.relatedEntityType === "string" ? next.relatedEntityType : ""
    next.relatedEntityId = typeof next.relatedEntityId === "string" ? next.relatedEntityId : ""
    next.eventType = String(next.eventType || "quick_note")
    next.noteType = typeof next.noteType === "string" ? next.noteType : ""
    next.source = String(next.source || "manual")
    next.label = String(next.label || "")
    next.content = String(next.content || "")
    next.previousValue = String(next.previousValue || "")
    next.nextValue = String(next.nextValue || "")
    next.promotedEntityType = typeof next.promotedEntityType === "string" ? next.promotedEntityType : ""
    next.promotedEntityId = typeof next.promotedEntityId === "string" ? next.promotedEntityId : ""
    next.order = typeof next.order === "number" ? next.order : index
    next.createdAt = next.createdAt || dataAPI.nowISO()
    next.updatedAt = next.updatedAt || next.createdAt
    return next
  }

  function normalizeActionItem(item, index) {
    const next = clone(item || {})
    next.id = String(next.id || dataAPI.createId("action"))
    next.questionId = String(next.questionId || "")
    next.strategyId = typeof next.strategyId === "string" ? next.strategyId : ""
    next.title = String(next.title || `未命名动作 ${index + 1}`)
    next.description = String(next.description || "")
    next.status = String(next.status || "queued")
    next.sourceTimelineEventId = typeof next.sourceTimelineEventId === "string" ? next.sourceTimelineEventId : ""
    next.createdAt = next.createdAt || dataAPI.nowISO()
    next.updatedAt = next.updatedAt || next.createdAt
    return next
  }

  function normalizeFocusState(item) {
    const next = clone(item || {})
    next.questionId = typeof next.questionId === "string" ? next.questionId : null
    next.entityType = typeof next.entityType === "string" ? next.entityType : null
    next.entityId = typeof next.entityId === "string" ? next.entityId : null
    return next
  }

  function isFocusEntityValid(focusState, sourceState) {
    if (!focusState || !focusState.entityType || !focusState.entityId) return false
    if (!focusState.questionId) return false
    if (focusState.entityType === "strategy") {
      return sourceState.strategies.some((item) => item.id === focusState.entityId && item.questionId === focusState.questionId)
    }
    if (focusState.entityType === "action") {
      return sourceState.actions.some((item) => item.id === focusState.entityId && item.questionId === focusState.questionId)
    }
    return false
  }

  function sanitizeFocusState(sourceState) {
    const next = normalizeFocusState(sourceState.focusState)
    if (!next.questionId || !sourceState.questions.some((item) => item.id === next.questionId)) {
      return {
        questionId: null,
        entityType: null,
        entityId: null
      }
    }
    if (!isFocusEntityValid(next, sourceState)) {
      next.entityType = null
      next.entityId = null
    }
    return next
  }

  function normalizeState(rawState, meta) {
    const base = dataAPI.createEmptyState()
    const source = rawState && rawState.data ? rawState.data : rawState || {}
    const arrayKeys = Object.keys(base).filter((key) => Array.isArray(base[key]))

    arrayKeys.forEach((key) => {
      base[key] = Array.isArray(source[key]) ? clone(source[key]) : []
    })

    base.questions = base.questions.map(normalizeQuestion)
    base.judgments = normalizeOrderedQuestionItems(base.judgments, normalizeJudgment)
    base.examples = normalizeOrderedQuestionItems(base.examples, normalizeExample)
    base.strategies = normalizeOrderedQuestionItems(base.strategies, (item, index) => normalizeStrategy(item, index, meta))
    base.obstacles = normalizeOrderedQuestionItems(base.obstacles, normalizeObstacle)
    base.insights = normalizeOrderedQuestionItems(base.insights, normalizeInsight)
    base.branchLinks = base.branchLinks.map((item, index) => normalizeBranchLink(item, index))
    base.literature = base.literature.map(normalizeLiteratureItem)
    base.timelineEvents = base.timelineEvents.map((item, index) => normalizeTimelineEvent(item, index))
    base.actions = base.actions.map((item, index) => normalizeActionItem(item, index))
    base.focusSessions = base.focusSessions.map(normalizeFocusSession)
    base.progressLog = base.progressLog.map(normalizeProgressEntry).filter(Boolean)
    base.questions = base.questions.map((question, index) => normalizeQuestion(Object.assign({}, question, {
      judgmentIds: collectOrderedQuestionEntityIds(base.judgments, question.id),
      exampleIds: collectOrderedQuestionEntityIds(base.examples, question.id),
      strategyIds: collectOrderedQuestionEntityIds(base.strategies, question.id),
      obstacleIds: collectOrderedQuestionEntityIds(base.obstacles, question.id),
      insightIds: collectOrderedQuestionEntityIds(base.insights, question.id)
    }), question.order || index))
    base.focusState = sanitizeFocusState(Object.assign({}, base, {
      focusState: normalizeFocusState(source.focusState)
    }))
    base.currentFocusId = typeof source.currentFocusId === "string" || source.currentFocusId === null
      ? source.currentFocusId
      : null
    base.activeQuestionId = typeof source.activeQuestionId === "string" || source.activeQuestionId === null
      ? source.activeQuestionId
      : null

    return base
  }

  function ensureQuestionLink(questionId, fieldName, valueId) {
    state.questions = state.questions.map((question) => {
      if (question.id !== questionId) return question
      const values = Array.isArray(question[fieldName]) ? question[fieldName].slice() : []
      if (values.indexOf(valueId) === -1) {
        values.push(valueId)
      }
      question[fieldName] = values
      question.updatedAt = dataAPI.nowISO()
      return question
    })
  }

  function syncQuestionOrderedIds(questionId, fieldName, orderedIds, touchUpdatedAt) {
    if (!questionId || !fieldName) return
    state.questions = state.questions.map((question) => {
      if (question.id !== questionId) return question
      return normalizeQuestion(Object.assign({}, question, {
        [fieldName]: Array.isArray(orderedIds) ? orderedIds.slice() : [],
        updatedAt: touchUpdatedAt || question.updatedAt
      }), question.order || 0)
    })
  }

  function createIdSet(ids) {
    return (Array.isArray(ids) ? ids : []).reduce((result, id) => {
      if (id) result[id] = true
      return result
    }, {})
  }

  function getQuestionIdSet(questionId) {
    if (researchCore && typeof researchCore.collectQuestionFamilyIds === "function") {
      return createIdSet(researchCore.collectQuestionFamilyIds(state, questionId))
    }
    return createIdSet([questionId])
  }

  function getNextQuestionItemOrder(items, questionId) {
    const siblings = sortByOrder((Array.isArray(items) ? items : []).filter((item) => item.questionId === questionId))
    if (!siblings.length) return 0
    const lastItem = siblings[siblings.length - 1]
    return (typeof lastItem.order === "number" ? lastItem.order : siblings.length - 1) + 1
  }

  function compactQuestionOrders() {
    const parentBuckets = {}

    state.questions.forEach((question) => {
      const parentKey = question.parentId || "__root__"
      if (!parentBuckets[parentKey]) parentBuckets[parentKey] = []
      parentBuckets[parentKey].push(question)
    })

    const nextOrderMap = {}
    Object.keys(parentBuckets).forEach((parentKey) => {
      parentBuckets[parentKey]
        .slice()
        .sort((left, right) => (left.order || 0) - (right.order || 0))
        .forEach((question, index) => {
          nextOrderMap[question.id] = index
        })
    })

    state.questions = state.questions.map((question) => {
      if (!Object.prototype.hasOwnProperty.call(nextOrderMap, question.id)) return question
      return normalizeQuestion(Object.assign({}, question, {
        order: nextOrderMap[question.id]
      }), nextOrderMap[question.id])
    })
  }

  function getDefaultActiveQuestionId(preferredParentId) {
    if (preferredParentId && state.questions.some((item) => item.id === preferredParentId)) {
      return preferredParentId
    }
    if (!state.questions.length) return null
    if (researchCore && typeof researchCore.buildQuestionTree === "function") {
      const roots = researchCore.buildQuestionTree(state)
      if (roots[0]) return roots[0].id
    }
    const ordered = state.questions.slice().sort((left, right) => (left.order || 0) - (right.order || 0))
    return ordered[0] ? ordered[0].id : null
  }

  function removeQuestionLinkedCollection(items, questionIdMap, touchTimestamp) {
    return (Array.isArray(items) ? items : []).reduce((result, item) => {
      if (typeof item.questionId === "string") {
        if (questionIdMap[item.questionId]) return result
        result.push(item)
        return result
      }

      if (Array.isArray(item.questionIds)) {
        const nextQuestionIds = item.questionIds.filter((id) => !questionIdMap[id])
        if (!nextQuestionIds.length && item.questionIds.length) return result
        if (nextQuestionIds.length !== item.questionIds.length) {
          result.push(Object.assign({}, item, {
            questionIds: nextQuestionIds,
            updatedAt: touchTimestamp || item.updatedAt
          }))
          return result
        }
      }

      result.push(item)
      return result
    }, [])
  }

  function entityRemovedByDelete(entityType, entityId, deletedEntitySets, questionIdMap, sourceState) {
    if (!entityType || !entityId) return false
    if (entityType === "question") return !!questionIdMap[entityId]
    const normalizedType = entityType === "focus-session"
      ? "focusSession"
      : entityType
    if (deletedEntitySets[normalizedType] && deletedEntitySets[normalizedType][entityId]) return true
    if (researchCore && typeof researchCore.getQuestionIdForEntity === "function") {
      const relatedQuestionId = researchCore.getQuestionIdForEntity(sourceState, entityType, entityId)
      return !!questionIdMap[relatedQuestionId]
    }
    return false
  }

  function mergeIdSets() {
    const result = {}
    Array.prototype.slice.call(arguments).forEach((set) => {
      if (!set) return
      Object.keys(set).forEach((id) => {
        result[id] = true
      })
    })
    return result
  }

  function withoutIds(values, idSet) {
    if (!Array.isArray(values) || !values.length || !idSet || !Object.keys(idSet).length) {
      return Array.isArray(values) ? values.slice() : []
    }
    return values.filter((id) => !idSet[id])
  }

  function updateItemsWithArrayCleanup(items, fieldName, idSet, now) {
    return (Array.isArray(items) ? items : []).map((item) => {
      const current = Array.isArray(item[fieldName]) ? item[fieldName] : []
      const next = withoutIds(current, idSet)
      if (next.length === current.length) return item
      return Object.assign({}, item, {
        [fieldName]: next,
        updatedAt: now
      })
    })
  }

  function updateItemsWithReferenceCleanup(items, fieldName, idSet, now, emptyValue) {
    return (Array.isArray(items) ? items : []).map((item) => {
      const current = item[fieldName]
      if (!current || !idSet || !idSet[current]) return item
      return Object.assign({}, item, {
        [fieldName]: emptyValue,
        updatedAt: now
      })
    })
  }

  function cleanupLiteratureTargets(deletedEntitySets, sourceState, now, questionIdMap) {
    const nextItems = []
    ;(Array.isArray(state.literature) ? state.literature : []).forEach((item, index) => {
      const hadLinkedTargets = Array.isArray(item.linkedTargets) && item.linkedTargets.length > 0
      const linkedTargets = Array.isArray(item.linkedTargets)
        ? item.linkedTargets.filter((target) => !entityRemovedByDelete(target.type, target.entityId, deletedEntitySets, questionIdMap || {}, sourceState))
        : []
      const nextQuestionIds = buildLiteratureQuestionIds(linkedTargets)
      const legacyQuestionIds = Array.isArray(item.questionIds)
        ? item.questionIds.filter((id) => !(questionIdMap || {})[id])
        : []
      const finalQuestionIds = hadLinkedTargets ? nextQuestionIds : (nextQuestionIds.length ? nextQuestionIds : legacyQuestionIds)
      if (!linkedTargets.length && !finalQuestionIds.length) {
        return
      }
      if (linkedTargets.length === (Array.isArray(item.linkedTargets) ? item.linkedTargets.length : 0) &&
          finalQuestionIds.length === (Array.isArray(item.questionIds) ? item.questionIds.length : 0)) {
        nextItems.push(normalizeLiteratureItem(item, index))
        return
      }
      nextItems.push(normalizeLiteratureItem(Object.assign({}, item, {
        linkedTargets,
        questionIds: finalQuestionIds,
        updatedAt: now
      }), index))
    })
    state.literature = nextItems
  }

  function getStrategyIdSet(strategyId) {
    const list = Array.isArray(state.strategies) ? state.strategies : []
    const childMap = {}
    const ids = []
    const queue = [strategyId]
    const seen = {}

    list.forEach((item) => {
      const parentKey = item.parentId || "__root__"
      if (!childMap[parentKey]) childMap[parentKey] = []
      childMap[parentKey].push(item.id)
    })

    while (queue.length) {
      const currentId = queue.shift()
      if (!currentId || seen[currentId]) continue
      seen[currentId] = true
      ids.push(currentId)
      ;(childMap[currentId] || []).forEach((childId) => {
        queue.push(childId)
      })
    }

    return createIdSet(ids)
  }

  function cleanupBranchLinks(deletedEntitySets) {
    const questionIdSet = deletedEntitySets && deletedEntitySets.question ? deletedEntitySets.question : {}
    const strategyIdSet = deletedEntitySets && deletedEntitySets.strategy ? deletedEntitySets.strategy : {}
    state.branchLinks = (Array.isArray(state.branchLinks) ? state.branchLinks : []).filter((link) => {
      if (link.sourceType === "question" && questionIdSet[link.sourceId]) return false
      if (link.targetType === "question" && questionIdSet[link.targetId]) return false
      if (link.sourceType === "strategy" && strategyIdSet[link.sourceId]) return false
      if (link.targetType === "strategy" && strategyIdSet[link.targetId]) return false
      return true
    })
  }

  function cleanupDerivedReferences(deletedEntitySets, sourceState, now, questionIdMap) {
    const questionFieldMap = {
      formulation: "formulationIds",
      judgment: "judgmentIds",
      strategy: "strategyIds",
      example: "exampleIds",
      obstacle: "obstacleIds",
      insight: "insightIds"
    }
    const deletedAnyIdSet = mergeIdSets(
      deletedEntitySets.formulation,
      deletedEntitySets.judgment,
      deletedEntitySets.strategy,
      deletedEntitySets.example,
      deletedEntitySets.obstacle,
      deletedEntitySets.insight,
      deletedEntitySets.focusSession,
      deletedEntitySets.literature
    )

    state.questions = state.questions.map((question) => {
      let next = question
      Object.keys(questionFieldMap).forEach((type) => {
        const fieldName = questionFieldMap[type]
        const cleaned = withoutIds(next[fieldName], deletedEntitySets[type])
        if (cleaned.length !== (Array.isArray(next[fieldName]) ? next[fieldName].length : 0)) {
          next = normalizeQuestion(Object.assign({}, next, {
            [fieldName]: cleaned,
            updatedAt: now
          }), next.order || 0)
        }
      })
      return next
    })

    state.examples = updateItemsWithArrayCleanup(state.examples, "relatedJudgmentIds", deletedEntitySets.judgment, now)
    state.obstacles = updateItemsWithArrayCleanup(state.obstacles, "affectedStrategyIds", deletedEntitySets.strategy, now)
    state.judgments = updateItemsWithArrayCleanup(state.judgments, "supportingIds", deletedAnyIdSet, now)
    state.judgments = updateItemsWithArrayCleanup(state.judgments, "contradictingIds", deletedAnyIdSet, now)
    state.strategies = updateItemsWithReferenceCleanup(state.strategies, "currentObstacleId", deletedEntitySets.obstacle, now, "")
    state.insights = updateItemsWithReferenceCleanup(state.insights, "sourceJudgmentId", deletedEntitySets.judgment, now, "")
    state.insights = updateItemsWithReferenceCleanup(state.insights, "sourceStrategyId", deletedEntitySets.strategy, now, "")
    state.insights = updateItemsWithReferenceCleanup(state.insights, "sourceSessionId", deletedEntitySets.focusSession, now, "")

    state.focusSessions = (Array.isArray(state.focusSessions) ? state.focusSessions : []).map((item) => {
      const nextLinkedItems = Array.isArray(item.linkedItems)
        ? item.linkedItems.filter((link) => !entityRemovedByDelete(link.type, link.id, deletedEntitySets, questionIdMap || {}, sourceState))
        : []
      const nextExampleIds = withoutIds(item.newExampleIds, deletedEntitySets.example)
      const nextInsightIds = withoutIds(item.newInsightIds, deletedEntitySets.insight)
      const nextObstacleIds = withoutIds(item.newObstacleIds, deletedEntitySets.obstacle)
      const nextRelatedStrategyId = item.relatedStrategyId && deletedEntitySets.strategy && deletedEntitySets.strategy[item.relatedStrategyId]
        ? ""
        : item.relatedStrategyId
      const changed = nextLinkedItems.length !== (Array.isArray(item.linkedItems) ? item.linkedItems.length : 0) ||
        nextExampleIds.length !== (Array.isArray(item.newExampleIds) ? item.newExampleIds.length : 0) ||
        nextInsightIds.length !== (Array.isArray(item.newInsightIds) ? item.newInsightIds.length : 0) ||
        nextObstacleIds.length !== (Array.isArray(item.newObstacleIds) ? item.newObstacleIds.length : 0) ||
        nextRelatedStrategyId !== item.relatedStrategyId
      if (!changed) return item
      return Object.assign({}, item, {
        linkedItems: nextLinkedItems,
        newExampleIds: nextExampleIds,
        newInsightIds: nextInsightIds,
        newObstacleIds: nextObstacleIds,
        relatedStrategyId: nextRelatedStrategyId,
        updatedAt: now
      })
    })

    cleanupLiteratureTargets(deletedEntitySets, sourceState, now, questionIdMap || {})
    cleanupBranchLinks(deletedEntitySets)
  }

  function removeFocusSessionsForDeletedEntities(deletedEntitySets, sourceState, now, questionIdMap) {
    const removedSessionIdSet = createIdSet((Array.isArray(state.focusSessions) ? state.focusSessions : [])
      .filter((item) => entityRemovedByDelete(item.type, item.entityId, deletedEntitySets, questionIdMap || {}, sourceState))
      .map((item) => item.id))

    if (Object.keys(removedSessionIdSet).length) {
      deletedEntitySets.focusSession = mergeIdSets(deletedEntitySets.focusSession, removedSessionIdSet)
    }

    state.focusSessions = (Array.isArray(state.focusSessions) ? state.focusSessions : [])
      .filter((item) => !removedSessionIdSet[item.id])

    if (state.currentFocusId && removedSessionIdSet[state.currentFocusId]) {
      state.currentFocusId = null
    }

    state.progressLog = (Array.isArray(state.progressLog) ? state.progressLog : []).filter((item) => {
      if (removedSessionIdSet[item.focusSessionId]) return false
      if (entityRemovedByDelete(item.entityType, item.entityId, deletedEntitySets, questionIdMap || {}, sourceState)) {
        return false
      }
      return true
    })

    cleanupDerivedReferences(deletedEntitySets, sourceState, now, questionIdMap || {})
  }

  function getEntityQuestionId(sourceState, type, entityId) {
    if (!researchCore || typeof researchCore.getQuestionIdForEntity !== "function") return null
    return researchCore.getQuestionIdForEntity(sourceState, type, entityId)
  }

  function createSnapshot() {
    if (researchCore && typeof researchCore.computeSnapshot === "function") {
      const snapshot = researchCore.computeSnapshot(state)
      snapshot.currentFocus = state.focusSessions.find((item) => item.id === state.currentFocusId) || null
      return snapshot
    }
    const pendingJudgments = state.judgments.filter((item) => item.status !== "converged").length
    const blockedStrategies = state.strategies.filter((item) => item.status === "blocked" || item.status === "stalled").length
    const currentFocus = state.focusSessions.find((item) => item.id === state.currentFocusId) || null
    return {
      totalQuestions: state.questions.length,
      resolvedQuestions: state.questions.filter((item) => item.status === "resolved").length,
      activeQuestions: state.questions.filter((item) => item.status === "active").length,
      pendingJudgments,
      totalStrategies: state.strategies.length,
      blockedStrategies,
      totalBranchLinks: Array.isArray(state.branchLinks) ? state.branchLinks.length : 0,
      totalExamples: state.examples.length,
      totalInsights: state.insights.length,
      currentFocus
    }
  }

  function buildQuestionTree() {
    if (researchCore && typeof researchCore.buildQuestionTree === "function") {
      return researchCore.buildQuestionTree(state)
    }
    const questionMap = {}
    const roots = []
    state.questions
      .slice()
      .sort((left, right) => (left.order || 0) - (right.order || 0))
      .forEach((question) => {
        questionMap[question.id] = Object.assign({}, question, {
          children: [],
          judgments: sortByOrder(state.judgments.filter((item) => item.questionId === question.id)),
          strategies: sortByOrder(state.strategies.filter((item) => item.questionId === question.id)),
          examples: sortByOrder(state.examples.filter((item) => item.questionId === question.id)),
          insights: sortByOrder(state.insights.filter((item) => item.questionId === question.id)),
          incomingBranchLinks: state.branchLinks.filter((item) => item.targetType === "question" && item.targetId === question.id),
          outgoingBranchLinks: state.branchLinks.filter((item) => item.sourceType === "question" && item.sourceId === question.id)
        })
      })

    Object.keys(questionMap).forEach((id) => {
      const node = questionMap[id]
      if (node.parentId && questionMap[node.parentId]) {
        questionMap[node.parentId].children.push(node)
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  function notify(reason, options) {
    const payload = {
      reason: reason || "update",
      skipNativeSave: options && options.skipNativeSave === true
    }
    if (batchDepth > 0) {
      if (!pendingNotify) {
        pendingNotify = payload
      } else {
        pendingNotify.reason = payload.reason || pendingNotify.reason
        pendingNotify.skipNativeSave = !!(pendingNotify.skipNativeSave && payload.skipNativeSave)
      }
      return
    }
    listeners.forEach((listener) => listener(getState(), payload))
  }

  function batch(run, reason) {
    batchDepth += 1
    try {
      run()
    } finally {
      batchDepth -= 1
      if (batchDepth <= 0) {
        batchDepth = 0
        if (pendingNotify) {
          const payload = pendingNotify
          pendingNotify = null
          if (reason) payload.reason = reason
          listeners.forEach((listener) => listener(getState(), payload))
        }
      }
    }
  }

  function setState(nextState, reason, options) {
    const meta = {}
    state = normalizeState(nextState, meta)
    const notifyOptions = Object.assign({}, options)
    if (meta.hasLegacyStrategyDedup &&
        notifyOptions.skipNativeSave &&
        reason !== "sample-seed") {
      notifyOptions.skipNativeSave = false
    }
    notify(reason, notifyOptions)
  }

  function getState() {
    return clone(state)
  }

  function dispatch(action) {
    const now = dataAPI.nowISO()
    switch (action.type) {
      case "LOAD_STATE":
        setState(action.payload, action.reason || "load", { skipNativeSave: true })
        return
      case "SET_ACTIVE_QUESTION":
        if (state.activeQuestionId === action.payload) return
        state.activeQuestionId = action.payload
        notify("set-active-question")
        return
      case "UPDATE_FOCUS_STATE": {
        state.focusState = sanitizeFocusState(Object.assign({}, state, {
          focusState: normalizeFocusState(action.payload)
        }))
        notify("update-focus-state")
        return
      }
      case "ADD_TIMELINE_EVENT": {
        const payload = normalizeTimelineEvent(Object.assign({}, action.payload, {
          id: action.payload.id || dataAPI.createId("timeline"),
          createdAt: action.payload.createdAt || now,
          updatedAt: now
        }), state.timelineEvents.length)
        if (!payload.questionId) return
        state.timelineEvents.push(payload)
        notify("add-timeline-event")
        return
      }
      case "UPDATE_TIMELINE_EVENT":
        state.timelineEvents = state.timelineEvents.map((item, index) => item.id === action.payload.id
          ? normalizeTimelineEvent(Object.assign({}, item, action.payload.updates || {}, { updatedAt: now }), index)
          : item
        )
        notify("update-timeline-event")
        return
      case "DELETE_TIMELINE_EVENT":
        state.timelineEvents = state.timelineEvents.filter((item) => item.id !== (action.payload && action.payload.id))
        notify("delete-timeline-event")
        return
      case "ADD_ACTION_ITEM": {
        const payload = normalizeActionItem(Object.assign({}, action.payload, {
          id: action.payload.id || dataAPI.createId("action"),
          createdAt: action.payload.createdAt || now,
          updatedAt: now
        }), state.actions.length)
        if (!payload.questionId || !payload.title) return
        state.actions.push(payload)
        notify("add-action-item")
        return
      }
      case "UPDATE_ACTION_ITEM":
        state.actions = state.actions.map((item, index) => item.id === action.payload.id
          ? normalizeActionItem(Object.assign({}, item, action.payload.updates || {}, { updatedAt: now }), index)
          : item
        )
        state.focusState = sanitizeFocusState(state)
        notify("update-action-item")
        return
      case "UPDATE_ACTION_STATUS":
        state.actions = state.actions.map((item) => item.id === action.payload.id
          ? Object.assign({}, item, { status: action.payload.status, updatedAt: now })
          : item
        )
        notify("update-action-status")
        return
      case "DELETE_ACTION_ITEM":
        state.actions = state.actions.filter((item) => item.id !== (action.payload && action.payload.id))
        state.focusState = sanitizeFocusState(state)
        notify("delete-action-item")
        return
      case "ADD_QUESTION": {
        const payload = normalizeQuestion(Object.assign({}, action.payload, {
          createdAt: action.payload.createdAt || now,
          updatedAt: now
        }), state.questions.length)
        state.questions.push(payload)
        state.activeQuestionId = payload.id
        notify("add-question")
        return
      }
      case "LINK_LITERATURE_TO_TARGET": {
        const payload = action.payload || {}
        const target = normalizeLiteratureTarget(payload.target || {})
        const literatureInput = payload.literature || {}
        if (!target.entityId || !target.questionId) return
        const literatureId = String(literatureInput.id || "")
        if (!literatureId) return
        const existing = state.literature.find((item) => item.id === literatureId)
        if (existing) {
          state.literature = state.literature.map((item, index) => {
            if (item.id !== literatureId) return item
            const linkedTargets = Array.isArray(item.linkedTargets) ? item.linkedTargets.slice() : []
            const exists = linkedTargets.some((entry) => entry.type === target.type && entry.entityId === target.entityId)
            if (!exists) {
              linkedTargets.push(target)
            }
            return normalizeLiteratureItem(Object.assign({}, item, literatureInput, {
              linkedTargets,
              questionIds: buildLiteratureQuestionIds(linkedTargets),
              updatedAt: now
            }), index)
          })
        } else {
          state.literature.push(normalizeLiteratureItem(Object.assign({}, literatureInput, {
            linkedTargets: [target],
            questionIds: [target.questionId],
            createdAt: now,
            updatedAt: now
          }), state.literature.length))
        }
        notify("link-literature")
        return
      }
      case "UNLINK_LITERATURE_TARGET": {
        const payload = action.payload || {}
        const literatureId = String(payload.id || "")
        const targetType = String(payload.targetType || "")
        const targetId = String(payload.targetId || "")
        if (!literatureId || !targetType || !targetId) return
        state.literature = state.literature.reduce((result, item, index) => {
          if (item.id !== literatureId) {
            result.push(item)
            return result
          }
          const linkedTargets = Array.isArray(item.linkedTargets)
            ? item.linkedTargets.filter((target) => !(target.type === targetType && target.entityId === targetId))
            : []
          const questionIds = buildLiteratureQuestionIds(linkedTargets)
          if (!linkedTargets.length && !questionIds.length) {
            return result
          }
          result.push(normalizeLiteratureItem(Object.assign({}, item, {
            linkedTargets,
            questionIds,
            updatedAt: now
          }), index))
          return result
        }, [])
        notify("unlink-literature")
        return
      }
      case "UPDATE_QUESTION":
        state.questions = state.questions.map((item) => item.id === action.payload.id
          ? normalizeQuestion(Object.assign({}, item, action.payload.updates, { updatedAt: now }), item.order || 0)
          : item
        )
        notify("update-question")
        return
      case "DELETE_QUESTION": {
        const questionId = action.payload && action.payload.id
        const sourceState = clone(state)
        const targetQuestion = state.questions.find((item) => item.id === questionId)
        const questionIdMap = getQuestionIdSet(questionId)
        const formulationIdSet = createIdSet(state.formulations.filter((item) => questionIdMap[item.questionId]).map((item) => item.id))
        const judgmentIdSet = createIdSet(state.judgments.filter((item) => questionIdMap[item.questionId]).map((item) => item.id))
        const strategyIdSet = createIdSet(state.strategies.filter((item) => questionIdMap[item.questionId]).map((item) => item.id))
        const exampleIdSet = createIdSet(state.examples.filter((item) => questionIdMap[item.questionId]).map((item) => item.id))
        const obstacleIdSet = createIdSet(state.obstacles.filter((item) => questionIdMap[item.questionId]).map((item) => item.id))
        const insightIdSet = createIdSet(state.insights.filter((item) => questionIdMap[item.questionId]).map((item) => item.id))
        const deletedEntitySets = {
          question: questionIdMap,
          formulation: formulationIdSet,
          judgment: judgmentIdSet,
          strategy: strategyIdSet,
          example: exampleIdSet,
          obstacle: obstacleIdSet,
          insight: insightIdSet,
          literature: {}
        }

        if (!questionId || !targetQuestion || !Object.keys(questionIdMap).length) return

        state.questions = state.questions.filter((item) => !questionIdMap[item.id])
        state.formulations = state.formulations.filter((item) => !questionIdMap[item.questionId])
        state.judgments = state.judgments.filter((item) => !questionIdMap[item.questionId])
        state.strategies = state.strategies.filter((item) => !questionIdMap[item.questionId])
        state.examples = state.examples.filter((item) => !questionIdMap[item.questionId])
        state.obstacles = state.obstacles.filter((item) => !questionIdMap[item.questionId])
        state.insights = state.insights.filter((item) => !questionIdMap[item.questionId])
        state.actions = state.actions.filter((item) => !questionIdMap[item.questionId])
        state.timelineEvents = state.timelineEvents.filter((item) => !questionIdMap[item.questionId])
        state.literature = state.literature.reduce((result, item) => {
          const nextQuestionIds = Array.isArray(item.questionIds)
            ? item.questionIds.filter((id) => !questionIdMap[id])
            : []
          if (Array.isArray(item.questionIds) && item.questionIds.length && !nextQuestionIds.length) {
            deletedEntitySets.literature[item.id] = true
            return result
          }
          if (Array.isArray(item.questionIds) && nextQuestionIds.length !== item.questionIds.length) {
            result.push(Object.assign({}, item, {
              questionIds: nextQuestionIds,
              updatedAt: now
            }))
            return result
          }
          result.push(item)
          return result
        }, [])

        removeFocusSessionsForDeletedEntities(deletedEntitySets, sourceState, now, questionIdMap)

        if (!state.activeQuestionId || questionIdMap[state.activeQuestionId]) {
          state.activeQuestionId = getDefaultActiveQuestionId(targetQuestion.parentId)
        } else if (!state.questions.some((item) => item.id === state.activeQuestionId)) {
          state.activeQuestionId = getDefaultActiveQuestionId(targetQuestion.parentId)
        }

        compactQuestionOrders()
        state.focusState = sanitizeFocusState(state)
        notify("delete-question")
        return
      }
      case "ADD_FORMULATION": {
        const payload = Object.assign({}, action.payload, {
          id: action.payload.id || dataAPI.createId("formulation"),
          version: action.payload.version || (state.formulations.filter((item) => item.questionId === action.payload.questionId).length + 1),
          createdAt: action.payload.createdAt || now,
          updatedAt: now
        })
        state.formulations.push(payload)
        state.questions = state.questions.map((item) => {
          if (item.id !== payload.questionId) return item
          const formulationIds = Array.isArray(item.formulationIds) ? item.formulationIds.slice() : []
          if (formulationIds.indexOf(payload.id) === -1) {
            formulationIds.push(payload.id)
          }
          return normalizeQuestion(Object.assign({}, item, {
            formulationIds,
            currentFormulationId: payload.id,
            description: payload.content,
            updatedAt: now
          }), item.order || 0)
        })
        notify("add-formulation")
        return
      }
      case "UPDATE_FORMULATION": {
        const formulationId = action.payload && action.payload.id
        const formulation = state.formulations.find((item) => item.id === formulationId)
        if (!formulationId || !formulation) return
        state.formulations = state.formulations.map((item) => item.id === formulationId
          ? Object.assign({}, item, action.payload.updates || {}, { updatedAt: now })
          : item
        )
        const nextFormulation = state.formulations.find((item) => item.id === formulationId)
        state.questions = state.questions.map((item) => {
          if (item.id !== formulation.questionId) return item
          if (item.currentFormulationId !== formulationId) return item
          return normalizeQuestion(Object.assign({}, item, {
            description: nextFormulation && nextFormulation.content ? nextFormulation.content : item.description,
            updatedAt: now
          }), item.order || 0)
        })
        notify("update-formulation")
        return
      }
      case "SET_CURRENT_FORMULATION": {
        const questionId = action.payload && action.payload.questionId
        const formulationId = action.payload && action.payload.formulationId
        const formulation = state.formulations.find((item) => item.id === formulationId && item.questionId === questionId)
        if (!questionId || !formulationId || !formulation) return
        state.questions = state.questions.map((item) => item.id === questionId
          ? normalizeQuestion(Object.assign({}, item, {
            currentFormulationId: formulationId,
            description: formulation.content || item.description || "",
            updatedAt: now
          }), item.order || 0)
          : item
        )
        notify("set-current-formulation")
        return
      }
      case "DELETE_FORMULATION": {
        const formulationId = action.payload && action.payload.id
        const sourceState = clone(state)
        const formulation = state.formulations.find((item) => item.id === formulationId)
        if (!formulationId || !formulation) return
        state.formulations = state.formulations.filter((item) => item.id !== formulationId)
        const remainingFormulations = state.formulations
          .filter((item) => item.questionId === formulation.questionId)
          .slice()
          .sort((left, right) => {
            if ((right.version || 0) !== (left.version || 0)) return (right.version || 0) - (left.version || 0)
            return String(right.updatedAt || "").localeCompare(String(left.updatedAt || ""), "zh-CN")
          })
        const replacement = remainingFormulations[0] || null
        state.questions = state.questions.map((item) => {
          if (item.id !== formulation.questionId) return item
          const nextFormulationIds = withoutIds(item.formulationIds, createIdSet([formulationId]))
          const deletingCurrent = item.currentFormulationId === formulationId
          return normalizeQuestion(Object.assign({}, item, {
            formulationIds: nextFormulationIds,
            currentFormulationId: deletingCurrent ? (replacement ? replacement.id : null) : item.currentFormulationId,
            description: deletingCurrent ? (replacement ? replacement.content : "") : item.description,
            updatedAt: now
          }), item.order || 0)
        })
        removeFocusSessionsForDeletedEntities({
          formulation: createIdSet([formulationId]),
          focusSession: {},
          focusNote: {},
          literature: {}
        }, sourceState, now, {})
        notify("delete-formulation")
        return
      }
      case "ADD_JUDGMENT": {
        const payload = normalizeJudgment(Object.assign({}, action.payload, {
          id: action.payload.id || dataAPI.createId("judgment"),
          order: getNextQuestionItemOrder(state.judgments, action.payload.questionId),
          createdAt: action.payload.createdAt || now,
          updatedAt: now
        }), state.judgments.length)
        state.judgments.push(payload)
        ensureQuestionLink(payload.questionId, "judgmentIds", payload.id)
        notify("add-judgment")
        return
      }
      case "UPDATE_JUDGMENT":
        state.judgments = state.judgments.map((item) => item.id === action.payload.id
          ? normalizeJudgment(Object.assign({}, item, action.payload.updates || {}, { updatedAt: now }), item.order || 0)
          : item
        )
        notify("update-judgment")
        return
      case "UPDATE_JUDGMENT_STATUS":
        state.judgments = state.judgments.map((item) => item.id === action.payload.id
          ? Object.assign({}, item, { status: action.payload.status, updatedAt: now })
          : item
        )
        notify("update-judgment-status")
        return
      case "DELETE_JUDGMENT": {
        const judgmentId = action.payload && action.payload.id
        const sourceState = clone(state)
        if (!judgmentId || !state.judgments.some((item) => item.id === judgmentId)) return
        state.judgments = state.judgments.filter((item) => item.id !== judgmentId)
        removeFocusSessionsForDeletedEntities({
          judgment: createIdSet([judgmentId]),
          focusSession: {},
          focusNote: {},
          literature: {}
        }, sourceState, now, {})
        notify("delete-judgment")
        return
      }
      case "ADD_STRATEGY": {
        const payload = normalizeStrategy(Object.assign({}, action.payload, {
          id: action.payload.id || dataAPI.createId("strategy"),
          order: getNextQuestionItemOrder(state.strategies, action.payload.questionId),
          createdAt: action.payload.createdAt || now,
          updatedAt: now
        }), state.strategies.length)
        state.strategies.push(payload)
        ensureQuestionLink(payload.questionId, "strategyIds", payload.id)
        notify("add-strategy")
        return
      }
      case "UPDATE_STRATEGY":
        state.strategies = state.strategies.map((item) => item.id === action.payload.id
          ? normalizeStrategy(Object.assign({}, item, action.payload.updates || {}, { updatedAt: now }), item.order || 0)
          : item
        )
        notify("update-strategy")
        return
      case "UPDATE_STRATEGY_STATUS":
        state.strategies = state.strategies.map((item) => item.id === action.payload.id
          ? Object.assign({}, item, { status: action.payload.status, updatedAt: now })
          : item
        )
        notify("update-strategy-status")
        return
      case "DELETE_STRATEGY": {
        const strategyId = action.payload && action.payload.id
        const sourceState = clone(state)
        const strategyIdSet = getStrategyIdSet(strategyId)
        if (!strategyId || !Object.keys(strategyIdSet).length) return
        state.strategies = state.strategies.filter((item) => !strategyIdSet[item.id])
        state.actions = state.actions.map((item, index) => {
          if (!strategyIdSet[item.strategyId]) return item
          return normalizeActionItem(Object.assign({}, item, {
            strategyId: "",
            updatedAt: now
          }), index)
        })
        removeFocusSessionsForDeletedEntities({
          strategy: strategyIdSet,
          focusSession: {},
          focusNote: {},
          literature: {}
        }, sourceState, now, {})
        state.focusState = sanitizeFocusState(state)
        notify("delete-strategy")
        return
      }
      case "ADD_BRANCH_LINK": {
        const payload = normalizeBranchLink(Object.assign({}, action.payload, {
          id: action.payload.id || dataAPI.createId("branch"),
          createdAt: action.payload.createdAt || now,
          updatedAt: now
        }), state.branchLinks.length)
        if (!payload.sourceId || !payload.targetId) return
        state.branchLinks.push(payload)
        notify("add-branch-link")
        return
      }
      case "UPDATE_BRANCH_LINK":
        state.branchLinks = state.branchLinks.map((item) => item.id === action.payload.id
          ? normalizeBranchLink(Object.assign({}, item, action.payload.updates || {}, { updatedAt: now }), item.order || 0)
          : item
        )
        notify("update-branch-link")
        return
      case "DELETE_BRANCH_LINK":
        state.branchLinks = state.branchLinks.filter((item) => item.id !== (action.payload && action.payload.id))
        notify("delete-branch-link")
        return
      case "ADD_EXAMPLE": {
        const payload = normalizeExample(Object.assign({}, action.payload, {
          id: action.payload.id || dataAPI.createId("example"),
          order: getNextQuestionItemOrder(state.examples, action.payload.questionId),
          createdAt: action.payload.createdAt || now,
          updatedAt: now
        }), state.examples.length)
        state.examples.push(payload)
        ensureQuestionLink(payload.questionId, "exampleIds", payload.id)
        notify("add-example")
        return
      }
      case "UPDATE_EXAMPLE":
        state.examples = state.examples.map((item) => item.id === action.payload.id
          ? normalizeExample(Object.assign({}, item, action.payload.updates || {}, { updatedAt: now }), item.order || 0)
          : item
        )
        notify("update-example")
        return
      case "DELETE_EXAMPLE": {
        const exampleId = action.payload && action.payload.id
        const sourceState = clone(state)
        if (!exampleId || !state.examples.some((item) => item.id === exampleId)) return
        state.examples = state.examples.filter((item) => item.id !== exampleId)
        removeFocusSessionsForDeletedEntities({
          example: createIdSet([exampleId]),
          focusSession: {},
          focusNote: {},
          literature: {}
        }, sourceState, now, {})
        notify("delete-example")
        return
      }
      case "ADD_OBSTACLE": {
        const payload = normalizeObstacle(Object.assign({}, action.payload, {
          id: action.payload.id || dataAPI.createId("obstacle"),
          order: getNextQuestionItemOrder(state.obstacles, action.payload.questionId),
          createdAt: action.payload.createdAt || now,
          updatedAt: now
        }), state.obstacles.length)
        state.obstacles.push(payload)
        ensureQuestionLink(payload.questionId, "obstacleIds", payload.id)
        notify("add-obstacle")
        return
      }
      case "UPDATE_OBSTACLE":
        state.obstacles = state.obstacles.map((item) => item.id === action.payload.id
          ? normalizeObstacle(Object.assign({}, item, action.payload.updates || {}, { updatedAt: now }), item.order || 0)
          : item
        )
        notify("update-obstacle")
        return
      case "DELETE_OBSTACLE": {
        const obstacleId = action.payload && action.payload.id
        const sourceState = clone(state)
        if (!obstacleId || !state.obstacles.some((item) => item.id === obstacleId)) return
        state.obstacles = state.obstacles.filter((item) => item.id !== obstacleId)
        removeFocusSessionsForDeletedEntities({
          obstacle: createIdSet([obstacleId]),
          focusSession: {},
          focusNote: {},
          literature: {}
        }, sourceState, now, {})
        notify("delete-obstacle")
        return
      }
      case "ADD_INSIGHT": {
        const payload = normalizeInsight(Object.assign({}, action.payload, {
          id: action.payload.id || dataAPI.createId("insight"),
          order: getNextQuestionItemOrder(state.insights, action.payload.questionId),
          createdAt: action.payload.createdAt || now,
          updatedAt: now
        }), state.insights.length)
        state.insights.push(payload)
        ensureQuestionLink(payload.questionId, "insightIds", payload.id)
        notify("add-insight")
        return
      }
      case "UPDATE_INSIGHT":
        state.insights = state.insights.map((item) => item.id === action.payload.id
          ? normalizeInsight(Object.assign({}, item, action.payload.updates || {}, { updatedAt: now }), item.order || 0)
          : item
        )
        notify("update-insight")
        return
      case "DELETE_INSIGHT": {
        const insightId = action.payload && action.payload.id
        const sourceState = clone(state)
        if (!insightId || !state.insights.some((item) => item.id === insightId)) return
        state.insights = state.insights.filter((item) => item.id !== insightId)
        removeFocusSessionsForDeletedEntities({
          insight: createIdSet([insightId]),
          focusSession: {},
          focusNote: {},
          literature: {}
        }, sourceState, now, {})
        notify("delete-insight")
        return
      }
      case "MOVE_QUESTION_ITEM": {
        const entityType = action.payload && action.payload.entityType
        const itemId = action.payload && action.payload.id
        const direction = Number(action.payload && action.payload.direction)
        const collection = ORDERED_QUESTION_COLLECTIONS[entityType]
        if (!collection || !itemId || !direction) return
        const items = state[collection.stateKey]
        const currentItem = items.find((item) => item.id === itemId)
        if (!currentItem || !currentItem.questionId) return
        const siblings = sortByOrder(items.filter((item) => item.questionId === currentItem.questionId))
        const currentIndex = siblings.findIndex((item) => item.id === itemId)
        const nextIndex = currentIndex + (direction < 0 ? -1 : 1)
        if (currentIndex < 0 || nextIndex < 0 || nextIndex >= siblings.length) return
        const adjacentItem = siblings[nextIndex]
        if (!adjacentItem) return
        const currentOrder = typeof currentItem.order === "number" ? currentItem.order : currentIndex
        const adjacentOrder = typeof adjacentItem.order === "number" ? adjacentItem.order : nextIndex

        state[collection.stateKey] = items.map((item) => {
          if (item.id === currentItem.id) {
            return collection.normalize(Object.assign({}, item, {
              order: adjacentOrder,
              updatedAt: now
            }), adjacentOrder)
          }
          if (item.id === adjacentItem.id) {
            return collection.normalize(Object.assign({}, item, {
              order: currentOrder,
              updatedAt: now
            }), currentOrder)
          }
          return item
        })

        siblings[currentIndex] = adjacentItem
        siblings[nextIndex] = currentItem
        syncQuestionOrderedIds(
          currentItem.questionId,
          collection.questionField,
          siblings.map((item) => item.id),
          now
        )
        notify("move-question-item")
        return
      }
      case "START_FOCUS": {
        const payload = Object.assign({}, action.payload, {
          id: action.payload.id || dataAPI.createId("focus"),
          createdAt: action.payload.createdAt || now,
          updatedAt: now,
          startTime: action.payload.startTime || now,
          status: action.payload.status || "active",
          linkedItems: Array.isArray(action.payload.linkedItems) ? action.payload.linkedItems : []
        })
        state.focusSessions.push(normalizeFocusSession(payload, state.focusSessions.length))
        state.currentFocusId = payload.id
        notify("start-focus")
        return
      }
      case "UPDATE_FOCUS_SESSION":
        state.focusSessions = state.focusSessions.map((item) => {
          if (item.id !== action.payload.focusSessionId) return item
          const updates = Object.assign({}, action.payload)
          delete updates.focusSessionId
          return Object.assign({}, item, updates, { updatedAt: now })
        })
        if (action.payload.status === "completed" && state.currentFocusId === action.payload.focusSessionId) {
          state.currentFocusId = null
        }
        if (action.payload.status === "active") {
          state.currentFocusId = action.payload.focusSessionId
        }
        notify("update-focus-session")
        return
      case "UPDATE_FOCUS_STATUS":
        state.focusSessions = state.focusSessions.map((item) => item.id === action.payload.id
          ? Object.assign({}, item, {
            status: action.payload.status,
            endTime: action.payload.status === "completed" ? now : item.endTime,
            updatedAt: now
          })
          : item
        )
        if (action.payload.status === "completed" && state.currentFocusId === action.payload.id) {
          state.currentFocusId = null
        }
        notify("update-focus-status")
        return
      case "DELETE_FOCUS_SESSION": {
        const focusSessionId = action.payload && action.payload.id
        const sourceState = clone(state)
        if (!focusSessionId || !state.focusSessions.some((item) => item.id === focusSessionId)) return
        state.focusSessions = state.focusSessions.filter((item) => item.id !== focusSessionId)
        if (state.currentFocusId === focusSessionId) {
          state.currentFocusId = null
        }
        state.progressLog = state.progressLog.filter((item) => item.focusSessionId !== focusSessionId)
        cleanupDerivedReferences({
          focusSession: createIdSet([focusSessionId]),
          literature: {}
        }, sourceState, now, {})
        notify("delete-focus-session")
        return
      }
      case "ADD_PROGRESS_ENTRY":
        const progressEntry = normalizeProgressEntry(Object.assign({}, action.payload, {
          id: action.payload.id || dataAPI.createId("progress"),
          createdAt: action.payload.createdAt || now,
          updatedAt: now
        }), state.progressLog.length)
        if (!progressEntry) return
        state.progressLog.push(progressEntry)
        notify("add-progress-entry")
        return
      case "SET_CURRENT_FOCUS":
        state.currentFocusId = action.payload
        notify("set-current-focus")
        return
      default:
        return
    }
  }

  const store = {
    subscribe(listener) {
      listeners.push(listener)
      return function unsubscribe() {
        const index = listeners.indexOf(listener)
        if (index >= 0) {
          listeners.splice(index, 1)
        }
      }
    },
    load(statePayload, reason) {
      setState(statePayload, reason || "load", { skipNativeSave: true })
    },
    dispatch,
    batch,
    getState,
    getQuestionTree: buildQuestionTree,
    getSnapshot: createSnapshot,
    getQuestionById(id) {
      return state.questions.find((item) => item.id === id) || null
    },
    getQuestionWithRelations(id) {
      const question = state.questions.find((item) => item.id === id)
      if (!question) return null
      if (researchCore && typeof researchCore.getQuestionRelations === "function") {
        return Object.assign({}, question, researchCore.getQuestionRelations(state, id))
      }
      return Object.assign({}, question, {
        judgments: sortByOrder(state.judgments.filter((item) => item.questionId === id)),
        strategies: sortByOrder(state.strategies.filter((item) => item.questionId === id)),
        actions: state.actions.filter((item) => item.questionId === id),
        examples: sortByOrder(state.examples.filter((item) => item.questionId === id)),
        obstacles: sortByOrder(state.obstacles.filter((item) => item.questionId === id)),
        insights: sortByOrder(state.insights.filter((item) => item.questionId === id)),
        timelineEvents: state.timelineEvents.filter((item) => item.questionId === id),
        literature: state.literature.filter((item) => Array.isArray(item.questionIds) && item.questionIds.indexOf(id) >= 0),
        incomingBranchLinks: state.branchLinks.filter((item) => item.targetType === "question" && item.targetId === id),
        outgoingBranchLinks: state.branchLinks.filter((item) => item.sourceType === "question" && item.sourceId === id)
      })
    },
    getCurrentFocus() {
      return state.focusSessions.find((item) => item.id === state.currentFocusId) || null
    },
    getFocusState() {
      return clone(state.focusState || {})
    },
    getStrategyById(id) {
      return state.strategies.find((item) => item.id === id) || null
    },
    getActionById(id) {
      return state.actions.find((item) => item.id === id) || null
    },
    getTimelineEventById(id) {
      return state.timelineEvents.find((item) => item.id === id) || null
    },
    startFocus(type, entityId, title, description) {
      const focusId = dataAPI.createId("focus")
      dispatch({
        type: "START_FOCUS",
        payload: {
          id: focusId,
          type: type,
          entityId: entityId,
          title: title,
          description: description || "",
          status: "active",
          linkedItems: []
        }
      })
      dispatch({
        type: "ADD_PROGRESS_ENTRY",
        payload: {
          focusSessionId: focusId,
          action: "started",
          details: `开始专注：${title}`,
          entityType: type,
          entityId: entityId
        }
      })
      return focusId
    },
    pauseFocus() {
      const currentFocus = state.focusSessions.find((item) => item.id === state.currentFocusId)
      if (!currentFocus) return
      dispatch({
        type: "UPDATE_FOCUS_SESSION",
        payload: {
          focusSessionId: currentFocus.id,
          status: "paused"
        }
      })
      dispatch({
        type: "ADD_PROGRESS_ENTRY",
        payload: {
          focusSessionId: currentFocus.id,
          action: "paused"
        }
      })
    },
    resumeFocus(focusId) {
      if (!focusId) return
      dispatch({
        type: "UPDATE_FOCUS_SESSION",
        payload: {
          focusSessionId: focusId,
          status: "active"
        }
      })
      dispatch({
        type: "ADD_PROGRESS_ENTRY",
        payload: {
          focusSessionId: focusId,
          action: "resumed"
        }
      })
    },
    completeFocus(focusId, summary) {
      const targetId = focusId || state.currentFocusId
      if (!targetId) return
      dispatch({
        type: "UPDATE_FOCUS_SESSION",
        payload: {
          focusSessionId: targetId,
          status: "completed",
          endTime: dataAPI.nowISO(),
          summary: summary || ""
        }
      })
      dispatch({
        type: "ADD_PROGRESS_ENTRY",
        payload: {
          focusSessionId: targetId,
          action: "completed",
          details: summary || "完成专注会话"
        }
      })
    },
    linkItemToFocus(type, id, title, focusId) {
      const targetFocus = state.focusSessions.find((item) => item.id === (focusId || state.currentFocusId))
      if (!targetFocus || !type || !id) return
      const linkedItems = Array.isArray(targetFocus.linkedItems) ? targetFocus.linkedItems.slice() : []
      if (linkedItems.some(function(item) { return item.type === type && item.id === id })) return
      linkedItems.push({
        type: type,
        id: id,
        title: title || "",
        linkedAt: dataAPI.nowISO()
      })
      dispatch({
        type: "UPDATE_FOCUS_SESSION",
        payload: {
          focusSessionId: targetFocus.id,
          linkedItems: linkedItems
        }
      })
      dispatch({
        type: "ADD_PROGRESS_ENTRY",
        payload: {
          focusSessionId: targetFocus.id,
          action: "item_linked",
          details: `关联${title || id}`,
          entityType: type,
          entityId: id
        }
      })
    }
  }

  global.MNResearchStore = store
})(window)
