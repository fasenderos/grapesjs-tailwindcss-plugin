import grapesjs, { type Editor } from "grapesjs";
import { beforeEach, afterEach } from "node:test";
import plugin, { type TailwindPluginOptions } from "../src/index";

let editor: Editor | null = null;

export function setupEditor(pluginOpts?: TailwindPluginOptions) {
  beforeEach(() => {
    editor = grapesjs.init({
      container: "#gjs",
      plugins: [plugin],
      ...(pluginOpts && {
        pluginsOpts: {
          "grapesjs-tailwind-plugin": pluginOpts,
        },
      }),
    });
  });

  afterEach(() => {
    if (editor) {
      editor.destroy();
      editor = null;
    }
  });

  return {
    getEditor: () => {
      if (!editor) {
        throw new Error(
          "Editor not initialized. Please be sure to call setupEditor() before running tests."
        );
      }
      return editor;
    },
  };
}
