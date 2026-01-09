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
  <title>Type Picker</title>
  <style>
    :root {
      --vscode-spacing: 8px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      padding: var(--vscode-spacing);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
    }

    .tab-container {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--vscode-widget-border);
      flex: 1;
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
    }

    .tab-content.active {
      display: block;
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
    }

    .search-box:focus {
      outline: 1px solid var(--vscode-focusBorder);
      border-color: var(--vscode-focusBorder);
    }

    .search-box::placeholder {
      color: var(--vscode-input-placeholderForeground);
    }

    .font-list {
      max-height: 240px;
      overflow-y: auto;
      border: 1px solid var(--vscode-widget-border);
      border-radius: 4px;
      background: var(--vscode-input-background);
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
      padding: 6px 10px;
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

    .font-item.not-installed {
      opacity: 0.4;
    }

    .font-name {
      flex: 1;
      font-size: 13px;
    }

    .badge {
      font-size: 9px;
      padding: 1px 4px;
      border-radius: 2px;
      text-transform: uppercase;
      background: var(--vscode-inputValidation-warningBackground);
      color: var(--vscode-inputValidation-warningForeground);
    }

    .badge-variable {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
    }

    .controls {
      margin: 12px 0;
      padding: 10px 0;
      border-top: 1px solid var(--vscode-widget-border);
    }

    .control-row {
      display: flex;
      gap: 6px;
      align-items: center;
      margin-bottom: 8px;
    }

    .control-row:last-child {
      margin-bottom: 0;
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
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-widget-border);
      border-radius: 4px;
      min-height: 80px;
    }

    .preview-text {
      font-size: 16px;
      line-height: 1.4;
      white-space: pre;
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

    .italic-info {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      margin-left: 4px;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 8px;
      gap: 8px;
    }

    .restore-btn {
      position: relative;
      background: transparent;
      border: 1px solid var(--vscode-button-secondaryBackground);
      color: var(--vscode-foreground);
      padding: 4px 8px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 4px;
      opacity: 0.8;
    }

    .restore-btn:hover {
      opacity: 1;
      background: var(--vscode-button-secondaryHoverBackground);
    }

    .restore-btn:disabled {
      opacity: 0.4;
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
      background: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-widget-border);
      border-radius: 4px;
      padding: 10px 12px;
      min-width: 220px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      z-index: 100;
      display: none;
      text-align: left;
    }

    .restore-btn:hover .restore-tooltip {
      display: block;
    }

    .tooltip-title {
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--vscode-foreground);
    }

    .tooltip-section {
      margin-bottom: 8px;
    }

    .tooltip-section:last-child {
      margin-bottom: 0;
    }

    .tooltip-section-title {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 4px;
    }

    .tooltip-item {
      font-size: 11px;
      color: var(--vscode-foreground);
      margin-bottom: 2px;
    }

    .tooltip-item:last-child {
      margin-bottom: 0;
    }

    .tooltip-value {
      color: var(--vscode-textLink-foreground);
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
          <div class="tooltip-item">Font: <span class="tooltip-value" id="prev-editor-font">-</span></div>
          <div class="tooltip-item">Size: <span class="tooltip-value" id="prev-editor-size">-</span></div>
          <div class="tooltip-item">Weight: <span class="tooltip-value" id="prev-editor-weight">-</span></div>
        </div>
        <div class="tooltip-section">
          <div class="tooltip-section-title">Terminal</div>
          <div class="tooltip-item">Font: <span class="tooltip-value" id="prev-terminal-font">-</span></div>
          <div class="tooltip-item">Size: <span class="tooltip-value" id="prev-terminal-size">-</span></div>
          <div class="tooltip-item">Weight: <span class="tooltip-value" id="prev-terminal-weight">-</span></div>
        </div>
      </div>
    </button>
  </div>

  <div id="editor-tab" class="tab-content active">
    <input type="text" class="search-box" id="editor-search" placeholder="Search fonts...">
    <div class="font-list" id="editor-font-list">
      <div class="loading">Loading fonts...</div>
    </div>
    <div class="controls">
      <div class="control-row">
        <input type="number" class="size-input" id="editor-size" min="8" max="72" step="1">
        <span class="unit-label">px</span>
      </div>
      <div class="control-row">
        <select class="weight-select" id="editor-weight"></select>
      </div>
    </div>
  </div>

  <div id="terminal-tab" class="tab-content">
    <input type="text" class="search-box" id="terminal-search" placeholder="Search fonts...">
    <div class="font-list" id="terminal-font-list">
      <div class="loading">Loading fonts...</div>
    </div>
    <div class="controls">
      <div class="control-row">
        <input type="number" class="size-input" id="terminal-size" min="8" max="72" step="1">
        <span class="unit-label">px</span>
      </div>
      <div class="control-row">
        <select class="weight-select" id="terminal-weight"></select>
      </div>
    </div>
  </div>

  <div class="preview-section">
    <div class="preview-text" id="preview"></div>
  </div>
  <div class="preview-info" id="preview-info"></div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    let fonts = [];
    let settings = {};
    let previousSettings = null;
    let selectedPreviewFont = null;
    let currentEditorFont = null;
    let currentTerminalFont = null;

    const PREVIEW_TEXT = \`const hello = "world";
fn main() { println!("Hi"); }
0O 1lI |!¡ {}[]() ≈≠≤≥\`;

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
        vscode.postMessage({ command: 'setEditorFontSize', size });
      }
    });

    document.getElementById('terminal-size').addEventListener('change', (e) => {
      const size = parseInt(e.target.value, 10);
      if (size >= 8 && size <= 72) {
        vscode.postMessage({ command: 'setTerminalFontSize', size });
      }
    });

    // Font weight selects
    document.getElementById('editor-weight').addEventListener('change', (e) => {
      vscode.postMessage({ command: 'setEditorFontWeight', weight: e.target.value });
      updatePreview();
    });

    document.getElementById('terminal-weight').addEventListener('change', (e) => {
      vscode.postMessage({ command: 'setTerminalFontWeight', weight: e.target.value });
      updatePreview();
    });

    // Search functionality
    document.getElementById('editor-search').addEventListener('input', (e) => {
      renderFontList('editor', e.target.value);
    });

    document.getElementById('terminal-search').addEventListener('input', (e) => {
      renderFontList('terminal', e.target.value);
    });

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
        option.textContent = weightNum + ' ' + w.label + (w.hasItalic ? ' ✓italic' : '');
        select.appendChild(option);
      });

      // Try to select current weight, or default to first option
      const normalizedCurrent = normalizeWeight(currentWeight);
      const hasCurrentWeight = weights.some(w => w.value === normalizedCurrent);
      select.value = hasCurrentWeight ? normalizedCurrent : weights[0].value;
    }

    function renderFontList(target, filter = '') {
      const list = document.getElementById(target + '-font-list');
      const currentFontFamily = target === 'editor'
        ? extractFontFamily(settings.editorFont)
        : extractFontFamily(settings.terminalFont);

      const filteredFonts = fonts.filter(f =>
        f.name.toLowerCase().includes(filter.toLowerCase())
      );

      // Clear existing content
      list.textContent = '';

      if (filteredFonts.length === 0) {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.textContent = 'No fonts found';
        list.appendChild(loadingDiv);
        return;
      }

      // Group fonts by category
      const categories = {
        'monospace': { label: 'Monospace', fonts: [] },
        'sans-serif': { label: 'Sans Serif', fonts: [] },
        'serif': { label: 'Serif', fonts: [] }
      };

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

          const item = document.createElement('div');
          item.className = 'font-item';
          if (isSelected) item.classList.add('selected');
          if (!font.isInstalled) item.classList.add('not-installed');
          item.dataset.font = font.name;
          item.dataset.target = target;

          const nameSpan = document.createElement('span');
          nameSpan.className = 'font-name';
          nameSpan.style.fontFamily = "'" + font.name + "', monospace";
          nameSpan.textContent = font.name;
          item.appendChild(nameSpan);

          if (font.isVariable) {
            const vfBadge = document.createElement('span');
            vfBadge.className = 'badge badge-variable';
            vfBadge.textContent = 'VF';
            vfBadge.title = 'Variable font - supports all weights';
            item.appendChild(vfBadge);
          }

          if (!font.isInstalled) {
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = 'Not installed';
            item.appendChild(badge);
          }

          // Click handler - apply font
          item.addEventListener('click', () => {
            if (!font.isInstalled) {
              // Just preview uninstalled fonts
              selectedPreviewFont = font.name;
              updatePreview();
              return;
            }

            const fontName = font.name;
            selectedPreviewFont = fontName;

            // Update weight dropdown for this font
            const weightSelectId = target + '-weight';
            const currentWeight = target === 'editor'
              ? settings.editorFontWeight
              : settings.terminalFontWeight;
            populateWeightDropdown(weightSelectId, fontName, currentWeight);

            if (target === 'editor') {
              currentEditorFont = fontName;
              vscode.postMessage({ command: 'setEditorFont', font: "'" + fontName + "', monospace" });
            } else {
              currentTerminalFont = fontName;
              vscode.postMessage({ command: 'setTerminalFont', font: fontName });
            }

            updatePreview();
          });

          list.appendChild(item);
        });
      });
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

    function updateUI() {
      // Update size inputs
      document.getElementById('editor-size').value = settings.editorFontSize || 14;
      document.getElementById('terminal-size').value = settings.terminalFontSize || 14;

      // Get current font names
      const editorFontName = extractFontFamily(settings.editorFont);
      const terminalFontName = extractFontFamily(settings.terminalFont) || editorFontName;
      currentEditorFont = editorFontName;
      currentTerminalFont = terminalFontName;

      // Populate weight dropdowns based on current fonts
      populateWeightDropdown('editor-weight', editorFontName, settings.editorFontWeight);
      populateWeightDropdown('terminal-weight', terminalFontName, settings.terminalFontWeight);

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

      if (selectedPreviewFont) {
        fontToPreview = "'" + selectedPreviewFont + "', monospace";
        if (activeTab === 'editor') {
          sizeToPreview = settings.editorFontSize || 14;
          weightToPreview = document.getElementById('editor-weight').value || 'normal';
        } else {
          sizeToPreview = settings.terminalFontSize || 14;
          weightToPreview = document.getElementById('terminal-weight').value || 'normal';
        }
      } else if (activeTab === 'editor') {
        fontToPreview = settings.editorFont || 'monospace';
        sizeToPreview = settings.editorFontSize || 14;
        weightToPreview = settings.editorFontWeight || 'normal';
      } else {
        fontToPreview = settings.terminalFont || settings.editorFont || 'monospace';
        sizeToPreview = settings.terminalFontSize || 14;
        weightToPreview = settings.terminalFontWeight || 'normal';
      }

      // Show preview if we have a font selected or applied
      const hasFont = fontToPreview && fontToPreview !== 'monospace';

      if (hasFont || selectedPreviewFont) {
        preview.style.fontFamily = fontToPreview;
        preview.style.fontSize = sizeToPreview + 'px';
        preview.style.fontWeight = weightToPreview;
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
        settings.terminalFontWeight !== previousSettings.terminalFontWeight;

      btn.disabled = !hasChanges;

      // Update tooltip content
      document.getElementById('prev-editor-font').textContent = extractFontFamily(previousSettings.editorFont) || 'Default';
      document.getElementById('prev-editor-size').textContent = previousSettings.editorFontSize + 'px';
      document.getElementById('prev-editor-weight').textContent = formatWeight(previousSettings.editorFontWeight);
      document.getElementById('prev-terminal-font').textContent = extractFontFamily(previousSettings.terminalFont) || 'Default';
      document.getElementById('prev-terminal-size').textContent = previousSettings.terminalFontSize + 'px';
      document.getElementById('prev-terminal-weight').textContent = formatWeight(previousSettings.terminalFontWeight);
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
          settings = message.settings;
          previousSettings = message.previousSettings;
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
