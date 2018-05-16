# fullstack-skel-lite
Fullstack App template built from scratch to be clean and lightweight.

## Tech stack
Uses:
  * [Node.js](https://nodejs.org) as server-side runtime.
  * [Webpack](https://webpack.js.org) to build the entire source tree, including network facing services and all App bundles and assets.
  * [Typescript](https://www.typescriptlang.org) for static type checking and transpilation.

## Implementation details
After building the repository with ```npm run build```, the ```build/``` subdirectory will contain the compiled code from the Backend and Frontend services as well as the Frontend Application itself, along with any other files necessary to deploy.

The toplevel ```build/index.js``` is a Node.js script that is used to start both Front and Back-end services, each of which will be spawned in their own processes. Command-line switches are provided to start only one of the components in order to facilitate scenarios like delopyment on cloud platforms.

There is a single toplevel ```package.json``` where stack-wide dependencies are centralized and made visible to both services and the Frontend App. This avoids unnecessary duplication, reduces build times as well as standardizes the tooling among all components.

### ```src/``` subdirectory structure
* ```src/index.ts```: toplevel entry point
* ```src/back/```
	* ```index.ts```: Backend service, entry point
* ```src/front/```
	* ```index.ts```: Frontend service, entry point
* ```src/app/```
	* ```index.ts```: Frontend App, entry point
	* ```assets/*```: App-specific, Webpack-bundled resources
	* ```static/*```: Static content to be served as-is

### ```build/``` subdirectory structure
This is the directory generated from the ```src/``` source directory. Static content is copied as is.

* ```build/index.js```: toplevel entry point, from ```src/index.ts```
* ```build/back/```
	* ```index.js```: Backend service bundle for Node.js
* ```build/front/```
	* ```index.js```: Frontend service bundle for Node.js
	* ```static/```: where Frontend content is served from
		* ```app.js```: Frontend app bundle, from ```src/app```, for Web
		* ```index.html```: Webpack-generated HTML index for App
		* (all else): Copied from ```src/app/static/*```, dir structure is preserved
