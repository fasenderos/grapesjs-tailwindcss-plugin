// @ts-ignore
import * as tailwindcss from "tailwindcss";
import * as assets from "./assets";
import type { Editor } from "grapesjs";

/**
 * The type used by `<style>` tags that contain input CSS.
 */
const STYLE_TYPE = "text/tailwindcss";

export default (editor: Editor, opts = {}) => {
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
  const sheet = document.createElement("style");

  /**
   * The queue of build tasks that need to be run. This is used to ensure that we
   * don't run multiple builds concurrently.
   */
  let buildQueue = Promise.resolve();

  /**
   * What build this is
   */
  let nextBuildId = 1;

  /**
   * Create the Tailwind CSS compiler
   *
   * This handles loading imports, plugins, configs, etc…
   *
   * This does **not** imply that the CSS is actually built. That happens in the
   * `build` function and is a separate scheduled task.
   */
  async function createCompiler() {
    // The stylesheets may have changed causing a full rebuild so we'll need to
    // gather the latest list of stylesheets.
    const stylesheets: Iterable<HTMLStyleElement> = document.querySelectorAll(
      `style[type="${STYLE_TYPE}"]`
    );

    let css = "";
    for (const sheet of stylesheets) {
      observeSheet(sheet);
      css += `${sheet.textContent}\n`;
    }

    // The user might have no stylesheets, or a some stylesheets without `@import`
    // because they want to customize their theme so we'll inject the main import
    // for them. However, if they start using `@import` we'll let them control
    // the build completely.
    if (!css.includes("@import")) {
      css = `@import "tailwindcss";${css}`;
    }

    // The input CSS did not change so the compiler does not need to be recreated
    if (lastCss === css) return;

    lastCss = css;

    compiler = await tailwindcss.compile(css, {
      base: "/",
      loadStylesheet,
      loadModule,
    });

    classes.clear();
  }

  async function loadStylesheet(id: string, base: string) {
    function load() {
      if (id === "tailwindcss") {
        return {
          base,
          content: assets.css.index,
        };
      }

      if (
        id === "tailwindcss/preflight" ||
        id === "tailwindcss/preflight.css" ||
        id === "./preflight.css"
      ) {
        return {
          base,
          content: assets.css.preflight,
        };
      }

      if (
        id === "tailwindcss/theme" ||
        id === "tailwindcss/theme.css" ||
        id === "./theme.css"
      ) {
        return {
          base,
          content: assets.css.theme,
        };
      }

      if (
        id === "tailwindcss/utilities" ||
        id === "tailwindcss/utilities.css" ||
        id === "./utilities.css"
      ) {
        return {
          base,
          content: assets.css.utilities,
        };
      }

      throw new Error(`The browser build does not support @import for "${id}"`);
    }
    const sheet = load();

    return sheet;
  }

  async function loadModule(): Promise<void> {
    alert("Abbiamo chiamato loadModule");
  }

  async function build(kind: "full" | "incremental") {
    if (!compiler) return;

    // 1. Refresh the known list of classes
    const newClasses = new Set<string>();

    for (const element of document.querySelectorAll("[class]")) {
      for (const c of element.classList) {
        if (classes.has(c)) continue;

        classes.add(c);
        newClasses.add(c);
      }
    }

    if (newClasses.size === 0 && kind === "incremental") return;

    sheet.textContent = compiler.build(Array.from(newClasses));
  }

  function rebuild(kind: "full" | "incremental") {
    async function run() {
      if (!compiler && kind !== "full") {
        return;
      }

      const buildId = nextBuildId++;

      if (kind === "full") {
        await createCompiler();
      }

      await build(kind);
    }

    buildQueue = buildQueue.then(run).catch((err) => console.error(err));
  }

  // Handle changes to known stylesheets
  const styleObserver = new MutationObserver(() => rebuild("full"));

  function observeSheet(sheet: HTMLStyleElement) {
    styleObserver.observe(sheet, {
      attributes: true,
      attributeFilter: ["type"],
      characterData: true,
      subtree: true,
      childList: true,
    });
  }

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
        if (node.getAttribute("type") !== STYLE_TYPE) continue;

        observeSheet(node as HTMLStyleElement);
        full++;
      }

      // New nodes require an incremental rebuild
      for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue;

        // Skip the output stylesheet itself to prevent loops
        if (node === sheet) continue;

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
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
    childList: true,
    subtree: true,
  });

  rebuild("full");

  document.head.append(sheet);
};
