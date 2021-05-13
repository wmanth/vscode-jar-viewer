import * as React from 'react';

interface JarViewProps {
	fileList: string[]
}

export const JarView = (props: JarViewProps) => {
	return <React.Fragment>
		<h1>Jar View</h1>
		<ul>
			{ props.fileList.map(item => <li>{ item }</li>) }
		</ul>
	</React.Fragment>;
};
