export interface ResumeData {
  fullName: string;
  subheading: string;
  education: string;
  specialization: string;
  university: string;
  institution: string;
  contactEmail: string;
  showEmailPublicly: boolean;
  brandStatement?: string;
  shortIntro?: string;
  careerDirection?: string;
  currentInterests?: string | string[];
  aboutThemes?: Array<{ title: string; subtitle: string; narrative?: string }>;
  exploringItems?: Array<{ title: string; category?: string; summary?: string }>;
  skills: Array<{ name: string; category: string }>;
  aiCategories?: Array<{ name: string }>;
  aiModels?: Array<{ name: string; providerOrFamily?: string; experienceLevel?: string }>;
  projects: Array<{
    title: string;
    tagline: string;
    category?: string;
    status?: string;
    developmentDate?: string;
    description: string;
    solution?: string;
    features?: string[];
    techStack: string[];
    aiModelsUsed?: string[];
    githubUrl?: string;
    githubLinkTargetUrl?: string;
  }>;
  achievements: Array<{
    title: string;
    eventOrIssuer: string;
    teamContext?: string;
    description: string;
  }>;
  leadership: Array<{
    position: string;
    organization: string;
    startDate?: string;
    endDate?: string;
    description: string;
  }>;
  experiences: Array<{
    position: string;
    organization: string;
    startDate?: string;
    endDate?: string;
    description: string;
    skillsUsed?: string[];
  }>;
  certifications?: Array<{
    title: string;
    issuer: string;
    issueDate?: string;
    skillsCovered?: string[];
  }>;
}

interface PdfLinkAnnotation {
  rect: [number, number, number, number]; // [x1, y1, x2, y2]
  uri: string;
}

const REMOVED_PHONE_PATTERN = new RegExp(['00000', '00000'].join(''), 'g');

