/**
 * Utilities for scrubbing CMS placeholder strings ("Editable in CMS...")
 * and triggering reliable client-side PDF resume downloads across desktop,
 * mobile, and sandboxed preview iframes.
 */

export function isEditablePlaceholder(value?: string | null): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /editable\s+in\s+cms/i.test(trimmed);
}

export function cleanDisplayText(value?: string | null): string {
  if (!value) return '';
  const cleaned = value
    .replace(/\(\s*editable\s+in\s+cms[^)]*\)/gi, '')
    .replace(/^editable\s+in\s+cms.*$/i, '')
    .trim();
  return isEditablePlaceholder(cleaned) ? '' : cleaned;
}

export function cleanDisplayList(items?: string[] | null): string[] {
  if (!Array.isArray(items)) return [];
  const result: string[] = [];
  for (const item of items) {
    if (typeof item !== 'string') continue;
    const cleaned = cleanDisplayText(item);
    if (cleaned.length > 0) {
      result.push(cleaned);
    }
  }
  return result;
}

/**
 * Downloads the verified curriculum vitae PDF via Fetch + Blob Object URL so
 * that sandboxed iframes and strict browsers trigger a clean file save dialog
 * without navigating away or failing silently.
 */
export async function downloadResumePdf(
  url = '/api/resume/download',
  filename = 'Alex_Rivera_Resume.pdf',
): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  const safeFilename = filename.trim() || 'Alex_Rivera_Resume.pdf';

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/pdf',
      },
    });

    if (!response.ok) {
      throw new Error(`Resume download failed with status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const objectUrl = window.URL.createObjectURL(pdfBlob);

    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = safeFilename;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();

    window.setTimeout(() => {
      try {
        if (anchor.parentNode) {
          anchor.parentNode.removeChild(anchor);
        }
        window.URL.revokeObjectURL(objectUrl);
      } catch {
        // Ignore cleanup errors
      }
    }, 2500);

    return true;
  } catch {
    // Fallback: trigger a direct anchor download if fetch fails
    try {
      const fallbackAnchor = document.createElement('a');
      fallbackAnchor.href = url;
      fallbackAnchor.download = safeFilename;
      fallbackAnchor.target = '_blank';
      fallbackAnchor.rel = 'noopener noreferrer';
      fallbackAnchor.style.display = 'none';
      document.body.appendChild(fallbackAnchor);
      fallbackAnchor.click();
      window.setTimeout(() => {
        if (fallbackAnchor.parentNode) {
          fallbackAnchor.parentNode.removeChild(fallbackAnchor);
        }
      }, 1000);
      return true;
    } catch {
      return false;
    }
  }
}
