"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { forwardRef, useEffect, useImperativeHandle } from "react";

export interface RichTextEditorHandle {
  insertVariable: (name: string) => void;
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(function RichTextEditor(
  { value, onChange },
  ref
) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[220px] px-4 py-3 focus:outline-none dark:prose-invert",
      },
    },
  });

  useImperativeHandle(ref, () => ({
    insertVariable: (name: string) => {
      editor?.chain().focus().insertContent(`{{${name}}}`).run();
    },
  }), [editor]);

  // Resynchronise l'éditeur si la valeur change de l'extérieur (ex: bouton "Réinitialiser")
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-2 py-1.5">
        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} label="Gras">
          <strong>G</strong>
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} label="Italique">
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} label="Liste à puces">
          •
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="Liste numérotée">
          1.
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("link")}
          onClick={() => {
            const url = window.prompt("URL du lien :");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          label="Lien"
        >
          🔗
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} label="Effacer le format">
          ✕
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
});

export default RichTextEditor;

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`h-7 min-w-7 px-1.5 rounded text-xs font-medium transition-colors ${
        active
          ? "bg-brand-500 text-white"
          : "text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800"
      }`}
    >
      {children}
    </button>
  );
}
