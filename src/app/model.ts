export interface File {
	readonly name: string;
	readonly path: string;
}

export interface Folder extends File {
	readonly files: File[];
}

export interface JavaClass extends File {
	readonly nested: JavaClass[];
}

export interface JavaPackage extends Folder {
	readonly classes: JavaClass[];
}

export interface JarContent extends Folder {
	readonly packages: JavaPackage[];
}

export function isFile(object: any): object is File {
	return object.hasOwnProperty('name') && object.hasOwnProperty('path');
}

export function isFolder(object: any): object is Folder {
	return isFile(object) && object.hasOwnProperty('files');
}

export function isJavaClass(object: any): object is JavaClass {
	return isFile(object) && object.hasOwnProperty('nested');
}

export function isJavaPackage(object: any): object is JavaPackage {
	return isFolder(object) && object.hasOwnProperty('classes');
}
