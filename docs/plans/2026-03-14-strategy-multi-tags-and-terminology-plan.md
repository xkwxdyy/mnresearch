# Strategy Multi-Tags And Terminology Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let strategies carry multiple method tags while rewriting the confusing strategy/branch closure copy into clearer research language.

**Architecture:** Keep storage backward-compatible by introducing `strategy.methodTags` as the new primary field while continuing to mirror the first tag into legacy `strategy.type`. Reuse the existing history-suggestion flow by extending it into a chip-based multi-tag input, then update all user-facing copy around strategy structure and branch closure without renaming persisted status keys.

**Tech Stack:** Plain browser JavaScript, existing WebView render/actions/store modules, CSS, manual `node --check`

---

### Task 1: Data Model And Vocabulary

**Files:**
- Modify: `scripts/research-data.js`
- Modify: `scripts/research-store.js`

**Step 1:** Add the new strategy method vocabulary, legacy label aliases, and helper functions for normalizing, serializing, resolving, and formatting tag arrays.

**Step 2:** Update strategy normalization so `methodTags` is the canonical array, legacy `type` still survives, and old saved data upgrades automatically on read.

**Step 3:** Update sample strategy data to include `methodTags`, including at least one strategy with multiple tags.

### Task 2: Multi-Tag Strategy Editor

**Files:**
- Modify: `scripts/research-render.js`
- Modify: `scripts/research-actions.js`
- Modify: `styles/research.css`

**Step 1:** Replace the single-value strategy type input with a reusable chip/tag input that supports history suggestions, keyboard commit, and tag removal.

**Step 2:** Wire strategy create/edit actions to read and persist `methodTags`, record each chosen tag into history, and keep `branchIntent` single-value.

**Step 3:** Update strategy list, focus targets, and related UI surfaces to display multiple method tags instead of one legacy type chip.

### Task 3: Terminology Rewrite

**Files:**
- Modify: `scripts/research-data.js`
- Modify: `scripts/research-render.js`
- Modify: `scripts/research-core.js`
- Modify: `CHANGELOG.md`

**Step 1:** Rewrite strategy-field copy to `手法标签` and `这步主要负责什么`.

**Step 2:** Rewrite branch-closure UI copy from `分支/回流` toward `支线/归位` where it is user-facing, including maps, cards, hints, and lifecycle prompts.

**Step 3:** Add a changelog entry describing the multi-tag strategy support and terminology cleanup.

### Task 4: Verification

**Files:**
- Verify: `scripts/research-data.js`
- Verify: `scripts/research-store.js`
- Verify: `scripts/research-render.js`
- Verify: `scripts/research-actions.js`
- Verify: `scripts/research-core.js`

**Step 1:** Run `node --check` on each touched JavaScript file.

**Step 2:** Sanity-check the code paths for:
- new strategy with multiple tags
- edit old strategy with single legacy `type`
- promote strategy into child question
- link existing child question
- record branch closure state with renamed copy

**Step 3:** Review diffs for accidental terminology drift in unrelated `类型` surfaces.
