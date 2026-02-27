import * as vscode from 'vscode';
import { getWebviewContent } from './webview/getWebviewContent';
import { getSystemFonts } from './fonts';
import { migrateFavorites, FavoritesData, FavoriteSettings } from './favorites';
import { PreviewViewProvider } from './PreviewViewProvider';

export class FontBrowserViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'fontBrowser.mainView';
  private static readonly FAVORITES_KEY = 'fontBrowser.favorites';
  private static readonly ACTIVE_TAB_KEY = 'fontBrowser.activeTab';
  private static readonly BUILD_ID = 'trim-noether';

  private _view?: vscode.WebviewView;
  private _previousSettings?: ReturnType<typeof this._getCurrentSettings>;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext,
    private readonly _previewProvider: PreviewViewProvider
  ) {}

  private _getFavorites(): FavoritesData {
    const stored = this._context.globalState.get<FavoritesData | string[]>(FontBrowserViewProvider.FAVORITES_KEY);
    const favorites = migrateFavorites(stored);

    // If migration happened, save the new format (async, but don't block)
    if (Array.isArray(stored)) {
      this._context.globalState.update(FontBrowserViewProvider.FAVORITES_KEY, favorites);
    }

    return favorites;
  }

  private async _setFavorites(favorites: FavoritesData): Promise<void> {
    await this._context.globalState.update(FontBrowserViewProvider.FAVORITES_KEY, favorites);
  }

  private async _toggleFavorite(
    fontName: string,
    context: 'editor' | 'terminal',
    settings?: FavoriteSettings
  ): Promise<void> {
    const favorites = this._getFavorites();

    if (fontName in favorites) {
      // Unstar: remove the font entirely
      delete favorites[fontName];
    } else {
      // Star: add font with optional settings
      favorites[fontName] = {};
      if (settings) {
        favorites[fontName][context] = settings;
      }
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
          // HACK: VS Code's terminal renderer has a race condition where onDidChangeConfiguration
          // fires before the config write is committed, causing it to read the stale font value.
          // Use helper that forces font atlas rebuild to pick up committed values.
          await this._updateTerminalSettingWithRefresh('terminal.integrated.fontFamily', message.font);
          break;
        case 'setEditorFontSize':
          await this._updateSetting('editor.fontSize', message.size);
          break;
        case 'setTerminalFontSize':
          await this._updateTerminalSettingWithRefresh('terminal.integrated.fontSize', message.size);
          break;
        case 'setEditorFontWeight':
          await this._updateSetting('editor.fontWeight', message.weight);
          break;
        case 'setTerminalFontWeight':
          await this._updateTerminalSettingWithRefresh('terminal.integrated.fontWeight', message.weight);
          break;
        case 'setEditorLineHeight':
          await this._updateSetting('editor.lineHeight', message.lineHeight);
          break;
        case 'setTerminalLineHeight':
          await this._updateTerminalSettingWithRefresh('terminal.integrated.lineHeight', message.lineHeight);
          break;
        case 'setEditorLetterSpacing':
          await this._updateSetting('editor.letterSpacing', message.letterSpacing);
          break;
        case 'setTerminalLetterSpacing':
          await this._updateTerminalSettingWithRefresh('terminal.integrated.letterSpacing', message.letterSpacing);
          break;
        case 'setTerminalBoldWeight':
          await this._updateTerminalSettingWithRefresh('terminal.integrated.fontWeightBold', message.weight);
          break;
        case 'getSettings':
          this._sendCurrentSettings();
          break;
        case 'restoreSettings':
          await this._restoreSettings();
          break;
        case 'toggleFavorite':
          await this._toggleFavorite(message.fontName, message.context, message.settings);
          break;
        case 'setActiveTab':
          await this._context.globalState.update(FontBrowserViewProvider.ACTIVE_TAB_KEY, message.tab);
          break;
        case 'setEditorLigatures':
          await this._updateSetting('editor.fontLigatures', message.enabled);
          break;
        case 'setTerminalLigatures':
          await this._updateSetting('terminal.integrated.fontLigatures.enabled', message.enabled);
          break;
        case 'copySettingsToOther':
          await this._copySettingsToOther(message.fromTab);
          break;
        case 'resetDefaults':
          await this._resetToDefaults();
          break;
        case 'updatePreview':
          this._previewProvider.updatePreview(message);
          break;
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

    this._previewProvider.setBuildId(FontBrowserViewProvider.BUILD_ID);

    this._view.webview.postMessage({
      command: 'init',
      fonts,
      settings,
      previousSettings: this._previousSettings,
      favorites: this._getFavorites(),
      platform: process.platform,
      activeTab: this._context.globalState.get<string>(FontBrowserViewProvider.ACTIVE_TAB_KEY) || 'editor',
      buildId: FontBrowserViewProvider.BUILD_ID,
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
      editorLineHeight: config.get<number>('editor.lineHeight') || 0,
      terminalLineHeight: config.get<number>('terminal.integrated.lineHeight') || 1,
      editorLetterSpacing: config.get<number>('editor.letterSpacing') || 0,
      terminalLetterSpacing: config.get<number>('terminal.integrated.letterSpacing') || 0,
      terminalBoldWeight: config.get<string>('terminal.integrated.fontWeightBold') || 'bold',
      editorLigatures: config.get<boolean>('editor.fontLigatures') || false,
      terminalLigatures: config.get<boolean>('terminal.integrated.fontLigatures.enabled') || false,
    };
  }

  private async _updateSetting(key: string, value: string | number | boolean) {
    const config = vscode.workspace.getConfiguration();
    await config.update(key, value, vscode.ConfigurationTarget.Global);
  }

  // Apply terminal setting with font atlas refresh workaround
  private async _updateTerminalSettingWithRefresh(key: string, value: string | number) {
    await this._updateSetting(key, value);

    // Capture the font size AFTER the setting update (in case we just changed the size)
    const config = vscode.workspace.getConfiguration();
    const currentSize = config.get<number>('terminal.integrated.fontSize') || 12;

    // Zoom in to trigger font atlas rebuild (forces terminal to re-read all committed settings)
    await vscode.commands.executeCommand('workbench.action.terminal.fontZoomIn');

    // Restore current size (not "original" - might have just been changed)
    await this._updateSetting('terminal.integrated.fontSize', currentSize);
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
    await this._updateSetting('editor.lineHeight', this._previousSettings.editorLineHeight);
    await this._updateSetting('terminal.integrated.lineHeight', this._previousSettings.terminalLineHeight);
    await this._updateSetting('editor.letterSpacing', this._previousSettings.editorLetterSpacing);
    await this._updateSetting('terminal.integrated.letterSpacing', this._previousSettings.terminalLetterSpacing);
    await this._updateSetting('terminal.integrated.fontWeightBold', this._previousSettings.terminalBoldWeight);
    await this._updateSetting('editor.fontLigatures', this._previousSettings.editorLigatures);
    await this._updateSetting('terminal.integrated.fontLigatures.enabled', this._previousSettings.terminalLigatures);

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

  private async _copySettingsToOther(fromTab: 'editor' | 'terminal') {
    const s = this._getCurrentSettings();
    if (fromTab === 'editor') {
      // Copy editor settings to terminal
      const fontName = this._extractFontFamily(s.editorFont);
      await this._updateTerminalSettingWithRefresh('terminal.integrated.fontFamily', fontName);
      await this._updateSetting('terminal.integrated.fontSize', s.editorFontSize);
      await this._updateSetting('terminal.integrated.fontWeight', s.editorFontWeight);
      await this._updateSetting('terminal.integrated.lineHeight',
        s.editorLineHeight === 0 ? 1 : Math.max(1, Math.min(3, s.editorLineHeight / s.editorFontSize)));
      await this._updateSetting('terminal.integrated.letterSpacing', s.editorLetterSpacing);
      await this._updateSetting('terminal.integrated.fontLigatures.enabled', s.editorLigatures);
    } else {
      // Copy terminal settings to editor
      const fontName = this._extractFontFamily(s.terminalFont) || this._extractFontFamily(s.editorFont);
      const fontValue = "'" + fontName + "', monospace";
      await this._updateSetting('editor.fontFamily', fontValue);
      await this._updateSetting('editor.fontSize', s.terminalFontSize);
      await this._updateSetting('editor.fontWeight', s.terminalFontWeight);
      await this._updateSetting('editor.lineHeight',
        s.terminalLineHeight === 1 ? 0 : Math.round(s.terminalLineHeight * s.terminalFontSize));
      await this._updateSetting('editor.letterSpacing', s.terminalLetterSpacing);
      await this._updateSetting('editor.fontLigatures', s.terminalLigatures);
    }
    this._sendCurrentSettings();
  }

  private async _resetToDefaults() {
    const config = vscode.workspace.getConfiguration();
    // Remove all font settings (revert to VS Code defaults)
    const keys = [
      'editor.fontFamily', 'editor.fontSize', 'editor.fontWeight',
      'editor.lineHeight', 'editor.letterSpacing', 'editor.fontLigatures',
      'terminal.integrated.fontFamily', 'terminal.integrated.fontSize',
      'terminal.integrated.fontWeight', 'terminal.integrated.lineHeight',
      'terminal.integrated.letterSpacing', 'terminal.integrated.fontWeightBold',
      'terminal.integrated.fontLigatures.enabled',
    ];
    for (const key of keys) {
      await config.update(key, undefined, vscode.ConfigurationTarget.Global);
    }
    this._sendCurrentSettings();
  }

  private _extractFontFamily(fontString: string): string {
    if (!fontString) return '';
    const match = fontString.match(/^['"]?([^'",]+?)['"]?(?:,|$)/);
    return match ? match[1].trim() : fontString;
  }
}
