import * as vscode from 'vscode';
import { FontBrowserViewProvider } from './FontBrowserViewProvider';
import { PreviewViewProvider } from './PreviewViewProvider';

export function activate(context: vscode.ExtensionContext) {
  const previewProvider = new PreviewViewProvider(context.extensionUri);
  const provider = new FontBrowserViewProvider(context.extensionUri, context, previewProvider);

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
    vscode.window.registerWebviewViewProvider(
      PreviewViewProvider.viewType,
      previewProvider,
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
