import * as vscode from 'vscode';

export function getPreviewContent(
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
  <title>Font Preview</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      padding: 12px;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-input-background);
      overflow-y: auto;
    }

    .preview-text {
      font-size: 14px;
      line-height: 1;
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

    .preview-warning {
      margin-top: 6px;
      font-size: 11px;
      color: var(--vscode-editorWarning-foreground, #cca700);
      opacity: 0.85;
    }

    .build-stamp {
      font-size: 9px;
      opacity: 0.3;
      text-align: right;
      padding-top: 4px;
    }
  </style>
</head>
<body>
  <div class="preview-text preview-empty" id="preview">Select a font to preview</div>
  <div class="preview-info" id="preview-info"></div>
  <div class="preview-warning" id="preview-warning"></div>
  <div class="build-stamp" id="build-stamp"></div>

  <script nonce="${nonce}">
    const PREVIEW_TEXT = '0O 1lI |!¡ {}[]() <> -> => != === <= >= ++ -- const fn = (x) => x * 2; if (arr[0] !== null) { } "string" THE QUICK BROWN FOX the lazy dog jumps';

    window.addEventListener('message', event => {
      const message = event.data;

      switch (message.command) {
        case 'updatePreview': {
          const preview = document.getElementById('preview');
          const previewInfo = document.getElementById('preview-info');

          const warning = document.getElementById('preview-warning');

          if (message.fontFamily) {
            preview.style.fontFamily = message.fontFamily;
            preview.style.fontSize = '14px';
            preview.style.fontWeight = message.fontWeight || 'normal';
            preview.style.letterSpacing = 'normal';
            preview.style.lineHeight = '1';
            preview.textContent = PREVIEW_TEXT;
            preview.className = 'preview-text';
            previewInfo.textContent = message.fontName || '';

            // Show terminal compatibility warnings
            if (message.context === 'terminal' && message.category && message.category !== 'monospace') {
              warning.textContent = 'Not monospace — may render with uneven spacing in terminal';
            } else if (message.context === 'terminal' && message.hasTextureHealing) {
              warning.textContent = 'Texture healing may cause rendering issues in terminal';
            } else {
              warning.textContent = '';
            }
          } else {
            preview.textContent = 'Select a font to preview';
            preview.className = 'preview-text preview-empty';
            previewInfo.textContent = '';
            warning.textContent = '';
          }
          break;
        }
        case 'setBuildId':
          document.getElementById('build-stamp').textContent = message.buildId || '';
          break;
      }
    });
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
