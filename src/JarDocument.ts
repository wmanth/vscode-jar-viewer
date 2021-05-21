import * as vscode from 'vscode';
import * as path from 'path';
import * as JSZip from 'jszip';
import * as Model from './app/model';

const PATH_SEPARATOR = '/';

class File implements Model.File {
	constructor(readonly name: string) {}
}

class Folder extends File implements Model.Folder {
	readonly files: File[] = [];

	newFolder(name: string) {
		const folder = new Folder(name);
		this.files.push(folder);
		return folder;
	}

	addFile(filePath: string) {
		const fileName = path.basename(filePath);
		const filePathSegments = path.dirname(filePath).split(PATH_SEPARATOR);
		const pathSegment = filePathSegments.shift();

		if (pathSegment && pathSegment !== '.') {
			const found = this.files.find(file => file.name === pathSegment);
			const folder = (found instanceof Folder) ? found : this.newFolder(pathSegment);
			folder.addFile(path.join(...filePathSegments, fileName));
		}
		else {
			this.files.push(new File(fileName));
		}
	}
}

class JavaClass extends File implements Model.JavaClass {
	readonly nested: JavaClass[] = [];
}

class JavaPackage extends Folder implements Model.JavaPackage {
	readonly classes: JavaClass[] = [];
}

class JarContent extends Folder implements Model.JarContent {
	readonly packages: JavaPackage[] = [];

	private packageNamed(name: string) {
		return this.packages.find(pck => pck.name === name);
	}

	constructor(fileList: string[]) {
		super("jar");

		fileList
			.filter(path => path.endsWith('.class'))
			.forEach(path => this.addClass(path));

		fileList
			.filter(path => !path.endsWith('.class'))
			.forEach(path => this.addFile(path));
	}

	private addClass(pathName: string) {
		const packageName = path.dirname(pathName).replace(/\//g, '.');
		const className = path.basename(pathName);
		const javaPackage =
			this.packages.find(p => p.name === packageName) ||
			this.newJavaPackage(packageName);
		javaPackage.classes.push(new JavaClass(className));
	}

	addFile(filePath: string) {
		// check if the file path has a Java package as its base
		const packageName = filePath
			.split(PATH_SEPARATOR)
			.map((_, index, array) => array.slice(0, index+1).join('.'))
			.reduceRight((acc, current) => acc.length ? acc : this.packageNamed(current) ? current : '', '');

		if (packageName) {
			const relativePath = path.relative(packageName.replace(/\./g, PATH_SEPARATOR), filePath);
			this.packageNamed(packageName)?.addFile(relativePath);
		}
		else {
			super.addFile(filePath);
		}
	}

	private newJavaPackage(name: string) {
		const javaPackage = new JavaPackage(name);
		this.packages.push(javaPackage);
		return javaPackage;
	}
}

export default class JarDocument implements vscode.CustomDocument {

	static async create(uri: vscode.Uri): Promise<JarDocument> {
		const fileList = await JarDocument.readFile(uri);
		return new JarDocument(uri, fileList);
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
