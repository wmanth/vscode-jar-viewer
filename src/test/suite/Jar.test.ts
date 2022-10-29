import { expect } from 'chai';
import * as Jar from '../../Jar';

suite("Jar.trim", () => {
	test("trim none", () => {
		expect(Jar.trim('folder/file.ext')).equals('folder/file.ext');
	});

	test("trim single", () => {
		expect(Jar.trim('/folder/file.ext')).equals('folder/file.ext');
	});

	test("trim double", () => {
		expect(Jar.trim('//folder/file.ext')).equals('folder/file.ext');
	});
});

suite("Jar.split", () => {
	test("split none", () => {
		const test = Jar.split("file:/folder/file.ext");
		expect(test.base).equals("file:/folder/file.ext");
		expect(test.path).equals("");
	});

	test("split single", () => {
		const test = Jar.split("jar:/folder/archive.jar!/path/file.ext");
		expect(test.base).equals("jar:/folder/archive.jar");
		expect(test.path).equals("/path/file.ext");
	});

	test("split multiple", () => {
		const test = Jar.split("jar:/folder/outer.jar!/inner.jar!/path/file.ext");
		expect(test.base).equals("jar:/folder/outer.jar!/inner.jar");
		expect(test.path).equals("/path/file.ext");
	});
});
