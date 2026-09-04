"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { NotesDialog } from "./NotesDialog";

// ─── Constants ──────────────────────────────────────────
const FONT_OPTIONS = [
  { label: "Default (Inter)", value: "Inter, sans-serif" },
  { label: "Varela Round", value: "var(--font-varela-round, 'Varela Round', sans-serif)" },
  { label: "Merriweather", value: "var(--font-merriweather, 'Merriweather', serif)" },
  { label: "Playfair Display", value: "var(--font-playfair-display, 'Playfair Display', serif)" },
  { label: "JetBrains Mono", value: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)" },
  { label: "Georgia", value: "Georgia, serif" },
];

const LINE_SPACING_OPTIONS = [
  { label: "1.0", value: "1" },
  { label: "1.15", value: "1.15" },
  { label: "1.5", value: "1.5" },
  { label: "1.75", value: "1.75" },
  { label: "2.0", value: "2" },
];

const BULLET_PRESETS = ["•", "◦", "▸", "➤", "★", "✦", "–", "→", "◆", "✓"];

const COLORS = [
  "#000000", "#374151", "#6b7280", "#ffffff",
  "#dc2626", "#ea580c", "#ca8a04", "#16a34a",
  "#2563eb", "#7c3aed", "#db2777", "#0891b2",
  "#fca5a5", "#86efac", "#93c5fd", "#f9a8d4",
];

const HIGHLIGHT_COLORS = [
  "#fef08a", "#bbf7d0", "#bfdbfe", "#fce7f3",
  "#fed7aa", "#e9d5ff", "#99f6e4", "#fecaca",
];

// ─── Shared utilities ────────────────────────────────────
type NoteToolbarProps = { editor: Editor | null };
type SavedSelection = { from: number; to: number };

function normalizeHref(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

// ─── Sub-components ──────────────────────────────────────
function ToolbarSep() {
  return <div className="mx-1 h-5 w-px shrink-0" style={{ background: "var(--border)" }} />;
}

function ToolbarButton({
  active,
  label,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title ?? label}
      onClick={onClick}
      className="flex h-7 w-7 cursor-pointer items-center justify-center shrink-0"
      style={{
        borderRadius: "var(--radius-md)",
        background: active ? "var(--accent-muted)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-secondary)",
        transition: "background var(--transition-fast), color var(--transition-fast)",
      }}
    >
      {children}
    </button>
  );
}

