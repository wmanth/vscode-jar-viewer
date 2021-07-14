import * as reactDOM from 'react-dom';
import { JarView } from './jarview';
import { JarContent } from './model';

import './index.css';

declare global {
	interface Window {
		acquireVsCodeApi(): any;
		jarContent: JarContent;
	}
}

reactDOM.render(
	<JarView
		jarContent={ window.jarContent }
		vsCodeApi={ window.acquireVsCodeApi() }/>,
	document.getElementById('root')
);
