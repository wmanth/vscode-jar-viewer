import * as path from 'path';
import * as Model from './app/model';
import * as Jar from './Jar';

class File implements Model.File {
	constructor(readonly name: string, readonly uri: string) {}
}

class Folder extends File implements Model.Folder {
	readonly files: File[] = [];

	newFolder(name: string): Folder {
		const folder = new Folder(name, path.join(this.uri, name));
		this.files.push(folder);
		return folder;
	}

	addFile(filePath: string): File {
		const fileName = path.basename(filePath);
		const filePathSegments = path.dirname(filePath).split(Jar.PATH_SEPARATOR);
		const firstPathSegment = filePathSegments.shift();

		if (firstPathSegment && firstPathSegment !== '.') {
			const found = this.files.find(file => file.name === firstPathSegment);
			const folder = (found instanceof Folder) ? found : this.newFolder(firstPathSegment);
			return folder.addFile(path.join(...filePathSegments, fileName));
		}
		else {
			const file = new File(fileName, path.join(this.uri, fileName));
			this.files.push(file);
			return file;
		}
	}
}

class JavaClass extends File implements Model.JavaClass {
	readonly nested: JavaClass[] = [];
}

class JavaPackage extends Folder implements Model.JavaPackage {
	readonly classes: JavaClass[] = [];
}

export default class JarContent extends Folder implements Model.JarContent {

	readonly packages: JavaPackage[] = [];

	private packageNamed(name: string) {
		return this.packages.find(pck => pck.name === name);
	}

	constructor(path: string, fileList: string[]) {
		super('content', `${Jar.JAR_CONTENT_SCHEME}:${path}${Jar.JAR_CONTENT_SEPARATOR}`);

		fileList
			.filter(path => path.endsWith('.class'))
			.forEach(path => this.addClass(path));

		fileList
			.filter(path => !path.endsWith('.class'))
			.forEach(path => this.addFile(path));
	}

	private addClass(pathName: string) {
		const packageName = path.dirname(pathName).replace(/\//g, Jar.PACKAGE_SEPARATOR);
		const className = path.basename(pathName);
		const javaPackage = this.packageNamed(packageName) || this.newJavaPackage(packageName);
		javaPackage.classes.push(new JavaClass(className, path.join(javaPackage.uri, className)));
	}

	override addFile(filePath: string): File {
		// check if the file path has a Java package as its base
		const packageName = filePath
			.split(Jar.PATH_SEPARATOR)
			.map((_, index, array) => array.slice(0, index+1).join(Jar.PACKAGE_SEPARATOR))
			.reduceRight((acc, current) => acc.length ? acc : this.packageNamed(current) ? current : '', '');

		const javaPackage = this.packageNamed(packageName);

		if (javaPackage) {
			const relativePath = path.relative(javaPackage.name.replace(/\./g, Jar.PATH_SEPARATOR), filePath);
			return javaPackage.addFile(relativePath);
		}
		else {
			return super.addFile(filePath);
		}
	}

	private newJavaPackage(name: string) {
		const javaPackage = new JavaPackage(name, path.join(this.uri, name.replace(/\./g, Jar.PATH_SEPARATOR)));
		this.packages.push(javaPackage);
		return javaPackage;
	}
}
