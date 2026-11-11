import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  Github,
  Linkedin,
  Mail,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import { ProfileSettings, PublicPortfolioPayload, SocialLinkItem } from '../types/portfolio.ts';
import { downloadResumePdf } from '../utils/resumeDownload.ts';
import { soundEngine } from '../utils/soundEffects.ts';
import { VerifiedCurriculumVitaeSheet } from './VerifiedCurriculumVitaeSheet.tsx';

interface ContactSectionProps {
  profile: ProfileSettings | null;
  socialLinks: SocialLinkItem[];
  portfolio?: PublicPortfolioPayload | null;
  highlightedSection?: string | null;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  profile,
  socialLinks,
  portfolio,
  highlightedSection,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // Honeypot trap field
  const formLoadedAtRef = React.useRef<number>(Date.now());
  const statusBannerRef = React.useRef<HTMLDivElement | null>(null);
  const [previewCvOpen, setPreviewCvOpen] = useState(false);

  const [downloadingResume, setDownloadingResume] = useState(false);
  const [downloadedResume, setDownloadedResume] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mailtoFallbackUrl, setMailtoFallbackUrl] = useState<string | null>(null);

  const verifiedCvUrl =
    profile?.resumeUrl || '/assets/aistudio/Alex_Rivera_resume_8bdab9ad.pdf';
  const downloadPdfUrl = verifiedCvUrl.startsWith('/api/uploads/')
    ? verifiedCvUrl
    : '/api/resume/download';
  const inlinePdfUrl = verifiedCvUrl.startsWith('/api/uploads/')
    ? verifiedCvUrl
    : '/api/resume/download?inline=1';
  const verifiedCvFilename = profile?.resumeFilename || 'Alex_Rivera_Resume.pdf';

  const handleDownloadResume = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (downloadingResume) return;
    soundEngine.playSelect();
    setDownloadingResume(true);
    await downloadResumePdf(downloadPdfUrl, verifiedCvFilename);
    setDownloadingResume(false);
    setDownloadedResume(true);
    window.setTimeout(() => setDownloadedResume(false), 2200);
  };

  const linkedinUrl =
    socialLinks.find((s) => s.platform.toLowerCase().includes('linkedin'))?.url ||
    'https://www.linkedin.com/in/alex-rivera-dev/';
  const githubUrl =
    socialLinks.find((s) => s.platform.toLowerCase().includes('github'))?.url ||
    'https://github.com/your-username';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setMailtoFallbackUrl(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (trimmedName.length < 2) {
      setErrorMsg('Please enter your name (at least 2 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (trimmedSubject.length < 2) {
      setErrorMsg('Please enter a short subject for your message.');
      return;
    }
    if (trimmedMessage.length < 3) {
      setErrorMsg('Please enter your message before sending.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          subject: trimmedSubject,
          message: trimmedMessage,
          website,
          formLoadedAt: formLoadedAtRef.current,
        }),
      });

      let data: { error?: string; message?: string; emailSent?: boolean } = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        setErrorMsg(data.error || 'Unable to submit message. Please verify your inputs.');
        return;
      }

      soundEngine.playSelect();
      setSuccessMsg(
        data.message || 'Thank you for reaching out. Your message has been securely received.',
      );
      if (data.emailSent === false) {
        const targetEmail = profile?.contactEmail || 'alex.rivera@example.com';
        const mailSubject = encodeURIComponent(`[Portfolio] ${trimmedSubject}`);
        const mailBody = encodeURIComponent(
          `From: ${trimmedName} (${trimmedEmail})\n\n${trimmedMessage}`,
        );
        setMailtoFallbackUrl(`mailto:${targetEmail}?subject=${mailSubject}&body=${mailBody}`);
      } else {
        setMailtoFallbackUrl(null);
      }
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      formLoadedAtRef.current = Date.now();
      window.setTimeout(() => {
        statusBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 40);
    } catch {
      setErrorMsg('Network error while sending your message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="connect"
      aria-labelledby="connect-heading"
      className="mx-auto max-w-[1360px] px-5 py-16 sm:px-8 sm:py-24 scroll-mt-20"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Direct Links, Resume & Privacy Notice (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <p className="font-mono-hud text-xs uppercase tracking-[0.16em] text-[#E60023] dark:text-[#FF1E38] font-semibold">
              Connect With Me
            </p>
            <h2
              id="connect-heading"
              className="headline-balance mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#07070B] dark:text-white"
            >
              Have an idea? Let&apos;s build something meaningful.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              Open to collaborating on AI systems, prompt engineering workflows, software products,
              hackathons, and student innovation initiatives.
            </p>
          </div>

          {/* Direct Channels */}
          <div className="border border-zinc-200 dark:border-[#FF1E38]/35 bg-white dark:bg-[#0B0B10] divide-y divide-zinc-100 dark:divide-white/10">
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Linkedin className="h-4 w-4 text-[#FF1E38]" />
                <div>
                  <p className="font-display text-sm font-bold text-[#07070B] dark:text-white">
                    LinkedIn
                  </p>
                  <p className="font-mono-hud text-xs text-zinc-500 dark:text-zinc-400">
                    linkedin.com/in/alex-rivera-dev
                  </p>
                </div>
              </div>
              <span className="font-mono-hud text-xs uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38]">
                Connect
              </span>
            </a>

            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Github className="h-4 w-4 text-[#FF1E38]" />
                <div>
                  <p className="font-display text-sm font-bold text-[#07070B] dark:text-white">
                    GitHub
                  </p>
                  <p className="font-mono-hud text-xs text-zinc-500 dark:text-zinc-400">
                    github.com/your-username
                  </p>
                </div>
              </div>
              <span className="font-mono-hud text-xs uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38]">
                Code
              </span>
            </a>

            {profile?.showEmailPublicly && profile?.contactEmail && (
              <a
                href={`mailto:${profile.contactEmail}`}
                className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-[#FF1E38]" />
                  <div>
                    <p className="font-display text-sm font-bold text-[#07070B] dark:text-white">
                      Direct Email
                    </p>
                    <p className="font-mono-hud text-xs text-zinc-500 dark:text-zinc-400">
                      {profile.contactEmail}
                    </p>
                  </div>
                </div>
                <span className="font-mono-hud text-xs uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38]">
                  Write
                </span>
              </a>
            )}

            {profile?.resumeEnabled !== false && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Download className="h-4 w-4 text-[#FF1E38] shrink-0" />
                  <div>
                    <p className="font-display text-sm font-bold text-[#07070B] dark:text-white">
                      Verified Curriculum Vitae
                    </p>
                    <p className="font-mono-hud text-xs text-zinc-500 dark:text-zinc-400">
                      {verifiedCvFilename}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    data-testid="contact-view-cv-btn"
                    onClick={() => {
                      soundEngine.playSelect();
                      setPreviewCvOpen(true);
                    }}
                    className="inline-flex items-center gap-1 border border-zinc-300 dark:border-white/30 px-2.5 py-1 font-mono-hud text-[11px] uppercase tracking-wider text-[#07070B] dark:text-white hover:border-[#FF1E38] hover:text-[#FF1E38] transition-colors cursor-pointer"
                  >
                    <Eye className="h-3 w-3" />
                    <span>View CV</span>
                  </button>
                  <button
                    type="button"
                    data-testid="contact-download-cv-btn"
                    onClick={handleDownloadResume}
                    className="inline-flex items-center gap-1 border border-[#FF1E38] bg-[#FF1E38]/12 px-2.5 py-1 font-mono-hud text-[11px] uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38] hover:bg-[#FF1E38] hover:text-white transition-all cursor-pointer"
                  >
                    {downloadedResume ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Download className="h-3 w-3" />
                    )}
                    <span>
                      {downloadingResume
                        ? 'Saving...'
                        : downloadedResume
                          ? 'Saved'
                          : 'PDF'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Privacy & Data Handling Notice */}
          <div className="border border-zinc-200 dark:border-white/15 bg-white dark:bg-[#0B0B10] p-4 flex items-start gap-3">
            <ShieldCheck className="h-4 w-4 text-[#FF1E38] shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              <strong className="text-[#07070B] dark:text-white">Privacy Notice:</strong>{' '}
              Messages submitted through this form are validated, rate-limited, and stored
              privately for direct communication with {profile?.fullName || 'Alex Rivera'}.
              Your contact details are never sold, tracked across third-party ad networks, or shared.
            </p>
          </div>
        </div>

        {/* Right Column: Validated Spam-Protected Contact Form (7 Columns) */}
        <div
          id="send-direct-message"
          className={`lg:col-span-7 scroll-mt-24 border bg-white dark:bg-[#0B0B10] p-6 sm:p-8 transition-all duration-500 ${
            highlightedSection === 'send-direct-message'
              ? 'border-[#FF1E38] ring-2 ring-[#FF1E38]/55 shadow-[0_0_28px_rgba(255,30,56,0.28)]'
              : 'border-zinc-200 dark:border-[#FF1E38]/35'
          }`}
        >
          <h3 className="font-display text-xl font-bold text-[#07070B] dark:text-white">
            Send a Direct Message
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Share your project idea, collaboration inquiry, or speaking invitation.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
            {/* Hidden Honeypot Field for Bot Protection */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="contact-website">Website</label>
              <input
                id="contact-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="contact-name"
                  className="block font-mono-hud text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
                >
                  Your Name *
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Enter your name"
                  className="mt-2 w-full border border-zinc-300 dark:border-white/25 bg-[#F5F5F8] dark:bg-[#050507] px-3.5 py-2.5 text-sm text-[#07070B] dark:text-white focus:border-[#FF1E38] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="block font-mono-hud text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
                >
                  Email Address *
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  maxLength={160}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="you@example.com"
                  className="mt-2 w-full border border-zinc-300 dark:border-white/25 bg-[#F5F5F8] dark:bg-[#050507] px-3.5 py-2.5 text-sm text-[#07070B] dark:text-white focus:border-[#FF1E38] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="contact-subject"
                className="block font-mono-hud text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
              >
                Subject *
              </label>
              <input
                id="contact-subject"
                name="subject"
                type="text"
                required
                minLength={2}
                maxLength={160}
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="AI Collaboration / Product Idea / Inquiry"
                className="mt-2 w-full border border-zinc-300 dark:border-white/25 bg-[#F5F5F8] dark:bg-[#050507] px-3.5 py-2.5 text-sm text-[#07070B] dark:text-white focus:border-[#FF1E38] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className="block font-mono-hud text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
              >
                Message *
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={5}
                required
                minLength={3}
                maxLength={4000}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Tell me about what we could build or explore together..."
                className="mt-2 w-full border border-zinc-300 dark:border-white/25 bg-[#F5F5F8] dark:bg-[#050507] px-3.5 py-2.5 text-sm text-[#07070B] dark:text-white focus:border-[#FF1E38] focus:outline-none"
              />
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="border border-[#FF1E38] bg-[#FF1E38]/10 px-4 py-3 text-xs font-medium text-[#E60023] dark:text-[#FF4D63]"
              >
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div
                ref={statusBannerRef}
                role="status"
                data-testid="contact-success-status"
                className="space-y-2.5 border border-white/50 bg-white/10 px-4 py-3 text-xs font-medium text-[#07070B] dark:text-white"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#FF1E38] shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
                {mailtoFallbackUrl && (
                  <div className="pl-6">
                    <a
                      href={mailtoFallbackUrl}
                      className="inline-flex items-center gap-1.5 border border-[#FF1E38]/50 bg-white dark:bg-[#050507] px-3 py-1.5 font-mono-hud text-[11px] uppercase tracking-wider text-[#07070B] dark:text-white hover:border-[#FF1E38] transition-colors"
                    >
                      <Mail className="h-3 w-3 text-[#FF1E38]" />
                      <span>Send via Your Email App</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="hud-reticle inline-flex items-center gap-2 bg-[#FF1E38] px-6 py-3 font-display text-sm font-semibold text-white hover:bg-[#E00E26] shadow-[0_0_20px_rgba(255,30,56,0.45)] disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>{submitting ? 'Sending Message...' : 'Send Message'}</span>
            </button>
          </form>
        </div>
      </div>
      {/* Verified Curriculum Vitae Preview Modal */}
      {previewCvOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Verified Curriculum Vitae — Alex Rivera"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setPreviewCvOpen(false);
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/88 p-4 sm:p-6"
          >
            <div className="w-full max-w-4xl border border-[#FF1E38]/55 bg-white dark:bg-[#0B0B10] shadow-[0_0_40px_rgba(255,30,56,0.25)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-white/15 px-5 py-3.5">
                <div>
                  <p className="font-mono-hud text-[11px] uppercase tracking-wider text-[#E60023] dark:text-[#FF1E38]">
                    Verified Curriculum Vitae
                  </p>
                  <h3 className="font-display text-base font-bold text-[#07070B] dark:text-white">
                    {verifiedCvFilename}
                  </h3>
                </div>
                <div className="flex items-center gap-2.5">
                  <a
                    href={inlinePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 border border-zinc-300 dark:border-white/30 px-3 py-1.5 font-mono-hud text-xs uppercase tracking-wider text-[#07070B] dark:text-white hover:border-[#FF1E38]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open Tab</span>
                  </a>
                  <button
                    type="button"
                    data-testid="modal-download-cv-btn"
                    onClick={handleDownloadResume}
                    className="hud-reticle inline-flex items-center gap-1.5 bg-[#FF1E38] px-3.5 py-1.5 font-mono-hud text-xs uppercase tracking-wider font-semibold text-white hover:bg-[#E00E26] transition-colors cursor-pointer"
                  >
                    {downloadedResume ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {downloadingResume
                        ? 'Downloading...'
                        : downloadedResume
                          ? 'Saved PDF'
                          : 'Download PDF'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewCvOpen(false)}
                    aria-label="Close Curriculum Vitae Preview"
                    className="inline-flex h-8 w-8 items-center justify-center border border-zinc-300 dark:border-white/20 text-zinc-700 dark:text-zinc-300 hover:text-[#FF1E38] cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-6 bg-[#F5F5F8] dark:bg-[#050507] max-h-[82vh] overflow-y-auto">
                <VerifiedCurriculumVitaeSheet resumeUrl={verifiedCvUrl} portfolio={portfolio} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
};
