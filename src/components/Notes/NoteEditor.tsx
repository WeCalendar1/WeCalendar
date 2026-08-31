"use client";

import { useEffect, useRef } from "react";
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

type NoteEditorProps = {
  noteId: string;
  title: string;
  content: Json;
  onTitleChange: (title: string) => void;
  onContentChange: (content: Json) => void;
};

export function NoteEditor({
  noteId,
  title,
  content,
  onTitleChange,
  onContentChange,
}: NoteEditorProps) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastNoteId = useRef(noteId);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        blockquote: false,
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
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        onContentChange(ed.getJSON() as Json);
      }, 400);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (lastNoteId.current !== noteId) {
      lastNoteId.current = noteId;
      editor.commands.setContent((content ?? EMPTY_TIPTAP_DOC) as object);
    }
  }, [noteId, content, editor]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <NoteToolbar editor={editor} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Title"
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
