// @ts-ignore
import * as tailwindcss from "tailwindcss";
import * as assets from "./assets";

export type WorkerMessageData = {
  html: string;
  prefix: string;
  customCss?: string;
  notify: boolean;
};

export type WorkerResponse = {
  error: string | null;
  data: {
    tailwindcss: string | null;
    notify: boolean;
  } | null;
};

/** Tailwind CSS compiler instance */
let compiler: Awaited<ReturnType<typeof tailwindcss.compile>>;

// Cache to store processed Tailwind classes to avoid unnecessary recompilation
const classesCache = new Set<string>();

// Build the Tailwind CSS compiler using tailwindcss.compile with a custom stylesheet loader
const buildCompiler = async (prefix: string, customCss?: string) => {
  compiler = await tailwindcss.compile(
    `@import "tailwindcss" prefix(${prefix});${customCss ?? ""}`,
    {
      base: "/",
      loadStylesheet,
    },
  );
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
const initTailwindCompiler = async (prefix: string, customCss?: string) => {
  await buildCompiler(prefix, customCss);
  classesCache.clear();
};

// Extract all Tailwind-related classes from the editor's HTML content
const getClassesFromHtml = (html: string, prefix: string) => {
  const classRegex = /class=["']([^"']+)["']/g;
  const currentClasses = new Set<string>();

  // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
  let match;
  // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
  while ((match = classRegex.exec(html)) !== null) {
    const classes = match[1].split(" ");
    for (const cls of classes) {
      if (cls.startsWith(prefix)) {
        currentClasses.add(cls);
      }
    }
  }
  return currentClasses;
};

const processRemovedClasses = async (
  currentClasses: Set<string>,
  prefix: string,
  customCss?: string,
) => {
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
    await buildCompiler(prefix, customCss);
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

// Worker handler
self.onmessage = async (event: MessageEvent<WorkerMessageData>) => {
  const { html, prefix, customCss, notify } = event.data;
  if (!compiler) await initTailwindCompiler(prefix, customCss);

  const result: WorkerResponse = { error: null, data: null };

  try {
    // Get all current tailwind related classes
    const currentClasses = getClassesFromHtml(html, prefix);

    // Identify classes that have been removed
    const classesRemoved = await processRemovedClasses(
      currentClasses,
      prefix,
      customCss,
    );

    // Identify new classes to add
    const classesAdded = processAddedClasses(currentClasses);

    const shouldRebuildCss = classesRemoved || classesAdded;

    if (!shouldRebuildCss) {
      result.data = { tailwindcss: null, notify };
    } else {
      result.data = {
        tailwindcss: await compileTailwindCss(),
        notify,
      };
    }

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  } catch (error: any) {
    result.error = error?.message ?? "";
  }

  // Send result to main thread
  self.postMessage(result);
};
