// @ts-ignore
import autoComplete from "@tarekraafat/autocomplete.js";
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

  /**
   * The id of the `<style>` tag that contain the compiled Tailwind CSS.
   */
  const STYLE_ID = "tailwindcss-plugin";

  /**
   * The current Tailwind CSS compiler.
   *
   * This gets recreated:
   * - When stylesheets change
   */
  let compiler: Awaited<ReturnType<typeof tailwindcss.compile>>;

  /**
   * The list of all seen classes on the page so far. The compiler already has a
   * cache of classes but this lets us only pass new classes to `build(…)`.
   */
  const classes = new Set<string>();

  /**
   * The last input CSS that was compiled. If stylesheets "change" without
   * actually changing, we can avoid a full rebuild.
   */
  let lastCss = "";

  /**
   * The stylesheet that we use to inject the compiled CSS into the page.
   */
  const tailwindStyle = document.createElement("style");
  tailwindStyle.setAttribute("id", STYLE_ID);

  /**
   * The queue of build tasks that need to be run. This is used to ensure that we
   * don't run multiple builds concurrently.
   */
  let buildQueue = Promise.resolve();

  /**
   * What build this is
   */
  let nextBuildId = 1;

  /** Override the editor's getCss method to append the generated Tailwind CSS */
  const originalGetCss = editor.getCss.bind(editor);
  editor.getCss = () => {
    const originalCss = originalGetCss();
    return `${originalCss}\n${tailwindStyle?.textContent ?? ""}`;
  };

  /**
   * Retrieves CSS content from a URL or returns the string as is.
   * @param {string} input - The CSS URL or raw CSS string.
   * @returns {Promise<string>} The CSS content.
   */
  async function getCustomCSSContent(
    input?: string
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

  /**
   * Create the Tailwind CSS compiler
   *
   * This handles loading imports, plugins, configs, etc…
   *
   * This does **not** imply that the CSS is actually built. That happens in the
   * `build` function and is a separate scheduled task.
   */
  async function createCompiler() {
    const customCss = await getCustomCSSContent(options.customCss);
    const css = `@import "tailwindcss"${
      options.prefix?.length ? ` prefix(${options.prefix})` : ""
    };${customCss ?? ""}`;

    // The input CSS did not change so the compiler does not need to be recreated
    if (lastCss === css) return;

    lastCss = css;

    try {
      compiler = await tailwindcss.compile(css, {
        base: "/",
        loadStylesheet,
      });
    } catch (err) {
      console.error("Failed to create compiler", (err as Error).message ?? err);
    }

    classes.clear();
  }

  async function loadStylesheet(id: string, base: string) {
    function load() {
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

    try {
      const sheet = load();
      return sheet;
    } catch (err) {
      console.error("Failed to load stylesheet", (err as Error).message ?? err);
      throw err;
    }
  }

  async function build(kind: "full" | "incremental") {
    if (!compiler) return;

    // 1. Refresh the known list of classes
    const newClasses = new Set<string>();

    for (const element of editor.Canvas.getDocument().querySelectorAll(
      "[class]"
    )) {
      for (const c of element.classList) {
        if (classes.has(c)) continue;

        classes.add(c);
        newClasses.add(c);
      }
    }

    if (newClasses.size === 0 && kind === "incremental") return;

    tailwindStyle.textContent = compiler.build(Array.from(newClasses));
  }

  function rebuild(kind: "full" | "incremental", notify = false) {
    async function run() {
      if (!compiler && kind !== "full") {
        return;
      }

      nextBuildId++;

      if (kind === "full") {
        await createCompiler();
      }
      await build(kind);
    }

    buildQueue = buildQueue
      .then(run)
      .then(() => {
        if (notify) {
          options.notificationCallback();
        }
      })
      .catch((err) =>
        console.error("Failed to build", (err as Error).message ?? err)
      );
  }

  // Handle changes to known stylesheets
  const styleObserver = new MutationObserver(() => {
    rebuild("full");
  });

  function observeSheet(sheet: HTMLStyleElement) {
    styleObserver.observe(sheet, {
      attributes: true,
      attributeFilter: ["type"],
      characterData: true,
      subtree: true,
      childList: true,
    });
  }

  /**
   * On iframe load (a.k.a on Page Changes) we need to set up the tailwind style element
   * where we append the compiled tailwind css
   */
  editor.on("canvas:frame:load:body", ({ window }: { window: Window }) => {
    window.document.body.appendChild(tailwindStyle);

    /**
     * If autobuild option is true, listen to the editor's update events to
     * trigger Tailwind CSS rebuilds.
     */
    if (options.autobuild) {
      // Handle changes to the document that could affect the styles
      // - Changes to any element's class attribute
      // - New stylesheets being added to the page
      // - New elements (with classes) being added to the page
      new MutationObserver((records) => {
        let full = 0;
        let incremental = 0;

        for (const record of records) {
          // New stylesheets == tracking + full rebuild
          for (const node of record.addedNodes as Iterable<HTMLElement>) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            if (node.tagName !== "STYLE") continue;

            observeSheet(node as HTMLStyleElement);
            full++;
          }

          // New nodes require an incremental rebuild
          for (const node of record.addedNodes) {
            if (node.nodeType !== 1) continue;

            // Skip the output stylesheet itself to prevent loops
            if (node === tailwindStyle) continue;

            incremental++;
          }

          // Changes to class attributes require an incremental rebuild
          if (record.type === "attributes") {
            incremental++;
          }
        }

        if (full > 0) {
          return rebuild("full");
        }
        if (incremental > 0) {
          return rebuild("incremental");
        }
      }).observe(window.document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
        childList: true,
        subtree: true,
      });

      rebuild("full");
    }
  });

  /**
   * Initializes the autocomplete feature when the editor is fully loaded.
   * Provides class name suggestions based on existing and default classes,
   * filtering already applied classes.
   */
  editor.on("load", () => {
    const container = editor.getContainer();
    const pfx = editor.SelectorManager.getConfig("pStylePrefix");
    const style = document.createElement("style");
    style.textContent = assets.css.autoCompleteCSS;
    container?.appendChild(style);

    const defaultTwClasses = new Set(assets.css.defaultTwClasses);
    const baseClasses = new Set([...defaultTwClasses, ...classes]);

    const autoCompleteJS = new autoComplete({
      selector: `#${pfx}clm-new`,
      data: {
        src: () => {
          const currentClasses = editor.SelectorManager.selected
            .getStyleable()
            .map((selector) => selector.getName());

          const filteredClasses = new Set(baseClasses);

          for (const cls of currentClasses) {
            filteredClasses.delete(cls);
          }

          return filteredClasses;
        },
      },
      trigger: () => true,
      events: {
        input: {
          focus: () => {
            autoCompleteJS.start("");
          },
        },
      },
      resultsList: {
        // biome-ignore lint/suspicious/noExplicitAny: autoComplete.js does not have types
        element: (list: HTMLUListElement, data: any) => {
          const info = document.createElement("p");
          if (data.results.length > 0) {
            info.innerHTML = `Showing <strong>${data.results.length}</strong> of <strong>${data.matches.length}</strong> results`;
          } else {
            info.innerHTML = `Found <strong>${data.matches.length}</strong> matching results for <strong>"${data.query}"</strong>`;
          }
          list.prepend(info);
        },
        noResults: true,
        maxResults: Number.MAX_SAFE_INTEGER,
        tabSelect: true,
      },
      resultItem: { highlight: true },
      debounce: 200, // delay time duration that counts after typing is done for autoComplete.js engine to start
      threshold: 1, // minimum characters length where autoComplete.js engine starts
    });

    // biome-ignore lint/suspicious/noExplicitAny: autoComplete.js does not have types
    autoCompleteJS.input.addEventListener("selection", (event: any) => {
      const selection = event.detail?.selection?.value;
      autoCompleteJS.input.blur();
      if (selection)
        editor.SelectorManager.addSelected(
          `${options.prefix?.length ? `${options.prefix}:` : ""}${selection}`
        );
    });
  });

  /** Fired by grapesjs-preset-webpage on import close */
  editor.on("command:stop:gjs-open-import-webpage", () => rebuild("full"));

  /** Register a new command "build-tailwind" that can be triggered programmatically. */
  editor.Commands.add("build-tailwind", {
    run(_, sender) {
      rebuild("full", sender.id === "build-tailwind-button");
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
