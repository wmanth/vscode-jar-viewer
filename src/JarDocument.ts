import * as vscode from 'vscode';
import * as JSZip from 'jszip';
import JarContent from './Jar';

export default class JarDocument implements vscode.CustomDocument {

	static async create(uri: vscode.Uri): Promise<JarDocument> {
		const jarContent = await JarDocument.readFile(uri);
		return new JarDocument(uri, jarContent);
	}

	private static async readFile(uri: vscode.Uri): Promise<JarContent> {
		const rawData = await vscode.workspace.fs.readFile(uri);
		const zipData = await JSZip.loadAsync(rawData);
		const fileList: string[] = [];
		zipData.forEach((_, zipObject) => {
			if (!zipObject.dir) {
				fileList.push(zipObject.name);
			}
		});
		return new JarContent(fileList);
	}

	private constructor(
		readonly uri: vscode.Uri,
		readonly content: JarContent) {}

	dispose(): void {}
}
