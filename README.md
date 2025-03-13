# GrapesJS TailwindCSS Plugin

The **GrapesJS TailwindCSS Plugin** seamlessly integrates Tailwind CSS 4 with GrapesJS, enabling you to leverage a modern CSS framework directly within your page builder. With on-the-fly CSS building, this plugin provides up-to-date styles and exports the compiled CSS with your project.

**Key Features:**

- **Tailwind CSS 4 Integration:** Utilize the latest version of Tailwind CSS.
- **Dynamic CSS Build:** Automatically compiles Tailwind CSS based on your project's classes.
- **Export Ready:** The compiled CSS is appended to your export, ensuring consistency.
- **Multi Page Support:** The plugin makes use of the [PageManager](https://grapesjs.com/docs/modules/Pages.html)

[DEMO](https://codesandbox.io/p/sandbox/grapesjs-tailwindcss-4-plugin-demo-d24p68)

<p align="center">
:star: Star me on GitHub — it motivates me a lot!
</p>

## Installation

### CDN

```html
<script src="https://unpkg.com/grapesjs-tailwindcss-plugin"></script>
```

### NPM

```sh
npm i grapesjs-tailwindcss-plugin
```

### GIT

```sh
git clone https://github.com/fasenderos/grapesjs-tailwindcss-plugin.git
```

## Usage

### Directly in the Browser

```html
<link
  href="https://unpkg.com/grapesjs/dist/css/grapes.min.css"
  rel="stylesheet"
/>
<script src="https://unpkg.com/grapesjs"></script>
<script src="path/to/grapesjs-tailwindcss-plugin.min.js"></script>

<div id="gjs"></div>

<script type="text/javascript">
  var editor = grapesjs.init({
    container: "#gjs",
    // ... other configurations
    plugins: ["grapesjs-tailwindcss-plugin"],
    pluginsOpts: {
      "grapesjs-tailwindcss-plugin": {
        // Options like autobuild, toolbarPanel, notificationCallback, buildButton, etc.
      },
    },
  });
</script>
```

### Modern Javascript

```js
import grapesjs from "grapesjs";
import plugin from "grapesjs-tailwindcss-plugin";
import "grapesjs/dist/css/grapes.min.css";

const editor = grapesjs.init({
  container: "#gjs",
  // ... other configurations
  plugins: [plugin],
  pluginsOpts: {
    [plugin]: {
      // Options like autobuild, toolbarPanel, notificationCallback, buildButton, etc.
    },
  },
  // Alternatively:
  // plugins: [
  //   editor => plugin(editor, { /* options */ }),
  // ],
});
```

## Summary

- Plugin name: `grapesjs-tailwindcss-plugin`
- Commands: `build-tailwind`
- Button: `build-tailwind-button`

## Options

| Option                 | Description                                                                                                                                                             | Default      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `prefix`               | Prefix to use for Tailwind CSS classes. Helps differentiate Tailwind classes from others.                                                                               | `tw`         |
| `autobuild`            | If `true`, the plugin automatically rebuilds Tailwind CSS on each update. Set to false for manual builds.                                                               | `true`       |
| `customCss`            | A custom css that will be appended immediately after the `@import 'tailwindcss';` statement. [See the tailwind docs for more info](https://tailwindcss.com/docs/theme). | `""`         |
| `buildButton`          | Option to add a manual build button to the toolbar for triggering the CSS build process.                                                                                | `false`      |
| `toolbarPanel`         | Specify the panel where the build button should be added (e.g., `options`).                                                                                             | `options`    |
| `notificationCallback` | A custom callback function to handle notifications when Tailwind CSS is compiled.                                                                                       | `() => void` |

## Development

Clone the repository

```sh
$ git clone https://github.com/fasenderos/grapesjs-tailwindcss-plugin.git
$ cd grapesjs-tailwindcss-plugin
```

Install dependencies

```sh
$ npm i
```

Start the dev server

```sh
$ npm start
```

Build the source

```sh
$ npm run build
```

## License

Copyright [Andrea Fassina](https://github.com/fasenderos), Licensed under [MIT](LICENSE).
