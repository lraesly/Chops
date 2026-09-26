// Practice notes are HTML from the RichTextEditor (older sessions may be plain text).
// These helpers make them safe and readable wherever notes are shown.

const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'UL', 'OL', 'LI', 'BR', 'DIV', 'P', 'SPAN']);
const DROPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE']);

export const isHtmlNotes = (notes) => /<[a-z][\s\S]*>/i.test(notes || '');

// Keeps only the editor's own formatting tags, with no attributes; anything else is
// unwrapped to its text (or dropped entirely for script-like elements)
export function sanitizeNotesHtml(html) {
  const doc = new DOMParser().parseFromString(`<div>${html || ''}</div>`, 'text/html');
  const clean = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (DROPPED_TAGS.has(child.tagName)) {
          child.remove();
          continue;
        }
        clean(child);
        if (ALLOWED_TAGS.has(child.tagName)) {
          [...child.attributes].forEach((attr) => child.removeAttribute(attr.name));
        } else {
          child.replaceWith(...child.childNodes);
        }
      } else if (child.nodeType !== Node.TEXT_NODE) {
        child.remove();
      }
    }
  };
  const root = doc.body.firstChild;
  clean(root);
  return root.innerHTML;
}

// One-line plain-text version for previews
export function notesToText(notes) {
  if (!isHtmlNotes(notes)) return (notes || '').replace(/\s+/g, ' ').trim();
  const doc = new DOMParser().parseFromString(
    sanitizeNotesHtml(notes).replace(/<\/?(br|div|p|li|ul|ol)\b[^>]*>/gi, ' $&'),
    'text/html'
  );
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}
