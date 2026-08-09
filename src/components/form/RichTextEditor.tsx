"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, Italic, List, ListOrdered, LinkIcon, Undo, Redo } from "lucide-react";

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  error?: boolean;
}

export default function RichTextEditor({ value, onChange, placeholder, error }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "min-h-[110px] px-4 py-2.5 text-sm text-[var(--text)] focus:outline-none [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:list-decimal [&_ol]:ps-5 [&_a]:text-[var(--brand)] [&_a]:underline",
        "data-placeholder": placeholder || "",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  if (!editor) return null;

  const toggle = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    fn();
  };

  const btnClass = (active: boolean) =>
    `p-1.5 rounded transition-colors ${active ? "bg-[var(--brand)]/15 text-[var(--brand)]" : "text-[var(--text-2)] hover:bg-[var(--surface-2)]"}`;

  return (
    <div
      className={`rounded-lg border ${error ? "border-[var(--rose)]" : "border-[var(--border-strong)]"} bg-[var(--surface)] focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[var(--brand)]/35 transition`}
    >
      <div className="flex items-center gap-0.5 border-b border-[var(--border-strong)] px-2 py-1.5">
        <button type="button" className={btnClass(editor.isActive("bold"))} onClick={toggle(() => editor.chain().focus().toggleBold().run())} title="Gras">
          <Bold size={15} strokeWidth={1.8} />
        </button>
        <button type="button" className={btnClass(editor.isActive("italic"))} onClick={toggle(() => editor.chain().focus().toggleItalic().run())} title="Italique">
          <Italic size={15} strokeWidth={1.8} />
        </button>
        <button type="button" className={btnClass(editor.isActive("bulletList"))} onClick={toggle(() => editor.chain().focus().toggleBulletList().run())} title="Liste à puces">
          <List size={15} strokeWidth={1.8} />
        </button>
        <button type="button" className={btnClass(editor.isActive("orderedList"))} onClick={toggle(() => editor.chain().focus().toggleOrderedList().run())} title="Liste numérotée">
          <ListOrdered size={15} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          className={btnClass(editor.isActive("link"))}
          onClick={toggle(() => {
            const url = window.prompt("URL du lien :", editor.getAttributes("link").href || "");
            if (url === null) return;
            if (url === "") {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
            } else {
              editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
            }
          })}
          title="Lien"
        >
          <LinkIcon size={15} strokeWidth={1.8} />
        </button>
        <span className="mx-1 h-4 w-px bg-[var(--border-strong)]" />
        <button type="button" className={btnClass(false)} onClick={toggle(() => editor.chain().focus().undo().run())} title="Annuler">
          <Undo size={15} strokeWidth={1.8} />
        </button>
        <button type="button" className={btnClass(false)} onClick={toggle(() => editor.chain().focus().redo().run())} title="Rétablir">
          <Redo size={15} strokeWidth={1.8} />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
