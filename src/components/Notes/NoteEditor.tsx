"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Blockquote from "@tiptap/extension-blockquote";
import type { Json } from "@/types/database";
import { EMPTY_TIPTAP_DOC } from "@/lib/notes";
import { NoteToolbar } from "./NoteToolbar";

const SAVE_DEBOUNCE_MS = 500;

type NoteEditorProps = {
  noteId: string;
  title: string;
  content: Json;
  onDraftChange: (patch: { title?: string; content?: Json }) => void;
  onSave: (patch: { title?: string; content?: Json }) => void;
};

export function NoteEditor({
  noteId,
  title,
  content,
  onDraftChange,
  onSave,
}: NoteEditorProps) {
  const [localTitle, setLocalTitle] = useState(title);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<{ title?: string; content?: Json }>({});
  const lastNoteId = useRef(noteId);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const flushSave = () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (Object.keys(pendingSave.current).length === 0) return;
    const next = pendingSave.current;
    pendingSave.current = {};
    onSaveRef.current(next);
  };

  const queueSave = (patch: { title?: string; content?: Json }) => {
    pendingSave.current = { ...pendingSave.current, ...patch };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        blockquote: false,
        link: false,
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: "Start writing…" }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Blockquote,
    ],
    content: content as object,
    editorProps: {
      attributes: {
        class: "note-editor-content outline-none min-h-[50vh] px-6 py-4",
        spellcheck: "false",
        autocorrect: "off",
        autocapitalize: "off",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const nextContent = ed.getJSON() as Json;
      onDraftChange({ content: nextContent });
      queueSave({ content: nextContent });
    },
  });

  // Reset local draft only when switching notes.
  useEffect(() => {
    if (lastNoteId.current === noteId) return;

    flushSave();
    lastNoteId.current = noteId;
    setLocalTitle(title);
    editor?.commands.setContent((content ?? EMPTY_TIPTAP_DOC) as object);
  }, [noteId, title, content, editor]);

  useEffect(() => () => flushSave(), []);

  function handleTitleChange(nextTitle: string) {
    setLocalTitle(nextTitle);
    onDraftChange({ title: nextTitle });
    queueSave({ title: nextTitle });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <NoteToolbar editor={editor} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <input
          type="text"
          value={localTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Title"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          className="w-full border-none bg-transparent px-6 pt-6 text-2xl font-bold outline-none"
          style={{
            color: "var(--foreground)",
            fontFamily: "var(--font-varela-round, 'Varela Round', sans-serif)",
          }}
        />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
