import * as vscode from 'vscode';
import { JarEditorProvider } from './jarEditor';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(JarEditorProvider.register(context));
}
