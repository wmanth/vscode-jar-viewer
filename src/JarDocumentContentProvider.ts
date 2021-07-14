import * as vscode from 'vscode';
import * as jar from './JarContent';
import JarDocument from './JarDocument';

export default class JarDocumentContentProvider implements vscode.TextDocumentContentProvider {

	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new JarDocumentContentProvider(context);
		const providerRegistration = vscode.workspace.registerTextDocumentContentProvider(jar.JAR_CONTENT_SCHEME, provider);
		return providerRegistration;
	}

	private constructor(readonly context: vscode.ExtensionContext) {}

	onDidChange?: vscode.Event<vscode.Uri> | undefined;

	async provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): Promise<string|undefined> {
		const [jarFileUri, contentFilePath] = uri.path.split(jar.JAR_CONTENT_SEPARATOR);
		const jarDocument = new JarDocument(vscode.Uri.parse(jarFileUri));
		return jarDocument.readFileContent(contentFilePath);
	}
}
