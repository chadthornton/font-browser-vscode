import * as vscode from 'vscode';
import { TypePickerViewProvider } from './TypePickerViewProvider';

export function activate(context: vscode.ExtensionContext) {
  const provider = new TypePickerViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      TypePickerViewProvider.viewType,
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('typePicker.refresh', () => {
      provider.refresh();
    })
  );
}

export function deactivate() {}
