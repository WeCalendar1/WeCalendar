import { describe, expect, it } from "vitest";
import {
  filterNotes,
  notePreviewText,
  noteTitle,
  searchNotes,
  sortNotesForList,
  type Note,
} from "./notes";

const baseNote = (overrides: Partial<Note> = {}): Note => ({
  id: "n1",
  group_id: "g1",
  folder_id: null,
  event_id: null,
  linked_date: null,
  title: "",
  content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hello world" }] }] },
  content_format: "tiptap",
  visibility: "shared",
  is_pinned: false,
  sort_order: 0,
  created_by: "u1",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
  ...overrides,
});

describe("notePreviewText", () => {
  it("extracts plain text from tiptap doc", () => {
    expect(notePreviewText(baseNote().content)).toBe("Hello world");
  });
});

describe("noteTitle", () => {
  it("uses title when set", () => {
    expect(noteTitle(baseNote({ title: "My Note" }))).toBe("My Note");
  });

  it("falls back to preview", () => {
    expect(noteTitle(baseNote())).toBe("Hello world");
  });
});

describe("filterNotes", () => {
  const notes = [
    baseNote({ id: "a", visibility: "shared", is_pinned: true }),
    baseNote({ id: "b", visibility: "private", is_pinned: false }),
    baseNote({ id: "c", visibility: "shared", folder_id: "f1" }),
  ];

  it("filters pinned", () => {
    expect(filterNotes(notes, { type: "pinned" }).map((n) => n.id)).toEqual(["a"]);
  });

  it("filters private", () => {
    expect(filterNotes(notes, { type: "private" }).map((n) => n.id)).toEqual(["b"]);
  });

  it("filters folder", () => {
    expect(filterNotes(notes, { type: "folder", folderId: "f1" }).map((n) => n.id)).toEqual(["c"]);
  });
});

describe("searchNotes", () => {
  it("matches title and body", () => {
    const notes = [
      baseNote({ id: "a", title: "Grocery list" }),
      baseNote({ id: "b", title: "", content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "reservation code" }] }] } }),
    ];
    expect(searchNotes(notes, "grocery").map((n) => n.id)).toEqual(["a"]);
    expect(searchNotes(notes, "reservation").map((n) => n.id)).toEqual(["b"]);
  });
});

describe("sortNotesForList", () => {
  it("pins first then by updated_at", () => {
    const notes = [
      baseNote({ id: "a", is_pinned: false, updated_at: "2026-01-03T00:00:00Z" }),
      baseNote({ id: "b", is_pinned: true, updated_at: "2026-01-01T00:00:00Z" }),
      baseNote({ id: "c", is_pinned: false, updated_at: "2026-01-02T00:00:00Z" }),
    ];
    expect(sortNotesForList(notes).map((n) => n.id)).toEqual(["b", "a", "c"]);
  });
});