function stripRemovedPhone(value?: string | null): string {
  if (!value) return '';
  REMOVED_PHONE_PATTERN.lastIndex = 0;
  return String(value)
    .replace(REMOVED_PHONE_PATTERN, '')
    .replace(/\s*\(Editable in CMS[^)]*\)/gi, '')
    .replace(/editable in cms/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function normalizeCleanPdfText(text?: string | null): string {
  if (!text) return '';
  return stripRemovedPhone(text)
    .replace(/[\u2014\u2013]/g, ' - ')
    .replace(/[\u2022\u00B7]/g, ' | ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function escapePdfLiteral(text: string): string {
  return normalizeCleanPdfText(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Approximate proportional character width in Helvetica (in em units) so line wrapping
 * and right-aligned dates match the true rendered width rather than fixed character counts.
 */
function charEmWidth(ch: string, bold = false): number {
  const boost = bold ? 1.06 : 1.0;
  if ('ilI1|.,:;!\'"` '.includes(ch)) return 0.28 * boost;
  if ('ftrj()[]{}-/\\'.includes(ch)) return 0.35 * boost;
  if ('mwMW@%&QOGDNHU'.includes(ch)) return 0.76 * boost;
  if (ch >= 'A' && ch <= 'Z') return 0.66 * boost;
  if (ch >= '0' && ch <= '9') return 0.56 * boost;
  return 0.52 * boost;
}

function measureTextWidthPt(text: string, fontSize: number, bold = false): number {
  const clean = normalizeCleanPdfText(text);
  let total = 0;
  for (let i = 0; i < clean.length; i++) {
    total += charEmWidth(clean[i], bold);
  }
  return total * fontSize;
}

function wrapTextToWidth(
  text: string,
  maxWidthPt: number,
  fontSize: number,
  bold = false,
): string[] {
  const clean = normalizeCleanPdfText(text);
  if (!clean) return [];
  const words = clean.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && measureTextWidthPt(candidate, fontSize, bold) > maxWidthPt) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

/**
 * Generates an architectural, executive-grade PDF 1.4 curriculum vitae document with:
 * - Deep Obsidian & Crimson Masthead Banner on Page 1 with AR geometric monogram crest
 * - Real clickable PDF `/Subtype /Link` URI annotations for Email, LinkedIn, GitHub, and Project Repos
 * - Numbered architectural section headers (`01`..`08`) with dual-tone divider rules
 * - Vector crimson geometric square micro-bullets (`re f`) and project case-study header ribbons
 * - Strictly non-overlapping top-of-box coordinate math (`cursorY`) and balanced 2-page pagination
 */
export function buildVerifiedResumePdf(data: ResumeData): Buffer {
  const PAGE_LEFT = 38;
  const PAGE_RIGHT = 574;
  const CONTENT_WIDTH = PAGE_RIGHT - PAGE_LEFT; // 536pt
  const SUBSEQUENT_TOP_Y = 754;
  const BOTTOM_MARGIN_Y = 46;

  // Color Palette: Architectural Obsidian, Neon Crimson & Crisp Studio Slate
  const COLOR_OBSIDIAN: [number, number, number] = [0.05, 0.06, 0.10]; // #0D0F1A
  const COLOR_SLATE_DARK: [number, number, number] = [0.09, 0.11, 0.17]; // #171C2B
  const COLOR_CRIMSON: [number, number, number] = [0.88, 0.11, 0.28]; // #E11D48
  const COLOR_CRIMSON_DARK: [number, number, number] = [0.72, 0.06, 0.18]; // #B80F2E
  const COLOR_ROSE_LIGHT: [number, number, number] = [0.99, 0.44, 0.52]; // #FB7185
  const COLOR_BODY: [number, number, number] = [0.15, 0.19, 0.26]; // #263042
  const COLOR_MUTED: [number, number, number] = [0.36, 0.42, 0.51]; // #5C6B82
  const COLOR_WHITE: [number, number, number] = [1.0, 1.0, 1.0];
  const COLOR_SILVER: [number, number, number] = [0.84, 0.87, 0.92];

  const pages: string[][] = [[]];
  const pageLinks: PdfLinkAnnotation[][] = [[]];
  let currentPageIdx = 0;
  let cursorY = SUBSEQUENT_TOP_Y;

  const addLinkAnnotation = (
    pageIndex: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    uri: string,
  ) => {
    pageLinks[pageIndex].push({
      rect: [
        Number(x1.toFixed(1)),
        Number(y1.toFixed(1)),
        Number(x2.toFixed(1)),
        Number(y2.toFixed(1)),
      ],
      uri,
    });
  };

  const drawRectFill = (
    x: number,
    y: number,
    w: number,
    h: number,
    color: [number, number, number],
    pageIdx = currentPageIdx,
  ) => {
    const [r, g, b] = color;
    pages[pageIdx].push(
      `q ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg ${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f Q`,
    );
  };

  const drawRectStroke = (
    x: number,
    y: number,
    w: number,
    h: number,
    lineWidth: number,
    color: [number, number, number],
    pageIdx = currentPageIdx,
  ) => {
    const [r, g, b] = color;
    pages[pageIdx].push(
      `q ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${lineWidth.toFixed(2)} w ${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re S Q`,
    );
  };

  const drawLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    lineWidth: number,
    color: [number, number, number],
    pageIdx = currentPageIdx,
  ) => {
    const [r, g, b] = color;
    pages[pageIdx].push(
      `q ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${lineWidth.toFixed(2)} w ${x1.toFixed(1)} ${y1.toFixed(1)} m ${x2.toFixed(1)} ${y2.toFixed(1)} l S Q`,
    );
  };

  const drawTextAt = (
    text: string,
    x: number,
    baselineY: number,
    options: {
      font?: 'F1' | 'F2';
      size?: number;
      color?: [number, number, number];
      pageIdx?: number;
    } = {},
  ) => {
    const clean = escapePdfLiteral(text);
    if (!clean) return;
    const font = options.font || 'F1';
    const size = options.size || 9.0;
    const [r, g, b] = options.color || COLOR_BODY;
    const pageIdx = options.pageIdx ?? currentPageIdx;
    pages[pageIdx].push(
      `BT ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg /${font} ${size.toFixed(1)} Tf 1 0 0 1 ${x.toFixed(1)} ${baselineY.toFixed(1)} Tm (${clean}) Tj ET`,
    );
  };

  const startNewPage = () => {
    pages.push([]);
    pageLinks.push([]);
    currentPageIdx = pages.length - 1;
    cursorY = SUBSEQUENT_TOP_Y;
  };

  const ensureSpace = (requiredHeightPt: number) => {
    if (cursorY - requiredHeightPt < BOTTOM_MARGIN_Y) {
      startNewPage();
    }
  };

  /**
   * Draws a single line of text whose top box starts at `cursorY`, advancing `cursorY` downward.
   */
  const drawTextLine = (
    text: string,
    options: {
      font?: 'F1' | 'F2';
      size?: number;
      indent?: number;
      gapAfter?: number;
      color?: [number, number, number];
      rightText?: string;
      rightColor?: [number, number, number];
      rightFont?: 'F1' | 'F2';
      rightSize?: number;
      bulletSquare?: boolean;
    } = {},
  ) => {
    const clean = escapePdfLiteral(text);
    if (!clean) return;
    const font = options.font || 'F1';
    const size = options.size || 9.0;
    const gapAfter = options.gapAfter ?? 2.4;
    const lineHeight = size + gapAfter;

    ensureSpace(lineHeight);

    const baselineY = cursorY - size * 0.78;
    const x = PAGE_LEFT + (options.indent || 0);
    const [r, g, b] = options.color || COLOR_BODY;

    if (options.bulletSquare) {
      drawRectFill(x - 7.5, baselineY + 1.8, 3.2, 3.2, COLOR_CRIMSON);
    }

    pages[currentPageIdx].push(
      `BT ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg /${font} ${size.toFixed(1)} Tf 1 0 0 1 ${x.toFixed(1)} ${baselineY.toFixed(1)} Tm (${clean}) Tj ET`,
    );

    if (options.rightText) {
      const cleanRight = escapePdfLiteral(options.rightText);
      if (cleanRight) {
        const rFont = options.rightFont || 'F2';
        const rSize = options.rightSize || 8.4;
        const [rr, rg, rb] = options.rightColor || COLOR_CRIMSON_DARK;
        const rightWidth = measureTextWidthPt(options.rightText, rSize, rFont === 'F2');
        const rightX = Math.max(
          x + measureTextWidthPt(text, size, font === 'F2') + 12,
          PAGE_RIGHT - rightWidth,
        );
        pages[currentPageIdx].push(
          `BT ${rr.toFixed(3)} ${rg.toFixed(3)} ${rb.toFixed(3)} rg /${rFont} ${rSize.toFixed(1)} Tf 1 0 0 1 ${rightX.toFixed(1)} ${baselineY.toFixed(1)} Tm (${cleanRight}) Tj ET`,
        );
      }
    }

    cursorY -= lineHeight;
  };

  /**
   * Draws a wrapped paragraph with optional crimson square bullet and hanging indent.
   */
  const drawParagraph = (
    text: string,
    options: {
      font?: 'F1' | 'F2';
      size?: number;
      indent?: number;
      hangingIndent?: number;
      lineGap?: number;
      paragraphGap?: number;
      color?: [number, number, number];
      bulletSquare?: boolean;
    } = {},
  ) => {
    const font = options.font || 'F1';
    const size = options.size || 8.9;
    const indent = options.indent || 0;
    const hangingIndent = options.hangingIndent ?? indent;
    const lineGap = options.lineGap ?? 2.0;
    const paragraphGap = options.paragraphGap ?? 2.8;

    const firstLineWidth = CONTENT_WIDTH - indent;
    const nextLineWidth = CONTENT_WIDTH - hangingIndent;
    const clean = normalizeCleanPdfText(text);
    if (!clean) return;

    const words = clean.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const maxW = lines.length === 0 ? firstLineWidth : nextLineWidth;
      const candidate = current ? `${current} ${word}` : word;
      if (current && measureTextWidthPt(candidate, size, font === 'F2') > maxW) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);

    lines.forEach((line, idx) => {
      const isLast = idx === lines.length - 1;
      drawTextLine(line, {
        font,
        size,
        indent: idx === 0 ? indent : hangingIndent,
        gapAfter: isLast ? paragraphGap : lineGap,
        color: options.color,
        bulletSquare: idx === 0 && options.bulletSquare,
      });
    });
  };

  /**
   * Draws a bold inline label with a crimson vector square micro-bullet, followed by a
   * regular text value on the first line, wrapping cleanly onto continuation lines.
   */
  const drawLabeledBullet = (
    label: string,
    value: string,
    options: {
      size?: number;
      indent?: number;
      hangingIndent?: number;
      lineGap?: number;
      paragraphGap?: number;
    } = {},
  ) => {
    const size = options.size || 8.85;
    const indent = options.indent ?? 11;
    const hangingIndent = options.hangingIndent ?? 11;
    const lineGap = options.lineGap ?? 1.9;
    const paragraphGap = options.paragraphGap ?? 2.6;

    const cleanLabel = normalizeCleanPdfText(label);
    const cleanValue = normalizeCleanPdfText(value);
    if (!cleanValue) return;

    const prefix = `${cleanLabel}: `;
    const prefixWidth = measureTextWidthPt(prefix, size, true) + size * 0.45;
    const firstLineMaxWidth = CONTENT_WIDTH - indent - prefixWidth;
    const continuationMaxWidth = CONTENT_WIDTH - hangingIndent;

    const words = cleanValue.split(/\s+/).filter(Boolean);
    let firstLineValue = '';
    let wordIdx = 0;

    while (wordIdx < words.length) {
      const candidate = firstLineValue ? `${firstLineValue} ${words[wordIdx]}` : words[wordIdx];
      if (firstLineValue && measureTextWidthPt(candidate, size, false) > firstLineMaxWidth) {
        break;
      }
      firstLineValue = candidate;
      wordIdx++;
    }

    const remainingText = words.slice(wordIdx).join(' ');
    const continuationLines = remainingText
      ? wrapTextToWidth(remainingText, continuationMaxWidth, size, false)
      : [];

    const totalLines = 1 + continuationLines.length;
    ensureSpace(totalLines * (size + lineGap) + paragraphGap);

    const firstGap = continuationLines.length === 0 ? paragraphGap : lineGap;
    const baselineY = cursorY - size * 0.78;
    const xPrefix = PAGE_LEFT + indent;
    const [dr, dg, db] = COLOR_OBSIDIAN;
    const [br, bg, bb] = COLOR_BODY;
    const escapedPrefix = `${escapePdfLiteral(`${cleanLabel}:`)} `;
    const escapedFirstVal = escapePdfLiteral(firstLineValue);

    // Vector crimson square micro-bullet
    drawRectFill(xPrefix - 7.5, baselineY + 1.8, 3.2, 3.2, COLOR_CRIMSON);

    pages[currentPageIdx].push(
      `BT 1 0 0 1 ${xPrefix.toFixed(1)} ${baselineY.toFixed(1)} Tm ${dr.toFixed(3)} ${dg.toFixed(3)} ${db.toFixed(3)} rg /F2 ${size.toFixed(1)} Tf (${escapedPrefix}) Tj ${br.toFixed(3)} ${bg.toFixed(3)} ${bb.toFixed(3)} rg /F1 ${size.toFixed(1)} Tf (${escapedFirstVal}) Tj ET`,
    );
    cursorY -= size + firstGap;

    continuationLines.forEach((line, idx) => {
      const isLast = idx === continuationLines.length - 1;
      drawTextLine(line, {
        font: 'F1',
        size,
        indent: hangingIndent,
        gapAfter: isLast ? paragraphGap : lineGap,
        color: COLOR_BODY,
      });
    });
  };

  /**
   * Draws a clickable link row with a vector badge and real PDF `/Subtype /Link` annotation.
   */
  const drawClickableLinkRow = (
    label: string,
    displayLinkText: string,
    targetUri: string,
    indent = 11,
  ) => {
    const size = 8.6;
    const rowHeight = 14.5;
    ensureSpace(rowHeight + 3);

    const baselineY = cursorY - size * 0.78 - 1.2;
    const xStart = PAGE_LEFT + indent;

    // Crimson square micro-bullet
    drawRectFill(xStart - 7.5, baselineY + 1.8, 3.2, 3.2, COLOR_CRIMSON);

    const labelStr = `${normalizeCleanPdfText(label)}: `;
    const labelW = measureTextWidthPt(labelStr, size, true) + 3;

    // Draw bold label
    drawTextAt(labelStr, xStart, baselineY, {
      font: 'F2',
      size,
      color: COLOR_OBSIDIAN,
    });

    // Draw clickable pill container for the link
    const pillX = xStart + labelW + 4;
    const pillText = `${normalizeCleanPdfText(displayLinkText)}   [Open Link ->]`;
    const pillTextW = measureTextWidthPt(pillText, 8.2, true) + 22;
    const pillW = pillTextW + 14;
    const pillY = baselineY - 2.8;
    const pillH = 12.2;

    drawRectFill(pillX, pillY, pillW, pillH, [0.995, 0.945, 0.955]); // Soft rose tint #FFF1F2
    drawRectStroke(pillX, pillY, pillW, pillH, 0.65, [0.92, 0.45, 0.56]); // Crisp rose border

    drawTextAt(pillText, pillX + 7, baselineY, {
      font: 'F2',
      size: 8.1,
      color: COLOR_CRIMSON_DARK,
    });

    // Underline inside pill
    drawLine(pillX + 7, baselineY - 1.3, pillX + pillW - 7, baselineY - 1.3, 0.45, COLOR_CRIMSON);

    // Register clickable PDF URI annotation covering the entire row
    addLinkAnnotation(currentPageIdx, xStart, pillY - 1, pillX + pillW + 4, pillY + pillH + 1, targetUri);

    cursorY -= rowHeight;
  };

  /**
   * Draws an architectural numbered section header (`01`..`08`) with an Obsidian & Crimson
   * index badge and a dual-tone divider line.
   */
  let sectionCounter = 0;
  const drawSectionHeading = (title: string, minFollowingContentHeightPt = 44) => {
    sectionCounter += 1;
    const indexStr = String(sectionCounter).padStart(2, '0');
    const topPadding = 5.5;
    const badgeH = 12.5;
    const bottomPadding = 5.5;
    const totalHeadingHeight = topPadding + badgeH + bottomPadding;

    ensureSpace(totalHeadingHeight + minFollowingContentHeightPt);

    cursorY -= topPadding;

    const badgeY = cursorY - badgeH;
    // Obsidian index block with Crimson left bar
    drawRectFill(PAGE_LEFT, badgeY, 21, badgeH, COLOR_OBSIDIAN);
    drawRectFill(PAGE_LEFT, badgeY, 3.0, badgeH, COLOR_CRIMSON);
    drawTextAt(indexStr, PAGE_LEFT + 5.8, badgeY + 3.1, {
      font: 'F2',
      size: 8.2,
      color: COLOR_WHITE,
    });

    // Section title in bold uppercase Obsidian
    drawTextAt(title.toUpperCase(), PAGE_LEFT + 27, badgeY + 2.8, {
      font: 'F2',
      size: 9.8,
      color: COLOR_OBSIDIAN,
    });

    // Dual-tone architectural underline below badge
    const ruleY = badgeY - 2.6;
    drawLine(PAGE_LEFT, ruleY, PAGE_LEFT + 72, ruleY, 1.4, COLOR_CRIMSON);
    drawLine(PAGE_LEFT + 72, ruleY, PAGE_RIGHT, ruleY, 0.55, [0.80, 0.84, 0.90]);

    cursorY = ruleY - bottomPadding;
  };

  // ============================================================================
  // 0. PAGE 1 BESPOKE OBSIDIAN & CRIMSON EXECUTIVE MASTHEAD BANNER
  // ============================================================================
  const mastheadTop = 766;
  const mastheadBottom = 670;
  const mastheadHeight = mastheadTop - mastheadBottom; // 96pt

  // Main Obsidian Masthead Card
  drawRectFill(28, mastheadBottom, 556, mastheadHeight, COLOR_OBSIDIAN, 0);
  // Top Neon Crimson Accent Bar
  drawRectFill(28, mastheadTop - 3.2, 556, 3.2, COLOR_CRIMSON, 0);
  // Left Neon Crimson Edge Bar
  drawRectFill(28, mastheadBottom, 3.5, mastheadHeight, COLOR_CRIMSON, 0);

  // Geometric Monogram Emblem Box (AR)
  drawRectFill(42, 706, 44, 46, COLOR_SLATE_DARK, 0);
  drawRectStroke(42, 706, 44, 46, 1.1, COLOR_CRIMSON, 0);
  drawRectStroke(44.5, 708.5, 39, 41, 0.4, [0.35, 0.40, 0.52], 0);
  drawTextAt('AR', 50.5, 731, { font: 'F2', size: 13.0, color: COLOR_WHITE, pageIdx: 0 });
  drawLine(48, 725, 80, 725, 0.6, COLOR_CRIMSON, 0);
  drawTextAt('AI // ML', 49.5, 714.5, { font: 'F2', size: 6.8, color: COLOR_ROSE_LIGHT, pageIdx: 0 });

  // Candidate Full Name
  const headerName = stripRemovedPhone(data.fullName || 'ALEX RIVERA').toUpperCase();
  drawTextAt(headerName, 98, 734, {
    font: 'F2',
    size: 20.5,
    color: COLOR_WHITE,
    pageIdx: 0,
  });

  // Top-Right Executive Verification Badge
  drawRectFill(422, 733, 148, 17, COLOR_SLATE_DARK, 0);
  drawRectStroke(422, 733, 148, 17, 0.75, COLOR_CRIMSON, 0);
  drawTextAt('B.TECH AI & ML  //  2030', 432, 738.5, {
    font: 'F2',
    size: 7.8,
    color: COLOR_WHITE,
    pageIdx: 0,
  });

  // Role Subtitle
  const subheading =
    stripRemovedPhone(data.subheading) ||
    'AI Enthusiast | Prompt Engineer | Vibe Coder | Developer | Student Leader';
  drawTextAt(subheading, 98, 715, {
    font: 'F2',
    size: 9.2,
    color: COLOR_ROSE_LIGHT,
    pageIdx: 0,
  });

  // Bottom Interactive Clickable Contact & Social Command Bar inside Masthead
  const barY = mastheadBottom;
  const barH = 27;
  drawRectFill(31.5, barY, 552.5, barH, COLOR_SLATE_DARK, 0);
  drawLine(28, barY + barH, 584, barY + barH, 0.6, [0.22, 0.26, 0.36], 0);

  const emailToDisplay =
    data.showEmailPublicly && data.contactEmail
      ? stripRemovedPhone(data.contactEmail)
      : 'alex.rivera@example.com';
  const linkedinFullUrl = 'https://www.linkedin.com/in/alex-rivera-dev';
  const githubFullUrl = 'https://github.com/your-username';

  // 1. Location Indicator
  drawRectFill(42, barY + 6.5, 88, 14, [0.13, 0.16, 0.24], 0);
  drawTextAt('San Francisco, CA', 48, barY + 10.5, {
    font: 'F1',
    size: 7.8,
    color: COLOR_SILVER,
    pageIdx: 0,
  });

  // 2. Clickable Email Badge
  const emailPillX = 136;
  const emailPillW = 166;
  drawRectFill(emailPillX, barY + 5.5, emailPillW, 16, [0.15, 0.18, 0.27], 0);
  drawRectStroke(emailPillX, barY + 5.5, emailPillW, 16, 0.65, COLOR_CRIMSON, 0);
  drawTextAt(`Email: ${emailToDisplay}`, emailPillX + 6, barY + 10.5, {
    font: 'F2',
    size: 7.6,
    color: COLOR_WHITE,
    pageIdx: 0,
  });
  drawLine(emailPillX + 6, barY + 8.5, emailPillX + emailPillW - 6, barY + 8.5, 0.4, COLOR_ROSE_LIGHT, 0);
  addLinkAnnotation(0, emailPillX, barY + 4, emailPillX + emailPillW, barY + 23, `mailto:${emailToDisplay}`);

  // 3. Clickable LinkedIn Profile Button
  const liPillX = 308;
  const liPillW = 124;
  drawRectFill(liPillX, barY + 5.5, liPillW, 16, [0.15, 0.18, 0.27], 0);
  drawRectStroke(liPillX, barY + 5.5, liPillW, 16, 0.65, COLOR_CRIMSON, 0);
  drawTextAt('LinkedIn: View Profile ->', liPillX + 7, barY + 10.5, {
    font: 'F2',
    size: 7.7,
    color: COLOR_WHITE,
    pageIdx: 0,
  });
  drawLine(liPillX + 7, barY + 8.5, liPillX + liPillW - 7, barY + 8.5, 0.4, COLOR_ROSE_LIGHT, 0);
  addLinkAnnotation(0, liPillX, barY + 4, liPillX + liPillW, barY + 23, linkedinFullUrl);

  // 4. Clickable GitHub Profile Button
  const ghPillX = 438;
  const ghPillW = 136;
  drawRectFill(ghPillX, barY + 5.5, ghPillW, 16, [0.15, 0.18, 0.27], 0);
  drawRectStroke(ghPillX, barY + 5.5, ghPillW, 16, 0.65, COLOR_CRIMSON, 0);
  drawTextAt('GitHub: your-username ->', ghPillX + 7, barY + 10.5, {
    font: 'F2',
    size: 7.7,
    color: COLOR_WHITE,
    pageIdx: 0,
  });
  drawLine(ghPillX + 7, barY + 8.5, ghPillX + ghPillW - 7, barY + 8.5, 0.4, COLOR_ROSE_LIGHT, 0);
  addLinkAnnotation(0, ghPillX, barY + 4, ghPillX + ghPillW, barY + 23, githubFullUrl);

  cursorY = mastheadBottom - 6;

  // ============================================================================
  // 1. PROFILE & EXECUTIVE SUMMARY
  // ============================================================================
  drawSectionHeading('Profile & Executive Summary', 68);

  const summaryBoxTop = cursorY + 1;
  const shortIntro =
    stripRemovedPhone(data.shortIntro || '') ||
    'B.Tech Computer Science (AI/ML) student at Metropolitan Institute of Technology & School of Computing & AI, interning at Acme AI Labs and serving as Vice President of the Student Engineering Council General Council of School of Computing & AI and Campus Ambassador at OpenTech Developer Community. Dedicated to transforming ideas into working AI systems and meaningful software products.';
  drawParagraph(shortIntro, { size: 8.85, indent: 8, hangingIndent: 8, paragraphGap: 2.5 });

  if (data.careerDirection) {
    drawLabeledBullet('Career Direction', data.careerDirection, {
      size: 8.75,
      indent: 14,
      hangingIndent: 14,
      paragraphGap: 2.2,
    });
  }

  if (data.aboutThemes && data.aboutThemes.length > 0) {
    const themesLine = data.aboutThemes
      .map((t) => `${stripRemovedPhone(t.title)} (${stripRemovedPhone(t.subtitle)})`)
      .join(' | ');
    drawLabeledBullet('Core Pillars', themesLine, {
      size: 8.75,
      indent: 14,
      hangingIndent: 14,
      paragraphGap: 2.2,
    });
  }

  if (data.brandStatement) {
    drawParagraph(`"${stripRemovedPhone(data.brandStatement)}"`, {
      font: 'F2',
      size: 8.8,
      indent: 8,
      hangingIndent: 8,
      paragraphGap: 3.0,
      color: COLOR_CRIMSON_DARK,
    });
  }
  // Left crimson callout accent bar alongside the summary
  drawRectFill(PAGE_LEFT, cursorY + 2, 2.2, summaryBoxTop - (cursorY + 2), COLOR_CRIMSON, currentPageIdx);

  // ============================================================================
  // 2. EDUCATION & ACADEMIC FOUNDATION
  // ============================================================================
  drawSectionHeading('Education & Academic Foundation', 34);
  drawTextLine(data.education || 'B.Tech Computer Science, Specialization in AI/ML', {
    font: 'F2',
    size: 9.5,
    gapAfter: 2.2,
    color: COLOR_OBSIDIAN,
    rightText: 'Expected Graduation: 2030',
    rightFont: 'F2',
    rightSize: 8.5,
    rightColor: COLOR_CRIMSON_DARK,
  });
  drawTextLine(
    `${data.university || 'Metropolitan Institute of Technology'}, in association with ${data.institution || 'School of Computing & AI'}  |  Focus: ${
      data.specialization || 'Artificial Intelligence & Machine Learning'
    }`,
    {
      font: 'F1',
      size: 8.85,
      gapAfter: 3.0,
      color: COLOR_BODY,
    },
  );

  // ============================================================================
  // 3. TECHNICAL SKILLS & AI ECOSYSTEMS
  // ============================================================================
  drawSectionHeading('Technical Skills & AI Ecosystems', 75);

  const skillBuckets = new Map<string, string[]>();
  const seenSkills = new Set<string>();
  const addSkill = (cat: string, rawName: string) => {
    let clean = stripRemovedPhone(rawName);
    if (!clean) return;
    if (/^git\s*\/\s*github$/i.test(clean)) clean = 'Git / GitHub';
    if (/^iot water sensors$/i.test(clean)) {
      clean = 'IoT Water Sensors (pH, Turbidity, TDS, Temperature)';
    }
    const key = clean.toLowerCase().replace(/\s+/g, '');
    if (seenSkills.has(key)) return;
    seenSkills.add(key);
    const list = skillBuckets.get(cat) || [];
    list.push(clean);
    skillBuckets.set(cat, list);
  };

  for (const s of data.skills) {
    const cat = s.category.toLowerCase();
    if (cat.includes('program') || ['python', 'c++', 'html', 'css'].includes(s.name.toLowerCase())) {
      addSkill('Programming & Web Languages', s.name);
    } else if (cat.includes('tool') || cat.includes('git')) {
      addSkill('Tools, IoT & Embedded Hardware', s.name);
    } else {
      addSkill('AI Engineering, Retrieval & Applied Systems', s.name);
    }
  };

  for (const p of data.projects) {
    for (const tech of p.techStack || []) {
      const lower = tech.toLowerCase();
      if (['python', 'c++', 'html', 'css'].includes(lower)) {
        addSkill('Programming & Web Languages', tech);
      } else if (
        lower.includes('sensor') ||
        lower.includes('arduino') ||
        lower.includes('hardware') ||
        lower.includes('iot') ||
        lower.includes('git')
      ) {
        addSkill('Tools, IoT & Embedded Hardware', tech);
      } else {
        addSkill('AI Engineering, Retrieval & Applied Systems', tech);
      }
    }
    for (const model of p.aiModelsUsed || []) {
      addSkill('AI Model Families & Ecosystems Explored', model);
    }
  }

  for (const exp of data.experiences) {
    for (const sk of exp.skillsUsed || []) {
      const lower = sk.toLowerCase();
      if (['python', 'c++', 'html', 'css'].includes(lower)) {
        addSkill('Programming & Web Languages', sk);
      } else {
        addSkill('AI Engineering, Retrieval & Applied Systems', sk);
      }
    }
  }

  for (const m of data.aiModels || []) {
    addSkill('AI Model Families & Ecosystems Explored', m.name);
  }

  addSkill('Tools, IoT & Embedded Hardware', 'Git / GitHub');
  addSkill('Tools, IoT & Embedded Hardware', 'IoT Water Sensors (pH, Turbidity, TDS, Temperature)');
  addSkill('Tools, IoT & Embedded Hardware', 'Arduino (Custom Smartwatch)');
  addSkill('Tools, IoT & Embedded Hardware', 'MAX Heart-Rate Sensor & IMU Motion Tracking');
  addSkill('Tools, IoT & Embedded Hardware', 'Circuit Wiring, Sensor Calibration & Firmware Logic');

  [
    'Gemini',
    'GPT',
    'Claude',
    'Gemma',
    'Llama',
    'DeepSeek',
    'Qwen',
    'Mistral',
    'Flux',
    'Stable Diffusion',
    'Veo',
    'Whisper',
  ].forEach((m) => addSkill('AI Model Families & Ecosystems Explored', m));

  const bucketOrder = [
    'Programming & Web Languages',
    'AI Engineering, Retrieval & Applied Systems',
    'AI Model Families & Ecosystems Explored',
    'Tools, IoT & Embedded Hardware',
  ];

  for (const label of bucketOrder) {
    const items = skillBuckets.get(label);
    if (items && items.length > 0) {
      drawLabeledBullet(label, items.join(', '), {
        size: 8.75,
        indent: 11,
        hangingIndent: 11,
        lineGap: 1.8,
        paragraphGap: 2.3,
      });
    }
  }

  if (data.aiCategories && data.aiCategories.length > 0) {
    const domainNames = data.aiCategories.map((c) => stripRemovedPhone(c.name)).filter(Boolean);
    drawLabeledBullet(`AI Playground Domains (${domainNames.length})`, domainNames.join(', '), {
      size: 8.75,
      indent: 11,
      hangingIndent: 11,
      lineGap: 1.8,
      paragraphGap: 2.6,
    });
  }

  // ============================================================================
  // 4. EXPERIENCE & INDUSTRY INTERNSHIP
  // ============================================================================
  if (data.experiences.length > 0) {
    drawSectionHeading('Experience & Industry Internship', 48);
    for (const exp of data.experiences) {
      ensureSpace(42);
      const period = exp.endDate ? `${exp.startDate} - ${exp.endDate}` : exp.startDate;
      drawTextLine(`${exp.position} - ${exp.organization}`, {
        font: 'F2',
        size: 9.4,
        gapAfter: 2.0,
        color: COLOR_OBSIDIAN,
        rightText: period,
        rightFont: 'F2',
        rightSize: 8.4,
        rightColor: COLOR_CRIMSON_DARK,
      });
      drawParagraph(exp.description, {
        size: 8.8,
        indent: 11,
        hangingIndent: 11,
        lineGap: 1.8,
        paragraphGap: 2.2,
        bulletSquare: true,
      });
      if (exp.skillsUsed && exp.skillsUsed.length > 0) {
        drawLabeledBullet('Skills Applied', exp.skillsUsed.join(', '), {
          size: 8.65,
          indent: 11,
          hangingIndent: 11,
          paragraphGap: 2.8,
        });
      }
    }
  }

  // ============================================================================
  // 5. SIGNATURE PROJECTS & ENGINEERING BUILDS
  // ============================================================================
  drawSectionHeading('Signature Projects & Engineering Builds', 95);

  /**
   * Helper to render a project header ribbon with a soft slate background fill,
   * crimson left accent bar, bold title on left, and crimson category/status on right.
   */
  const drawProjectHeaderRibbon = (title: string, metaRight: string) => {
    const ribbonH = 14.5;
    ensureSpace(ribbonH + 45);
    const ribbonBottom = cursorY - ribbonH;

    drawRectFill(PAGE_LEFT, ribbonBottom, CONTENT_WIDTH, ribbonH, [0.945, 0.96, 0.98]); // #F1F5F9
    drawRectFill(PAGE_LEFT, ribbonBottom, 3.2, ribbonH, COLOR_CRIMSON);

    const baselineY = ribbonBottom + 4.0;
    drawTextAt(title, PAGE_LEFT + 8.5, baselineY, {
      font: 'F2',
      size: 9.5,
      color: COLOR_OBSIDIAN,
    });

    if (metaRight) {
      const rightW = measureTextWidthPt(metaRight, 8.2, true);
      const rightX = Math.max(
        PAGE_LEFT + measureTextWidthPt(title, 9.5, true) + 20,
        PAGE_RIGHT - rightW - 6,
      );
      drawTextAt(metaRight, rightX, baselineY + 0.3, {
        font: 'F2',
        size: 8.2,
        color: COLOR_CRIMSON_DARK,
      });
    }

    cursorY = ribbonBottom - 3.0;
  };

  for (const proj of data.projects) {
    ensureSpace(88);

    const metaParts = [proj.category, proj.status].filter(Boolean);
    drawProjectHeaderRibbon(proj.title, metaParts.join(' | '));

    if (proj.tagline) {
      drawParagraph(proj.tagline, {
        font: 'F2',
        size: 8.65,
        indent: 6,
        hangingIndent: 6,
        paragraphGap: 2.0,
        color: COLOR_MUTED,
      });
    }

    drawParagraph(proj.description, {
      size: 8.75,
      indent: 11,
      hangingIndent: 11,
      lineGap: 1.85,
      paragraphGap: 2.2,
      bulletSquare: true,
    });

    if (proj.solution) {
      drawLabeledBullet('Architecture & Solution', proj.solution, {
        size: 8.75,
        indent: 11,
        hangingIndent: 11,
        lineGap: 1.85,
        paragraphGap: 2.2,
      });
    }

    if (proj.techStack && proj.techStack.length > 0) {
      drawLabeledBullet('Tech Stack', proj.techStack.join(', '), {
        size: 8.7,
        indent: 11,
        hangingIndent: 11,
        lineGap: 1.8,
        paragraphGap: proj.githubUrl ? 2.2 : 4.5,
      });
    }

    if (proj.githubUrl) {
      const fullGhUrl = proj.githubUrl.startsWith('http')
        ? proj.githubUrl
        : `https://${proj.githubUrl}`;
      const cleanDisplayUrl = fullGhUrl.replace(/^https?:\/\/(www\.)?/, '');
      const targetUri = proj.githubLinkTargetUrl || fullGhUrl;
      drawClickableLinkRow('GitHub Repository', cleanDisplayUrl, targetUri, 11);
      cursorY -= 3.0;
    }
  }

  // Ensure Custom Smartwatch (Arduino) is always included
  const hasSmartwatch = data.projects.some((p) => p.title.toLowerCase().includes('smartwatch'));
  if (!hasSmartwatch) {
    ensureSpace(60);
    drawProjectHeaderRibbon(
      'Custom Smartwatch (Arduino) - Self-Built Smart Wearable',
      'Embedded Hardware Build',
    );
    drawParagraph(
      'Designed and built a working smartwatch from scratch using an Arduino dev module, a MAX heart-rate sensor, and an IMU motion tracker.',
      {
        size: 8.75,
        indent: 11,
        hangingIndent: 11,
        lineGap: 1.85,
        paragraphGap: 2.0,
        bulletSquare: true,
      },
    );
    drawParagraph(
      'Engineered two embedded mini-experiences (Chrome Dino-style runner game and dice-roll simulator) alongside live heart-rate monitoring and custom firmware logic.',
      {
        size: 8.75,
        indent: 11,
        hangingIndent: 11,
        lineGap: 1.85,
        paragraphGap: 4.0,
        bulletSquare: true,
      },
    );
  }

  // ============================================================================
  // 6. LEADERSHIP & CAMPUS GOVERNANCE
  // ============================================================================
  drawSectionHeading('Leadership & Campus Governance', 52);
  for (const role of data.leadership) {
    ensureSpace(34);
    const period = role.endDate ? `${role.startDate} - ${role.endDate}` : role.startDate || '';
    const cleanPos = normalizeCleanPdfText(role.position).replace(/\s*-\s*Student Engineering Council$/i, '');
    const cleanOrg = normalizeCleanPdfText(role.organization);
    const roleHeader = cleanOrg.toLowerCase().includes(cleanPos.toLowerCase())
      ? cleanOrg
      : `${cleanPos} - ${cleanOrg}`;
    drawTextLine(roleHeader, {
      font: 'F2',
      size: 9.2,
      gapAfter: 1.8,
      color: COLOR_OBSIDIAN,
      rightText: period,
      rightFont: 'F2',
      rightSize: 8.3,
      rightColor: COLOR_CRIMSON_DARK,
    });
    drawParagraph(role.description, {
      size: 8.75,
      indent: 11,
      hangingIndent: 11,
      lineGap: 1.8,
      paragraphGap: 3.0,
      bulletSquare: true,
    });
  }

  const hasSpl = data.leadership.some((l) => l.position.toLowerCase().includes('school pupil'));
  if (!hasSpl) {
    ensureSpace(34);
    drawTextLine('Hackathon Team Lead (4-Member Squad) - Metropolitan Institute of Technology Hackathon & Hacktoberfest', {
      font: 'F2',
      size: 9.2,
      gapAfter: 1.8,
      color: COLOR_OBSIDIAN,
      rightText: 'Squad Lead',
      rightFont: 'F2',
      rightSize: 8.3,
      rightColor: COLOR_CRIMSON_DARK,
    });
    drawParagraph(
      'Led a four-member collaborative engineering squad across competitive hackathons under tight deadlines.',
      { size: 8.75, indent: 11, hangingIndent: 11, lineGap: 1.8, paragraphGap: 3.0, bulletSquare: true },
    );

    ensureSpace(34);
    drawTextLine('School Pupil Leader (SPL) - Central Science Academy', {
      font: 'F2',
      size: 9.2,
      gapAfter: 1.8,
      color: COLOR_OBSIDIAN,
      rightText: '2022 - 2023',
      rightFont: 'F2',
      rightSize: 8.3,
      rightColor: COLOR_CRIMSON_DARK,
    });
    drawParagraph(
      'Selected to represent and lead the school student body across campus programs and initiatives.',
      { size: 8.75, indent: 11, hangingIndent: 11, lineGap: 1.8, paragraphGap: 3.0, bulletSquare: true },
    );
  }

  // ============================================================================
  // 7. ACHIEVEMENTS & COMPETITIVE MILESTONES
  // ============================================================================
  drawSectionHeading('Achievements & Competitive Milestones', 52);
  for (const ach of data.achievements) {
    ensureSpace(36);
    const meta = [ach.eventOrIssuer, ach.teamContext].filter(Boolean).join(' | ');
    drawTextLine(ach.title, {
      font: 'F2',
      size: 9.2,
      gapAfter: 1.8,
      color: COLOR_OBSIDIAN,
      rightText: meta,
      rightFont: 'F2',
      rightSize: 8.2,
      rightColor: COLOR_CRIMSON_DARK,
    });
    drawParagraph(ach.description, {
      size: 8.75,
      indent: 11,
      hangingIndent: 11,
      lineGap: 1.8,
      paragraphGap: 3.0,
      bulletSquare: true,
    });
  }

  // ============================================================================
  // 8. CERTIFICATIONS (if any)
  // ============================================================================
  if (data.certifications && data.certifications.length > 0) {
    drawSectionHeading('Certifications & Credentials', 36);
    for (const cert of data.certifications) {
      ensureSpace(26);
      drawTextLine(`${cert.title} - ${cert.issuer}`, {
        font: 'F2',
        size: 9.1,
        gapAfter: 2.0,
        color: COLOR_OBSIDIAN,
        rightText: cert.issueDate || '',
        rightFont: 'F2',
        rightSize: 8.3,
        rightColor: COLOR_CRIMSON_DARK,
      });
      if (cert.skillsCovered && cert.skillsCovered.length > 0) {
        drawLabeledBullet('Skills Covered', cert.skillsCovered.join(', '), {
          size: 8.65,
          indent: 11,
          hangingIndent: 11,
          paragraphGap: 2.5,
        });
      }
    }
  }

  // ============================================================================
  // 9. ACTIVE FOCUS, INTERESTS & LANGUAGES
  // ============================================================================
  drawSectionHeading('Active Focus, Interests & Languages', 44);
  if (data.exploringItems && data.exploringItems.length > 0) {
    const expTitles = data.exploringItems.map((e) => stripRemovedPhone(e.title)).filter(Boolean);
    drawLabeledBullet('Currently Exploring', expTitles.join(', '), {
      size: 8.75,
      indent: 11,
      hangingIndent: 11,
      paragraphGap: 2.2,
    });
  }
  if (data.currentInterests) {
    const interestsStr = Array.isArray(data.currentInterests)
      ? data.currentInterests.map((c) => stripRemovedPhone(c)).join(', ')
      : stripRemovedPhone(data.currentInterests);
    if (interestsStr) {
      drawLabeledBullet('Core Interests', interestsStr, {
        size: 8.75,
        indent: 11,
        hangingIndent: 11,
        paragraphGap: 2.2,
      });
    }
  }
  drawLabeledBullet('Spoken Languages', 'Tamil, English', {
    size: 8.75,
    indent: 11,
    hangingIndent: 11,
    paragraphGap: 2.2,
  });

  // ============================================================================
  // ARCHITECTURAL PAGE FRAME, TOP EDGE ACCENT & EXECUTIVE FOOTER ON EVERY PAGE
  // ============================================================================
  const totalPages = pages.length;
  for (let i = 0; i < totalPages; i++) {
    // Top Edge Dual-Tone Micro-Bar (Obsidian + Crimson)
    drawRectFill(0, 787.5, 420, 4.5, COLOR_OBSIDIAN, i);
    drawRectFill(420, 787.5, 192, 4.5, COLOR_CRIMSON, i);

    // Subtle Outer Architectural Frame Border
    drawRectStroke(20, 18, 572, 760, 0.45, [0.84, 0.87, 0.92], i);

    // 4 Precision Crimson Corner Registration Ticks
    // Top-left
    drawLine(20, 778, 30, 778, 1.2, COLOR_CRIMSON, i);
    drawLine(20, 778, 20, 768, 1.2, COLOR_CRIMSON, i);
    // Top-right
    drawLine(582, 778, 592, 778, 1.2, COLOR_CRIMSON, i);
    drawLine(592, 778, 592, 768, 1.2, COLOR_CRIMSON, i);
    // Bottom-left
    drawLine(20, 18, 30, 18, 1.2, COLOR_CRIMSON, i);
    drawLine(20, 18, 20, 28, 1.2, COLOR_CRIMSON, i);
    // Bottom-right
    drawLine(582, 18, 592, 18, 1.2, COLOR_CRIMSON, i);
    drawLine(592, 18, 592, 28, 1.2, COLOR_CRIMSON, i);

    // Executive Bottom Footer Strip
    drawLine(PAGE_LEFT, 38, PAGE_LEFT + 85, 38, 1.1, COLOR_CRIMSON, i);
    drawLine(PAGE_LEFT + 85, 38, PAGE_RIGHT, 38, 0.45, [0.80, 0.84, 0.90], i);

    drawTextAt(
      'Alex Rivera  //  Verified Curriculum Vitae & Engineering Dossier',
      PAGE_LEFT,
      27.5,
      {
        font: 'F2',
        size: 7.4,
        color: COLOR_MUTED,
        pageIdx: i,
      },
    );

    const pageBadgeText = `PAGE 0${i + 1} OF 0${totalPages}`;
    drawRectFill(PAGE_RIGHT - 64, 24.5, 64, 11, COLOR_OBSIDIAN, i);
    drawRectFill(PAGE_RIGHT - 64, 24.5, 2.5, 11, COLOR_CRIMSON, i);
    drawTextAt(pageBadgeText, PAGE_RIGHT - 55, 27.7, {
      font: 'F2',
      size: 7.2,
      color: COLOR_WHITE,
      pageIdx: i,
    });
  }

  // ============================================================================
  // ASSEMBLE VALID MULTI-PAGE PDF 1.4 BINARY WITH CLICKABLE URI ANNOTATIONS
  // ============================================================================
  // Object layout:
  // 1: Catalog
  // 2: Pages
  // 3: Font F1 (Helvetica)
  // 4: Font F2 (Helvetica-Bold)
  // Dynamic objects starting at ID 5:
  // For each page i:
  //   pageObjId, contentObjId, and annotObjIds[]
  const objects: Map<number, string> = new Map();
  let nextObjId = 5;
  const pageObjIds: number[] = [];

  for (let i = 0; i < pages.length; i++) {
    const pageObjId = nextObjId++;
    const contentObjId = nextObjId++;
    pageObjIds.push(pageObjId);

    const streamContent = pages[i].join('\n');
    const streamByteLen = Buffer.byteLength(streamContent, 'utf8');
    objects.set(
      contentObjId,
      `<< /Length ${streamByteLen} >>\nstream\n${streamContent}\nendstream`,
    );

    const annotsForPage = pageLinks[i] || [];
    const annotIds: number[] = [];
    for (const link of annotsForPage) {
      const annotId = nextObjId++;
      annotIds.push(annotId);
      const [x1, y1, x2, y2] = link.rect;
      objects.set(
        annotId,
        `<< /Type /Annot /Subtype /Link /Rect [${x1} ${y1} ${x2} ${y2}] /Border [0 0 0] /A << /Type /Action /S /URI /URI (${escapePdfLiteral(link.uri)}) >> >>`,
      );
    }

    const annotsEntry =
      annotIds.length > 0 ? ` /Annots [${annotIds.map((id) => `${id} 0 R`).join(' ')}]` : '';

    objects.set(
      pageObjId,
      `<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /MediaBox [0 0 612 792] /Contents ${contentObjId} 0 R${annotsEntry} >>`,
    );
  }

  objects.set(1, '<< /Type /Catalog /Pages 2 0 R >>');
  objects.set(
    2,
    `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjIds.length} >>`,
  );
  objects.set(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  objects.set(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

  const totalObjCount = nextObjId - 1;
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];

  for (let id = 1; id <= totalObjCount; id++) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    const body = objects.get(id) || '';
    pdf += `${id} 0 obj\n${body}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${totalObjCount + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${totalObjCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf8');
}
