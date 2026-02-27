import * as vscode from 'vscode';
import { getPreviewContent } from './webview/getPreviewContent';

export interface PreviewData {
  fontFamily: string;
  fontName: string;
  fontSize: number;
  fontWeight: string;
  letterSpacing: number;
  lineHeight: number;
  context: 'editor' | 'terminal';
}

export class PreviewViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'fontBrowser.previewView';

  private _view?: vscode.WebviewView;
  private _pendingUpdate?: PreviewData;
  private _buildId?: string;

  constructor(
    private readonly _extensionUri: vscode.Uri
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = getPreviewContent(
      webviewView.webview,
      this._extensionUri
    );

    // Send build ID if we have one
    if (this._buildId) {
      webviewView.webview.postMessage({ command: 'setBuildId', buildId: this._buildId });
    }

    // Send pending preview update if any
    if (this._pendingUpdate) {
      webviewView.webview.postMessage({ command: 'updatePreview', ...this._pendingUpdate });
      this._pendingUpdate = undefined;
    }
  }

  public setBuildId(buildId: string) {
    this._buildId = buildId;
    if (this._view) {
      this._view.webview.postMessage({ command: 'setBuildId', buildId });
    }
  }

  public updatePreview(data: PreviewData) {
    if (this._view) {
      this._view.webview.postMessage({ command: 'updatePreview', ...data });
    } else {
      this._pendingUpdate = data;
    }
  }

  public clearPreview() {
    if (this._view) {
      this._view.webview.postMessage({ command: 'updatePreview', fontFamily: '' });
    }
  }
}
