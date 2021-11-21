import * as vscode from 'vscode';
import * as path from 'path';
import * as model from './app/model';
import JarDocument from './JarDocument';

export default class JarEditorProvider implements vscode.CustomReadonlyEditorProvider<JarDocument> {

	private readonly openDocuments = new Map<string, { document: JarDocument, webview: vscode.Webview }>();
	private readonly fileSystemWatcher = vscode.workspace.createFileSystemWatcher("**/*.jar", true);
	private readonly subscriptions = new Array<vscode.Disposable>();

	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new JarEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(JarEditorProvider.viewType, provider);
		return providerRegistration;
	}

	private static readonly viewType = 'jar.contentView';

	constructor(
		private readonly context: vscode.ExtensionContext
	) {
		this.subscriptions.push(vscode.workspace.onDidCloseTextDocument(document => {
			this.openDocuments.delete(document.uri.toString());
		}));

		this.subscriptions.push(this.fileSystemWatcher.onDidChange(async uri => {
			const open = this.openDocuments.get(uri.toString());
			if (open) {
				open.webview.html = await this.getHtmlForDocument(open.document);
			}
		}));
	}

	dispose() {
		this.fileSystemWatcher.dispose();
		this.openDocuments.clear();
		this.subscriptions.forEach(subscription => subscription.dispose());
		this.subscriptions.length = 0;
	}

	openCustomDocument(uri: vscode.Uri): JarDocument {
		return new JarDocument(uri);
	}

	async resolveCustomEditor(document: vscode.CustomDocument, webviewPanel: vscode.WebviewPanel) {
		if (document instanceof JarDocument) {
			webviewPanel.webview.options = {
				enableScripts: true,
				localResourceRoots: [
					vscode.Uri.file(path.join(this.context.extensionPath, "out-app"))
				]
			};
			webviewPanel.webview.html = await this.getHtmlForDocument(document);
			webviewPanel.webview.onDidReceiveMessage(
				message => this.handleMessage(message),
				undefined,
				this.context.subscriptions
			);
			this.openDocuments.set(document.uri.toString(), { document, webview: webviewPanel.webview });
		}
	}

	private async handleMessage(message: any) {
		switch (message.command) {
			case model.OPEN_MESSAGE:
				const uri = vscode.Uri.parse(message.uri);
				const document = await vscode.workspace.openTextDocument(uri);
				vscode.window.showTextDocument(document, { preview: true });
				return;
		}
	}

	/**
	 * Get the static html used for the editor webviews.
	 */
	private async getHtmlForDocument(document: JarDocument): Promise<string> {
		// Local path to main script run in the webview
		const reactAppPath = path.join(this.context.extensionPath, "out-app", "jar-viewer.js");
		const reactAppUri = vscode.Uri.file(reactAppPath).with({ scheme: "vscode-resource" });

		const jarContent = await document.readJarContent();
		const jarContentJson = JSON.stringify(jarContent);

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
