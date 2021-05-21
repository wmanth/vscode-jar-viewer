import * as React from 'react';
import { VscChevronDown, VscChevronRight } from 'react-icons/vsc';
import { VscFile, VscFolder, VscFolderOpened, VscPackage, VscSymbolClass } from 'react-icons/vsc';
import * as Model from './model';

import './jarview.css';

enum ItemType { package, class, file, folder }
enum ItemState { empty, collapsed, expanded }

interface TreeItemProps {
	name: string
	type: ItemType
	childs?: TreeItemProps[]
}

const TreeItem = (props: TreeItemProps) => {
	const [state, setState] = React.useState(props.childs?.length ? ItemState.collapsed : ItemState.empty);

	const toggleItemState = () => setState(
		state === ItemState.collapsed ? ItemState.expanded :
		state === ItemState.expanded ? ItemState.collapsed :
		ItemState.empty
	);

	const ToggleIcon = () =>
		state === ItemState.collapsed ? <VscChevronRight className="fold-icon" /> :
		state === ItemState.expanded ? <VscChevronDown className="fold-icon" /> :
		<div className="fold-icon" />;

	const ItemIcon = () =>
		props.type === ItemType.package ? <VscPackage className="type-icon package" /> :
		props.type === ItemType.class ? <VscSymbolClass className="type-icon class" /> :
		props.type === ItemType.file ? <VscFile className="type-icon file" /> :
		state === ItemState.expanded ? <VscFolderOpened className="type-icon folder" /> :
		<VscFolder className="type-icon folder" />;

	return <React.Fragment>
		<li className="list-item" onClick={ toggleItemState }>
			<ToggleIcon /><ItemIcon />
			<span className="item-title">{ props.name }</span>
		</li>
		{ props.childs && state === ItemState.expanded ?
			<TreeViewItemGroup childs={ props.childs } /> :
			<React.Fragment /> }
	</React.Fragment>;
};

interface TreeViewItemGroupProps {
	childs: TreeItemProps[]
}

const TreeViewItemGroup = (props: TreeViewItemGroupProps) =>
	<ul className="tree-list">{ props.childs.map(prop => <TreeItem
		key={ prop.name }
		name={ prop.name }
		type={ prop.type }
		childs={ prop.childs } />) }
	</ul>;


interface JarViewProps {
	jarContent: Model.JarContent
	vsCodeApi: any
}

export const JarView = (props: JarViewProps) =>
	<div className="jar-view">
		<TreeViewItemGroup childs={ [
			...props.jarContent.packages
				.sort(byFileName)
				.map(javaPackageToItemProps),
			...props.jarContent.files
				.sort(byFileName)
				.map(fileToItemProps)
		] } />
	</div>;

class CreateTreeItemProps implements TreeItemProps {
	static fromFile(file: Model.File) {
		return (
			Model.isFolder(file) ? this.fromFolder(file) :
			Model.isJavaClass(file) ? this.fromJavaClass(file) :
			new CreateTreeItemProps(
				file.name,
				ItemType.file)
		);
	}

	static fromFolder(folder: Model.Folder) {
		return (
			Model.isJavaPackage(folder) ? this.fromJavaPackage(folder) :
			new CreateTreeItemProps(
				folder.name,
				ItemType.folder,
				folder.files.sort(byFileName).map(fileToItemProps))
		);
	}

	static fromJavaPackage(javaPackage: Model.JavaPackage) {
		return new CreateTreeItemProps(
			javaPackage.name,
			ItemType.package,
			[...javaPackage.classes.sort(byFileName).map(javaClassToItemProps),
			 ...javaPackage.files.sort(byFileName).map(fileToItemProps)]);
	}

	static fromJavaClass(javaClass: Model.JavaClass) {
		return new CreateTreeItemProps(
			javaClass.name,
			ItemType.class,
			javaClass.nested.sort(byFileName).map(javaClassToItemProps));
	}

	private constructor(
		readonly name: string,
		readonly type: ItemType,
		readonly childs?: TreeItemProps[]) {}
}

const byFileName = (left: Model.File, right: Model.File) => left.name.localeCompare(right.name);
const fileToItemProps = (file: Model.File) => CreateTreeItemProps.fromFile(file);
const javaClassToItemProps = (javaClass: Model.JavaClass) => CreateTreeItemProps.fromJavaClass(javaClass);
const javaPackageToItemProps = (javaPackage: Model.JavaPackage) => CreateTreeItemProps.fromJavaPackage(javaPackage);
