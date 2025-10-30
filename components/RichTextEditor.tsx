"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { useCallback, useEffect, useState } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
}: RichTextEditorProps) {
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
        // Disable strike since we're adding it manually with Underline
        strike: false,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-footy-orange hover:underline",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      TextStyle,
      Color,
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none min-h-[400px] p-4 focus:outline-none border border-gray-300 rounded-lg",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleImageUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        // Use fetch to upload to our API endpoint
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();
        editor?.chain().focus().setImage({ src: data.url }).run();
      } catch (error) {
        console.error("Image upload failed:", error);
        alert("Failed to upload image. Please try again or use the Images field below.");
      } finally {
        setUploading(false);
      }
    };

    input.click();
  }, [editor]);

  const addLink = useCallback(() => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive("bold")
                ? "bg-footy-green text-white"
                : "bg-white hover:bg-gray-100"
            }`}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive("italic")
                ? "bg-footy-green text-white"
                : "bg-white hover:bg-gray-100"
            }`}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive("underline")
                ? "bg-footy-green text-white"
                : "bg-white hover:bg-gray-100"
            }`}
            title="Underline"
          >
            <u>U</u>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive("strike")
                ? "bg-footy-green text-white"
                : "bg-white hover:bg-gray-100"
            }`}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
        </div>

        {/* Headings */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-3 py-1 rounded text-sm ${
              editor.isActive("heading", { level: 2 })
                ? "bg-footy-green text-white"
                : "bg-white hover:bg-gray-100"
            }`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-3 py-1 rounded text-sm ${
              editor.isActive("heading", { level: 3 })
                ? "bg-footy-green text-white"
                : "bg-white hover:bg-gray-100"
            }`}
            title="Heading 3"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`px-3 py-1 rounded text-sm ${
              editor.isActive("paragraph")
                ? "bg-footy-green text-white"
                : "bg-white hover:bg-gray-100"
            }`}
            title="Paragraph"
          >
            P
          </button>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive("bulletList")
                ? "bg-footy-green text-white"
                : "bg-white hover:bg-gray-100"
            }`}
            title="Bullet List"
          >
            •
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-1 rounded ${
              editor.isActive("orderedList")
                ? "bg-footy-green text-white"
                : "bg-white hover:bg-gray-100"
            }`}
            title="Numbered List"
          >
            1.
          </button>
        </div>

        {/* Alignment */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`px-3 py-1 rounded text-sm ${
              editor.isActive({ textAlign: "left" })
                ? "bg-footy-green text-white"
                : "bg-white hover:bg-gray-100"
            }`}
            title="Align Left"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`px-3 py-1 rounded text-sm ${
              editor.isActive({ textAlign: "center" })
                ? "bg-footy-green text-white"
                : "bg-white hover:bg-gray-100"
            }`}
            title="Align Center"
          >
            ↔
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`px-3 py-1 rounded text-sm ${
              editor.isActive({ textAlign: "right" })
                ? "bg-footy-green text-white"
                : "bg-white hover:bg-gray-100"
            }`}
            title="Align Right"
          >
            →
          </button>
        </div>

        {/* Insert */}
        <div className="flex gap-1 border-r border-gray-300 pr-2">
          <button
            type="button"
            onClick={addLink}
            className={`px-3 py-1 rounded text-sm ${
              editor.isActive("link")
                ? "bg-footy-green text-white"
                : "bg-white hover:bg-gray-100"
            }`}
            title="Add Link"
          >
            🔗
          </button>
          <button
            type="button"
            onClick={handleImageUpload}
            disabled={uploading}
            className="px-3 py-1 rounded text-sm bg-white hover:bg-gray-100 disabled:opacity-50"
            title="Upload Image"
          >
            {uploading ? "⏳" : "🖼️"}
          </button>
        </div>

        {/* Clear Formatting */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetAllMarks().run()}
            className="px-3 py-1 rounded text-sm bg-white hover:bg-gray-100"
            title="Clear Formatting"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
}
