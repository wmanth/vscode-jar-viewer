import * as vscode from 'vscode';
import * as path from 'path';
import JarDocument from './JarDocument';

export default class JarEditorProvider implements vscode.CustomEditorProvider {

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

	resolveCustomEditor(document: vscode.CustomDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken) {
		if (document instanceof JarDocument) {
			webviewPanel.webview.options = {
				enableScripts: true,
				localResourceRoots: [
					vscode.Uri.file(path.join(this.context.extensionPath, "out-app"))
				]
			};
			webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document);
		}
	}

	/**
	 * Get the static html used for the editor webviews.
	 */
	private getHtmlForWebview(webview: vscode.Webview, document: JarDocument): string {
		// Local path to main script run in the webview
		const reactAppPath = path.join(this.context.extensionPath, "out-app", "jar-viewer.js");
		const reactAppUri = vscode.Uri.file(reactAppPath).with({ scheme: "vscode-resource" });

		const jarContentJson = JSON.stringify(document.content);

		return /* html */`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Jar Viewer</title>

				<meta http-equiv="Content-Security-Policy"
					content="default-src 'none';
						img-src https:;
						script-src 'unsafe-eval' 'unsafe-inline' vscode-resource:;
						style-src vscode-resource: 'unsafe-inline';">
				<script>
					window.acquireVsCodeApi = acquireVsCodeApi;
					window.jarContent = ${jarContentJson}
				</script>
			</head>
			<body>
				<div id="root"></div>
				<script src="${reactAppUri}"></script>
			</body>
			</html>`;
	}

}
