import * as vscode from 'vscode';
import * as JSZip from 'jszip';

type FileList = Map<string, JSZip.JSZipObject>;

class JarDocument implements vscode.CustomDocument {

	static async create(uri: vscode.Uri): Promise<JarDocument> {
		const fileData = await JarDocument.readFile(uri);
		return new JarDocument(uri, fileData);
	}

	private static async readFile(uri: vscode.Uri): Promise<FileList> {
		const rawData = await vscode.workspace.fs.readFile(uri);
		const zipData = await JSZip.loadAsync(rawData);
		const files = new Map<string, JSZip.JSZipObject>();
		zipData.forEach((relativePath, file) => {
			files.set(relativePath, file);
		});
		return files;
	}

	private constructor(
		readonly uri: vscode.Uri,
		readonly fileList: FileList) {}

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

	async resolveCustomEditor(
		document: vscode.CustomDocument,
		webviewPanel: vscode.WebviewPanel,
		token: vscode.CancellationToken)
	: Promise<void> {

		webviewPanel.webview.options = {
			enableScripts: true,
		};
		if (document instanceof JarDocument) {
			webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document);
		}
	}

	/**
	 * Get the static html used for the editor webviews.
	 */
	private getHtmlForWebview(webview: vscode.Webview, document: JarDocument): string {
		var list = "";
		document.fileList.forEach((file, path) => list += `<li>${path}</li>`);
		return /* html */`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<title>Jar Viewer</title>
			</head>
			<body>
				<ul>${list}</ul>
			</body>
			</html>`;
	}

}
