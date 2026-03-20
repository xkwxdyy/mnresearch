(function(global) {
  var ns = global.MNResearch = global.MNResearch || {};
  var sample = ns.sample = ns.sample || {};
  var core = ns.core;

  sample.createInitialState = function() {
    var now = Date.now();
    var iso = function(offsetMinutes) {
      return new Date(now - offsetMinutes * 60000).toISOString();
    };

    return {
      questions: [
        {
          id: "q1",
          title: "Carleson 型算子的三维推广是否可能成立？",
          description: "先把二维时频框架拆解清楚，再判断三维方向参数引入的几何复杂度是不是硬障碍。",
          status: "active",
          parentId: null,
          order: 0,
          formulationIds: ["f1"],
          judgmentIds: ["j1", "j2"],
          exampleIds: ["ex1"],
          strategyIds: ["s1", "s2"],
          obstacleIds: ["o1"],
          insightIds: ["i1", "i2"],
          createdAt: iso(1600),
          updatedAt: iso(15)
        },
        {
          id: "q1-1",
          title: "二维证明里真正不可替换的结构是什么？",
          description: "确认 tree selection、tile packing 和 size/energy 分解哪一块最可能在高维失效。",
          status: "active",
          parentId: "q1",
          order: 0,
          formulationIds: ["f2"],
          judgmentIds: ["j3"],
          exampleIds: [],
          strategyIds: ["s3"],
          obstacleIds: [],
          insightIds: ["i3"],
          branchMeta: {
            parentRelationType: "subproblem",
            feedBackStatus: "partial",
            feedBackSummary: "已经确认 size/energy 不是第一批要推倒的模块，但还没完全回写成母问题结论。",
            successCriteria: "确认二维 proof 中真正不可替换的结构模块。",
            originSummary: "从母问题 q1 的结构拆解中长出来。"
          },
          createdAt: iso(1400),
          updatedAt: iso(8)
        },
        {
          id: "q1-2",
          title: "三维方向参数的连续性如何离散化？",
          description: "想办法把球面方向族切成有限但可控的扇区，否则整个证明会在组合复杂度上爆炸。",
          status: "paused",
          parentId: "q1",
          order: 1,
          formulationIds: [],
          judgmentIds: [],
          exampleIds: [],
          strategyIds: ["s4"],
          obstacleIds: ["o2"],
          insightIds: [],
          branchMeta: {
            parentRelationType: "prerequisite",
            feedBackStatus: "pending",
            feedBackSummary: "",
            successCriteria: "给方向离散化找到不太丑的扇区层级。",
            originSummary: "从策略「局部扇区模型」进一步拆出的前置子问题。"
          },
          createdAt: iso(1200),
          updatedAt: iso(110)
        },
        {
          id: "q2",
          title: "多线性端点估计的最小反例长什么样？",
          description: "别一上来证明。先找最小失败样例，把发散机制钉死。",
          status: "active",
          parentId: null,
          order: 1,
          formulationIds: [],
          judgmentIds: ["j4"],
          exampleIds: ["ex2"],
          strategyIds: ["s5"],
          obstacleIds: [],
          insightIds: ["i4"],
          createdAt: iso(900),
          updatedAt: iso(45)
        }
      ],
      literature: [
        {
          id: "l1",
          title: "A proof of boundedness of the Carleson operator",
          authors: "Lacey, Thiele",
          year: 2000,
          source: "Math. Research Letters",
          doi: "10.4310/MRL.2000.v7.n4.a1",
          url: "",
          abstract: "",
          tags: ["核心", "二维", "时频分析"],
          notes: "二维母体证明。所有拆解都得从这里抽骨架。",
          questionIds: ["q1", "q1-1"],
          createdAt: iso(1800),
          updatedAt: iso(60)
        },
        {
          id: "l2",
          title: "On limits of sequences of operators",
          authors: "Stein",
          year: 1961,
          source: "Annals",
          doi: "",
          url: "",
          abstract: "",
          tags: ["高维", "旋转不变"],
          notes: "如果要降维或借旋转不变性，这篇还得啃。",
          questionIds: ["q1"],
          createdAt: iso(1700),
          updatedAt: iso(95)
        },
        {
          id: "l3",
          title: "The multiplier problem for the ball",
          authors: "Fefferman",
          year: 1971,
          source: "Annals",
          doi: "",
          url: "",
          abstract: "",
          tags: ["反例", "球乘子"],
          notes: "用来提醒自己：别对高维方向结构抱过度乐观。",
          questionIds: ["q1-2"],
          createdAt: iso(1300),
          updatedAt: iso(130)
        },
        {
          id: "l4",
          title: "Endpoint estimates for multilinear operators",
          authors: "Grafakos, Kalton",
          year: 2001,
          source: "Trans. AMS",
          doi: "",
          url: "",
          abstract: "",
          tags: ["端点", "多线性"],
          notes: "反例设计的对照样本。",
          questionIds: ["q2"],
          createdAt: iso(1000),
          updatedAt: iso(40)
        }
      ],
      timelineEvents: [
        {
          id: "te1",
          questionId: "q1-1",
          relatedEntityType: "strategy",
          relatedEntityId: "s3",
          eventType: "quick_note",
          noteType: "progress",
          source: "manual",
          label: "进展",
          content: "selection rule 的抽象结构已经被拉出来了，下一步可以尝试替换方向参数。",
          createdAt: iso(18),
          updatedAt: iso(18)
        },
        {
          id: "te2",
          questionId: "q1-1",
          relatedEntityType: "strategy",
          relatedEntityId: "s3",
          eventType: "quick_note",
          noteType: "next_step",
          source: "manual",
          label: "下一步",
          content: "先把 stopping rule 写成伪代码。",
          createdAt: iso(14),
          updatedAt: iso(14)
        },
        {
          id: "te3",
          questionId: "q1",
          relatedEntityType: "question",
          relatedEntityId: "q1",
          eventType: "question_updated",
          noteType: "",
          source: "system",
          label: "问题表述",
          content: "问题表述：先做三维推广 -> 先把目标缩到有限扇区模型",
          previousValue: "先做三维推广",
          nextValue: "先把目标缩到有限扇区模型",
          createdAt: iso(70),
          updatedAt: iso(70)
        }
      ],
      actions: [
        {
          id: "a1",
          questionId: "q1-1",
          strategyId: "s3",
          title: "先把 stopping rule 写成伪代码",
          description: "目标是验证它到底依赖二维几何还是只依赖 bookkeeping。",
          status: "doing",
          sourceTimelineEventId: "te2",
          createdAt: iso(14),
          updatedAt: iso(6)
        },
        {
          id: "a2",
          questionId: "q1",
          strategyId: "",
          title: "把扇区模型收成一版问题表述",
          description: "",
          status: "queued",
          createdAt: iso(60),
          updatedAt: iso(60)
        }
      ],
      focusState: {
        questionId: "q1-1",
        entityType: "strategy",
        entityId: "s3"
      },
      focusSessions: [
        {
          id: "fs1",
          type: "question",
          entityId: "q1-1",
          title: "拆二维 proof 的 selection rule",
          description: "只问一句：哪些地方真依赖二维？",
          status: "active",
          startTime: iso(95),
          endTime: "",
          linkedItems: [
            { type: "judgment", id: "j3", title: "size/energy 不是第一瓶颈", linkedAt: iso(34) },
            { type: "literature", id: "l1", title: "Lacey-Thiele", linkedAt: iso(44) }
          ],
          relatedStrategyId: "s3",
          newExampleIds: [],
          newInsightIds: ["i3"],
          nextContinuePoint: "对 stopping rule 做成伪代码，再尝试替换方向参数。",
          confidenceLevel: "medium",
          createdAt: iso(95),
          updatedAt: iso(9)
        },
        {
          id: "fs2",
          type: "question",
          entityId: "q2",
          title: "端点反例最小模型",
          description: "压缩到最小构造。",
          status: "completed",
          startTime: iso(600),
          endTime: iso(520),
          linkedItems: [],
          relatedStrategyId: "s5",
          newExampleIds: ["ex2"],
          newInsightIds: ["i4"],
          nextContinuePoint: "把失败机制写成两页短 note。",
          confidenceLevel: "high",
          createdAt: iso(600),
          updatedAt: iso(520)
        }
      ],
      progressLog: [
        {
          id: "p1",
          focusSessionId: "fs1",
          action: "started",
          details: "开始拆二维 proof",
          entityType: "question",
          entityId: "q1-1",
          createdAt: iso(95),
          updatedAt: iso(95)
        },
        {
          id: "p2",
          focusSessionId: "fs1",
          action: "progress_checkpoint",
          details: "selection rule 的抽象结构已经被纳入当前推进脉络",
          entityType: "insight",
          entityId: "i3",
          createdAt: iso(18),
          updatedAt: iso(18)
        }
      ],
      formulations: [
        {
          id: "f1",
          questionId: "q1",
          content: "三维 Carleson 型算子的有界性是否能在扇区截断模型中成立？",
          constraints: ["先固定有限扇区", "允许局部模型"],
          reason: "先把问题缩小到能测的范围。",
          version: 1,
          isAbandoned: false,
          createdAt: iso(250),
          updatedAt: iso(30)
        },
        {
          id: "f2",
          questionId: "q1-1",
          content: "二维 proof 中哪些步骤真依赖平面几何？",
          constraints: ["只拆 selection/packing/energy"],
          reason: "避免一上来空谈高维直觉。",
          version: 1,
          isAbandoned: false,
          createdAt: iso(180),
          updatedAt: iso(8)
        }
      ],
      judgments: [
        {
          id: "j1",
          content: "二维 proof skeleton 还能留下超过一半。",
          type: "directional",
          status: "fuzzy",
          questionId: "q1",
          order: 0,
          supportingIds: ["l1"],
          contradictingIds: [],
          changeReason: "目前只在局部 bookkeeping 上看到希望。",
          createdAt: iso(100),
          updatedAt: iso(24)
        },
        {
          id: "j2",
          content: "真正的硬障碍不是估计，而是方向连续族的组织。",
          type: "structural",
          status: "leaning_true",
          questionId: "q1",
          order: 1,
          supportingIds: ["i1", "o1"],
          contradictingIds: [],
          changeReason: "最近的障碍都聚焦在方向离散化。",
          createdAt: iso(140),
          updatedAt: iso(15)
        },
        {
          id: "j3",
          content: "size/energy 分解不是第一批必须推倒重来的模块。",
          type: "tool_choice",
          status: "partially_supported",
          questionId: "q1-1",
          order: 0,
          supportingIds: ["i3"],
          contradictingIds: [],
          changeReason: "先保留它们，集中火力打方向组织。",
          createdAt: iso(75),
          updatedAt: iso(9)
        },
        {
          id: "j4",
          content: "端点失败例应该先来自最小相位叠加，而不是复杂权重。",
          type: "candidate_proposition",
          status: "leaning_true",
          questionId: "q2",
          order: 0,
          supportingIds: ["ex2"],
          contradictingIds: [],
          changeReason: "最小模型更容易读出失败机制。",
          createdAt: iso(80),
          updatedAt: iso(45)
        }
      ],
      examples: [
        {
          id: "ex1",
          type: "special_case",
          content: "固定 8 个扇区、保留二维 bookkeeping 的局部模型。",
          questionId: "q1",
          order: 0,
          relatedJudgmentIds: ["j1", "j2"],
          conclusion: "适合做第一版压力测试，不够 general 但足够诚实。",
          isKey: true,
          createdAt: iso(60),
          updatedAt: iso(21)
        },
        {
          id: "ex2",
          type: "counterexample",
          content: "两个频带叠加后端点增长立刻偏离对数级。",
          questionId: "q2",
          order: 0,
          relatedJudgmentIds: ["j4"],
          conclusion: "失败机制可能来自相位叠加，不必一开始引入复杂权重。",
          isKey: true,
          createdAt: iso(110),
          updatedAt: iso(45)
        }
      ],
      strategies: [
        {
          id: "s1",
          name: "局部扇区模型",
          type: "special_case",
          methodTags: ["simplify_conditions", "special_case"],
          description: "先固定有限扇区数量，再检验二维 bookkeeping 是否还能工作。",
          rationale: "这是最便宜也最诚实的第一枪。",
          status: "promising",
          questionId: "q1",
          parentId: null,
          branchIntent: "spawn_subquestion",
          outcomeMode: "promoted_to_question",
          currentObstacleId: "o1",
          nextAction: "把扇区模型的变量记号统一到一页纸。",
          failureReason: "",
          order: 0,
          createdAt: iso(120),
          updatedAt: iso(14)
        },
        {
          id: "s2",
          name: "旋转不变性降维",
          type: "dimension_reduce",
          methodTags: ["dimension_reduce", "borrow_tool"],
          description: "利用平均化把方向复杂度压回低维。",
          rationale: "如果能成，后面会省很多 bookkeeping。",
          status: "stalled",
          questionId: "q1",
          parentId: null,
          branchIntent: "parallel_angle",
          outcomeMode: "stay_strategy",
          currentObstacleId: "",
          nextAction: "回去补 Stein 的老文献。",
          failureReason: "",
          order: 1,
          createdAt: iso(180),
          updatedAt: iso(32)
        },
        {
          id: "s3",
          name: "selection rule 伪代码化",
          type: "direct_advance",
          methodTags: ["decompose_structure", "direct_advance"],
          description: "把二维 selection rule 先写成不依赖图形的伪代码。",
          rationale: "能看出哪些参数是结构性、哪些只是二维写法。",
          status: "exploring",
          questionId: "q1-1",
          parentId: null,
          branchIntent: "direct_attack",
          outcomeMode: "stay_strategy",
          currentObstacleId: "",
          nextAction: "给每步加上必须依赖的几何输入。",
          failureReason: "",
          order: 0,
          createdAt: iso(90),
          updatedAt: iso(8)
        },
        {
          id: "s4",
          name: "球面方向离散化",
          type: "reformulate",
          methodTags: ["reformulate", "special_case"],
          description: "把连续方向切成有限但可控的扇区层级。",
          rationale: "不先离散化，后面什么都没法谈。",
          status: "blocked",
          questionId: "q1-2",
          parentId: null,
          branchIntent: "spawn_subquestion",
          outcomeMode: "stay_strategy",
          currentObstacleId: "o2",
          nextAction: "",
          failureReason: "目前没有一个不太丑的扇区选择规则。",
          order: 0,
          createdAt: iso(140),
          updatedAt: iso(90)
        },
        {
          id: "s5",
          name: "最小反例压缩",
          type: "find_counterexample",
          methodTags: ["find_counterexample", "decompose_structure"],
          description: "先构造最小失败样例，再倒推端点机制。",
          rationale: "比空泛证明更快见血。",
          status: "promising",
          questionId: "q2",
          parentId: null,
          branchIntent: "counterexample_track",
          outcomeMode: "stay_strategy",
          currentObstacleId: "",
          nextAction: "把失败增长写成可复查的两步计算。",
          failureReason: "",
          order: 0,
          createdAt: iso(130),
          updatedAt: iso(41)
        }
      ],
      obstacles: [
        {
          id: "o1",
          content: "方向参数从离散点集变成连续球面，packing 计数直接失控。",
          type: "structural",
          questionId: "q1",
          order: 0,
          affectedStrategyIds: ["s1"],
          isCoreProblem: true,
          hasClue: true,
          clueDescription: "有限扇区截断可能先救一口气。",
          createdAt: iso(160),
          updatedAt: iso(11)
        },
        {
          id: "o2",
          content: "目前找不到既自然又不爆炸的扇区层级。",
          type: "technical",
          questionId: "q1-2",
          order: 0,
          affectedStrategyIds: ["s4"],
          isCoreProblem: true,
          hasClue: false,
          clueDescription: "",
          createdAt: iso(150),
          updatedAt: iso(91)
        }
      ],
      insights: [
        {
          id: "i1",
          type: "observation",
          content: "二维 skeleton 能保留，但不能假装方向族还是有限离散的。",
          questionId: "q1",
          order: 0,
          sourceJudgmentId: "j1",
          sourceStrategyId: "s1",
          sourceSessionId: "",
          stability: "moderate",
          createdAt: iso(40),
          updatedAt: iso(22)
        },
        {
          id: "i2",
          type: "obstacle_note",
          content: "高维里先炸的是组织结构，不是估计常数。",
          questionId: "q1",
          order: 1,
          sourceJudgmentId: "j2",
          sourceStrategyId: "s1",
          sourceSessionId: "",
          stability: "stable",
          createdAt: iso(24),
          updatedAt: iso(14)
        },
        {
          id: "i3",
          type: "equivalence",
          content: "selection rule 的核心可写成层级阈值控制，几何图形只是外壳。",
          questionId: "q1-1",
          order: 0,
          sourceJudgmentId: "j3",
          sourceStrategyId: "s3",
          sourceSessionId: "fs1",
          stability: "moderate",
          createdAt: iso(19),
          updatedAt: iso(9)
        },
        {
          id: "i4",
          type: "counterexample",
          content: "最小失败例先说明端点机制，再谈一般定理，效率高得多。",
          questionId: "q2",
          order: 0,
          sourceJudgmentId: "j4",
          sourceStrategyId: "s5",
          sourceSessionId: "fs2",
          stability: "stable",
          createdAt: iso(51),
          updatedAt: iso(45)
        }
      ],
      branchLinks: [
        {
          id: "b1",
          sourceType: "question",
          sourceId: "q1",
          targetType: "question",
          targetId: "q1-1",
          relationType: "supports_parent_question",
          branchRole: "subproblem",
          contributionType: "answer_parent",
          status: "partial",
          note: "先拆二维 proof 里真正不可替换的骨架，再决定三维方向是否值得继续推。",
          createdAt: iso(210),
          updatedAt: iso(12)
        },
        {
          id: "b2",
          sourceType: "strategy",
          sourceId: "s1",
          targetType: "question",
          targetId: "q1-2",
          relationType: "spawn_question",
          branchRole: "prerequisite",
          contributionType: "remove_obstacle",
          status: "active",
          note: "局部扇区模型推不下去时，必须把方向离散化单独抽成前置子问题。",
          createdAt: iso(150),
          updatedAt: iso(14)
        }
      ],
      currentFocusId: "fs1",
      activeQuestionId: null
    };
  };
})(window);
