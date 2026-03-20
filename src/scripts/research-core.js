(function(global) {
  var ns = global.MNResearch = global.MNResearch || {};
  var core = ns.core = ns.core || {};

  core.defaultState = function() {
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
    };
  };

  core.defaultUI = function() {
    return {
      sidebarCollapsed: false,
      focusPanelExpanded: false,
      searchQuery: "",
      workbenchTab: "timeline",
      workspaceMode: "dashboard"
    };
  };

  core.now = function() {
    return new Date().toISOString();
  };

  core.createId = function(prefix) {
    return String(prefix || "id") + "-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
  };

  core.clone = function(value) {
    return JSON.parse(JSON.stringify(value));
  };

  core.escapeHTML = function(value) {
    var text = value === null || value === undefined ? "" : String(value);
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  core.trim = function(value) {
    return String(value || "").replace(/^\s+|\s+$/g, "");
  };

  core.ensureArray = function(value) {
    return Array.isArray(value) ? value : [];
  };

  core.toTimestamp = function(value) {
    var dataAPI = global.MNResearchData || null;
    if (dataAPI && typeof dataAPI.toTimestamp === "function") {
      return dataAPI.toTimestamp(value);
    }
    var parsed = new Date(value).getTime();
    return isNaN(parsed) ? 0 : parsed;
  };

  core.compareTimeDesc = function(leftValue, rightValue) {
    var leftTime = core.toTimestamp(leftValue);
    var rightTime = core.toTimestamp(rightValue);
    if (rightTime !== leftTime) return rightTime - leftTime;
    return String(rightValue || "").localeCompare(String(leftValue || ""), "zh-CN");
  };

  core.matchesMappedValue = function(value, expectedKey, labels) {
    var dataAPI = global.MNResearchData || null;
    if (dataAPI && typeof dataAPI.matchesMappedValue === "function") {
      return dataAPI.matchesMappedValue(value, expectedKey, labels);
    }
    return String(value || "") === String(expectedKey || "");
  };

  core.asNumber = function(value, fallback) {
    var parsed = parseInt(value, 10);
    return isNaN(parsed) ? (fallback || 0) : parsed;
  };

  core.getToneForStatus = function(status) {
    var judgmentStatusLabels = global.MNResearchData && global.MNResearchData.JUDGMENT_STATUS_LABELS;
    if (core.matchesMappedValue(status, "fuzzy", judgmentStatusLabels) ||
        core.matchesMappedValue(status, "weakened", judgmentStatusLabels) ||
        core.matchesMappedValue(status, "leaning_false", judgmentStatusLabels)) {
      return "amber";
    }
    switch (status) {
      case "resolved":
      case "completed":
      case "converged":
      case "supported":
      case "succeeded":
      case "stable":
        return "green";
      case "blocked":
      case "failed":
      case "refuted":
      case "error":
        return "red";
      case "pending":
      case "paused":
        return "amber";
      default:
        return "navy";
    }
  };

  core.formatTime = function(isoString) {
    if (!isoString) return "";
    try {
      return new Date(isoString).toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      return String(isoString || "");
    }
  };

  core.formatRelative = function(isoString) {
    if (!isoString) return "未知时间";
    var time = new Date(isoString).getTime();
    if (!time) return String(isoString || "");
    var diff = Date.now() - time;
    var minute = 60 * 1000;
    var hour = 60 * minute;
    var day = 24 * hour;

    if (diff < minute) return "刚刚";
    if (diff < hour) return Math.max(1, Math.round(diff / minute)) + " 分钟前";
    if (diff < day) return Math.max(1, Math.round(diff / hour)) + " 小时前";
    return Math.max(1, Math.round(diff / day)) + " 天前";
  };

  core.formatDuration = function(startTime, endTime) {
    if (!startTime) return "0 分钟";
    var start = new Date(startTime).getTime();
    var end = new Date(endTime || core.now()).getTime();
    var diff = Math.max(0, end - start);
    var totalMinutes = Math.floor(diff / 60000);
    if (totalMinutes < 60) {
      return totalMinutes + " 分钟";
    }
    var hours = Math.floor(totalMinutes / 60);
    var minutes = totalMinutes % 60;
    return hours + " 小时 " + minutes + " 分钟";
  };

  core.toQueryString = function(params) {
    var pairs = [];
    var key;
    var rawValue;
    for (key in params) {
      if (!params.hasOwnProperty(key)) continue;
      rawValue = params[key];
      if (rawValue === undefined || rawValue === null) continue;
      pairs.push(
        encodeURIComponent(key) + "=" + encodeURIComponent(String(rawValue))
      );
    }
    return pairs.join("&");
  };

  core.parsePayload = function(payload) {
    if (!payload) return null;
    if (typeof payload === "string") {
      try {
        return JSON.parse(payload);
      } catch (error) {
        return null;
      }
    }
    return payload;
  };

  core.normalizeState = function(rawState) {
    var base = core.defaultState();
    var state = rawState || {};
    var key;

    for (key in base) {
      if (!base.hasOwnProperty(key)) continue;
      if (Array.isArray(base[key])) {
        base[key] = core.ensureArray(state[key]);
      } else {
        base[key] = state[key] === undefined ? base[key] : state[key];
      }
    }

    if (!base.activeQuestionId && base.questions.length > 0) {
      base.activeQuestionId = base.questions[0].id;
    }

    return base;
  };

  core.normalizeTransportPayload = function(payload) {
    var parsed = core.parsePayload(payload) || {};
    var data = parsed.state ? parsed.state : parsed;
    var ui = parsed.ui ? parsed.ui : null;

    return {
      state: core.normalizeState(data),
      ui: ui
    };
  };

  core.sortByOrder = function(items) {
    return core.ensureArray(items).slice().sort(function(a, b) {
      var left = core.asNumber(a && a.order, 0);
      var right = core.asNumber(b && b.order, 0);
      if (left !== right) return left - right;
      return String((a && a.title) || (a && a.name) || "").localeCompare(
        String((b && b.title) || (b && b.name) || ""),
        "zh-CN"
      );
    });
  };

  core.getBranchLinksForQuestion = function(state, questionId) {
    return core.ensureArray(state.branchLinks).filter(function(link) {
      return (link.targetType === "question" && link.targetId === questionId) ||
        (link.sourceType === "question" && link.sourceId === questionId);
    });
  };

  core.getIncomingBranchLinksForQuestion = function(state, questionId) {
    return core.ensureArray(state.branchLinks).filter(function(link) {
      return link.targetType === "question" && link.targetId === questionId;
    });
  };

  core.getBranchLinksForStrategy = function(state, strategyId) {
    return core.ensureArray(state.branchLinks).filter(function(link) {
      return (link.sourceType === "strategy" && link.sourceId === strategyId) ||
        (link.targetType === "strategy" && link.targetId === strategyId);
    });
  };

  core.getOutgoingBranchLinksForStrategy = function(state, strategyId) {
    return core.ensureArray(state.branchLinks).filter(function(link) {
      return link.sourceType === "strategy" && link.sourceId === strategyId;
    });
  };

  core.getBranchSourceTitle = function(state, link) {
    if (!link) return "";
    if (link.sourceType === "strategy") {
      var strategyList = core.ensureArray(state.strategies);
      var i;
      for (i = 0; i < strategyList.length; i += 1) {
        if (strategyList[i].id === link.sourceId) return strategyList[i].name || "未命名策略";
      }
      return "未找到策略";
    }
    if (link.sourceType === "question") {
      var question = core.findQuestion(state, link.sourceId);
      return question ? (question.title || "未命名问题") : "未找到问题";
    }
    return "";
  };

  core.getQuestionBranchSummary = function(state, questionId) {
    var question = core.findQuestion(state, questionId);
    var incomingLinks;
    var primaryLink;
    var branchMeta;
    var sourceTitle;
    var status;
    var isChild;
    var i;

    if (!question) return null;

    incomingLinks = core.getIncomingBranchLinksForQuestion(state, questionId);
    primaryLink = incomingLinks[0] || null;
    branchMeta = question.branchMeta || {};
    sourceTitle = primaryLink ? core.getBranchSourceTitle(state, primaryLink) : "";
    status = branchMeta.feedBackStatus || (primaryLink && primaryLink.status === "fed_back" ? "fed_back" : "pending");
    isChild = !!question.parentId;

    return {
      isChild: isChild,
      isOrphan: isChild && !incomingLinks.length,
      needsTriage: isChild && !incomingLinks.length,
      incomingLinks: incomingLinks,
      primaryLink: primaryLink,
      sourceType: primaryLink ? primaryLink.sourceType : "",
      sourceId: primaryLink ? primaryLink.sourceId : "",
      sourceTitle: sourceTitle,
      relationType: primaryLink ? primaryLink.relationType : "",
      branchRole: branchMeta.parentRelationType || (primaryLink ? primaryLink.branchRole : ""),
      contributionType: primaryLink ? primaryLink.contributionType : "",
      feedbackStatus: status,
      feedbackSummary: branchMeta.feedBackSummary || "",
      originSummary: branchMeta.originSummary || (primaryLink ? (primaryLink.note || "") : ""),
      successCriteria: branchMeta.successCriteria || ""
    };
  };

  core.computeBranchHealth = function(state, questionId) {
    var questions = core.ensureArray(state.questions);
    var branchLinks = core.ensureArray(state.branchLinks);
    var strategies = core.ensureArray(state.strategies);
    var targetQuestionIds;
    var targetQuestionIdMap = {};
    var childQuestions;
    var strategyIdsForQuestion = {};
    var strategyQuestionLinks = [];
    var orphanChildCount = 0;
    var fedBackCount = 0;
    var staleCount = 0;
    var linkedQuestionCount = 0;
    var i;
    var question;
    var summary;

    targetQuestionIds = branchLinks
      .filter(function(link) { return link.targetType === "question"; })
      .map(function(link) { return link.targetId; });

    for (i = 0; i < targetQuestionIds.length; i += 1) {
      targetQuestionIdMap[targetQuestionIds[i]] = true;
    }

    if (questionId) {
      strategies.forEach(function(item) {
        if (item.questionId === questionId) {
          strategyIdsForQuestion[item.id] = true;
        }
      });
      strategyQuestionLinks = branchLinks.filter(function(link) {
        return link.sourceType === "strategy" &&
          strategyIdsForQuestion[link.sourceId] &&
          link.targetType === "question";
      });
      linkedQuestionCount = strategyQuestionLinks.length;
      fedBackCount += strategyQuestionLinks.filter(function(link) {
        return link.status === "fed_back";
      }).length;
    }

    childQuestions = questions.filter(function(item) {
      return questionId ? item.parentId === questionId : !!item.parentId;
    });

    for (i = 0; i < childQuestions.length; i += 1) {
      question = childQuestions[i];
      summary = core.getQuestionBranchSummary(state, question.id);
      if (summary && summary.isOrphan) orphanChildCount += 1;
      if (!questionId && summary && summary.feedbackStatus === "fed_back") fedBackCount += 1;
    }

    staleCount = branchLinks.filter(function(link) {
      if (questionId) {
        if (link.sourceType === "strategy" && strategyIdsForQuestion[link.sourceId]) {
          return link.status === "stale" || link.status === "abandoned";
        }
        if (link.targetType === "question") {
          var targetQuestion = core.findQuestion(state, link.targetId);
          if (!targetQuestion || targetQuestion.parentId !== questionId) return false;
        } else {
          return false;
        }
      }
      return link.status === "stale" || link.status === "abandoned";
    }).length;

    return {
      linkedChildQuestions: questionId
        ? linkedQuestionCount
        : childQuestions.filter(function(item) { return !!targetQuestionIdMap[item.id]; }).length,
      orphanChildQuestions: orphanChildCount,
      fedBackChildQuestions: fedBackCount,
      staleBranches: staleCount
    };
  };

  core.getQuestionRelations = function(state, questionId) {
    var branchSummary = core.getQuestionBranchSummary(state, questionId);
    return {
      judgments: core.sortByOrder(core.ensureArray(state.judgments).filter(function(item) { return item.questionId === questionId; })),
      strategies: core.sortByOrder(core.ensureArray(state.strategies).filter(function(item) { return item.questionId === questionId; })),
      actions: core.ensureArray(state.actions).filter(function(item) { return item.questionId === questionId; }),
      examples: core.sortByOrder(core.ensureArray(state.examples).filter(function(item) { return item.questionId === questionId; })),
      obstacles: core.sortByOrder(core.ensureArray(state.obstacles).filter(function(item) { return item.questionId === questionId; })),
      insights: core.sortByOrder(core.ensureArray(state.insights).filter(function(item) { return item.questionId === questionId; })),
      timelineEvents: core.ensureArray(state.timelineEvents).filter(function(item) { return item.questionId === questionId; }),
      literature: core.ensureArray(state.literature).filter(function(item) {
        return core.ensureArray(item.questionIds).indexOf(questionId) >= 0;
      }),
      branchSummary: branchSummary,
      incomingBranchLinks: branchSummary ? core.sortByOrder(branchSummary.incomingLinks) : [],
      outgoingBranchLinks: core.sortByOrder(core.ensureArray(state.branchLinks).filter(function(link) {
        return link.sourceType === "question" && link.sourceId === questionId;
      }))
    };
  };

  core.buildQuestionTree = function(state) {
    var questions = core.sortByOrder(state.questions);
    var map = {};
    var roots = [];
    var i;
    var question;
    var relations;

    for (i = 0; i < questions.length; i += 1) {
      question = core.clone(questions[i]);
      relations = core.getQuestionRelations(state, question.id);
      question.judgments = relations.judgments;
      question.strategies = relations.strategies;
      question.actions = relations.actions;
      question.examples = relations.examples;
      question.obstacles = relations.obstacles;
      question.insights = relations.insights;
      question.timelineEvents = relations.timelineEvents;
      question.literature = relations.literature;
      question.branchSummary = relations.branchSummary;
      question.incomingBranchLinks = relations.incomingBranchLinks;
      question.outgoingBranchLinks = relations.outgoingBranchLinks;
      question.children = [];
      map[question.id] = question;
    }

    for (i = 0; i < questions.length; i += 1) {
      question = map[questions[i].id];
      if (question.parentId && map[question.parentId]) {
        map[question.parentId].children.push(question);
      } else {
        roots.push(question);
      }
    }

    return roots;
  };

  core.findQuestion = function(state, questionId) {
    var list = core.ensureArray(state.questions);
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (list[i].id === questionId) return list[i];
    }
    return null;
  };

  core.findActiveQuestion = function(state) {
    if (!state.activeQuestionId) return null;
    return core.findQuestion(state, state.activeQuestionId);
  };

  core.getQuestionIdForEntity = function(state, type, entityId) {
    var items;
    var i;

    if (!entityId) return null;
    if (type === "question") return entityId;

    if (type === "judgment") {
      items = core.ensureArray(state.judgments);
      for (i = 0; i < items.length; i += 1) {
        if (items[i].id === entityId) return items[i].questionId || null;
      }
      return null;
    }

    if (type === "strategy") {
      items = core.ensureArray(state.strategies);
      for (i = 0; i < items.length; i += 1) {
        if (items[i].id === entityId) return items[i].questionId || null;
      }
      return null;
    }

    if (type === "action") {
      items = core.ensureArray(state.actions);
      for (i = 0; i < items.length; i += 1) {
        if (items[i].id === entityId) return items[i].questionId || null;
      }
      return null;
    }

    if (type === "obstacle") {
      items = core.ensureArray(state.obstacles);
      for (i = 0; i < items.length; i += 1) {
        if (items[i].id === entityId) return items[i].questionId || null;
      }
      return null;
    }

    if (type === "example") {
      items = core.ensureArray(state.examples);
      for (i = 0; i < items.length; i += 1) {
        if (items[i].id === entityId) return items[i].questionId || null;
      }
      return null;
    }

    if (type === "insight") {
      items = core.ensureArray(state.insights);
      for (i = 0; i < items.length; i += 1) {
        if (items[i].id === entityId) return items[i].questionId || null;
      }
      return null;
    }

    if (type === "literature") {
      items = core.ensureArray(state.literature);
      for (i = 0; i < items.length; i += 1) {
        if (items[i].id === entityId) {
          return core.ensureArray(items[i].questionIds).length
            ? items[i].questionIds[0]
            : null;
        }
      }
      return null;
    }

    return null;
  };

  core.collectQuestionFamilyIds = function(state, questionId) {
    var questions = core.ensureArray(state.questions);
    var childMap = {};
    var ids = [];
    var queue = [questionId];
    var seen = {};
    var i;
    var parentId;
    var currentId;
    var children;
    var j;

    for (i = 0; i < questions.length; i += 1) {
      parentId = questions[i].parentId || "__root__";
      if (!childMap[parentId]) childMap[parentId] = [];
      childMap[parentId].push(questions[i].id);
    }

    while (queue.length) {
      currentId = queue.shift();
      if (!currentId || seen[currentId]) continue;
      seen[currentId] = true;
      ids.push(currentId);
      children = childMap[currentId] || [];
      for (j = 0; j < children.length; j += 1) {
        queue.push(children[j]);
      }
    }

    return ids;
  };

  core.getQuestionFocusSessions = function(state, questionId) {
    return core.ensureArray(state.focusSessions).filter(function(item) {
      return core.getQuestionIdForEntity(state, item.type, item.entityId) === questionId;
    });
  };

  core.computeQuestionLifecycle = function(state, questionId) {
    var question = core.findQuestion(state, questionId);
    var relations;
    var formulations;
    var hasDefinition;
    var hasJudgment;
    var hasStrategy;
    var hasProbe;
    var blockedCount;
    var stableInsightCount;
    var convergedJudgmentCount;
    var succeededStrategyCount;
    var doneActionCount;
    var hasSynthesis;
    var completedSteps;
    var stageKey;
    var stageLabel;
    var headline;
    var summary;
    var nextAction;
    var tone;
    var steps;
    var currentStep = 1;
    var i;
    var branchHealth;
    var branchSummary;
    var childQuestionCount;
    var pendingFeedbackCount;

    if (!question) return null;

    relations = core.getQuestionRelations(state, questionId);
    formulations = core.ensureArray(state.formulations).filter(function(item) {
      return item.questionId === questionId;
    });

    hasDefinition = !!core.trim(question.description) || formulations.length > 0;
    hasJudgment = relations.judgments.length > 0;
    hasStrategy = relations.strategies.length > 0;
    hasProbe = relations.examples.length > 0 || relations.timelineEvents.length > 0 || relations.insights.length > 0 || relations.actions.length > 0;
    blockedCount = relations.obstacles.filter(function(item) {
      return !!item.isCoreProblem;
    }).length + relations.strategies.filter(function(item) {
      return item.status === "blocked" || item.status === "stalled";
    }).length + relations.actions.filter(function(item) {
      return item.status === "blocked";
    }).length;
    stableInsightCount = relations.insights.filter(function(item) {
      return !!core.trim(item.content);
    }).length;
    convergedJudgmentCount = relations.judgments.filter(function(item) {
      return core.matchesMappedValue(item.status, "converged", global.MNResearchData && global.MNResearchData.JUDGMENT_STATUS_LABELS) ||
        core.matchesMappedValue(item.status, "partially_supported", global.MNResearchData && global.MNResearchData.JUDGMENT_STATUS_LABELS);
    }).length;
    succeededStrategyCount = relations.strategies.filter(function(item) {
      return item.status === "succeeded";
    }).length;
    doneActionCount = relations.actions.filter(function(item) {
      return item.status === "done";
    }).length;
    hasSynthesis = stableInsightCount > 0 || convergedJudgmentCount > 0 || succeededStrategyCount > 0 || doneActionCount > 0;
    branchHealth = core.computeBranchHealth(state, questionId);
    branchSummary = relations.branchSummary || core.getQuestionBranchSummary(state, questionId);
    childQuestionCount = core.ensureArray(state.questions).filter(function(item) { return item.parentId === questionId; }).length;
    pendingFeedbackCount = core.ensureArray(state.questions).filter(function(item) {
      var childSummary;
      if (item.parentId !== questionId) return false;
      childSummary = core.getQuestionBranchSummary(state, item.id);
      return childSummary && item.status === "resolved" && childSummary.feedbackStatus !== "fed_back";
    }).length;

    steps = [
      { key: "define", label: "问题成形", done: hasDefinition || question.status === "resolved" || question.status === "archived" },
      { key: "judge", label: "建立判断", done: hasJudgment || question.status === "resolved" || question.status === "archived" },
      { key: "strategy", label: "设计推进", done: hasStrategy || question.status === "resolved" || question.status === "archived" },
      { key: "probe", label: "样例/障碍推进", done: hasProbe || blockedCount > 0 || question.status === "resolved" || question.status === "archived" },
      { key: "synthesize", label: "收口沉淀", done: hasSynthesis || question.status === "resolved" || question.status === "archived" }
    ];

    completedSteps = steps.filter(function(step) { return !!step.done; }).length;
    for (i = 0; i < steps.length; i += 1) {
      if (!steps[i].done) {
        currentStep = steps[i].key === "define" ? 1
          : steps[i].key === "judge" ? 2
          : steps[i].key === "strategy" ? 3
          : steps[i].key === "probe" ? 4
          : 5;
        break;
      }
      currentStep = 5;
    }

    if (question.status === "archived") {
      stageKey = "archived";
      stageLabel = "已归档";
      headline = "这条问题已经收口，留作结果资产";
      summary = "归档问题不该继续耗注意力，但随时能回看路径。";
      nextAction = "如果发现新分支，建议新开问题，不要把旧档案再搅浑。";
      tone = "success";
    } else if (question.status === "resolved") {
      stageKey = "resolved";
      stageLabel = "已解决";
      headline = "问题已经完成，下一步应该归档而不是继续发散";
      summary = "把最终表述、关键判断和局部认识收一下，这样后面复盘才不痛苦。";
      nextAction = "确认没有新障碍后，直接归档。";
      tone = "success";
    } else if (!hasDefinition) {
      stageKey = "capture";
      stageLabel = "待定义";
      headline = "先把问题讲清楚，再谈推进";
      summary = "现在还处在模糊阶段，任何判断和策略都会漂。";
      nextAction = "补一版正式表述，写明范围、目标和约束。";
      tone = "accent";
    } else if (!hasJudgment) {
      stageKey = "judge";
      stageLabel = "待立判断";
      headline = "问题写清了，但还没有抓手";
      summary = "没有工作判断，后面的策略都只能靠直觉乱撞。";
      nextAction = "先补一条最值得验证的工作判断。";
      tone = "accent";
    } else if (!hasStrategy) {
      stageKey = "strategy";
      stageLabel = "待定策略";
      headline = "有判断了，接下来要决定怎么打";
      summary = "研究卡住的常见原因不是没想法，而是没把推进路径显式化。";
      nextAction = "给关键判断定一条可执行的策略。";
      tone = "accent";
    } else if (branchHealth.orphanChildQuestions > 0) {
      stageKey = "branch_gap";
      stageLabel = "分支未接线";
      headline = "子问题已经长出来了，但和研究分支的关系还是黑箱";
      summary = "这是结构漏洞。子问题没有来源和用途，后面回流一定会烂。";
      nextAction = "给悬空子问题补上来源策略或分支角色，别继续装作它们天然合理。";
      tone = "danger";
    } else if (blockedCount > 0) {
      stageKey = "blocked";
      stageLabel = "受阻";
      headline = "当前主任务不是继续冲，而是拆掉阻塞";
      summary = "障碍已经明牌了，继续硬推只会消耗注意力。";
      nextAction = "把核心障碍单独推进，先解决最大的卡点。";
      tone = "danger";
    } else if (pendingFeedbackCount > 0 || (branchSummary && branchSummary.feedbackStatus === "pending" && question.status === "resolved")) {
      stageKey = "pending_feedback";
      stageLabel = "待回流";
      headline = "局部分支已经跑出结果，但还没送回主问题";
      summary = "不回流的子问题，只会把成果藏在角落里发霉。";
      nextAction = "把这条子问题的结果写回给母问题、策略或判断。";
      tone = "accent";
    } else if (hasSynthesis) {
      stageKey = "synthesis";
      stageLabel = "待收口";
      headline = "已经有可沉淀结果，该收了";
      summary = "这时候继续横向扩展很容易把已经到手的东西又搞散。";
      nextAction = "整理局部认识，确认是否可以标记为已解决。";
      tone = "success";
    } else {
      stageKey = "active";
      stageLabel = "推进中";
      headline = "问题已经进入有效推进阶段";
      summary = "继续通过时间线记录、样例和障碍把中间状态钉住。";
      nextAction = hasProbe ? "继续推进最有希望的策略。" : "补一个最小样例或记下一条新的推进事件。";
      tone = "accent";
    }

    return {
      questionId: questionId,
      stageKey: stageKey,
      stageLabel: stageLabel,
      headline: headline,
      summary: summary,
      nextAction: nextAction,
      tone: tone,
      currentStep: currentStep,
      completedSteps: completedSteps,
      totalSteps: steps.length,
      progressRatio: steps.length ? completedSteps / steps.length : 0,
      steps: steps,
      counts: {
        formulations: formulations.length,
        judgments: relations.judgments.length,
        strategies: relations.strategies.length,
        actions: relations.actions.length,
        examples: relations.examples.length,
        obstacles: relations.obstacles.length,
        insights: relations.insights.length,
        timelineEvents: relations.timelineEvents.length,
        children: childQuestionCount,
        blocked: blockedCount,
        stableResults: stableInsightCount + convergedJudgmentCount + succeededStrategyCount + doneActionCount,
        derivedQuestions: branchHealth.linkedChildQuestions,
        orphanChildQuestions: branchHealth.orphanChildQuestions,
        fedBackChildQuestions: branchHealth.fedBackChildQuestions,
        staleBranches: branchHealth.staleBranches,
        pendingFeedbackQuestions: pendingFeedbackCount
      }
    };
  };

  core.computeQuestionDeleteImpact = function(state, questionId) {
    var question = core.findQuestion(state, questionId);
    var questionIds;
    var questionIdMap = {};
    var i;
    var literatureTouched = 0;
    var literatureDeleted = 0;

    if (!question) return null;

    questionIds = core.collectQuestionFamilyIds(state, questionId);
    for (i = 0; i < questionIds.length; i += 1) {
      questionIdMap[questionIds[i]] = true;
    }

    core.ensureArray(state.literature).forEach(function(item) {
      var remaining = core.ensureArray(item.questionIds).filter(function(id) {
        return !questionIdMap[id];
      });
      if (remaining.length !== core.ensureArray(item.questionIds).length) {
        literatureTouched += 1;
        if (!remaining.length) literatureDeleted += 1;
      }
    });

    return {
      questionId: questionId,
      questionTitle: question.title || "未命名问题",
      questionIds: questionIds,
      counts: {
        questions: questionIds.length,
        formulations: core.ensureArray(state.formulations).filter(function(item) { return !!questionIdMap[item.questionId]; }).length,
        judgments: core.ensureArray(state.judgments).filter(function(item) { return !!questionIdMap[item.questionId]; }).length,
        strategies: core.ensureArray(state.strategies).filter(function(item) { return !!questionIdMap[item.questionId]; }).length,
        actions: core.ensureArray(state.actions).filter(function(item) { return !!questionIdMap[item.questionId]; }).length,
        examples: core.ensureArray(state.examples).filter(function(item) { return !!questionIdMap[item.questionId]; }).length,
        obstacles: core.ensureArray(state.obstacles).filter(function(item) { return !!questionIdMap[item.questionId]; }).length,
        insights: core.ensureArray(state.insights).filter(function(item) { return !!questionIdMap[item.questionId]; }).length,
        timelineEvents: core.ensureArray(state.timelineEvents).filter(function(item) { return !!questionIdMap[item.questionId]; }).length,
        literatureTouched: literatureTouched,
        literatureDeleted: literatureDeleted
      },
      hasActiveFocus: !!(state.focusState && state.focusState.questionId && questionIdMap[state.focusState.questionId]),
      affectsActiveQuestion: !!questionIdMap[state.activeQuestionId]
    };
  };

  core.computeSnapshot = function(state) {
    var judgments = core.ensureArray(state.judgments);
    var strategies = core.ensureArray(state.strategies);
    var actions = core.ensureArray(state.actions);
    var examples = core.ensureArray(state.examples);
    var obstacles = core.ensureArray(state.obstacles);
    var insights = core.ensureArray(state.insights);
    var timelineEvents = core.ensureArray(state.timelineEvents);
    var suggestedNextSteps = [];
    var questions = core.ensureArray(state.questions);
    var questionLifecycle = questions.map(function(item) {
      return core.computeQuestionLifecycle(state, item.id);
    }).filter(Boolean);
    var branchHealth = core.computeBranchHealth(state);

    questionLifecycle
      .filter(function(item) {
        return item.stageKey === "capture" ||
          item.stageKey === "judge" ||
          item.stageKey === "strategy" ||
          item.stageKey === "branch_gap" ||
          item.stageKey === "blocked" ||
          item.stageKey === "pending_feedback" ||
          item.stageKey === "synthesis";
      })
      .slice(0, 5)
      .forEach(function(item) {
        var title = item.stageKey === "capture"
            ? "先写清问题"
          : item.stageKey === "judge"
            ? "补第一条工作判断"
          : item.stageKey === "strategy"
            ? "给问题挂策略"
            : item.stageKey === "branch_gap"
              ? "补齐分支关系"
            : item.stageKey === "blocked"
              ? "先拆最大障碍"
              : item.stageKey === "pending_feedback"
                ? "把子问题结果回流"
              : "准备收口";
        var description = (core.findQuestion(state, item.questionId) || {}).title || "未命名问题";
        description += " · " + item.nextAction;
        suggestedNextSteps.push({
          id: "suggest-question-lifecycle-" + item.questionId,
          type: item.stageKey === "capture"
            ? "clarify_question"
            : item.stageKey === "judge"
              ? "verify_hypothesis"
              : item.stageKey === "strategy"
                ? "explore_thought"
                : item.stageKey === "branch_gap"
                  ? "repair_branch"
                : item.stageKey === "blocked"
                  ? "resolve_block"
                  : item.stageKey === "pending_feedback"
                    ? "close_loop"
                  : "close_loop",
          title: title,
          description: description,
          priority: item.stageKey === "blocked" || item.stageKey === "capture" ? "high" : "medium",
          relatedEntityType: "question",
          relatedEntityId: item.questionId
        });
      });

    judgments
      .filter(function(item) {
        return core.matchesMappedValue(item.status, "fuzzy", global.MNResearchData && global.MNResearchData.JUDGMENT_STATUS_LABELS) ||
          core.matchesMappedValue(item.status, "leaning_true", global.MNResearchData && global.MNResearchData.JUDGMENT_STATUS_LABELS) ||
          core.matchesMappedValue(item.status, "leaning_false", global.MNResearchData && global.MNResearchData.JUDGMENT_STATUS_LABELS);
      })
      .slice(0, 2)
      .forEach(function(item) {
        suggestedNextSteps.push({
          id: "suggest-judgment-" + item.id,
          type: "verify_hypothesis",
          title: "推进工作判断",
          description: item.content,
          priority: core.matchesMappedValue(item.status, "fuzzy", global.MNResearchData && global.MNResearchData.JUDGMENT_STATUS_LABELS) ? "high" : "medium",
          relatedEntityType: "judgment",
          relatedEntityId: item.id
        });
      });

    obstacles
      .filter(function(item) { return !!item.isCoreProblem; })
      .slice(0, 2)
      .forEach(function(item) {
        suggestedNextSteps.push({
          id: "suggest-obstacle-" + item.id,
          type: "resolve_block",
          title: "先拆障碍",
          description: item.content,
          priority: "high",
          relatedEntityType: "obstacle",
          relatedEntityId: item.id
        });
      });

    strategies
      .filter(function(item) { return item.status === "promising" || item.status === "exploring"; })
      .slice(0, 2)
      .forEach(function(item) {
        suggestedNextSteps.push({
          id: "suggest-strategy-" + item.id,
          type: "explore_thought",
          title: "推进策略分支",
          description: item.name + (item.description ? " · " + item.description : ""),
          priority: item.status === "promising" ? "high" : "medium",
          relatedEntityType: "strategy",
          relatedEntityId: item.id
        });
      });

    core.ensureArray(state.literature)
      .slice(0, 1)
      .forEach(function(item) {
        suggestedNextSteps.push({
          id: "suggest-literature-" + item.id,
          type: "review_literature",
          title: "回看关键文献",
          description: item.title,
          priority: "low",
          relatedEntityType: "literature",
          relatedEntityId: item.id
        });
      });

    return {
      totalQuestions: questions.length,
      activeQuestions: questions.filter(function(item) { return item.status === "active"; }).length,
      resolvedQuestions: questions.filter(function(item) { return item.status === "resolved"; }).length,
      archivedQuestions: questions.filter(function(item) { return item.status === "archived"; }).length,
      draftQuestions: questionLifecycle.filter(function(item) { return item.stageKey === "capture"; }).length,
      blockedQuestions: questionLifecycle.filter(function(item) { return item.stageKey === "blocked"; }).length,
      readyToCloseQuestions: questionLifecycle.filter(function(item) {
        return item.stageKey === "synthesis" || item.stageKey === "resolved";
      }).length,
      totalJudgments: judgments.length,
      pendingJudgments: judgments.filter(function(item) {
        return !core.matchesMappedValue(item.status, "converged", global.MNResearchData && global.MNResearchData.JUDGMENT_STATUS_LABELS);
      }).length,
      fuzzyJudgments: judgments.filter(function(item) {
        return core.matchesMappedValue(item.status, "fuzzy", global.MNResearchData && global.MNResearchData.JUDGMENT_STATUS_LABELS);
      }).length,
      convergingJudgments: judgments.filter(function(item) {
        return core.matchesMappedValue(item.status, "leaning_true", global.MNResearchData && global.MNResearchData.JUDGMENT_STATUS_LABELS) ||
          core.matchesMappedValue(item.status, "partially_supported", global.MNResearchData && global.MNResearchData.JUDGMENT_STATUS_LABELS);
      }).length,
      totalExamples: examples.length,
      counterexamples: examples.filter(function(item) {
        return core.matchesMappedValue(
          item.type,
          "counterexample",
          global.MNResearchData && global.MNResearchData.EXAMPLE_TYPE_LABELS
        );
      }).length,
      totalStrategies: strategies.length,
      promisingStrategies: strategies.filter(function(item) { return item.status === "promising"; }).length,
      blockedStrategies: strategies.filter(function(item) { return item.status === "blocked"; }).length,
      failedStrategies: strategies.filter(function(item) { return item.status === "failed"; }).length,
      totalActions: actions.length,
      activeActions: actions.filter(function(item) { return item.status === "doing"; }).length,
      blockedActions: actions.filter(function(item) { return item.status === "blocked"; }).length,
      linkedChildQuestions: branchHealth.linkedChildQuestions,
      orphanChildQuestions: branchHealth.orphanChildQuestions,
      fedBackChildQuestions: branchHealth.fedBackChildQuestions,
      staleBranches: branchHealth.staleBranches,
      totalObstacles: obstacles.length,
      coreObstacles: obstacles.filter(function(item) { return !!item.isCoreProblem; }).length,
      totalInsights: insights.length,
      stableInsights: insights.filter(function(item) { return !!core.trim(item.content); }).length,
      recentActivities: timelineEvents.slice().sort(function(left, right) {
        return core.compareTimeDesc(left.createdAt, right.createdAt);
      }).slice(0, 8),
      suggestedNextSteps: suggestedNextSteps.slice(0, 5),
      questionLifecycle: questionLifecycle
    };
  };
})(window);
