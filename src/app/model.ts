export class JarContent {
	readonly fileList: string[] = [];

	addItem(name: string) {
		this.fileList.push(name);
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
