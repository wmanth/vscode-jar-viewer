import { expect } from 'chai';
import { files } from 'jszip';
import * as model from '../../app/model';
import JarContent from '../../Jar';

function checkNameAndUri(file: model.File | undefined, name: string, uri: string) {
	expect(file?.name, `file name is '${name}'`).equals(name);
	expect(file?.uri, `file uri is '${uri}'`).equals(uri);
}

suite("JarContent", () => {
	test("without content", () => {
		const jarContent = new JarContent([]);
		expect(jarContent.files.length, 'Archive has no files').equals(0);
		expect(jarContent.packages.length, 'Archive has no packages').equals(0);
	});

	test("with file", () => {
		const jarContent = new JarContent(['file.txt']);
		expect(jarContent.files.length, 'Archive has 1 file').equals(1);
		expect(jarContent.packages.length, 'Archive has no packages').equals(0);

		const file = jarContent.files.pop();
		checkNameAndUri(file, 'file.txt', 'jar:/file.txt');
	});

	test("with file in subfolder", () => {
		const jarContent = new JarContent(['foo/bar/file.txt']);
		expect(jarContent.files.length, 'Archive has 1 file').equals(1);
		expect(jarContent.packages.length, 'Archive has no packages').equals(0);

		const foo: unknown = jarContent.files.pop();
		expect(model.isFolder(foo), "'foo' is a folder").true;

		const fooFolder = foo as model.Folder;
		expect(fooFolder.files.length, "'foo' has 1 child").equals(1);
		checkNameAndUri(fooFolder, 'foo', 'jar:/foo');

		const bar = fooFolder.files.pop();
		expect(model.isFolder(foo), "'bar' is a folder").true;

		const barFolder = bar as model.Folder;
		expect(barFolder.files.length, "'bar' has 1 child").equals(1);
		checkNameAndUri(barFolder, 'bar', 'jar:/foo/bar');

		const file = barFolder.files.pop() as model.File;
		expect(model.isFile(file), "'file.txt' is a file").true;
		checkNameAndUri(file, 'file.txt', 'jar:/foo/bar/file.txt');
	});

	test("with Java class in package", () => {
		const jarContent = new JarContent(['net/wmanth/test.class']);
		expect(jarContent.files.length, 'contains no files').equals(0);
		expect(jarContent.packages.length, 'contains 1 package').equals(1);

		const javaPackage = jarContent.packages.pop();
		expect(model.isJavaPackage(javaPackage), "'net.wmanth' is a Java package").true;
		expect(javaPackage?.files.length, "'net.wmanth' contains no files").equals(0);
		expect(javaPackage?.classes.length, "'net.wmanth' contains 1 Java class").equals(1);
		checkNameAndUri(javaPackage, 'net.wmanth', 'jar:/net/wmanth');

		const javaClass = javaPackage!.classes.pop();
		checkNameAndUri(javaClass, 'test.class', 'jar:/net/wmanth/test.class');
	});

	test("with file in subfolder in package", () => {
		const jarContent = new JarContent([
			'net/wmanth/test.class',
			'net/wmanth/etc/config.yaml'
		]);
		expect(jarContent.files.length, 'Archive has no files').equals(0);
		expect(jarContent.packages.length, 'Archive has 1 package').equals(1);

		const packageName = 'net.wmanth';
		const javaPackage = jarContent.packages.pop();
		expect(model.isJavaPackage(javaPackage), `${packageName} is a Java package`).true;
		expect(javaPackage?.files.length, `${packageName} contains 1 file`).equals(1);
		expect(javaPackage?.classes.length, `${packageName} contains 1 class`).equals(1);

		const etc: unknown = javaPackage?.files.pop();
		const etcFolder = etc as model.Folder;
		expect(model.isFolder(etcFolder)).true;
		checkNameAndUri(etcFolder, 'etc', 'jar:/net/wmanth/etc');

		const file = etcFolder.files.pop();
		expect(model.isFile(file)).true;
		checkNameAndUri(file, 'config.yaml', 'jar:/net/wmanth/etc/config.yaml');
	});
});
