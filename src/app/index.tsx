import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { JarView } from './jarview';
import { JarContent } from './model';

import './index.css';

declare global {
	interface Window {
		acquireVsCodeApi(): any;
		jarContent: JarContent;
	}
}

const vsCodeApi = window.acquireVsCodeApi();

ReactDOM.render(
	<JarView jarContent={ window.jarContent } vsCodeApi={ vsCodeApi }/>,
	document.getElementById('root')
);
