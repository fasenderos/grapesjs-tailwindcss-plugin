// @ts-ignore
import index from "tailwindcss/index.css";
// @ts-ignore
import preflight from "tailwindcss/preflight.css";
// @ts-ignore
import theme from "tailwindcss/theme.css";
// @ts-ignore
import utilities from "tailwindcss/utilities.css";
// @ts-ignore
import autoCompleteCSS from "./autocomplete.css";

// TODO Find a better way to create default Tailwind Classes
const createClasses = (prefix: string | string[], variants: string[]) => {
  const prefixes = Array.isArray(prefix) ? prefix : [prefix];
  return prefixes.flatMap((prefix) => variants.map((v) => `${prefix}-${v}`));
};

const generateNumbers = (start: number, end: number): string[] =>
  Array.from({ length: end - start + 1 }, (_, i) => (start + i).toString());

const numbers = generateNumbers(0, 24);
const aspectRatioCls = [
  ...createClasses("aspect", ["square", "video", "auto", "4/3"]),
];
const columnCls = [
  ...createClasses("columns", [
    "3xs",
    "2xs",
    "xs",
    "sm",
    "md",
    "lg",
    "xl",
    "2xl",
    "3xl",
    "4xl",
    "5xl",
    "6xl",
    "7xl",
    "auto",
  ]),
];
const breakCls = [
  ...createClasses(
    ["break-after", "break-before"],
    ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"],
  ),
  ...createClasses("break-inside", [
    "auto",
    "avoid",
    "avoid-page",
    "avoid-column",
  ]),
];
const boxCls = [
  "box-decoration-clone",
  "box-decoration-slice",
  "box-border",
  "box-content",
];
const displayCls = [
  "inline",
  "block",
  "inline-block",
  "flow-root",
  "flex",
  "inline-flex",
  "grid",
  "inline-grid",
  "contents",
  "table",
  "inline-table",
  "table-caption",
  "table-cell",
  "table-column",
  "table-column-group",
  "table-footer-group",
  "table-header-group",
  "table-row-group",
  "table-row",
  "list-item",
  "hidden",
  "sr-only",
  "not-sr-only",
];
const floatCls = [
  ...createClasses("float", ["right", "left", "start", "end", "none"]),
];
const clearCls = [
  ...createClasses("float", ["left", "right", "both", "start", "end", "none"]),
];
const isolateCls = ["isolate", "isolate-auto"];
const objectFitCls = [
  ...createClasses("object", [
    "contain",
    "cover",
    "fill",
    "none",
    "scale-down",
  ]),
];
const objectPositionCls = [
  ...createClasses("object", [
    "bottom",
    "center",
    "left",
    "left-bottom",
    "left-top",
    "right",
    "right-bottom",
    "right-top",
    "top",
  ]),
];
const overflowCls = [
  ...createClasses(
    ["overflow", "overflow-x", "overflow-y"],
    ["auto", "hidden", "clip", "visible", "scroll"],
  ),
];
const overscrollCls = [
  ...createClasses(
    ["overscroll", "overscroll-x", "overscroll-y"],
    ["auto", "contain", "none"],
  ),
];
const positionCls = ["static", "fixed", "absolute", "relative", "sticky"];
const insetCls = [
  ...createClasses(
    [
      "inset",
      "-inset",
      "inset-x",
      "-inset-x",
      "inset-y",
      "-inset-y",
      "start",
      "-start",
      "end",
      "-end",
      "top",
      "-top",
      "bottom",
      "-bottom",
      "right",
      "-right",
      "left",
      "-left",
    ],
    ["px", "full"],
  ),
  ...createClasses(
    [
      "inset",
      "inset-x",
      "inset-y",
      "start",
      "end",
      "top",
      "bottom",
      "right",
      "left",
    ],
    ["auto"],
  ),
];
const visibilityCls = ["visible", "invisible", "collapse"];
const zIndexCls = ["z-auto"];

