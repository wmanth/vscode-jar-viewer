import * as vscode from 'vscode';
import * as jszip from 'jszip';
import JarContent from './JarContent';

export default class JarDocument implements vscode.CustomDocument {

	constructor(readonly uri: vscode.Uri) {}

	async readJarContent(): Promise<JarContent> {
		const rawData = await vscode.workspace.fs.readFile(this.uri);
		const zipData = await jszip.loadAsync(rawData);
		const fileList: string[] = [];
		zipData.forEach((_, zipObject) => {
			if (!zipObject.dir) {
				fileList.push(zipObject.name);
			}
		});
		return new JarContent(this.uri, fileList);
	}

	async readFileContent(path: string): Promise<string|undefined> {
		const rawData = await vscode.workspace.fs.readFile(this.uri);
		const zipData = await jszip.loadAsync(rawData);
		const zipObject = zipData.file(path.substring(1)); // remove the leading '/'
		return zipObject?.async('text');
	}

	dispose(): void {}
}
