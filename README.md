# gameCanvas.js

gc.js or gameCanvas.js is a lightweight javascript library. The library is built on the Canvas API and makes it a lot easier to create and draw to the HTML Canvas.

Website: [https://aaserver.net/libraries/gameCanvas](https://aaserver.net/libraries/gameCanvas)

## Usage
Use the latest version by adding a script tag to your html:
```html
<script src="./dist/gameCanvas-latest.min.js"></script>
```
Create an instance of the `GameCanvas` constructor and use global methods to draw:
```html
<script src="./dist/gameCanvas-latest.min.js"></script>
<script>

  const gc = new GameCanvas();
  circle(100, 100, 50, "red");

</script>
```
Note: Do not construct multiple instances of `GameCanvas` as the global methods will clash.

### Use in module
GameCanvas can be used inside modules by importing the source module:
```js
import GameCanvas from "./src/gameCanvas-5.0.js";

const gc = new GameCanvas();
circle(100, 100, 50, "red");
```
Note: It is not possible to import the latest version of source scripts, you have to specify the version.

## Examples
Run the examples by cloning the repo and starting a Live Server in the root directory of the repo. Open `http://localhost:5500/examples/basic usage` in your browser.

## Build from source
Build the source modules inside `src` with:
```console
npm install
npm run build
```