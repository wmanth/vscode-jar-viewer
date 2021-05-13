import * as React from 'react';
import { JarContent } from './model';

import './jarview.css';

interface JarViewProps {
	jarContent: JarContent
	vsCodeApi: any
}

export const JarView = (props: JarViewProps) => {
	return <div className="jar-view">
		<ul>
			{ props.jarContent.fileList.map(item => <li>{ item }</li>) }
		</ul>
	</div>;
};
