// ==UserScript==
// @name         Pokelike Kanto Battle Tower Shiny Hunter
// @namespace    local.pokelike.charmander.hunter
// @version      1.1.1
// @description  Local UI automation helper for shiny hunting in Pokelike Kanto Battle Tower
// @match        https://pokelike.xyz/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

/*
 * Use only in your own browser and respect the game creator's rules.
 *
 * This script is a local-only UI automation helper. It does not modify
 * Pokelike source code, bundled scripts, RNG, saved game data, Pokedex data,
 * achievements, Hall of Fame data, or any Pokelike localStorage keys.
 */

(() => {
  "use strict";

  // ---------------------------------------------------------------------------
  // Constants and persisted settings
  // ---------------------------------------------------------------------------

  const DISCLAIMER = "Use only in your own browser and respect the game creator's rules.";
  const STORAGE_PREFIX = "pkCharmanderHunter_";
  const OVERLAY_ID = "pkCharmanderHunterOverlay";
  const SCRIPT_VERSION = "1.1.1";

  const STATES = {
    IDLE: "IDLE",
    ENTER_MAIN_MENU: "ENTER_MAIN_MENU",
    ENTER_BATTLE_TOWER: "ENTER_BATTLE_TOWER",
    SELECT_KANTO: "SELECT_KANTO",
    SELECT_STARTER: "SELECT_STARTER",
    OPEN_FIRST_CATCH_NODE: "OPEN_FIRST_CATCH_NODE",
    WAIT_FOR_POKEMON_CHOICES: "WAIT_FOR_POKEMON_CHOICES",
    CHECK_FOR_SHINY_TARGET: "CHECK_FOR_SHINY_TARGET",
    CATCH_TARGET: "CATCH_TARGET",
    RESET_RUN: "RESET_RUN",
    FOUND: "FOUND",
    ERROR: "ERROR",
    STOPPED: "STOPPED"
  };

  const CONFIG = {
    targetPokemon: "Charmander",
    starterPokemon: "Magnemite",
    minDelayMs: 300,
    maxDelayMs: 800,
    stopAfterAttempts: 0,
    maxConsecutiveErrors: 5,
    autoCatch: false,
    stopOnAnyShiny: false,
    dryRun: false,
    autoResume: false
  };

  const SELECTORS = {
    pokemonCards: [
      ".poke-choice-wrap",
      ".poke-card",
      ".starter-card",
      ".starter-option",
      ".starter-card-row .poke-card",
      "#catch-choices .poke-card",
      "#starter-choices .poke-card",
      ".pc-box .dex-card",
      ".pc-dex-card",
      ".dex-card",
      "[class*='card']"
    ],
    pokemonName: ".poke-name, .dex-name, [class*='poke-name'], [class*='dex-name']",
    shiny: [
      ".shiny-badge",
      "img.poke-sprite.shiny",
      "img.shiny",
      "img[src*='/shiny/']",
      "[class*='shiny']"
    ],
    catchIcons: [
      "image[href='sprites/catchPokemon.png']",
      "image[href$='catchPokemon.png']",
      "img[src$='catchPokemon.png']"
    ],
    mapClickables: [
      "#map-container [role='button']",
      "#map-container [tabindex]",
      "#map-container [onclick]",
      "#map-container [style*='cursor']",
      "#map-container .map-node--clickable",
      "#map-container .map-node",
      "#map-container button"
    ],
    newRunButton: "#btn-new-run"
  };

  const STATE_TIMEOUTS = {
    [STATES.ENTER_MAIN_MENU]: 12000,
    [STATES.ENTER_BATTLE_TOWER]: 16000,
    [STATES.SELECT_KANTO]: 22000,
    [STATES.SELECT_STARTER]: 16000,
    [STATES.OPEN_FIRST_CATCH_NODE]: 25000,
    [STATES.WAIT_FOR_POKEMON_CHOICES]: 18000,
    [STATES.CHECK_FOR_SHINY_TARGET]: 10000,
    [STATES.CATCH_TARGET]: 10000,
    [STATES.RESET_RUN]: 25000
  };

  const runtime = {
    running: false,
    paused: false,
    state: STATES.IDLE,
    attempts: readNumber("attempts", 0, 0, Number.MAX_SAFE_INTEGER),
    consecutiveErrors: 0,
    lastError: "",
    lastMessage: "",
    lastScreen: "",
    foundCard: null,
    foundMessage: "",
    stopReason: "",
    loopToken: 0,
    overlayHidden: readBool("overlayHidden", false),
    logs: []
  };

  const settings = loadSettings();

  let overlay = null;
  let overlayFields = {};

  function storageKey(name) {
    return `${STORAGE_PREFIX}${name}`;
  }

  function readNumber(name, fallback, min, max) {
    try {
      const raw = localStorage.getItem(storageKey(name));
      if (raw === null || raw === "") return fallback;
      const value = Number(raw);
      if (!Number.isFinite(value)) return fallback;
      return Math.min(max, Math.max(min, value));
    } catch (error) {
      return fallback;
    }
  }

  function readBool(name, fallback) {
    try {
      const raw = localStorage.getItem(storageKey(name));
      if (raw === null) return fallback;
      return raw === "true";
    } catch (error) {
      return fallback;
    }
  }

  function readString(name, fallback) {
    try {
      const raw = localStorage.getItem(storageKey(name));
      return sanitizePokemonName(raw) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function sanitizePokemonName(value) {
    return String(value || "")
      .replace(/[^A-Za-z0-9 .'-]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 32);
  }

  function writeStorage(name, value) {
    try {
      localStorage.setItem(storageKey(name), String(value));
    } catch (error) {
      log(`Could not persist ${name}: ${error.message || error}`);
    }
  }

  function loadSettings() {
    return {
      targetPokemon: readString("targetPokemon", CONFIG.targetPokemon),
      starterPokemon: readString("starterPokemon", CONFIG.starterPokemon),
      minDelayMs: readNumber("minDelayMs", CONFIG.minDelayMs, 0, 60000),
      maxDelayMs: readNumber("maxDelayMs", CONFIG.maxDelayMs, 0, 60000),
      stopAfterAttempts: readNumber("stopAfterAttempts", CONFIG.stopAfterAttempts, 0, Number.MAX_SAFE_INTEGER),
      autoCatch: readBool("autoCatch", CONFIG.autoCatch),
      stopOnAnyShiny: readBool("stopOnAnyShiny", CONFIG.stopOnAnyShiny),
      dryRun: readBool("dryRun", CONFIG.dryRun),
      autoResume: readBool("autoResume", CONFIG.autoResume)
    };
  }

  function persistSettings() {
    settings.targetPokemon = sanitizePokemonName(settings.targetPokemon) || CONFIG.targetPokemon;
    settings.starterPokemon = sanitizePokemonName(settings.starterPokemon) || CONFIG.starterPokemon;
    const minDelay = Math.max(0, Number(settings.minDelayMs) || CONFIG.minDelayMs);
    const maxDelay = Math.max(0, Number(settings.maxDelayMs) || CONFIG.maxDelayMs);
    settings.minDelayMs = Math.min(minDelay, maxDelay);
    settings.maxDelayMs = Math.max(minDelay, maxDelay);
    settings.stopAfterAttempts = Math.max(0, Math.floor(Number(settings.stopAfterAttempts) || 0));

    writeStorage("targetPokemon", settings.targetPokemon);
    writeStorage("starterPokemon", settings.starterPokemon);
    writeStorage("minDelayMs", settings.minDelayMs);
    writeStorage("maxDelayMs", settings.maxDelayMs);
    writeStorage("stopAfterAttempts", settings.stopAfterAttempts);
    writeStorage("autoCatch", settings.autoCatch);
    writeStorage("stopOnAnyShiny", settings.stopOnAnyShiny);
    writeStorage("dryRun", settings.dryRun);
    writeStorage("autoResume", settings.autoResume);
    updateOverlay();
  }

  function persistAttempts() {
    writeStorage("attempts", runtime.attempts);
  }

  // ---------------------------------------------------------------------------
  // Overlay UI
  // ---------------------------------------------------------------------------

  function createOverlay() {
    if (document.getElementById(OVERLAY_ID)) return;

    const style = document.createElement("style");
    style.textContent = `
      #${OVERLAY_ID} {
        position: fixed;
        top: 12px;
        right: 12px;
        z-index: 2147483646;
        width: min(360px, calc(100vw - 24px));
        max-height: calc(100vh - 24px);
        overflow: auto;
        background: #111827;
        color: #f8fafc;
        border: 1px solid #475569;
        box-shadow: 0 14px 36px rgba(0, 0, 0, 0.45);
        border-radius: 8px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 13px;
        line-height: 1.35;
      }
      #${OVERLAY_ID}[data-hidden="true"] {
        width: auto;
        max-height: none;
        overflow: visible;
        background: transparent;
        border: 0;
        box-shadow: none;
      }
      #${OVERLAY_ID}[data-hidden="true"] .pkh-head,
      #${OVERLAY_ID}[data-hidden="true"] .pkh-body {
        display: none;
      }
      #${OVERLAY_ID} .pkh-restore {
        display: none;
      }
      #${OVERLAY_ID}[data-hidden="true"] .pkh-restore {
        display: block;
      }
      #${OVERLAY_ID} .pkh-restore button {
        background: #0f172a;
        border-color: #38bdf8;
        box-shadow: 0 10px 26px rgba(0, 0, 0, 0.35);
        font-weight: 700;
      }
      #${OVERLAY_ID} * {
        box-sizing: border-box;
      }
      #${OVERLAY_ID} .pkh-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border-bottom: 1px solid #334155;
        background: #0f172a;
      }
      #${OVERLAY_ID} .pkh-title {
        font-weight: 700;
        font-size: 13px;
      }
      #${OVERLAY_ID} .pkh-body {
        display: grid;
        gap: 10px;
        padding: 12px;
      }
      #${OVERLAY_ID} .pkh-row,
      #${OVERLAY_ID} .pkh-buttons {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }
      #${OVERLAY_ID} button {
        border: 1px solid #64748b;
        border-radius: 6px;
        background: #1f2937;
        color: #f8fafc;
        padding: 6px 9px;
        cursor: pointer;
        font: inherit;
      }
      #${OVERLAY_ID} button:hover {
        background: #334155;
      }
      #${OVERLAY_ID} button[data-kind="start"] {
        background: #166534;
        border-color: #22c55e;
      }
      #${OVERLAY_ID} button[data-kind="stop"] {
        background: #7f1d1d;
        border-color: #ef4444;
      }
      #${OVERLAY_ID} .pkh-grid {
        display: grid;
        grid-template-columns: minmax(92px, auto) 1fr;
        gap: 6px 8px;
      }
      #${OVERLAY_ID} .pkh-label {
        color: #cbd5e1;
      }
      #${OVERLAY_ID} .pkh-value {
        color: #fff;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      #${OVERLAY_ID} input[type="number"] {
        width: 92px;
        border: 1px solid #475569;
        border-radius: 6px;
        background: #020617;
        color: #f8fafc;
        padding: 5px 7px;
        font: inherit;
      }
      #${OVERLAY_ID} input[type="text"] {
        width: 130px;
        border: 1px solid #475569;
        border-radius: 6px;
        background: #020617;
        color: #f8fafc;
        padding: 5px 7px;
        font: inherit;
      }
      #${OVERLAY_ID} label {
        display: flex;
        gap: 7px;
        align-items: flex-start;
        color: #e2e8f0;
      }
      #${OVERLAY_ID} input[type="checkbox"] {
        margin-top: 2px;
      }
      #${OVERLAY_ID} .pkh-disclaimer {
        padding: 8px;
        border: 1px solid #854d0e;
        border-radius: 6px;
        color: #fde68a;
        background: #451a03;
      }
      #${OVERLAY_ID} .pkh-found {
        display: none;
        padding: 10px;
        border-radius: 6px;
        background: #14532d;
        border: 1px solid #22c55e;
        color: #dcfce7;
        font-weight: 700;
        text-align: center;
      }
      #${OVERLAY_ID} .pkh-found[data-show="true"] {
        display: block;
      }
      #${OVERLAY_ID} .pkh-log {
        max-height: 150px;
        overflow: auto;
        padding: 8px;
        border-radius: 6px;
        background: #020617;
        border: 1px solid #1e293b;
        color: #cbd5e1;
        font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
        font-size: 11px;
        white-space: pre-wrap;
      }
    `;
    document.head.appendChild(style);

    overlay = document.createElement("section");
    overlay.id = OVERLAY_ID;
    overlay.setAttribute("aria-label", "Pokelike Shiny Hunter");
    overlay.dataset.hidden = String(runtime.overlayHidden);
    overlay.innerHTML = `
      <div class="pkh-restore">
        <button type="button" data-action="show">Shiny Hunter - Show</button>
      </div>
      <div class="pkh-head">
        <div class="pkh-title">Shiny Hunter - v${escapeHtml(SCRIPT_VERSION)}</div>
        <button type="button" data-action="hide">Hide</button>
      </div>
      <div class="pkh-body">
        <div class="pkh-disclaimer">${escapeHtml(DISCLAIMER)}</div>
        <div class="pkh-found" data-field="found">Shiny target found!</div>
        <div class="pkh-buttons">
          <button type="button" data-action="start" data-kind="start">Start</button>
          <button type="button" data-action="pause">Pause</button>
          <button type="button" data-action="stop" data-kind="stop">Stop</button>
          <button type="button" data-action="copylog">Copy log</button>
        </div>
        <div class="pkh-grid">
          <div class="pkh-label">Attempts</div><div class="pkh-value" data-field="attempts">0</div>
          <div class="pkh-label">State</div><div class="pkh-value" data-field="state">IDLE</div>
          <div class="pkh-label">Screen</div><div class="pkh-value" data-field="screen">unknown</div>
          <div class="pkh-label">Last error</div><div class="pkh-value" data-field="error">none</div>
          <div class="pkh-label">Target</div><div class="pkh-value" data-field="target">Shiny Charmander</div>
          <div class="pkh-label">Starter</div><div class="pkh-value" data-field="starter">Magnemite</div>
        </div>
        <div class="pkh-row">
          <label>Target <input type="text" maxlength="32" data-setting="targetPokemon" placeholder="Charmander"></label>
          <label>Starter <input type="text" maxlength="32" data-setting="starterPokemon" placeholder="Magnemite"></label>
        </div>
        <div class="pkh-row">
          <label>Min delay <input type="number" min="0" step="50" data-setting="minDelayMs"></label>
          <label>Max delay <input type="number" min="0" step="50" data-setting="maxDelayMs"></label>
        </div>
        <div class="pkh-row">
          <label>Stop after N attempts <input type="number" min="0" step="1" data-setting="stopAfterAttempts"></label>
        </div>
        <label><input type="checkbox" data-setting="autoCatch"> Catch shiny target automatically</label>
        <label><input type="checkbox" data-setting="stopOnAnyShiny"> Stop on any shiny</label>
        <label><input type="checkbox" data-setting="dryRun"> Dry run mode</label>
        <label><input type="checkbox" data-setting="autoResume"> Auto resume after reload</label>
        <div class="pkh-label">Escape stops immediately. Insert toggles this panel.</div>
        <div class="pkh-log" data-field="log"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlayFields = {
      attempts: overlay.querySelector("[data-field='attempts']"),
      state: overlay.querySelector("[data-field='state']"),
      screen: overlay.querySelector("[data-field='screen']"),
      error: overlay.querySelector("[data-field='error']"),
      target: overlay.querySelector("[data-field='target']"),
      starter: overlay.querySelector("[data-field='starter']"),
      log: overlay.querySelector("[data-field='log']"),
      found: overlay.querySelector("[data-field='found']")
    };

    overlay.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const action = button.dataset.action;
      if (action === "start") startBot();
      if (action === "pause") togglePause();
      if (action === "stop") stopBot("Stopped by overlay button.", STATES.STOPPED);
      if (action === "hide") toggleOverlayVisibility();
      if (action === "show") toggleOverlayVisibility(false);
      if (action === "copylog") copyDebugLog();
    });

    overlay.querySelectorAll("[data-setting]").forEach((input) => {
      const name = input.dataset.setting;
      if (input.type === "checkbox") {
        input.checked = Boolean(settings[name]);
      } else {
        input.value = settings[name];
      }
      input.addEventListener("change", () => {
        if (input.type === "checkbox") {
          settings[name] = input.checked;
        } else if (input.type === "text") {
          settings[name] = sanitizePokemonName(input.value);
          input.value = settings[name];
        } else {
          settings[name] = Number(input.value);
        }
        persistSettings();
      });
    });

    updateOverlay();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function updateOverlay() {
    if (!overlay) return;
    overlay.dataset.hidden = String(runtime.overlayHidden);
    runtime.lastScreen = detectCurrentScreen();
    if (overlayFields.attempts) overlayFields.attempts.textContent = String(runtime.attempts);
    if (overlayFields.state) overlayFields.state.textContent = runtime.paused ? `${runtime.state} (paused)` : runtime.state;
    if (overlayFields.screen) overlayFields.screen.textContent = runtime.lastScreen || "unknown";
    if (overlayFields.error) overlayFields.error.textContent = runtime.lastError || "none";
    if (overlayFields.target) overlayFields.target.textContent = `Shiny ${settings.targetPokemon}`;
    if (overlayFields.starter) overlayFields.starter.textContent = settings.starterPokemon;
    if (overlayFields.log) overlayFields.log.textContent = runtime.logs.slice(-12).join("\n");
    if (overlayFields.found) overlayFields.found.dataset.show = String(runtime.state === STATES.FOUND);
    if (overlayFields.found) overlayFields.found.textContent = runtime.foundMessage || `Shiny ${settings.targetPokemon} found!`;

    if (overlay) {
      overlay.querySelectorAll("[data-setting]").forEach((input) => {
        const name = input.dataset.setting;
        if (!(name in settings)) return;
        if (input.type === "checkbox") input.checked = Boolean(settings[name]);
        else input.value = settings[name];
      });
    }
  }

  function toggleOverlayVisibility(forceHidden) {
    runtime.overlayHidden = typeof forceHidden === "boolean" ? forceHidden : !runtime.overlayHidden;
    writeStorage("overlayHidden", runtime.overlayHidden);
    updateOverlay();
  }

  // ---------------------------------------------------------------------------
  // Core utilities
  // ---------------------------------------------------------------------------

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function randomSleep(min, max) {
    const low = Math.max(0, Number(min) || 0);
    const high = Math.max(low, Number(max) || low);
    const delay = Math.floor(low + Math.random() * (high - low + 1));
    await sleep(delay);
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeForCompare(value) {
    return normalizeText(value).toLowerCase();
  }

  function getElementText(el) {
    if (!el) return "";
    const aria = el.getAttribute && (el.getAttribute("aria-label") || el.getAttribute("title") || el.getAttribute("alt"));
    const text = "innerText" in el ? el.innerText : el.textContent;
    return normalizeText(text || aria || "");
  }

  function textEquals(el, text) {
    return normalizeForCompare(getElementText(el)) === normalizeForCompare(text);
  }

  function queryAll(selector, scope = document) {
    try {
      return Array.from(scope.querySelectorAll(selector));
    } catch (error) {
      log(`Bad selector skipped: ${selector}`);
      return [];
    }
  }

  function isOverlayElement(el) {
    return Boolean(el && el.closest && el.closest(`#${OVERLAY_ID}`));
  }

  function isVisible(el) {
    if (!el || !(el instanceof Element)) return false;
    if (isOverlayElement(el)) return false;
    const style = window.getComputedStyle(el);
    if (!style || style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
      return false;
    }
    if (el.classList && el.classList.contains("screen") && !el.classList.contains("active")) return false;
    if (!hasUsableBox(el)) return false;
    return true;
  }

  function hasUsableBox(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 1 && rect.height > 1) return true;
    if (typeof el.getBBox === "function") {
      try {
        const box = el.getBBox();
        return box && box.width > 1 && box.height > 1;
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  function getElementCenter(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 1 && rect.height > 1) {
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }
    return {
      x: Math.max(0, Math.min(window.innerWidth - 1, window.innerWidth / 2)),
      y: Math.max(0, Math.min(window.innerHeight - 1, window.innerHeight / 2))
    };
  }

  function uniqueElements(elements) {
    return Array.from(new Set(elements.filter(Boolean)));
  }

  function sortByScreenPosition(elements) {
    return elements.slice().sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return (ar.top - br.top) || (ar.left - br.left);
    });
  }

  function findButtonByText(texts) {
    const targets = (Array.isArray(texts) ? texts : [texts]).map(normalizeForCompare);
    const selector = [
      "button",
      "a",
      "div[role='button']",
      "[role='button']",
      "[class*='button']",
      "[class*='btn']",
      "input[type='button']",
      "input[type='submit']"
    ].join(",");
    const candidates = queryAll(selector).filter(isVisible);
    const scored = [];

    for (const el of candidates) {
      const text = normalizeForCompare(getElementText(el));
      const aria = normalizeForCompare(el.getAttribute("aria-label") || el.getAttribute("title") || el.value || "");
      for (const target of targets) {
        if (!target) continue;
        if (text === target || aria === target) {
          scored.push({ el, score: 0 });
          break;
        }
        if (text.includes(target) || aria.includes(target)) {
          scored.push({ el, score: 1 });
          break;
        }
      }
    }

    scored.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      const ar = a.el.getBoundingClientRect();
      const br = b.el.getBoundingClientRect();
      return (ar.top - br.top) || (ar.left - br.left);
    });

    return scored[0] ? scored[0].el : null;
  }

  function findActionByText(texts, extraSelectors = []) {
    const base = [
      "button",
      "a",
      "[role='button']",
      "[tabindex]",
      "[onclick]",
      ".title-mode-card",
      ".title-mode-resume",
      ".history-region-btn",
      ".poke-card",
      ".dex-card"
    ];
    const candidates = queryAll(base.concat(extraSelectors).join(",")).filter(isVisible);
    const targets = (Array.isArray(texts) ? texts : [texts]).map(normalizeForCompare);
    const scored = [];

    for (const el of candidates) {
      const text = normalizeForCompare(getElementText(el));
      for (const target of targets) {
        if (!target) continue;
        if (text === target) {
          scored.push({ el, score: 0 });
          break;
        }
        if (text.includes(target)) {
          scored.push({ el, score: 1 });
          break;
        }
      }
    }

    scored.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      const ar = a.el.getBoundingClientRect();
      const br = b.el.getBoundingClientRect();
      return (ar.top - br.top) || (ar.left - br.left);
    });

    return scored[0] ? scored[0].el : null;
  }

  function safeClick(el, label) {
    if (!el) {
      log(`Click skipped, missing element: ${label}`);
      return false;
    }
    if (!isVisible(el)) {
      log(`Click skipped, hidden element: ${label}`);
      return false;
    }

    if (settings.dryRun) {
      log(`[dry run] Would click ${label}: ${describeElement(el)}`);
      return true;
    }

    try {
      el.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
    } catch (error) {
      try {
        el.scrollIntoView();
      } catch (innerError) {
        // Non-critical; continue with event dispatch.
      }
    }

    const center = getElementCenter(el);
    const eventOptions = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: center.x,
      clientY: center.y,
      screenX: window.screenX + center.x,
      screenY: window.screenY + center.y,
      button: 0,
      buttons: 1
    };
    if (typeof PointerEvent === "function") {
      ["pointerdown", "pointerup"].forEach((type) => {
        el.dispatchEvent(new PointerEvent(type, { ...eventOptions, pointerId: 1, pointerType: "mouse", isPrimary: true }));
      });
    }
    ["mousedown", "mouseup", "click"].forEach((type) => {
      el.dispatchEvent(new MouseEvent(type, eventOptions));
    });
    if (typeof el.click === "function") {
      el.click();
    }
    log(`Clicked ${label}: ${describeElement(el)}`);
    return true;
  }

  function pressKey(key, code) {
    if (settings.dryRun) {
      log(`[dry run] Would press ${key} (${code})`);
      return true;
    }

    const keyCode = code === "KeyR" ? 82 : key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0;
    const options = {
      key,
      code,
      keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true
    };
    document.dispatchEvent(new KeyboardEvent("keydown", options));
    document.dispatchEvent(new KeyboardEvent("keyup", options));
    log(`Pressed ${key} (${code})`);
    return true;
  }

  async function waitForCondition(fn, timeoutMs, pollMs, label) {
    const start = Date.now();
    let lastError = null;
    while (Date.now() - start <= timeoutMs) {
      if (!runtime.running && runtime.state !== STATES.FOUND) return null;
      try {
        const result = fn();
        if (result) return result;
      } catch (error) {
        lastError = error;
      }
      await sleep(pollMs);
    }
    if (lastError) log(`Wait ${label} last error: ${lastError.message || lastError}`);
    log(`Wait timed out: ${label}`);
    return null;
  }

  function describeElement(el) {
    if (!el) return "null";
    const id = el.id ? `#${el.id}` : "";
    const cls = el.className && typeof el.className === "string"
      ? `.${el.className.trim().replace(/\s+/g, ".")}`
      : "";
    const text = getElementText(el);
    return `${el.tagName.toLowerCase()}${id}${cls}${text ? ` "${text.slice(0, 80)}"` : ""}`;
  }

  // ---------------------------------------------------------------------------
  // Pokemon and shiny detection
  // ---------------------------------------------------------------------------

  function getAllPokemonCards(scope = document) {
    const cards = [];

    for (const selector of SELECTORS.pokemonCards) {
      cards.push(...queryAll(selector, scope));
    }

    for (const nameEl of queryAll(SELECTORS.pokemonName, scope)) {
      const card = nameEl.closest(".poke-card, .poke-choice-wrap, .starter-card, .starter-option, .pc-box .dex-card, .dex-card, [role='button'], [tabindex], [class*='card']");
      cards.push(card || nameEl.parentElement);
    }

    return uniqueElements(cards).filter((el) => el instanceof Element && isVisible(el));
  }

  function cleanPokemonName(raw) {
    if (!raw) return null;
    const lines = String(raw)
      .split(/\r?\n| {2,}/)
      .map((line) => normalizeText(line))
      .filter(Boolean);
    const excluded = /^(hp|atk|def|sp\.?atk|sp\.?def|speed|type|ability|choose|skip|flee|team|items|badges|passive|caught|level|lvl)$/i;

    for (const line of lines.length ? lines : [normalizeText(raw)]) {
      let candidate = line
        .replace(/^[*+\-\s]+/, "")
        .replace(/\b(shiny|caught|new)\b/gi, " ")
        .replace(/\b(lv|lvl|level)\.?\s*\d+.*$/i, "")
        .replace(/\s+#?\d+.*$/i, "")
        .replace(/[^A-Za-z0-9 .'_-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (!candidate || excluded.test(candidate)) continue;
      if (candidate.length > 32) continue;
      if (!/[A-Za-z]/.test(candidate)) continue;
      return candidate;
    }

    return null;
  }

  function getPokemonName(card) {
    if (!card) return null;
    const preferred = card.querySelector(SELECTORS.pokemonName);
    if (preferred && isVisible(preferred)) {
      const name = cleanPokemonName(preferred.innerText || preferred.textContent);
      if (name) return name;
    }

    const fallbackText = card.innerText || card.textContent || "";
    return cleanPokemonName(fallbackText);
  }

  function isCardShiny(card) {
    if (!card) return false;

    for (const selector of SELECTORS.shiny) {
      const marker = card.matches(selector) ? card : card.querySelector(selector);
      if (marker && marker instanceof Element && isVisible(marker)) return true;
    }

    let current = card;
    for (let depth = 0; current && current instanceof Element && depth < 4; depth += 1) {
      const className = typeof current.className === "string" ? current.className : "";
      if (/\bshiny\b|shiny-/i.test(className)) return true;
      current = current.parentElement;
    }

    const images = queryAll("img, image", card);
    for (const img of images) {
      const src = img.getAttribute("src") || img.getAttribute("href") || img.getAttribute("xlink:href") || "";
      if (/\/shiny\/|shiny/i.test(src)) return true;
    }

    return false;
  }

  function findPokemonCard(name, shinyOnly) {
    return findPokemonCardInCards(getAllPokemonCards(), name, shinyOnly);
  }

  function findPokemonCardInCards(cards, name, shinyOnly) {
    const wanted = normalizeForCompare(name);
    for (const card of cards) {
      const cardName = getPokemonName(card);
      if (normalizeForCompare(cardName) !== wanted) continue;
      if (shinyOnly && !isCardShiny(card)) continue;
      return card;
    }
    return null;
  }

  function findAnyShinyCard(cards) {
    return cards.find(isCardShiny) || null;
  }

  function getVisibleChoiceCards() {
    const catchChoices = document.querySelector("#catch-choices");
    if (catchChoices && isVisible(catchChoices)) {
      return getAllPokemonCards(catchChoices).filter((card) => !card.closest("#catch-team-bar"));
    }
    const catchScreen = document.querySelector("#catch-screen");
    if (catchScreen && isVisible(catchScreen)) {
      return getAllPokemonCards(catchScreen).filter((card) => !card.closest("#catch-team-bar"));
    }
    return getAllPokemonCards();
  }

  function getClickableCardElement(card) {
    if (!card) return null;
    if (isVisible(card) && (card.matches("[role='button'], [tabindex], button, .poke-card, .dex-card") || card.onclick)) {
      return card;
    }
    const child = queryAll("[role='button'], [tabindex], button, .poke-card, .dex-card", card).find(isVisible);
    return child || card;
  }

  function getCardDebugRows(cards = getAllPokemonCards()) {
    return cards.map((card) => ({
      name: getPokemonName(card),
      shiny: isCardShiny(card),
      element: card
    }));
  }

  function logChoiceCards() {
    const rows = getCardDebugRows(getVisibleChoiceCards());
    log(`[dry run] Pokemon cards: ${rows.map((row) => `${row.name || "unknown"}:${row.shiny ? "shiny" : "normal"}`).join(", ") || "none"}`);
    console.table(rows.map((row) => ({ name: row.name, shiny: row.shiny, element: describeElement(row.element) })));
  }

  // ---------------------------------------------------------------------------
  // Pokelike screen and route helpers
  // ---------------------------------------------------------------------------

  function screenVisible(id) {
    const el = document.getElementById(id);
    return Boolean(el && isVisible(el));
  }

  function activeScreenId() {
    const active = queryAll(".screen.active").find(isVisible);
    if (active) return active.id || "";
    const visibleScreens = queryAll(".screen").filter(isVisible);
    return visibleScreens[0] ? visibleScreens[0].id || "" : "";
  }

  function bodyText() {
    return normalizeText(document.body ? document.body.innerText || document.body.textContent : "");
  }

  function detectCurrentScreen() {
    if (document.documentElement.classList.contains("poke-maint-on")) return "maintenance";

    const active = activeScreenId();
    if (active) return active;

    const text = bodyText();
    if (/Wild Pokemon Appeared/i.test(text) || (document.querySelector("#catch-choices") && isVisible(document.querySelector("#catch-choices")))) return "catch-screen";
    if (/Choose Your Starter/i.test(text) || screenVisible("starter-screen")) return "starter-screen";
    if (/Battle Tower/i.test(text) && document.querySelector("#stage-select-list")) return "endless-stage-select";
    if (/GAME OVER/i.test(text)) return "gameover-screen";
    if (/Wild Battle/i.test(text)) return "battle-screen";
    if (/Pokemon Roguelike/i.test(text) && /Battle Tower/i.test(text)) return "title-screen";
    if (document.querySelector("#map-container svg") && isVisible(document.querySelector("#map-container"))) return "map-screen";
    return "unknown";
  }

  function stateForCurrentScreen() {
    const screen = detectCurrentScreen();
    runtime.lastScreen = screen;

    if (screen === "title-screen") return STATES.ENTER_BATTLE_TOWER;
    if (screen === "history-region-select") return STATES.ENTER_BATTLE_TOWER;
    if (screen === "endless-stage-select") return STATES.SELECT_KANTO;
    if (screen === "starter-screen") return STATES.SELECT_STARTER;
    if (screen === "map-screen") return STATES.OPEN_FIRST_CATCH_NODE;
    if (screen === "catch-screen") return STATES.WAIT_FOR_POKEMON_CHOICES;
    if (screen === "gameover-screen" || screen === "win-screen" || screen === "endless-stage-complete") return STATES.RESET_RUN;
    if (screen === "battle-screen" || screen === "item-screen" || screen === "passive-screen" || screen === "swap-screen" || screen === "trade-screen" || screen === "elite-prep-screen") {
      return STATES.RESET_RUN;
    }
    return STATES.ENTER_BATTLE_TOWER;
  }

  function findStageButton(stageName) {
    const locked = [];
    const candidates = queryAll("#stage-select-list .history-region-btn, .history-region-btn, #stage-select-list [role='button'], #stage-select-list button").filter(isVisible);
    for (const el of candidates) {
      const nameEl = el.querySelector(".history-region-name") || el;
      if (!textEquals(nameEl, stageName) && !normalizeForCompare(getElementText(nameEl)).includes(normalizeForCompare(stageName))) continue;
      if (el.classList.contains("history-region-btn--locked") || /locked/i.test(getElementText(el))) {
        locked.push(el);
        continue;
      }
      return el;
    }

    if (locked.length) return { locked: true, element: locked[0] };
    return findActionByText([stageName], ["#stage-select-list *"]);
  }

  function findCatchRouteIcon() {
    const candidates = [];
    for (const selector of SELECTORS.catchIcons) {
      const matches = queryAll(selector);
      candidates.push(...matches);
      const match = matches.find(isVisible);
      if (match) return preferredClickableAncestor(match);
    }

    const svgImages = queryAll("#map-container svg image, svg image").filter((el) => {
      const href = el.getAttribute("href") || el.getAttribute("xlink:href") || "";
      const matched = /catchPokemon/i.test(href);
      if (matched) candidates.push(el);
      return matched && isVisible(el);
    });
    if (svgImages.length) return preferredClickableAncestor(svgImages[0]);

    const htmlImages = queryAll("#map-container img, img").filter((el) => {
      const src = el.getAttribute("src") || "";
      const matched = /catchPokemon/i.test(src);
      if (matched) candidates.push(el);
      return matched && isVisible(el);
    });
    if (htmlImages.length) return preferredClickableAncestor(htmlImages[0]);

    const mapNodes = queryAll("#map-container svg g.map-node--clickable, #map-container svg g.map-node").filter((node) => {
      const image = node.querySelector("image, img");
      const href = image ? image.getAttribute("href") || image.getAttribute("xlink:href") || image.getAttribute("src") || "" : "";
      const matched = /catchPokemon/i.test(href);
      if (matched) candidates.push(node);
      return matched && isVisible(node);
    });
    if (mapNodes[0]) return mapNodes[0];

    const pokeballNodes = getMapClickableCandidates().filter((node) => {
      const hint = getMapElementHint(node);
      return isPointerRouteHint(hint) && isLikelyPokeballCatchRouteHint(hint) && !isDisabledRouteHint(hint);
    });
    if (pokeballNodes[0]) {
      log("Opening first pokeball catch node.");
      return pokeballNodes[0];
    }

    const grassNodes = getMapClickableCandidates().filter((node) => {
      const hint = getMapElementHint(node);
      return isPointerRouteHint(hint) && isLikelyGrassRouteHint(hint) && !isKnownNonCatchRouteHint(hint) && !isDisabledRouteHint(hint);
    });
    if (grassNodes[0]) {
      log("No pokeball catch node found; opening grass route fallback.");
      return grassNodes[0];
    }

    const fallback = findFirstMapRouteNodeFallback();
    if (fallback) {
      log("No known catch icon found; opening first available route fallback.");
      return fallback;
    }

    console.debug("[pkCharmanderHunter] No catch node found.", {
      catchCandidates: summarizeElements(uniqueElements(candidates), 12),
      mapElements: summarizeMapElements(20)
    });
    log("No visible catch node found.");
    return null;
  }

  function preferredClickableAncestor(el) {
    if (!el) return null;
    const clickable = el.closest("g.map-node--clickable, g.map-node, [role='button'], [tabindex], button, a, [onclick]");
    return clickable && isVisible(clickable) ? clickable : el;
  }

  function getMapContainer() {
    const map = document.querySelector("#map-container");
    return map && isVisible(map) ? map : null;
  }

  function getMapClickableCandidates() {
    const map = getMapContainer();
    if (!map) return [];

    const candidates = [];
    for (const selector of SELECTORS.mapClickables) {
      candidates.push(...queryAll(selector, map));
    }

    queryAll("img, image, svg *", map).forEach((el) => {
      const hint = getMapElementHint(el);
      if (isCatchRouteHint(hint) || isLikelyPokeballCatchRouteHint(hint) || isLikelyGrassRouteHint(hint) || /cursor:\s*pointer/i.test(hint)) {
        candidates.push(preferredClickableAncestor(el));
      }
    });

    return uniqueElements(candidates)
      .filter((el) => el && el instanceof Element && isVisible(el))
      .filter((el) => !el.closest("#run-menu-bar, .map-menu-icons, #map-node-tooltip, #item-tooltip, #trait-tooltip"));
  }

  function getMapElementHint(el) {
    if (!el) return "";
    const attrs = [
      el.id,
      typeof el.className === "string" ? el.className : "",
      el.getAttribute("aria-label"),
      el.getAttribute("title"),
      el.getAttribute("data-tip"),
      el.getAttribute("data-type"),
      el.getAttribute("data-node-type"),
      el.getAttribute("data-event"),
      el.getAttribute("href"),
      el.getAttribute("xlink:href"),
      el.getAttribute("src"),
      el.getAttribute("style"),
      getElementText(el)
    ];
    const image = el.querySelector && el.querySelector("image, img");
    if (image) {
      attrs.push(image.getAttribute("href"), image.getAttribute("xlink:href"), image.getAttribute("src"), image.getAttribute("alt"));
    }
    return attrs.filter(Boolean).join(" ");
  }

  function isCatchRouteHint(hint) {
    return /catchPokemon|catch-pokemon|catch_pokemon|pokemon-route|wild|encounter/i.test(hint);
  }

  function isLikelyGrassRouteHint(hint) {
    return /img\/sprites\/g\d\/grass\.png|\/grass\.png/i.test(hint);
  }

  function isLikelyPokeballCatchRouteHint(hint) {
    return /img\/sprites\/g\d\/pokeball\.png|\/pokeball\.png/i.test(hint);
  }

  function isKnownNonCatchRouteHint(hint) {
    return /bug-catcher|team-rocket|hiker|scientist|ace-trainer|mistery-trainer|mystery-trainer|item-icon|poke-center|question-mark|trainer/i.test(hint);
  }

  function isDisabledRouteHint(hint) {
    return /cursor:\s*default|opacity:\s*0\.75|filter:\s*brightness|done|complete|disabled|locked/i.test(hint);
  }

  function isPointerRouteHint(hint) {
    return /cursor:\s*pointer/i.test(hint);
  }

  function findFirstMapRouteNodeFallback() {
    const candidates = getMapClickableCandidates();
    if (!candidates.length) return null;

    const scored = candidates.map((el, index) => {
      const hint = getMapElementHint(el);
      const pointer = isPointerRouteHint(hint);
      let score = pointer ? 20 : 140;
      score += index;
      if (isCatchRouteHint(hint)) score -= 90;
      if (isLikelyPokeballCatchRouteHint(hint)) score -= 100;
      if (isLikelyGrassRouteHint(hint)) score -= 35;
      if (/map-node|node|route/i.test(hint)) score -= 10;
      if (isDisabledRouteHint(hint)) score += 160;
      if (isKnownNonCatchRouteHint(hint)) score += 90;
      if (/done|complete|disabled|locked|tooltip|menu|reset|home|settings|pokedex|achievement/i.test(hint)) score += 120;
      const rect = el.getBoundingClientRect();
      return { el, score, top: rect.top, left: rect.left, hint };
    });

    scored.sort((a, b) => (a.score - b.score) || (a.top - b.top) || (a.left - b.left));
    console.debug("[pkCharmanderHunter] Map clickable fallback candidates", scored.slice(0, 12).map((row) => ({
      score: row.score,
      element: describeElement(row.el),
      hint: row.hint
    })));
    return scored[0].score < 100 ? scored[0].el : null;
  }

  function summarizeElements(elements, limit = 8) {
    return elements.slice(0, limit).map((el) => {
      const rect = el.getBoundingClientRect();
      const href = el.getAttribute("href") || el.getAttribute("xlink:href") || el.getAttribute("src") || "";
      return `${describeElement(el)} visible=${isVisible(el)} box=${Math.round(rect.width)}x${Math.round(rect.height)} href=${href}`;
    }).join(" | ");
  }

  function summarizeMapElements(limit = 20) {
    return inspectMapElements().slice(0, limit).map((row) => `${row.element} visible=${row.visible} box=${row.box} hint=${row.hint.slice(0, 140)}`).join(" | ");
  }

  function inspectTowerEntrances() {
    const selectors = ["#btn-endless-run", "#btn-continue-endless", ".title-mode-card--tower", ".title-mode-resume--tower"];
    return selectors.flatMap((selector) => queryAll(selector).map((el) => ({
      selector,
      visible: isVisible(el),
      text: getElementText(el),
      element: describeElement(el)
    })));
  }

  function inspectCatchNodes() {
    const explicitNodes = uniqueElements([
      ...SELECTORS.catchIcons.flatMap((selector) => queryAll(selector)),
      ...queryAll("#map-container svg image, svg image").filter((el) => /catchPokemon/i.test(el.getAttribute("href") || el.getAttribute("xlink:href") || "")),
      ...queryAll("#map-container img, img").filter((el) => /catchPokemon/i.test(el.getAttribute("src") || "")),
      ...queryAll("#map-container svg g.map-node--clickable, #map-container svg g.map-node").filter((node) => {
        const image = node.querySelector("image, img");
        const href = image ? image.getAttribute("href") || image.getAttribute("xlink:href") || image.getAttribute("src") || "" : "";
        return /catchPokemon/i.test(href);
      })
    ]);
    const nodes = uniqueElements([...explicitNodes, ...getMapClickableCandidates()]);

    return nodes.map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        visible: isVisible(el),
        box: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
        href: el.getAttribute("href") || el.getAttribute("xlink:href") || el.getAttribute("src") || "",
        hint: getMapElementHint(el).slice(0, 240),
        element: describeElement(el)
      };
    });
  }

  function inspectMapElements() {
    const map = document.querySelector("#map-container");
    if (!map) return [];
    return uniqueElements([
      map,
      ...queryAll(":scope > *", map),
      ...queryAll("[role='button'], [tabindex], [onclick], [style*='cursor'], button, a, img, image, svg, svg g, svg path, svg rect, svg circle, svg text", map)
    ]).map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        visible: isVisible(el),
        box: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
        hint: getMapElementHint(el),
        element: describeElement(el)
      };
    });
  }

  // ---------------------------------------------------------------------------
  // Bot actions
  // ---------------------------------------------------------------------------

  async function selectConfiguredStarter() {
    const starterPokemon = settings.starterPokemon;
    const card = await waitForCondition(() => {
      const starterRoot = document.querySelector("#starter-choices") || document.querySelector("#starter-screen") || document;
      return findPokemonCardInCards(getAllPokemonCards(starterRoot), starterPokemon, false);
    }, 7000, 250, `${starterPokemon} starter card`);

    if (!card) {
      throw new Error(`${starterPokemon} not available as a Battle Tower starter. Make sure it is unlocked or caught.`);
    }

    return safeClick(getClickableCardElement(card), `starter ${starterPokemon}`);
  }

  async function openFirstCatchNode() {
    const icon = await waitForCondition(findCatchRouteIcon, 9000, 250, "first catch route icon");
    if (!icon) {
      throw new Error("No visible catch Pokemon route node found.");
    }

    if (!safeClick(icon, "first catch Pokemon route node")) return false;

    const choices = await waitForCondition(() => {
      if (detectCurrentScreen() === "catch-screen") return true;
      const cards = getVisibleChoiceCards();
      return cards.some((card) => getPokemonName(card)) ? cards : null;
    }, 12000, 250, "Pokemon choice screen");

    if (!choices) {
      throw new Error("Catch node clicked, but Pokemon choices did not appear.");
    }
    return true;
  }

  async function resetRun() {
    if (settings.dryRun) {
      log("[dry run] Would reset or reroll the run.");
      return false;
    }

    const before = screenSnapshot();
    pressKey("r", "KeyR");
    await sleep(1200);
    if (screenSnapshot() !== before || detectCurrentScreen() === "title-screen" || detectCurrentScreen() === "starter-screen" || detectCurrentScreen() === "endless-stage-select") {
      log("Reset/reroll appears to have responded to R.");
      return true;
    }

    const directNewRun = document.querySelector(SELECTORS.newRunButton);
    if (directNewRun && isVisible(directNewRun) && safeClick(directNewRun, "new run button")) {
      await sleep(1200);
      return true;
    }

    const fallbackLabels = ["Reset Run", "Play Again", "Main Menu", "New Run"];
    for (const label of fallbackLabels) {
      const button = findButtonByText([label]);
      if (button && safeClick(button, label)) {
        await sleep(1200);
        return true;
      }
    }

    log("All reset methods failed; reloading as last fallback.");
    window.location.reload();
    return true;
  }

  function screenSnapshot() {
    const screen = detectCurrentScreen();
    const text = bodyText().slice(0, 1200);
    return `${screen}:${text.length}:${text.slice(0, 120)}`;
  }

  async function inspectChoicesForTarget() {
    const cards = getVisibleChoiceCards();
    const targetPokemon = settings.targetPokemon;
    if (settings.dryRun) logChoiceCards();

    const target = findPokemonCardInCards(cards, targetPokemon, true);
    if (target) {
      runtime.foundCard = target;
      return { kind: "target", card: target, name: targetPokemon };
    }

    const anyShiny = findAnyShinyCard(cards);
    if (anyShiny) {
      if (settings.stopOnAnyShiny) runtime.foundCard = anyShiny;
      return { kind: "non-target-shiny", card: anyShiny, name: getPokemonName(anyShiny) || "unknown Pokemon" };
    }

    const normalTarget = findPokemonCardInCards(cards, targetPokemon, false);
    if (normalTarget) {
      return { kind: "normal-target", card: normalTarget, name: targetPokemon };
    }

    return { kind: "none" };
  }

  async function catchTargetIfConfigured() {
    const card = runtime.foundCard;
    if (!card) throw new Error("No found target card is available.");

    highlightCard(card);

    if (settings.autoCatch) {
      safeClick(getClickableCardElement(card), `shiny ${settings.targetPokemon}`);
      await sleep(400);
    } else {
      log("Auto catch disabled; leaving shiny card selected only by highlight.");
    }

    announceFound(`Shiny ${settings.targetPokemon} found in ${runtime.attempts} attempts!`);
  }

  function highlightCard(card) {
    if (!card || !(card instanceof HTMLElement || card instanceof SVGElement)) return;
    card.style.outline = "5px solid #ffd700";
    card.style.outlineOffset = "3px";
    card.style.boxShadow = "0 0 0 4px #111827, 0 0 28px 10px rgba(255, 215, 0, 0.85)";
  }

  function announceFound(message) {
    runtime.running = false;
    runtime.paused = false;
    runtime.foundMessage = message;
    runtime.attempts = 0;
    persistAttempts();
    setState(STATES.FOUND, message);
    playFoundSound();
    updateOverlay();
    window.setTimeout(() => window.alert(message), 50);
  }

  function playFoundSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1);
      gain.connect(ctx.destination);

      [880, 1175, 1568].forEach((frequency, index) => {
        const oscillator = ctx.createOscillator();
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + index * 0.22);
        oscillator.connect(gain);
        oscillator.start(ctx.currentTime + index * 0.22);
        oscillator.stop(ctx.currentTime + index * 0.22 + 0.16);
      });
      window.setTimeout(() => ctx.close().catch(() => {}), 1500);
    } catch (error) {
      log(`Sound failed: ${error.message || error}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Finite state machine
  // ---------------------------------------------------------------------------

  function startBot() {
    if (runtime.running) {
      runtime.paused = false;
      log("Bot already running; unpaused.");
      updateOverlay();
      return;
    }
    runtime.running = true;
    runtime.paused = false;
    runtime.lastError = "";
    runtime.stopReason = "";
    runtime.consecutiveErrors = 0;
    runtime.foundCard = null;
    runtime.foundMessage = "";
    runtime.loopToken += 1;
    setState(STATES.ENTER_MAIN_MENU, "Started.");
    runLoop(runtime.loopToken);
  }

  function stopBot(reason, state = STATES.STOPPED) {
    runtime.running = false;
    runtime.paused = false;
    runtime.stopReason = reason || "";
    setState(state, reason || "Stopped.");
  }

  function togglePause() {
    if (!runtime.running) return;
    runtime.paused = !runtime.paused;
    log(runtime.paused ? "Paused." : "Resumed.");
    updateOverlay();
  }

  function setState(state, message = "") {
    runtime.state = state;
    runtime.lastMessage = message;
    if (message) log(`${state}: ${message}`);
    else log(`Entering ${state}`);
    updateOverlay();
  }

  async function runLoop(token) {
    while (runtime.running && token === runtime.loopToken) {
      if (runtime.paused) {
        await sleep(250);
        continue;
      }

      try {
        log(`Entering ${runtime.state}`);
        await runStateWithTimeout(runtime.state);
        runtime.consecutiveErrors = 0;
      } catch (error) {
        await handleStateError(error);
      }

      if (runtime.running) {
        await randomSleep(settings.minDelayMs, settings.maxDelayMs);
      }
    }
  }

  async function runStateWithTimeout(state) {
    const timeoutMs = STATE_TIMEOUTS[state] || 10000;
    let timerId = 0;
    const timeout = new Promise((_, reject) => {
      timerId = window.setTimeout(() => reject(new Error(`${state} timed out after ${timeoutMs} ms.`)), timeoutMs);
    });

    try {
      await Promise.race([runState(state), timeout]);
    } finally {
      window.clearTimeout(timerId);
    }
  }

  async function runState(state) {
    if (state === STATES.IDLE) {
      stopBot("Idle.", STATES.STOPPED);
      return;
    }

    if (state === STATES.ENTER_MAIN_MENU) {
      setState(stateForCurrentScreen(), "Routed from current screen.");
      return;
    }

    if (state === STATES.ENTER_BATTLE_TOWER) {
      await enterBattleTowerState();
      return;
    }

    if (state === STATES.SELECT_KANTO) {
      await selectKantoState();
      return;
    }

    if (state === STATES.SELECT_STARTER) {
      await selectStarterState();
      return;
    }

    if (state === STATES.OPEN_FIRST_CATCH_NODE) {
      await openFirstCatchNodeState();
      return;
    }

    if (state === STATES.WAIT_FOR_POKEMON_CHOICES) {
      await waitForPokemonChoicesState();
      return;
    }

    if (state === STATES.CHECK_FOR_SHINY_TARGET) {
      await checkForShinyTargetState();
      return;
    }

    if (state === STATES.CATCH_TARGET) {
      await catchTargetIfConfigured();
      return;
    }

    if (state === STATES.RESET_RUN) {
      await resetRunState();
      return;
    }

    if (state === STATES.FOUND || state === STATES.ERROR || state === STATES.STOPPED) {
      runtime.running = false;
      updateOverlay();
      return;
    }

    throw new Error(`Unknown FSM state: ${state}`);
  }

  async function enterBattleTowerState() {
    const screen = detectCurrentScreen();
    runtime.lastScreen = screen;

    if (screen === "maintenance") {
      throw new Error("Pokelike maintenance gate is visible.");
    }
    if (screen === "endless-stage-select" || screen === "starter-screen" || screen === "map-screen" || screen === "catch-screen") {
      setState(stateForCurrentScreen(), "Already in Battle Tower flow.");
      return;
    }
    if (screen === "gameover-screen" || screen === "win-screen" || screen === "endless-stage-complete") {
      setState(STATES.RESET_RUN, "Existing run end screen detected.");
      return;
    }

    const historyTower = document.querySelector("#btn-history-battle-tower");
    if (historyTower && isVisible(historyTower)) {
      safeClick(historyTower, "Battle Tower from Story screen");
      await waitForScreenChange(screen, 8000);
      setState(stateForCurrentScreen(), "Entered Battle Tower from Story screen.");
      return;
    }

    const continueTower = document.querySelector("#btn-continue-endless");
    const enterTower = document.querySelector("#btn-endless-run");
    const target = [continueTower, enterTower].find(isVisible)
      || findActionByText(["Resume Tower", "Enter Tower", "Battle Tower"], [".title-mode-card--tower", ".title-mode-resume--tower"]);

    if (!target) {
      throw new Error("Could not find a visible Battle Tower entry control.");
    }

    if (!safeClick(target, "Battle Tower entry")) {
      throw new Error(`Battle Tower entry control was found but could not be clicked: ${describeElement(target)}`);
    }
    const changed = await waitForScreenChange(screen, 10000);
    if (!changed) {
      throw new Error(`Clicked Battle Tower entry but screen stayed on ${screen}.`);
    }
    setState(stateForCurrentScreen(), "Battle Tower entry clicked.");
  }

  async function selectKantoState() {
    const screen = detectCurrentScreen();

    if (screen === "starter-screen" || screen === "map-screen" || screen === "catch-screen") {
      setState(stateForCurrentScreen(), "Kanto stage already appears selected.");
      return;
    }
    if (screen === "title-screen" || screen === "history-region-select") {
      setState(STATES.ENTER_BATTLE_TOWER, "Need to enter Battle Tower first.");
      return;
    }
    if (screen === "gameover-screen" || screen === "win-screen" || screen === "endless-stage-complete") {
      const stageSelect = document.querySelector("#btn-stage-continue") || findButtonByText(["Stage Select", "Climb the Tower"]);
      if (stageSelect && isVisible(stageSelect)) {
        safeClick(stageSelect, "Stage Select");
        await waitForCondition(() => detectCurrentScreen() === "endless-stage-select", 8000, 250, "stage select");
      } else {
        setState(STATES.RESET_RUN, "End screen without Stage Select; resetting.");
        return;
      }
    }

    if (detectCurrentScreen() !== "endless-stage-select") {
      const stageButton = findButtonByText(["Stage Select"]);
      if (stageButton && safeClick(stageButton, "Stage Select")) {
        await waitForCondition(() => detectCurrentScreen() === "endless-stage-select", 8000, 250, "stage select");
      }
    }

    const kanto = findStageButton("Kanto");
    if (kanto && kanto.locked) {
      throw new Error("Kanto Battle Tower appears locked or unavailable.");
    }
    if (!kanto) {
      throw new Error("Could not find the Kanto Battle Tower stage control.");
    }

    safeClick(kanto, "Kanto Battle Tower");
    await waitForCondition(() => {
      const next = detectCurrentScreen();
      return next === "starter-screen" || next === "map-screen" || next === "catch-screen";
    }, 10000, 250, "starter/map after Kanto");
    setState(stateForCurrentScreen(), "Kanto selected.");
  }

  async function selectStarterState() {
    const screen = detectCurrentScreen();
    if (screen === "map-screen" || screen === "catch-screen") {
      setState(stateForCurrentScreen(), "Starter already selected.");
      return;
    }
    if (screen === "title-screen" || screen === "history-region-select" || screen === "endless-stage-select") {
      setState(stateForCurrentScreen(), "Need earlier setup step.");
      return;
    }
    if (screen !== "starter-screen") {
      setState(STATES.RESET_RUN, `Unexpected screen while selecting starter: ${screen}`);
      return;
    }

    await selectConfiguredStarter();
    await waitForCondition(() => {
      const next = detectCurrentScreen();
      return next === "map-screen" || next === "catch-screen";
    }, 9000, 250, "map after starter");
    setState(stateForCurrentScreen(), `${settings.starterPokemon} selected.`);
  }

  async function openFirstCatchNodeState() {
    const screen = detectCurrentScreen();
    if (screen === "catch-screen") {
      setState(STATES.WAIT_FOR_POKEMON_CHOICES, "Already on Pokemon choice screen.");
      return;
    }
    if (screen === "title-screen" || screen === "history-region-select" || screen === "endless-stage-select" || screen === "starter-screen") {
      setState(stateForCurrentScreen(), "Need earlier setup step.");
      return;
    }
    if (screen !== "map-screen") {
      setState(STATES.RESET_RUN, `Not on route map (${screen}); resetting to start loop.`);
      return;
    }

    await openFirstCatchNode();
    setState(STATES.WAIT_FOR_POKEMON_CHOICES, "Catch node opened.");
  }

  async function waitForPokemonChoicesState() {
    const choices = await waitForCondition(() => {
      const screen = detectCurrentScreen();
      if (screen !== "catch-screen") return null;
      const cards = getVisibleChoiceCards();
      return cards.some((card) => getPokemonName(card)) ? cards : null;
    }, 12000, 250, "visible Pokemon choice cards");

    if (!choices) {
      const next = stateForCurrentScreen();
      if (next !== STATES.WAIT_FOR_POKEMON_CHOICES) {
        setState(next, "Pokemon choices not visible; routed by screen.");
        return;
      }
      throw new Error("Pokemon choice cards were not visible.");
    }

    setState(STATES.CHECK_FOR_SHINY_TARGET, "Pokemon choices visible.");
  }

  async function checkForShinyTargetState() {
    runtime.attempts += 1;
    persistAttempts();
    updateOverlay();

    const result = await inspectChoicesForTarget();
    if (result.kind === "target") {
      setState(STATES.CATCH_TARGET, `Shiny ${settings.targetPokemon} detected.`);
      return;
    }

    if (result.kind === "non-target-shiny") {
      if (settings.stopOnAnyShiny) {
        highlightCard(result.card);
        announceFound(`Shiny ${result.name} found in ${runtime.attempts} attempts.`);
        return;
      }
      log(`A Shiny! Too bad it's not ${settings.targetPokemon} :(`);
    } else if (result.kind === "normal-target") {
      log(`${settings.targetPokemon}! Too bad it's not shiny! :(`);
    } else {
      log("No target");
    }

    if (settings.stopAfterAttempts > 0 && runtime.attempts >= settings.stopAfterAttempts) {
      stopBot(`Stop after ${settings.stopAfterAttempts} attempts reached.`, STATES.STOPPED);
      return;
    }

    setState(STATES.RESET_RUN, "No shiny target; resetting.");
  }

  async function resetRunState() {
    const ok = await resetRun();
    if (!ok && settings.dryRun) {
      stopBot("Dry run reset skipped. No page action was taken.", STATES.STOPPED);
      return;
    }
    await waitForCondition(() => {
      const next = stateForCurrentScreen();
      return next !== STATES.RESET_RUN ? next : null;
    }, 10000, 250, "post-reset setup screen");
    setState(STATES.ENTER_MAIN_MENU, "Reset completed.");
  }

  async function waitForScreenChange(previousScreen, timeoutMs) {
    return waitForCondition(() => {
      const next = detectCurrentScreen();
      return next && next !== previousScreen ? next : null;
    }, timeoutMs, 250, `screen change from ${previousScreen}`);
  }

  async function handleStateError(error) {
    const message = error && error.message ? error.message : String(error);
    runtime.lastError = message;
    runtime.consecutiveErrors += 1;
    log(`Error ${runtime.consecutiveErrors}/${settings.maxConsecutiveErrors || CONFIG.maxConsecutiveErrors}: ${message}`);
    updateOverlay();

    if (runtime.consecutiveErrors >= (settings.maxConsecutiveErrors || CONFIG.maxConsecutiveErrors)) {
      stopBot(`Too many consecutive errors: ${message}`, STATES.ERROR);
      return;
    }

    const screen = detectCurrentScreen();
    if (screen === "catch-screen") {
      setState(STATES.CHECK_FOR_SHINY_TARGET, "Fallback to choice inspection.");
      return;
    }
    if (screen === "map-screen") {
      setState(STATES.OPEN_FIRST_CATCH_NODE, "Fallback to map catch node.");
      return;
    }
    if (screen === "starter-screen") {
      setState(STATES.SELECT_STARTER, "Fallback to starter selection.");
      return;
    }
    if (screen === "endless-stage-select") {
      setState(STATES.SELECT_KANTO, "Fallback to Kanto stage selection.");
      return;
    }

    setState(STATES.RESET_RUN, "Fallback to reset after error.");
  }

  // ---------------------------------------------------------------------------
  // Debug helpers
  // ---------------------------------------------------------------------------

  function testShinyDetection() {
    const related = uniqueElements([
      ...queryAll("[class*='shiny']"),
      ...queryAll(".shiny-badge"),
      ...queryAll("img[src*='/shiny/']"),
      ...queryAll("image[href*='/shiny/']")
    ]).filter(isVisible);

    const rows = related.map((el) => ({
      element: el,
      tag: el.tagName.toLowerCase(),
      classes: typeof el.className === "string" ? el.className : "",
      src: el.getAttribute("src") || el.getAttribute("href") || el.getAttribute("xlink:href") || "",
      text: getElementText(el)
    }));
    console.table(rows.map((row) => ({
      tag: row.tag,
      classes: row.classes,
      src: row.src,
      text: row.text
    })));
    return rows;
  }

  function exposeDebugObject() {
    window.pkHunterDebug = {
      cards: () => getCardDebugRows(),
      catchNodes: () => inspectCatchNodes(),
      mapElements: () => inspectMapElements(),
      towerEntrances: () => inspectTowerEntrances(),
      log: () => buildDebugLog(),
      copyLog: () => copyDebugLog(),
      state: () => ({
        running: runtime.running,
        paused: runtime.paused,
        state: runtime.state,
        attempts: runtime.attempts,
        consecutiveErrors: runtime.consecutiveErrors,
        settings: { ...settings }
      }),
      stop: () => stopBot("Stopped through window.pkHunterDebug.stop().", STATES.STOPPED),
      testShinyDetection
    };
  }

  // ---------------------------------------------------------------------------
  // Logging and startup
  // ---------------------------------------------------------------------------

  function log(message, data) {
    const line = `${new Date().toLocaleTimeString()} ${message}`;
    if (isOverlayLogMessage(message)) {
      runtime.logs.push(line);
      if (runtime.logs.length > 120) runtime.logs.splice(0, runtime.logs.length - 120);
    }
    if (data !== undefined) {
      console.log("[pkCharmanderHunter]", message, data);
    } else {
      console.log("[pkCharmanderHunter]", message);
    }
    updateOverlay();
  }

  function isOverlayLogMessage(message) {
    return message === "No target"
      || message === `${settings.targetPokemon}! Too bad it's not shiny! :(`
      || message === `A Shiny! Too bad it's not ${settings.targetPokemon} :(`;
  }

  function buildDebugLog() {
    const payload = {
      script: "Pokelike Kanto Battle Tower Shiny Hunter",
      version: SCRIPT_VERSION,
      url: location.href,
      userAgent: navigator.userAgent,
      time: new Date().toISOString(),
      state: {
        running: runtime.running,
        paused: runtime.paused,
        state: runtime.state,
        attempts: runtime.attempts,
        consecutiveErrors: runtime.consecutiveErrors,
        lastError: runtime.lastError,
        lastScreen: runtime.lastScreen || detectCurrentScreen(),
        settings: { ...settings }
      },
      activeScreen: activeScreenId(),
      detectedScreen: detectCurrentScreen(),
      towerEntrances: inspectTowerEntrances(),
      catchNodes: inspectCatchNodes(),
      mapElements: inspectMapElements().slice(0, 80),
      cards: getCardDebugRows(getVisibleChoiceCards()).map((row) => ({
        name: row.name,
        shiny: row.shiny,
        element: describeElement(row.element)
      })),
      logs: runtime.logs.slice(-80)
    };
    return JSON.stringify(payload, null, 2);
  }

  async function copyDebugLog() {
    const text = buildDebugLog();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        log("Debug log copied to clipboard.");
        return text;
      }
    } catch (error) {
      log(`Clipboard copy failed: ${error.message || error}`);
    }

    console.log("[pkCharmanderHunter] Debug log:", text);
    log("Debug log printed to console because clipboard copy was unavailable.");
    return text;
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      stopBot("Stopped by Escape hotkey.", STATES.STOPPED);
      event.preventDefault();
      event.stopPropagation();
    } else if (event.key === "Insert") {
      toggleOverlayVisibility();
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  function init() {
    createOverlay();
    exposeDebugObject();
    log("Loaded.");
    if (settings.autoResume) {
      window.setTimeout(() => startBot(), 800);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