function ToolbarSelect({
  value,
  onChange,
  label,
  options,
  width,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: { label: string; value: string }[];
  width?: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 cursor-pointer rounded border px-1 text-xs font-medium outline-none shrink-0"
      style={{
        width: width ?? "auto",
        borderColor: "var(--border)",
        background: "var(--surface)",
        color: "var(--foreground)",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// Color swatch picker popover
function ColorPicker({
  colors,
  current,
  label,
  onPick,
  onCustom,
  onClear,
  clearLabel,
}: {
  colors: string[];
  current?: string;
  label: string;
  onPick: (color: string) => void;
  onCustom?: (color: string) => void;
  onClear?: () => void;
  clearLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(current ?? "#000000");

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => setOpen((o) => !o)}
        className="flex h-7 w-7 cursor-pointer flex-col items-center justify-center gap-0.5"
        style={{
          borderRadius: "var(--radius-md)",
          background: open ? "var(--accent-muted)" : "transparent",
          color: open ? "var(--accent)" : "var(--text-secondary)",
        }}
      >
        {/* A▲ icon with color swatch */}
        <span className="text-xs font-bold leading-none" style={{ color: "var(--foreground)" }}>A</span>
        <span
          className="h-1 w-5 rounded-full"
          style={{ background: current ?? "var(--text-secondary)" }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 rounded-xl border p-2 shadow-lg"
          style={{
            background: "var(--surface-2)",
            borderColor: "var(--border)",
            minWidth: "10rem",
          }}
        >
          <div className="mb-2 grid grid-cols-4 gap-1">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => { onPick(c); setOpen(false); }}
                className="h-6 w-6 cursor-pointer rounded-md border-2"
                style={{
                  background: c,
                  borderColor: current === c ? "var(--accent)" : "transparent",
                }}
              />
            ))}
          </div>
          {onCustom && (
            <div className="flex items-center gap-2 border-t pt-2" style={{ borderColor: "var(--border)" }}>
              <input
                type="color"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                className="h-6 w-6 cursor-pointer rounded border-0"
              />
              <button
                type="button"
                onClick={() => { onCustom(custom); setOpen(false); }}
                className="flex-1 cursor-pointer rounded px-1 py-0.5 text-xs font-medium"
                style={{ background: "var(--accent)", color: "#fff", borderRadius: "var(--radius-md)" }}
              >
                Custom
              </button>
            </div>
          )}
          {onClear && (
            <button
              type="button"
              onClick={() => { onClear(); setOpen(false); }}
              className="mt-1 w-full cursor-pointer rounded px-1 py-0.5 text-xs font-medium"
              style={{ background: "var(--surface)", color: "var(--text-secondary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}
            >
              {clearLabel ?? "Clear"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Highlight button with swatch popover
function HighlightPicker({
  editor,
  current,
}: {
  editor: Editor;
  current?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label="Highlight color"
        title="Highlight color"
        onClick={() => setOpen((o) => !o)}
        className="flex h-7 w-7 cursor-pointer flex-col items-center justify-center gap-0.5"
        style={{
          borderRadius: "var(--radius-md)",
          background: editor.isActive("highlight") ? "var(--accent-muted)" : open ? "var(--accent-muted)" : "transparent",
          color: editor.isActive("highlight") ? "var(--accent)" : "var(--text-secondary)",
        }}
      >
        <span className="text-xs font-bold leading-none" style={{ color: "var(--foreground)" }}>H</span>
        <span
          className="h-1 w-5 rounded-full"
          style={{ background: current ?? "#fef08a" }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 rounded-xl border p-2 shadow-lg"
          style={{ background: "var(--surface-2)", borderColor: "var(--border)", minWidth: "8rem" }}
        >
          <div className="grid grid-cols-4 gap-1">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => {
                  editor.chain().focus().setHighlight({ color: c }).run();
                  setOpen(false);
                }}
                className="h-6 w-6 cursor-pointer rounded-md border-2"
                style={{ background: c, borderColor: "transparent" }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => { editor.chain().focus().unsetHighlight().run(); setOpen(false); }}
            className="mt-1 w-full cursor-pointer rounded px-1 py-0.5 text-xs font-medium"
            style={{ background: "var(--surface)", color: "var(--text-secondary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

// Custom bullet picker
function BulletPicker({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");

  function applyBullet(char: string) {
    if (!editor.isActive("bulletList")) {
      editor.chain().focus().toggleBulletList().run();
    }
    editor.chain().focus().setCustomBullet(char).run();
    setOpen(false);
  }

  return (
    <div className="relative shrink-0">
      <ToolbarButton
        label="Custom bullet"
        active={editor.isActive("bulletList")}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="9" y1="6" x2="20" y2="6" />
          <line x1="9" y1="12" x2="20" y2="12" />
          <line x1="9" y1="18" x2="20" y2="18" />
          <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </ToolbarButton>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 rounded-xl border p-2 shadow-lg"
          style={{ background: "var(--surface-2)", borderColor: "var(--border)", minWidth: "13rem" }}
        >
          <p className="mb-1.5 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Bullet style</p>
          <div className="mb-2 flex flex-wrap gap-1">
            {BULLET_PRESETS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => applyBullet(b)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-base"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  transition: "background var(--transition-fast)",
                }}
              >
                {b}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 border-t pt-2" style={{ borderColor: "var(--border)" }}>
            <input
              type="text"
              maxLength={2}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Custom…"
              className="min-w-0 flex-1 rounded border px-2 py-1 text-xs outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
            />
            <button
              type="button"
              disabled={!custom.trim()}
              onClick={() => applyBullet(custom.trim())}
              className="cursor-pointer rounded px-2 py-1 text-xs font-semibold disabled:opacity-40"
              style={{ background: "var(--accent)", color: "#fff", borderRadius: "var(--radius-md)" }}
            >
              Apply
            </button>
          </div>
          <button
            type="button"
            onClick={() => { editor.chain().focus().unsetCustomBullet().run(); setOpen(false); }}
            className="mt-1 w-full cursor-pointer rounded px-1 py-0.5 text-xs font-medium"
            style={{ background: "var(--surface)", color: "var(--text-secondary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}
          >
            Reset to default
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main toolbar ─────────────────────────────────────────
export function NoteToolbar({ editor }: NoteToolbarProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkDialogDefaults, setLinkDialogDefaults] = useState({
    value: "https://",
    isEditing: false,
  });
  const savedSelection = useRef<SavedSelection | null>(null);

  if (!editor) return null;

  function openLinkDialog() {
    const { from, to } = editor!.state.selection;
    savedSelection.current = { from, to };
    const href = editor!.getAttributes("link").href as string | undefined;
    setLinkDialogDefaults({ value: href ?? "https://", isEditing: editor!.isActive("link") });
    setLinkDialogOpen(true);
  }

  function closeLinkDialog() {
    savedSelection.current = null;
    setLinkDialogOpen(false);
  }

  function applyLink(url?: string) {
    if (!editor) return;
    const selection = savedSelection.current ?? {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
    };
    const chain = editor.chain().focus().setTextSelection(selection);
    if (!url?.trim()) {
      chain.extendMarkRange("link").unsetLink().run();
      closeLinkDialog();
      return;
    }
    const href = normalizeHref(url);
    const hasSelection = selection.from !== selection.to;
    const applied = hasSelection
      ? chain.extendMarkRange("link").setLink({ href }).run()
      : chain.insertContent([{ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] }]).run();
    if (!applied) console.error("Failed to apply link", href);
    closeLinkDialog();
  }

  // Derive current values from editor state
  const currentFont = (editor.getAttributes("textStyle").fontFamily as string | undefined) ?? FONT_OPTIONS[0].value;
  const currentColor = (editor.getAttributes("textStyle").color as string | undefined);
  const currentSpacing = (editor.getAttributes("paragraph").lineHeight as string | undefined) ?? LINE_SPACING_OPTIONS[1].value;

  return (
    <>
      {/* ── Row 1: heading, basic formatting, lists ── */}
      <div
        className="flex flex-wrap items-center gap-0.5 border-b px-3 py-1.5"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <ToolbarButton label="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <span className="text-xs font-bold">H1</span>
        </ToolbarButton>
        <ToolbarButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <span className="text-xs font-bold">H2</span>
        </ToolbarButton>
        <ToolbarButton label="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <span className="text-xs font-bold">H3</span>
        </ToolbarButton>

        <ToolbarSep />

        <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <span className="text-sm font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <span className="text-sm italic">I</span>
        </ToolbarButton>
        <ToolbarButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <span className="text-sm underline">U</span>
        </ToolbarButton>
        <ToolbarButton label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <span className="text-sm line-through">S</span>
        </ToolbarButton>
        <ToolbarButton label="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        </ToolbarButton>

        <ToolbarSep />

        <BulletPicker editor={editor} />
        <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
            <text x="3" y="8" fontSize="7" fill="currentColor" stroke="none">1</text>
            <text x="3" y="14" fontSize="7" fill="currentColor" stroke="none">2</text>
            <text x="3" y="20" fontSize="7" fill="currentColor" stroke="none">3</text>
          </svg>
        </ToolbarButton>
        <ToolbarButton label="Checklist" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </ToolbarButton>
        <ToolbarButton label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>
        </ToolbarButton>
        <ToolbarButton label="Link" active={editor.isActive("link")} onClick={openLinkDialog}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </ToolbarButton>

        <ToolbarSep />

        {/* Indent / outdent */}
        <ToolbarButton label="Decrease indent" onClick={() => editor.chain().focus().liftListItem("listItem").run()}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="7" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/><polyline points="7 9 3 12 7 15"/></svg>
        </ToolbarButton>
        <ToolbarButton label="Increase indent" onClick={() => editor.chain().focus().sinkListItem("listItem").run()}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="11" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/><polyline points="7 9 11 12 7 15"/></svg>
        </ToolbarButton>
      </div>

      {/* ── Row 2: font, color, alignment, spacing ── */}
      <div
        className="flex flex-wrap items-center gap-1.5 border-b px-3 py-1.5"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        {/* Font family */}
        <select
          aria-label="Font family"
          value={currentFont}
          onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
          className="h-7 cursor-pointer rounded border px-1 text-xs font-medium outline-none shrink-0"
          style={{
            width: "9rem",
            borderColor: "var(--border)",
            background: "var(--surface)",
            color: "var(--foreground)",
            fontFamily: currentFont,
          }}
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
              {f.label}
            </option>
          ))}
        </select>

        <ToolbarSep />

        {/* Text color */}
        <ColorPicker
          colors={COLORS}
          current={currentColor}
          label="Text color"
          onPick={(c) => editor.chain().focus().setColor(c).run()}
          onCustom={(c) => editor.chain().focus().setColor(c).run()}
          onClear={() => editor.chain().focus().unsetColor().run()}
          clearLabel="Default color"
        />

        {/* Highlight */}
        <HighlightPicker editor={editor} />

        <ToolbarSep />

        {/* Alignment */}
        <ToolbarButton label="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
        </ToolbarButton>
        <ToolbarButton label="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
        </ToolbarButton>
        <ToolbarButton label="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
        </ToolbarButton>
        <ToolbarButton label="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </ToolbarButton>

        <ToolbarSep />

        {/* Line spacing */}
        <div className="flex items-center gap-1 shrink-0">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-muted)" }}>
            <line x1="3" y1="5" x2="21" y2="5"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="19" x2="21" y2="19"/>
            <polyline points="7 2 3 5 7 8"/><polyline points="7 16 3 19 7 22"/>
          </svg>
          <ToolbarSelect
            label="Line spacing"
            value={currentSpacing}
            onChange={(v) => editor.chain().focus().setLineHeight(v).run()}
            options={LINE_SPACING_OPTIONS}
            width="4rem"
          />
        </div>
      </div>

      <NotesDialog
        open={linkDialogOpen}
        title={linkDialogDefaults.isEditing ? "Edit link" : "Add link"}
        description="Select text first, or leave unselected to insert the URL as a link."
        mode="prompt"
        defaultValue={linkDialogDefaults.value}
        placeholder="https://example.com"
        inputType="url"
        confirmLabel="Apply"
        secondaryLabel={linkDialogDefaults.isEditing ? "Remove link" : undefined}
        onClose={closeLinkDialog}
        onConfirm={applyLink}
      />
    </>
  );
}
