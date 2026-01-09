import * as vscode from 'vscode';
import { getWebviewContent } from './webview/getWebviewContent';
import { getSystemFonts } from './fonts';

export class TypePickerViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'typePicker.mainView';

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

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

    webviewView.webview.html = getWebviewContent(
      webviewView.webview,
      this._extensionUri
    );

    // Send initial data to webview
    this._sendInitialData();

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'setEditorFont':
          await this._updateSetting('editor.fontFamily', message.font);
          break;
        case 'setTerminalFont':
          await this._updateSetting('terminal.integrated.fontFamily', message.font);
          break;
        case 'setEditorFontSize':
          await this._updateSetting('editor.fontSize', message.size);
          break;
        case 'setTerminalFontSize':
          await this._updateSetting('terminal.integrated.fontSize', message.size);
          break;
        case 'setEditorFontWeight':
          await this._updateSetting('editor.fontWeight', message.weight);
          break;
        case 'setTerminalFontWeight':
          await this._updateSetting('terminal.integrated.fontWeight', message.weight);
          break;
        case 'setEditorFontStyle':
          // VS Code doesn't have a direct fontStyle setting for editor
          // but we can use fontLigatures or custom CSS
          break;
        case 'getSettings':
          this._sendCurrentSettings();
          break;
      }
    });

    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration('editor.fontFamily') ||
        e.affectsConfiguration('terminal.integrated.fontFamily') ||
        e.affectsConfiguration('editor.fontSize') ||
        e.affectsConfiguration('terminal.integrated.fontSize') ||
        e.affectsConfiguration('editor.fontWeight') ||
        e.affectsConfiguration('terminal.integrated.fontWeight')
      ) {
        this._sendCurrentSettings();
      }
    });
  }

  public refresh() {
    if (this._view) {
      this._sendInitialData();
    }
  }

  private async _sendInitialData() {
    if (!this._view) return;

    const fonts = await getSystemFonts();
    const settings = this._getCurrentSettings();

    this._view.webview.postMessage({
      command: 'init',
      fonts,
      settings,
    });
  }

  private _sendCurrentSettings() {
    if (!this._view) return;

    this._view.webview.postMessage({
      command: 'settingsUpdated',
      settings: this._getCurrentSettings(),
    });
  }

  private _getCurrentSettings() {
    const config = vscode.workspace.getConfiguration();
    return {
      editorFont: config.get<string>('editor.fontFamily') || 'monospace',
      terminalFont: config.get<string>('terminal.integrated.fontFamily') || '',
      editorFontSize: config.get<number>('editor.fontSize') || 14,
      terminalFontSize: config.get<number>('terminal.integrated.fontSize') || 14,
      editorFontWeight: config.get<string>('editor.fontWeight') || 'normal',
      terminalFontWeight: config.get<string>('terminal.integrated.fontWeight') || 'normal',
    };
  }

  private async _updateSetting(key: string, value: string | number) {
    const config = vscode.workspace.getConfiguration();
    await config.update(key, value, vscode.ConfigurationTarget.Global);
  }
}
