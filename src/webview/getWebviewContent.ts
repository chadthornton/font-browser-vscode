import * as vscode from 'vscode';

export function getWebviewContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri
): string {
  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>Font Browser</title>
  <style>
    :root {
      --vscode-spacing: 8px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      height: 100%;
      margin: 0;
    }

    body {
      padding: var(--vscode-spacing);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .tab-container {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--vscode-widget-border);
    }

    .tab {
      padding: 8px 16px;
      background: transparent;
      color: var(--vscode-foreground);
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      font-size: 12px;
      opacity: 0.7;
      margin-bottom: -1px;
    }

    .tab:hover {
      opacity: 1;
    }

    .tab.active {
      opacity: 1;
      border-bottom-color: var(--vscode-focusBorder);
    }

    .tab-content {
      display: none;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .tab-content.active {
      display: flex;
    }

    .search-box {
      width: 100%;
      padding: 6px 10px;
      margin-bottom: 8px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      font-size: 12px;
      flex-shrink: 0;
    }

    .search-box:focus {
      outline: 1px solid var(--vscode-focusBorder);
      border-color: var(--vscode-focusBorder);
    }

    .search-box::placeholder {
      color: var(--vscode-input-placeholderForeground);
    }

    .search-row {
      display: flex;
      gap: 6px;
      margin-bottom: 8px;
      flex-shrink: 0;
    }

    .search-row .search-box {
      margin-bottom: 0;
      width: auto;
      flex: 1;
    }

    .filter-toggle {
      background: transparent;
      border: 1px solid var(--vscode-widget-border, rgba(128, 128, 128, 0.35));
      border-radius: 4px;
      color: var(--vscode-foreground);
      padding: 4px 10px;
      cursor: pointer;
      font-size: 12px;
      opacity: 0.7;
      flex-shrink: 0;
      min-width: 70px;
    }

    .filter-toggle:hover {
      opacity: 1;
      background: var(--vscode-list-hoverBackground);
    }

    .filter-toggle.active {
      opacity: 1;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      border-color: var(--vscode-badge-background);
    }

    .filter-toggle.has-filters {
      color: var(--vscode-textLink-foreground);
    }

    .filter-toggle.active.has-filters {
      color: var(--vscode-badge-foreground);
    }

    .filter-panel {
      display: none;
      padding: 10px;
      margin-bottom: 8px;
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-widget-border);
      border-radius: 4px;
      flex-shrink: 0;
    }

    .filter-panel.open {
      display: block;
    }

    .filter-section {
      margin-bottom: 10px;
    }

    .filter-section:last-child {
      margin-bottom: 0;
    }

    .filter-section-title {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 6px;
    }

    .filter-options {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .filter-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      background: transparent;
      border: 1px solid var(--vscode-widget-border);
      border-radius: 12px;
      font-size: 11px;
      cursor: pointer;
      color: var(--vscode-foreground);
      opacity: 0.7;
    }

    .filter-chip:hover {
      opacity: 1;
      background: var(--vscode-list-hoverBackground);
    }

    .filter-chip.selected {
      opacity: 1;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      border-color: var(--vscode-badge-background);
    }

    .filter-chip input {
      display: none;
    }

    .font-list {
      flex: 1;
      min-height: 100px;
      overflow-y: auto;
      border: 1px solid var(--vscode-widget-border);
      border-radius: 4px;
      background: var(--vscode-input-background);
      scrollbar-width: none;
    }

    .font-list::-webkit-scrollbar {
      display: none;
    }

    .category-header {
      padding: 6px 10px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--vscode-descriptionForeground);
      background: var(--vscode-sideBarSectionHeader-background);
      border-bottom: 1px solid var(--vscode-widget-border);
      position: sticky;
      top: 0;
      z-index: 1;
    }

    .font-item {
      padding: 4px 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid var(--vscode-widget-border);
    }

    .font-item:last-child {
      border-bottom: none;
    }

    .font-item:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .font-item.selected {
      background: var(--vscode-list-activeSelectionBackground);
      color: var(--vscode-list-activeSelectionForeground);
    }

    .font-name {
      flex: 1;
      font-size: 15px;
      letter-spacing: normal;
    }

    .favorite-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 14px;
      padding: 2px 4px;
      opacity: 0.15;
      transition: opacity 0.15s;
      line-height: 1;
      order: 1;
    }

    .favorite-btn:hover {
      opacity: 0.6;
    }

    .favorite-btn.favorited {
      opacity: 0.35;
    }

    .font-item:hover .favorite-btn {
      opacity: 0.35;
    }

    .font-item:hover .favorite-btn.favorited,
    .font-item:hover .favorite-btn:hover {
      opacity: 0.5;
    }

    .controls {
      margin-top: 8px;
      flex-shrink: 0;
    }

    .control-row {
      display: flex;
      gap: 6px;
      align-items: center;
      margin-bottom: 6px;
    }

    .control-row:last-child {
      margin-bottom: 0;
    }

    .bold-weight-select {
      min-width: 80px;
    }

    .size-input {
      width: 55px;
      padding: 4px 6px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 2px;
      font-size: 12px;
    }

    .size-input:focus {
      outline: 1px solid var(--vscode-focusBorder);
      border-color: var(--vscode-focusBorder);
    }

    .weight-select {
      padding: 4px 6px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 2px;
      font-size: 12px;
      cursor: pointer;
      min-width: 120px;
    }

    .weight-select:focus {
      outline: 1px solid var(--vscode-focusBorder);
      border-color: var(--vscode-focusBorder);
    }

    .unit-label {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }

    .preview-section {
      padding: 12px;
      margin-top: 8px;
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-widget-border);
      border-radius: 4px;
      height: 180px;
      flex-shrink: 0;
      overflow-y: auto;
    }

    .preview-text {
      font-size: 14px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .preview-empty {
      color: var(--vscode-descriptionForeground);
      font-style: italic;
      font-size: 12px;
    }

    .preview-info {
      margin-top: 6px;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }

    .loading {
      text-align: center;
      padding: 20px;
      color: var(--vscode-descriptionForeground);
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 8px;
      gap: 8px;
      flex-shrink: 0;
    }

    .restore-btn {
      position: relative;
      background: transparent;
      border: 1px solid var(--vscode-widget-border, rgba(128, 128, 128, 0.35));
      color: var(--vscode-descriptionForeground);
      padding: 4px 8px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      min-width: 70px;
    }

    .restore-btn:hover {
      color: var(--vscode-foreground);
      background: var(--vscode-button-secondaryHoverBackground);
    }

    .restore-btn:disabled {
      color: var(--vscode-disabledForeground, rgba(128, 128, 128, 0.5));
      border-color: transparent;
      cursor: not-allowed;
    }

    .restore-icon {
      font-size: 12px;
    }

    .restore-tooltip {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      background-color: var(--vscode-menu-background, var(--vscode-editorWidget-background, var(--vscode-sideBar-background)));
      border: 1px solid var(--vscode-widget-border);
      border-radius: 4px;
      padding: 12px 14px;
      min-width: 240px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      display: none;
      text-align: left;
      isolation: isolate;
    }

    .restore-btn:hover .restore-tooltip {
      display: block;
    }

    .tooltip-title {
      font-size: 14px;
      margin-bottom: 12px;
      opacity: 0.7;
    }

    .tooltip-section {
      margin-bottom: 16px;
    }

    .tooltip-section:last-child {
      margin-bottom: 0;
    }

    .tooltip-section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }

    .tooltip-item {
      font-size: 14px;
      margin-bottom: 3px;
    }

    .tooltip-item:last-child {
      margin-bottom: 0;
    }

    .tooltip-value {
      color: var(--vscode-foreground);
    }
  </style>