const flexBasisCls = [
  ...createClasses("basis", [
    "full",
    "auto",
    "3xs",
    "2xs",
    "xs",
    "sm",
    "md",
    "lg",
    "xl",
    "2xl",
    "3xl",
    "4xl",
    "5xl",
    "6xl",
    "7xl",
  ]),
];
const flexDirectionCls = [
  ...createClasses("flex", ["row", "row-reverse", "col", "col-reverse"]),
];
const flexWrapCls = [
  ...createClasses("flex", ["wrap", "wrap-reverse", "nowrap"]),
];
const flexCls = [...createClasses("flex", ["1", "auto", "initial", "none"])];
const flexGrowCls = [...createClasses("grow", ["", ...numbers])];
const flexShrinkCls = [...createClasses("shrink", ["", ...numbers])];
const flexOrderkCls = [
  ...createClasses("order", ["first", "last", "none", ...numbers]),
];
const gridColsCls = [
  ...createClasses("grid-cols", ["none", "subgrid", ...numbers]),
];
const colsCls = [
  ...createClasses(
    [
      "col-span",
      "col",
      "-col",
      "col-start",
      "-col-start",
      "col-end",
      "-col-end",
    ],
    numbers,
  ),
  "col-span-full",
  "col-start-auto",
  "col-end-auto",
  "col-auto",
];
const gridRowsCls = [
  ...createClasses("grid-rows", ["none", "subgrid", ...numbers]),
];
const rowsCls = [
  ...createClasses(
    [
      "row-span",
      "row",
      "-row",
      "row-start",
      "-row-start",
      "row-end",
      "-row-end",
    ],
    numbers,
  ),
  "row-span-full",
  "row-start-auto",
  "row-end-auto",
  "row-auto",
];
const gridAutoFlowCls = [
  ...createClasses("grid-flow", [
    "row",
    "col",
    "dense",
    "row-dense",
    "col-dense",
  ]),
];
const gridAutoCls = [
  ...createClasses(["auto-cols", "auto-rows"], ["auto", "min", "max", "fr"]),
];
const gapCls = [...createClasses(["gap", "gap-x", "gap-y"], numbers)];
const justifyCls = [
  ...createClasses("justify", [
    "start",
    "end",
    "center",
    "between",
    "around",
    "evenly",
    "stretch",
    "baseline",
    "normal",
  ]),
];
const justifyItemsCls = [
  ...createClasses("justify-items", [
    "start",
    "end",
    "center",
    "stretch",
    "normal",
  ]),
];
const justifySelfCls = [
  ...createClasses("justify-items", [
    "auto",
    "start",
    "end",
    "center",
    "stretch",
  ]),
];
const alignCls = [
  ...createClasses("align", [
    "start",
    "end",
    "center",
    "between",
    "around",
    "evenly",
    "stretch",
    "baseline",
    "normal",
  ]),
];
const alignItemsCls = [
  ...createClasses("items", ["start", "end", "center", "baseline", "stretch"]),
];
const alignSelfCls = [
  ...createClasses("self", [
    "auto",
    "start",
    "end",
    "center",
    "stretch",
    "baseline",
  ]),
];
const placeContentCls = [
  ...createClasses("place-content", [
    "center",
    "start",
    "end",
    "between",
    "around",
    "evenly",
    "baseline",
    "stretch",
  ]),
];
const placeContentItemsCls = [
  ...createClasses("place-items", [
    "start",
    "end",
    "center",
    "baseline",
    "stretch",
  ]),
];
const placeContentSelfCls = [
  ...createClasses("place-self", ["auto", "start", "end", "center", "stretch"]),
];
const paddingCls = [
  ...createClasses(
    ["p", "px", "py", "ps", "pe", "pt", "pb", "pr", "pl"],
    ["px", ...numbers],
  ),
];
const marginCls = [
  ...createClasses(
    ["m", "mx", "my", "ms", "me", "mt", "mb", "mr", "ml"],
    ["px", "auto", ...numbers],
  ),
  ...createClasses(["space-x", "space-y"], ["px", "reverse", ...numbers]),
];
const sizingCls = [
  ...createClasses(
    ["w", "size", "min-w", "max-w", "h", "min-h", "max-h"],
    [
      "px",
      "auto",
      "full",
      "dvw",
      "dvh",
      "lvw",
      "lvh",
      "svw",
      "svh",
      "min",
      "max",
      "fit",
      ...numbers,
    ],
  ),
  ...createClasses(
    ["w", "min-w", "max-w", "h", "min-h", "max-h"],
    [
      "screen",
      "3xs",
      "2xs",
      "xs",
      "sm",
      "md",
      "lg",
      "xl",
      "2xl",
      "3xl",
      "4xl",
      "5xl",
      "6xl",
      "7xl",
    ],
  ),
];

