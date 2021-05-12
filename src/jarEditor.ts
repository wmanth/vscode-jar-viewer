import * as vscode from 'vscode';

class JarDocument implements vscode.CustomDocument {

	static async create(uri: vscode.Uri): Promise<JarDocument> {
		// If we have a backup, read that. Otherwise read the resource from the workspace
		const fileData = await JarDocument.readFile(uri);
		return new JarDocument(uri, fileData);
	}

	private static async readFile(uri: vscode.Uri): Promise<Uint8Array> {
		if (uri.scheme === 'untitled') {
			return new Uint8Array();
		}
		return vscode.workspace.fs.readFile(uri);
	}

	private constructor(
		readonly uri: vscode.Uri,
		readonly content: Uint8Array) {}

	dispose(): void {}
}

export class JarEditorProvider implements vscode.CustomEditorProvider {

	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new JarEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(JarEditorProvider.viewType, provider);
		return providerRegistration;
	}

	private static readonly viewType = 'jar.contentView';

	constructor(
		private readonly context: vscode.ExtensionContext
	) { }

	private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<JarDocument>>();
	public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

	saveCustomDocument(document: vscode.CustomDocument, cancellation: vscode.CancellationToken): Thenable<void> {
		throw new Error("Method 'saveCustomDocument' not implemented.");
	}

	saveCustomDocumentAs(document: vscode.CustomDocument, destination: vscode.Uri, cancellation: vscode.CancellationToken): Thenable<void> {
		throw new Error("Method 'saveCustomDocumentAs' not implemented.");
	}

	revertCustomDocument(document: vscode.CustomDocument, cancellation: vscode.CancellationToken): Thenable<void> {
		throw new Error("Method 'revertCustomDocument' not implemented.");
	}

	backupCustomDocument(document: vscode.CustomDocument, context: vscode.CustomDocumentBackupContext, cancellation: vscode.CancellationToken): Thenable<vscode.CustomDocumentBackup> {
		throw new Error("Method 'backupCustomDocument' not implemented.");
	}

	async openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): Promise<JarDocument> {
		const document = await JarDocument.create(uri);
		return document;
	}

	async resolveCustomEditor(document: vscode.CustomDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): Promise<void> {
		// Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
		};
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
	}

	/**
	 * Get the static html used for the editor webviews.
	 */
	private getHtmlForWebview(webview: vscode.Webview): string {
		return /* html */`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<title>Jar Viewer</title>
			</head>
			<body>
				<h1>Jar Viewer</h1>
			</body>
			</html>`;
	}

}
