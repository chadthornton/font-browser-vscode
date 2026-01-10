import * as vscode from 'vscode';
import { getWebviewContent } from './webview/getWebviewContent';
import { getSystemFonts } from './fonts';

export class FontBrowserViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'fontBrowser.mainView';
  private static readonly FAVORITES_KEY = 'fontBrowser.favorites';

  private _view?: vscode.WebviewView;
  private _previousSettings?: ReturnType<typeof this._getCurrentSettings>;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) {}

  private _getFavorites(): string[] {
    return this._context.globalState.get<string[]>(FontBrowserViewProvider.FAVORITES_KEY, []);
  }

  private async _setFavorites(favorites: string[]): Promise<void> {
    await this._context.globalState.update(FontBrowserViewProvider.FAVORITES_KEY, favorites);
  }

  private async _toggleFavorite(fontName: string): Promise<void> {
    const favorites = this._getFavorites();
    const index = favorites.indexOf(fontName);

    if (index === -1) {
      favorites.push(fontName);
    } else {
      favorites.splice(index, 1);
    }

    await this._setFavorites(favorites);
    this._sendFavoritesUpdate(fontName);
  }

  private _sendFavoritesUpdate(toggledFont?: string): void {
    if (!this._view) return;
    this._view.webview.postMessage({
      command: 'favoritesUpdated',
      favorites: this._getFavorites(),
      toggledFont,
    });
  }

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
    this._sendInitialData().catch(err => {
      console.error('Font Browser: Failed to send initial data:', err);
    });

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
        case 'restoreSettings':
          await this._restoreSettings();
          break;
        case 'toggleFavorite':
          await this._toggleFavorite(message.fontName);
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

    // Capture previous settings on first load
    if (!this._previousSettings) {
      this._previousSettings = { ...settings };
    }

    this._view.webview.postMessage({
      command: 'init',
      fonts,
      settings,
      previousSettings: this._previousSettings,
      favorites: this._getFavorites(),
      platform: process.platform,
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

  private async _restoreSettings() {
    if (!this._previousSettings) return;

    const currentSettings = this._getCurrentSettings();

    // Restore all settings to previous values
    await this._updateSetting('editor.fontFamily', this._previousSettings.editorFont);
    await this._updateSetting('terminal.integrated.fontFamily', this._previousSettings.terminalFont);
    await this._updateSetting('editor.fontSize', this._previousSettings.editorFontSize);
    await this._updateSetting('terminal.integrated.fontSize', this._previousSettings.terminalFontSize);
    await this._updateSetting('editor.fontWeight', this._previousSettings.editorFontWeight);
    await this._updateSetting('terminal.integrated.fontWeight', this._previousSettings.terminalFontWeight);

    // Update previous settings to what we just restored from
    // so user can toggle back if they want
    this._previousSettings = currentSettings;

    // Send updated previous settings to webview
    if (this._view) {
      this._view.webview.postMessage({
        command: 'previousSettingsUpdated',
        previousSettings: this._previousSettings,
      });
    }
  }
}