const defaultTwClasses: string[] = [
  // Layout
  ...aspectRatioCls,
  ...columnCls,
  ...breakCls,
  ...boxCls,
  ...displayCls,
  ...floatCls,
  ...clearCls,
  ...isolateCls,
  ...objectFitCls,
  ...objectPositionCls,
  ...overflowCls,
  ...overscrollCls,
  ...positionCls,
  ...insetCls,
  ...visibilityCls,
  ...zIndexCls,

  // Flex & Grids
  ...flexBasisCls,
  ...flexDirectionCls,
  ...flexWrapCls,
  ...flexCls,
  ...flexGrowCls,
  ...flexShrinkCls,
  ...flexOrderkCls,
  ...gridColsCls,
  ...colsCls,
  ...gridRowsCls,
  ...rowsCls,
  ...gridAutoFlowCls,
  ...gridAutoCls,
  ...gapCls,
  ...justifyCls,
  ...justifyItemsCls,
  ...justifySelfCls,
  ...alignCls,
  ...alignItemsCls,
  ...alignSelfCls,
  ...placeContentCls,
  ...placeContentItemsCls,
  ...placeContentSelfCls,

  // Spacing
  ...marginCls,
  ...paddingCls,

  // Sizing
  ...sizingCls,

  // Typography
  "text-xs",
  "text-sm",
  "text-base",
  "text-lg",
  "text-xl",
  "text-2xl",
  "text-3xl",
  "text-4xl",
  "font-thin",
  "font-light",
  "font-normal",
  "font-medium",
  "font-semibold",
  "font-bold",
  "font-extrabold",
  "leading-none",
  "leading-tight",
  "leading-snug",
  "leading-normal",
  "leading-relaxed",
  "leading-loose",
  "text-left",
  "text-center",
  "text-right",
  "text-justify",

  // Colors
  "bg-gray-50",
  "bg-gray-100",
  "bg-gray-200",
  "bg-gray-300",
  "bg-gray-400",
  "bg-gray-500",
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "text-gray-50",
  "text-gray-100",
  "text-gray-200",
  "text-gray-300",
  "text-gray-400",
  "text-gray-500",
  "text-red-500",
  "text-blue-500",
  "text-green-500",
  "text-yellow-500",

  // Borders
  "border",
  "border-0",
  "border-2",
  "border-4",
  "border-8",
  "border-solid",
  "border-dashed",
  "border-dotted",
  "rounded",
  "rounded-sm",
  "rounded-md",
  "rounded-lg",
  "rounded-xl",
  "rounded-2xl",

  // Flex/Grid
  "flex-row",
  "flex-col",
  "flex-wrap",
  "flex-nowrap",
  "justify-start",
  "justify-center",
  "justify-end",
  "justify-between",
  "justify-around",
  "items-start",
  "items-center",
  "items-end",
  "items-stretch",
  "grid-cols-1",
  "grid-cols-2",
  "grid-cols-3",
  "grid-cols-4",
  "grid-cols-5",

  // Effects
  "shadow",
  "shadow-sm",
  "shadow-md",
  "shadow-lg",
  "shadow-xl",
  "shadow-2xl",
  "opacity-0",
  "opacity-25",
  "opacity-50",
  "opacity-75",
  "opacity-100",

  // Others
  "overflow-hidden",
  "overflow-auto",
  "overflow-scroll",
  "overflow-visible",
  "z-0",
  "z-10",
  "z-20",
  "z-30",
  "z-40",
  "z-50",
];

export const css = {
  index,
  preflight,
  theme,
  utilities,
  defaultTwClasses,
  autoCompleteCSS,
};
