// styles.js — All CSS for agentation, injected via <style> tag.
// Scoped under [data-agentation-toolbar] to prevent style leakage.

var AgentationStyles = (function() {
  var STYLE_ID = "agentation-styles";

  // CSS custom properties for theming
  var CSS = /* css */ `
    :root {
      --ag-accent: #3c82f7;
      --ag-accent-hover: #2563eb;
      --ag-bg: #ffffff;
      --ag-bg-secondary: #f8fafc;
      --ag-bg-tertiary: #f1f5f9;
      --ag-text: #1e293b;
      --ag-text-secondary: #64748b;
      --ag-text-muted: #94a3b8;
      --ag-border: #e2e8f0;
      --ag-border-hover: #cbd5e1;
      --ag-shadow: 0 4px 24px rgba(0,0,0,0.12);
      --ag-shadow-lg: 0 8px 32px rgba(0,0,0,0.16);
      --ag-radius: 12px;
      --ag-radius-sm: 8px;
      --ag-radius-xs: 6px;
      --ag-overlay-bg: rgba(59, 130, 246, 0.08);
      --ag-overlay-border: rgba(59, 130, 246, 0.5);
      --ag-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --ag-font-mono: "SF Mono", "Fira Code", "Fira Mono", Menlo, monospace;
    }

    [data-agentation-theme="dark"] {
      --ag-bg: #1e1e2e;
      --ag-bg-secondary: #262637;
      --ag-bg-tertiary: #2e2e42;
      --ag-text: #e2e8f0;
      --ag-text-secondary: #94a3b8;
      --ag-text-muted: #64748b;
      --ag-border: #3e3e56;
      --ag-border-hover: #525270;
      --ag-shadow: 0 4px 24px rgba(0,0,0,0.3);
      --ag-shadow-lg: 0 8px 32px rgba(0,0,0,0.4);
    }

    /* ===== TOOLBAR ===== */

    [data-agentation-toolbar] {
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 2147483647;
      font-family: var(--ag-font);
      font-size: 14px;
      line-height: 1.5;
      color: var(--ag-text);
      -webkit-font-smoothing: antialiased;
    }

    [data-agentation-toolbar] *,
    [data-agentation-toolbar] *::before,
    [data-agentation-toolbar] *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* Toggle button (collapsed state) */
    .ag-toggle-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      background: var(--ag-accent);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--ag-shadow);
      transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
      position: relative;
    }

    .ag-toggle-btn:hover {
      transform: scale(1.08);
      box-shadow: var(--ag-shadow-lg);
      background: var(--ag-accent-hover);
    }

    .ag-toggle-btn.ag-active {
      background: var(--ag-accent);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3), var(--ag-shadow);
    }

    .ag-toggle-btn svg {
      width: 22px;
      height: 22px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    /* Badge on toggle button */
    .ag-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      border-radius: 10px;
      background: #ef4444;
      color: white;
      font-size: 11px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      animation: ag-badge-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    /* Panel (expanded state) */
    .ag-panel {
      position: absolute;
      bottom: 56px;
      right: 0;
      width: 320px;
      background: var(--ag-bg);
      border: 1px solid var(--ag-border);
      border-radius: var(--ag-radius);
      box-shadow: var(--ag-shadow-lg);
      overflow: hidden;
      animation: ag-panel-enter 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: none;
    }

    .ag-panel.ag-visible {
      display: block;
    }

    .ag-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--ag-border);
      background: var(--ag-bg-secondary);
    }

    .ag-panel-header-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--ag-text);
    }

    .ag-panel-actions {
      display: flex;
      gap: 4px;
    }

    /* Icon buttons in header */
    .ag-icon-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--ag-radius-xs);
      border: 1px solid transparent;
      background: transparent;
      color: var(--ag-text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .ag-icon-btn:hover {
      background: var(--ag-bg-tertiary);
      color: var(--ag-text);
      border-color: var(--ag-border);
    }

    .ag-icon-btn.ag-active {
      background: var(--ag-accent);
      color: white;
      border-color: var(--ag-accent);
    }

    .ag-icon-btn svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    /* Panel body */
    .ag-panel-body {
      padding: 12px 16px;
      max-height: 300px;
      overflow-y: auto;
    }

    .ag-panel-body::-webkit-scrollbar {
      width: 6px;
    }

    .ag-panel-body::-webkit-scrollbar-track {
      background: transparent;
    }

    .ag-panel-body::-webkit-scrollbar-thumb {
      background: var(--ag-border);
      border-radius: 3px;
    }

    /* Annotation preview in panel */
    .ag-annotation-preview {
      padding: 10px 12px;
      background: var(--ag-bg-secondary);
      border: 1px solid var(--ag-border);
      border-radius: var(--ag-radius-sm);
      margin-bottom: 8px;
    }

    .ag-annotation-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--ag-text);
      margin-bottom: 2px;
    }

    .ag-annotation-comment {
      font-size: 12px;
      color: var(--ag-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ag-annotation-intent {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 6px;
      border-radius: 4px;
      margin-right: 6px;
    }

    .ag-intent-fix { background: #fef2f2; color: #dc2626; }
    .ag-intent-change { background: #fff7ed; color: #ea580c; }
    .ag-intent-question { background: #eff6ff; color: #2563eb; }
    .ag-intent-approve { background: #f0fdf4; color: #16a34a; }

    [data-agentation-theme="dark"] .ag-intent-fix { background: #3b1a1a; color: #f87171; }
    [data-agentation-theme="dark"] .ag-intent-change { background: #3b2a1a; color: #fb923c; }
    [data-agentation-theme="dark"] .ag-intent-question { background: #1a2a3b; color: #60a5fa; }
    [data-agentation-theme="dark"] .ag-intent-approve { background: #1a3b2a; color: #4ade80; }

    /* Navigation */
    .ag-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
    }

    .ag-nav-label {
      font-size: 12px;
      color: var(--ag-text-secondary);
    }

    .ag-nav-buttons {
      display: flex;
      gap: 4px;
    }

    /* Panel footer */
    .ag-panel-footer {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid var(--ag-border);
      background: var(--ag-bg-secondary);
    }

    .ag-btn {
      flex: 1;
      padding: 8px 12px;
      border-radius: var(--ag-radius-xs);
      border: 1px solid var(--ag-border);
      background: var(--ag-bg);
      color: var(--ag-text);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: var(--ag-font);
      text-align: center;
    }

    .ag-btn:hover {
      background: var(--ag-bg-tertiary);
      border-color: var(--ag-border-hover);
    }

    .ag-btn-primary {
      background: var(--ag-accent);
      color: white;
      border-color: var(--ag-accent);
    }

    .ag-btn-primary:hover {
      background: var(--ag-accent-hover);
      border-color: var(--ag-accent-hover);
    }

    .ag-btn-danger {
      color: #ef4444;
    }

    .ag-btn-danger:hover {
      background: #fef2f2;
      border-color: #fecaca;
    }

    [data-agentation-theme="dark"] .ag-btn-danger:hover {
      background: #3b1a1a;
      border-color: #7f1d1d;
    }

    /* Empty state */
    .ag-empty {
      text-align: center;
      padding: 24px 16px;
      color: var(--ag-text-muted);
      font-size: 13px;
    }

    .ag-empty-icon {
      font-size: 28px;
      margin-bottom: 8px;
      opacity: 0.5;
    }

    /* ===== OVERLAY ===== */

    .ag-overlay {
      position: fixed;
      pointer-events: none;
      z-index: 2147483646;
      border: 2px solid var(--ag-overlay-border);
      background: var(--ag-overlay-bg);
      border-radius: 3px;
      transition: all 0.1s ease;
      display: none;
    }

    .ag-overlay.ag-visible {
      display: block;
    }

    .ag-overlay-label {
      position: absolute;
      bottom: 100%;
      left: 0;
      padding: 2px 8px;
      background: var(--ag-accent);
      color: white;
      font-size: 11px;
      font-weight: 500;
      border-radius: 4px 4px 0 0;
      white-space: nowrap;
      font-family: var(--ag-font-mono);
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Selection rectangle (multi-select / area select) */
    .ag-selection-rect {
      position: fixed;
      border: 2px dashed var(--ag-accent);
      background: var(--ag-overlay-bg);
      z-index: 2147483646;
      pointer-events: none;
      display: none;
      border-radius: 4px;
    }

    .ag-selection-rect.ag-visible {
      display: block;
    }

    /* Flash overlay on capture */
    .ag-flash {
      position: fixed;
      pointer-events: none;
      z-index: 2147483646;
      border: 2px solid #22c55e;
      background: rgba(34, 197, 94, 0.15);
      border-radius: 3px;
      animation: ag-flash 0.4s ease-out forwards;
    }

    /* ===== MARKERS ===== */

    .ag-marker {
      position: absolute;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--ag-accent);
      color: white;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 2147483645;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      animation: ag-marker-enter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      font-family: var(--ag-font);
      pointer-events: auto;
      user-select: none;
    }

    .ag-marker:hover {
      transform: scale(1.2);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }

    .ag-marker.ag-fixed {
      position: fixed;
    }

    .ag-marker-exit {
      animation: ag-marker-exit 0.2s ease-in forwards;
    }

    /* ===== POPUP ===== */

    .ag-popup {
      position: fixed;
      z-index: 2147483647;
      width: 340px;
      background: var(--ag-bg);
      border: 1px solid var(--ag-border);
      border-radius: var(--ag-radius);
      box-shadow: var(--ag-shadow-lg);
      animation: ag-popup-enter 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      font-family: var(--ag-font);
      overflow: hidden;
    }

    .ag-popup-header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--ag-border);
      background: var(--ag-bg-secondary);
    }

    .ag-popup-element-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--ag-text);
      font-family: var(--ag-font-mono);
    }

    .ag-popup-body {
      padding: 12px 16px;
    }

    /* Computed styles accordion */
    .ag-accordion {
      margin-bottom: 12px;
    }

    .ag-accordion-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 8px 10px;
      background: var(--ag-bg-tertiary);
      border: 1px solid var(--ag-border);
      border-radius: var(--ag-radius-xs);
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      color: var(--ag-text-secondary);
      font-family: var(--ag-font);
      transition: all 0.15s ease;
    }

    .ag-accordion-trigger:hover {
      background: var(--ag-bg-secondary);
      color: var(--ag-text);
    }

    .ag-accordion-trigger svg {
      width: 12px;
      height: 12px;
      transition: transform 0.2s ease;
    }

    .ag-accordion-trigger.ag-open svg {
      transform: rotate(180deg);
    }

    .ag-accordion-content {
      display: none;
      padding: 8px 10px;
      margin-top: 4px;
      background: var(--ag-bg-tertiary);
      border: 1px solid var(--ag-border);
      border-radius: var(--ag-radius-xs);
      font-family: var(--ag-font-mono);
      font-size: 11px;
      line-height: 1.6;
      color: var(--ag-text-secondary);
      max-height: 150px;
      overflow-y: auto;
    }

    .ag-accordion-content.ag-open {
      display: block;
    }

    /* Selected text quote */
    .ag-quote {
      padding: 8px 12px;
      margin-bottom: 12px;
      background: var(--ag-bg-tertiary);
      border-left: 3px solid var(--ag-accent);
      border-radius: 0 var(--ag-radius-xs) var(--ag-radius-xs) 0;
      font-size: 12px;
      color: var(--ag-text-secondary);
      font-style: italic;
      max-height: 60px;
      overflow: hidden;
    }

    /* Textarea */
    .ag-textarea {
      width: 100%;
      min-height: 60px;
      max-height: 120px;
      padding: 8px 12px;
      border: 1px solid var(--ag-border);
      border-radius: var(--ag-radius-xs);
      background: var(--ag-bg);
      color: var(--ag-text);
      font-size: 13px;
      font-family: var(--ag-font);
      resize: vertical;
      outline: none;
      transition: border-color 0.15s ease;
    }

    .ag-textarea:focus {
      border-color: var(--ag-accent);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .ag-textarea::placeholder {
      color: var(--ag-text-muted);
    }

    /* Intent pills */
    .ag-intents {
      display: flex;
      gap: 6px;
      margin-top: 10px;
      flex-wrap: wrap;
    }

    .ag-intent-pill {
      padding: 4px 10px;
      border-radius: 20px;
      border: 1px solid var(--ag-border);
      background: var(--ag-bg);
      color: var(--ag-text-secondary);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: var(--ag-font);
    }

    .ag-intent-pill:hover {
      border-color: var(--ag-border-hover);
      background: var(--ag-bg-tertiary);
    }

    .ag-intent-pill.ag-selected {
      border-color: var(--ag-accent);
      background: rgba(59, 130, 246, 0.1);
      color: var(--ag-accent);
    }

    .ag-intent-pill[data-intent="fix"].ag-selected {
      border-color: #dc2626;
      background: #fef2f2;
      color: #dc2626;
    }

    .ag-intent-pill[data-intent="change"].ag-selected {
      border-color: #ea580c;
      background: #fff7ed;
      color: #ea580c;
    }

    .ag-intent-pill[data-intent="question"].ag-selected {
      border-color: #2563eb;
      background: #eff6ff;
      color: #2563eb;
    }

    .ag-intent-pill[data-intent="approve"].ag-selected {
      border-color: #16a34a;
      background: #f0fdf4;
      color: #16a34a;
    }

    [data-agentation-theme="dark"] .ag-intent-pill[data-intent="fix"].ag-selected {
      background: #3b1a1a; color: #f87171;
    }
    [data-agentation-theme="dark"] .ag-intent-pill[data-intent="change"].ag-selected {
      background: #3b2a1a; color: #fb923c;
    }
    [data-agentation-theme="dark"] .ag-intent-pill[data-intent="question"].ag-selected {
      background: #1a2a3b; color: #60a5fa;
    }
    [data-agentation-theme="dark"] .ag-intent-pill[data-intent="approve"].ag-selected {
      background: #1a3b2a; color: #4ade80;
    }

    /* Popup footer */
    .ag-popup-footer {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid var(--ag-border);
    }

    /* ===== SETTINGS PANEL ===== */

    .ag-settings {
      position: absolute;
      bottom: 56px;
      right: 0;
      width: 300px;
      background: var(--ag-bg);
      border: 1px solid var(--ag-border);
      border-radius: var(--ag-radius);
      box-shadow: var(--ag-shadow-lg);
      overflow: hidden;
      animation: ag-panel-enter 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: none;
    }

    .ag-settings.ag-visible {
      display: block;
    }

    .ag-settings-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--ag-border);
      background: var(--ag-bg-secondary);
      font-size: 13px;
      font-weight: 600;
    }

    .ag-settings-body {
      padding: 12px 16px;
    }

    .ag-setting-group {
      margin-bottom: 16px;
    }

    .ag-setting-group:last-child {
      margin-bottom: 0;
    }

    .ag-setting-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--ag-text-secondary);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Radio group */
    .ag-radios {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .ag-radio {
      padding: 4px 10px;
      border-radius: 20px;
      border: 1px solid var(--ag-border);
      background: var(--ag-bg);
      color: var(--ag-text-secondary);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: var(--ag-font);
    }

    .ag-radio:hover {
      border-color: var(--ag-border-hover);
      background: var(--ag-bg-tertiary);
    }

    .ag-radio.ag-selected {
      border-color: var(--ag-accent);
      background: rgba(59, 130, 246, 0.1);
      color: var(--ag-accent);
    }

    /* Color pills */
    .ag-colors {
      display: flex;
      gap: 8px;
    }

    .ag-color-pill {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .ag-color-pill:hover {
      transform: scale(1.15);
    }

    .ag-color-pill.ag-selected {
      border-color: var(--ag-text);
      box-shadow: 0 0 0 2px var(--ag-bg), 0 0 0 4px var(--ag-text);
    }

    /* Toggle switch */
    .ag-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
    }

    .ag-toggle-track {
      width: 36px;
      height: 20px;
      border-radius: 10px;
      background: var(--ag-border);
      position: relative;
      transition: background 0.2s ease;
    }

    .ag-toggle.ag-on .ag-toggle-track {
      background: var(--ag-accent);
    }

    .ag-toggle-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: white;
      position: absolute;
      top: 2px;
      left: 2px;
      transition: transform 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }

    .ag-toggle.ag-on .ag-toggle-thumb {
      transform: translateX(16px);
    }

    .ag-toggle-label {
      font-size: 13px;
      color: var(--ag-text);
    }

    /* ===== TEXT SELECTION BUBBLE ===== */

    .ag-text-bubble {
      position: fixed;
      z-index: 2147483647;
      padding: 4px 10px;
      background: var(--ag-accent);
      color: white;
      font-size: 12px;
      font-weight: 500;
      border-radius: 20px;
      cursor: pointer;
      box-shadow: var(--ag-shadow);
      animation: ag-popup-enter 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
      font-family: var(--ag-font);
      white-space: nowrap;
      pointer-events: auto;
    }

    .ag-text-bubble:hover {
      background: var(--ag-accent-hover);
    }

    /* ===== CURSOR ===== */

    .ag-cursor-crosshair,
    .ag-cursor-crosshair * {
      cursor: crosshair !important;
    }

    /* ===== FREEZE MODE ===== */

    .ag-frozen *:not([data-agentation-toolbar] *):not([data-agentation-marker]):not(.ag-popup):not(.ag-popup *):not(.ag-overlay):not(.ag-flash):not(.ag-text-bubble) {
      animation-play-state: paused !important;
      transition: none !important;
    }

    /* ===== COPY FEEDBACK ===== */

    .ag-copy-feedback {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 12px 24px;
      background: var(--ag-text);
      color: var(--ag-bg);
      font-size: 14px;
      font-weight: 500;
      border-radius: var(--ag-radius-sm);
      box-shadow: var(--ag-shadow-lg);
      z-index: 2147483647;
      animation: ag-fade-in-out 1.5s ease forwards;
      font-family: var(--ag-font);
      pointer-events: none;
    }

    /* ===== ANIMATIONS ===== */

    @keyframes ag-panel-enter {
      from {
        opacity: 0;
        transform: translateY(8px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes ag-popup-enter {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes ag-popup-exit {
      from {
        opacity: 1;
        transform: scale(1);
      }
      to {
        opacity: 0;
        transform: scale(0.9);
      }
    }

    @keyframes ag-shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-4px); }
      40% { transform: translateX(4px); }
      60% { transform: translateX(-3px); }
      80% { transform: translateX(3px); }
    }

    @keyframes ag-marker-enter {
      from {
        opacity: 0;
        transform: scale(0);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes ag-marker-exit {
      from {
        opacity: 1;
        transform: scale(1);
      }
      to {
        opacity: 0;
        transform: scale(0);
      }
    }

    @keyframes ag-badge-pop {
      from {
        transform: scale(0);
      }
      to {
        transform: scale(1);
      }
    }

    @keyframes ag-flash {
      0% {
        opacity: 1;
      }
      100% {
        opacity: 0;
        border-width: 4px;
      }
    }

    @keyframes ag-fade-in-out {
      0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
      15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      75% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
    }
  `;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function updateAccentColor(color) {
    document.documentElement.style.setProperty("--ag-accent", color);
    // Derive hover color (darken slightly)
    document.documentElement.style.setProperty("--ag-accent-hover", darkenColor(color, 15));
    // Update overlay colors
    document.documentElement.style.setProperty("--ag-overlay-bg", hexToRgba(color, 0.08));
    document.documentElement.style.setProperty("--ag-overlay-border", hexToRgba(color, 0.5));
  }

  function removeStyles() {
    var el = document.getElementById(STYLE_ID);
    if (el) el.remove();
  }

  // Utility: darken a hex color by a percentage
  function darkenColor(hex, percent) {
    var num = parseInt(hex.replace("#", ""), 16);
    var r = Math.max(0, (num >> 16) - Math.round(2.55 * percent));
    var g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(2.55 * percent));
    var b = Math.max(0, (num & 0x0000FF) - Math.round(2.55 * percent));
    return "#" + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // Utility: hex to rgba
  function hexToRgba(hex, alpha) {
    var num = parseInt(hex.replace("#", ""), 16);
    var r = (num >> 16) & 255;
    var g = (num >> 8) & 255;
    var b = num & 255;
    return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
  }

  return {
    injectStyles: injectStyles,
    updateAccentColor: updateAccentColor,
    removeStyles: removeStyles
  };
})();
