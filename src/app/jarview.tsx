import * as React from 'react';
import { VscChevronDown, VscChevronRight } from 'react-icons/vsc';
import { VscFile, VscFolder, VscFolderOpened, VscPackage, VscSymbolClass } from 'react-icons/vsc';
import { JarContent, JavaClass, JavaPackage } from './model';

import './jarview.css';

enum ItemType { package, class, file, folder }
enum ItemState { empty, collapsed, expanded }

interface TreeItemProps {
	name: string
	type: ItemType
	childs?: TreeItemProps[]
}

const TreeItem = (props: TreeItemProps) => {
	const [state, setState] = React.useState(props.childs ? ItemState.collapsed : ItemState.empty);

	const toggleItemState = () => setState(
		state === ItemState.collapsed ? ItemState.expanded :
		state === ItemState.expanded ? ItemState.collapsed :
		ItemState.empty
	);

	const ToggleIcon = () =>
		state === ItemState.collapsed ? <VscChevronRight className="toggle-icon" /> :
		state === ItemState.expanded ? <VscChevronDown className="toggle-icon" /> :
		<div className="toggle-icon" />;

	const ItemIcon = () =>
		props.type === ItemType.package ? <VscPackage className="icon-package" /> :
		props.type === ItemType.class ? <VscSymbolClass className="icon-class" /> :
		props.type === ItemType.file ? <VscFile className="icon-file" /> :
		state === ItemState.expanded ? <VscFolderOpened className="icon-folder" /> :
		<VscFolder className="icon-folder" />;

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
	jarContent: JarContent
	vsCodeApi: any
}

export const JarView = (props: JarViewProps) => {
	const treeItemProps = props.jarContent.packages.map(pck => CreateTreeItemProps.fromJavaPackage(pck));

	return <div className="jar-view">
		<TreeViewItemGroup childs={ treeItemProps } />
	</div>;
};

class CreateTreeItemProps implements TreeItemProps {
	static fromJavaPackage(javaPackage: JavaPackage) {
		return new CreateTreeItemProps(
			javaPackage.name,
			ItemType.package,
			javaPackage.javaClasses.map(cls => CreateTreeItemProps.fromJavaClass(cls)));
	}

	static fromJavaClass(javaClass: JavaClass) {
		return new CreateTreeItemProps(
			javaClass.name,
			ItemType.class);
	}

	private constructor(
		readonly name: string,
		readonly type: ItemType,
		readonly childs?: TreeItemProps[]) {}
}
