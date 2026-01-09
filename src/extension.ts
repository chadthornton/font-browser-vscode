import * as vscode from 'vscode';
import { FontBrowserViewProvider } from './FontBrowserViewProvider';

export function activate(context: vscode.ExtensionContext) {
  const provider = new FontBrowserViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      FontBrowserViewProvider.viewType,
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('fontBrowser.refresh', () => {
      provider.refresh();
    })
  );
}

export function deactivate() {}