</head>
<body>
  <div class="header-row">
    <div class="tab-container">
      <button class="tab active" data-tab="editor">Editor</button>
      <button class="tab" data-tab="terminal">Terminal</button>
    </div>
    <button class="restore-btn" id="restore-btn" disabled>
      <span class="restore-icon">↩</span>
      Restore
      <div class="restore-tooltip" id="restore-tooltip">
        <div class="tooltip-title">Restore to previous selections</div>
        <div class="tooltip-section">
          <div class="tooltip-section-title">Editor</div>
          <div class="tooltip-item"><span class="tooltip-value" id="prev-editor-font">-</span></div>
          <div class="tooltip-item"><span class="tooltip-value" id="prev-editor-size">-</span> · <span class="tooltip-value" id="prev-editor-weight">-</span></div>
          <div class="tooltip-item">lh: <span class="tooltip-value" id="prev-editor-line-height">-</span> · ls: <span class="tooltip-value" id="prev-editor-letter-spacing">-</span></div>
        </div>
        <div class="tooltip-section">
          <div class="tooltip-section-title">Terminal</div>
          <div class="tooltip-item"><span class="tooltip-value" id="prev-terminal-font">-</span></div>
          <div class="tooltip-item"><span class="tooltip-value" id="prev-terminal-size">-</span> · <span class="tooltip-value" id="prev-terminal-weight">-</span></div>
          <div class="tooltip-item">lh: <span class="tooltip-value" id="prev-terminal-line-height">-</span> · ls: <span class="tooltip-value" id="prev-terminal-letter-spacing">-</span></div>
          <div class="tooltip-item">bold: <span class="tooltip-value" id="prev-terminal-bold-weight">-</span></div>
        </div>
      </div>
    </button>
  </div>

  <div id="editor-tab" class="tab-content active">
    <div class="search-row">
      <input type="text" class="search-box" id="editor-search" placeholder="Search...">
      <button class="filter-toggle" id="editor-filter-toggle" title="Toggle filters">Filter</button>
    </div>
    <div class="filter-panel" id="editor-filter-panel">
      <div class="filter-section">
        <div class="filter-section-title">Category</div>
        <div class="filter-options">
          <label class="filter-chip selected" data-filter="category" data-value="monospace">
            <input type="checkbox" checked> Monospace
          </label>
          <label class="filter-chip selected" data-filter="category" data-value="sans-serif">
            <input type="checkbox" checked> Sans Serif
          </label>
          <label class="filter-chip selected" data-filter="category" data-value="serif">
            <input type="checkbox" checked> Serif
          </label>
        </div>
      </div>
      <div class="filter-section">
        <div class="filter-section-title">Features</div>
        <div class="filter-options">
          <label class="filter-chip" data-filter="variable" data-value="true">
            <input type="checkbox"> Variable
          </label>
          <label class="filter-chip" data-filter="ligatures" data-value="true">
            <input type="checkbox"> Ligatures
          </label>
          <label class="filter-chip" data-filter="icons" data-value="true">
            <input type="checkbox"> Icons
          </label>
        </div>
      </div>
    </div>
    <div class="font-list" id="editor-font-list">
      <div class="loading">Loading fonts...</div>
    </div>
    <div class="controls">
      <div class="control-row">
        <select class="weight-select" id="editor-weight"></select>
        <input type="number" class="size-input" id="editor-size" min="8" max="72" step="1">
        <span class="unit-label">px</span>
      </div>
      <div class="control-row">
        <input type="number" class="size-input" id="editor-line-height" min="0" max="100" step="1" title="Line height (0 = auto)">
        <span class="unit-label">lh</span>
        <input type="number" class="size-input" id="editor-letter-spacing" min="-5" max="20" step="0.1" title="Letter spacing">
        <span class="unit-label">ls</span>
      </div>
    </div>
  </div>

  <div id="terminal-tab" class="tab-content">
    <div class="search-row">
      <input type="text" class="search-box" id="terminal-search" placeholder="Search...">
      <button class="filter-toggle" id="terminal-filter-toggle" title="Toggle filters">Filter</button>
    </div>
    <div class="filter-panel" id="terminal-filter-panel">
      <div class="filter-section">
        <div class="filter-section-title">Category</div>
        <div class="filter-options">
          <label class="filter-chip selected" data-filter="category" data-value="monospace">
            <input type="checkbox" checked> Monospace
          </label>
          <label class="filter-chip selected" data-filter="category" data-value="sans-serif">
            <input type="checkbox" checked> Sans Serif
          </label>
          <label class="filter-chip selected" data-filter="category" data-value="serif">
            <input type="checkbox" checked> Serif
          </label>
        </div>
      </div>
      <div class="filter-section">
        <div class="filter-section-title">Features</div>
        <div class="filter-options">
          <label class="filter-chip" data-filter="variable" data-value="true">
            <input type="checkbox"> Variable
          </label>
          <label class="filter-chip" data-filter="ligatures" data-value="true">
            <input type="checkbox"> Ligatures
          </label>
          <label class="filter-chip" data-filter="icons" data-value="true">
            <input type="checkbox"> Icons
          </label>
        </div>
      </div>
    </div>
    <div class="font-list" id="terminal-font-list">
      <div class="loading">Loading fonts...</div>
    </div>
    <div class="controls">
      <div class="control-row">
        <select class="weight-select" id="terminal-weight"></select>
        <input type="number" class="size-input" id="terminal-size" min="8" max="72" step="1">
        <span class="unit-label">px</span>
      </div>
      <div class="control-row">
        <input type="number" class="size-input" id="terminal-line-height" min="1" max="3" step="0.1" title="Line height (1 = default)">
        <span class="unit-label">lh</span>
        <input type="number" class="size-input" id="terminal-letter-spacing" min="-5" max="20" step="1" title="Letter spacing">
        <span class="unit-label">ls</span>
        <select class="weight-select bold-weight-select" id="terminal-bold-weight" title="Bold text weight"></select>
      </div>
    </div>
  </div>

  <div class="preview-section">
    <div class="preview-text" id="preview"></div>
  </div>
  <div class="preview-info" id="preview-info"></div>
  <div style="font-size:9px;opacity:0.3;text-align:right;padding-top:4px;" id="build-stamp"></div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    let fonts = [];
    let fontsLoaded = false;
    let settings = {};
    let previousSettings = null;
    let favorites = {}; // { [fontName]: { editor?: {...}, terminal?: {...} } }
    let platform = '';
    let selectedPreviewFont = null;
    let currentEditorFont = null;
    let currentTerminalFont = null;

    // Track whether settings have changed since last font selection (per tab)
    const dirty = {
      editor: false,
      terminal: false
    };

    // Filter state per tab
    const filters = {
      editor: {
        categories: new Set(['monospace', 'sans-serif', 'serif']),
        variable: false,
        ligatures: false,
        icons: false
      },
      terminal: {
        categories: new Set(['monospace', 'sans-serif', 'serif']),
        variable: false,
        ligatures: false,
        icons: false
      }
    };

    // Canonical font specimen for programming fonts
    // Tests: character disambiguation, ligatures, brackets, code patterns
    const PREVIEW_TEXT = '0O 1lI |!¡ {}[]() <> -> => != === <= >= ++ -- const fn = (x) => x * 2; if (arr[0] !== null) { } "string" THE QUICK BROWN FOX the lazy dog jumps';

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab + '-tab').classList.add('active');
        selectedPreviewFont = null;
        updatePreview();
      });
    });

    // Font size inputs
    document.getElementById('editor-size').addEventListener('change', (e) => {
      const size = parseInt(e.target.value, 10);
      if (size >= 8 && size <= 72) {
        dirty.editor = true;
        vscode.postMessage({ command: 'setEditorFontSize', size });
      }
    });

    document.getElementById('terminal-size').addEventListener('change', (e) => {
      const size = parseInt(e.target.value, 10);
      if (size >= 8 && size <= 72) {
        dirty.terminal = true;
        vscode.postMessage({ command: 'setTerminalFontSize', size });
      }
    });

    // Font weight selects
    document.getElementById('editor-weight').addEventListener('change', (e) => {
      dirty.editor = true;
      vscode.postMessage({ command: 'setEditorFontWeight', weight: e.target.value });
      updatePreview();
    });

    document.getElementById('terminal-weight').addEventListener('change', (e) => {
      dirty.terminal = true;
      vscode.postMessage({ command: 'setTerminalFontWeight', weight: e.target.value });
      updatePreview();
    });

    // Line height inputs
    document.getElementById('editor-line-height').addEventListener('change', (e) => {
      const lineHeight = parseInt(e.target.value, 10);
      if (lineHeight >= 0 && lineHeight <= 100) {
        dirty.editor = true;
        vscode.postMessage({ command: 'setEditorLineHeight', lineHeight });
      }
    });

    document.getElementById('terminal-line-height').addEventListener('change', (e) => {
      const lineHeight = parseFloat(e.target.value);
      if (lineHeight >= 1 && lineHeight <= 3) {
        dirty.terminal = true;
        vscode.postMessage({ command: 'setTerminalLineHeight', lineHeight });
      }
    });

    // Letter spacing inputs
    document.getElementById('editor-letter-spacing').addEventListener('change', (e) => {
      const letterSpacing = parseFloat(e.target.value);
      if (letterSpacing >= -5 && letterSpacing <= 20) {
        dirty.editor = true;
        vscode.postMessage({ command: 'setEditorLetterSpacing', letterSpacing });
      }
    });

    document.getElementById('terminal-letter-spacing').addEventListener('change', (e) => {
      const letterSpacing = parseInt(e.target.value, 10);
      if (letterSpacing >= -5 && letterSpacing <= 20) {
        dirty.terminal = true;
        vscode.postMessage({ command: 'setTerminalLetterSpacing', letterSpacing });
      }
    });

    // Terminal bold weight select
    document.getElementById('terminal-bold-weight').addEventListener('change', (e) => {
      dirty.terminal = true;
      vscode.postMessage({ command: 'setTerminalBoldWeight', weight: e.target.value });
    });

    // Search functionality
    document.getElementById('editor-search').addEventListener('input', (e) => {
      renderFontList('editor', e.target.value);
    });

    document.getElementById('terminal-search').addEventListener('input', (e) => {
      renderFontList('terminal', e.target.value);
    });

    // Filter toggle handlers
    ['editor', 'terminal'].forEach(target => {
      const toggle = document.getElementById(target + '-filter-toggle');
      const panel = document.getElementById(target + '-filter-panel');

      toggle.addEventListener('click', () => {
        const isOpen = panel.classList.toggle('open');
        toggle.classList.toggle('active', isOpen);
      });

      // Filter chip handlers
      panel.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
          e.preventDefault();
          const filterType = chip.dataset.filter;
          const value = chip.dataset.value;

          if (filterType === 'category') {
            // Category filters are multi-select
            if (chip.classList.contains('selected')) {
              chip.classList.remove('selected');
              filters[target].categories.delete(value);
            } else {
              chip.classList.add('selected');
              filters[target].categories.add(value);
            }
          } else {
            // Feature filters are toggles
            const newState = !chip.classList.contains('selected');
            chip.classList.toggle('selected', newState);
            filters[target][filterType] = newState;
          }

          updateFilterToggleState(target);
          renderFontList(target, document.getElementById(target + '-search').value);
        });
      });
    });

    function updateFilterToggleState(target) {
      const toggle = document.getElementById(target + '-filter-toggle');
      const f = filters[target];
      // Has active filters if: not all categories selected, or any feature filter on
      const hasActiveFilters = f.categories.size < 3 || f.variable || f.ligatures || f.icons;
      toggle.classList.toggle('has-filters', hasActiveFilters);
    }

    function findFontByName(fontName) {
      const lowerName = fontName.toLowerCase();
      return fonts.find(f => f.name.toLowerCase() === lowerName);
    }

    function populateWeightDropdown(selectId, fontName, currentWeight) {
      const select = document.getElementById(selectId);
      const font = findFontByName(fontName);

      // Clear existing options
      select.textContent = '';

      const weights = font && font.weights && font.weights.length > 0
        ? font.weights
        : [{ value: 'normal', label: 'Regular', hasItalic: false }];

      weights.forEach(w => {
        const option = document.createElement('option');
        option.value = w.value;
        const weightNum = w.value === 'normal' ? '400' : w.value === 'bold' ? '700' : w.value;
        option.textContent = weightNum + ' ' + w.label;
        select.appendChild(option);
      });

      // Try to select current weight, or default to first option
      const normalizedCurrent = normalizeWeight(currentWeight);
      const hasCurrentWeight = weights.some(w => w.value === normalizedCurrent);
      select.value = hasCurrentWeight ? normalizedCurrent : weights[0].value;
    }

    function populateBoldWeightDropdown(currentWeight) {
      const select = document.getElementById('terminal-bold-weight');
      select.textContent = '';

      const weights = [
        { value: 'normal', label: 'Normal' },
        { value: '500', label: 'Medium' },
        { value: '600', label: 'SemiBold' },
        { value: 'bold', label: 'Bold' },
        { value: '800', label: 'ExtraBold' },
        { value: '900', label: 'Black' },
      ];

      weights.forEach(w => {
        const option = document.createElement('option');
        option.value = w.value;
        option.textContent = w.label;
        select.appendChild(option);
      });

      // Match current value or default to bold
      const normalized = currentWeight === '700' ? 'bold' : currentWeight;
      select.value = weights.some(w => w.value === normalized) ? normalized : 'bold';
    }

    function renderFontList(target, filter = '', anchorFont = null) {
      const list = document.getElementById(target + '-font-list');
      const currentFontFamily = target === 'editor'
        ? extractFontFamily(settings.editorFont)
        : extractFontFamily(settings.terminalFont);

      // Scroll anchoring: save position of anchor font before re-render
      let anchorOffsetBefore = null;
      if (anchorFont) {
        const anchorEl = list.querySelector('[data-font="' + anchorFont + '"]:not([data-category="favorites"])');
        if (anchorEl) {
          anchorOffsetBefore = anchorEl.getBoundingClientRect().top - list.getBoundingClientRect().top;
        }
      }

      const f = filters[target];
      const filteredFonts = fonts.filter(font => {
        // Text search filter
        if (filter && !font.name.toLowerCase().includes(filter.toLowerCase())) {
          return false;
        }
        // Category filter
        if (!f.categories.has(font.category)) {
          return false;
        }
        // Feature filters (only filter IN, not OUT when enabled)
        if (f.variable && !font.isVariable) {
          return false;
        }
        if (f.ligatures && !font.hasLigatures) {
          return false;
        }
        if (f.icons && !font.hasIcons) {
          return false;
        }
        return true;
      });

      // Clear existing content
      list.textContent = '';

      if (filteredFonts.length === 0) {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.textContent = fontsLoaded ? 'No fonts found' : 'Loading fonts...';
        list.appendChild(loadingDiv);
        return;
      }

      // Group fonts by category (only show categories that are enabled)
      const categories = {};

      // Favorites always comes first if there are any
      const favoritedFonts = filteredFonts.filter(font => font.name in favorites);
      if (favoritedFonts.length > 0) {
        categories['favorites'] = { label: 'Favorites', fonts: favoritedFonts };
      }

      if (f.categories.has('monospace')) {
        categories['monospace'] = { label: 'Monospace', fonts: [] };
      }
      if (f.categories.has('sans-serif')) {
        categories['sans-serif'] = { label: 'Sans Serif', fonts: [] };
      }
      if (f.categories.has('serif')) {
        categories['serif'] = { label: 'Serif', fonts: [] };
      }

      filteredFonts.forEach(font => {
        if (categories[font.category]) {
          categories[font.category].fonts.push(font);
        }
      });

      // Render each category
      Object.entries(categories).forEach(([key, cat]) => {
        if (cat.fonts.length === 0) return;

        // Sort: installed first, then alphabetically
        cat.fonts.sort((a, b) => {
          if (a.isInstalled !== b.isInstalled) return a.isInstalled ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

        // Category header
        const header = document.createElement('div');
        header.className = 'category-header';
        header.textContent = cat.label;
        list.appendChild(header);

        // Font items
        cat.fonts.forEach(font => {
          const isSelected = font.name.toLowerCase() === currentFontFamily.toLowerCase();
          const isFavorited = font.name in favorites;

          const item = document.createElement('div');
          item.className = 'font-item';
          if (isSelected) item.classList.add('selected');
          item.dataset.font = font.name;
          item.dataset.target = target;
          item.dataset.category = key;

          // Favorite star button
          const starBtn = document.createElement('button');
          starBtn.className = 'favorite-btn' + (isFavorited ? ' favorited' : '');
          starBtn.textContent = isFavorited ? '★' : '☆';
          starBtn.title = isFavorited ? 'Remove from favorites' : 'Add to favorites';
          starBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const message = { command: 'toggleFavorite', fontName: font.name, context: target };

            // If adding to favorites and settings are dirty, capture current settings
            if (!isFavorited && dirty[target]) {
              message.settings = getCurrentSettingsForContext(target);
            }

            vscode.postMessage(message);
          });
          item.appendChild(starBtn);

          const nameSpan = document.createElement('span');
          nameSpan.className = 'font-name';
          nameSpan.style.fontFamily = "'" + font.name + "', monospace";
          nameSpan.textContent = font.name;
          item.appendChild(nameSpan);

          // Click handler - apply font
          item.addEventListener('click', () => {
            const fontName = font.name;
            selectedPreviewFont = fontName;

            // Immediately update selection highlight
            list.querySelectorAll('.font-item.selected').forEach(el => el.classList.remove('selected'));
            list.querySelectorAll('[data-font="' + fontName + '"]').forEach(el => el.classList.add('selected'));

            // Reset dirty flag when selecting a font
            dirty[target] = false;

            // Check if this font has saved settings for this context
            const favoriteData = favorites[fontName];
            const savedSettings = favoriteData && favoriteData[target];

            // Update weight dropdown for this font
            const weightSelectId = target + '-weight';
            const currentWeight = savedSettings && savedSettings.weight
              ? savedSettings.weight
              : (target === 'editor' ? settings.editorFontWeight : settings.terminalFontWeight);
            populateWeightDropdown(weightSelectId, fontName, currentWeight);

            if (target === 'editor') {
              currentEditorFont = fontName;
              const fontValue = "'" + fontName + "', monospace";

              // Update local settings immediately (don't wait for extension round-trip)
              settings.editorFont = fontValue;
              vscode.postMessage({ command: 'setEditorFont', font: fontValue });

              if (savedSettings) {
                if (savedSettings.size !== undefined) {
                  settings.editorFontSize = savedSettings.size;
                  vscode.postMessage({ command: 'setEditorFontSize', size: savedSettings.size });
                }
                if (savedSettings.weight !== undefined) {
                  settings.editorFontWeight = savedSettings.weight;
                  vscode.postMessage({ command: 'setEditorFontWeight', weight: savedSettings.weight });
                }
                if (savedSettings.lineHeight !== undefined) {
                  settings.editorLineHeight = savedSettings.lineHeight;
                  vscode.postMessage({ command: 'setEditorLineHeight', lineHeight: savedSettings.lineHeight });
                }
                if (savedSettings.letterSpacing !== undefined) {
                  settings.editorLetterSpacing = savedSettings.letterSpacing;
                  vscode.postMessage({ command: 'setEditorLetterSpacing', letterSpacing: savedSettings.letterSpacing });
                }
              }
            } else {
              currentTerminalFont = fontName;

              // Update local settings immediately (don't wait for extension round-trip)
              settings.terminalFont = fontName;
              vscode.postMessage({ command: 'setTerminalFont', font: fontName });

              if (savedSettings) {
                if (savedSettings.size !== undefined) {
                  settings.terminalFontSize = savedSettings.size;
                  vscode.postMessage({ command: 'setTerminalFontSize', size: savedSettings.size });
                }
                if (savedSettings.weight !== undefined) {
                  settings.terminalFontWeight = savedSettings.weight;
                  vscode.postMessage({ command: 'setTerminalFontWeight', weight: savedSettings.weight });
                }
                if (savedSettings.lineHeight !== undefined) {
                  settings.terminalLineHeight = savedSettings.lineHeight;
                  vscode.postMessage({ command: 'setTerminalLineHeight', lineHeight: savedSettings.lineHeight });
                }
                if (savedSettings.letterSpacing !== undefined) {
                  settings.terminalLetterSpacing = savedSettings.letterSpacing;
                  vscode.postMessage({ command: 'setTerminalLetterSpacing', letterSpacing: savedSettings.letterSpacing });
                }
                if (savedSettings.boldWeight !== undefined) {
                  settings.terminalBoldWeight = savedSettings.boldWeight;
                  vscode.postMessage({ command: 'setTerminalBoldWeight', weight: savedSettings.boldWeight });
                }
              }
            }

            updatePreview();
            updateRestoreButton();
          });

          list.appendChild(item);
        });
      });

      // Scroll anchoring: restore position after re-render
      if (anchorFont && anchorOffsetBefore !== null) {
        const anchorEl = list.querySelector('[data-font="' + anchorFont + '"]:not([data-category="favorites"])');
        if (anchorEl) {
          const anchorOffsetAfter = anchorEl.getBoundingClientRect().top - list.getBoundingClientRect().top;
          const scrollDelta = anchorOffsetAfter - anchorOffsetBefore;
          list.scrollTop += scrollDelta;
        }
      }
    }

    function extractFontFamily(fontString) {
      if (!fontString) return '';
      // Extract first font from font-family string
      const match = fontString.match(/^['"]?([^'",]+?)['"]?(?:,|$)/);
      return match ? match[1].trim() : fontString;
    }

    function normalizeWeight(weight) {
      if (!weight) return 'normal';
      const w = String(weight).toLowerCase();
      if (w === '400' || w === 'normal') return 'normal';
      if (w === '700' || w === 'bold') return 'bold';
      return w;
    }

    function getCurrentSettingsForContext(context) {
      if (context === 'editor') {
        return {
          size: settings.editorFontSize,
          weight: settings.editorFontWeight,
          lineHeight: settings.editorLineHeight,
          letterSpacing: settings.editorLetterSpacing,
        };
      } else {
        return {
          size: settings.terminalFontSize,
          weight: settings.terminalFontWeight,
          lineHeight: settings.terminalLineHeight,
          letterSpacing: settings.terminalLetterSpacing,
          boldWeight: settings.terminalBoldWeight,
        };
      }
    }

    function updateUI() {
      // Update size inputs
      document.getElementById('editor-size').value = settings.editorFontSize || 14;
      document.getElementById('terminal-size').value = settings.terminalFontSize || 14;

      // Update line height inputs
      document.getElementById('editor-line-height').value = settings.editorLineHeight || 0;
      document.getElementById('terminal-line-height').value = settings.terminalLineHeight || 1;

      // Update letter spacing inputs
      document.getElementById('editor-letter-spacing').value = settings.editorLetterSpacing || 0;
      document.getElementById('terminal-letter-spacing').value = settings.terminalLetterSpacing || 0;

      // Get current font names
      const editorFontName = extractFontFamily(settings.editorFont);
      const terminalFontName = extractFontFamily(settings.terminalFont) || editorFontName;
      currentEditorFont = editorFontName;
      currentTerminalFont = terminalFontName;

      // Populate weight dropdowns based on current fonts
      populateWeightDropdown('editor-weight', editorFontName, settings.editorFontWeight);
      populateWeightDropdown('terminal-weight', terminalFontName, settings.terminalFontWeight);

      // Populate terminal bold weight dropdown
      populateBoldWeightDropdown(settings.terminalBoldWeight);

      // Render font lists
      renderFontList('editor', document.getElementById('editor-search').value);
      renderFontList('terminal', document.getElementById('terminal-search').value);

      updatePreview();
    }

    function updatePreview() {
      const preview = document.getElementById('preview');
      const activeTab = document.querySelector('.tab.active').dataset.tab;

      // Determine which font to preview
      let fontToPreview;
      let sizeToPreview;
      let weightToPreview;
      let letterSpacingToPreview;
      let lineHeightToPreview;

      if (selectedPreviewFont) {
        fontToPreview = "'" + selectedPreviewFont + "', monospace";
        if (activeTab === 'editor') {
          sizeToPreview = settings.editorFontSize || 14;
          weightToPreview = document.getElementById('editor-weight').value || 'normal';
          letterSpacingToPreview = settings.editorLetterSpacing || 0;
          lineHeightToPreview = settings.editorLineHeight || 0;
        } else {
          sizeToPreview = settings.terminalFontSize || 14;
          weightToPreview = document.getElementById('terminal-weight').value || 'normal';
          letterSpacingToPreview = settings.terminalLetterSpacing || 0;
          lineHeightToPreview = settings.terminalLineHeight || 1;
        }
      } else if (activeTab === 'editor') {
        fontToPreview = settings.editorFont || 'monospace';
        sizeToPreview = settings.editorFontSize || 14;
        weightToPreview = settings.editorFontWeight || 'normal';
        letterSpacingToPreview = settings.editorLetterSpacing || 0;
        lineHeightToPreview = settings.editorLineHeight || 0;
      } else {
        fontToPreview = settings.terminalFont || settings.editorFont || 'monospace';
        sizeToPreview = settings.terminalFontSize || 14;
        weightToPreview = settings.terminalFontWeight || 'normal';
        letterSpacingToPreview = settings.terminalLetterSpacing || 0;
        lineHeightToPreview = settings.terminalLineHeight || 1;
      }

      // Show preview if we have a font selected or applied
      const hasFont = fontToPreview && fontToPreview !== 'monospace';

      if (hasFont || selectedPreviewFont) {
        preview.style.fontFamily = fontToPreview;
        preview.style.fontSize = sizeToPreview + 'px';
        preview.style.fontWeight = weightToPreview;
        preview.style.letterSpacing = letterSpacingToPreview ? letterSpacingToPreview + 'px' : 'normal';
        if (activeTab === 'editor') {
          // VS Code editor.lineHeight: 0 = auto (~1.35x font size), >0 = pixels
          preview.style.lineHeight = lineHeightToPreview > 0 ? lineHeightToPreview + 'px' : '1.5';
        } else {
          // VS Code terminal.integrated.lineHeight: multiplier (1 = default)
          preview.style.lineHeight = String(lineHeightToPreview);
        }
        preview.textContent = PREVIEW_TEXT;
        preview.className = 'preview-text';
      } else {
        preview.textContent = '';
        preview.className = 'preview-text preview-empty';
      }

      // Update preview info with font name
      const previewInfo = document.getElementById('preview-info');
      const fontName = selectedPreviewFont || extractFontFamily(fontToPreview);
      previewInfo.textContent = fontName && fontName !== 'monospace' ? fontName : '';
    }

    function updateRestoreButton() {
      const btn = document.getElementById('restore-btn');
      if (!previousSettings) {
        btn.disabled = true;
        return;
      }

      // Check if current settings differ from previous
      const hasChanges =
        settings.editorFont !== previousSettings.editorFont ||
        settings.terminalFont !== previousSettings.terminalFont ||
        settings.editorFontSize !== previousSettings.editorFontSize ||
        settings.terminalFontSize !== previousSettings.terminalFontSize ||
        settings.editorFontWeight !== previousSettings.editorFontWeight ||
        settings.terminalFontWeight !== previousSettings.terminalFontWeight ||
        settings.editorLineHeight !== previousSettings.editorLineHeight ||
        settings.terminalLineHeight !== previousSettings.terminalLineHeight ||
        settings.editorLetterSpacing !== previousSettings.editorLetterSpacing ||
        settings.terminalLetterSpacing !== previousSettings.terminalLetterSpacing ||
        settings.terminalBoldWeight !== previousSettings.terminalBoldWeight;

      btn.disabled = !hasChanges;

      // Update tooltip content
      document.getElementById('prev-editor-font').textContent = extractFontFamily(previousSettings.editorFont) || 'Default';
      document.getElementById('prev-editor-size').textContent = previousSettings.editorFontSize + 'px';
      document.getElementById('prev-editor-weight').textContent = formatWeight(previousSettings.editorFontWeight);
      document.getElementById('prev-editor-line-height').textContent = formatLineHeight(previousSettings.editorLineHeight, 'editor');
      document.getElementById('prev-editor-letter-spacing').textContent = formatLetterSpacing(previousSettings.editorLetterSpacing);
      document.getElementById('prev-terminal-font').textContent = extractFontFamily(previousSettings.terminalFont) || 'Default';
      document.getElementById('prev-terminal-size').textContent = previousSettings.terminalFontSize + 'px';
      document.getElementById('prev-terminal-weight').textContent = formatWeight(previousSettings.terminalFontWeight);
      document.getElementById('prev-terminal-line-height').textContent = formatLineHeight(previousSettings.terminalLineHeight, 'terminal');
      document.getElementById('prev-terminal-letter-spacing').textContent = formatLetterSpacing(previousSettings.terminalLetterSpacing);
      document.getElementById('prev-terminal-bold-weight').textContent = formatBoldWeight(previousSettings.terminalBoldWeight);
    }

    function formatWeight(weight) {
      if (!weight || weight === 'normal') return '400 Regular';
      if (weight === 'bold') return '700 Bold';
      const labels = {
        '100': 'Thin', '200': 'ExtraLight', '300': 'Light',
        '400': 'Regular', '500': 'Medium', '600': 'SemiBold',
        '700': 'Bold', '800': 'ExtraBold', '900': 'Black'
      };
      return weight + ' ' + (labels[weight] || '');
    }

    function formatLineHeight(lh, context) {
      if (context === 'editor') {
        return lh === 0 ? 'Auto' : lh + 'px';
      }
      return lh === 1 ? 'Default' : lh.toFixed(1);
    }

    function formatLetterSpacing(ls) {
      return ls === 0 ? 'Default' : ls + 'px';
    }

    function formatBoldWeight(weight) {
      if (!weight || weight === 'bold' || weight === '700') return 'Bold';
      if (weight === 'normal' || weight === '400') return 'Normal';
      const labels = {
        '500': 'Medium', '600': 'SemiBold', '800': 'ExtraBold', '900': 'Black'
      };
      return labels[weight] || weight;
    }

    // Restore button click handler
    document.getElementById('restore-btn').addEventListener('click', () => {
      vscode.postMessage({ command: 'restoreSettings' });
    });

    // Handle messages from extension
    window.addEventListener('message', event => {
      const message = event.data;

      switch (message.command) {
        case 'init':
          fonts = message.fonts;
          fontsLoaded = true;
          settings = message.settings;
          previousSettings = message.previousSettings;
          favorites = message.favorites || {};
          platform = message.platform || '';

          // Display build ID
          if (message.buildId) {
            document.getElementById('build-stamp').textContent = message.buildId;
          }

          // Hide Variable filter on Windows (no variable font detection)
          if (platform === 'win32') {
            document.querySelectorAll('[data-filter="variable"]').forEach(el => {
              el.style.display = 'none';
            });
          }

          updateUI();
          updateRestoreButton();
          break;
        case 'settingsUpdated':
          settings = message.settings;
          updateUI();
          updateRestoreButton();
          break;
        case 'previousSettingsUpdated':
          previousSettings = message.previousSettings;
          updateRestoreButton();
          break;
        case 'favoritesUpdated':
          favorites = message.favorites || {};
          renderFontList('editor', document.getElementById('editor-search').value, message.toggledFont);
          renderFontList('terminal', document.getElementById('terminal-search').value, message.toggledFont);
          break;
      }
    });

    // Request initial settings
    vscode.postMessage({ command: 'getSettings' });
  </script>
</body>
</html>`;
}

function getNonce(): string {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
