import * as vscode from 'vscode';
import * as jszip from 'jszip';
import JarContent from './JarContent';
import { split, trim } from './Jar';

export default class JarDocument implements vscode.CustomDocument {
	private static allDocuments = new Map<string, JarDocument>();
	
	private constructor(
		readonly uri: vscode.Uri,
		private zipData: jszip,
		readonly content: JarContent)
	{
		JarDocument.allDocuments.set(uri.path, this);
	}

	static getInstance(uri: vscode.Uri): Promise<JarDocument> | JarDocument {
		return JarDocument.allDocuments.get(uri.path) ?? JarDocument.create(uri);
	}

	static async readContent(uri: vscode.Uri): Promise<string|undefined> {
		const jarSegments = split(uri.path);
		const jarDocument = await JarDocument.getInstance(vscode.Uri.parse(jarSegments.base));
		return jarDocument?.readFileContent(jarSegments.path);
	}

	private static async create(uri: vscode.Uri): Promise<JarDocument> {
		let data: Uint8Array;

		const jarSegments = split(uri.path);
		if (jarSegments.path) {
			const jarDocument = await JarDocument.getInstance(vscode.Uri.file(jarSegments.base));
			if (!jarDocument) { return Promise.reject(); }
			const zipObject = jarDocument.zipData.file(trim(jarSegments.path));
			if (!zipObject) { return Promise.reject(); }
			data = await zipObject.async('uint8array');
		}
		else if (jarSegments.base) {
			data = await vscode.workspace.fs.readFile(uri);
		}
		else {
			return Promise.reject();
		}

		const zipData = await jszip.loadAsync(data);

		const content: string[] = [];
		zipData.forEach((_, object) => {
			if (!object.dir) {
				content.push(object.name);
			}
		});

		return new JarDocument(uri, zipData, new JarContent(uri.path, content));
	}

	async readFileContent(path: string): Promise<string|undefined> {
		const zipObject = this.zipData.file(path.substring(1)); // remove the leading '/'
		return zipObject?.async('text');
	}

	dispose(): void {
		JarDocument.allDocuments.delete(this.uri.path);
	}
}
