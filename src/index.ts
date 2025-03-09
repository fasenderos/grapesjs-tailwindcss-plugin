import * as assets from "./assets";
// @ts-ignore
import * as tailwindcss from "tailwindcss";
import type { Editor } from "grapesjs";

export type TailwindPluginOptions = {
  /**
   * The prefix to use for Tailwind CSS classes.
   * This helps differentiate Tailwind classes from other CSS classes.
   * @default tw
   */
  prefix?: string;
  /**
   * If true, the plugin will automatically rebuild the Tailwind CSS on each update.
   * Set to false to disable auto-building and trigger builds manually.
   * @default true
   */
  autobuild?: boolean;

  /**
   * Option to add a build button to the toolbar.
   * When set to true, a button will be added that allows manual triggering of the Tailwind CSS build process.
   * @default false
   */
  buildButton?: boolean;

  /**
   * Specifies which panel the build button should be added to
   * @default options
   */
  toolbarPanel?: string;

  /**
   * Define a custom function to handle notifications when the Tailwind CSS is compiled
   * with the `build-tailwind` command
   * @default window.alert
   */
  notificationCallback?: () => void;
};

export default (editor: Editor, opts: TailwindPluginOptions = {}) => {
  // Merge default options with user-provided options
  const options: Required<TailwindPluginOptions> = {
    ...{
      i18n: {},
      // default options
      prefix: "tw", // default prefix for Tailwind classes
      autobuild: true,
      buildButton: false,
      toolbarPanel: "options",
      notificationCallback: () => alert("Tailwind CSS compiled successfully"),
    },
    ...opts,
  };

  const STYLE_ID = "tailwindcss-plugin";

  /** Tailwind CSS compiler instance */
  let compiler: Awaited<ReturnType<typeof tailwindcss.compile>>;

  /** Reference to the <style> element where generated Tailwind CSS is injected */
  let tailwindStyle: HTMLStyleElement;

  // Override the editor's getCss method to append the generated Tailwind CSS
  const originalGetCss = editor.getCss.bind(editor);
  editor.getCss = () => {
    const originalCss = originalGetCss();
    return `${originalCss}\n${tailwindStyle.textContent}`;
  };

  // Cache to store processed Tailwind classes to avoid unnecessary recompilation
  const classesCache = new Set<string>();

  const setTailwindStyleElement = () => {
    const iframe = editor.Canvas.getDocument();
    const wrapper = iframe.querySelector(
      '[data-gjs-type="wrapper"]'
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

  // Build the Tailwind CSS compiler using tailwindcss.compile with a custom stylesheet loader
  const buildCompiler = async () => {
    compiler = await tailwindcss.compile(
      `@import "tailwindcss" prefix(${options.prefix});`,
      {
        base: "/",
        loadStylesheet,
      }
    );
  };

  // Initialize the Tailwind compiler, clear the classes cache, and set up the style element
  const initTailwindCompiler = async () => {
    await buildCompiler();
    classesCache.clear();
    setTailwindStyleElement();
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

  // Extract all Tailwind-related classes from the editor's HTML content
  const getClassesFromCanvas = () => {
    const html = editor.getHtml();
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const currentClasses = new Set<string>();

    // Iterate through all elements with a class attribute
    for (const element of tempDiv.querySelectorAll("[class]")) {
      for (const c of element.classList) {
        // keep only classes with tailwind prefix
        if (c.includes(options.prefix)) currentClasses.add(c);
      }
    }
    return currentClasses;
  };

  // Build and update the Tailwind CSS based on the current classes in the editor
  const buildTailwindCss = async () => {
    try {
      if (!compiler) await initTailwindCompiler();

      let shouldRebuildCss = false;

      // Get all current tailwind related classes
      const currentClasses = getClassesFromCanvas();

      // Identify classes that have been removed
      const classToRemove: string[] = [];
      for (const c of classesCache) {
        if (!currentClasses.has(c)) {
          classToRemove.push(c);
          shouldRebuildCss = true;
        }
      }
      if (classToRemove.length) {
        for (const c of classToRemove) {
          classesCache.delete(c);
        }
        // Rebuild the compiler to purge Tailwind's internal cache
        await buildCompiler();
      }

      // Identify new classes to add
      for (const c of currentClasses) {
        if (!classesCache.has(c)) {
          classesCache.add(c);
          shouldRebuildCss = true;
        }
      }

      // Exit early if no changes were detected
      if (!shouldRebuildCss) return;

      // Build Tailwind CSS if there are classes in the cache
      let tailwindCss = "";
      if (classesCache.size) {
        tailwindCss += await compiler.build(Array.from(classesCache));
      }
      tailwindStyle.textContent = tailwindCss;
    } catch (error) {
      console.error("Error building Tailwind CSS:", error);
    }
    return;
  };

  // If autobuild option is true, listen to the editor's update events to trigger Tailwind CSS rebuilds.
  if (options.autobuild) {
    // Listen to the editor's update events to trigger Tailwind CSS rebuilds
    editor.on("update", buildTailwindCss);
  }

  // Register a new command "build-tailwind" that can be triggered programmatically.
  editor.Commands.add("build-tailwind", {
    run(_, sender) {
      buildTailwindCss().then(() => {
        if (sender.id === "build-tailwind-button") {
          options.notificationCallback();
        }
      });
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
