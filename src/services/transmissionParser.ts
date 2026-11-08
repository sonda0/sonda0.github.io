import { sanitizeUrl } from './dataValidation';

/**
 * Safe markdown parser and sanitizer for MISSION-CONTROL transmissions.
 * Avoids innerHTML injection vulnerabilities by using controlled regex transformations
 * and strictly sanitized link targets.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toISOString().replace('T', ' ').replace('.000Z', ' UTC').replace('Z', ' UTC');
  } catch {
    return isoString;
  }
}

export function formatTimeAgo(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Hace menos de 1 hora';
    if (diffHours === 1) return 'Hace 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Hace 1 día';
    return `Hace ${diffDays} días`;
  } catch {
    return '';
  }
}

/**
 * Render paragraphs containing Markdown formatting (bold, italic, links, code, math formulas)
 * into safe HTML tokens or plain clean elements.
 */
export function renderMarkdownParagraph(paragraph: string): string {
  // First escape raw HTML
  let escaped = escapeHtml(paragraph);

  // Bold: **text**
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-text-main font-semibold">$1</strong>');

  // Italic: *text* or _text_
  escaped = escaped.replace(/\*([^*]+)\*/g, '<em class="text-cyan-glow italic">$1</em>');

  // Inline code: `code`
  escaped = escaped.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-surface border border-border-panel text-cyan-glow font-mono text-xs">$1</code>');

  // Links: [text](url)
  escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const safeUrl = sanitizeUrl(url);
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-cyan-glow hover:underline hover:text-cyan-300 font-mono transition-colors">${label} ↗</a>`;
  });

  // LaTeX inline formulas: $formula$
  escaped = escaped.replace(/\$([^$]+)\$/g, '<span class="font-mono text-amber-telemetry px-1">$1</span>');

  return escaped;
}
