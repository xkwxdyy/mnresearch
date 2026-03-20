(function(global) {
  const dataAPI = global.MNResearchData
  const store = global.MNResearchStore
  const researchCore = global.MNResearch && global.MNResearch.core
  const markdown = global.MNResearchMarkdown || {}
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
  const ENTITY_TYPE_LABELS = {
    question: "问题",
    hypothesis: "判断",
    judgment: "判断",
    thought: "策略",
    strategy: "策略",
    finding: "认识",
    insight: "认识",
    action: "动作",
    example: "样例",
    obstacle: "障碍",
    formulation: "问题表述",
    "focus-session": "专注会话",
    literature: "文献",
    method: "方法"
  }
  const FORM_FIELD_META = {
    "edit-question-status": {
      mode: "select",
      label: "问题状态",
      hint: "这是系统推进状态，不是在给问题重新分类。"
    },
    "feedback-status": {
      mode: "select",
      label: "这条子问题的回流状态",
      hint: "回答的是这条分支的结果有没有回写给主问题推进。"
    },
    "feedback-strategy-status": {
      mode: "select",
      label: "是否同步改动源策略状态",
      hint: "只影响来源策略，不改子问题本身。"
    },
    "edit-formulation-abandoned": {
      mode: "select",
      label: "这版表述是否废弃",
      hint: "用来标记这版是否已经明确不用。"
    },
    "new-judgment-type": {
      mode: "history",
      historyKey: "judgment-type",
      label: "判断类型",
      hint: "这是你给判断起的分类词，之后输入前缀就能复用。",
      placeholder: "例如：命题判断、结构判断",
      labelMap: dataAPI.JUDGMENT_TYPE_LABELS,
      collectValues: function(appState) {
        return Array.isArray(appState.judgments) ? appState.judgments.map(function(item) { return item.type }) : []
      }
    },
    "new-judgment-status": {
      mode: "history",
      historyKey: "judgment-status",
      label: "判断状态",
      hint: "这是你现在怎么描述这条判断的进展，不再强塞固定术语。",
      placeholder: "例如：倾向成立、局部支持、仍不清楚",
      labelMap: dataAPI.JUDGMENT_STATUS_LABELS,
      collectValues: function(appState) {
        return Array.isArray(appState.judgments) ? appState.judgments.map(function(item) { return item.status }) : []
      }
    },
    "edit-judgment-type": {
      mode: "history",
      historyKey: "judgment-type",
      label: "判断类型",
      hint: "这是你给判断起的分类词，之后输入前缀就能复用。",
      placeholder: "例如：命题判断、结构判断",
      labelMap: dataAPI.JUDGMENT_TYPE_LABELS,
      collectValues: function(appState) {
        return Array.isArray(appState.judgments) ? appState.judgments.map(function(item) { return item.type }) : []
      }
    },
    "edit-judgment-status": {
      mode: "history",
      historyKey: "judgment-status",
      label: "判断状态",
      hint: "这是你现在怎么描述这条判断的进展，不再强塞固定术语。",
      placeholder: "例如：倾向成立、局部支持、仍不清楚",
      labelMap: dataAPI.JUDGMENT_STATUS_LABELS,
      collectValues: function(appState) {
        return Array.isArray(appState.judgments) ? appState.judgments.map(function(item) { return item.status }) : []
      }
    },
    "new-strategy-method-tags": {
      mode: "history-tags",
      historyKey: "strategy-type",
      label: "推进方式（可多选）",
      hint: "可同时写多个，用来描述这条策略是通过哪些研究动作推进的。",
      placeholder: "例如：简化条件、特例化、借用工具",
      labelMap: dataAPI.STRATEGY_METHOD_TAG_LABELS || dataAPI.STRATEGY_TYPE_LABELS,
      collectValues: function(appState) {
        return Array.isArray(appState.strategies) ? appState.strategies.map(function(item) {
          return dataAPI.getStrategyMethodTags ? dataAPI.getStrategyMethodTags(item) : item.type
        }) : []
      }
    },
    "new-strategy-branch-intent": {
      mode: "history",
      historyKey: "strategy-branch-intent",
      label: "策略角色",
      hint: "它回答这条策略在整体布局里扮演什么角色，不是写具体做法。",
      placeholder: "例如：直接推进、拆出子问题、平行探索",
      labelMap: dataAPI.STRATEGY_BRANCH_INTENT_LABELS,
      collectValues: function(appState) {
        return Array.isArray(appState.strategies) ? appState.strategies.map(function(item) { return item.branchIntent }) : []
      }
    },
    "new-strategy-status": {
      mode: "select",
      label: "策略状态",
      hint: "这是当前推进状态，不是推进方式。"
    },
    "edit-strategy-method-tags": {
      mode: "history-tags",
      historyKey: "strategy-type",
      label: "推进方式（可多选）",
      hint: "可同时写多个，用来描述这条策略是通过哪些研究动作推进的。",
      placeholder: "例如：简化条件、特例化、借用工具",
      labelMap: dataAPI.STRATEGY_METHOD_TAG_LABELS || dataAPI.STRATEGY_TYPE_LABELS,
      collectValues: function(appState) {
        return Array.isArray(appState.strategies) ? appState.strategies.map(function(item) {
          return dataAPI.getStrategyMethodTags ? dataAPI.getStrategyMethodTags(item) : item.type
        }) : []
      }
    },
    "edit-strategy-branch-intent": {
      mode: "history",
      historyKey: "strategy-branch-intent",
      label: "策略角色",
      hint: "它回答这条策略在整体布局里扮演什么角色，不是写具体做法。",
      placeholder: "例如：直接推进、拆出子问题、平行探索",
      labelMap: dataAPI.STRATEGY_BRANCH_INTENT_LABELS,
      collectValues: function(appState) {
        return Array.isArray(appState.strategies) ? appState.strategies.map(function(item) { return item.branchIntent }) : []
      }
    },
    "edit-strategy-status": {
      mode: "select",
      label: "策略状态",
      hint: "这是当前推进状态，不是推进方式。"
    },
    "branch-link-question-id": {
      mode: "select",
      label: "要关联的已有问题",
      hint: "这里选的是目标问题本身，不是在选关系类型。"
    },
    "branch-link-role": {
      mode: "history",
      historyKey: "branch-role",
      label: "分支角色",
      hint: "回答这条已有关联问题在结构上扮演什么角色。",
      placeholder: "例如：前置子问题、平行分支、工具分支",
      labelMap: dataAPI.BRANCH_ROLE_LABELS,
      collectValues: function(appState) {
        const branchRoles = Array.isArray(appState.branchLinks)
          ? appState.branchLinks.map(function(item) { return item.branchRole })
          : []
        const parentRelations = Array.isArray(appState.questions)
          ? appState.questions.map(function(item) {
            return item && item.branchMeta ? item.branchMeta.parentRelationType : ""
          })
          : []
        return branchRoles.concat(parentRelations)
      }
    },
    "branch-link-contribution": {
      mode: "history",
      historyKey: "branch-contribution",
      label: "主要贡献",
      hint: "回答这条分支完成后，最直接推动母问题的哪一块。",
      placeholder: "例如：推进主问题、拆解障碍、检验判断",
      labelMap: dataAPI.BRANCH_CONTRIBUTION_LABELS,
      collectValues: function(appState) {
        return Array.isArray(appState.branchLinks) ? appState.branchLinks.map(function(item) { return item.contributionType }) : []
      }
    },
    "new-example-type": {
      mode: "history",
      historyKey: "example-type",
      label: "样例类型",
      hint: "这是你给样例起的分类词，后面输入前缀可以复用。",
      placeholder: "例如：反例、边界情形、计算验证",
      labelMap: dataAPI.EXAMPLE_TYPE_LABELS,
      collectValues: function(appState) {
        return Array.isArray(appState.examples) ? appState.examples.map(function(item) { return item.type }) : []
      }
    },
    "new-example-key": {
      mode: "select",
      label: "是否视为关键样例",
      hint: "关键样例会更适合在后面回看。"
    },
    "edit-example-type": {
      mode: "history",
      historyKey: "example-type",
      label: "样例类型",
      hint: "这是你给样例起的分类词，后面输入前缀可以复用。",
      placeholder: "例如：反例、边界情形、计算验证",
      labelMap: dataAPI.EXAMPLE_TYPE_LABELS,
      collectValues: function(appState) {
        return Array.isArray(appState.examples) ? appState.examples.map(function(item) { return item.type }) : []
      }
    },
    "edit-example-key": {
      mode: "select",
      label: "是否视为关键样例",
      hint: "关键样例会更适合在后面回看。"
    },
    "new-obstacle-type": {
      mode: "history",
      historyKey: "obstacle-type",
      label: "障碍类型",
      hint: "这是你自己的障碍分类词，后面会按前缀召回。",
      placeholder: "例如：技术障碍、方向错误、信息不足",
      labelMap: dataAPI.OBSTACLE_TYPE_LABELS,
      collectValues: function(appState) {
        return Array.isArray(appState.obstacles) ? appState.obstacles.map(function(item) { return item.type }) : []
      }
    },
    "new-obstacle-core": {
      mode: "select",
      label: "是不是核心障碍",
      hint: "核心障碍会更影响工作台判断。"
    },
    "new-obstacle-has-clue": {
      mode: "select",
      label: "当前有没有线索",
      hint: "回答的是有没有下一步抓手。"
    },
    "edit-obstacle-type": {
      mode: "history",
      historyKey: "obstacle-type",
      label: "障碍类型",
      hint: "这是你自己的障碍分类词，后面会按前缀召回。",
      placeholder: "例如：技术障碍、方向错误、信息不足",
      labelMap: dataAPI.OBSTACLE_TYPE_LABELS,
      collectValues: function(appState) {
        return Array.isArray(appState.obstacles) ? appState.obstacles.map(function(item) { return item.type }) : []
      }
    },
    "edit-obstacle-core": {
      mode: "select",
      label: "是不是核心障碍",
      hint: "核心障碍会更影响工作台判断。"
    },
    "edit-obstacle-has-clue": {
      mode: "select",
      label: "当前有没有线索",
      hint: "回答的是有没有下一步抓手。"
    },
    "new-insight-type": {
      mode: "history",
      historyKey: "insight-type",
      label: "认识归类",
      hint: "只是为了后面筛选和回看，不用在分类上想太久。",
      placeholder: "例如：观察、等价改写、反例发现",
      labelMap: dataAPI.INSIGHT_TYPE_LABELS,
      collectValues: function(appState) {
        return Array.isArray(appState.insights) ? appState.insights.map(function(item) { return item.type }) : []
      }
    },
    "edit-insight-type": {
      mode: "history",
      historyKey: "insight-type",
      label: "认识归类",
      hint: "只是为了后面筛选和回看，不用在分类上想太久。",
      placeholder: "例如：观察、等价改写、反例发现",
      labelMap: dataAPI.INSIGHT_TYPE_LABELS,
      collectValues: function(appState) {
        return Array.isArray(appState.insights) ? appState.insights.map(function(item) { return item.type }) : []
      }
    }
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
  }

  function truncate(text, maxLength) {
    const value = String(text || "")
    if (value.length <= maxLength) return value
    return `${value.slice(0, maxLength - 1)}…`
  }

  function sortOrderedItems(items) {
    if (researchCore && typeof researchCore.sortByOrder === "function") {
      return researchCore.sortByOrder(items)
    }
    return Array.isArray(items) ? items.slice() : []
  }

  function renderReorderControls(entityType, itemId, index, total) {
    if (total <= 1) return ""
    return `
      <button
        class="ghost-button compact-button"
        data-action="move-question-item"
        data-item-type="${escapeHtml(entityType)}"
        data-item-id="${escapeHtml(itemId)}"
        data-direction="-1"
        ${index <= 0 ? "disabled" : ""}
      >上移</button>
      <button
        class="ghost-button compact-button"
        data-action="move-question-item"
        data-item-type="${escapeHtml(entityType)}"
        data-item-id="${escapeHtml(itemId)}"
        data-direction="1"
        ${index >= total - 1 ? "disabled" : ""}
      >下移</button>
    `
  }

  function getFieldMeta(name) {
    return FORM_FIELD_META[name] || null
  }

  function normalizeComparableText(value) {
    if (dataAPI && typeof dataAPI.normalizeComparableText === "function") {
      return dataAPI.normalizeComparableText(value)
    }
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim().toLowerCase()
  }

  function formatMappedValue(value, labelMap) {
    if (dataAPI && typeof dataAPI.formatMappedValue === "function") {
      return dataAPI.formatMappedValue(value, labelMap)
    }
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim()
  }

  function formatMappedValues(values, labelMap) {
    if (dataAPI && typeof dataAPI.formatMappedValues === "function") {
      return dataAPI.formatMappedValues(values, labelMap)
    }
    return Array.isArray(values) ? values.map(function(item) {
      return formatMappedValue(item, labelMap)
    }).filter(Boolean) : []
  }

  function normalizeStringList(value) {
    if (dataAPI && typeof dataAPI.normalizeStringList === "function") {
      return dataAPI.normalizeStringList(value)
    }
    return Array.isArray(value) ? value.filter(Boolean) : []
  }

  function matchesMappedValue(value, expectedKey, labelMap) {
    if (dataAPI && typeof dataAPI.matchesMappedValue === "function") {
      return dataAPI.matchesMappedValue(value, expectedKey, labelMap)
    }
    return String(value || "") === String(expectedKey || "")
  }

  function isSpawnSubquestionIntent(value) {
    return matchesMappedValue(value, "spawn_subquestion", dataAPI.STRATEGY_BRANCH_INTENT_LABELS)
  }

  function isCounterexampleType(value) {
    return matchesMappedValue(value, "counterexample", dataAPI.EXAMPLE_TYPE_LABELS)
  }

  function getStrategyMethodTags(strategy) {
    if (dataAPI && typeof dataAPI.getStrategyMethodTags === "function") {
      return dataAPI.getStrategyMethodTags(strategy)
    }
    return strategy && strategy.type ? [strategy.type] : []
  }

  function getStrategyMethodDisplayTags(strategy) {
    return formatMappedValues(getStrategyMethodTags(strategy), dataAPI.STRATEGY_METHOD_TAG_LABELS || dataAPI.STRATEGY_TYPE_LABELS)
  }

  function renderStrategyMethodTagChips(strategy) {
    const tags = getStrategyMethodDisplayTags(strategy)
    return tags.length
      ? tags.map(function(tag) {
        return `<span class="chip">${escapeHtml(tag)}</span>`
      }).join("")
      : `<span class="chip">未加标签</span>`
  }

  function summarizeStrategyMethodTags(strategy, fallback) {
    const tags = getStrategyMethodDisplayTags(strategy)
    return tags.length ? tags.join(" · ") : (fallback || "")
  }

  function renderFieldHeader(fieldMeta) {
    if (!fieldMeta || (!fieldMeta.label && !fieldMeta.hint)) return ""
    return `
      <div class="form-field-head">
        ${fieldMeta.label ? `<label class="form-field-label">${escapeHtml(fieldMeta.label)}</label>` : ""}
        ${fieldMeta.hint ? `<div class="form-field-hint">${escapeHtml(fieldMeta.hint)}</div>` : ""}
      </div>
    `
  }

  function getHistorySuggestions(appState, uiState, fieldMeta, currentValue) {
    const entriesByKey = {}

    function push(value, count, updatedAt) {
      normalizeStringList(value).forEach(function(singleValue) {
        const displayValue = formatMappedValue(singleValue, fieldMeta && fieldMeta.labelMap)
        const normalizedValue = String(displayValue || "").replace(/\s+/g, " ").trim()
        if (!normalizedValue) return
        const matchKey = normalizeComparableText(normalizedValue)
        if (!matchKey) return
        if (!entriesByKey[matchKey]) {
          entriesByKey[matchKey] = {
            value: normalizedValue,
            count: Math.max(1, parseInt(count, 10) || 1),
            updatedAt: updatedAt || ""
          }
          return
        }
        entriesByKey[matchKey].count += Math.max(1, parseInt(count, 10) || 1)
        if ((new Date(updatedAt || 0).getTime() || 0) >= (new Date(entriesByKey[matchKey].updatedAt || 0).getTime() || 0)) {
          entriesByKey[matchKey].value = normalizedValue
          entriesByKey[matchKey].updatedAt = updatedAt || entriesByKey[matchKey].updatedAt
        }
      })
    }

    const historyEntries = uiState && uiState.inputHistory && fieldMeta && fieldMeta.historyKey
      ? uiState.inputHistory[fieldMeta.historyKey]
      : []
    ;(Array.isArray(historyEntries) ? historyEntries : []).forEach(function(entry) {
      push(entry && entry.value, entry && entry.count, entry && entry.updatedAt)
    })

    if (fieldMeta && typeof fieldMeta.collectValues === "function") {
      ;(fieldMeta.collectValues(appState) || []).forEach(function(value) {
        push(value, 1, "")
      })
    }

    push(currentValue, 1, "")

    return Object.keys(entriesByKey)
      .map(function(key) { return entriesByKey[key] })
      .sort(function(left, right) {
        const rightTime = new Date(right.updatedAt || 0).getTime() || 0
        const leftTime = new Date(left.updatedAt || 0).getTime() || 0
        if (rightTime !== leftTime) return rightTime - leftTime
        if ((right.count || 0) !== (left.count || 0)) return (right.count || 0) - (left.count || 0)
        return String(left.value || "").localeCompare(String(right.value || ""), "zh-CN")
      })
      .slice(0, 12)
  }

  function renderHistoryInput(name, value, appState, uiState) {
    const fieldMeta = getFieldMeta(name) || {}
    const displayValue = formatMappedValue(value, fieldMeta.labelMap)
    const suggestions = getHistorySuggestions(appState, uiState, fieldMeta, displayValue)

    return `
      <div class="form-field">
        ${renderFieldHeader(fieldMeta)}
        <div class="history-input" data-history-input="${escapeHtml(name)}">
          <input
            class="history-input-control"
            data-input="${escapeHtml(name)}"
            data-history-key="${escapeHtml(fieldMeta.historyKey || "")}"
            value="${escapeHtml(displayValue)}"
            placeholder="${escapeHtml(fieldMeta.placeholder || "开始输入，系统会从你的历史词库里召回建议")}"
            autocomplete="off"
            spellcheck="false"
          >
          <div class="history-input-menu">
            <div class="history-input-empty">没有匹配项就继续写。你这次写进去的词，下次敲前缀就会出来。</div>
            ${suggestions.map(function(entry) {
              return `
                <button
                  class="history-input-option"
                  data-action="pick-history-suggestion"
                  data-suggestion-value="${escapeHtml(entry.value)}"
                  data-searchable="${escapeHtml(normalizeComparableText(entry.value))}"
                  type="button"
                >
                  <span class="history-input-option-value">${escapeHtml(entry.value)}</span>
                  <span class="history-input-option-meta">历史复用 ${escapeHtml(entry.count || 1)}</span>
                </button>
              `
            }).join("")}
          </div>
        </div>
      </div>
    `
  }

  function renderHistoryTagInput(name, value, appState, uiState) {
    const fieldMeta = getFieldMeta(name) || {}
    const selectedValues = formatMappedValues(value, fieldMeta.labelMap)
    const suggestions = getHistorySuggestions(appState, uiState, fieldMeta, selectedValues)

    return `
      <div class="form-field">
        ${renderFieldHeader(fieldMeta)}
        <div class="history-tag-input" data-history-tag-input="${escapeHtml(name)}">
          <input
            type="hidden"
            data-input="${escapeHtml(name)}"
            value="${escapeHtml(dataAPI && typeof dataAPI.serializeStringList === "function" ? dataAPI.serializeStringList(selectedValues) : "[]")}"
          >
          <div class="chip-row history-tag-chip-row" data-history-tag-list="${escapeHtml(name)}">
            ${selectedValues.map(function(tag) {
              return `
                <span class="chip history-tag-chip">
                  <span>${escapeHtml(tag)}</span>
                  <button
                    class="history-tag-remove"
                    data-action="remove-history-tag"
                    data-tag-input="${escapeHtml(name)}"
                    data-tag-value="${escapeHtml(tag)}"
                    type="button"
                    aria-label="${escapeHtml(`移除标签 ${tag}`)}"
                  >×</button>
                </span>
              `
            }).join("")}
          </div>
          <input
            class="history-tag-input-control"
            data-tag-draft-input="${escapeHtml(name)}"
            data-history-key="${escapeHtml(fieldMeta.historyKey || "")}"
            placeholder="${escapeHtml(fieldMeta.placeholder || "开始输入，按回车加入标签")}"
            autocomplete="off"
            spellcheck="false"
          >
          <div class="history-input-menu">
            <div class="history-input-empty">没有匹配项就继续写，回车就会把它收成标签。</div>
            ${suggestions.map(function(entry) {
              return `
                <button
                  class="history-input-option"
                  data-action="pick-history-suggestion"
                  data-suggestion-value="${escapeHtml(entry.value)}"
                  data-searchable="${escapeHtml(normalizeComparableText(entry.value))}"
                  type="button"
                >
                  <span class="history-input-option-value">${escapeHtml(entry.value)}</span>
                  <span class="history-input-option-meta">历史复用 ${escapeHtml(entry.count || 1)}</span>
                </button>
              `
            }).join("")}
          </div>
        </div>
      </div>
    `
  }

  function renderMarkdownInlineHtml(value) {
    if (typeof markdown.renderInlineHtml === "function") {
      return markdown.renderInlineHtml(value)
    }
    return escapeHtml(value)
  }

  function renderMarkdownBlockHtml(value) {
    if (typeof markdown.renderBlockHtml === "function") {
      return markdown.renderBlockHtml(value)
    }
    return escapeHtml(value).replace(/\n/g, "<br>")
  }

  function renderRichInlineTag(tagName, className, value) {
    return `<${tagName} class="${className} md-rich-text md-rich-inline">${renderMarkdownInlineHtml(value)}</${tagName}>`
  }

  function renderRichBlockTag(tagName, className, value) {
    return `<${tagName} class="${className} md-rich-text md-rich-block">${renderMarkdownBlockHtml(value)}</${tagName}>`
  }

  function renderRichInlineFragment(value, className) {
    const suffix = className ? ` ${className}` : ""
    return `<span class="md-rich-text md-rich-inline${suffix}">${renderMarkdownInlineHtml(value)}</span>`
  }

  function renderPrimaryBlock(tagName, className, value, placeholder) {
    if (value) return renderRichBlockTag(tagName, className, value)
    return `<${tagName} class="${className} is-placeholder">${escapeHtml(placeholder || "未填写")}</${tagName}>`
  }

  function renderRichSelectLabel(prefix, value, fallbackText) {
    const richValue = String(value || fallbackText || "").trim()
    return `
      <span class="html-select-option-label">
        ${prefix ? `<span class="html-select-rich-meta">${escapeHtml(prefix)}</span>` : ""}
        <span class="html-select-rich-value">${renderRichInlineFragment(richValue)}</span>
      </span>
    `
  }

  function renderRichInlineSummary(prefix, value, suffix, className) {
    const rootClassName = className ? ` ${className}` : ""
    const richValue = String(value || "").trim()
    return `
      <span class="rich-inline-summary${rootClassName}">
        ${prefix ? `<span>${escapeHtml(prefix)}</span>` : ""}
        ${richValue ? renderRichInlineFragment(richValue, "rich-inline-summary-value") : ""}
        ${suffix ? `<span>${escapeHtml(suffix)}</span>` : ""}
      </span>
    `
  }

  function renderBranchSourceSummary(sourceLabel, sourceTitle, trailingText, fallbackTitle) {
    const label = String(sourceLabel || "")
    const title = String(sourceTitle || fallbackTitle || "").trim()
    const tail = String(trailingText || "")
    return `
      <span>${escapeHtml(label)}</span>
      ${title ? renderRichInlineFragment(title, "branch-source-title") : ""}
      ${tail ? `<span>${escapeHtml(tail)}</span>` : ""}
    `
  }

  function normalizeSectionTab(value) {
    const tab = String(value || "timeline")
    return SECTION_TAB_MAP[tab] ? tab : "timeline"
  }

  function renderSectionJumpButton(options) {
    const next = options || {}
    const questionId = String(next.questionId || "")
    const text = String(next.text || "")
    const tab = normalizeSectionTab(next.tab || "timeline")
    const className = String(next.className || "chip")
    if (!questionId || !text) {
      return `<span class="${className}">${escapeHtml(text)}</span>`
    }
    return `
      <button
        class="${className}"
        data-action="jump-to-section"
        data-question-id="${escapeHtml(questionId)}"
        data-target-tab="${escapeHtml(tab)}"
        title="${escapeHtml(next.title || `打开${text}`)}"
      >${escapeHtml(text)}</button>
    `
  }

  function queueRenderedMathTargets(containers) {
    if (typeof global.queueMathTypesetSafely !== "function") return
    const targetSet = new Set()

    containers.forEach(function(container) {
      if (!container) return
      if (container.classList && container.classList.contains("md-rich-text")) {
        targetSet.add(container)
      }
      if (!container.querySelectorAll) return
      Array.prototype.forEach.call(container.querySelectorAll(".md-rich-text"), function(node) {
        targetSet.add(node)
      })
    })

    if (!targetSet.size) return
    global.queueMathTypesetSafely(Array.from(targetSet), "MN Research 公式渲染失败:")
  }

  function captureActiveInputSnapshot() {
    const active = document.activeElement
    if (!active || !active.getAttribute) return null
    const inputKey = active.getAttribute("data-input")
    if (!inputKey) return null
    const tagName = String(active.tagName || "").toLowerCase()
    if (tagName !== "input" && tagName !== "textarea") return null
    const snapshot = {
      key: inputKey,
      value: typeof active.value === "string" ? active.value : "",
      scrollTop: typeof active.scrollTop === "number" ? active.scrollTop : 0
    }
    if (typeof active.selectionStart === "number" && typeof active.selectionEnd === "number") {
      snapshot.selectionStart = active.selectionStart
      snapshot.selectionEnd = active.selectionEnd
      snapshot.selectionDirection = active.selectionDirection || "none"
    }
    return snapshot
  }

  function restoreActiveInputSnapshot(snapshot) {
    if (!snapshot || !snapshot.key) return
    const selectorKey = String(snapshot.key || "")
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
    const selector = `[data-input="${selectorKey}"]`
    const next = document.querySelector(selector)
    if (!next) return
    try {
      if (typeof next.value === "string" && next.value !== snapshot.value) {
        next.value = snapshot.value
      }
      if (typeof next.focus === "function") {
        next.focus()
      }
      if (typeof snapshot.scrollTop === "number" && typeof next.scrollTop === "number") {
        next.scrollTop = snapshot.scrollTop
      }
      if (typeof snapshot.selectionStart === "number" &&
          typeof snapshot.selectionEnd === "number" &&
          typeof next.setSelectionRange === "function") {
        next.setSelectionRange(
          snapshot.selectionStart,
          snapshot.selectionEnd,
          snapshot.selectionDirection || "none"
        )
      }
    } catch (_) {}
  }

  function consumePendingSectionJump(uiState, workspace) {
    if (!uiState || !uiState.pendingSectionJump || !workspace) return
    const pending = uiState.pendingSectionJump
    const targetTab = normalizeSectionTab(pending.section || "timeline")
    const selector = `[data-section="${targetTab}"]`
    const behavior = pending.behavior === "auto" ? "auto" : "smooth"
    uiState.pendingSectionJump = null

    global.requestAnimationFrame(function() {
      const targetNode = workspace.querySelector(selector)
      if (targetNode && typeof targetNode.scrollIntoView === "function") {
        targetNode.scrollIntoView({
          behavior: behavior,
          block: "start",
          inline: "nearest"
        })
        return
      }
      if (typeof workspace.scrollTo === "function") {
        workspace.scrollTo({ top: 0, behavior: behavior })
        return
      }
      workspace.scrollTop = 0
    })
  }

  function formatRelativeTime(isoString) {
    if (!isoString) return ""
    const target = new Date(isoString).getTime()
    const diff = Date.now() - target
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour
    if (diff < minute) return "刚刚"
    if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
    if (diff < day) return `${Math.floor(diff / hour)} 小时前`
    return `${Math.floor(diff / day)} 天前`
  }

  function formatElapsedTime(startTime, endTime, referenceTime) {
    if (!startTime) return ""
    const start = new Date(startTime).getTime()
    const end = new Date(endTime || referenceTime || startTime).getTime()
    const elapsedMinutes = Math.max(0, Math.floor((end - start) / 1000 / 60))
    if (elapsedMinutes < 60) return `${elapsedMinutes} 分钟`
    const hours = Math.floor(elapsedMinutes / 60)
    const minutes = elapsedMinutes % 60
    return minutes ? `${hours} 小时 ${minutes} 分钟` : `${hours} 小时`
  }

  function formatSaveStatus(uiState) {
    const saveState = uiState && uiState.saveState ? uiState.saveState : {}
    if (saveState.lastError) {
      return { text: `保存失败：${saveState.lastError}`, tone: "danger" }
    }
    if (saveState.pending) {
      return { text: "正在自动保存...", tone: "accent" }
    }
    if (saveState.lastSavedAt) {
      return { text: `已保存 ${formatRelativeTime(saveState.lastSavedAt)}`, tone: "success" }
    }
    return { text: "自动保存运行中", tone: "muted" }
  }

  function getSaveStatusButtonClassName(saveStatus) {
    return `sidebar-icon-button ${saveStatus && saveStatus.tone ? `is-${saveStatus.tone}` : ""}`.trim()
  }

  function updateSaveStatus(uiState) {
    const button = document.querySelector("[data-save-status-button]")
    if (!button) return
    const saveStatus = formatSaveStatus(uiState)
    const label = saveStatus.text || "立即保存"
    button.className = getSaveStatusButtonClassName(saveStatus)
    button.setAttribute("title", label)
    button.setAttribute("aria-label", `立即保存，${label}`)
  }

  function formatClockTime(isoString) {
    if (!isoString) return ""
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ""
    const hours = `${date.getHours()}`.padStart(2, "0")
    const minutes = `${date.getMinutes()}`.padStart(2, "0")
    return `${hours}:${minutes}`
  }

  function formatTimelineDate(isoString) {
    if (!isoString) return ""
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ""
    const year = `${date.getFullYear()}`
    const month = `${date.getMonth() + 1}`.padStart(2, "0")
    const day = `${date.getDate()}`.padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  function formatTimelineStamp(isoString) {
    const dateText = formatTimelineDate(isoString)
    const timeText = formatClockTime(isoString)
    if (dateText && timeText) return `${dateText} ${timeText}`
    return dateText || timeText
  }

  function toTimestamp(value) {
    if (dataAPI && typeof dataAPI.toTimestamp === "function") {
      return dataAPI.toTimestamp(value)
    }
    const parsed = new Date(value).getTime()
    return isNaN(parsed) ? 0 : parsed
  }

  function compareTimeDesc(leftValue, rightValue) {
    const leftTime = toTimestamp(leftValue)
    const rightTime = toTimestamp(rightValue)
    if (rightTime !== leftTime) return rightTime - leftTime
    return String(rightValue || "").localeCompare(String(leftValue || ""), "zh-CN")
  }

  function splitTimelineContent(value) {
    const normalized = String(value || "").replace(/\r\n?/g, "\n").trim()
    if (!normalized) return { summary: "", details: "" }
    const lines = normalized.split("\n")
    let index = 0
    while (index < lines.length && !String(lines[index] || "").trim()) {
      index += 1
    }
    if (index >= lines.length) return { summary: "", details: "" }
    const summary = String(lines[index] || "").trim()
    const details = lines.slice(index + 1).join("\n").replace(/^\n+/, "").trim()
    return {
      summary: summary || normalized,
      details
    }
  }

  function getFocusState(appState) {
    const focusState = appState && appState.focusState && typeof appState.focusState === "object"
      ? appState.focusState
      : {}
    return {
      questionId: typeof focusState.questionId === "string" ? focusState.questionId : null,
      entityType: typeof focusState.entityType === "string" ? focusState.entityType : null,
      entityId: typeof focusState.entityId === "string" ? focusState.entityId : null
    }
  }

  function getTimelineEventsForQuestion(appState, questionId, includeChildren) {
    if (!questionId) return []
    const questionIds = includeChildren && researchCore && typeof researchCore.collectQuestionFamilyIds === "function"
      ? researchCore.collectQuestionFamilyIds(appState, questionId)
      : [questionId]
    const questionMap = questionIds.reduce(function(result, id) {
      result[id] = true
      return result
    }, {})
    return (Array.isArray(appState.timelineEvents) ? appState.timelineEvents : [])
      .filter(function(item) {
        return !!questionMap[item.questionId]
      })
      .slice()
      .sort(function(left, right) {
        return compareTimeDesc(left.createdAt, right.createdAt)
      })
  }

  function getTimelineEventSummary(event) {
    if (!event) return ""
    const contentParts = splitTimelineContent(event.content)
    if (contentParts.summary) return contentParts.summary
    if (event.previousValue || event.nextValue) {
      return `${event.label || "系统记录"}：${event.previousValue || "空"} -> ${event.nextValue || "空"}`
    }
    return event.label || "未命名事件"
  }

  function getTimelineEventDetails(event) {
    if (!event) return ""
    return splitTimelineContent(event.content).details
  }

  function getTimelineMetaLine(event, appState) {
    if (!event) return []
    const parts = []
    parts.push(`<span>${escapeHtml(dataAPI.TIMELINE_SOURCE_LABELS[event.source] || event.source || "系统记录")}</span>`)
    if (event.relatedEntityType && event.relatedEntityId) {
      let relatedTitle = ""
      if (event.relatedEntityType === "question") {
        const relatedQuestion = store.getQuestionById(event.relatedEntityId)
        relatedTitle = relatedQuestion ? relatedQuestion.title : event.relatedEntityId
      } else if (event.relatedEntityType === "judgment") {
        const judgment = appState.judgments.find(function(item) { return item.id === event.relatedEntityId })
        relatedTitle = judgment ? judgment.content : event.relatedEntityId
      } else if (event.relatedEntityType === "strategy") {
        const strategy = appState.strategies.find(function(item) { return item.id === event.relatedEntityId })
        relatedTitle = strategy ? strategy.name : event.relatedEntityId
      } else if (event.relatedEntityType === "action") {
        const actionItem = appState.actions.find(function(item) { return item.id === event.relatedEntityId })
        relatedTitle = actionItem ? actionItem.title : event.relatedEntityId
      } else if (event.relatedEntityType === "obstacle") {
        const obstacle = appState.obstacles.find(function(item) { return item.id === event.relatedEntityId })
        relatedTitle = obstacle ? obstacle.content : event.relatedEntityId
      } else if (event.relatedEntityType === "example") {
        const example = appState.examples.find(function(item) { return item.id === event.relatedEntityId })
        relatedTitle = example ? example.content : event.relatedEntityId
      } else if (event.relatedEntityType === "insight") {
        const insight = appState.insights.find(function(item) { return item.id === event.relatedEntityId })
        relatedTitle = insight ? insight.content : event.relatedEntityId
      } else if (event.relatedEntityType === "literature") {
        const literature = appState.literature.find(function(item) { return item.id === event.relatedEntityId })
        relatedTitle = literature ? literature.title : event.relatedEntityId
      }
      parts.push(
        relatedTitle
          ? renderRichInlineSummary(
            `关联${ENTITY_TYPE_LABELS[event.relatedEntityType] || event.relatedEntityType} · `,
            relatedTitle,
            ""
          )
          : `<span>${escapeHtml(`关联${ENTITY_TYPE_LABELS[event.relatedEntityType] || event.relatedEntityType}`)}</span>`
      )
    }
    if (event.promotedEntityType && event.promotedEntityId) {
      parts.push(`<span>${escapeHtml(`已升格为${ENTITY_TYPE_LABELS[event.promotedEntityType] || event.promotedEntityType}`)}</span>`)
    }
    if (event.questionId) {
      const question = store.getQuestionById(event.questionId)
      if (question) {
        parts.push(renderRichInlineSummary("归属 · ", question.title, ""))
      }
    }
    return parts
  }

  function renderTimelineMetaLineHtml(event, appState) {
    return getTimelineMetaLine(event, appState).join('<span> · </span>')
  }

  function getFocusEntityOptions(appState, questionId) {
    if (!questionId) return []
    const options = [{
      value: "",
      label: "不绑定具体对象",
      labelHtml: `<span class="html-select-rich-value">不绑定具体对象</span>`
    }]
    ;(Array.isArray(appState.strategies) ? appState.strategies : [])
      .filter(function(item) { return item.questionId === questionId })
      .forEach(function(item) {
        options.push({
          value: `strategy::${item.id}`,
          label: `策略 · ${truncate(item.name || "", 24)}`,
          labelHtml: renderRichSelectLabel("策略", item.name || "", "未命名策略")
        })
      })
    ;(Array.isArray(appState.actions) ? appState.actions : [])
      .filter(function(item) { return item.questionId === questionId })
      .forEach(function(item) {
        options.push({
          value: `action::${item.id}`,
          label: `动作 · ${truncate(item.title || "", 24)}`,
          labelHtml: renderRichSelectLabel("动作", item.title || "", "未命名动作")
        })
      })
    return options
  }

  function renderIcon(name) {
    if (name === "settings") {
      return `
        <span class="icon-glyph" aria-hidden="true">
          <svg viewBox="0 0 20 20" focusable="false">
            <circle cx="10" cy="10" r="2.8"></circle>
            <path d="M10 2.4v2.1M10 15.5v2.1M17.6 10h-2.1M4.5 10H2.4M15.4 4.6l-1.5 1.5M6.1 13.9l-1.5 1.5M15.4 15.4l-1.5-1.5M6.1 6.1 4.6 4.6"></path>
          </svg>
        </span>
      `
    }
    if (name === "save") {
      return `
        <span class="icon-glyph" aria-hidden="true">
          <svg viewBox="0 0 20 20" focusable="false">
            <path d="M4 3.5h9l3 3v10H4z"></path>
            <path d="M7 3.5v4h6v-4"></path>
            <path d="M7 13.2h6"></path>
          </svg>
        </span>
      `
    }
    if (name === "focus") {
      return `
        <span class="icon-glyph" aria-hidden="true">
          <svg viewBox="0 0 20 20" focusable="false">
            <circle cx="10" cy="10" r="2.7"></circle>
            <path d="M10 1.8v2.4M10 15.8v2.4M18.2 10h-2.4M4.2 10H1.8"></path>
          </svg>
        </span>
      `
    }
    if (name === "chevron-up") {
      return `
        <span class="icon-glyph" aria-hidden="true">
          <svg viewBox="0 0 20 20" focusable="false">
            <path d="M5.2 12.6 10 7.8l4.8 4.8"></path>
          </svg>
        </span>
      `
    }
    if (name === "chevron-down") {
      return `
        <span class="icon-glyph" aria-hidden="true">
          <svg viewBox="0 0 20 20" focusable="false">
            <path d="M5.2 7.4 10 12.2l4.8-4.8"></path>
          </svg>
        </span>
      `
    }
    if (name === "chevron-left") {
      return `
        <span class="icon-glyph" aria-hidden="true">
          <svg viewBox="0 0 20 20" focusable="false">
            <path d="M12.6 5.2 7.8 10l4.8 4.8"></path>
          </svg>
        </span>
      `
    }
    if (name === "chevron-right") {
      return `
        <span class="icon-glyph" aria-hidden="true">
          <svg viewBox="0 0 20 20" focusable="false">
            <path d="M7.4 5.2 12.2 10l-4.8 4.8"></path>
          </svg>
        </span>
      `
    }
    if (name === "close") {
      return `
        <span class="icon-glyph" aria-hidden="true">
          <svg viewBox="0 0 20 20" focusable="false">
            <path d="M5 5l10 10M15 5 5 15"></path>
          </svg>
        </span>
      `
    }
    return ""
  }

  function renderSidebar(appState, uiState) {
    const meta = uiState.meta || {}
    if (uiState && uiState.sidebarCollapsed) {
      return `
        <div class="sidebar-collapsed">
          <button class="sidebar-icon-button" data-action="toggle-sidebar" aria-label="展开侧栏" title="展开侧栏">${renderIcon("chevron-right")}</button>
          <button class="sidebar-icon-button ${uiState && uiState.workspaceMode === "focus" ? "is-active" : ""}" data-action="show-focus-view" aria-label="Focus" title="Focus">${renderIcon("focus")}</button>
          <button class="sidebar-icon-button" data-action="add-root-question" aria-label="新问题" title="新问题">+</button>
        </div>
      `
    }
    const roots = store.getQuestionTree()
    const searchQuery = String(uiState.sidebarQuery || "").trim().toLowerCase()
    const saveStatus = formatSaveStatus(uiState)
    const totalQuestions = appState.questions.length
    const activeQuestions = appState.questions.filter(function(item) {
      return item.status === "active"
    }).length

    function filterNode(node) {
      const matchesSelf = !searchQuery || node.title.toLowerCase().indexOf(searchQuery) >= 0
      const children = node.children.map(filterNode).filter(Boolean)
      if (!matchesSelf && !children.length) return null
      return Object.assign({}, node, { children })
    }

    const visibleRoots = roots.map(filterNode).filter(Boolean)

    function renderNode(node, depth) {
      const judgmentsCount = node.judgments.length
      const strategiesCount = node.strategies.length
      const examplesCount = node.examples.length
      const insightsCount = node.insights.length
      const branch = getQuestionBranchSummary(appState, node.id)
      const hasBranchContext = branch && (branch.isChild || branch.primaryLink)
      const branchSourceLabel = hasBranchContext && !branch.isOrphan
        ? `${branch.sourceType === "strategy" ? "来自策略" : "来自问题"}：`
        : ""
      const branchFeedback = hasBranchContext
        ? (dataAPI.QUESTION_FEEDBACK_STATUS_LABELS[branch.feedbackStatus] || branch.feedbackStatus || "待回流")
        : ""
      const isActive = appState.activeQuestionId === node.id
      const padding = 12 + depth * 14
      return `
        <article class="tree-node ${isActive ? "is-active" : ""}" style="margin-left:${depth ? 8 : 0}px;">
          <button class="tree-node-row" data-action="select-question" data-question-id="${escapeHtml(node.id)}" style="padding-left:${padding}px;">
            <span class="status-dot ${escapeHtml(node.status)}"></span>
            <span class="tree-node-title md-rich-text md-rich-inline">${renderMarkdownInlineHtml(node.title)}</span>
          </button>
          <div class="tree-node-meta">
            ${judgmentsCount ? renderSectionJumpButton({ questionId: node.id, tab: "judgments", text: `判断 ${judgmentsCount}`, className: "tree-badge tree-badge-link" }) : ""}
            ${strategiesCount ? renderSectionJumpButton({ questionId: node.id, tab: "strategies", text: `策略 ${strategiesCount}`, className: "tree-badge tree-badge-link" }) : ""}
            ${examplesCount ? renderSectionJumpButton({ questionId: node.id, tab: "examples", text: `样例 ${examplesCount}`, className: "tree-badge tree-badge-link" }) : ""}
            ${insightsCount ? renderSectionJumpButton({ questionId: node.id, tab: "insights", text: `认识 ${insightsCount}`, className: "tree-badge tree-badge-link" }) : ""}
            ${hasBranchContext ? `<span class="tree-badge ${branch.isOrphan ? "is-danger" : ""}">${escapeHtml(branch.isOrphan ? "待补关系" : (dataAPI.BRANCH_ROLE_LABELS[branch.branchRole] || "已接线"))}</span>` : ""}
            <button class="tree-badge tree-badge-button" data-action="add-child-question" data-parent-id="${escapeHtml(node.id)}">+ 子问题</button>
          </div>
          ${hasBranchContext ? `
            <div class="tree-node-branch-meta">
              ${branchSourceLabel
                ? renderBranchSourceSummary(branchSourceLabel, branch.sourceTitle, "", "未命名来源")
                : `<span>待补来源关系</span>`}
              ${branchFeedback ? `<span>${escapeHtml(branchFeedback)}</span>` : ""}
            </div>
          ` : ""}
          ${node.children.length ? `<div class="tree-children">${node.children.map((child) => renderNode(child, depth + 1)).join("")}</div>` : ""}
        </article>
      `
    }

    return `
      <div class="sidebar-header">
        <div class="sidebar-title-row">
          <div class="sidebar-brand">
            <h1 class="sidebar-title">MN Research</h1>
            <div class="sidebar-meta-line">研究问题树 · v${escapeHtml(meta.version || "unknown")}</div>
          </div>
          <div class="sidebar-header-actions">
            <button class="sidebar-icon-button" data-action="toggle-sidebar" aria-label="折叠侧栏" title="折叠侧栏">${renderIcon("chevron-left")}</button>
            <button
              class="sidebar-icon-button ${uiState && uiState.settingsOpen ? "is-active" : ""}"
              data-action="toggle-settings"
              aria-label="${uiState && uiState.settingsOpen ? "关闭全局设置" : "打开全局设置"}"
              title="${uiState && uiState.settingsOpen ? "关闭全局设置" : "打开全局设置"}"
            >${renderIcon("settings")}</button>
            <button
              class="${getSaveStatusButtonClassName(saveStatus)}"
              data-action="request-save"
              data-save-status-button="true"
              aria-label="${escapeHtml(`立即保存，${saveStatus.text || "立即保存"}`)}"
              title="${escapeHtml(saveStatus.text || "立即保存")}"
            >${renderIcon("save")}</button>
          </div>
        </div>
      </div>
      <div class="sidebar-tools">
        <div class="sidebar-action-row">
          <button class="ghost-button sidebar-nav-button ${uiState && uiState.workspaceMode === "focus" ? "is-active" : ""}" data-action="show-focus-view">Focus</button>
          <button class="ghost-button sidebar-nav-button" data-action="add-root-question">新问题</button>
        </div>
        <input class="sidebar-search" type="search" placeholder="搜索问题..." value="${escapeHtml(uiState.sidebarQuery || "")}" data-input="sidebar-query">
      </div>
      <div class="question-tree">
        <div class="tree-group-label">问题树</div>
        ${visibleRoots.length ? visibleRoots.map((node) => renderNode(node, 0)).join("") : `
          <div class="empty-state">
            <h3 class="empty-state-title">还没有研究问题</h3>
          </div>
        `}
      </div>
      <div class="sidebar-footer">
        <span>${escapeHtml(totalQuestions)} 个问题</span>
        <span>${escapeHtml(activeQuestions)} 进行中</span>
      </div>
    `
  }

  function renderSettingsDrawer(uiState) {
    if (!uiState || !uiState.settingsOpen) {
      return ""
    }
    return `
      <section class="settings-drawer-shell">
        <button class="settings-drawer-backdrop" data-action="toggle-settings" aria-label="关闭全局设置"></button>
        <div class="panel-block settings-drawer-card">
          <div class="global-settings-head">
            <div>
              <div class="section-kicker">全局设置</div>
              <h3 class="card-title">数据安全与导入导出</h3>
            </div>
            <button class="drawer-close-button" data-action="toggle-settings" aria-label="关闭全局设置" title="关闭全局设置">${renderIcon("close")}</button>
          </div>
          <div class="global-settings-grid">
            <button class="secondary-button" data-action="request-import">导入 JSON</button>
            <button class="secondary-button" data-action="request-export">导出 JSON</button>
            <button class="secondary-button" data-action="request-backup">导出备份</button>
          </div>
          <div class="global-settings-footnote">
            内容变化后会延迟约 420ms 写入主 JSON，同时更新备份 JSON。左上角磁盘按钮会跳过等待时间，立即落盘。
          </div>
        </div>
      </section>
    `
  }

  function renderMetricCard(title, value, footnote) {
    return `
      <article class="panel-block metric-card">
        <div class="metric-title">${escapeHtml(title)}</div>
        <div class="metric-value">${escapeHtml(value)}</div>
        <div class="metric-footnote">${escapeHtml(footnote)}</div>
      </article>
    `
  }

  function getQuestionLifecycle(appState, questionId) {
    if (researchCore && typeof researchCore.computeQuestionLifecycle === "function") {
      return researchCore.computeQuestionLifecycle(appState, questionId)
    }
    return null
  }

  function getQuestionBranchSummary(appState, questionId) {
    if (researchCore && typeof researchCore.getQuestionBranchSummary === "function") {
      return researchCore.getQuestionBranchSummary(appState, questionId)
    }
    return null
  }

  function getOutgoingStrategyBranchLinks(appState, strategyId) {
    if (researchCore && typeof researchCore.getOutgoingBranchLinksForStrategy === "function") {
      return researchCore.getOutgoingBranchLinksForStrategy(appState, strategyId)
    }
    return []
  }

  function getBranchStatusChipClass(status) {
    if (status === "fed_back") return "is-success"
    if (status === "stale" || status === "abandoned") return "is-danger"
    return "is-accent"
  }

  function renderBranchLinkedQuestionCard(link, appState) {
    const targetQuestion = store.getQuestionById(link.targetId)
    const branch = targetQuestion ? getQuestionBranchSummary(appState, targetQuestion.id) : null
    if (!targetQuestion || !branch) return ""

    const roleLabel = dataAPI.BRANCH_ROLE_LABELS[link.branchRole] || dataAPI.BRANCH_RELATION_LABELS[link.relationType] || "分支"
    const contributionLabel = dataAPI.BRANCH_CONTRIBUTION_LABELS[branch.contributionType] || branch.contributionType || ""
    const feedbackLabel = dataAPI.QUESTION_FEEDBACK_STATUS_LABELS[branch.feedbackStatus] || branch.feedbackStatus || "待回流"

    return `
      <article class="list-item compact-readonly-card">
        <div class="list-title-row">
          ${renderRichInlineTag("h4", "list-item-title", targetQuestion.title)}
          <span class="chip ${getBranchStatusChipClass(branch.feedbackStatus)}">${escapeHtml(feedbackLabel)}</span>
        </div>
        ${renderPrimaryBlock("div", "list-item-body", branch.feedbackSummary, "还没有回流说明")}
        <div class="chip-row">
          <span class="chip">${escapeHtml(roleLabel)}</span>
          ${contributionLabel ? `<span class="chip">${escapeHtml(contributionLabel)}</span>` : ""}
          <button
            class="ghost-button compact-button"
            data-action="select-question"
            data-question-id="${escapeHtml(targetQuestion.id)}"
          >打开子问题</button>
        </div>
      </article>
    `
  }

  function renderQuestionBranchBanner(question, appState) {
    const branch = getQuestionBranchSummary(appState, question.id)
    const hasBranchContext = branch && (branch.isChild || branch.primaryLink)
    if (!hasBranchContext) return ""

    const branchRoleLabel = dataAPI.BRANCH_ROLE_LABELS[branch.branchRole] || branch.branchRole || "未定义角色"
    const feedbackLabel = dataAPI.QUESTION_FEEDBACK_STATUS_LABELS[branch.feedbackStatus] || branch.feedbackStatus || "待回流"
    const contributionLabel = dataAPI.BRANCH_CONTRIBUTION_LABELS[branch.contributionType] || branch.contributionType || ""
    const sourcePrefix = branch.sourceType === "strategy"
      ? "来自策略"
      : branch.sourceType === "question"
        ? "来自问题"
        : "来源未定义"
    const branchSourceSummary = renderBranchSourceSummary(
      `${sourcePrefix}：`,
      branch.sourceTitle,
      contributionLabel ? ` · 支撑：${contributionLabel}` : "",
      "未命名来源"
    )
    return `
      <section class="panel-block content-card question-branch-card ${branch.isOrphan ? "is-danger" : ""}">
        <div class="section-kicker">分支关系</div>
        <div class="list-title-row">
          <h3 class="card-title">${branch.isOrphan ? "待补关系" : branchRoleLabel}</h3>
          <span class="chip ${getBranchStatusChipClass(branch.feedbackStatus)}">${escapeHtml(feedbackLabel)}</span>
        </div>
        <div class="list-item-body">
          ${branch.isOrphan
            ? "只有树上的父子关系，还没补上研究分支关系。"
            : branchSourceSummary}
        </div>
        <div class="chip-row">
          ${branch.branchRole ? `<span class="chip">${escapeHtml(branchRoleLabel)}</span>` : ""}
          ${contributionLabel ? `<span class="chip">${escapeHtml(contributionLabel)}</span>` : ""}
          ${branch.isOrphan || !branch.primaryLink ? "" : `
            <button
              class="ghost-button compact-button"
              data-action="open-edit-modal"
              data-edit-type="question-feedback"
              data-edit-id="${escapeHtml(question.id)}"
              data-edit-parent-id="${escapeHtml(question.parentId || "")}"
            >记录回流</button>
          `}
          ${branch.isOrphan || !branch.primaryLink ? "" : `
            <button
              class="ghost-button compact-button"
              data-action="select-question"
              data-question-id="${escapeHtml(question.id)}"
            >打开子问题</button>
          `}
        </div>
      </section>
    `
  }

  function renderBranchMapSection(question, appState) {
    const strategies = sortOrderedItems(appState.strategies.filter(function(item) { return item.questionId === question.id }))
    const childQuestions = appState.questions.filter(function(item) { return item.parentId === question.id })
    const linkedQuestionIdMap = {}
    const rows = strategies.map(function(strategy) {
      const links = getOutgoingStrategyBranchLinks(appState, strategy.id).filter(function(link) {
        return link.targetType === "question"
      })
      links.forEach(function(link) {
        linkedQuestionIdMap[link.targetId] = true
      })
      return {
        strategy: strategy,
        links: links
      }
    }).filter(function(row) {
      return row.links.length || isSpawnSubquestionIntent(row.strategy.branchIntent) || row.strategy.outcomeMode !== "stay_strategy"
    })
    const orphanChildren = childQuestions.filter(function(item) {
      const branch = getQuestionBranchSummary(appState, item.id)
      return branch && branch.isOrphan
    })

    if (!rows.length && !orphanChildren.length) return ""

    return `
      <section class="panel-block content-card" data-section="branch-map">
        <div class="section-kicker">分支地图</div>
        <div class="tab-section-head">
          <div>
            <h3 class="card-title">策略与子问题</h3>
          </div>
          <span class="chip ${orphanChildren.length ? "is-danger" : "is-accent"}">${escapeHtml(`${rows.length} 条策略分支`)}</span>
        </div>
        <div class="list-stack">
          ${rows.map(function(row) {
            return `
              <article class="list-item ${row.links.length ? "" : "is-danger"}">
                <div class="list-title-row">
                  ${renderRichInlineTag("h4", "list-item-title", row.strategy.name)}
                  <span class="chip">${escapeHtml(dataAPI.STRATEGY_STATUS_LABELS[row.strategy.status] || row.strategy.status)}</span>
                </div>
                <div class="chip-row">
                  ${renderStrategyMethodTagChips(row.strategy)}
                  <span class="chip">${escapeHtml(formatMappedValue(row.strategy.branchIntent, dataAPI.STRATEGY_BRANCH_INTENT_LABELS) || "角色未定")}</span>
                  ${row.strategy.outcomeMode !== "stay_strategy" ? `<span class="chip is-accent">${escapeHtml(dataAPI.STRATEGY_OUTCOME_MODE_LABELS[row.strategy.outcomeMode] || row.strategy.outcomeMode)}</span>` : ""}
                </div>
                ${row.links.length ? `
                  <div class="list-stack branch-linked-question-list">
                    ${row.links.map(function(link) {
                      return renderBranchLinkedQuestionCard(link, appState)
                    }).join("")}
                  </div>
                ` : `
                  <div class="chip-row"><span class="chip">未拆出子问题</span></div>
                `}
              </article>
            `
          }).join("")}
          ${orphanChildren.length ? `
            <article class="list-item is-danger">
              <div class="list-title-row">
                <h4 class="list-item-title">悬空子问题</h4>
                <span class="chip is-danger">${escapeHtml(`${orphanChildren.length} 个待补关系`)}</span>
              </div>
              <div class="chip-row">
                ${orphanChildren.map(function(child) {
                  return `
                    <button
                      class="chip count-chip-button"
                      data-action="select-question"
                      data-question-id="${escapeHtml(child.id)}"
                    >${renderRichInlineFragment(child.title || "")}</button>
                  `
                }).join("")}
              </div>
            </article>
          ` : ""}
        </div>
      </section>
    `
  }

  function getQuestionDeleteImpact(appState, questionId) {
    if (researchCore && typeof researchCore.computeQuestionDeleteImpact === "function") {
      return researchCore.computeQuestionDeleteImpact(appState, questionId)
    }
    return null
  }

  function getToneChipClass(tone) {
    if (tone === "danger") return "is-danger"
    if (tone === "success") return "is-success"
    return "is-accent"
  }

  function getDeleteTargetPreview(appState, uiState) {
    const type = uiState && (uiState.deleteTargetType || (uiState.questionDeleteId ? "question" : null))
    const id = uiState && (uiState.deleteTargetId || uiState.questionDeleteId)
    const parentId = uiState && uiState.deleteTargetParentId
    const judgments = Array.isArray(appState.judgments) ? appState.judgments : []
    const examples = Array.isArray(appState.examples) ? appState.examples : []
    const strategies = Array.isArray(appState.strategies) ? appState.strategies : []
    const actions = Array.isArray(appState.actions) ? appState.actions : []
    const obstacles = Array.isArray(appState.obstacles) ? appState.obstacles : []
    const insights = Array.isArray(appState.insights) ? appState.insights : []

    if (!type || !id) return null

    if (type === "question") {
      const question = store.getQuestionById(id)
      const impact = getQuestionDeleteImpact(appState, id)
      if (!question || !impact) return null
      return {
        type,
        id,
        parentId: null,
        title: question.title,
        kicker: "删除问题",
        subtitle: "将级联删除关联对象。",
        warning: `删除后不可恢复。${impact.counts.questions > 1 ? `含 ${impact.counts.questions - 1} 个子问题。` : ""}`,
        cards: [
          { label: "问题节点", value: impact.counts.questions },
          { label: "判断", value: impact.counts.judgments },
          { label: "策略", value: impact.counts.strategies },
          { label: "动作", value: impact.counts.actions },
          { label: "样例 / 反例", value: impact.counts.examples },
          { label: "障碍", value: impact.counts.obstacles },
          { label: "认识", value: impact.counts.insights },
          { label: "时间线事件", value: impact.counts.timelineEvents }
        ],
        chips: [
          impact.counts.formulations ? `问题表述 ${impact.counts.formulations}` : "",
          impact.counts.literatureTouched ? `受影响文献 ${impact.counts.literatureTouched}` : "",
          impact.hasActiveFocus ? "当前焦点会被关闭" : "",
          impact.affectsActiveQuestion ? "工作台会切到别的问题" : ""
        ].filter(Boolean),
        confirmLabel: "确认删除问题"
      }
    }

    if (type === "formulation") {
      const formulation = appState.formulations.find((item) => item.id === id)
      const question = formulation ? store.getQuestionById(formulation.questionId) : null
      const versions = formulation ? appState.formulations.filter((item) => item.questionId === formulation.questionId) : []
      if (!formulation || !question) return null
      return {
        type,
        id,
        parentId: formulation.questionId,
        title: formulation.content || "未命名表述版本",
        kicker: "删除表述版本",
        subtitle: `挂在：${question.title}`,
        warning: question.currentFormulationId === formulation.id
          ? "删除当前版本后将回退上一版；若无上一版则清空表述。"
          : "删除该版本。",
        cards: [
          { label: "剩余版本", value: Math.max(0, versions.length - 1) },
          { label: "当前状态", value: question.currentFormulationId === formulation.id ? "当前" : "历史" }
        ],
        chips: [
          formulation.constraints && formulation.constraints.length ? `约束 ${formulation.constraints.length}` : "",
          formulation.reason ? "含采用原因" : ""
        ].filter(Boolean),
        confirmLabel: "确认删除表述"
      }
    }

    if (type === "judgment") {
      const judgment = judgments.find((item) => item.id === id)
      if (!judgment) return null
      return {
        type,
        id,
        title: judgment.content,
        kicker: "删除判断",
        subtitle: `挂在：${((store.getQuestionById(judgment.questionId) || {}).title) || "未找到问题"}`,
        warning: "关联引用会一起清理。",
        cards: [
          { label: "关联样例", value: examples.filter((item) => Array.isArray(item.relatedJudgmentIds) && item.relatedJudgmentIds.indexOf(id) >= 0).length },
          { label: "支撑引用", value: judgments.filter((item) => Array.isArray(item.supportingIds) && item.supportingIds.indexOf(id) >= 0).length }
        ],
        chips: [formatMappedValue(judgment.status, dataAPI.JUDGMENT_STATUS_LABELS) || judgment.status].filter(Boolean),
        confirmLabel: "确认删除判断"
      }
    }

    if (type === "strategy") {
      const strategy = strategies.find((item) => item.id === id)
      if (!strategy) return null
      const childCount = strategies.filter((item) => item.parentId === id).length
      return {
        type,
        id,
        title: strategy.name,
        kicker: "删除策略",
        subtitle: `挂在：${((store.getQuestionById(strategy.questionId) || {}).title) || "未找到问题"}`,
        warning: childCount
          ? "子分支会一起删除。"
          : "关联引用会一起清理。",
        cards: [
          { label: "子分支", value: childCount },
          { label: "受影响障碍", value: obstacles.filter((item) => Array.isArray(item.affectedStrategyIds) && item.affectedStrategyIds.indexOf(id) >= 0).length },
          { label: "挂载动作", value: actions.filter((item) => item.strategyId === id).length }
        ],
        chips: [dataAPI.STRATEGY_STATUS_LABELS[strategy.status] || strategy.status].filter(Boolean),
        confirmLabel: "确认删除策略"
      }
    }

    if (type === "example") {
      const example = examples.find((item) => item.id === id)
      if (!example) return null
      return {
        type,
        id,
        title: example.content,
        kicker: "删除样例 / 反例",
        subtitle: `挂在：${((store.getQuestionById(example.questionId) || {}).title) || "未找到问题"}`,
        warning: "关联引用会一起清理。",
        cards: [
          { label: "关联判断", value: Array.isArray(example.relatedJudgmentIds) ? example.relatedJudgmentIds.length : 0 }
        ],
        chips: [dataAPI.EXAMPLE_TYPE_LABELS[example.type] || example.type].filter(Boolean),
        confirmLabel: "确认删除样例"
      }
    }

    if (type === "obstacle") {
      const obstacle = obstacles.find((item) => item.id === id)
      if (!obstacle) return null
      return {
        type,
        id,
        title: obstacle.content,
        kicker: "删除障碍",
        subtitle: `挂在：${((store.getQuestionById(obstacle.questionId) || {}).title) || "未找到问题"}`,
        warning: "关联引用会一起清理。",
        cards: [
          { label: "受影响策略", value: strategies.filter((item) => item.currentObstacleId === id).length + (Array.isArray(obstacle.affectedStrategyIds) ? obstacle.affectedStrategyIds.length : 0) },
          { label: "判断引用", value: judgments.filter((item) => Array.isArray(item.supportingIds) && item.supportingIds.indexOf(id) >= 0).length }
        ],
        chips: [
          dataAPI.OBSTACLE_TYPE_LABELS[obstacle.type] || obstacle.type,
          obstacle.isCoreProblem ? "核心瓶颈" : ""
        ].filter(Boolean),
        confirmLabel: "确认删除障碍"
      }
    }

    if (type === "insight") {
      const insight = insights.find((item) => item.id === id)
      if (!insight) return null
      return {
        type,
        id,
        title: insight.content,
        kicker: "删除认识",
        subtitle: `挂在：${((store.getQuestionById(insight.questionId) || {}).title) || "未找到问题"}`,
        warning: "关联引用会一起清理。",
        cards: [
          { label: "判断引用", value: judgments.filter((item) => Array.isArray(item.supportingIds) && item.supportingIds.indexOf(id) >= 0).length }
        ],
        chips: [dataAPI.INSIGHT_TYPE_LABELS[insight.type] || insight.type].filter(Boolean),
        confirmLabel: "确认删除认识"
      }
    }

    if (type === "action-item") {
      const actionItem = actions.find(function(item) { return item.id === id })
      const strategy = actionItem && actionItem.strategyId ? store.getStrategyById(actionItem.strategyId) : null
      if (!actionItem) return null
      return {
        type,
        id,
        title: actionItem.title,
        kicker: "删除动作",
        subtitle: strategy ? `挂在策略：${strategy.name}` : `挂在：${((store.getQuestionById(actionItem.questionId) || {}).title) || "未找到问题"}`,
        warning: "删除后不会自动删除来源时间线事件。",
        cards: [
          { label: "状态", value: dataAPI.ACTION_STATUS_LABELS[actionItem.status] || actionItem.status },
          { label: "来源时间线", value: actionItem.sourceTimelineEventId ? "有" : "无" }
        ],
        chips: [
          strategy ? `策略 · ${strategy.name}` : "问题层动作"
        ],
        confirmLabel: "确认删除动作"
      }
    }

    if (type === "timeline-event") {
      const timelineEvent = (Array.isArray(appState.timelineEvents) ? appState.timelineEvents : []).find(function(item) { return item.id === id })
      if (!timelineEvent) return null
      return {
        type,
        id,
        title: getTimelineEventSummary(timelineEvent),
        kicker: "删除时间线事件",
        subtitle: `${formatTimelineStamp(timelineEvent.createdAt)} · ${dataAPI.TIMELINE_SOURCE_LABELS[timelineEvent.source] || timelineEvent.source || "系统记录"}`,
        warning: "删除后不会影响已升格出的正式对象。",
        cards: [
          { label: "类型", value: timelineEvent.source === "manual" ? (dataAPI.TIMELINE_NOTE_TYPE_LABELS[timelineEvent.noteType] || timelineEvent.noteType || "记录") : "系统记录" },
          { label: "关联对象", value: timelineEvent.relatedEntityType ? (ENTITY_TYPE_LABELS[timelineEvent.relatedEntityType] || timelineEvent.relatedEntityType) : "无" }
        ],
        chips: [
          timelineEvent.promotedEntityType ? `已升格为${ENTITY_TYPE_LABELS[timelineEvent.promotedEntityType] || timelineEvent.promotedEntityType}` : ""
        ].filter(Boolean),
        confirmLabel: "确认删除事件"
      }
    }

    if (type === "focus-session") {
      const session = focusSessions.find((item) => item.id === id)
      if (!session) return null
      const currentReading = session.currentReading && typeof session.currentReading === "object"
        ? session.currentReading
        : null
      return {
        type,
        id,
        title: session.title,
        kicker: "删除专注会话",
        subtitle: `${ENTITY_TYPE_LABELS[session.type] || session.type || "研究对象"} · ${formatElapsedTime(session.startTime, session.endTime, session.updatedAt)}`,
        warning: "会话与活动记录会删除；已沉淀内容保留。",
        cards: [
          { label: "当前阅读", value: currentReading && currentReading.title ? currentReading.title : "无" },
          { label: "已挂对象", value: Array.isArray(session.linkedItems) ? session.linkedItems.length : 0 },
          { label: "活动记录", value: appState.progressLog.filter((item) => item.focusSessionId === id).length }
        ],
        chips: [
          session.status === "completed" ? "已完成" : session.status === "paused" ? "已暂停" : "进行中",
          session.confidenceLevel ? `把握：${formatMappedValue(session.confidenceLevel, dataAPI.CONFIDENCE_LEVEL_LABELS) || session.confidenceLevel}` : ""
        ].filter(Boolean),
        confirmLabel: "确认删除会话"
      }
    }

    return null
  }

  function getEditTargetData(appState, uiState) {
    const type = uiState && uiState.editTargetType
    const id = uiState && uiState.editTargetId
    const parentId = uiState && uiState.editTargetParentId
    if (!type || !id) return null

    if (type === "question") {
      const question = store.getQuestionById(id)
      if (!question) return null
      const formulations = appState.formulations.filter((item) => item.questionId === question.id)
      const currentFormulation = formulations.find((item) => item.id === question.currentFormulationId) || null
      const allowsDescriptionEdit = !formulations.length
      return {
        type,
        id,
        title: "编辑问题",
        kicker: "问题信息",
        subtitle: allowsDescriptionEdit
          ? "标题、状态、描述"
          : "标题、状态",
        submitLabel: "保存问题",
        body: `
          <div class="editor-grid">
            <input data-input="edit-question-title" value="${escapeHtml(question.title || "")}" placeholder="问题标题">
            ${allowsDescriptionEdit ? `
              <textarea data-input="edit-question-description" placeholder="问题描述">${escapeHtml(question.description || "")}</textarea>
            ` : `
              <article class="list-item compact-readonly-card">
                <div class="list-title-row">
                  <h4 class="list-item-title">当前问题表述</h4>
                  <span class="chip ${currentFormulation ? "is-accent" : ""}">${escapeHtml(currentFormulation ? `v${currentFormulation.version}` : "未版本化")}</span>
                </div>
                ${renderPrimaryBlock("div", "list-item-body", question.description, "未填写表述")}
                <div class="list-item-footnote">请在“问题表述”中修改。</div>
              </article>
            `}
            ${renderHtmlSelect("edit-question-status", question.status || "active", [
              { value: "active", label: "进行中" },
              { value: "paused", label: "暂停" },
              { value: "resolved", label: "已解决" },
              { value: "archived", label: "归档" }
            ])}
          </div>
        `
      }
    }

    if (type === "question-feedback") {
      const question = store.getQuestionById(id)
      const branchSummary = question ? getQuestionBranchSummary(appState, question.id) : null
      const sourceStrategy = branchSummary && branchSummary.sourceType === "strategy"
        ? store.getStrategyById(branchSummary.sourceId)
        : null
      if (!question || !branchSummary || !branchSummary.isChild || branchSummary.isOrphan) return null
      return {
        type,
        id: question.id,
        parentId: question.parentId || "",
        title: "记录回流",
        kicker: "分支回流",
        subtitle: `子问题：${question.title}`,
        submitLabel: "保存回流",
        body: `
          <div class="editor-grid">
            <article class="list-item compact-readonly-card">
              <div class="list-title-row">
                <h4 class="list-item-title">当前分支</h4>
                <span class="chip ${getBranchStatusChipClass(branchSummary.feedbackStatus)}">${escapeHtml(dataAPI.QUESTION_FEEDBACK_STATUS_LABELS[branchSummary.feedbackStatus] || branchSummary.feedbackStatus)}</span>
              </div>
              <div class="list-item-body">${renderBranchSourceSummary(
                `${branchSummary.sourceType === "strategy" ? "来源策略" : "来源问题"}：`,
                branchSummary.sourceTitle,
                "",
                "未定义"
              )}</div>
              <div class="list-item-footnote">${escapeHtml((dataAPI.BRANCH_CONTRIBUTION_LABELS[branchSummary.contributionType] || branchSummary.contributionType || "未定义支撑点"))}</div>
            </article>
            ${renderHtmlSelect("feedback-status", branchSummary.feedbackStatus || "pending", [
              { value: "pending", label: "待回流" },
              { value: "partial", label: "部分回流" },
              { value: "fed_back", label: "已回流" }
            ])}
            <textarea data-input="feedback-summary" placeholder="回流说明">${escapeHtml(branchSummary.feedbackSummary || "")}</textarea>
            ${sourceStrategy ? renderHtmlSelect("feedback-strategy-status", "keep", [
              { value: "keep", label: "源策略状态不变" },
              { value: "promising", label: "源策略改为有希望" },
              { value: "succeeded", label: "源策略改为成功" },
              { value: "stalled", label: "源策略改为停滞" },
              { value: "failed", label: "源策略改为失败" }
            ]) : ""}
          </div>
        `
      }
    }

    if (type === "new-formulation") {
      const question = store.getQuestionById(id)
      if (!question) return null
      const formulations = appState.formulations.filter((item) => item.questionId === question.id)
      const currentFormulation = formulations.find((item) => item.id === question.currentFormulationId) || null
      const carriesStarterCopy = !currentFormulation && (
        question.description === "先写下问题表述，再补判断和策略。" ||
        question.description === "继续把这个分支拆细。"
      )
      const seedContent = currentFormulation
        ? currentFormulation.content
        : (carriesStarterCopy ? "" : (question.description || ""))
      const seedConstraints = currentFormulation && currentFormulation.constraints && currentFormulation.constraints.length
        ? currentFormulation.constraints.join("\n")
        : ""
      return {
        type,
        id,
        parentId: question.id,
        title: formulations.length ? `新建表述 v${formulations.length + 1}` : "写首版表述",
        kicker: "问题表述",
        subtitle: `挂在：${question.title}`,
        submitLabel: formulations.length ? "保存新版本" : "保存首版表述",
        body: `
          <div class="editor-grid">
            <textarea data-input="new-formulation-content" placeholder="表述">${escapeHtml(seedContent || "")}</textarea>
            <textarea data-input="new-formulation-constraints" placeholder="约束（每行一条）">${escapeHtml(seedConstraints)}</textarea>
            <textarea data-input="new-formulation-reason" placeholder="修改原因"></textarea>
          </div>
        `
      }
    }

    if (type === "formulation") {
      const formulation = appState.formulations.find((item) => item.id === id)
      const question = formulation ? store.getQuestionById(formulation.questionId) : null
      if (!formulation || !question) return null
      return {
        type,
        id,
        parentId: formulation.questionId,
        title: `编辑表述 v${formulation.version}`,
        subtitle: `挂在：${question.title}`,
        submitLabel: "保存表述",
        body: `
          <div class="editor-grid">
            <textarea data-input="edit-formulation-content" placeholder="正式表述">${escapeHtml(formulation.content || "")}</textarea>
            <textarea data-input="edit-formulation-constraints" placeholder="约束">${escapeHtml((formulation.constraints || []).join("\n"))}</textarea>
            <textarea data-input="edit-formulation-reason" placeholder="原因">${escapeHtml(formulation.reason || "")}</textarea>
            ${renderHtmlSelect("edit-formulation-abandoned", formulation.isAbandoned ? "yes" : "no", [
              { value: "no", label: "当前可用" },
              { value: "yes", label: "标记放弃" }
            ])}
          </div>
        `
      }
    }

    if (type === "new-judgment") {
      const question = store.getQuestionById(parentId || id)
      if (!question) return null
      return {
        type,
        id: question.id,
        parentId: question.id,
        title: "新增判断",
        kicker: "判断",
        subtitle: `挂在：${question.title}`,
        submitLabel: "保存判断",
        body: `
          <div class="editor-grid">
            ${renderHistoryInput("new-judgment-type", "", appState, uiState)}
            <textarea data-input="new-judgment-content" placeholder="判断内容"></textarea>
            ${renderHistoryInput("new-judgment-status", "", appState, uiState)}
            <textarea data-input="new-judgment-reason" placeholder="原因（可选）"></textarea>
          </div>
        `
      }
    }

    if (type === "judgment") {
      const judgment = appState.judgments.find((item) => item.id === id)
      if (!judgment) return null
      return {
        type,
        id,
        title: "编辑判断",
        subtitle: `挂在：${((store.getQuestionById(judgment.questionId) || {}).title) || "未找到问题"}`,
        submitLabel: "保存判断",
        body: `
          <div class="editor-grid">
            ${renderHistoryInput("edit-judgment-type", judgment.type || "", appState, uiState)}
            <textarea data-input="edit-judgment-content" placeholder="判断内容">${escapeHtml(judgment.content || "")}</textarea>
            ${renderHistoryInput("edit-judgment-status", judgment.status || "", appState, uiState)}
            <textarea data-input="edit-judgment-reason" placeholder="状态变化原因">${escapeHtml(judgment.changeReason || "")}</textarea>
          </div>
        `
      }
    }

    if (type === "new-strategy") {
      const question = store.getQuestionById(parentId || id)
      if (!question) return null
      return {
        type,
        id: question.id,
        parentId: question.id,
        title: "新增策略",
        kicker: "策略",
        subtitle: `挂在：${question.title}`,
        submitLabel: "保存策略",
        body: `
          <div class="editor-grid">
            <input data-input="new-strategy-name" placeholder="策略名称">
            ${renderHistoryTagInput("new-strategy-method-tags", "", appState, uiState)}
            ${renderHistoryInput("new-strategy-branch-intent", "", appState, uiState)}
            <textarea data-input="new-strategy-description" placeholder="做什么"></textarea>
            <textarea data-input="new-strategy-rationale" placeholder="原因"></textarea>
            ${renderHtmlSelect("new-strategy-status", "exploring", [
              { value: "exploring", label: "探索中" },
              { value: "promising", label: "有希望" },
              { value: "stalled", label: "停滞" },
              { value: "blocked", label: "受阻" },
              { value: "failed", label: "失败" },
              { value: "succeeded", label: "成功" }
            ])}
            <input data-input="new-strategy-next" placeholder="下一步（可选）">
            <textarea data-input="new-strategy-failure" placeholder="受阻原因（可选）"></textarea>
          </div>
        `
      }
    }

    if (type === "strategy") {
      const strategy = appState.strategies.find((item) => item.id === id)
      if (!strategy) return null
      return {
        type,
        id,
        title: "编辑策略",
        subtitle: `挂在：${((store.getQuestionById(strategy.questionId) || {}).title) || "未找到问题"}`,
        submitLabel: "保存策略",
        body: `
          <div class="editor-grid">
            <input data-input="edit-strategy-name" value="${escapeHtml(strategy.name || "")}" placeholder="策略名称">
            ${renderHistoryTagInput("edit-strategy-method-tags", getStrategyMethodTags(strategy), appState, uiState)}
            ${renderHistoryInput("edit-strategy-branch-intent", strategy.branchIntent || "", appState, uiState)}
            <textarea data-input="edit-strategy-description" placeholder="做什么">${escapeHtml(strategy.description || "")}</textarea>
            <textarea data-input="edit-strategy-rationale" placeholder="原因">${escapeHtml(strategy.rationale || "")}</textarea>
            ${renderHtmlSelect("edit-strategy-status", strategy.status || "exploring", [
              { value: "exploring", label: "探索中" },
              { value: "promising", label: "有希望" },
              { value: "stalled", label: "停滞" },
              { value: "blocked", label: "受阻" },
              { value: "failed", label: "失败" },
              { value: "succeeded", label: "成功" }
            ])}
            <input data-input="edit-strategy-next" value="${escapeHtml(strategy.nextAction || "")}" placeholder="下一步">
            <textarea data-input="edit-strategy-failure" placeholder="受阻原因">${escapeHtml(strategy.failureReason || "")}</textarea>
          </div>
        `
      }
    }

    if (type === "branch-link") {
      const strategy = appState.strategies.find((item) => item.id === id)
      const parentQuestion = strategy ? store.getQuestionById(parentId || strategy.questionId) : null
      const existingLinks = strategy ? getOutgoingStrategyBranchLinks(appState, strategy.id) : []
      const linkedQuestionMap = existingLinks
        .filter(function(link) { return link.targetType === "question" })
        .reduce(function(result, link) {
          result[link.targetId] = true
          return result
        }, {})
      const candidates = strategy ? appState.questions
        .filter(function(question) {
          return question.id !== strategy.questionId && !linkedQuestionMap[question.id]
        })
        .sort(function(left, right) {
          return String(left.title || "").localeCompare(String(right.title || ""), "zh-CN")
        }) : []
      if (!strategy || !parentQuestion) return null
      return {
        type,
        id: strategy.id,
        parentId: parentQuestion.id,
        title: "关联已有子问题",
        kicker: "策略分支",
        subtitle: `策略：${strategy.name}`,
        submitLabel: candidates.length ? "保存关联" : "当前无可关联项",
        submitDisabled: !candidates.length,
        body: candidates.length ? `
          <div class="editor-grid">
            ${renderHtmlSelect("branch-link-question-id", candidates[0].id, candidates.map(function(question) {
              const prefix = question.parentId === parentQuestion.id
                ? "当前问题子问题"
                : question.parentId
                  ? "其他子问题"
                  : "根问题"
              return {
                value: question.id,
                label: `${prefix} · ${truncate(question.title, 24)}`,
                labelHtml: renderRichSelectLabel(prefix, question.title || "", "未命名问题")
              }
            }))}
            ${renderHistoryInput("branch-link-role", "", appState, uiState)}
            ${renderHistoryInput("branch-link-contribution", "", appState, uiState)}
            <textarea data-input="branch-link-note" placeholder="关联说明（可选）"></textarea>
          </div>
        ` : `
          <div class="empty-state compact-empty-state">
            <h3 class="empty-state-title">没有可关联的问题</h3>
          </div>
        `
      }
    }

    if (type === "new-example") {
      const question = store.getQuestionById(parentId || id)
      if (!question) return null
      return {
        type,
        id: question.id,
        parentId: question.id,
        title: "新增样例 / 反例",
        kicker: "样例与反例",
        subtitle: `挂在：${question.title}`,
        submitLabel: "保存样例",
        body: `
          <div class="editor-grid">
            ${renderHistoryInput("new-example-type", "", appState, uiState)}
            <textarea data-input="new-example-content" placeholder="样例 / 反例"></textarea>
            <input data-input="new-example-conclusion" placeholder="说明">
            ${renderHtmlSelect("new-example-key", "no", [
              { value: "yes", label: "关键样例" },
              { value: "no", label: "普通样例" }
            ])}
          </div>
        `
      }
    }

    if (type === "example") {
      const example = appState.examples.find((item) => item.id === id)
      if (!example) return null
      return {
        type,
        id,
        title: "编辑样例 / 反例",
        subtitle: `挂在：${((store.getQuestionById(example.questionId) || {}).title) || "未找到问题"}`,
        submitLabel: "保存样例",
        body: `
          <div class="editor-grid">
            ${renderHistoryInput("edit-example-type", example.type || "", appState, uiState)}
            <textarea data-input="edit-example-content" placeholder="样例内容">${escapeHtml(example.content || "")}</textarea>
            <input data-input="edit-example-conclusion" value="${escapeHtml(example.conclusion || "")}" placeholder="说明">
            ${renderHtmlSelect("edit-example-key", example.isKey ? "yes" : "no", [
              { value: "yes", label: "关键样例" },
              { value: "no", label: "普通样例" }
            ])}
          </div>
        `
      }
    }

    if (type === "new-obstacle") {
      const question = store.getQuestionById(parentId || id)
      if (!question) return null
      return {
        type,
        id: question.id,
        parentId: question.id,
        title: "新增障碍",
        kicker: "障碍",
        subtitle: `挂在：${question.title}`,
        submitLabel: "保存障碍",
        body: `
          <div class="editor-grid">
            ${renderHistoryInput("new-obstacle-type", "", appState, uiState)}
            <textarea data-input="new-obstacle-content" placeholder="障碍内容"></textarea>
            <input data-input="new-obstacle-clue" placeholder="线索（可选）">
            <div class="form-row">
              ${renderHtmlSelect("new-obstacle-core", "no", [
                { value: "yes", label: "核心瓶颈" },
                { value: "no", label: "一般障碍" }
              ])}
              ${renderHtmlSelect("new-obstacle-has-clue", "no", [
                { value: "yes", label: "已有线索" },
                { value: "no", label: "还没线索" }
              ])}
            </div>
          </div>
        `
      }
    }

    if (type === "obstacle") {
      const obstacle = appState.obstacles.find((item) => item.id === id)
      if (!obstacle) return null
      return {
        type,
        id,
        title: "编辑障碍",
        subtitle: `挂在：${((store.getQuestionById(obstacle.questionId) || {}).title) || "未找到问题"}`,
        submitLabel: "保存障碍",
        body: `
          <div class="editor-grid">
            ${renderHistoryInput("edit-obstacle-type", obstacle.type || "", appState, uiState)}
            <textarea data-input="edit-obstacle-content" placeholder="障碍内容">${escapeHtml(obstacle.content || "")}</textarea>
            <input data-input="edit-obstacle-clue" value="${escapeHtml(obstacle.clueDescription || "")}" placeholder="线索">
            <div class="form-row">
              ${renderHtmlSelect("edit-obstacle-core", obstacle.isCoreProblem ? "yes" : "no", [
                { value: "yes", label: "核心瓶颈" },
                { value: "no", label: "一般障碍" }
              ])}
              ${renderHtmlSelect("edit-obstacle-has-clue", obstacle.hasClue ? "yes" : "no", [
                { value: "yes", label: "已有线索" },
                { value: "no", label: "还没线索" }
              ])}
            </div>
          </div>
        `
      }
    }

    if (type === "new-insight") {
      const question = store.getQuestionById(parentId || id)
      if (!question) return null
      return {
        type,
        id: question.id,
        parentId: question.id,
        title: "新增认识",
        kicker: "认识",
        subtitle: `挂在：${question.title}`,
        submitLabel: "保存认识",
        body: `
          <div class="editor-grid">
            ${renderHistoryInput("new-insight-type", "", appState, uiState)}
            <textarea data-input="new-insight-content" placeholder="这次弄明白了什么"></textarea>
          </div>
        `
      }
    }

    if (type === "insight") {
      const insight = appState.insights.find((item) => item.id === id)
      if (!insight) return null
      return {
        type,
        id,
        title: "编辑认识",
        subtitle: `挂在：${((store.getQuestionById(insight.questionId) || {}).title) || "未找到问题"}`,
        submitLabel: "保存认识",
        body: `
          <div class="editor-grid">
            ${renderHistoryInput("edit-insight-type", insight.type || "", appState, uiState)}
            <textarea data-input="edit-insight-content" placeholder="这次弄明白了什么">${escapeHtml(insight.content || "")}</textarea>
          </div>
        `
      }
    }

    if (type === "timeline-event") {
      const timelineEvent = store.getTimelineEventById(id)
      if (!timelineEvent || timelineEvent.source !== "manual") return null
      return {
        type,
        id,
        title: "编辑时间线事件",
        kicker: "时间线事件",
        subtitle: `${dataAPI.TIMELINE_NOTE_TYPE_LABELS[timelineEvent.noteType] || timelineEvent.noteType || "记录"} · ${formatTimelineStamp(timelineEvent.createdAt)}`,
        submitLabel: "保存事件",
        body: `
          <div class="editor-grid">
            <textarea data-input="edit-timeline-content" placeholder="事件内容">${escapeHtml(timelineEvent.content || "")}</textarea>
          </div>
        `
      }
    }

    if (type === "promote-event-action") {
      const timelineEvent = store.getTimelineEventById(id)
      if (!timelineEvent) return null
      return {
        type,
        id,
        title: "升格为动作",
        kicker: "时间线事件",
        subtitle: getTimelineEventSummary(timelineEvent),
        submitLabel: "创建动作",
        body: `
          <div class="editor-grid">
            <input data-input="promote-action-title" value="${escapeHtml(timelineEvent.content || "")}" placeholder="动作标题">
            <textarea data-input="promote-action-description" placeholder="动作说明">${escapeHtml(timelineEvent.relatedEntityType === "strategy" ? "由当前策略推进而来。" : "")}</textarea>
            ${renderHtmlSelect("promote-action-status", "queued", [
              { value: "queued", label: dataAPI.ACTION_STATUS_LABELS.queued },
              { value: "doing", label: dataAPI.ACTION_STATUS_LABELS.doing },
              { value: "waiting", label: dataAPI.ACTION_STATUS_LABELS.waiting },
              { value: "blocked", label: dataAPI.ACTION_STATUS_LABELS.blocked },
              { value: "done", label: dataAPI.ACTION_STATUS_LABELS.done }
            ])}
          </div>
        `
      }
    }

    if (type === "action-item") {
      const actionItem = store.getActionById(id)
      const strategy = actionItem && actionItem.strategyId ? store.getStrategyById(actionItem.strategyId) : null
      if (!actionItem) return null
      return {
        type,
        id,
        title: "动作详情",
        kicker: "计划 / 动作",
        subtitle: strategy ? `挂在策略：${strategy.name}` : `挂在：${((store.getQuestionById(actionItem.questionId) || {}).title) || "未找到问题"}`,
        submitLabel: "保存动作",
        body: `
          <div class="editor-grid">
            <input data-input="edit-action-title" value="${escapeHtml(actionItem.title || "")}" placeholder="动作标题">
            <textarea data-input="edit-action-description" placeholder="动作说明">${escapeHtml(actionItem.description || "")}</textarea>
            ${renderHtmlSelect("edit-action-status", actionItem.status || "queued", [
              { value: "queued", label: dataAPI.ACTION_STATUS_LABELS.queued },
              { value: "doing", label: dataAPI.ACTION_STATUS_LABELS.doing },
              { value: "waiting", label: dataAPI.ACTION_STATUS_LABELS.waiting },
              { value: "blocked", label: dataAPI.ACTION_STATUS_LABELS.blocked },
              { value: "done", label: dataAPI.ACTION_STATUS_LABELS.done }
            ])}
          </div>
        `
      }
    }

    if (type === "focus-session") {
      const focus = appState.focusSessions.find((item) => item.id === id)
      if (!focus) return null
      return {
        type,
        id,
        title: "编辑专注会话",
        subtitle: `${ENTITY_TYPE_LABELS[focus.type] || focus.type || "研究对象"} · ${formatElapsedTime(focus.startTime, focus.endTime, focus.updatedAt)}`,
        submitLabel: "保存会话",
        body: `
          <div class="editor-grid">
            <input data-input="edit-focus-title" value="${escapeHtml(focus.title || "")}" placeholder="标题">
            <textarea data-input="edit-focus-description" placeholder="目标">${escapeHtml(focus.description || "")}</textarea>
            <textarea data-input="edit-focus-next" placeholder="下次从哪接">${escapeHtml(focus.nextContinuePoint || "")}</textarea>
            ${renderHtmlSelect("edit-focus-confidence", focus.confidenceLevel || "medium", [
              { value: "high", label: dataAPI.CONFIDENCE_LEVEL_LABELS.high },
              { value: "medium", label: dataAPI.CONFIDENCE_LEVEL_LABELS.medium },
              { value: "low", label: dataAPI.CONFIDENCE_LEVEL_LABELS.low }
            ])}
          </div>
        `
      }
    }

    return null
  }

  function renderHtmlSelect(name, value, options) {
    const fieldMeta = getFieldMeta(name) || {}
    return `
      <div class="form-field">
        ${renderFieldHeader(fieldMeta)}
        ${renderHtmlSelectControl(name, value, options)}
      </div>
    `
  }

  function renderHtmlSelectControl(name, value, options, config) {
    const normalizedValue = value == null ? "" : String(value)
    const normalizedOptions = Array.isArray(options) ? options : []
    const settings = config && typeof config === "object" ? config : {}
    const selectedOption = normalizedOptions.find(function(option) {
      return String(option.value) === normalizedValue
    }) || normalizedOptions[0] || { value: "", label: "" }
    const rootClassName = settings.rootClassName ? ` ${settings.rootClassName}` : ""
    const triggerClassName = settings.triggerClassName ? ` ${settings.triggerClassName}` : ""
    const menuClassName = settings.menuClassName ? ` ${settings.menuClassName}` : ""
    const disabled = !!settings.disabled
    const inputAttributes = settings.inputAttributes || ""
    const selectedLabelHtml = selectedOption.labelHtml || escapeHtml(selectedOption.label || "")

    return `
      <div class="html-select${rootClassName}${disabled ? " is-disabled" : ""}" data-select-name="${escapeHtml(name)}">
        <input type="hidden" data-input="${escapeHtml(name)}" value="${escapeHtml(selectedOption.value)}"${inputAttributes}>
        <button
          class="html-select-trigger${triggerClassName}"
          data-action="toggle-html-select"
          data-select-name="${escapeHtml(name)}"
          aria-expanded="false"
          type="button"
          ${disabled ? "disabled" : ""}
        >
          <span class="html-select-trigger-label">${selectedLabelHtml}</span>
          <span class="html-select-trigger-icon">${renderIcon("chevron-down")}</span>
        </button>
        <div class="html-select-menu${menuClassName}">
          ${normalizedOptions.map(function(option) {
            const isSelected = String(option.value) === String(selectedOption.value)
            const optionLabelHtml = option.labelHtml || escapeHtml(option.label || "")
            return `
              <button
                class="html-select-option ${isSelected ? "is-selected" : ""}"
                data-action="pick-html-select"
                data-select-name="${escapeHtml(name)}"
                data-select-value="${escapeHtml(option.value)}"
                data-select-label="${escapeHtml(option.label)}"
                type="button"
              >${optionLabelHtml}</button>
            `
          }).join("")}
        </div>
      </div>
    `
  }

  function renderProgressEntry(entry) {
    const actionLabels = {
      started: "开始专注",
      paused: "暂停专注",
      resumed: "恢复专注",
      completed: "完成专注",
      note_added: "推进记录",
      item_linked: "关联对象",
      question_deleted: "删除问题"
    }

    return `
      <article class="list-item">
        <div class="list-title-row">
          <h3 class="list-item-title">${escapeHtml(actionLabels[entry.action] || entry.action || "活动")}</h3>
          <span class="chip">${escapeHtml(formatRelativeTime(entry.createdAt))}</span>
        </div>
        ${entry.details ? renderRichBlockTag("div", "list-item-body", entry.details) : ""}
        ${entry.entityType ? `<div class="chip-row"><span class="chip">${escapeHtml(ENTITY_TYPE_LABELS[entry.entityType] || entry.entityType)}</span></div>` : ""}
      </article>
    `
  }

  function getFocusCandidates(appState, activeQuestion) {
    if (!activeQuestion) return []

    const candidates = [{
      type: "question",
      id: activeQuestion.id,
      title: activeQuestion.title,
      description: activeQuestion.description || "",
      meta: "围绕整个问题推进"
    }]

    appState.judgments
      .filter(function(item) { return item.questionId === activeQuestion.id })
      .forEach(function(item) {
        candidates.push({
          type: "judgment",
          id: item.id,
          title: item.content,
          description: "",
          meta: formatMappedValue(item.status, dataAPI.JUDGMENT_STATUS_LABELS) || "判断"
        })
      })

    appState.strategies
      .filter(function(item) { return item.questionId === activeQuestion.id })
      .forEach(function(item) {
        candidates.push({
          type: "strategy",
          id: item.id,
          title: item.name,
          description: item.description || item.rationale || "",
          meta: summarizeStrategyMethodTags(item, dataAPI.STRATEGY_STATUS_LABELS[item.status] || "策略")
        })
      })

    appState.obstacles
      .filter(function(item) { return item.questionId === activeQuestion.id })
      .forEach(function(item) {
        candidates.push({
          type: "obstacle",
          id: item.id,
          title: item.content,
          description: item.clueDescription || "",
          meta: dataAPI.OBSTACLE_TYPE_LABELS[item.type] || "障碍"
        })
      })

    appState.examples
      .filter(function(item) { return item.questionId === activeQuestion.id })
      .forEach(function(item) {
        candidates.push({
          type: "example",
          id: item.id,
          title: item.content,
          description: item.conclusion || "",
          meta: dataAPI.EXAMPLE_TYPE_LABELS[item.type] || "样例"
        })
      })

    appState.insights
      .filter(function(item) { return item.questionId === activeQuestion.id })
      .forEach(function(item) {
        candidates.push({
          type: "insight",
          id: item.id,
          title: item.content,
          description: "",
          meta: dataAPI.INSIGHT_TYPE_LABELS[item.type] || "认识"
        })
      })

    appState.literature
      .filter(function(item) {
        return Array.isArray(item.questionIds) && item.questionIds.indexOf(activeQuestion.id) >= 0
      })
      .forEach(function(item) {
        candidates.push({
          type: "literature",
          id: item.id,
          title: item.title,
          description: item.authors || "",
          meta: "文献"
        })
      })

    return candidates
  }

  function renderFocusTargetPicker(appState, uiState, activeQuestion) {
    if (!activeQuestion) return ""

    const draft = uiState && uiState.focusDraft ? uiState.focusDraft : {}
    const searchQuery = String(draft.query || "").trim().toLowerCase()
    const candidates = getFocusCandidates(appState, activeQuestion)
    const visibleCandidates = candidates.filter(function(item) {
      if (!searchQuery) return true
      return `${item.title} ${item.description} ${item.meta}`.toLowerCase().indexOf(searchQuery) >= 0
    })
    const selectedType = draft.selectedType || "question"
    const selectedId = draft.selectedId || activeQuestion.id
    const selectedCandidate = candidates.find(function(item) {
      return item.type === selectedType && item.id === selectedId
    }) || candidates[0]

    return `
      <section class="focus-target-picker">
        <div class="focus-section-head">
          <div>
            <div class="section-kicker">开始前</div>
            <h3 class="focus-section-title">选择对象</h3>
          </div>
          <span class="chip">${escapeHtml(visibleCandidates.length)} 项</span>
        </div>
        <input class="focus-target-search" type="search" placeholder="搜索对象..." value="${escapeHtml(draft.query || "")}" data-input="focus-query">
        <div class="focus-target-list">
          ${visibleCandidates.map(function(item) {
            const isSelected = selectedCandidate && item.type === selectedCandidate.type && item.id === selectedCandidate.id
            return `
              <button
                class="focus-target-item ${isSelected ? "is-active" : ""}"
                data-action="select-focus-target"
                data-focus-type="${escapeHtml(item.type)}"
                data-focus-entity-id="${escapeHtml(item.id)}"
              >
                <span class="focus-target-type">${escapeHtml(ENTITY_TYPE_LABELS[item.type] || item.type)}</span>
                <span class="focus-target-title md-rich-text md-rich-inline">${renderMarkdownInlineHtml(item.title)}</span>
                ${item.description ? renderRichBlockTag("div", "focus-target-description", item.description) : ""}
                <span class="focus-target-meta">${escapeHtml(item.meta)}</span>
              </button>
            `
          }).join("") || `
            <div class="empty-state compact-empty-state">
              <h3 class="empty-state-title">没有匹配项</h3>
            </div>
          `}
        </div>
        ${selectedCandidate ? `
          <div class="focus-bound-card">
            <div class="section-kicker">当前绑定</div>
            <div class="focus-bound-title">${escapeHtml(ENTITY_TYPE_LABELS[selectedCandidate.type] || selectedCandidate.type)} · ${renderRichInlineFragment(selectedCandidate.title)}</div>
            ${selectedCandidate.description ? renderRichBlockTag("div", "focus-bound-description", selectedCandidate.description) : ""}
          </div>
        ` : ""}
      </section>
    `
  }

  function getQuestionIdForEntity(appState, type, entityId) {
    if (!type || !entityId) return null
    if (type === "question") return entityId
    if (type === "judgment") {
      const judgment = appState.judgments.find(function(item) { return item.id === entityId })
      return judgment ? judgment.questionId : null
    }
    if (type === "strategy") {
      const strategy = appState.strategies.find(function(item) { return item.id === entityId })
      return strategy ? strategy.questionId : null
    }
    if (type === "action") {
      const actionItem = appState.actions.find(function(item) { return item.id === entityId })
      return actionItem ? actionItem.questionId : null
    }
    if (type === "obstacle") {
      const obstacle = appState.obstacles.find(function(item) { return item.id === entityId })
      return obstacle ? obstacle.questionId : null
    }
    if (type === "example") {
      const example = appState.examples.find(function(item) { return item.id === entityId })
      return example ? example.questionId : null
    }
    if (type === "insight") {
      const insight = appState.insights.find(function(item) { return item.id === entityId })
      return insight ? insight.questionId : null
    }
    if (type === "literature") {
      const literature = appState.literature.find(function(item) { return item.id === entityId })
      return literature && Array.isArray(literature.questionIds) && literature.questionIds.length ? literature.questionIds[0] : null
    }
    return null
  }

  function getFilteredTimelineEvents(appState, uiState, questionId, focusState) {
    const events = getTimelineEventsForQuestion(appState, questionId, !!(uiState && uiState.focusIncludeChildQuestions))
    const nextType = uiState && uiState.focusFilterType ? uiState.focusFilterType : "all"
    const nextSource = uiState && uiState.focusFilterSource ? uiState.focusFilterSource : "all"
    const onlyCurrentEntity = !!(uiState && uiState.focusOnlyCurrentEntity)

    return events.filter(function(item) {
      if (nextType !== "all" && item.noteType !== nextType) return false
      if (nextSource !== "all" && item.source !== nextSource) return false
      if (onlyCurrentEntity && focusState && focusState.entityType && focusState.entityId) {
        return item.relatedEntityType === focusState.entityType && item.relatedEntityId === focusState.entityId
      }
      return true
    })
  }

  function renderTimelineToolbar(appState, uiState, questionId, focusState) {
    const includeChildren = !!(uiState && uiState.focusIncludeChildQuestions)
    const onlyCurrentEntity = !!(uiState && uiState.focusOnlyCurrentEntity)
    const questionFamily = questionId && researchCore && typeof researchCore.collectQuestionFamilyIds === "function"
      ? researchCore.collectQuestionFamilyIds(appState, questionId)
      : [questionId]
    const hasChildQuestions = Array.isArray(questionFamily) && questionFamily.length > 1

    return `
      <div class="timeline-toolbar">
        <label class="timeline-filter-field">
          <span>类型</span>
          ${renderHtmlSelectControl("focus-filter-type", (!uiState || uiState.focusFilterType === "all") ? "all" : uiState.focusFilterType, [
            { value: "all", label: "全部" },
            { value: "progress", label: "进展" },
            { value: "insight", label: "认识" },
            { value: "obstacle", label: "卡点" },
            { value: "next_step", label: "下一步" }
          ])}
        </label>
        <label class="timeline-filter-field">
          <span>来源</span>
          ${renderHtmlSelectControl("focus-filter-source", (!uiState || uiState.focusFilterSource === "all") ? "all" : uiState.focusFilterSource, [
            { value: "all", label: "全部" },
            { value: "manual", label: "手动输入" },
            { value: "system", label: "系统记录" }
          ])}
        </label>
        ${focusState && focusState.entityType && focusState.entityId ? `
          <button class="ghost-button compact-button ${onlyCurrentEntity ? "is-active" : ""}" data-action="toggle-focus-only-current-entity">
            ${onlyCurrentEntity ? "显示全部" : "只看当前聚焦"}
          </button>
        ` : ""}
        ${hasChildQuestions ? `
          <button class="ghost-button compact-button ${includeChildren ? "is-active" : ""}" data-action="toggle-focus-include-children">
            ${includeChildren ? "已混入子问题" : "混入子问题"}
          </button>
        ` : ""}
      </div>
    `
  }

  function renderTimelineEventRow(event, appState) {
    if (!event) return ""
    const chipLabel = event.source === "manual"
      ? (dataAPI.TIMELINE_NOTE_TYPE_LABELS[event.noteType] || "记录")
      : "系统"
    const detail = getTimelineEventDetails(event)
    return `
      <button class="timeline-event-row" data-action="open-timeline-event-modal" data-timeline-id="${escapeHtml(event.id)}">
        <span class="timeline-event-time">
          <span class="timeline-event-date">${escapeHtml(formatTimelineDate(event.createdAt))}</span>
          <span class="timeline-event-clock">${escapeHtml(formatClockTime(event.createdAt))}</span>
        </span>
        <div class="timeline-event-main">
          <div class="timeline-event-head">
            <span class="chip ${event.source === "manual" ? "is-accent" : ""}">${escapeHtml(chipLabel)}</span>
            <div class="timeline-event-summary md-rich-text md-rich-inline">${renderMarkdownInlineHtml(getTimelineEventSummary(event))}</div>
          </div>
          ${detail ? renderRichBlockTag("div", "timeline-event-detail", detail) : ""}
          <div class="timeline-event-meta">${renderTimelineMetaLineHtml(event, appState)}</div>
        </div>
      </button>
    `
  }

  function renderTimelineList(appState, uiState, questionId, focusState) {
    const events = getFilteredTimelineEvents(appState, uiState, questionId, focusState)
    return `
      <section class="panel-block content-card timeline-card" data-section="timeline">
        <div class="focus-section-head">
          <div>
            <div class="section-kicker">问题时间线</div>
            <h3 class="focus-section-title">研究演化</h3>
          </div>
          <span class="chip">${escapeHtml(events.length)} 条</span>
        </div>
        ${renderTimelineToolbar(appState, uiState, questionId, focusState)}
        <div class="timeline-waterfall">
          ${events.length ? events.map(function(item) {
            return renderTimelineEventRow(item, appState)
          }).join("") : `
            <div class="empty-state compact-empty-state">
              <h3 class="empty-state-title">还没有时间线事件</h3>
            </div>
          `}
        </div>
      </section>
    `
  }

  function renderFocusActionPanel(appState, uiState, questionId, focusState) {
    const actions = (Array.isArray(appState.actions) ? appState.actions : [])
      .filter(function(item) { return item.questionId === questionId })
      .slice()
      .sort(function(left, right) {
        return String(right.updatedAt || "").localeCompare(String(left.updatedAt || ""), "zh-CN")
      })

    return `
      <section class="panel-block content-card focus-action-panel">
        <div class="focus-section-head">
          <div>
            <div class="section-kicker">动作区</div>
            <h3 class="focus-section-title">计划 / 动作</h3>
          </div>
          <div class="chip-row">
            <span class="chip">${escapeHtml(actions.length)} 项</span>
            <button class="ghost-button compact-button" data-action="toggle-focus-actions">${uiState && uiState.focusActionsExpanded ? "收起" : "展开"}</button>
          </div>
        </div>
        ${uiState && uiState.focusActionsExpanded ? `
          <div class="focus-action-grid">
            ${actions.length ? actions.map(function(item) {
              const strategy = item.strategyId ? appState.strategies.find(function(entry) { return entry.id === item.strategyId }) : null
              const isCurrent = focusState && focusState.entityType === "action" && focusState.entityId === item.id
              return `
                <article class="focus-action-card ${isCurrent ? "is-current" : ""}">
                  <div class="list-title-row">
                    ${renderRichInlineTag("h4", "list-item-title", item.title)}
                    <span class="chip ${item.status === "done" ? "is-success" : item.status === "blocked" ? "is-danger" : ""}">${escapeHtml(dataAPI.ACTION_STATUS_LABELS[item.status] || item.status)}</span>
                  </div>
                  ${item.description ? renderRichBlockTag("div", "list-item-body", item.description) : ""}
                  <div class="action-card-meta">
                    ${strategy ? renderRichInlineSummary("挂在策略 · ", strategy.name, "") : `<span>问题层动作</span>`}
                  </div>
                  <div class="action-card-controls">
                    <button class="ghost-button compact-button" data-action="set-focus-entity" data-entity-type="action" data-entity-id="${escapeHtml(item.id)}">${isCurrent ? "当前聚焦" : "设为当前聚焦"}</button>
                    <label class="action-status-field">
                      <span>状态</span>
                      ${renderHtmlSelectControl("action-status", item.status || "queued", Object.keys(dataAPI.ACTION_STATUS_LABELS).map(function(status) {
                        return {
                          value: status,
                          label: dataAPI.ACTION_STATUS_LABELS[status]
                        }
                      }), {
                        inputAttributes: ` data-action-id="${escapeHtml(item.id)}"`
                      })}
                    </label>
                    <button class="ghost-button compact-button" data-action="open-edit-modal" data-edit-type="action-item" data-edit-id="${escapeHtml(item.id)}">查看详情</button>
                    <button class="ghost-button compact-button" data-action="open-delete-modal" data-delete-type="action-item" data-delete-id="${escapeHtml(item.id)}">删除动作</button>
                  </div>
                </article>
              `
            }).join("") : `
              <div class="empty-state compact-empty-state">
                <h3 class="empty-state-title">还没有动作</h3>
              </div>
            `}
          </div>
        ` : ""}
      </section>
    `
  }

  function renderFocusView(appState, uiState) {
    const focusState = getFocusState(appState)
    const boundQuestion = focusState.questionId ? store.getQuestionById(focusState.questionId) : null
    const questionOptions = (Array.isArray(appState.questions) ? appState.questions : [])
      .filter(function(question) {
        if (!question) return false
        if (question.status === "active") return true
        return !!(boundQuestion && boundQuestion.id === question.id)
      })
      .slice()
      .sort(function(left, right) {
        if ((left.order || 0) !== (right.order || 0)) return (left.order || 0) - (right.order || 0)
        return String(left.title || "").localeCompare(String(right.title || ""), "zh-CN")
      })
      .map(function(question) {
        const isPausedCarry = question.status !== "active"
        return {
          value: question.id,
          label: question.title,
          labelHtml: renderRichSelectLabel(isPausedCarry ? "暂停中" : "", question.title, "未命名问题")
        }
      })

    return `
      <div class="workspace-view focus-view">
        <div class="workbench-stack">
          <section class="panel-block content-card focus-view-shell">
            <div class="focus-view-header">
              <label class="focus-selector">
                <span>绑定问题</span>
                ${renderHtmlSelectControl("focus-bound-question", boundQuestion ? boundQuestion.id : "", [{
                  value: "",
                  label: "请选择问题",
                  labelHtml: `<span class="html-select-rich-value">请选择问题</span>`
                }].concat(questionOptions))}
              </label>
              <label class="focus-selector">
                <span>当前聚焦</span>
                ${renderHtmlSelectControl("focus-bound-entity", focusState.entityType && focusState.entityId
                  ? `${focusState.entityType}::${focusState.entityId}`
                  : "", getFocusEntityOptions(appState, boundQuestion ? boundQuestion.id : null), {
                  disabled: !boundQuestion
                })}
              </label>
            </div>
          </section>

          ${boundQuestion ? `
            <section class="panel-block content-card focus-input-card">
              <div class="focus-section-head">
                <div>
                  <div class="section-kicker">快速输入</div>
                  <h3 class="focus-section-title">${renderRichInlineFragment(boundQuestion.title)}</h3>
                </div>
                ${focusState.entityType && focusState.entityId ? `<span class="chip">当前聚焦：${escapeHtml(ENTITY_TYPE_LABELS[focusState.entityType] || focusState.entityType)}</span>` : ""}
              </div>
              <textarea class="focus-session-input focus-quick-input" data-input="focus-quick-input" placeholder="先写内容，再点下面的类型按钮提交。"></textarea>
              <div class="focus-quick-actions">
                <button class="secondary-button" data-action="submit-focus-event" data-note-type="progress">进展</button>
                <button class="secondary-button" data-action="submit-focus-event" data-note-type="insight">认识</button>
                <button class="secondary-button" data-action="submit-focus-event" data-note-type="obstacle">卡点</button>
                <button class="primary-button" data-action="submit-focus-event" data-note-type="next_step">下一步</button>
              </div>
            </section>
            ${renderFocusActionPanel(appState, uiState, boundQuestion.id, focusState)}
            ${renderTimelineList(appState, uiState, boundQuestion.id, focusState)}
          ` : `
            <section class="panel-block content-card">
              <div class="empty-state">
                <h3 class="empty-state-title">先绑定一个问题</h3>
                <p>Focus 里的输入都会进入绑定问题的时间线。</p>
              </div>
            </section>
          `}
        </div>
      </div>
    `
  }

  function getFocusStatusMeta(currentFocus) {
    if (!currentFocus || currentFocus.status === "active") {
      return {
        label: "进行中",
        chipClass: "is-accent",
        headline: "",
        description: ""
      }
    }

    if (currentFocus.status === "paused") {
      return {
        label: "已暂停",
        chipClass: "",
        headline: "",
        description: ""
      }
    }

    return {
      label: "已完成",
      chipClass: "is-success",
      headline: "",
      description: ""
    }
  }

  function renderFocusLifecycle(currentFocus) {
    const currentStep = currentFocus ? (currentFocus.status === "completed" ? 3 : 2) : 1
    const steps = [
      { index: 1, label: "绑定对象" },
      { index: 2, label: "记录推进" },
      { index: 3, label: "完成沉淀" }
    ]

    return `
      <section class="focus-lifecycle" aria-label="专注会话阶段">
        ${steps.map(function(step) {
          const stepClass = step.index < currentStep
            ? "is-complete"
            : step.index === currentStep
              ? "is-active"
              : ""
          return `
            <div class="focus-lifecycle-step ${stepClass}">
              <span class="focus-lifecycle-index">${step.index}</span>
              <span class="focus-lifecycle-label">${step.label}</span>
            </div>
          `
        }).join("")}
      </section>
    `
  }

  function renderFocusOverview(appState, currentFocus) {
    if (!currentFocus) return ""

    const questionId = getQuestionIdForEntity(appState, currentFocus.type, currentFocus.entityId)
    const question = questionId ? store.getQuestionById(questionId) : null
    const linkedCount = Array.isArray(currentFocus.linkedItems) ? currentFocus.linkedItems.length : 0
    const currentReading = currentFocus.currentReading && typeof currentFocus.currentReading === "object"
      ? currentFocus.currentReading
      : null
    const statusMeta = getFocusStatusMeta(currentFocus)

    return `
      <section class="focus-hero-card">
        <div class="section-kicker">当前焦点</div>
        <div class="focus-hero-head">
          <h3 class="focus-title md-rich-text md-rich-inline">${renderMarkdownInlineHtml(currentFocus.title)}</h3>
          <span class="chip ${statusMeta.chipClass}">${statusMeta.label}</span>
        </div>
        ${renderPrimaryBlock("div", "focus-subtitle", currentFocus.description, "未填写目标")}
        ${question ? `<div class="focus-context-line">问题：${renderRichInlineFragment(question.title)}</div>` : ""}
        <div class="focus-meta-grid">
          <article class="focus-meta-card">
            <span class="focus-meta-label">对象类型</span>
            <strong class="focus-meta-value">${escapeHtml(ENTITY_TYPE_LABELS[currentFocus.type] || currentFocus.type || "研究对象")}</strong>
          </article>
          <article class="focus-meta-card">
            <span class="focus-meta-label">已专注</span>
            <strong class="focus-meta-value">${escapeHtml(formatElapsedTime(currentFocus.startTime, currentFocus.endTime, currentFocus.updatedAt))}</strong>
          </article>
          <article class="focus-meta-card">
            <span class="focus-meta-label">当前阅读</span>
            <strong class="focus-meta-value">${currentReading && currentReading.title ? renderRichInlineFragment(currentReading.title) : "未同步"}</strong>
          </article>
          <article class="focus-meta-card">
            <span class="focus-meta-label">已关联项目</span>
            <strong class="focus-meta-value">${escapeHtml(linkedCount)} 项</strong>
          </article>
        </div>
      </section>
    `
  }

  function renderFocusCurrentReading(currentFocus) {
    const reading = currentFocus && currentFocus.currentReading && typeof currentFocus.currentReading === "object"
      ? currentFocus.currentReading
      : null
    if (!reading || !reading.bindingId) {
      return ""
    }

    const metaLine = [reading.authors || "作者未知", reading.year || "", reading.venue || ""]
      .filter(Boolean)
      .join(" · ")

    return `
      <section class="focus-recovery-card">
        <div class="focus-recovery-head">
          <div>
            <div class="section-kicker">当前阅读</div>
            <h3 class="focus-section-title md-rich-text md-rich-inline">${renderMarkdownInlineHtml(reading.title || reading.bindingId)}</h3>
          </div>
          <span class="chip is-accent">阅读中</span>
        </div>
        <div class="focus-recovery-copy">${escapeHtml(metaLine || "已同步")}</div>
        <div class="chip-row">
          ${reading.referenceType ? `<span class="chip">${escapeHtml(reading.referenceType)}</span>` : ""}
          ${reading.doi ? `<span class="chip">${escapeHtml(reading.doi)}</span>` : ""}
          ${reading.md5 ? `<span class="chip">docmd5</span>` : ""}
        </div>
        <div class="chip-row">
          <button class="secondary-button compact-button" data-action="open-literature-card" data-literature-id="${escapeHtml(reading.bindingId)}" data-open-mode="focusCard">打开文献</button>
          <button class="ghost-button compact-button" data-action="open-literature-card" data-literature-id="${escapeHtml(reading.bindingId)}" data-open-mode="focusCardAndEdit">文献详情</button>
        </div>
      </section>
    `
  }

  function renderFocusLinkedPreview(currentFocus) {
    const linkedItems = currentFocus && Array.isArray(currentFocus.linkedItems)
      ? currentFocus.linkedItems
      : []

    return `
      <section class="focus-linked-block">
        <div class="focus-section-head">
          <div>
            <div class="section-kicker">会话上下文</div>
            <h3 class="focus-section-title">已经挂进来的对象</h3>
          </div>
          <span class="chip">${escapeHtml(linkedItems.length)} 项</span>
        </div>
        ${linkedItems.length ? `
          <div class="focus-linked-list">
            ${linkedItems.slice(0, 6).map(function(item) {
              return `
                <article class="focus-linked-item">
                  <span class="focus-linked-type">${escapeHtml(ENTITY_TYPE_LABELS[item.type] || item.type || "对象")}</span>
                  <span class="focus-linked-title md-rich-text md-rich-inline">${renderMarkdownInlineHtml(item.title || item.id || "")}</span>
                </article>
              `
            }).join("")}
          </div>
        ` : `
          <div class="empty-state compact-empty-state">
            <h3 class="empty-state-title">还没挂上下文</h3>
          </div>
        `}
      </section>
    `
  }

  function getLinkableItems(appState, currentFocus) {
    if (!currentFocus) return []
    const questionId = getQuestionIdForEntity(appState, currentFocus.type, currentFocus.entityId)
    if (!questionId) return []
    const linkedItems = Array.isArray(currentFocus.linkedItems) ? currentFocus.linkedItems : []

    function isLinked(type, id) {
      if (currentFocus.type === type && currentFocus.entityId === id) return true
      return linkedItems.some(function(item) {
        return item.type === type && item.id === id
      })
    }

    const items = []

    appState.examples
      .filter(function(item) { return item.questionId === questionId })
      .forEach(function(item) {
        if (isLinked("example", item.id)) return
        items.push({
          type: "example",
          id: item.id,
          title: item.content,
          description: item.conclusion || "",
          meta: dataAPI.EXAMPLE_TYPE_LABELS[item.type] || "样例"
        })
      })

    appState.insights
      .filter(function(item) { return item.questionId === questionId })
      .forEach(function(item) {
        if (isLinked("insight", item.id)) return
        items.push({
          type: "insight",
          id: item.id,
          title: item.content,
          description: "",
          meta: dataAPI.INSIGHT_TYPE_LABELS[item.type] || "认识"
        })
      })

    appState.literature
      .filter(function(item) {
        return Array.isArray(item.questionIds) && item.questionIds.indexOf(questionId) >= 0
      })
      .forEach(function(item) {
        if (isLinked("literature", item.id)) return
        items.push({
          type: "literature",
          id: item.id,
          title: item.title,
          description: item.authors || "",
          meta: "文献"
        })
      })

    appState.judgments
      .filter(function(item) { return item.questionId === questionId })
      .forEach(function(item) {
        if (isLinked("judgment", item.id)) return
        items.push({
          type: "judgment",
          id: item.id,
          title: item.content,
          description: "",
          meta: dataAPI.JUDGMENT_TYPE_LABELS[item.type] || "判断"
        })
      })

    appState.strategies
      .filter(function(item) { return item.questionId === questionId })
      .forEach(function(item) {
        if (isLinked("strategy", item.id)) return
        items.push({
          type: "strategy",
          id: item.id,
          title: item.name,
          description: item.description || item.rationale || "",
          meta: summarizeStrategyMethodTags(item, "策略")
        })
      })

    appState.obstacles
      .filter(function(item) { return item.questionId === questionId })
      .forEach(function(item) {
        if (isLinked("obstacle", item.id)) return
        items.push({
          type: "obstacle",
          id: item.id,
          title: item.content,
          description: item.clueDescription || "",
          meta: dataAPI.OBSTACLE_TYPE_LABELS[item.type] || "障碍"
        })
      })

    return items
  }

  function renderFocusLinkPicker(appState, uiState, currentFocus) {
    if (!currentFocus) return ""
    const searchQuery = String((uiState && uiState.focusLinkQuery) || "").trim().toLowerCase()
    const items = getLinkableItems(appState, currentFocus).filter(function(item) {
      if (!searchQuery) return true
      return `${item.title} ${item.description} ${item.meta}`.toLowerCase().indexOf(searchQuery) >= 0
    })

    return `
      <section class="focus-link-picker">
        <div class="focus-section-head">
          <div>
            <div class="section-kicker">关联对象</div>
            <h3 class="focus-section-title">可关联内容</h3>
          </div>
          <span class="chip">${escapeHtml(items.length)} 项</span>
        </div>
        <input class="focus-target-search" type="search" placeholder="搜索可关联内容..." value="${escapeHtml((uiState && uiState.focusLinkQuery) || "")}" data-input="focus-link-query">
        <div class="focus-target-list">
          ${items.length ? items.slice(0, 8).map(function(item) {
            return `
              <article class="focus-target-item">
                <span class="focus-target-type">${escapeHtml(ENTITY_TYPE_LABELS[item.type] || item.type)}</span>
                <span class="focus-target-title md-rich-text md-rich-inline">${renderMarkdownInlineHtml(item.title)}</span>
                ${item.description ? renderRichBlockTag("div", "focus-target-description", item.description) : ""}
                <div class="focus-target-actions">
                  <span class="focus-target-meta">${escapeHtml(item.meta)}</span>
                  <button
                    class="ghost-button compact-button"
                    data-action="link-focus-item"
                    data-focus-id="${escapeHtml(currentFocus.id)}"
                    data-link-type="${escapeHtml(item.type)}"
                    data-link-id="${escapeHtml(item.id)}"
                    data-link-title="${escapeHtml(item.title)}"
                  >关联</button>
                </div>
              </article>
            `
          }).join("") : `
            <div class="empty-state compact-empty-state">
              <h3 class="empty-state-title">没有可关联项</h3>
            </div>
          `}
        </div>
      </section>
    `
  }

  function renderSuggestedAction(action) {
    if (!action) return ""
    const actionTabMap = {
      clarify_question: "formulation",
      verify_hypothesis: "judgments",
      resolve_block: "obstacles",
      add_evidence: "examples",
      explore_thought: "strategies",
      repair_branch: "strategies",
      review_literature: "overview",
      close_loop: "overview"
    }
    const priorityClass = action.priority === "high" ? "is-danger" : action.priority === "medium" ? "is-accent" : ""
    return `
      <article class="list-item">
        <div class="list-title-row">
          ${renderRichInlineTag("h3", "list-item-title", action.title)}
          <span class="chip ${priorityClass}">${escapeHtml(action.priority === "high" ? "高优先级" : action.priority === "medium" ? "中优先级" : "低优先级")}</span>
        </div>
        ${renderRichBlockTag("div", "list-item-body", action.description)}
        <div class="chip-row">
          <span class="chip">${escapeHtml(ENTITY_TYPE_LABELS[action.relatedEntityType] || action.relatedEntityType || "研究对象")}</span>
          <button
            class="ghost-button compact-button"
            data-action="apply-suggested-action"
            data-related-type="${escapeHtml(action.relatedEntityType || "")}"
            data-related-id="${escapeHtml(action.relatedEntityId || "")}"
            data-target-tab="${escapeHtml(actionTabMap[action.type] || "overview")}"
          >打开</button>
        </div>
      </article>
    `
  }

  function renderQuestionLifecycleCard(question, appState) {
    const lifecycle = getQuestionLifecycle(appState, question.id)
    if (!lifecycle) return ""

    const counts = lifecycle.counts || {}
    const deleteLabel = counts.children ? "删除问题树" : "删除问题"

    return `
      <section class="panel-block content-card question-lifecycle-card ${lifecycle.tone === "danger" ? "is-danger" : lifecycle.tone === "success" ? "is-success" : ""}">
        <div class="question-lifecycle-head">
          <div>
            <div class="section-kicker">问题生命周期</div>
            <h3 class="card-title">${escapeHtml(lifecycle.stageLabel)}</h3>
          </div>
          <span class="chip ${getToneChipClass(lifecycle.tone)}">${escapeHtml(`完成 ${lifecycle.completedSteps}/${lifecycle.totalSteps}`)}</span>
        </div>
        <div class="question-lifecycle-track" aria-label="问题推进阶段">
          ${(lifecycle.steps || []).map(function(step, index) {
            const isActive = lifecycle.currentStep === index + 1
            return `
              <div class="question-lifecycle-step ${step.done ? "is-complete" : isActive ? "is-active" : ""}">
                <span class="question-lifecycle-index">${index + 1}</span>
                <span class="question-lifecycle-label">${escapeHtml(step.label)}</span>
              </div>
            `
          }).join("")}
        </div>
        <div class="chip-row">
          ${renderSectionJumpButton({ questionId: question.id, tab: "formulation", text: counts.formulations ? `表述 ${counts.formulations}` : question.description ? "表述未入版" : "表述 0", className: "chip count-chip-button" })}
          ${renderSectionJumpButton({ questionId: question.id, tab: "judgments", text: `判断 ${counts.judgments || 0}`, className: "chip count-chip-button" })}
          ${renderSectionJumpButton({ questionId: question.id, tab: "strategies", text: `策略 ${counts.strategies || 0}`, className: "chip count-chip-button" })}
          ${counts.actions ? `<span class="chip">动作 ${escapeHtml(counts.actions)}</span>` : ""}
          ${renderSectionJumpButton({ questionId: question.id, tab: "examples", text: `样例 ${counts.examples || 0}`, className: "chip count-chip-button" })}
          ${renderSectionJumpButton({ questionId: question.id, tab: "obstacles", text: `障碍 ${counts.obstacles || 0}`, className: "chip count-chip-button" })}
          ${renderSectionJumpButton({ questionId: question.id, tab: "insights", text: `认识 ${counts.insights || 0}`, className: "chip count-chip-button" })}
          ${counts.timelineEvents ? `<span class="chip">时间线 ${escapeHtml(counts.timelineEvents)}</span>` : ""}
          ${counts.children ? `<span class="chip">子问题 ${escapeHtml(counts.children)}</span>` : ""}
          ${counts.derivedQuestions ? `<span class="chip">已接线分支 ${escapeHtml(counts.derivedQuestions)}</span>` : ""}
          ${counts.orphanChildQuestions ? `<span class="chip is-danger">悬空子问题 ${escapeHtml(counts.orphanChildQuestions)}</span>` : ""}
          ${counts.pendingFeedbackQuestions ? `<span class="chip is-accent">待回流 ${escapeHtml(counts.pendingFeedbackQuestions)}</span>` : ""}
        </div>
        <div class="question-quick-actions">
          <button class="ghost-button compact-action-button" data-action="open-edit-modal" data-edit-type="question" data-edit-id="${escapeHtml(question.id)}">编辑问题</button>
          ${question.status !== "active" ? `
            <button class="secondary-button compact-action-button" data-action="set-question-status" data-question-id="${escapeHtml(question.id)}" data-question-status="active">恢复推进</button>
          ` : `
            <button class="secondary-button compact-action-button" data-action="set-question-status" data-question-id="${escapeHtml(question.id)}" data-question-status="paused">暂停问题</button>
          `}
          ${question.status !== "resolved" ? `
            <button class="primary-button compact-action-button" data-action="set-question-status" data-question-id="${escapeHtml(question.id)}" data-question-status="resolved">标记已解决</button>
          ` : ""}
          ${question.status !== "archived" ? `
            <button class="ghost-button compact-action-button" data-action="set-question-status" data-question-id="${escapeHtml(question.id)}" data-question-status="archived">归档</button>
          ` : ""}
          <button class="danger-button compact-action-button" data-action="open-question-delete-modal" data-question-id="${escapeHtml(question.id)}">${deleteLabel}</button>
        </div>
      </section>
    `
  }

  function renderDashboard(appState) {
    const snapshot = store.getSnapshot()
    const roots = store.getQuestionTree()
    const focusState = getFocusState(appState)
    const focusQuestion = focusState.questionId ? store.getQuestionById(focusState.questionId) : null
    const focusEntity = focusState.entityType === "strategy"
      ? appState.strategies.find(function(item) { return item.id === focusState.entityId })
      : focusState.entityType === "action"
        ? appState.actions.find(function(item) { return item.id === focusState.entityId })
        : null
    const hotJudgments = appState.judgments.slice().reverse().slice(0, 4)
    const recentInsights = appState.insights.slice().reverse().slice(0, 4)
    const recentTimelineEvents = (Array.isArray(appState.timelineEvents) ? appState.timelineEvents : [])
      .slice()
      .sort(function(left, right) {
        return compareTimeDesc(left.createdAt, right.createdAt)
      })
      .slice(0, 5)
    const recentActions = (Array.isArray(appState.actions) ? appState.actions : [])
      .slice()
      .sort(function(left, right) {
        return String(right.updatedAt || "").localeCompare(String(left.updatedAt || ""), "zh-CN")
      })
      .slice(0, 5)
    const blockedStrategies = appState.strategies.filter((item) => item.status === "blocked" || item.status === "stalled")
    const suggestedNextSteps = snapshot.suggestedNextSteps || []

    return `
      <div class="workspace-view dashboard-view">
        <section class="workspace-intro">
          <div class="section-kicker">研究驾驶舱</div>
          <h1 class="page-title">研究驾驶舱</h1>
        </section>

        <section class="panel-block content-card feature-card">
          <div class="section-kicker">当前焦点</div>
          ${focusQuestion ? `
            ${renderRichInlineTag("h3", "card-title", focusQuestion.title)}
            <div class="chip-row">
              <span class="chip">绑定问题</span>
              ${focusEntity ? `<span class="chip is-accent">${renderRichInlineSummary("当前聚焦 · ", focusEntity.title || focusEntity.name || "", "")}</span>` : ""}
              <button class="ghost-button compact-button" data-action="show-focus-view">打开 Focus</button>
            </div>
          ` : `
            <h3 class="card-title">还没有绑定的 Focus 问题</h3>
          `}
        </section>

        <div class="dashboard-grid">
          ${renderMetricCard("研究问题", snapshot.totalQuestions, `${snapshot.activeQuestions} 个仍在推进，${snapshot.archivedQuestions || 0} 个已归档`)}
          ${renderMetricCard("待写清", snapshot.draftQuestions || 0, "这些问题还没形成可推进表述")}
          ${renderMetricCard("受阻问题", snapshot.blockedQuestions || 0, `${snapshot.blockedStrategies || 0} 条策略已经卡住`)}
          ${renderMetricCard("待收口", snapshot.readyToCloseQuestions || 0, "已经有结果，别再无限发散")}
          ${renderMetricCard("分支健康", snapshot.linkedChildQuestions || 0, `${snapshot.orphanChildQuestions || 0} 个悬空，${snapshot.fedBackChildQuestions || 0} 个已回流`)}
        </div>

        <div class="split-grid">
          <section class="panel-block content-card">
            <div class="section-kicker">判断</div>
            <div class="list-stack">
              ${hotJudgments.length ? hotJudgments.map((item) => `
                <article class="list-item">
                  <div class="list-title-row">
                    ${renderRichInlineTag("h3", "list-item-title", item.content)}
                    <span class="chip is-accent">${escapeHtml(formatMappedValue(item.status, dataAPI.JUDGMENT_STATUS_LABELS) || item.status)}</span>
                  </div>
                  <div class="list-item-body">关联问题：${renderRichInlineFragment((store.getQuestionById(item.questionId) || {}).title || "未找到")}</div>
                </article>
              `).join("") : `
                <div class="empty-state">
                  <h3 class="empty-state-title">还没有判断</h3>
                </div>
              `}
            </div>
          </section>

          <section class="panel-block content-card">
            <div class="section-kicker">最近认识</div>
            <div class="list-stack">
              ${recentInsights.length ? recentInsights.map((item) => `
                <article class="list-item is-success">
                  <div class="list-title-row">
                    ${renderRichInlineTag("h3", "list-item-title", item.content)}
                    <span class="chip is-success">${escapeHtml(dataAPI.INSIGHT_TYPE_LABELS[item.type] || item.type)}</span>
                  </div>
                  <div class="list-item-body">来自 ${renderRichInlineFragment((store.getQuestionById(item.questionId) || {}).title || "未找到问题")}</div>
                </article>
              `).join("") : `
                <div class="empty-state">
                  <h3 class="empty-state-title">还没有认识</h3>
                </div>
              `}
            </div>
          </section>
        </div>

        <section class="panel-block content-card">
          <div class="section-kicker">问题</div>
          <div class="list-stack">
            ${roots.length ? roots.map((question) => `
              ${(() => {
                const lifecycle = getQuestionLifecycle(appState, question.id)
                const branchHealth = researchCore && typeof researchCore.computeBranchHealth === "function"
                  ? researchCore.computeBranchHealth(appState, question.id)
                  : null
                return `
              <article class="list-item ${lifecycle && lifecycle.tone === "danger" ? "is-danger" : lifecycle && lifecycle.tone === "success" ? "is-success" : blockedStrategies.some((item) => item.questionId === question.id) ? "is-danger" : ""}">
                <div class="list-title-row">
                  ${renderRichInlineTag("h3", "list-item-title", question.title)}
                  <span class="chip ${lifecycle ? getToneChipClass(lifecycle.tone) : ""}">${escapeHtml(lifecycle ? lifecycle.stageLabel : (dataAPI.STATUS_LABELS[question.status] || question.status))}</span>
                </div>
                ${renderPrimaryBlock("div", "list-item-body", question.description, "未填写描述")}
                ${branchHealth && (branchHealth.linkedChildQuestions || branchHealth.orphanChildQuestions || branchHealth.fedBackChildQuestions) ? `
                  <div class="chip-row">
                    ${branchHealth.linkedChildQuestions ? `<span class="chip">已接线分支 ${escapeHtml(branchHealth.linkedChildQuestions)}</span>` : ""}
                    ${branchHealth.fedBackChildQuestions ? `<span class="chip is-success">已回流 ${escapeHtml(branchHealth.fedBackChildQuestions)}</span>` : ""}
                    ${branchHealth.orphanChildQuestions ? `<span class="chip is-danger">悬空 ${escapeHtml(branchHealth.orphanChildQuestions)}</span>` : ""}
                  </div>
                ` : ""}
                <div class="chip-row">
                  ${renderSectionJumpButton({ questionId: question.id, tab: "judgments", text: `判断 ${question.judgments.length}`, className: "chip count-chip-button" })}
                  ${renderSectionJumpButton({ questionId: question.id, tab: "strategies", text: `策略 ${question.strategies.length}`, className: "chip count-chip-button" })}
                  ${renderSectionJumpButton({ questionId: question.id, tab: "examples", text: `样例 ${question.examples.length}`, className: "chip count-chip-button" })}
                  ${renderSectionJumpButton({ questionId: question.id, tab: "insights", text: `认识 ${question.insights.length}`, className: "chip count-chip-button" })}
                  <button class="ghost-button compact-button" data-action="select-question" data-question-id="${escapeHtml(question.id)}">进入工作台</button>
                  <button class="ghost-button compact-button" data-action="add-child-question" data-parent-id="${escapeHtml(question.id)}">拆子问题</button>
                </div>
              </article>
                `
              })()}
            `).join("") : `
              <div class="empty-state">
                <h3 class="empty-state-title">${escapeHtml(dataAPI.RESEARCH_COPY.emptyWorkspaceTitle)}</h3>
              </div>
            `}
          </div>
        </section>

        <section class="panel-block content-card">
              <div class="section-kicker">最近时间线</div>
          <div class="list-stack">
            ${recentTimelineEvents.length ? recentTimelineEvents.map(function(event) {
              return renderTimelineEventRow(event, appState)
            }).join("") : `
              <div class="empty-state">
                <h3 class="empty-state-title">还没有时间线事件</h3>
              </div>
            `}
          </div>
        </section>

        <section class="panel-block content-card">
          <div class="section-kicker">最近动作</div>
          <div class="list-stack">
            ${recentActions.length ? recentActions.map((actionItem) => `
              <article class="list-item">
                <div class="list-title-row">
                  ${renderRichInlineTag("h3", "list-item-title", actionItem.title)}
                  <span class="chip">${escapeHtml(dataAPI.ACTION_STATUS_LABELS[actionItem.status] || actionItem.status)}</span>
                </div>
                ${actionItem.description ? renderRichBlockTag("div", "list-item-body", actionItem.description) : ""}
                <div class="chip-row">
                  <button class="ghost-button compact-button" data-action="set-focus-entity" data-entity-type="action" data-entity-id="${escapeHtml(actionItem.id)}">设为当前聚焦</button>
                  <button class="ghost-button compact-button" data-action="open-edit-modal" data-edit-type="action-item" data-edit-id="${escapeHtml(actionItem.id)}">查看详情</button>
                </div>
              </article>
            `).join("") : `
              <div class="empty-state">
                <h3 class="empty-state-title">还没有动作</h3>
              </div>
            `}
          </div>
        </section>

        <section class="panel-block content-card">
          <div class="section-kicker">建议下一步</div>
          <div class="list-stack">
            ${suggestedNextSteps.length ? suggestedNextSteps.map(renderSuggestedAction).join("") : `
              <div class="empty-state">
                <h3 class="empty-state-title">暂无自动建议</h3>
              </div>
            `}
          </div>
        </section>

      </div>
    `
  }

  function getQuestionFormulationState(question) {
    const formulations = store.getState().formulations.filter(function(item) {
      return item.questionId === question.id
    })
    const currentFormulation = formulations.find(function(item) {
      return item.id === question.currentFormulationId
    }) || null
    const versionStatusLabel = currentFormulation
      ? `当前使用 · v${currentFormulation.version}`
      : question.description
        ? "当前描述未入版"
        : "还没有表述版本"
    const formulationActionLabel = currentFormulation
      ? "新建表述版本"
      : question.description
        ? "收为首版表述"
        : "写首版表述"

    return {
      formulations: formulations,
      currentFormulation: currentFormulation,
      versionStatusLabel: versionStatusLabel,
      formulationActionLabel: formulationActionLabel
    }
  }

  function renderTabToolbar(options) {
    return `
      <section class="panel-block tab-toolbar ${escapeHtml(options.className || "")}">
        <div class="tab-toolbar-head">
          <div class="tab-toolbar-copy">
            <div class="section-kicker">${escapeHtml(options.kicker || "")}</div>
            <h3 class="tab-toolbar-title">${escapeHtml(options.title || "")}</h3>
          </div>
          <div class="tab-toolbar-actions">
            ${options.metaHtml || ""}
            ${options.actionsHtml || ""}
          </div>
        </div>
        ${options.extraHtml ? `<div class="tab-toolbar-extra">${options.extraHtml}</div>` : ""}
      </section>
    `
  }

  function renderTabEmptyState(title, body, actionsHtml) {
    return `
      <div class="empty-state tab-empty-state">
        <h3 class="empty-state-title">${escapeHtml(title || "还没有内容")}</h3>
        ${body ? `<p>${escapeHtml(body)}</p>` : ""}
        ${actionsHtml ? `<div class="empty-state-actions">${actionsHtml}</div>` : ""}
      </div>
    `
  }

  function renderFormulationOverviewSection(question) {
    const formulationState = getQuestionFormulationState(question)
    const formulations = formulationState.formulations
    const currentFormulation = formulationState.currentFormulation
    const formulationActionLabel = formulationState.formulationActionLabel

    return `
      <section class="panel-block content-card">
        <div class="section-kicker">问题表述</div>
        <div class="tab-section-head">
          <div>
            <h3 class="card-title">当前表述</h3>
          </div>
          <button class="secondary-button compact-action-button" data-action="open-edit-modal" data-edit-type="new-formulation" data-edit-id="${escapeHtml(question.id)}">${escapeHtml(formulationActionLabel)}</button>
        </div>
        <div class="list-stack">
          ${currentFormulation ? `
            <article class="list-item">
              <div class="list-title-row">
                <h4 class="list-item-title">当前表述 v${escapeHtml(currentFormulation.version)}</h4>
                <span class="chip is-accent">${escapeHtml(currentFormulation.isAbandoned ? "已放弃" : "当前使用")}</span>
              </div>
              ${renderPrimaryBlock("div", "list-item-body", currentFormulation.content, "未填写表述")}
              ${currentFormulation.reason ? `<div class="list-item-footnote">采用原因：${renderRichInlineFragment(currentFormulation.reason)}</div>` : ""}
            </article>
          ` : question.description ? `
            <article class="list-item">
              <div class="list-title-row">
                <h4 class="list-item-title">当前描述（未版本化）</h4>
                <span class="chip">${escapeHtml(formulationState.versionStatusLabel)}</span>
              </div>
              ${renderPrimaryBlock("div", "list-item-body", question.description, "未填写表述")}
            </article>
          ` : `
            ${renderTabEmptyState(
              "还没有问题表述",
              "",
              `<button class="primary-button" data-action="open-edit-modal" data-edit-type="new-formulation" data-edit-id="${escapeHtml(question.id)}">${escapeHtml(formulationActionLabel)}</button>`
            )}
          `}
        </div>
      </section>
    `
  }

  function renderFormulationSection(question) {
    const formulationState = getQuestionFormulationState(question)
    const formulations = formulationState.formulations
    const currentFormulation = formulationState.currentFormulation
    const versionStatusLabel = formulationState.versionStatusLabel
    const formulationActionLabel = formulationState.formulationActionLabel

    return `
      ${renderTabToolbar({
        kicker: "问题表述",
        title: "问题表述",
        metaHtml: `<span class="chip ${currentFormulation ? "is-accent" : ""}">${escapeHtml(formulations.length ? `${formulations.length} 个版本` : "0 个版本")}</span>`,
        actionsHtml: `<button class="secondary-button compact-action-button" data-action="open-edit-modal" data-edit-type="new-formulation" data-edit-id="${escapeHtml(question.id)}">${escapeHtml(formulationActionLabel)}</button>`
      })}

      <section class="panel-block content-card" data-section="formulation-current">
        <div class="section-kicker">当前工作表述</div>
        <div class="tab-section-head">
          <div>
            <h3 class="card-title">${escapeHtml(currentFormulation ? `当前表述 v${currentFormulation.version}` : question.description ? "当前描述（未版本化）" : "未填写表述")}</h3>
          </div>
          ${currentFormulation ? `
            <button class="ghost-button compact-action-button" data-action="open-edit-modal" data-edit-type="formulation" data-edit-id="${escapeHtml(currentFormulation.id)}" data-edit-parent-id="${escapeHtml(question.id)}">编辑当前版本</button>
          ` : ""}
        </div>
        <div class="list-stack">
          ${currentFormulation ? `
            <article class="list-item">
              <div class="list-title-row">
                <h4 class="list-item-title">版本状态</h4>
                <span class="chip is-accent">${escapeHtml(currentFormulation.isAbandoned ? "已放弃" : "当前使用")}</span>
              </div>
              ${renderPrimaryBlock("div", "list-item-body", currentFormulation.content, "未填写表述")}
              ${currentFormulation.constraints && currentFormulation.constraints.length ? `<div class="chip-row">${currentFormulation.constraints.map((item) => `<span class="chip md-rich-text md-rich-inline">${renderMarkdownInlineHtml(item)}</span>`).join("")}</div>` : ""}
              ${currentFormulation.reason ? `<div class="list-item-footnote">采用原因：${renderRichInlineFragment(currentFormulation.reason)}</div>` : ""}
            </article>
          ` : question.description ? `
            <article class="list-item">
              <div class="list-title-row">
                <h4 class="list-item-title">当前描述</h4>
                <span class="chip">${escapeHtml(versionStatusLabel)}</span>
              </div>
              ${renderPrimaryBlock("div", "list-item-body", question.description, "未填写表述")}
            </article>
          ` : `
            ${renderTabEmptyState(
              "还没有问题表述",
              "",
              `<button class="primary-button" data-action="open-edit-modal" data-edit-type="new-formulation" data-edit-id="${escapeHtml(question.id)}">${escapeHtml(formulationActionLabel)}</button>`
            )}
          `}
        </div>
      </section>

      <section class="panel-block content-card" data-section="formulation-history">
        <div class="section-kicker">版本历史</div>
        <div class="tab-section-head">
          <div>
            <h3 class="card-title">版本历史</h3>
          </div>
          <span class="chip">${escapeHtml(formulations.length ? `${formulations.length} 个版本` : "暂无版本")}</span>
        </div>
        ${formulations.length ? `
          <div class="list-stack">
            ${formulations.slice().reverse().map((item) => `
              <article class="list-item">
                <div class="list-title-row">
                  <h4 class="list-item-title">v${escapeHtml(item.version)} · <span class="md-rich-text md-rich-inline">${renderMarkdownInlineHtml(item.content || "")}</span></h4>
                  <span class="chip ${item.id === question.currentFormulationId ? "is-accent" : ""}">${item.id === question.currentFormulationId ? "当前" : formatRelativeTime(item.updatedAt)}</span>
                </div>
                ${item.reason ? renderRichBlockTag("div", "list-item-body", item.reason) : ""}
                <div class="chip-row">
                  <button class="ghost-button compact-button" data-action="open-edit-modal" data-edit-type="formulation" data-edit-id="${escapeHtml(item.id)}" data-edit-parent-id="${escapeHtml(question.id)}">编辑版本</button>
                  ${item.id !== question.currentFormulationId ? `
                    <button class="ghost-button compact-button" data-action="set-current-formulation" data-question-id="${escapeHtml(question.id)}" data-formulation-id="${escapeHtml(item.id)}">设为当前</button>
                  ` : ""}
                  <button class="ghost-button compact-button" data-action="open-delete-modal" data-delete-type="formulation" data-delete-id="${escapeHtml(item.id)}" data-delete-parent-id="${escapeHtml(question.id)}">删除版本</button>
                </div>
              </article>
            `).join("")}
          </div>
        ` : renderTabEmptyState(
          "还没有版本历史",
          "",
          `<button class="secondary-button" data-action="open-edit-modal" data-edit-type="new-formulation" data-edit-id="${escapeHtml(question.id)}">${escapeHtml(formulationActionLabel)}</button>`
        )}
      </section>

      <section class="panel-block content-card">
        <div class="section-kicker">问题信息</div>
        <div class="tab-section-head">
          <div>
            <h3 class="card-title">问题信息</h3>
          </div>
          <button class="ghost-button compact-action-button" data-action="open-edit-modal" data-edit-type="question" data-edit-id="${escapeHtml(question.id)}">编辑问题</button>
        </div>
        <div class="list-stack">
          <article class="list-item">
            <div class="list-title-row">
              <h4 class="list-item-title">问题标题</h4>
              <span class="chip is-accent">${escapeHtml(dataAPI.STATUS_LABELS[question.status] || question.status)}</span>
            </div>
            ${renderPrimaryBlock("div", "list-item-body", question.title, "未命名问题")}
          </article>
          <article class="list-item">
            <div class="list-title-row">
              <h4 class="list-item-title">表述快照</h4>
              <span class="chip">${escapeHtml(versionStatusLabel)}</span>
            </div>
            ${renderPrimaryBlock("div", "list-item-body", question.description, "未填写问题描述")}
          </article>
        </div>
      </section>
    `
  }

  function renderOverviewTab(question, judgments, strategies, examples, insights, obstacles, appState) {
    const blocked = obstacles && obstacles.length
      ? obstacles.find(function(item) { return !!item.isCoreProblem }) || obstacles[0]
      : strategies.find((item) => item.status === "blocked" || item.status === "stalled")
    const promising = strategies.find((item) => item.status === "promising") || strategies[0]
    const keyJudgment = judgments.find((item) => item.status !== "converged") || judgments[0]
    const currentInsight = insights[0]

    return `
      <section class="panel-block content-card" data-section="overview">
        <div class="section-kicker">总览</div>
        <h3 class="card-title">当前内容</h3>
        <div class="list-stack">
          <article class="list-item">
            <h4 class="list-item-title">当前表述</h4>
            ${renderPrimaryBlock("div", "list-item-body", question.description, "未填写表述")}
          </article>
          <article class="list-item">
            <h4 class="list-item-title">关键判断</h4>
            ${renderPrimaryBlock("div", "list-item-body", keyJudgment ? keyJudgment.content : "", "暂无判断")}
          </article>
          <article class="list-item">
            <h4 class="list-item-title">当前策略</h4>
            ${renderPrimaryBlock("div", "list-item-body", promising ? (promising.description || promising.rationale || promising.name) : "", "暂无策略")}
          </article>
          <article class="list-item ${blocked ? "is-danger" : ""}">
            <h4 class="list-item-title">当前障碍</h4>
            ${renderPrimaryBlock("div", "list-item-body", blocked ? blocked.content || blocked.failureReason || blocked.description : "", "暂无障碍")}
          </article>
          <article class="list-item is-success">
            <h4 class="list-item-title">当前认识</h4>
            ${renderPrimaryBlock("div", "list-item-body", currentInsight ? currentInsight.content : "", "暂无认识")}
          </article>
          <article class="list-item">
            <h4 class="list-item-title">下一步</h4>
            ${renderPrimaryBlock("div", "list-item-body", blocked ? `处理：${blocked.content || blocked.failureReason || blocked.description}` : keyJudgment ? `验证：${keyJudgment.content}` : "补一条判断", "暂无建议")}
          </article>
        </div>
      </section>

      ${renderBranchMapSection(question, appState)}

      ${renderFormulationOverviewSection(question)}
    `
  }

  function renderJudgmentTab(question, judgments) {
    return `
      ${renderTabToolbar({
        kicker: "判断",
        title: "判断",
        metaHtml: `<span class="chip is-accent">${escapeHtml(`${judgments.length} 条判断`)}</span>`,
        actionsHtml: `<button class="primary-button compact-action-button" data-action="open-edit-modal" data-edit-type="new-judgment" data-edit-id="${escapeHtml(question.id)}">添加判断</button>`
      })}

      <section class="panel-block content-card" data-section="judgments">
        <div class="list-stack tab-list-stack">
          ${judgments.length ? judgments.map((item, index) => `
            <article class="list-item">
              <div class="list-title-row">
                ${renderRichInlineTag("h4", "list-item-title", item.content)}
                <span class="chip is-accent">${escapeHtml(formatMappedValue(item.status, dataAPI.JUDGMENT_STATUS_LABELS) || item.status)}</span>
              </div>
              <div class="chip-row">
                <span class="chip">${escapeHtml(dataAPI.JUDGMENT_TYPE_LABELS[item.type] || item.type || "判断")}</span>
              </div>
              <div class="chip-row">
                ${renderReorderControls("judgment", item.id, index, judgments.length)}
                <button
                  class="ghost-button compact-button"
                  data-action="start-focus"
                  data-focus-type="judgment"
                  data-focus-entity-id="${escapeHtml(item.id)}"
                  data-focus-title="${escapeHtml(item.content)}"
                  data-focus-description="${escapeHtml(item.content)}"
                >专注此项</button>
                <button class="ghost-button compact-button" data-action="open-edit-modal" data-edit-type="judgment" data-edit-id="${escapeHtml(item.id)}">编辑</button>
                <button class="ghost-button compact-button" data-action="open-delete-modal" data-delete-type="judgment" data-delete-id="${escapeHtml(item.id)}">删除</button>
              </div>
            </article>
          `).join("") : `
            ${renderTabEmptyState(
              "还没有判断",
              "",
              `<button class="primary-button" data-action="open-edit-modal" data-edit-type="new-judgment" data-edit-id="${escapeHtml(question.id)}">添加第一条判断</button>`
            )}
          `}
        </div>
      </section>
    `
  }

  function renderStrategyTab(question, strategies, appState) {
    return `
      ${renderTabToolbar({
        kicker: "策略",
        title: "策略",
        metaHtml: `<span class="chip">${escapeHtml(`${strategies.length} 条策略`)}</span>`,
        actionsHtml: `<button class="primary-button compact-action-button" data-action="open-edit-modal" data-edit-type="new-strategy" data-edit-id="${escapeHtml(question.id)}">添加策略</button>`
      })}

      <section class="panel-block content-card" data-section="strategies">
        <div class="list-stack tab-list-stack">
          ${strategies.length ? strategies.map((item, index) => `
            <article class="list-item ${item.status === "blocked" || item.status === "failed" ? "is-danger" : ""}">
              <div class="list-title-row">
                ${renderRichInlineTag("h4", "list-item-title", item.name)}
                <span class="chip">${escapeHtml(dataAPI.STRATEGY_STATUS_LABELS[item.status] || item.status)}</span>
              </div>
              ${renderPrimaryBlock("div", "list-item-body", item.description || item.rationale, "未填写说明")}
              <div class="chip-row">
                ${renderStrategyMethodTagChips(item)}
                <span class="chip">${escapeHtml(formatMappedValue(item.branchIntent, dataAPI.STRATEGY_BRANCH_INTENT_LABELS) || "角色未定")}</span>
                ${item.outcomeMode !== "stay_strategy" ? `<span class="chip is-accent">${escapeHtml(dataAPI.STRATEGY_OUTCOME_MODE_LABELS[item.outcomeMode] || item.outcomeMode)}</span>` : ""}
              </div>
              ${(() => {
                const linkedQuestions = getOutgoingStrategyBranchLinks(appState, item.id)
                  .filter(function(link) { return link.targetType === "question" })
                  .map(function(link) {
                    const targetQuestion = store.getQuestionById(link.targetId)
                    if (!targetQuestion) return ""
                    const relation = dataAPI.BRANCH_ROLE_LABELS[link.branchRole] || dataAPI.BRANCH_RELATION_LABELS[link.relationType] || "分支"
                    return `
                      <button
                        class="chip count-chip-button"
                        data-action="select-question"
                        data-question-id="${escapeHtml(targetQuestion.id)}"
                      >${renderRichInlineSummary(`${relation} · `, targetQuestion.title, "")}</button>
                    `
                  })
                  .filter(Boolean)
                return linkedQuestions.length
                  ? `<div class="chip-row">${linkedQuestions.join("")}</div>`
                  : `<div class="chip-row"><span class="chip">未拆出子问题</span></div>`
              })()}
              ${item.failureReason ? `<div class="chip-row"><span class="chip is-danger md-rich-text md-rich-inline">${renderMarkdownInlineHtml(item.failureReason)}</span></div>` : ""}
              <div class="chip-row">
                ${renderReorderControls("strategy", item.id, index, strategies.length)}
                <button
                  class="ghost-button compact-button"
                  data-action="start-focus"
                  data-focus-type="strategy"
                  data-focus-entity-id="${escapeHtml(item.id)}"
                  data-focus-title="${escapeHtml(item.name)}"
                  data-focus-description="${escapeHtml(item.description || item.rationale || "")}"
                >专注此项</button>
                <button
                  class="secondary-button compact-button"
                  data-action="add-child-question"
                  data-parent-id="${escapeHtml(question.id)}"
                  data-source-strategy-id="${escapeHtml(item.id)}"
                  data-branch-role="subproblem"
                  data-contribution-type="answer_parent"
                >拆成子问题</button>
                <button
                  class="ghost-button compact-button"
                  data-action="open-edit-modal"
                  data-edit-type="branch-link"
                  data-edit-id="${escapeHtml(item.id)}"
                  data-edit-parent-id="${escapeHtml(question.id)}"
                >关联已有子问题</button>
                <button class="ghost-button compact-button" data-action="open-edit-modal" data-edit-type="strategy" data-edit-id="${escapeHtml(item.id)}">编辑</button>
                <button class="ghost-button" data-action="cycle-strategy-status" data-strategy-id="${escapeHtml(item.id)}">推进状态</button>
                <button class="ghost-button compact-button" data-action="open-delete-modal" data-delete-type="strategy" data-delete-id="${escapeHtml(item.id)}">删除</button>
              </div>
            </article>
          `).join("") : `
            ${renderTabEmptyState(
              "还没有策略",
              "",
              `<button class="primary-button" data-action="open-edit-modal" data-edit-type="new-strategy" data-edit-id="${escapeHtml(question.id)}">添加第一条策略</button>`
            )}
          `}
        </div>
      </section>
    `
  }

  function renderObstacleTab(question, obstacles) {
    return `
      ${renderTabToolbar({
        kicker: "障碍",
        title: "障碍",
        metaHtml: `<span class="chip ${obstacles.length ? "is-danger" : ""}">${escapeHtml(`${obstacles.length} 个障碍`)}</span>`,
        actionsHtml: `<button class="primary-button compact-action-button" data-action="open-edit-modal" data-edit-type="new-obstacle" data-edit-id="${escapeHtml(question.id)}">添加障碍</button>`
      })}

      <section class="panel-block content-card" data-section="obstacles">
        <div class="list-stack tab-list-stack">
          ${obstacles.length ? obstacles.map((item, index) => `
            <article class="list-item is-danger">
              <div class="list-title-row">
                ${renderRichInlineTag("h4", "list-item-title", item.content)}
                <span class="chip is-danger">${escapeHtml(item.isCoreProblem ? "核心瓶颈" : "障碍")}</span>
              </div>
              <div class="chip-row">
                <span class="chip">${escapeHtml(dataAPI.OBSTACLE_TYPE_LABELS[item.type] || item.type || "障碍")}</span>
                ${item.hasClue ? `<span class="chip is-accent">已有线索</span>` : `<span class="chip">暂无线索</span>`}
                ${renderReorderControls("obstacle", item.id, index, obstacles.length)}
                <button
                  class="ghost-button compact-button"
                  data-action="start-focus"
                  data-focus-type="obstacle"
                  data-focus-entity-id="${escapeHtml(item.id)}"
                  data-focus-title="${escapeHtml(item.content)}"
                  data-focus-description="${escapeHtml(item.clueDescription || item.content)}"
                >围绕它专注</button>
                <button class="ghost-button compact-button" data-action="open-edit-modal" data-edit-type="obstacle" data-edit-id="${escapeHtml(item.id)}">编辑</button>
                <button class="ghost-button compact-button" data-action="open-delete-modal" data-delete-type="obstacle" data-delete-id="${escapeHtml(item.id)}">删除</button>
              </div>
              ${item.clueDescription ? `<div class="list-item-body">线索：${renderRichInlineFragment(item.clueDescription)}</div>` : ""}
            </article>
          `).join("") : `
            ${renderTabEmptyState(
              "还没有明确障碍",
              "",
              `<button class="primary-button" data-action="open-edit-modal" data-edit-type="new-obstacle" data-edit-id="${escapeHtml(question.id)}">添加第一个障碍</button>`
            )}
          `}
        </div>
      </section>
    `
  }

  function renderExampleTab(question, examples) {
    return `
      ${renderTabToolbar({
        kicker: "样例与反例",
        title: "样例与反例",
        metaHtml: `<span class="chip ${examples.some(function(item) { return isCounterexampleType(item.type) }) ? "is-danger" : "is-accent"}">${escapeHtml(`${examples.length} 条记录`)}</span>`,
        actionsHtml: `<button class="primary-button compact-action-button" data-action="open-edit-modal" data-edit-type="new-example" data-edit-id="${escapeHtml(question.id)}">添加样例 / 反例</button>`
      })}

      <section class="panel-block content-card" data-section="examples">
        <div class="list-stack tab-list-stack">
          ${examples.length ? examples.map((item, index) => `
            <article class="list-item ${isCounterexampleType(item.type) ? "is-danger" : ""}">
              <div class="list-title-row">
                ${renderRichInlineTag("h4", "list-item-title", item.content)}
                <span class="chip ${isCounterexampleType(item.type) ? "is-danger" : "is-accent"}">${escapeHtml(formatMappedValue(item.type, dataAPI.EXAMPLE_TYPE_LABELS) || item.type)}</span>
              </div>
              ${renderPrimaryBlock("div", "list-item-body", item.conclusion, "未填写说明")}
              <div class="chip-row">
                ${renderReorderControls("example", item.id, index, examples.length)}
                <button
                  class="ghost-button compact-button"
                  data-action="start-focus"
                  data-focus-type="example"
                  data-focus-entity-id="${escapeHtml(item.id)}"
                  data-focus-title="${escapeHtml(item.content)}"
                  data-focus-description="${escapeHtml(item.conclusion || item.content)}"
                >专注此项</button>
                <button class="ghost-button compact-button" data-action="open-edit-modal" data-edit-type="example" data-edit-id="${escapeHtml(item.id)}">编辑</button>
                <button class="ghost-button compact-button" data-action="open-delete-modal" data-delete-type="example" data-delete-id="${escapeHtml(item.id)}">删除</button>
              </div>
            </article>
          `).join("") : `
            ${renderTabEmptyState(
              "还没有样例",
              "",
              `<button class="primary-button" data-action="open-edit-modal" data-edit-type="new-example" data-edit-id="${escapeHtml(question.id)}">添加第一条样例</button>`
            )}
          `}
        </div>
      </section>
    `
  }

  function renderInsightTab(question, insights) {
    return `
      ${renderTabToolbar({
        kicker: "认识",
        title: "认识",
        metaHtml: `<span class="chip is-success">${escapeHtml(`${insights.length} 条认识`)}</span>`,
        actionsHtml: `<button class="primary-button compact-action-button" data-action="open-edit-modal" data-edit-type="new-insight" data-edit-id="${escapeHtml(question.id)}">添加认识</button>`
      })}

      <section class="panel-block content-card" data-section="insights">
        <div class="list-stack tab-list-stack">
          ${insights.length ? insights.map((item, index) => `
            <article class="list-item is-success">
              <div class="list-title-row">
                ${renderRichInlineTag("h4", "list-item-title", item.content)}
                <span class="chip is-success">${escapeHtml(dataAPI.INSIGHT_TYPE_LABELS[item.type] || item.type)}</span>
              </div>
              <div class="chip-row">
                ${renderReorderControls("insight", item.id, index, insights.length)}
                <button
                  class="ghost-button compact-button"
                  data-action="start-focus"
                  data-focus-type="insight"
                  data-focus-entity-id="${escapeHtml(item.id)}"
                  data-focus-title="${escapeHtml(item.content)}"
                  data-focus-description="${escapeHtml(item.content)}"
                >专注此项</button>
                <button class="ghost-button compact-button" data-action="open-edit-modal" data-edit-type="insight" data-edit-id="${escapeHtml(item.id)}">编辑</button>
                <button class="ghost-button compact-button" data-action="open-delete-modal" data-delete-type="insight" data-delete-id="${escapeHtml(item.id)}">删除</button>
              </div>
            </article>
          `).join("") : `
            ${renderTabEmptyState(
              "还没有认识",
              "",
              `<button class="primary-button" data-action="open-edit-modal" data-edit-type="new-insight" data-edit-id="${escapeHtml(question.id)}">添加第一条认识</button>`
            )}
          `}
        </div>
      </section>
    `
  }

  function getLiteratureBindTargets(appState, questionId) {
    if (!questionId) return []
    const question = store.getQuestionById(questionId)
    const targets = []
    if (question) {
      targets.push({
        type: "question",
        entityId: question.id,
        label: `问题 · ${question.title}`
      })
    }

    const currentFocus = store.getCurrentFocus()
    const currentFocusQuestionId = currentFocus ? getQuestionIdForEntity(appState, currentFocus.type, currentFocus.entityId) : null
    if (currentFocus && currentFocusQuestionId === questionId) {
      targets.push({
        type: "focus-session",
        entityId: currentFocus.id,
        label: `专注会话 · ${currentFocus.title}`
      })
    }

    appState.judgments
      .filter(function(item) { return item.questionId === questionId })
      .forEach(function(item) {
        targets.push({ type: "judgment", entityId: item.id, label: `判断 · ${item.content}` })
      })

    appState.strategies
      .filter(function(item) { return item.questionId === questionId })
      .forEach(function(item) {
        targets.push({ type: "strategy", entityId: item.id, label: `策略 · ${item.name}` })
      })

    appState.obstacles
      .filter(function(item) { return item.questionId === questionId })
      .forEach(function(item) {
        targets.push({ type: "obstacle", entityId: item.id, label: `障碍 · ${item.content}` })
      })

    appState.examples
      .filter(function(item) { return item.questionId === questionId })
      .forEach(function(item) {
        targets.push({ type: "example", entityId: item.id, label: `样例 · ${item.content}` })
      })

    appState.insights
      .filter(function(item) { return item.questionId === questionId })
      .forEach(function(item) {
        targets.push({ type: "insight", entityId: item.id, label: `认识 · ${item.content}` })
      })

    return targets
  }

  function isLiteratureLinkedToTarget(item, target, questionId) {
    if (!item || !target) return false
    if (Array.isArray(item.linkedTargets) && item.linkedTargets.length) {
      return item.linkedTargets.some(function(link) {
        return link.type === target.type && link.entityId === target.entityId
      })
    }
    return target.type === "question" && Array.isArray(item.questionIds) && item.questionIds.indexOf(questionId) >= 0
  }

  function renderLiteratureResultAttrs(item) {
    return [
      `data-literature-id="${escapeHtml(item.id || "")}"`,
      `data-literature-title="${escapeHtml(item.title || "")}"`,
      `data-literature-title-alt="${escapeHtml(item.titleAlt || "")}"`,
      `data-literature-authors="${escapeHtml(item.authors || "")}"`,
      `data-literature-year="${escapeHtml(item.year || "")}"`,
      `data-literature-type="${escapeHtml(item.referenceType || "")}"`,
      `data-literature-venue="${escapeHtml(item.venue || "")}"`,
      `data-literature-keywords="${escapeHtml(item.keywords || "")}"`,
      `data-literature-abstract="${escapeHtml(item.abstract || "")}"`,
      `data-literature-doi="${escapeHtml(item.doi || "")}"`,
      `data-literature-md5="${escapeHtml(item.md5 || "")}"`,
      `data-literature-library-type="${escapeHtml(item.libraryType || "")}"`,
      `data-literature-has-cover="${item.hasCover ? "1" : "0"}"`
    ].join(" ")
  }

  function renderLiteratureTab(question, appState, uiState) {
    const targets = getLiteratureBindTargets(appState, question.id)
    const localLiteratureMap = new Map(
      appState.literature.map(function(item) {
        return [item.id, item]
      })
    )
    const selectedTarget = targets.find(function(target) {
      return target.type === uiState.literatureTargetType && target.entityId === uiState.literatureTargetId
    }) || targets[0] || null
    const boundLiteratures = appState.literature.filter(function(item) {
      return isLiteratureLinkedToTarget(item, selectedTarget, question.id)
    })
    const searchResults = Array.isArray(uiState.literatureSearchResults) ? uiState.literatureSearchResults : []
    const currentDocLiterature = uiState.currentDocumentLiterature
    const searchPanelOpen = !!uiState.literatureSearchPanelExpanded

    function renderLiteratureCard(item, options) {
      const localItem = localLiteratureMap.get(item.id) || item
      const mergedItem = Object.assign({}, item, localItem)
      const isBound = selectedTarget ? isLiteratureLinkedToTarget(mergedItem, selectedTarget, question.id) : false
      const targetLinks = Array.isArray(mergedItem.linkedTargets) ? mergedItem.linkedTargets.filter(function(link) {
        return link.questionId === question.id
      }) : []
      return `
        <article class="list-item ${isBound ? "is-success" : ""}">
          <div class="list-title-row">
            ${renderRichInlineTag("h4", "list-item-title", mergedItem.title || "未命名文献")}
            <span class="chip">${escapeHtml(mergedItem.referenceType || mergedItem.libraryType || "文献")}</span>
          </div>
          <div class="list-item-body">
            ${escapeHtml([mergedItem.authors || "作者未知", mergedItem.year || "", mergedItem.venue || ""].filter(Boolean).join(" · "))}
          </div>
          ${mergedItem.abstract ? renderRichBlockTag("div", "list-item-body", mergedItem.abstract) : ""}
          <div class="chip-row">
            ${mergedItem.doi ? `<span class="chip">${escapeHtml(mergedItem.doi)}</span>` : ""}
            ${mergedItem.md5 ? `<span class="chip">docmd5</span>` : ""}
            ${targetLinks.slice(0, 4).map(function(link) {
              return `<span class="chip"><span class="md-rich-text md-rich-inline">${renderMarkdownInlineHtml(link.label || ENTITY_TYPE_LABELS[link.type] || link.type)}</span></span>`
            }).join("")}
          </div>
          <div class="chip-row">
            ${options && options.allowBind ? `
              <button class="primary-button compact-button" data-action="bind-literature-to-target" ${renderLiteratureResultAttrs(mergedItem)}>绑定到当前目标</button>
            ` : ""}
            ${options && options.allowUnbind ? `
              <button class="ghost-button compact-button" data-action="unlink-literature-target" data-literature-id="${escapeHtml(mergedItem.id)}">从当前目标解绑</button>
            ` : ""}
            <button class="secondary-button compact-button" data-action="open-literature-card" data-literature-id="${escapeHtml(mergedItem.id)}" data-open-mode="startReading">开始阅读</button>
            <button class="ghost-button compact-button" data-action="open-literature-card" data-literature-id="${escapeHtml(mergedItem.id)}" data-open-mode="focusCard">打开文献</button>
            <button class="ghost-button compact-button" data-action="open-literature-card" data-literature-id="${escapeHtml(mergedItem.id)}" data-open-mode="focusCardAndEdit">文献详情</button>
          </div>
        </article>
      `
    }

    return `
      ${renderTabToolbar({
        kicker: "研究文献",
        title: "文献",
        metaHtml: `<span class="chip ${selectedTarget ? "is-accent" : ""}">${selectedTarget ? renderRichInlineSummary("当前目标 · ", selectedTarget.label, "") : "未选择目标"}</span>`,
        actionsHtml: `<button class="${searchPanelOpen ? "secondary-button" : "primary-button"} compact-action-button" data-action="toggle-literature-search-panel">${escapeHtml(searchPanelOpen ? "收起搜索" : "搜索文献")}</button>`,
        extraHtml: `
          <div class="chip-row tab-toolbar-chip-row">
            ${targets.length ? targets.map(function(target) {
              const active = selectedTarget && target.type === selectedTarget.type && target.entityId === selectedTarget.entityId
              return `
                <button
                  class="ghost-button compact-button literature-target-chip ${active ? "is-active" : ""}"
                  data-action="select-literature-target"
                  data-bind-type="${escapeHtml(target.type)}"
                  data-bind-id="${escapeHtml(target.entityId)}"
                ><span class="md-rich-text md-rich-inline">${renderMarkdownInlineHtml(target.label)}</span></button>
              `
            }).join("") : `<span class="chip">先创建一个可关联对象</span>`}
          </div>
        `
      })}

      <section class="panel-block content-card" data-section="literature-bound">
        <div class="section-kicker">当前目标已挂文献</div>
        ${renderRichInlineTag("h3", "card-title", selectedTarget ? selectedTarget.label : "未选择关联目标")}
        <div class="list-stack">
          ${boundLiteratures.length ? boundLiteratures.map(function(item) {
            return renderLiteratureCard(item, { allowUnbind: true })
          }).join("") : `
            ${renderTabEmptyState(
              "这个目标还没挂文献",
              "",
              `<button class="primary-button" data-action="toggle-literature-search-panel">${escapeHtml(searchPanelOpen ? "继续搜索文献" : "搜索并关联文献")}</button>`
            )}
          `}
        </div>
      </section>

      ${searchPanelOpen ? `
        <section class="panel-block content-card secondary-panel" data-section="literature-search">
          <div class="secondary-panel-head">
            <div>
              <div class="section-kicker">搜索</div>
              <h3 class="card-title">从 MNLiterature 获取</h3>
            </div>
            <button class="ghost-button compact-action-button" data-action="toggle-literature-search-panel">收起</button>
          </div>
          <div class="secondary-panel-body">
            <div class="editor-grid">
              <input data-input="literature-query" value="${escapeHtml(uiState.literatureQuery || "")}" placeholder="搜索标题、作者、期刊、关键词...">
              <div class="form-row">
                <button class="primary-button" data-action="request-literature-search">${uiState.literatureSearchPending ? "搜索中..." : "搜索文献"}</button>
                <button class="secondary-button" data-action="request-current-document-literature">匹配当前 PDF</button>
                <button class="ghost-button" data-action="search-literature-in-library">去 MNLiterature 继续搜</button>
              </div>
            </div>
            ${uiState.literatureSearchError ? `<div class="list-item is-danger">${escapeHtml(uiState.literatureSearchError)}</div>` : ""}
            ${currentDocLiterature ? `
              <div class="list-stack">
                <article class="list-item is-success">
                  <div class="section-kicker">当前文档命中</div>
                  ${renderLiteratureCard(currentDocLiterature, { allowBind: !isLiteratureLinkedToTarget(currentDocLiterature, selectedTarget, question.id) })}
                </article>
              </div>
            ` : ""}
            <div class="list-stack">
              ${searchResults.length ? searchResults.map(function(item) {
                return renderLiteratureCard(item, {
                  allowBind: !isLiteratureLinkedToTarget(item, selectedTarget, question.id)
                })
              }).join("") : `
                ${renderTabEmptyState(
                  "还没拿到文献结果",
                  "",
                  ""
                )}
              `}
            </div>
          </div>
        </section>
      ` : ""}
    `
  }

  function renderWorkbench(appState, uiState) {
    const question = store.getQuestionById(appState.activeQuestionId)
    if (!question) {
      return renderDashboard(appState)
    }

    const questionFormulations = appState.formulations.filter((item) => item.questionId === question.id)
    const currentFormulation = questionFormulations.find((item) => item.id === question.currentFormulationId) || null
    const judgments = sortOrderedItems(appState.judgments.filter((item) => item.questionId === question.id))
    const strategies = sortOrderedItems(appState.strategies.filter((item) => item.questionId === question.id))
    const examples = sortOrderedItems(appState.examples.filter((item) => item.questionId === question.id))
    const obstacles = sortOrderedItems(appState.obstacles.filter((item) => item.questionId === question.id))
    const insights = sortOrderedItems(appState.insights.filter((item) => item.questionId === question.id))
    const literatures = appState.literature.filter((item) => Array.isArray(item.questionIds) && item.questionIds.indexOf(question.id) >= 0)
    const focusState = getFocusState(appState)
    const currentFocusOnQuestion = focusState.questionId === question.id
    const formulationButtonLabel = currentFormulation
      ? "新建表述版本"
      : question.description
        ? "收为首版表述"
        : "写首版表述"

    const activeTab = uiState.activeTab || "timeline"

    let tabBody = renderOverviewTab(question, judgments, strategies, examples, insights, obstacles, appState)
    if (activeTab === "timeline") tabBody = renderTimelineList(appState, uiState, question.id, focusState)
    if (activeTab === "formulation") tabBody = renderFormulationSection(question)
    if (activeTab === "judgments") tabBody = renderJudgmentTab(question, judgments)
    if (activeTab === "strategies") tabBody = renderStrategyTab(question, strategies, appState)
    if (activeTab === "examples") tabBody = renderExampleTab(question, examples)
    if (activeTab === "obstacles") tabBody = renderObstacleTab(question, obstacles)
    if (activeTab === "insights") tabBody = renderInsightTab(question, insights)
    if (activeTab === "literature") tabBody = renderLiteratureTab(question, appState, uiState)

    return `
      <div class="workspace-view workbench-view">
        <div class="workbench-stack">
          <section class="panel-block workbench-hero">
            <div class="workbench-hero-head">
              <div class="workbench-hero-copy">
                <div class="question-title-row">
                  ${renderRichInlineTag("h1", "question-title", question.title)}
                  <div class="question-title-actions">
                    <button class="ghost-button compact-action-button" data-action="open-edit-modal" data-edit-type="question" data-edit-id="${escapeHtml(question.id)}">编辑问题</button>
                    <button class="secondary-button compact-action-button" data-action="open-edit-modal" data-edit-type="new-formulation" data-edit-id="${escapeHtml(question.id)}">${escapeHtml(formulationButtonLabel)}</button>
                  </div>
                </div>
                ${renderPrimaryBlock("div", "question-description", question.description, "未填写问题表述")}
              </div>
              <div class="workbench-hero-actions">
                <span class="chip is-accent">${escapeHtml(dataAPI.STATUS_LABELS[question.status] || question.status)}</span>
                <button class="primary-button compact-action-button" data-action="start-focus" data-question-id="${escapeHtml(question.id)}" data-focus-type="question" data-focus-entity-id="${escapeHtml(question.id)}" data-focus-title="${escapeHtml(question.title)}" data-focus-description="${escapeHtml(question.description || "")}">${currentFocusOnQuestion ? "切到此问题 Focus" : "进入 Focus"}</button>
                ${currentFocusOnQuestion ? `<span class="chip">Focus 已绑定</span>` : ""}
              </div>
            </div>
            <div class="hero-meta">
              ${renderSectionJumpButton({ questionId: question.id, tab: "judgments", text: `${judgments.length} 条判断`, className: "chip count-chip-button" })}
              ${renderSectionJumpButton({ questionId: question.id, tab: "strategies", text: `${strategies.length} 条策略`, className: "chip count-chip-button" })}
              ${renderSectionJumpButton({ questionId: question.id, tab: "examples", text: `${examples.length} 个样例 / 反例`, className: "chip count-chip-button" })}
              ${renderSectionJumpButton({ questionId: question.id, tab: "obstacles", text: `${obstacles.length} 个障碍`, className: "chip count-chip-button" })}
              ${renderSectionJumpButton({ questionId: question.id, tab: "insights", text: `${insights.length} 条认识`, className: "chip count-chip-button" })}
              ${renderSectionJumpButton({ questionId: question.id, tab: "literature", text: `${literatures.length} 篇关联文献`, className: "chip count-chip-button" })}
            </div>
          </section>

          ${renderQuestionBranchBanner(question, appState)}

          ${renderQuestionLifecycleCard(question, appState)}

          <section class="tabs">
            <button class="tab-button ${activeTab === "timeline" ? "is-active" : ""}" data-action="switch-tab" data-tab="timeline">时间线</button>
            <button class="tab-button ${activeTab === "overview" ? "is-active" : ""}" data-action="switch-tab" data-tab="overview">总览</button>
            <button class="tab-button ${activeTab === "formulation" ? "is-active" : ""}" data-action="switch-tab" data-tab="formulation">问题表述</button>
            <button class="tab-button ${activeTab === "judgments" ? "is-active" : ""}" data-action="switch-tab" data-tab="judgments">判断</button>
            <button class="tab-button ${activeTab === "strategies" ? "is-active" : ""}" data-action="switch-tab" data-tab="strategies">策略</button>
            <button class="tab-button ${activeTab === "examples" ? "is-active" : ""}" data-action="switch-tab" data-tab="examples">样例与反例</button>
            <button class="tab-button ${activeTab === "obstacles" ? "is-active" : ""}" data-action="switch-tab" data-tab="obstacles">障碍</button>
            <button class="tab-button ${activeTab === "insights" ? "is-active" : ""}" data-action="switch-tab" data-tab="insights">认识</button>
            <button class="tab-button ${activeTab === "literature" ? "is-active" : ""}" data-action="switch-tab" data-tab="literature">文献</button>
          </section>

          ${tabBody}
        </div>
      </div>
    `
  }

  function renderFocusPanel(appState, uiState) {
    if (uiState && uiState.workspaceMode === "focus") return ""

    const focusState = getFocusState(appState)
    const boundQuestion = focusState.questionId ? store.getQuestionById(focusState.questionId) : null
    const boundEntity = focusState.entityType === "strategy"
      ? appState.strategies.find(function(item) { return item.id === focusState.entityId }) || null
      : focusState.entityType === "action"
        ? appState.actions.find(function(item) { return item.id === focusState.entityId }) || null
        : null
    const currentFocus = store.getCurrentFocus()
    const title = currentFocus && currentFocus.title
      ? currentFocus.title
      : boundEntity && (boundEntity.title || boundEntity.name)
        ? (boundEntity.title || boundEntity.name)
        : boundQuestion && boundQuestion.title
          ? boundQuestion.title
          : "未绑定 Focus"
    const context = currentFocus
      ? `${ENTITY_TYPE_LABELS[currentFocus.type] || currentFocus.type || "研究对象"} · ${formatElapsedTime(currentFocus.startTime, currentFocus.endTime, currentFocus.updatedAt)}`
      : boundEntity && boundQuestion
        ? `${ENTITY_TYPE_LABELS[focusState.entityType] || focusState.entityType || "研究对象"} · ${boundQuestion.title || "未命名问题"}`
        : boundQuestion
          ? `绑定问题 · ${boundQuestion.title || "未命名问题"}`
          : "点击设置绑定问题和对象"

    return `
      <button class="focus-floating-pill" data-action="show-focus-view" type="button" title="打开 Focus">
        <span class="chip is-accent">Focus</span>
        <span class="focus-pill-copy">
          <span class="focus-pill-label">${renderRichInlineFragment(title)}</span>
          <span class="focus-pill-context">${renderRichInlineFragment(context)}</span>
        </span>
      </button>
    `
  }

  function renderSummaryModal(appState, uiState) {
    const focusId = uiState.summaryFocusId
    if (!focusId) return ""
    const focus = appState.focusSessions.find((item) => item.id === focusId)
    if (!focus) return ""

    return `
      <div class="modal-backdrop">
        <div class="modal-shell panel-block">
          <div class="modal-header">
            <div>
              <div class="section-kicker">专注会话总结</div>
              ${renderRichInlineTag("h3", "card-title", focus.title)}
              <p class="card-subtitle">${escapeHtml(ENTITY_TYPE_LABELS[focus.type] || focus.type || "研究对象")} · ${escapeHtml(formatClockTime(focus.startTime))}${focus.endTime ? ` - ${escapeHtml(formatClockTime(focus.endTime))}` : ""}</p>
            </div>
            <button class="ghost-button modal-close" data-action="close-summary-modal">关闭</button>
          </div>
          <div class="modal-body editor-grid">
            <textarea data-input="summary-what-was-done" placeholder="这次推进了什么"></textarea>
            <textarea data-input="summary-key-conclusion" placeholder="最重要的结论"></textarea>
            <textarea data-input="summary-new-examples" placeholder="这次补到的样例 / 反例（每行一条）"></textarea>
            <textarea data-input="summary-new-insights" placeholder="这次新弄明白的点（每行一条）"></textarea>
            <textarea data-input="summary-new-obstacles" placeholder="新冒出来的障碍（每行一条）"></textarea>
            <textarea data-input="summary-next-steps" placeholder="下次从哪接"></textarea>
            ${renderHtmlSelect("summary-confidence", "medium", [
              { value: "high", label: dataAPI.CONFIDENCE_LEVEL_LABELS.high },
              { value: "medium", label: dataAPI.CONFIDENCE_LEVEL_LABELS.medium },
              { value: "low", label: dataAPI.CONFIDENCE_LEVEL_LABELS.low }
            ])}
          </div>
          <div class="modal-footer">
            <button class="secondary-button" data-action="close-summary-modal">取消</button>
            <button class="primary-button" data-action="save-summary" data-focus-id="${escapeHtml(focusId)}">保存总结并完成会话</button>
          </div>
        </div>
      </div>
    `
  }

  function renderTimelineEventModal(appState, uiState) {
    const timelineId = uiState && uiState.timelineEventModalId
    if (!timelineId) return ""
    const timelineEvent = (Array.isArray(appState.timelineEvents) ? appState.timelineEvents : []).find(function(item) {
      return item.id === timelineId
    })
    if (!timelineEvent) return ""

    const allowEdit = timelineEvent.source === "manual"
    const allowPromoteToInsight = timelineEvent.noteType === "insight" && !timelineEvent.promotedEntityId
    const allowPromoteToObstacle = timelineEvent.noteType === "obstacle" && !timelineEvent.promotedEntityId
    const allowPromoteToAction = timelineEvent.noteType === "next_step" && !timelineEvent.promotedEntityId
    const detail = getTimelineEventDetails(timelineEvent)

    return `
      <div class="modal-backdrop">
        <div class="modal-shell panel-block">
          <div class="modal-header">
            <div>
              <div class="section-kicker">${escapeHtml(timelineEvent.source === "manual" ? (dataAPI.TIMELINE_NOTE_TYPE_LABELS[timelineEvent.noteType] || "时间线事件") : "系统记录")}</div>
              ${renderRichInlineTag("h3", "card-title", getTimelineEventSummary(timelineEvent))}
              <p class="card-subtitle"><span>${escapeHtml(formatTimelineStamp(timelineEvent.createdAt))}</span><span> · </span>${renderTimelineMetaLineHtml(timelineEvent, appState)}</p>
            </div>
            <button class="ghost-button modal-close" data-action="close-timeline-event-modal">关闭</button>
          </div>
          <div class="modal-body timeline-modal-body">
            ${detail ? renderRichBlockTag("div", "timeline-event-detail timeline-event-detail-modal", detail) : ""}
            ${(timelineEvent.previousValue || timelineEvent.nextValue) ? `
              <div class="timeline-diff-grid">
                <article class="delete-impact-card">
                  <span class="delete-impact-label">旧值</span>
                  ${renderRichBlockTag("div", "timeline-diff-value", timelineEvent.previousValue || "空")}
                </article>
                <article class="delete-impact-card">
                  <span class="delete-impact-label">新值</span>
                  ${renderRichBlockTag("div", "timeline-diff-value", timelineEvent.nextValue || "空")}
                </article>
              </div>
            ` : ""}
            <div class="chip-row">
              ${timelineEvent.promotedEntityType ? `<span class="chip is-success">已升格为${escapeHtml(ENTITY_TYPE_LABELS[timelineEvent.promotedEntityType] || timelineEvent.promotedEntityType)}</span>` : ""}
            </div>
          </div>
          <div class="modal-footer timeline-modal-footer">
            <button class="secondary-button" data-action="close-timeline-event-modal">关闭</button>
            ${allowEdit ? `<button class="ghost-button" data-action="open-edit-modal" data-edit-type="timeline-event" data-edit-id="${escapeHtml(timelineEvent.id)}">编辑事件</button>` : ""}
            <button class="ghost-button" data-action="open-delete-modal" data-delete-type="timeline-event" data-delete-id="${escapeHtml(timelineEvent.id)}">删除事件</button>
            ${allowPromoteToInsight ? `<button class="ghost-button" data-action="promote-timeline-event" data-timeline-id="${escapeHtml(timelineEvent.id)}" data-promote-type="insight">升格为认识</button>` : ""}
            ${allowPromoteToObstacle ? `<button class="ghost-button" data-action="promote-timeline-event" data-timeline-id="${escapeHtml(timelineEvent.id)}" data-promote-type="obstacle">升格为障碍</button>` : ""}
            ${allowPromoteToAction ? `<button class="primary-button" data-action="open-edit-modal" data-edit-type="promote-event-action" data-edit-id="${escapeHtml(timelineEvent.id)}">升格为动作</button>` : ""}
          </div>
        </div>
      </div>
    `
  }

  function renderDeleteModal(appState, uiState) {
    const preview = getDeleteTargetPreview(appState, uiState)
    if (!preview) return ""

    return `
      <div class="modal-backdrop">
        <div class="modal-shell panel-block modal-danger-shell">
          <div class="modal-header">
            <div>
              <div class="section-kicker">${escapeHtml(preview.kicker || "删除对象")}</div>
              ${renderRichInlineTag("h3", "card-title", preview.title || "未命名对象")}
              ${preview.subtitle ? renderRichInlineTag("p", "card-subtitle", preview.subtitle) : ""}
            </div>
            <button class="ghost-button modal-close" data-action="close-delete-modal">关闭</button>
          </div>
          <div class="modal-body delete-modal-body">
            <div class="delete-warning-copy">${escapeHtml(preview.warning || "删除后无法恢复。")}</div>
            ${preview.cards && preview.cards.length ? `
              <div class="delete-impact-grid">
                ${preview.cards.map(function(card) {
                  return `
                    <article class="delete-impact-card">
                      <span class="delete-impact-label">${escapeHtml(card.label)}</span>
                      <strong class="delete-impact-value">${renderRichInlineFragment(card.value)}</strong>
                    </article>
                  `
                }).join("")}
              </div>
            ` : ""}
            ${preview.chips && preview.chips.length ? `
              <div class="chip-row">
                ${preview.chips.map(function(chip) {
                  return `<span class="chip">${renderRichInlineFragment(chip)}</span>`
                }).join("")}
              </div>
            ` : ""}
          </div>
          <div class="modal-footer">
            <button class="secondary-button" data-action="close-delete-modal">取消</button>
            <button
              class="danger-button"
              data-action="confirm-delete-entity"
              data-delete-type="${escapeHtml(preview.type || "")}"
              data-delete-id="${escapeHtml(preview.id || "")}"
              ${preview.parentId ? `data-delete-parent-id="${escapeHtml(preview.parentId)}"` : ""}
            >${escapeHtml(preview.confirmLabel || "确认删除")}</button>
          </div>
        </div>
      </div>
    `
  }

  function renderEditModal(appState, uiState) {
    const target = getEditTargetData(appState, uiState)
    if (!target) return ""

    return `
      <div class="modal-backdrop">
        <div class="modal-shell panel-block">
          <div class="modal-header">
            <div>
              <div class="section-kicker">${escapeHtml(target.kicker || "编辑对象")}</div>
              ${renderRichInlineTag("h3", "card-title", target.title || "编辑内容")}
              ${target.subtitle ? renderRichInlineTag("p", "card-subtitle", target.subtitle) : ""}
            </div>
            <button class="ghost-button modal-close" data-action="close-edit-modal">关闭</button>
          </div>
          <div class="modal-body">
            ${target.body || ""}
          </div>
          <div class="modal-footer">
            <button class="secondary-button" data-action="close-edit-modal">取消</button>
            <button
              class="primary-button"
              data-action="save-edit-entity"
              data-edit-type="${escapeHtml(target.type || "")}"
              data-edit-id="${escapeHtml(target.id || "")}"
              ${target.parentId ? `data-edit-parent-id="${escapeHtml(target.parentId)}"` : ""}
              ${target.submitDisabled ? "disabled" : ""}
            >${escapeHtml(target.submitLabel || "保存修改")}</button>
          </div>
        </div>
      </div>
    `
  }

  global.MNResearchRender = {
    updateSaveStatus,
    renderApp(appState, uiState) {
      const activeInputSnapshot = captureActiveInputSnapshot()
      const sidebar = document.getElementById("sidebar")
      const drawerRoot = document.getElementById("drawer-root")
      const workspace = document.getElementById("workspace")
      const focusPanel = document.getElementById("focus-panel")
      const modalRoot = document.getElementById("modal-root")

      if (sidebar) {
        sidebar.className = uiState && uiState.sidebarCollapsed ? "sidebar is-collapsed" : "sidebar"
        sidebar.innerHTML = renderSidebar(appState, uiState)
      }
      if (drawerRoot) drawerRoot.innerHTML = renderSettingsDrawer(uiState)
      if (workspace) {
        const workspaceMode = uiState && uiState.workspaceMode ? uiState.workspaceMode : "dashboard"
        if (workspaceMode === "focus") {
          workspace.innerHTML = renderFocusView(appState, uiState)
        } else if (appState.activeQuestionId) {
          workspace.innerHTML = renderWorkbench(appState, uiState)
        } else {
          workspace.innerHTML = renderDashboard(appState)
        }
      }
      if (focusPanel) focusPanel.innerHTML = renderFocusPanel(appState, uiState)
      if (modalRoot) {
        modalRoot.innerHTML = [
          renderSummaryModal(appState, uiState),
          renderTimelineEventModal(appState, uiState),
          renderEditModal(appState, uiState),
          renderDeleteModal(appState, uiState)
        ].join("")
      }
      queueRenderedMathTargets([sidebar, drawerRoot, workspace, focusPanel, modalRoot])
      restoreActiveInputSnapshot(activeInputSnapshot)
      consumePendingSectionJump(uiState, workspace)
    }
  }
})(window)
