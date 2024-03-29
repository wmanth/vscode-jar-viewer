import * as vscode from 'vscode';
import JarDocument from './JarDocument';
import { JAR_CONTENT_SCHEME } from './Jar';

export default class JarDocumentContentProvider implements vscode.TextDocumentContentProvider {

	private readonly openDocumentURIs = new Set<vscode.Uri>();
	private readonly onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
	private readonly fileSystemWatcher = vscode.workspace.createFileSystemWatcher("**/*.jar", true);
	private readonly subscriptions = new Array<vscode.Disposable>();

	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new JarDocumentContentProvider(context);
		const providerRegistration = vscode.workspace.registerTextDocumentContentProvider(JAR_CONTENT_SCHEME, provider);
		return providerRegistration;
	}

	private constructor(_context: vscode.ExtensionContext) {
		this.subscriptions.push(vscode.workspace.onDidCloseTextDocument(document => {
			this.openDocumentURIs.delete(document.uri);
		}));

		this.subscriptions.push(this.fileSystemWatcher.onDidChange(jarURI => {
			this.openDocumentURIs.forEach(documentURI => {
				const contentURI = vscode.Uri.parse(documentURI.path);
				if (contentURI.path.startsWith(jarURI.path)) {
					this.onDidChangeEmitter.fire(documentURI);
				}
			});
		}));
	}

	dispose() {
		this.onDidChangeEmitter.dispose();
		this.fileSystemWatcher.dispose();
		this.openDocumentURIs.clear();
		this.subscriptions.forEach(subscription => subscription.dispose);
		this.subscriptions.length = 0;
	}

	get onDidChange() {
		return this.onDidChangeEmitter.event;
	}

	async provideTextDocumentContent(uri: vscode.Uri): Promise<string|undefined> {
		this.openDocumentURIs.add(uri);
		return JarDocument.readContent(uri);
	}
}
