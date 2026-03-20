(function(global) {
  const INLINE_CACHE_LIMIT = 300
  const BLOCK_CACHE_LIMIT = 300
  const inlineCache = new Map()
  const blockCache = new Map()

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
  }

  function textMayContainMath(text) {
    const value = String(text || "")
    if (!value) return false
    return /\\\(|\\\[|\\begin\{|\\frac|\\sum|\\int|\$\$|\$[^$]+\$/.test(value)
  }

  function stripLatexLeftRightInInlineMath(text) {
    if (!text || typeof text !== "string" || text.indexOf("$") === -1) return text

    const displayMathStash = []
    let output = text

    output = output.replace(/\$\$([\s\S]*?)\$\$/g, function(match) {
      const index = displayMathStash.length
      displayMathStash.push(match)
      return `%%DISPLAY_MATH_${index}%%`
    })

    output = output.replace(/\$([^\$]+?)\$/g, function(match, mathContent) {
      const normalizedContent = String(mathContent || "")
        .replace(/\\left\b[ \t]*/g, "")
        .replace(/\\right\b[ \t]*/g, "")
      return `$${normalizedContent}$`
    })

    displayMathStash.forEach(function(pattern, index) {
      output = output.replace(`%%DISPLAY_MATH_${index}%%`, function() {
        return pattern
      })
    })

    return output
  }

  function remember(cache, key, value, limit) {
    cache.set(key, value)
    if (cache.size > limit) {
      cache.delete(cache.keys().next().value)
    }
    return value
  }

  function makeToken(prefix, index) {
    return `%%${prefix}${index}%%`
  }

  function stashFencedCode(text, fenceStore) {
    return text.replace(/```([a-zA-Z0-9_-]+)?\n?([\s\S]*?)```/g, function(match, language, code) {
      const index = fenceStore.length
      fenceStore.push({
        language: language || "",
        code: String(code || "").replace(/^\n/, "").replace(/\n$/, "")
      })
      return makeToken("BLOCKCODE", index)
    })
  }

  function stashInlineCode(text, inlineCodeStore) {
    return text.replace(/`([^`\n]+?)`/g, function(match, code) {
      const index = inlineCodeStore.length
      inlineCodeStore.push(String(code || ""))
      return makeToken("INLINECODE", index)
    })
  }

  function stashMath(text, mathStore) {
    let output = text

    output = output.replace(/\$\$([\s\S]*?)\$\$/g, function(match) {
      const index = mathStore.length
      mathStore.push(match)
      return makeToken("MATH", index)
    })

    output = output.replace(/\\\[((?:[\s\S](?!\\\]))*[\s\S]?)\\\]/g, function(match) {
      const index = mathStore.length
      mathStore.push(match)
      return makeToken("MATH", index)
    })

    output = output.replace(/\\\(((?:[\s\S](?!\\\)))*[\s\S]?)\\\)/g, function(match) {
      const index = mathStore.length
      mathStore.push(match)
      return makeToken("MATH", index)
    })

    output = output.replace(/\$([^\n$][^$]*?)\$/g, function(match, body) {
      if (!body || /^\s*$/.test(body)) return match
      const index = mathStore.length
      mathStore.push(match)
      return makeToken("MATH", index)
    })

    return output
  }

  function restoreInlineTokens(text, inlineCodeStore, mathStore) {
    let output = text

    output = output.replace(/%%INLINECODE(\d+)%%/g, function(match, index) {
      return `<code class="md-rich-code">${escapeHtml(inlineCodeStore[Number(index)] || "")}</code>`
    })

    output = output.replace(/%%MATH(\d+)%%/g, function(match, index) {
      return escapeHtml(mathStore[Number(index)] || "")
    })

    return output
  }

  function formatInlineMarkdown(text, inlineCodeStore, mathStore) {
    let output = escapeHtml(text)

    output = output
      .replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>")
      .replace(/__([^_]+?)__/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]+?)\*(?!\*)/g, "$1<em>$2</em>")
      .replace(/(^|[^_])_([^_]+?)_(?!_)/g, "$1<em>$2</em>")
      .replace(/\n/g, "<br>")

    return restoreInlineTokens(output, inlineCodeStore, mathStore)
  }

  function renderBlockCode(entry) {
    const languageClass = entry && entry.language
      ? ` language-${escapeHtml(entry.language)}`
      : ""
    return `<pre class="md-rich-pre"><code class="md-rich-codeblock${languageClass}">${escapeHtml(entry && entry.code || "")}</code></pre>`
  }

  function renderParagraph(lines, inlineCodeStore, mathStore) {
    return `<p>${formatInlineMarkdown(lines.join("\n"), inlineCodeStore, mathStore)}</p>`
  }

  function renderList(items, ordered, inlineCodeStore, mathStore) {
    const tag = ordered ? "ol" : "ul"
    return `<${tag}>${items.map(function(item) {
      return `<li>${formatInlineMarkdown(item, inlineCodeStore, mathStore)}</li>`
    }).join("")}</${tag}>`
  }

  function renderBlockquote(lines, inlineCodeStore, mathStore) {
    return `<blockquote>${lines.map(function(line) {
      return `<p>${formatInlineMarkdown(line, inlineCodeStore, mathStore)}</p>`
    }).join("")}</blockquote>`
  }

  function renderBlockHtml(text) {
    const raw = String(text == null ? "" : text).replace(/\r\n?/g, "\n")
    if (!raw) return ""
    if (blockCache.has(raw)) return blockCache.get(raw)

    const fencedCodeStore = []
    const inlineCodeStore = []
    const mathStore = []

    let output = stripLatexLeftRightInInlineMath(raw)
    output = stashFencedCode(output, fencedCodeStore)
    output = stashInlineCode(output, inlineCodeStore)
    output = stashMath(output, mathStore)

    const parts = []
    const lines = output.split("\n")
    let paragraphLines = []
    let quoteLines = []
    let listItems = []
    let listOrdered = false

    function flushParagraph() {
      if (!paragraphLines.length) return
      parts.push(renderParagraph(paragraphLines, inlineCodeStore, mathStore))
      paragraphLines = []
    }

    function flushQuote() {
      if (!quoteLines.length) return
      parts.push(renderBlockquote(quoteLines, inlineCodeStore, mathStore))
      quoteLines = []
    }

    function flushList() {
      if (!listItems.length) return
      parts.push(renderList(listItems, listOrdered, inlineCodeStore, mathStore))
      listItems = []
    }

    lines.forEach(function(line) {
      const trimmed = line.trim()
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
      const unorderedMatch = line.match(/^\s*[-*+]\s+(.+)$/)
      const orderedMatch = line.match(/^\s*\d+\.\s+(.+)$/)
      const quoteMatch = line.match(/^\s*>\s?(.*)$/)
      const codeMatch = trimmed.match(/^%%BLOCKCODE(\d+)%%$/)

      if (!trimmed) {
        flushParagraph()
        flushQuote()
        flushList()
        return
      }

      if (codeMatch) {
        flushParagraph()
        flushQuote()
        flushList()
        parts.push(renderBlockCode(fencedCodeStore[Number(codeMatch[1])]))
        return
      }

      if (headingMatch) {
        flushParagraph()
        flushQuote()
        flushList()
        const level = Math.min(6, headingMatch[1].length)
        parts.push(`<h${level}>${formatInlineMarkdown(headingMatch[2], inlineCodeStore, mathStore)}</h${level}>`)
        return
      }

      if (quoteMatch) {
        flushParagraph()
        flushList()
        quoteLines.push(quoteMatch[1] || "")
        return
      }

      if (unorderedMatch || orderedMatch) {
        flushParagraph()
        flushQuote()
        const nextOrdered = !!orderedMatch
        const itemText = (orderedMatch ? orderedMatch[1] : unorderedMatch[1]) || ""
        if (listItems.length && listOrdered !== nextOrdered) {
          flushList()
        }
        listOrdered = nextOrdered
        listItems.push(itemText)
        return
      }

      flushQuote()
      flushList()
      paragraphLines.push(line)
    })

    flushParagraph()
    flushQuote()
    flushList()

    const html = parts.join("")
    return remember(blockCache, raw, html, BLOCK_CACHE_LIMIT)
  }

  function renderInlineHtml(text) {
    const raw = String(text == null ? "" : text).replace(/\r\n?/g, "\n")
    if (!raw) return ""
    if (inlineCache.has(raw)) return inlineCache.get(raw)

    const inlineCodeStore = []
    const mathStore = []
    let output = stripLatexLeftRightInInlineMath(raw)
    output = stashInlineCode(output, inlineCodeStore)
    output = stashMath(output, mathStore)
    output = formatInlineMarkdown(output, inlineCodeStore, mathStore)
    return remember(inlineCache, raw, output, INLINE_CACHE_LIMIT)
  }

  global.MNResearchMarkdown = {
    escapeHtml: escapeHtml,
    textMayContainMath: textMayContainMath,
    stripLatexLeftRightInInlineMath: stripLatexLeftRightInInlineMath,
    renderInlineHtml: renderInlineHtml,
    renderBlockHtml: renderBlockHtml
  }
})(window)
