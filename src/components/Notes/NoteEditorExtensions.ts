import { Extension } from "@tiptap/core";

// ─── TypeScript command augmentation ────────────────────
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
    customBullet: {
      setCustomBullet: (char: string) => ReturnType;
      unsetCustomBullet: () => ReturnType;
    };
  }
}

// ────────────────────────────────────────────────────────
// LineHeight — paragraph-level line height attribute
// ────────────────────────────────────────────────────────
export const LineHeight = Extension.create({
  name: "lineHeight",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.lineHeight || null,
            renderHTML: (attributes: Record<string, unknown>) => {
              if (!attributes.lineHeight) return {};
              return { style: `line-height: ${attributes.lineHeight}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight:
        (lineHeight: string) =>
        ({ commands }) =>
          commands.updateAttributes("paragraph", { lineHeight }),
      unsetLineHeight:
        () =>
        ({ commands }) =>
          commands.resetAttributes("paragraph", "lineHeight"),
    };
  },
});

// ────────────────────────────────────────────────────────
// CustomBullet — custom list-style character on bullet lists
// ────────────────────────────────────────────────────────
export const CustomBullet = Extension.create({
  name: "customBullet",

  addGlobalAttributes() {
    return [
      {
        types: ["bulletList"],
        attributes: {
          bulletChar: {
            default: null,
            parseHTML: (element: HTMLElement) => element.getAttribute("data-bullet") || null,
            renderHTML: (attributes: Record<string, unknown>) => {
              if (!attributes.bulletChar) return {};
              return {
                "data-bullet": attributes.bulletChar,
                style: `list-style-type: "${attributes.bulletChar}"`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setCustomBullet:
        (char: string) =>
        ({ commands }) =>
          commands.updateAttributes("bulletList", { bulletChar: char }),
      unsetCustomBullet:
        () =>
        ({ commands }) =>
          commands.resetAttributes("bulletList", "bulletChar"),
    };
  },
});
