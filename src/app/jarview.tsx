import * as React from 'react';
import { VscChevronDown, VscChevronRight } from 'react-icons/vsc';
import { VscFile, VscFolder, VscFolderOpened, VscPackage, VscSymbolClass } from 'react-icons/vsc';
import * as Model from './model';

import './jarview.css';

interface JarViewContext {
	expandedItems: Set<string>
	onDidSelectItem: (path: string) => void
}

const jarViewContext = React.createContext<JarViewContext>({
	expandedItems: new Set(),
	onDidSelectItem: undefined
});

enum ItemType { package, class, file, folder }
enum ItemState { empty, collapsed, expanded }

interface TreeItemProps {
	name: string
	path: string
	type: ItemType
	childs?: TreeItemProps[]
}

const TreeItem = (props: TreeItemProps) => {
	const context = React.useContext(jarViewContext);

	const getItemState = () =>
		props.childs?.length ?
			context.expandedItems.has(props.path) ?
				ItemState.expanded :
				ItemState.collapsed :
			ItemState.empty;

	const [state, setState] = React.useState(getItemState());

	React.useEffect(() => setState(getItemState()),
		[context.expandedItems, props.path]);

	const handleClick = () => context.onDidSelectItem(props.path);

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
		<li className="list-item" onClick={ handleClick }>
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
	<ul className="tree-list">{ props.childs.map(itemProps => <TreeItem
		key={ itemProps.name }
		name={ itemProps.name }
		path={ itemProps.path }
		type={ itemProps.type }
		childs={ itemProps.childs } />) }
	</ul>;

interface JarViewerState {
	expandedItems: string[]
	topPosition: number
}

interface VSCodeAPI {
	getState(): JarViewerState
	setState(state: JarViewerState): void
}

interface JarViewProps {
	jarContent: Model.JarContent
	vsCodeApi: VSCodeAPI
}

export const JarView = (props: JarViewProps) => {
	const lastState = props.vsCodeApi.getState();
	const [expandedItems, setExpandedItems] = React.useState(new Set(lastState?.expandedItems));
	const [topPosition, setTopPosition] = React.useState(lastState?.topPosition);

	const handleDidSelectItem = (path: string) => {
		expandedItems.has(path) ?
			expandedItems.delete(path) :
			expandedItems.add(path);
		setExpandedItems(new Set(expandedItems));
	};

	window.onscroll = () => {
		setTopPosition(window.scrollY);
	};

	React.useEffect(() => {
		// scroll to the last top position after mounting the widget
		window.scroll({ top: topPosition });
	}, []);

	React.useEffect(() => {
		// persist the view state after any state change
		props.vsCodeApi.setState({
			expandedItems: Array.from(expandedItems),
			topPosition: topPosition
		});
	}, [expandedItems, topPosition]);

	return (
		<jarViewContext.Provider value= {
			{ expandedItems: expandedItems, onDidSelectItem: handleDidSelectItem }
		}>
			<div className="jar-view">
				<TreeViewItemGroup childs={ [
					...props.jarContent.packages
						.sort(byFileName)
						.map(javaPackageToItemProps),
					...props.jarContent.files
						.sort(byFileName)
						.map(fileToItemProps)
				] } />
			</div>
		</jarViewContext.Provider>
	);
};

class CreateTreeItemProps implements TreeItemProps {

	private constructor(
		readonly name: string,
		readonly path: string,
		readonly type: ItemType,
		readonly childs?: TreeItemProps[]) {}

	static fromFile(file: Model.File) {
		return (
			Model.isFolder(file) ? this.fromFolder(file) :
			Model.isJavaClass(file) ? this.fromJavaClass(file) :
			new CreateTreeItemProps(
				file.name,
				file.path,
				ItemType.file)
		);
	}

	static fromFolder(folder: Model.Folder) {
		return (
			Model.isJavaPackage(folder) ? this.fromJavaPackage(folder) :
			new CreateTreeItemProps(
				folder.name,
				folder.path,
				ItemType.folder,
				folder.files.sort(byFileName).map(fileToItemProps))
		);
	}

	static fromJavaPackage(javaPackage: Model.JavaPackage) {
		return new CreateTreeItemProps(
			javaPackage.name,
			javaPackage.path,
			ItemType.package,
			[...javaPackage.classes.sort(byFileName).map(javaClassToItemProps),
			 ...javaPackage.files.sort(byFileName).map(fileToItemProps)]);
	}

	static fromJavaClass(javaClass: Model.JavaClass) {
		return new CreateTreeItemProps(
			javaClass.name,
			javaClass.path,
			ItemType.class,
			javaClass.nested.sort(byFileName).map(javaClassToItemProps));
	}
}

const byFileName = (left: Model.File, right: Model.File) => left.name.localeCompare(right.name);
const fileToItemProps = (file: Model.File) => CreateTreeItemProps.fromFile(file);
const javaClassToItemProps = (javaClass: Model.JavaClass) => CreateTreeItemProps.fromJavaClass(javaClass);
const javaPackageToItemProps = (javaPackage: Model.JavaPackage) => CreateTreeItemProps.fromJavaPackage(javaPackage);
