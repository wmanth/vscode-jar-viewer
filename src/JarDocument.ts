import * as vscode from 'vscode';
import * as jszip from 'jszip';
import JarContent from './JarContent';

export default class JarDocument implements vscode.CustomDocument {
	private static openDocuments = new Map<string, JarDocument>();
	
	private constructor(
		readonly uri: vscode.Uri,
		private zip: jszip,
		readonly content: JarContent)
	{
		JarDocument.openDocuments.set(uri.toString(), this);
	}

	static getInstance(uri: vscode.Uri): Promise<JarDocument> | JarDocument {
		return JarDocument.openDocuments.get(uri.toString()) ?? JarDocument.createAsync(uri);
	}

	private static async createAsync(uri: vscode.Uri): Promise<JarDocument> {
		const data = await vscode.workspace.fs.readFile(uri);
		const zip = await jszip.loadAsync(data);

		const content: string[] = [];
		zip.forEach((_, object) => {
			if (!object.dir) {
				content.push(object.name);
			}
		});

		return new JarDocument(uri, zip, new JarContent(uri, content));
	}

	async readFileContent(path: string): Promise<string|undefined> {
		const zipObject = this.zip.file(path.substring(1)); // remove the leading '/'
		return zipObject?.async('text');
	}

	dispose(): void {
		JarDocument.openDocuments.delete(this.uri.toString());
	}
}
