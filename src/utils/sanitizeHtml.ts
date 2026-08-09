import DOMPurify from "dompurify";

// Sanitize HTML produced by RichTextEditor (TipTap) before dangerouslySetInnerHTML —
// restreint aux balises que l'éditeur peut réellement produire (gras/italique/listes/liens).
export function sanitizeHtml(html?: string | null): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "b", "i", "u", "s", "ul", "ol", "li", "a"],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
}
