import * as react from 'react';
import * as icons from 'react-icons/vsc';
import * as model from './model';

import './jarview.css';

interface JarViewContext {
	expandedItems: Set<string>
	onDidSelectItem: (itemProps: TreeItemProps) => void
}

const jarViewContext = react.createContext<JarViewContext>({
	expandedItems: new Set(),
	onDidSelectItem: undefined
});

enum ItemType { package, class, file, folder }
enum ItemState { empty, collapsed, expanded }

interface TreeItemProps {
	name: string
	uri: string
	type: ItemType
	childs?: TreeItemProps[]
}

const TreeItem = (props: TreeItemProps) => {
	const context = react.useContext(jarViewContext);

	const getItemState = () =>
		props.childs?.length ?
			context.expandedItems.has(props.uri) ?
				ItemState.expanded :
				ItemState.collapsed :
			ItemState.empty;

	const [state, setState] = react.useState(getItemState());

	react.useEffect(() => setState(getItemState()),
		[context.expandedItems, props.uri]);

	const handleClick = () => context.onDidSelectItem(props);

	const ToggleIcon = () =>
		state === ItemState.collapsed ? <icons.VscChevronRight className="fold-icon" /> :
		state === ItemState.expanded ? <icons.VscChevronDown className="fold-icon" /> :
		<div className="fold-icon" />;

	const ItemIcon = () =>
		props.type === ItemType.package ? <icons.VscPackage className="type-icon package" /> :
		props.type === ItemType.class ? <icons.VscSymbolClass className="type-icon class" /> :
		props.type === ItemType.file ? <icons.VscFile className="type-icon file" /> :
		state === ItemState.expanded ? <icons.VscFolderOpened className="type-icon folder" /> :
		<icons.VscFolder className="type-icon folder" />;

	return <react.Fragment>
		<li className="list-item" onClick={ handleClick }>
			<ToggleIcon /><ItemIcon />
			<span className="item-title">{ props.name }</span>
		</li>
		{ props.childs && state === ItemState.expanded ?
			<TreeViewItemGroup childs={ props.childs } /> :
			<react.Fragment /> }
	</react.Fragment>;
};

interface TreeViewItemGroupProps {
	childs: TreeItemProps[]
}

const TreeViewItemGroup = (props: TreeViewItemGroupProps) =>
	<ul className="tree-list">{ props.childs.map(itemProps => <TreeItem
		key={ itemProps.name }
		name={ itemProps.name }
		uri={ itemProps.uri }
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
    postMessage(message: any): void;
}

interface JarViewProps {
	jarContent: model.JarContent
	vsCodeApi: VSCodeAPI
}

export const JarView = (props: JarViewProps) => {
	const lastState = props.vsCodeApi.getState();
	const [expandedItems, setExpandedItems] = react.useState(new Set(lastState?.expandedItems));
	const [topPosition, setTopPosition] = react.useState(lastState?.topPosition);

	const handleDidSelectItem = (itemProps: TreeItemProps) => {
		switch (itemProps.type) {
			case ItemType.folder:
			case ItemType.package:
				expandedItems.has(itemProps.uri) ?
					expandedItems.delete(itemProps.uri) :
					expandedItems.add(itemProps.uri);
				setExpandedItems(new Set(expandedItems));
				break;

			case ItemType.file:
				props.vsCodeApi.postMessage({ command: model.OPEN_MESSAGE, uri: itemProps.uri });
				break;

			default:
				break;
		}
	};

	window.onscroll = () => {
		setTopPosition(window.scrollY);
	};

	react.useEffect(() => {
		// scroll to the last top position after mounting the widget
		window.scroll({ top: topPosition });
	}, []);

	react.useEffect(() => {
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
		readonly uri: string,
		readonly type: ItemType,
		readonly childs?: TreeItemProps[]) {}

	static fromFile(file: model.File) {
		return (
			model.isFolder(file) ? this.fromFolder(file) :
			model.isJavaClass(file) ? this.fromJavaClass(file) :
			new CreateTreeItemProps(
				file.name,
				file.uri,
				ItemType.file)
		);
	}

	static fromFolder(folder: model.Folder) {
		return (
			model.isJavaPackage(folder) ? this.fromJavaPackage(folder) :
			new CreateTreeItemProps(
				folder.name,
				folder.uri,
				ItemType.folder,
				folder.files.sort(byFileName).map(fileToItemProps))
		);
	}

	static fromJavaPackage(javaPackage: model.JavaPackage) {
		return new CreateTreeItemProps(
			javaPackage.name,
			javaPackage.uri,
			ItemType.package,
			[...javaPackage.classes.sort(byFileName).map(javaClassToItemProps),
			 ...javaPackage.files.sort(byFileName).map(fileToItemProps)]);
	}

	static fromJavaClass(javaClass: model.JavaClass) {
		return new CreateTreeItemProps(
			javaClass.name,
			javaClass.uri,
			ItemType.class,
			javaClass.nested.sort(byFileName).map(javaClassToItemProps));
	}
}

const byFileName = (left: model.File, right: model.File) => left.name.localeCompare(right.name);
const fileToItemProps = (file: model.File) => CreateTreeItemProps.fromFile(file);
const javaClassToItemProps = (javaClass: model.JavaClass) => CreateTreeItemProps.fromJavaClass(javaClass);
const javaPackageToItemProps = (javaPackage: model.JavaPackage) => CreateTreeItemProps.fromJavaPackage(javaPackage);
