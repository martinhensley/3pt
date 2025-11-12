"use client";

import { useEffect, useRef } from "react";

interface QuillEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function QuillEditor({
  content,
  onChange,
  placeholder = "Start writing...",
}: QuillEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (isInitializedRef.current) return;

    if (editorRef.current && !quillRef.current && typeof window !== 'undefined') {
      isInitializedRef.current = true;

      // Dynamically import Quill only on the client side
      import('quill').then((QuillModule) => {
        const Quill = QuillModule.default;

        // Dynamically import CSS
        import('quill/dist/quill.snow.css');

        // Initialize Quill
        const quill = new Quill(editorRef.current!, {
          theme: "snow",
          placeholder,
          modules: {
            toolbar: [
              [{ header: [2, 3, 4, false] }],
              ["bold", "italic", "underline", "strike"],
              [{ list: "ordered" }, { list: "bullet" }],
              [{ align: [] }],
              ["link", "image"],
              [{ color: [] }, { background: [] }],
              ["clean"],
            ],
          },
        });

        // Set initial content
        if (content) {
          quill.clipboard.dangerouslyPasteHTML(content);
        }

        // Handle text changes
        quill.on("text-change", () => {
          const html = quill.root.innerHTML;
          onChange(html);
        });

        quillRef.current = quill;
      });
    }

    return () => {
      // Only cleanup if we're actually unmounting (not just StrictMode re-render)
      if (quillRef.current && !isInitializedRef.current) {
        quillRef.current = null;
      }
    };
  }, []);

  // Update content when prop changes (but only if it's different from editor content)
  useEffect(() => {
    if (quillRef.current) {
      const currentContent = quillRef.current.root.innerHTML;
      if (content !== currentContent) {
        const selection = quillRef.current.getSelection();
        quillRef.current.clipboard.dangerouslyPasteHTML(content);
        if (selection) {
          quillRef.current.setSelection(selection);
        }
      }
    }
  }, [content]);

  return (
    <div className="quill-wrapper">
      <div ref={editorRef} />
      <style jsx global>{`
        .quill-wrapper {
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .quill-wrapper .ql-toolbar {
          background-color: #f9fafb;
          border: none;
          border-bottom: 1px solid #d1d5db;
        }

        .quill-wrapper .ql-container {
          border: none;
          font-size: 1rem;
          min-height: 400px;
        }

        .quill-wrapper .ql-editor {
          min-height: 400px;
          font-family: inherit;
        }

        .quill-wrapper .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }

        /* Active button styling */
        .quill-wrapper .ql-toolbar button.ql-active,
        .quill-wrapper .ql-toolbar .ql-picker-label.ql-active {
          color: #005031;
        }

        .quill-wrapper .ql-toolbar button:hover,
        .quill-wrapper .ql-toolbar .ql-picker-label:hover {
          color: #005031;
        }

        .quill-wrapper .ql-toolbar .ql-stroke {
          stroke: currentColor;
        }

        .quill-wrapper .ql-toolbar .ql-fill {
          fill: currentColor;
        }

        .quill-wrapper .ql-toolbar button.ql-active .ql-stroke,
        .quill-wrapper .ql-toolbar .ql-picker-label.ql-active .ql-stroke {
          stroke: #005031;
        }

        .quill-wrapper .ql-toolbar button.ql-active .ql-fill,
        .quill-wrapper .ql-toolbar .ql-picker-label.ql-active .ql-fill {
          fill: #005031;
        }
      `}</style>
    </div>
  );
}
