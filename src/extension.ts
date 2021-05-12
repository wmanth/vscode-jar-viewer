import * as vscode from 'vscode';
import { JarEditorProvider } from './jarEditor';

export function activate(context: vscode.ExtensionContext) {
	console.log('activated');
	context.subscriptions.push(JarEditorProvider.register(context));
}
