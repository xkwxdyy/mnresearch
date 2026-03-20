(function(global) {
  function nowISO() {
    return new Date().toISOString()
  }

  function toTimestamp(value) {
    const parsed = new Date(value).getTime()
    return isNaN(parsed) ? 0 : parsed
  }

  function createId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  }

  const STATUS_LABELS = {
    active: "进行中",
    paused: "暂停",
    resolved: "已解决",
    archived: "归档"
  }

  const JUDGMENT_STATUS_LABELS = {
    fuzzy: "模糊中",
    leaning_true: "倾向成立",
    leaning_false: "倾向不成立",
    partially_supported: "已局部支持",
    weakened: "已被削弱",
    converged: "已收敛"
  }

  const JUDGMENT_TYPE_LABELS = {
    candidate_proposition: "命题判断",
    structural: "结构判断",
    directional: "方向判断",
    tool_choice: "工具判断"
  }

  const STRATEGY_STATUS_LABELS = {
    exploring: "探索中",
    promising: "有希望",
    stalled: "停滞",
    blocked: "受阻",
    failed: "失败",
    succeeded: "成功"
  }

  const STRATEGY_METHOD_TAG_LABELS = {
    direct_advance: "直接推进",
    simplify_conditions: "简化条件",
    dimension_reduce: "降维",
    special_case: "特例化",
    decompose_structure: "拆解结构",
    reformulate: "问题改写",
    borrow_tool: "借用工具",
    find_counterexample: "构造反例",
    change_scope: "调整范围"
  }

  const STRATEGY_TYPE_LABELS = STRATEGY_METHOD_TAG_LABELS

  const STRATEGY_BRANCH_INTENT_LABELS = {
    direct_attack: "直接推进",
    spawn_subquestion: "拆出子问题",
    parallel_angle: "平行探索",
    tooling_track: "工具准备",
    counterexample_track: "反例检验",
    reformulation_track: "问题改写"
  }

  const STRATEGY_OUTCOME_MODE_LABELS = {
    stay_strategy: "保持策略",
    promoted_to_question: "已升格为子问题",
    linked_question: "已关联子问题"
  }

  const BRANCH_RELATION_LABELS = {
    spawn_question: "拆出子问题",
    link_existing_question: "关联已有问题",
    supports_parent_question: "支撑母问题",
    reframe_question: "问题改写",
    parallel_angle: "平行探索",
    tests_judgment: "检验判断"
  }

  const BRANCH_ROLE_LABELS = {
    subproblem: "子问题",
    prerequisite: "前置子问题",
    reformulation: "改写分支",
    counterexample_track: "反例分支",
    tooling_track: "工具分支",
    special_case: "特例分支",
    parallel_angle: "平行分支"
  }

  const BRANCH_CONTRIBUTION_LABELS = {
    answer_parent: "推进主问题",
    validate_judgment: "检验判断",
    remove_obstacle: "拆解障碍",
    produce_example: "提供样例",
    produce_tool: "准备工具",
    shrink_scope: "收缩范围",
    challenge_assumption: "挑战前提"
  }

  const BRANCH_STATUS_LABELS = {
    active: "推进中",
    partial: "部分回流",
    fed_back: "已回流",
    stale: "已陈旧",
    abandoned: "已放弃"
  }

  const QUESTION_FEEDBACK_STATUS_LABELS = {
    pending: "待回流",
    partial: "部分回流",
    fed_back: "已回流"
  }

  const EXAMPLE_TYPE_LABELS = {
    sample: "样例",
    special_case: "特殊情形",
    counterexample: "反例",
    boundary_case: "边界情形",
    calculation: "计算验证",
    near_counterexample: "几乎反例"
  }

  const INSIGHT_TYPE_LABELS = {
    observation: "观察",
    equivalence: "等价改写",
    special_result: "局部结果",
    counterexample: "反例发现",
    obstacle_note: "障碍线索",
    failed_path: "失败尝试",
    stable_result: "已验证结果"
  }

  const INSIGHT_STABILITY_LABELS = {
    tentative: "待验证",
    moderate: "初步成立",
    stable: "已经站住"
  }

  const CONFIDENCE_LEVEL_LABELS = {
    high: "比较确定",
    medium: "先这么看",
    low: "只是猜测"
  }

  const OBSTACLE_TYPE_LABELS = {
    structural: "结构性障碍",
    technical: "技术障碍",
    tool_mismatch: "工具不匹配",
    info_lacking: "信息不足",
    wrong_direction: "方向可能错误"
  }

  const ACTION_STATUS_LABELS = {
    queued: "排队中",
    doing: "推进中",
    waiting: "等待中",
    blocked: "卡住",
    done: "已完成"
  }

  const TIMELINE_NOTE_TYPE_LABELS = {
    progress: "进展",
    insight: "认识",
    obstacle: "卡点",
    next_step: "下一步"
  }

  const TIMELINE_SOURCE_LABELS = {
    manual: "手动输入",
    system: "系统记录"
  }

  const RESEARCH_COPY = {
    dashboardSubtitle: "组织问题，关联判断与策略",
    emptyWorkspaceTitle: "创建第一个研究问题",
    emptyWorkspaceBody: "从一个核心问题开始，逐步添加判断和策略"
  }

  const LABEL_ALIASES = []

  LABEL_ALIASES.push({
    labels: STRATEGY_METHOD_TAG_LABELS,
    aliases: {
      direct_advance: ["直接推进"],
      simplify_conditions: ["简化条件"],
      dimension_reduce: ["降维", "降维处理"],
      special_case: ["特殊情形", "具体情形", "压到特例", "压到具体情形", "特例化"],
      decompose_structure: ["拆结构", "结构拆解", "拆解结构"],
      reformulate: ["等价改写", "改写问题", "重新表述", "问题改写"],
      borrow_tool: ["借工具", "换工具", "借现成工具", "借用工具"],
      find_counterexample: ["找反例", "构造反例"],
      change_scope: ["改范围", "调整范围", "收缩范围"]
    }
  })

  LABEL_ALIASES.push({
    labels: STRATEGY_BRANCH_INTENT_LABELS,
    aliases: {
      direct_attack: ["直接攻击", "直接推进", "直推主问题"],
      spawn_subquestion: ["导出子问题", "拆出子问题", "拆成子问题", "拆出子题", "拆成子题"],
      parallel_angle: ["平行角度", "平行视角", "换个角度", "平行探索"],
      tooling_track: ["工具分支", "工具线", "准备工具", "工具准备"],
      counterexample_track: ["反例分支", "反例线", "检验反例", "反例检验"],
      reformulation_track: ["改写分支", "改写线", "改写问题", "问题改写"]
    }
  })

  LABEL_ALIASES.push({
    labels: BRANCH_ROLE_LABELS,
    aliases: {
      subproblem: ["子问题", "子题"],
      prerequisite: ["前置分支", "前置子问题", "前置子题"],
      reformulation: ["改写分支", "改写线"],
      counterexample_track: ["反例分支", "反例线"],
      tooling_track: ["工具分支", "工具线"],
      special_case: ["特殊情形", "特例线", "特例分支"],
      parallel_angle: ["平行角度", "平行视角", "换个角度", "平行分支"]
    }
  })

  LABEL_ALIASES.push({
    labels: BRANCH_CONTRIBUTION_LABELS,
    aliases: {
      answer_parent: ["回答母问题", "直接推进母问题"],
      validate_judgment: ["验证判断", "检验判断"],
      remove_obstacle: ["拆障碍", "拆掉障碍"],
      produce_example: ["产出样例"],
      produce_tool: ["产出工具", "补出工具"],
      shrink_scope: ["收缩范围", "收紧范围"],
      challenge_assumption: ["挑战前提"]
    }
  })

  function getAliasesForLabels(labels) {
    for (let index = 0; index < LABEL_ALIASES.length; index += 1) {
      if (LABEL_ALIASES[index].labels === labels) {
        return LABEL_ALIASES[index].aliases || {}
      }
    }
    return {}
  }

  function normalizeStringList(value) {
    const source = Array.isArray(value)
      ? value
      : typeof value === "string"
        ? (() => {
          const raw = String(value || "").trim()
          if (!raw) return []
          if (raw.charAt(0) === "[" && raw.charAt(raw.length - 1) === "]") {
            try {
              const parsed = JSON.parse(raw)
              return Array.isArray(parsed) ? parsed : [raw]
            } catch (error) {
              return [raw]
            }
          }
          return [raw]
        })()
        : []
    const seen = {}
    return source.reduce((result, item) => {
      const text = String(item == null ? "" : item).replace(/\s+/g, " ").trim()
      const key = normalizeComparableText(text)
      if (!text || !key || seen[key]) return result
      seen[key] = true
      result.push(text)
      return result
    }, [])
  }

  function serializeStringList(value) {
    return JSON.stringify(normalizeStringList(value))
  }

  function normalizeComparableText(value) {
    return String(value == null ? "" : value)
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
  }

  function resolveMappedValue(value, labels) {
    const raw = String(value == null ? "" : value).replace(/\s+/g, " ").trim()
    if (!raw) return ""
    if (!labels || typeof labels !== "object") return raw
    if (Object.prototype.hasOwnProperty.call(labels, raw)) return raw
    const target = normalizeComparableText(raw)
    const keys = Object.keys(labels)
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index]
      if (normalizeComparableText(key) === target) return key
      if (normalizeComparableText(labels[key]) === target) return key
    }
    const aliases = getAliasesForLabels(labels)
    const aliasKeys = Object.keys(aliases)
    for (let index = 0; index < aliasKeys.length; index += 1) {
      const key = aliasKeys[index]
      const candidates = Array.isArray(aliases[key]) ? aliases[key] : [aliases[key]]
      for (let aliasIndex = 0; aliasIndex < candidates.length; aliasIndex += 1) {
        if (normalizeComparableText(candidates[aliasIndex]) === target) return key
      }
    }
    return raw
  }

  function formatMappedValue(value, labels) {
    const raw = String(value == null ? "" : value).replace(/\s+/g, " ").trim()
    if (!raw) return ""
    const resolved = resolveMappedValue(raw, labels)
    return (labels && labels[resolved]) || raw
  }

  function matchesMappedValue(value, expectedKey, labels) {
    return resolveMappedValue(value, labels) === String(expectedKey || "")
  }

  function resolveMappedValues(values, labels) {
    const seen = {}
    return normalizeStringList(values).reduce((result, item) => {
      const resolved = resolveMappedValue(item, labels)
      const key = normalizeComparableText(resolved)
      if (!resolved || !key || seen[key]) return result
      seen[key] = true
      result.push(resolved)
      return result
    }, [])
  }

  function formatMappedValues(values, labels) {
    return resolveMappedValues(values, labels).map(function(item) {
      return formatMappedValue(item, labels) || item
    })
  }

  function getStrategyMethodTags(strategy) {
    const source = strategy && Array.isArray(strategy.methodTags) && strategy.methodTags.length
      ? strategy.methodTags
      : strategy && strategy.type
    return resolveMappedValues(source, STRATEGY_METHOD_TAG_LABELS)
  }

  function createEmptyState() {
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

  global.MNResearchData = {
    nowISO,
    toTimestamp,
    createId,
    createEmptyState,
    STATUS_LABELS,
    JUDGMENT_STATUS_LABELS,
    JUDGMENT_TYPE_LABELS,
    STRATEGY_STATUS_LABELS,
    STRATEGY_METHOD_TAG_LABELS,
    STRATEGY_TYPE_LABELS,
    STRATEGY_BRANCH_INTENT_LABELS,
    STRATEGY_OUTCOME_MODE_LABELS,
    EXAMPLE_TYPE_LABELS,
    INSIGHT_TYPE_LABELS,
    INSIGHT_STABILITY_LABELS,
    CONFIDENCE_LEVEL_LABELS,
    OBSTACLE_TYPE_LABELS,
    ACTION_STATUS_LABELS,
    TIMELINE_NOTE_TYPE_LABELS,
    TIMELINE_SOURCE_LABELS,
    BRANCH_RELATION_LABELS,
    BRANCH_ROLE_LABELS,
    BRANCH_CONTRIBUTION_LABELS,
    BRANCH_STATUS_LABELS,
    QUESTION_FEEDBACK_STATUS_LABELS,
    RESEARCH_COPY,
    normalizeStringList,
    serializeStringList,
    normalizeComparableText,
    resolveMappedValue,
    resolveMappedValues,
    formatMappedValue,
    formatMappedValues,
    matchesMappedValue,
    getStrategyMethodTags
  }
})(window)
