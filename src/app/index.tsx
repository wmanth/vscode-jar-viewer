import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { JarView } from './jarview';

import './index.css';

declare global {
	interface Window {
		acquireVsCodeApi(): any;
		jarContent: string[];
	}
}

//const vscode = window.acquireVsCodeApi();

ReactDOM.render(
	<JarView fileList={ window.jarContent }/>,
	document.getElementById('root')
);
