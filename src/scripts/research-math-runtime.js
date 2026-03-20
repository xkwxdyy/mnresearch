(function(global) {
  let flushTimer = null
  let inFlight = false
  const pendingNodes = new Set()
  let pendingJobs = []

  function normalizeTargets(targets) {
    const list = []
    if (!targets) return list
    if (targets instanceof Element) return [targets]
    if (typeof targets.length === "number") {
      for (let i = 0; i < targets.length; i += 1) {
        list.push(targets[i])
      }
    } else {
      list.push(targets)
    }
    return list.filter(function(node) {
      return node && node.nodeType === 1 && (node.isConnected || node === document.body)
    })
  }

  function resolveJobs(ok, error) {
    const jobs = pendingJobs
    pendingJobs = []
    jobs.forEach(function(job) {
      try {
        if (ok) {
          job.resolve(true)
        } else {
          job.reject(error)
        }
      } catch (_) {}
    })
  }

  function scheduleFlush() {
    if (flushTimer !== null || inFlight) return
    flushTimer = setTimeout(flushQueue, 24)
  }

  function flushQueue() {
    flushTimer = null
    if (inFlight) return

    if (!global.MathJax || typeof global.MathJax.typesetPromise !== "function") {
      pendingNodes.clear()
      resolveJobs(false)
      return
    }

    const targets = Array.from(pendingNodes)
    pendingNodes.clear()

    if (!targets.length) {
      resolveJobs(true)
      return
    }

    inFlight = true
    global.MathJax.typesetPromise(targets)
      .then(function() {
        resolveJobs(true)
      })
      .catch(function(error) {
        resolveJobs(false, error)
      })
      .finally(function() {
        inFlight = false
        if (pendingNodes.size || pendingJobs.length) {
          scheduleFlush()
        }
      })
  }

  function queueMathTypeset(targets) {
    if (!global.MathJax || typeof global.MathJax.typesetPromise !== "function") {
      return Promise.resolve(false)
    }

    const nodes = normalizeTargets(targets)
    if (!nodes.length) return Promise.resolve(false)

    const hasMathHint = nodes.some(function(node) {
      if (!node) return false
      if (node.querySelector && node.querySelector("script[type^='math/tex'], .mjx-container, math")) {
        return true
      }
      const html = typeof node.innerHTML === "string" ? node.innerHTML : ""
      if (!html) return false
      return /\\\(|\\\[|\\begin\{|\\frac|\\sum|\\int|\$\$|\$[^$]+\$/.test(html)
    })

    if (!hasMathHint) return Promise.resolve(false)

    nodes.forEach(function(node) {
      pendingNodes.add(node)
    })

    return new Promise(function(resolve, reject) {
      pendingJobs.push({ resolve: resolve, reject: reject })
      scheduleFlush()
    })
  }

  function queueMathTypesetSafely(targets, errorPrefix) {
    return queueMathTypeset(targets).catch(function(error) {
      console.error(errorPrefix || "公式渲染失败:", error)
      return false
    })
  }

  function queueAllResearchMathTypeset(root) {
    const scope = root && root.querySelectorAll ? root : document
    const targets = scope.querySelectorAll ? scope.querySelectorAll(".md-rich-text") : []
    return queueMathTypesetSafely(targets, "MN Research 公式渲染失败:")
  }

  global.queueMathTypeset = queueMathTypeset
  global.queueMathTypesetSafely = queueMathTypesetSafely
  global.queueAllResearchMathTypeset = queueAllResearchMathTypeset

  global.addEventListener("mnresearch-mathjax-ready", function() {
    queueAllResearchMathTypeset(document)
  })
})(window)
