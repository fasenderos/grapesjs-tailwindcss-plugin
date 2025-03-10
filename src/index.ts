import type { Component, Editor } from "grapesjs";
// @ts-ignore
import * as tailwindcss from "tailwindcss";
import * as assets from "./assets";
import type { WorkerMessageData, WorkerResponse } from "./worker";

export type TailwindPluginOptions = {
  /**
   * The prefix to use for Tailwind CSS classes.
   * This helps differentiate Tailwind classes from other CSS classes.
   * @default "tw"
   */
  prefix?: string;
  /**
   * If true, the plugin will automatically rebuild the Tailwind CSS on each update.
   * Set to false to disable auto-building and trigger builds manually.
   * @default true
   */
  autobuild?: boolean;
  /**
   * This option allows you to append your own Tailwind CSS code immediately after the "@import 'tailwindcss';" statement.
   * This means you can add any custom directives, such as "@layer components { ... }" or even "@theme { ... }"
   * to further extend or override the default styles.
   *
   * @see https://tailwindcss.com/docs/theme for more detailes on how customize theme variables.
   * @see https://tailwindcss.com/docs/adding-custom-styles for more details on how to customize your Tailwind CSS.
   * @default null
   */
  customCss?: string | null;
  /**
   * Option to add a build button to the toolbar.
   * When set to true, a button will be added that allows manual triggering of the Tailwind CSS build process.
   * @default false
   */
  buildButton?: boolean;
  /**
   * Specifies which panel the build button should be added to
   * @default "options"
   */
  toolbarPanel?: string;
  /**
   * Define a custom function to handle notifications when the Tailwind CSS is compiled
   * with the `build-tailwind` command
   * @default () => void
   */
  notificationCallback?: () => void;
};

export default (editor: Editor, opts: TailwindPluginOptions = {}) => {
  // Merge default options with user-provided options
  const options: Required<TailwindPluginOptions> = {
    ...{
      i18n: {},
      // default options
      autobuild: true,
      buildButton: false,
      customCss: null,
      prefix: "tw",
      toolbarPanel: "options",
      notificationCallback: () => {},
    },
    ...opts,
  };

  const STYLE_ID = "tailwindcss-plugin";

  // Create worker to elaborate big html structure in chunk
  const worker = new Worker(new URL("./worker.ts", import.meta.url), {
    type: "module",
  });

  /** Reference to the <style> element where generated Tailwind CSS is injected */
  let tailwindStyle: HTMLStyleElement | undefined;

  // Override the editor's getCss method to append the generated Tailwind CSS
  const originalGetCss = editor.getCss.bind(editor);
  editor.getCss = () => {
    const originalCss = originalGetCss();
    return `${originalCss}\n${tailwindStyle?.textContent ?? ""}`;
  };

  // Worker response handler. Here we receive the compiled tailwind css
  worker.onmessage = async (event: MessageEvent<WorkerResponse>) => {
    const { data } = event.data;
    if (data) {
      const { tailwindcss, notify } = data;
      // Append the compiled tailwind css to the tailwind style element
      if (typeof tailwindcss === "string" && tailwindStyle !== undefined) {
        tailwindStyle.textContent = tailwindcss;
      }
      if (notify) {
        options.notificationCallback();
      }
    }
  };

  const setTailwindStyleElement = () => {
    const iframe = editor.Canvas.getDocument();
    const wrapper = iframe.querySelector(
      '[data-gjs-type="wrapper"]',
    ) as HTMLDivElement;
    if (wrapper) {
      tailwindStyle = iframe.getElementById(STYLE_ID) as HTMLStyleElement;
      if (!tailwindStyle) {
        tailwindStyle = document.createElement("style");
        tailwindStyle.setAttribute("id", STYLE_ID);
        wrapper.appendChild(tailwindStyle);
      }
    }
  };

  // Build and update the Tailwind CSS based on the current classes in the editor
  const runWorker = (html: string, notify = false) => {
    const payload: WorkerMessageData = {
      html,
      prefix: options.prefix,
      customCss: options.customCss,
      notify,
    };
    worker.postMessage(payload);
  };

  // Build the Tailwind CSS on initial HTML load
  editor.on("load", async () => {
    // On load we need to set up the tailwind style element where we append the compiled tailwind css
    setTailwindStyleElement();
    runWorker(editor.getHtml());
  });

  // Fired by grapesjs-preset-webpage on import close
  editor.on("command:stop:gjs-open-import-webpage", () =>
    runWorker(editor.getHtml()),
  );

  // If autobuild option is true, listen to the editor's update events to trigger Tailwind CSS rebuilds.
  if (options.autobuild) {
    // Listen to the editor's update events to trigger Tailwind CSS rebuilds
    editor.on("component:update:classes", (cmp: Component) =>
      runWorker(cmp.toHTML()),
    );
  }

  // Register a new command "build-tailwind" that can be triggered programmatically.
  editor.Commands.add("build-tailwind", {
    run(_, sender) {
      runWorker(editor.getHtml(), sender.id === "build-tailwind-button");
    },
  });

  if (options.buildButton) {
    // Add a button to the toolbar to trigger the "build-tailwind" command.
    // This button will always be visible, allowing manual builds when autobuild is disabled.
    editor.Panels.addButton(options.toolbarPanel, {
      id: "build-tailwind-button",
      command: "build-tailwind",
      className: "fa fa-refresh",
      attributes: { title: "Build Tailwind CSS" },
    });
  }
};
