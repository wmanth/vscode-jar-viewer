import * as path from 'path';

export class JarContent {
	readonly packages: JavaPackage[] = [];

	private newJavaPackage(name: string) {
		const javaPackage = new JavaPackage(name);
		this.packages.push(javaPackage);
		return javaPackage;
	}

	addItem(pathName: string) {
		if (pathName.endsWith('.class')) {
			const packageName = path.dirname(pathName).replace(/\//g, '.');
			const className = path.basename(pathName);
			const javaPackage = this.packages.find(p => p.name === packageName) || this.newJavaPackage(packageName);
			javaPackage.javaClasses.push(new JavaClass(className));
		}
	}
}

export class FileNode {
	constructor(readonly name: string) {}
}

export class Folder extends FileNode {
	readonly childs: FileNode[] = [];
}


export class JavaClass {
	constructor(readonly name: string) {}
}
export class JavaPackage {
	readonly javaClasses: JavaClass[] = [];
	readonly files: FileNode[] = [];

	constructor(readonly name: string) {}
}
