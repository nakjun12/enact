# @enact/ui [![npm (scoped)](https://img.shields.io/npm/v/@enact/ui.svg?style=flat-square)](https://www.npmjs.com/package/@enact/ui)

> A set of reusable behaviors and a library of unstyled components for creating Enact themes.

This library contains a set of unstyled components as well as a number of Higher Order Components (HOCs) that implement various usage patterns and behaviors (`Pickable`, `Pressable`, etc.).

## Example

One of the components supplied is `Repeater`. A repeater stamps out copies of a component (the `childComponent` prop) using the elements of an array provided as its `children`:
```
import kind from '@enact/core/kind';
import Repeater from '@enact/ui/Repeater';

const MyApp = kind({
	name: 'MyApp',
	render: () => (
		<Repeater childComponent="div">
			{['One', 'Two', 'Three']}
		</Repeater>
	)
});

export default MyApp;
```

See the documentation for each component for more information.

## Install

```
npm install --save @enact/ui
```

## Copyright and License Information

Unless otherwise specified, all content, including all source code files and documentation files in this repository are:

Copyright (c) 2012-2023 LG Electronics

Unless otherwise specified or set forth in the NOTICE file, all content, including all source code files and documentation files in this repository are: Licensed under the Apache License, Version 2.0 (the "License"); you may not use this content except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
