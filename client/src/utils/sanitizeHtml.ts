import DOMPurify from 'dompurify';

const HTML_SANITIZE_CONFIG = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['style'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
};

export const sanitizeHtml = (value = '') =>
  DOMPurify.sanitize(String(value), HTML_SANITIZE_CONFIG);
