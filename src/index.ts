// @ts-ignore
import * as tailwindcss from "tailwindcss";
import * as assets from "./assets";

import type { Editor } from "grapesjs";

export type TailwindPluginOptions = {
  /**
   * The prefix to use for Tailwind CSS classes.
   * This helps differentiate Tailwind classes from other CSS classes.
   * @default null
   */
  prefix?: string | null;
  /**
   * If true, the plugin will automatically rebuild the Tailwind CSS on each update.
   * @default true
   */
  autobuild?: boolean;
  /**
   * This option allows you to append your own CSS code immediately after the "@import 'tailwindcss';" statement.
   * This means you can add any custom directives, such as "@layer components { ... }" or even "@theme { ... }"
   * to further extend or override the default styles.
   *
   * @see https://tailwindcss.com/docs/theme for more detailes on how customize theme variables.
   * @see https://tailwindcss.com/docs/adding-custom-styles for more details on how to customize your Tailwind CSS.
   * @default null
   */
  customCss?: string;
  /**
   * Option to add a build button to the toolbar that allows manual triggering of the Tailwind CSS build process.
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

/**
 * Retrieves CSS content from a URL or returns the string as is.
 * @param {string} input - The CSS URL or raw CSS string.
 * @returns {Promise<string>} The CSS content.
 */
async function getCustomCSSContent(
  input?: string,
): Promise<string | undefined> {
  if (!input) return;
  try {
    // Try creating a URL object to check if it's a valid URL
    const url = new URL(input);

    // Ensure the URL uses HTTP or HTTPS
    if (url.protocol === "http:" || url.protocol === "https:") {
      // Fetch the CSS content from the URL
      const response = await fetch(input);

      // Check if the request was successful
      if (!response.ok) {
        throw new Error(`Failed to load CSS: ${response.statusText}`);
      }

      // Return the CSS content as text
      return await response.text();
    }
  } catch {
    // If input is not a valid URL, return it as is
    return input;
  }
}

export default (editor: Editor, opts: TailwindPluginOptions = {}) => {
  // Merge default options with user-provided options
  const options: Required<TailwindPluginOptions> = {
    ...{
      i18n: {},
      // default options
      autobuild: true,
      buildButton: false,
      customCss: "",
      prefix: null,
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

  /** Cache to store processed Tailwind classes to avoid unnecessary recompilation */
  const classesCache = new Set<string>();

  /** Build the Tailwind CSS compiler using tailwindcss.compile with a custom stylesheet loader */
  const buildCompiler = async () => {
    const customCss = await getCustomCSSContent(options.customCss);
    compiler = await tailwindcss.compile(
      `@import "tailwindcss"${
        options.prefix?.length ? ` prefix(${options.prefix})` : ""
      };${customCss ?? ""}`,
      {
        base: "/",
        loadStylesheet,
      },
    );
  };

  /** Override the editor's getCss method to append the generated Tailwind CSS */
  const originalGetCss = editor.getCss.bind(editor);
  editor.getCss = () => {
    const originalCss = originalGetCss();
    return `${originalCss}\n${tailwindStyle?.textContent ?? ""}`;
  };

  /** Custom stylesheet loader function for Tailwind CSS assets */
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

  /** Initialize the Tailwind compiler, clear the classes cache, and set up the style element */
  const initTailwindCompiler = async () => {
    await buildCompiler();
    classesCache.clear();
  };

  /** Extract all Tailwind-related classes from the editor's HTML content */
  const getClassesFromHtml = (html: string) => {
    const classRegex = /class=["']([^"']+)["']/g;
    const currentClasses = new Set<string>();

    // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
    let match;
    // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
    while ((match = classRegex.exec(html)) !== null) {
      const classes = match[1].split(" ");
      for (const cls of classes) {
        if (options.prefix?.length) {
          if (cls.startsWith(options.prefix)) {
            currentClasses.add(cls);
          }
        } else currentClasses.add(cls);
      }
    }
    return currentClasses;
  };

  const processRemovedClasses = async (currentClasses: Set<string>) => {
    // Identify classes that have been removed
    const classesToRemove: string[] = [];
    for (const cls of classesCache) {
      if (!currentClasses.has(cls)) {
        classesToRemove.push(cls);
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

    return classesToRemove.length > 0; // Means it's changed
  };

  const processAddedClasses = (currentClasses: Set<string>): boolean => {
    // Identify new classes to add by checking if they are in cache
    const originalSize = classesCache.size;
    for (const c of currentClasses) {
      if (!classesCache.has(c)) {
        classesCache.add(c);
      }
    }
    return originalSize !== classesCache.size; // Means it's changed
  };

  const compileTailwindCss = async () => {
    // Build Tailwind CSS if there are classes in the cache
    if (classesCache.size > 0) {
      return compiler.build(Array.from(classesCache)) as string;
    }
    return "";
  };

  const setTailwindStyleElement = (window: Window) => {
    tailwindStyle = window.document.getElementById(
      STYLE_ID,
    ) as HTMLStyleElement;
    if (!tailwindStyle) {
      tailwindStyle = document.createElement("style");
      tailwindStyle.setAttribute("id", STYLE_ID);
      window.document.body.appendChild(tailwindStyle);
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

  /**
   * On iframe load (a.k.a on Page Changes) we need to set up the tailwind style element
   * where we append the compiled tailwind css
   */
  editor.on("canvas:frame:load:body", ({ window }) => {
    setTailwindStyleElement(window);
    buildTailwindCss(editor.getHtml());
  });

  /** Fired by grapesjs-preset-webpage on import close */
  editor.on("command:stop:gjs-open-import-webpage", () =>
    buildTailwindCss(editor.getHtml()),
  );

  /**
   * If autobuild option is true, listen to the editor's update events to
   * trigger Tailwind CSS rebuilds.
   */
  if (options.autobuild) {
    editor.on("component:update:classes", () =>
      buildTailwindCss(editor.getHtml()),
    );
  }

  /** Register a new command "build-tailwind" that can be triggered programmatically. */
  editor.Commands.add("build-tailwind", {
    run(_, sender) {
      buildTailwindCss(editor.getHtml(), sender.id === "build-tailwind-button");
    },
  });

  /**
   * Add a button to the toolbar to trigger the "build-tailwind" command,
   * to allow manual builds when autobuild is disabled.
   */
  if (options.buildButton) {
    editor.Panels.addButton(options.toolbarPanel, {
      id: "build-tailwind-button",
      command: "build-tailwind",
      className: "fa fa-refresh",
      attributes: { title: "Build Tailwind CSS" },
    });
  }
};
