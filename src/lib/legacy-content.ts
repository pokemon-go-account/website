import { marked } from "marked";

/**
 * Heuristic check to determine if content string is already formatted as HTML.
 */
export function isLikelyHtml(content: string): boolean {
  if (!content || typeof content !== "string") return false;
  // Match standard HTML block or inline tags (<p, <h1, <div, <ul, <ol, <li, <blockquote, <table, <img, <a, <strong, <em, <span, <br, <hr)
  const htmlTagPattern = /<\/?(p|h[1-6]|div|ul|ol|li|blockquote|table|thead|tbody|tr|td|th|img|a|strong|b|em|i|span|br|hr)\b/i;
  return htmlTagPattern.test(content);
}

/**
 * Converts legacy pseudo-markdown content to clean, standard HTML string.
 */
export function convertLegacyContentToHtml(content: string): string {
  if (!content || typeof content !== "string") return "";
  
  if (isLikelyHtml(content)) {
    return content;
  }

  try {
    const rawHtml = marked.parse(content, { async: false }) as string;
    return rawHtml.trim();
  } catch (err) {
    console.error("[convertLegacyContentToHtml] Failed to parse markdown:", err);
    return content;
  }
}

import sanitizeHtml from "sanitize-html";

/**
 * Sanitizes an HTML string to safely render in public article views.
 */
export function sanitizeArticleHtml(html: string): string {
  if (!html || typeof html !== "string") return "";

  return sanitizeHtml(html, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "a", "img", "blockquote", "hr", "br",
      "ul", "ol", "li", "dl", "dt", "dd",
      "strong", "em", "b", "i", "code", "pre", "span", "div",
      "table", "thead", "tbody", "tfoot", "tr", "th", "td",
      "mark", "del", "ins", "sub", "sup"
    ],
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      "*": ["class", "id", "style"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel", "data"],
  });
}
