import * as vscode from 'vscode';
import JarEditorProvider from './JarEditorProvider';
import JarDocumentContentProvider from './JarDocumentContentProvider';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(JarDocumentContentProvider.register(context));
	context.subscriptions.push(JarEditorProvider.register(context));
}
