// @ts-ignore
import * as tailwindcss from "tailwindcss";
import * as assets from "./assets";

import type { Component, Editor } from "grapesjs";

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
  customCss?: string;
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
      customCss: "",
      prefix: "tw",
      toolbarPanel: "options",
      notificationCallback: () => {},
    },
    ...opts,
  };

  const STYLE_ID = "tailwindcss-plugin";

  /** Tailwind CSS compiler instance */
  let compiler: Awaited<ReturnType<typeof tailwindcss.compile>>;

  /** Reference to the <style> element where generated Tailwind CSS is injected */
  let tailwindStyle: HTMLStyleElement | undefined;

  // Cache to store processed Tailwind classes to avoid unnecessary recompilation
  const classesCache = new Set<string>();

  // Build the Tailwind CSS compiler using tailwindcss.compile with a custom stylesheet loader
  const buildCompiler = async () => {
    compiler = await tailwindcss.compile(
      `@import "tailwindcss" prefix(${options.prefix});${
        options.customCss ?? ""
      }`,
      {
        base: "/",
        loadStylesheet,
      },
    );
  };

  // Override the editor's getCss method to append the generated Tailwind CSS
  const originalGetCss = editor.getCss.bind(editor);
  editor.getCss = () => {
    const originalCss = originalGetCss();
    return `${originalCss}\n${tailwindStyle?.textContent ?? ""}`;
  };

  // Custom stylesheet loader function for Tailwind CSS assets
  async function loadStylesheet(id: string, base: string) {
    if (id === "tailwindcss") {
      return { base, content: assets.css.index };
    }
    if (id.includes("preflight")) {
      return { base, content: assets.css.preflight };
    }
    if (id.includes("theme")) {
      return { base, content: assets.css.theme };
    }
    if (id.includes("utilities")) {
      return { base, content: assets.css.utilities };
    }
    return { base, content: "" };
  }

  // Initialize the Tailwind compiler, clear the classes cache, and set up the style element
  const initTailwindCompiler = async () => {
    await buildCompiler();
    classesCache.clear();
  };

  // Extract all Tailwind-related classes from the editor's HTML content
  const getClassesFromHtml = (html: string) => {
    const classRegex = /class=["']([^"']+)["']/g;
    const currentClasses = new Set<string>();

    // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
    let match;
    // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
    while ((match = classRegex.exec(html)) !== null) {
      const classes = match[1].split(" ");
      for (const cls of classes) {
        if (cls.startsWith(options.prefix)) {
          currentClasses.add(cls);
        }
      }
    }
    return currentClasses;
  };

  const processRemovedClasses = async (currentClasses: Set<string>) => {
    // Identify classes that have been removed
    let changed = false;
    const classesToRemove: string[] = [];
    for (const cls of classesCache) {
      if (!currentClasses.has(cls)) {
        classesToRemove.push(cls);
        changed = true;
      }
    }

    // Remove classes non more used
    if (classesToRemove.length) {
      for (const c of classesToRemove) {
        classesCache.delete(c);
      }
      // Rebuild the compiler to purge Tailwind's internal cache
      await buildCompiler();
    }

    return changed;
  };

  const processAddedClasses = (currentClasses: Set<string>): boolean => {
    // Identify new classes to add by checking if they are in cache
    let changed = false;
    for (const c of currentClasses) {
      if (!classesCache.has(c)) {
        classesCache.add(c);
        changed = true;
      }
    }
    return changed;
  };

  const compileTailwindCss = async () => {
    // Build Tailwind CSS if there are classes in the cache
    if (classesCache.size > 0) {
      return compiler.build(Array.from(classesCache)) as string;
    }
    return "";
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
  const buildTailwindCss = async (html: string, notify = false) => {
    if (!compiler) await initTailwindCompiler();

    try {
      // Get all current tailwind related classes
      const currentClasses = getClassesFromHtml(html);

      // Identify classes that have been removed
      const classesRemoved = await processRemovedClasses(currentClasses);

      // Identify new classes to add
      const classesAdded = processAddedClasses(currentClasses);

      const shouldRebuildCss = classesRemoved || classesAdded;

      if (!shouldRebuildCss) return;

      const tailwindcss = await compileTailwindCss();
      // Append the compiled tailwind css to the tailwind style element
      if (tailwindStyle !== undefined) {
        tailwindStyle.textContent = tailwindcss;
      }
      if (notify) {
        options.notificationCallback();
      }

      // biome-ignore lint/suspicious/noExplicitAny: unknown
    } catch (error: any) {}
  };

  // Build the Tailwind CSS on initial HTML load
  editor.on("load", async () => {
    // On load we need to set up the tailwind style element where we append the compiled tailwind css
    setTailwindStyleElement();
    buildTailwindCss(editor.getHtml());
  });

  // Fired by grapesjs-preset-webpage on import close
  editor.on("command:stop:gjs-open-import-webpage", () =>
    buildTailwindCss(editor.getHtml()),
  );

  // If autobuild option is true, listen to the editor's update events to trigger Tailwind CSS rebuilds.
  if (options.autobuild) {
    // Listen to the editor's update events to trigger Tailwind CSS rebuilds
    editor.on("component:update:classes", (cmp: Component) =>
      buildTailwindCss(cmp.toHTML()),
    );
  }

  // Register a new command "build-tailwind" that can be triggered programmatically.
  editor.Commands.add("build-tailwind", {
    run(_, sender) {
      buildTailwindCss(editor.getHtml(), sender.id === "build-tailwind-button");
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
