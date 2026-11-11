import React, { useCallback, useEffect, useRef, useState } from 'react';
import { signOut } from 'firebase/auth';
import {
  ArrowDown,
  ArrowUp,
  Award,
  Briefcase,
  Check,
  Cpu,
  ExternalLink,
  Eye,
  EyeOff,
  FileBadge2,
  FileText,
  FolderGit2,
  Globe,
  GripVertical,
  Inbox,
  LayoutDashboard,
  Link2,
  LogOut,
  Palette,
  Plus,
  Save,
  Shield,
  Sparkles,
  Terminal,
  Trash2,
  Upload,
  User,
  Users,
} from 'lucide-react';
import { auth } from '../lib/firebase.ts';
import {
  AdminOverviewPayload,
  ProfileSettings,
  SeoSettings,
  ThemeSettings,
} from '../types/portfolio.ts';

type CmsSectionId =
  | 'dashboard'
  | 'profile'
  | 'about'
  | 'playground'
  | 'skills'
  | 'projects'
  | 'achievements'
  | 'leadership'
  | 'experience'
  | 'certifications'
  | 'resume'
  | 'social_links'
  | 'messages'
  | 'seo'
  | 'theme'
  | 'security';

const CMS_NAV: { id: CmsSectionId; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'profile', label: 'Profile', Icon: User },
  { id: 'about', label: 'About', Icon: Sparkles },
  { id: 'playground', label: 'AI Playground', Icon: Cpu },
  { id: 'skills', label: 'Skills', Icon: Terminal },
  { id: 'projects', label: 'Projects', Icon: FolderGit2 },
  { id: 'achievements', label: 'Achievements', Icon: Award },
  { id: 'leadership', label: 'Leadership', Icon: Users },
  { id: 'experience', label: 'Experience', Icon: Briefcase },
  { id: 'certifications', label: 'Certifications', Icon: FileBadge2 },
  { id: 'resume', label: 'Resume', Icon: FileText },
  { id: 'social_links', label: 'Social Links', Icon: Link2 },
  { id: 'messages', label: 'Contact Messages', Icon: Inbox },
  { id: 'seo', label: 'SEO Settings', Icon: Globe },
  { id: 'theme', label: 'Theme Settings', Icon: Palette },
  { id: 'security', label: 'Security Settings', Icon: Shield },
];

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigateHome: () => void;
  onPortfolioMutated: () => void;
}

function splitLines(raw: string): string[] {
  return raw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitComma(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  onNavigateHome,
  onPortfolioMutated,
}) => {
  const [activeSection, setActiveSection] = useState<CmsSectionId>('dashboard');
  const [data, setData] = useState<AdminOverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Editable Profile, SEO, Theme forms
  const [profileForm, setProfileForm] = useState<Partial<ProfileSettings>>({});
  const [seoForm, setSeoForm] = useState<Partial<SeoSettings>>({});
  const [themeForm, setThemeForm] = useState<Partial<ThemeSettings>>({});

  // Security form states
  const [newCmsPassword, setNewCmsPassword] = useState('');
  const [totpSetupInfo, setTotpSetupInfo] = useState<{ secret: string; otpauthUrl: string } | null>(
    null,
  );
  const [totpVerifyCode, setTotpVerifyCode] = useState('');
  const [sessionTtl, setSessionTtl] = useState(24);
  const [contactLimit, setContactLimit] = useState(5);

  // Active Item Editor Drawer / Modal for Collections
  const [editingResource, setEditingResource] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [itemDraft, setItemDraft] = useState<Record<string, any>>({});

  // Drag-and-drop state
  const [dragState, setDragState] = useState<{ resource: string; index: number } | null>(null);

  const autosaveTimerRef = useRef<number | null>(null);

  const notify = (msg: string, state: 'saved' | 'error' = 'saved') => {
    setToastMsg(msg);
    setSaveState(state);
    window.setTimeout(() => {
      setSaveState((prev) => (prev === state ? 'idle' : prev));
    }, 3000);
  };

  const loadOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/overview');
      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }
      if (!res.ok) throw new Error('Failed to load CMS data');
      const payload: AdminOverviewPayload = await res.json();
      setData(payload);
      if (payload.profile) setProfileForm(payload.profile);
      if (payload.seo) setSeoForm(payload.seo);
      if (payload.theme) setThemeForm(payload.theme);
      if (payload.security) {
        setSessionTtl(payload.security.sessionTtlHours);
        setContactLimit(payload.security.contactRateLimitPer15Min);
      }
    } catch {
      notify('Unable to load CMS workspace.', 'error');
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleLogoutClick = async () => {
    try {
      await fetch('/api/auth/session', {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      await signOut(auth).catch(() => {});
    } finally {
      onLogout();
    }
  };

  const handleSaveProfile = async (overridePatch?: Partial<ProfileSettings>) => {
    setSaveState('saving');
    try {
      const merged = { ...profileForm, ...overridePatch };
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          fullName: merged.fullName,
          headline: merged.headline,
          subheading: merged.subheading,
          brandStatement: merged.brandStatement,
          shortIntro: merged.shortIntro,
          statusText: merged.statusText,
          education: merged.education,
          specialization: merged.specialization,
          university: merged.university,
          institution: merged.institution,
          currentInternship: merged.currentInternship,
          leadershipSummary: merged.leadershipSummary,
          currentInterests: merged.currentInterests,
          careerDirection: merged.careerDirection,
          contactEmail: merged.contactEmail,
          showEmailPublicly: Boolean(merged.showEmailPublicly),
          profileImageUrl: merged.profileImageUrl || '',
          resumeUrl: merged.resumeUrl || '',
          resumeFilename: merged.resumeFilename || '',
          resumeEnabled: Boolean(merged.resumeEnabled),
          expectedVersion: merged.version,
        }),
      });
      const updated = await res.json();
      if (!res.ok) {
        notify(updated.error || 'Failed to save profile.', 'error');
        return;
      }
      setProfileForm(updated);
      await loadOverview();
      onPortfolioMutated();
      notify('Profile settings saved and synced.');
    } catch {
      notify('Network error saving profile.', 'error');
    }
  };

  const scheduleProfileAutosave = (nextProfile: Partial<ProfileSettings>) => {
    setProfileForm(nextProfile);
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = window.setTimeout(() => {
      handleSaveProfile(nextProfile);
    }, 1800);
  };

  const handleFileUpload = async (
    file: File,
    category: 'profile' | 'project' | 'certificate' | 'resume',
    onSuccessUrl: (url: string, originalName: string) => void,
  ) => {
    setSaveState('saving');
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) {
        notify(result.error || 'Upload rejected.', 'error');
        return;
      }
      onSuccessUrl(result.url, result.originalName);
      await loadOverview();
      notify(`Uploaded ${result.originalName} securely.`);
    } catch {
      notify('File upload failed.', 'error');
    }
  };

  const handleTogglePublish = async (resource: string, id: number, currentPublished: boolean) => {
    setSaveState('saving');
    try {
      const res = await fetch(`/api/admin/${resource}/${id}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ isPublished: !currentPublished }),
      });
      if (!res.ok) {
        const err = await res.json();
        notify(err.error || 'Failed to change visibility.', 'error');
        return;
      }
      await loadOverview();
      onPortfolioMutated();
      notify(!currentPublished ? 'Item published live.' : 'Item moved to draft.');
    } catch {
      notify('Failed to update visibility.', 'error');
    }
  };

  const handleDeleteItem = async (resource: string, id: number) => {
    setSaveState('saving');
    try {
      const res = await fetch(`/api/admin/${resource}/${id}`, {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (!res.ok) {
        const err = await res.json();
        notify(err.error || 'Delete failed.', 'error');
        return;
      }
      await loadOverview();
      onPortfolioMutated();
      notify('Entry permanently deleted.');
    } catch {
      notify('Delete failed.', 'error');
    }
  };

  const handleReorderIds = async (resource: string, orderedIds: number[]) => {
    setSaveState('saving');
    try {
      const res = await fetch(`/api/admin/${resource}/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ ids: orderedIds }),
      });
      if (!res.ok) {
        notify('Reorder failed.', 'error');
        return;
      }
      await loadOverview();
      onPortfolioMutated();
      notify('Display order updated.');
    } catch {
      notify('Reorder failed.', 'error');
    }
  };

  const openItemEditor = (resource: string, item?: Record<string, any>) => {
    setEditingResource(resource);
    setEditingItemId(item?.id ?? null);
    if (item) {
      setItemDraft({
        ...item,
        highlightsText: Array.isArray(item.highlights) ? item.highlights.join('\n') : '',
        connectedToText: Array.isArray(item.connectedTo) ? item.connectedTo.join(', ') : '',
        useCasesText: Array.isArray(item.useCases) ? item.useCases.join(', ') : '',
        techStackText: Array.isArray(item.techStack) ? item.techStack.join(', ') : '',
        aiModelsUsedText: Array.isArray(item.aiModelsUsed) ? item.aiModelsUsed.join(', ') : '',
        featuresText: Array.isArray(item.features) ? item.features.join('\n') : '',
        futureImprovementsText: Array.isArray(item.futureImprovements)
          ? item.futureImprovements.join('\n')
          : '',
        screenshotsText: Array.isArray(item.screenshots) ? item.screenshots.join('\n') : '',
        responsibilitiesText: Array.isArray(item.responsibilities)
          ? item.responsibilities.join('\n')
          : '',
        activitiesText: Array.isArray(item.activities) ? item.activities.join('\n') : '',
        achievementsText: Array.isArray(item.achievements) ? item.achievements.join('\n') : '',
        skillsUsedText: Array.isArray(item.skillsUsed) ? item.skillsUsed.join(', ') : '',
        skillsCoveredText: Array.isArray(item.skillsCovered) ? item.skillsCovered.join(', ') : '',
      });
    } else {
      setItemDraft({
        isPublished: true,
        accentToken: 'cyan',
        experienceLevel: 'Exploring',
        recognitionTier: 'recognition',
        category:
          resource === 'projects'
            ? 'AI Systems'
            : resource === 'skills'
              ? 'Programming Languages'
              : resource === 'timeline_events'
                ? 'Project'
                : 'General',
        categoryId: data?.aiCategories[0]?.id || 1,
      });
    }
  };

  const handleSaveItemDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;
    setSaveState('saving');

    let payload: Record<string, unknown> = {
      isPublished: Boolean(itemDraft.isPublished ?? true),
    };
    if (editingItemId && typeof itemDraft.version === 'number') {
      payload.expectedVersion = itemDraft.version;
    }

    switch (editingResource) {
      case 'about_themes':
        payload = {
          ...payload,
          slug:
            itemDraft.slug ||
            String(itemDraft.title || 'theme')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-'),
          title: itemDraft.title || '',
          subtitle: itemDraft.subtitle || '',
          narrative: itemDraft.narrative || '',
          highlights: splitLines(itemDraft.highlightsText || ''),
          accentToken: itemDraft.accentToken || 'cyan',
        };
        break;
      case 'exploring_items':
        payload = {
          ...payload,
          title: itemDraft.title || '',
          category: itemDraft.category || '',
          summary: itemDraft.summary || '',
          details: itemDraft.details || '',
          accentToken: itemDraft.accentToken || 'cyan',
        };
        break;
      case 'skills':
        payload = {
          ...payload,
          name: itemDraft.name || '',
          category: itemDraft.category || 'Programming Languages',
          description: itemDraft.description || '',
          connectedTo: splitComma(itemDraft.connectedToText || ''),
          accentToken: itemDraft.accentToken || 'cyan',
        };
        break;
      case 'ai_categories':
        payload = {
          ...payload,
          name: itemDraft.name || '',
          slug:
            itemDraft.slug ||
            String(itemDraft.name || 'category')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-'),
          description: itemDraft.description || '',
          accentToken: itemDraft.accentToken || 'violet',
        };
        break;
      case 'ai_models':
        payload = {
          ...payload,
          categoryId: Number(itemDraft.categoryId || data?.aiCategories[0]?.id || 1),
          name: itemDraft.name || '',
          providerOrFamily: itemDraft.providerOrFamily || '',
          experienceLevel: itemDraft.experienceLevel || 'Exploring',
          experienceNotes: itemDraft.experienceNotes || '',
          useCases: splitComma(itemDraft.useCasesText || ''),
        };
        break;
      case 'projects':
        payload = {
          ...payload,
          slug:
            itemDraft.slug ||
            String(itemDraft.title || 'project')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-'),
          title: itemDraft.title || '',
          tagline: itemDraft.tagline || '',
          category: itemDraft.category || 'AI Systems',
          description: itemDraft.description || '',
          keyPrinciple: itemDraft.keyPrinciple || '',
          problem: itemDraft.problem || '',
          solution: itemDraft.solution || '',
          architecture: itemDraft.architecture || '',
          aiMethodology: itemDraft.aiMethodology || '',
          techStack: splitComma(itemDraft.techStackText || ''),
          aiModelsUsed: splitComma(itemDraft.aiModelsUsedText || ''),
          features: splitLines(itemDraft.featuresText || ''),
          futureImprovements: splitLines(itemDraft.futureImprovementsText || ''),
          screenshots: splitLines(itemDraft.screenshotsText || ''),
          githubUrl: itemDraft.githubUrl || '',
          liveDemoUrl: itemDraft.liveDemoUrl || '',
          status: itemDraft.status || 'Active',
          developmentDate: itemDraft.developmentDate || '',
          isFeatured: Boolean(itemDraft.isFeatured),
        };
        break;
      case 'achievements':
        payload = {
          ...payload,
          title: itemDraft.title || '',
          eventOrIssuer: itemDraft.eventOrIssuer || '',
          recognitionTier: itemDraft.recognitionTier || 'recognition',
          teamContext: itemDraft.teamContext || '',
          description: itemDraft.description || '',
          highlights: splitLines(itemDraft.highlightsText || ''),
          achievedDate: itemDraft.achievedDate || '',
          certificateUrl: itemDraft.certificateUrl || '',
          photoUrl: itemDraft.photoUrl || '',
        };
        break;
      case 'leadership_roles':
        payload = {
          ...payload,
          position: itemDraft.position || '',
          organization: itemDraft.organization || '',
          roleType: itemDraft.roleType || 'Leadership',
          startDate: itemDraft.startDate || '',
          endDate: itemDraft.endDate || '',
          isCurrent: Boolean(itemDraft.isCurrent),
          description: itemDraft.description || '',
          responsibilities: splitLines(itemDraft.responsibilitiesText || ''),
          activities: splitLines(itemDraft.activitiesText || ''),
          achievements: splitLines(itemDraft.achievementsText || ''),
          highlights: splitLines(itemDraft.highlightsText || ''),
        };
        break;
      case 'experiences':
        payload = {
          ...payload,
          organization: itemDraft.organization || '',
          position: itemDraft.position || '',
          employmentType: itemDraft.employmentType || 'Internship',
          startDate: itemDraft.startDate || '',
          endDate: itemDraft.endDate || '',
          isCurrent: Boolean(itemDraft.isCurrent),
          description: itemDraft.description || '',
          responsibilities: splitLines(itemDraft.responsibilitiesText || ''),
          skillsUsed: splitComma(itemDraft.skillsUsedText || ''),
          achievements: splitLines(itemDraft.achievementsText || ''),
        };
        break;
      case 'certifications':
        payload = {
          ...payload,
          title: itemDraft.title || '',
          issuer: itemDraft.issuer || '',
          issueDate: itemDraft.issueDate || '',
          credentialId: itemDraft.credentialId || '',
          credentialUrl: itemDraft.credentialUrl || '',
          certificateFileUrl: itemDraft.certificateFileUrl || '',
          skillsCovered: splitComma(itemDraft.skillsCoveredText || ''),
        };
        break;
      case 'timeline_events':
        payload = {
          ...payload,
          title: itemDraft.title || '',
          organization: itemDraft.organization || '',
          category: itemDraft.category || 'Project',
          dateLabel: itemDraft.dateLabel || '',
          summary: itemDraft.summary || '',
          accentToken: itemDraft.accentToken || 'cyan',
        };
        break;
      case 'social_links':
        payload = {
          ...payload,
          platform: itemDraft.platform || '',
          label: itemDraft.label || '',
          url: itemDraft.url || '',
          iconKey: itemDraft.iconKey || 'link',
        };
        break;
    }

    try {
      const url = editingItemId
        ? `/api/admin/${editingResource}/${editingItemId}`
        : `/api/admin/${editingResource}`;
      const method = editingItemId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        notify(result.error || 'Validation error.', 'error');
        return;
      }
      setEditingResource(null);
      setEditingItemId(null);
      await loadOverview();
      onPortfolioMutated();
      notify(editingItemId ? 'Entry updated.' : 'New entry created.');
    } catch {
      notify('Failed to save entry.', 'error');
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#080B18] text-[#F4F5FA] flex items-center justify-center font-mono-hud text-sm">
        Loading Private Portfolio CMS...
      </div>
    );
  }

  const unreadMessages = data.contactMessages.filter((m) => m.status === 'unread').length;

  // Helper to render reorderable collection table
  const renderCollectionManager = (params: {
    resource: string;
    title: string;
    subtitle: string;
    items: any[];
    getPrimary: (item: any) => string;
    getSecondary: (item: any) => string;
  }) => {
    const { resource, title, subtitle, items, getPrimary, getSecondary } = params;

    const moveItem = (fromIdx: number, toIdx: number) => {
      if (toIdx < 0 || toIdx >= items.length || fromIdx === toIdx) return;
      const copy = [...items];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      handleReorderIds(
        resource,
        copy.map((i) => i.id),
      );
    };

    return (
      <div className="border border-[#48DDF5]/20 bg-[#0E162D] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <h2 className="font-display text-lg font-bold text-white">{title}</h2>
            <p className="text-xs text-[#9AA6C8] mt-0.5">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => openItemEditor(resource)}
            className="hud-reticle inline-flex items-center gap-1.5 bg-[#4169FF] hover:bg-[#5378ff] px-3.5 py-2 font-mono-hud text-xs uppercase tracking-wider font-semibold text-white cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Entry</span>
          </button>
        </div>

        {items.length === 0 ? (
          <p className="py-8 text-center font-mono-hud text-xs text-[#8B98B8]">
            No entries yet. Click &ldquo;Add Entry&rdquo; to create one.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-white/10">
            {items.map((item, idx) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDragState({ resource, index: idx })}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragState && dragState.resource === resource) {
                    moveItem(dragState.index, idx);
                  }
                  setDragState(null);
                }}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    title="Drag to reorder"
                    className="mt-1 text-[#8B98B8] cursor-grab shrink-0"
                  >
                    <GripVertical className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <p className="font-display text-sm font-bold text-white truncate">
                        {getPrimary(item)}
                      </p>
                      <span
                        className={`font-mono-hud text-[10px] uppercase tracking-wider px-1.5 py-0.5 border ${
                          item.isPublished
                            ? 'border-emerald-400/40 text-emerald-300'
                            : 'border-amber-400/40 text-amber-300'
                        }`}
                      >
                        {item.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-xs text-[#9AA6C8] truncate mt-0.5">{getSecondary(item)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, idx - 1)}
                    aria-label={`Move ${getPrimary(item)} up`}
                    className="border border-white/15 p-1.5 text-[#CBD5E1] hover:border-[#48DDF5] disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === items.length - 1}
                    onClick={() => moveItem(idx, idx + 1)}
                    aria-label={`Move ${getPrimary(item)} down`}
                    className="border border-white/15 p-1.5 text-[#CBD5E1] hover:border-[#48DDF5] disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(resource, item.id, item.isPublished)}
                    aria-label={
                      item.isPublished
                        ? `Unpublish ${getPrimary(item)}`
                        : `Publish ${getPrimary(item)}`
                    }
                    className="border border-white/15 px-2.5 py-1.5 font-mono-hud text-[11px] uppercase tracking-wider text-[#CBD5E1] hover:border-[#48DDF5] cursor-pointer inline-flex items-center gap-1"
                  >
                    {item.isPublished ? (
                      <>
                        <EyeOff className="h-3 w-3" />
                        <span>Unpublish</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3" />
                        <span>Publish</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => openItemEditor(resource, item)}
                    className="border border-[#48DDF5]/40 px-2.5 py-1.5 font-mono-hud text-[11px] uppercase tracking-wider text-[#48DDF5] hover:bg-[#48DDF5] hover:text-[#080B18] cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(resource, item.id)}
                    aria-label={`Delete ${getPrimary(item)}`}
                    className="border border-red-400/30 p-1.5 text-red-300 hover:bg-red-500/20 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#080B18] text-[#F4F5FA] flex flex-col lg:flex-row">
      {/* Left Sidebar Navigation (All 16 Requested CMS Sections) */}
      <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-[#48DDF5]/15 bg-[#0B1124] flex flex-col justify-between">
        <div className="p-5">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <span className="font-mono-hud text-[10px] uppercase tracking-widest text-[#48DDF5]">
                Owner Workspace
              </span>
              <h1 className="font-display text-base font-bold">Portfolio CMS</h1>
            </div>
            <button
              type="button"
              onClick={onNavigateHome}
              title="View Public Site"
              className="border border-white/20 p-1.5 text-[#9AA6C8] hover:text-[#48DDF5] cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>

          <nav aria-label="CMS Sections" className="mt-4 space-y-1">
            {CMS_NAV.map(({ id, label, Icon }) => {
              const active = activeSection === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left font-mono-hud text-xs transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#4169FF] text-white font-semibold'
                      : 'text-[#CBD5E1] hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{label}</span>
                  </span>
                  {id === 'messages' && unreadMessages > 0 && (
                    <span className="bg-[#48DDF5] text-[#080B18] px-1.5 py-0.2 text-[10px] font-bold">
                      {unreadMessages}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-5 border-t border-white/10 space-y-3">
          <div className="font-mono-hud text-[11px] text-[#9AA6C8] truncate">
            Signed in as:
            <div className="text-white font-semibold truncate">{data.security.ownerEmail}</div>
          </div>
          <button
            type="button"
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center gap-2 border border-red-400/40 py-2 font-mono-hud text-xs uppercase tracking-wider text-red-300 hover:bg-red-500/15 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-5 sm:p-8 max-w-[1200px] space-y-8">
        {/* Top Status Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="font-mono-hud text-xs uppercase tracking-widest text-[#48DDF5]">
              {CMS_NAV.find((n) => n.id === activeSection)?.label}
            </p>
            <h2 className="font-display text-2xl font-bold mt-0.5">
              {data.profile?.fullName || 'Alex Rivera'} — Content & Architecture Control
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {saveState !== 'idle' && (
              <span
                role="status"
                className={`font-mono-hud text-xs px-3 py-1.5 border ${
                  saveState === 'saving'
                    ? 'border-[#48DDF5]/40 text-[#48DDF5]'
                    : saveState === 'saved'
                      ? 'border-emerald-400/40 text-emerald-300'
                      : 'border-red-400/40 text-red-300'
                }`}
              >
                {saveState === 'saving'
                  ? 'Saving changes...'
                  : toastMsg || 'Changes saved'}
              </span>
            )}
            <button
              type="button"
              onClick={onNavigateHome}
              className="hud-reticle border border-[#48DDF5]/40 px-4 py-2 font-mono-hud text-xs uppercase tracking-wider text-[#48DDF5] hover:bg-[#48DDF5] hover:text-[#080B18] cursor-pointer"
            >
              Preview Public Site
            </button>
          </div>
        </header>

        {/* 1. DASHBOARD */}
        {activeSection === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="border border-[#48DDF5]/20 bg-[#0E162D] p-5">
                <span className="font-mono-hud text-xs uppercase text-[#9AA6C8]">Projects</span>
                <p className="mt-2 font-display text-3xl font-bold">{data.projects.length}</p>
              </div>
              <div className="border border-[#48DDF5]/20 bg-[#0E162D] p-5">
                <span className="font-mono-hud text-xs uppercase text-[#9AA6C8]">AI Models</span>
                <p className="mt-2 font-display text-3xl font-bold">{data.aiModels.length}</p>
              </div>
              <div className="border border-[#48DDF5]/20 bg-[#0E162D] p-5">
                <span className="font-mono-hud text-xs uppercase text-[#9AA6C8]">Achievements</span>
                <p className="mt-2 font-display text-3xl font-bold">{data.achievements.length}</p>
              </div>
              <div className="border border-[#48DDF5]/20 bg-[#0E162D] p-5">
                <span className="font-mono-hud text-xs uppercase text-[#9AA6C8]">
                  Unread Messages
                </span>
                <p className="mt-2 font-display text-3xl font-bold text-[#48DDF5]">
                  {unreadMessages}
                </p>
              </div>
            </div>

            <div className="border border-[#48DDF5]/20 bg-[#0E162D] p-6">
              <h3 className="font-display text-base font-bold">Recent CMS Security & Audit Log</h3>
              <div className="mt-4 divide-y divide-white/10 text-xs font-mono-hud">
                {data.auditLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[#48DDF5] font-semibold">{log.action}</span>{' '}
                      <span className="text-[#CBD5E1]">[{log.resource}]</span> —{' '}
                      <span className="text-[#9AA6C8]">{log.details}</span>
                    </div>
                    <span className="text-[#8B98B8] shrink-0">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. PROFILE */}
        {activeSection === 'profile' && (
          <div className="border border-[#48DDF5]/20 bg-[#0E162D] p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="font-display text-lg font-bold">Identity & Hero Copy</h3>
                <p className="text-xs text-[#9AA6C8]">
                  Changes autosave after 1.8s or click Save Profile to publish immediately.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSaveProfile()}
                className="hud-reticle inline-flex items-center gap-2 bg-[#4169FF] px-4 py-2 font-mono-hud text-xs uppercase tracking-wider font-semibold text-white cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Profile</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileForm.fullName || ''}
                  onChange={(e) =>
                    scheduleProfileAutosave({ ...profileForm, fullName: e.target.value })
                  }
                  className="mt-1.5 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                  Hero Headline
                </label>
                <input
                  type="text"
                  value={profileForm.headline || ''}
                  onChange={(e) =>
                    scheduleProfileAutosave({ ...profileForm, headline: e.target.value })
                  }
                  className="mt-1.5 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                  Subheading Roles
                </label>
                <input
                  type="text"
                  value={profileForm.subheading || ''}
                  onChange={(e) =>
                    scheduleProfileAutosave({ ...profileForm, subheading: e.target.value })
                  }
                  className="mt-1.5 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                  Personal Brand Statement
                </label>
                <textarea
                  rows={2}
                  value={profileForm.brandStatement || ''}
                  onChange={(e) =>
                    scheduleProfileAutosave({ ...profileForm, brandStatement: e.target.value })
                  }
                  className="mt-1.5 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                  Short Introduction
                </label>
                <textarea
                  rows={2}
                  value={profileForm.shortIntro || ''}
                  onChange={(e) =>
                    scheduleProfileAutosave({ ...profileForm, shortIntro: e.target.value })
                  }
                  className="mt-1.5 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                  Availability / Status Indicator
                </label>
                <input
                  type="text"
                  value={profileForm.statusText || ''}
                  onChange={(e) =>
                    scheduleProfileAutosave({ ...profileForm, statusText: e.target.value })
                  }
                  className="mt-1.5 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={profileForm.contactEmail || ''}
                  onChange={(e) =>
                    scheduleProfileAutosave({ ...profileForm, contactEmail: e.target.value })
                  }
                  className="mt-1.5 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                  Education
                </label>
                <input
                  type="text"
                  value={profileForm.education || ''}
                  onChange={(e) =>
                    scheduleProfileAutosave({ ...profileForm, education: e.target.value })
                  }
                  className="mt-1.5 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                  Current Internship
                </label>
                <input
                  type="text"
                  value={profileForm.currentInternship || ''}
                  onChange={(e) =>
                    scheduleProfileAutosave({ ...profileForm, currentInternship: e.target.value })
                  }
                  className="mt-1.5 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="md:col-span-2 flex flex-wrap items-center gap-4 pt-2">
                <label className="inline-flex items-center gap-2 font-mono-hud text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(profileForm.showEmailPublicly)}
                    onChange={(e) =>
                      scheduleProfileAutosave({
                        ...profileForm,
                        showEmailPublicly: e.target.checked,
                      })
                    }
                  />
                  <span>Display email address publicly in Connect & Footer</span>
                </label>

                <label className="inline-flex items-center gap-2 border border-[#48DDF5]/40 px-3 py-1.5 font-mono-hud text-xs uppercase text-[#48DDF5] cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Profile Photo (PNG/JPEG/WebP)</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        handleFileUpload(f, 'profile', (url) => {
                          handleSaveProfile({ profileImageUrl: url });
                        });
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 3. ABOUT & CURRENTLY EXPLORING */}
        {activeSection === 'about' && (
          <div className="space-y-8">
            {renderCollectionManager({
              resource: 'about_themes',
              title: 'About Narrative Pillars',
              subtitle: 'Curiosity, Creation, Leadership storytelling themes.',
              items: data.aboutThemes,
              getPrimary: (i) => i.title,
              getSecondary: (i) => i.subtitle,
            })}
            {renderCollectionManager({
              resource: 'exploring_items',
              title: 'Currently Exploring Cards',
              subtitle: 'Active learning areas, Acme AI Labs & OpenTech Developer Community focus highlights.',
              items: data.exploringItems,
              getPrimary: (i) => i.title,
              getSecondary: (i) => `${i.category} — ${i.summary}`,
            })}
          </div>
        )}

        {/* 4. AI PLAYGROUND */}
        {activeSection === 'playground' && (
          <div className="space-y-8">
            {renderCollectionManager({
              resource: 'ai_categories',
              title: 'AI Playground Categories (12 Ecosystems)',
              subtitle: 'Manage model categories across LLMs, Multimodal, Agents, Reasoning, etc.',
              items: data.aiCategories,
              getPrimary: (i) => i.name,
              getSecondary: (i) => i.description,
            })}
            {renderCollectionManager({
              resource: 'ai_models',
              title: 'AI Models & Experience Notes',
              subtitle:
                'Add or update models with honest experience levels (Exploring, Prompting, Experimenting, Building With).',
              items: data.aiModels,
              getPrimary: (i) => `${i.name} (${i.experienceLevel})`,
              getSecondary: (i) => `${i.providerOrFamily} — ${i.experienceNotes}`,
            })}
          </div>
        )}

        {/* 5. SKILLS */}
        {activeSection === 'skills' &&
          renderCollectionManager({
            resource: 'skills',
            title: 'Technical Skills & Constellation Connections',
            subtitle: 'Manage languages and AI skills plus their connected graph edges.',
            items: data.skills,
            getPrimary: (i) => i.name,
            getSecondary: (i) => `${i.category} — ${i.description}`,
          })}

        {/* 6. PROJECTS */}
        {activeSection === 'projects' &&
          renderCollectionManager({
            resource: 'projects',
            title: 'Projects & Case Studies',
            subtitle: 'Manage NexusRAG and additional builds, architecture notes, and GitHub links.',
            items: data.projects,
            getPrimary: (i) => i.title,
            getSecondary: (i) => `${i.category} — ${i.tagline || i.description}`,
          })}

        {/* 7. ACHIEVEMENTS */}
        {activeSection === 'achievements' &&
          renderCollectionManager({
            resource: 'achievements',
            title: 'Achievements & Recognition',
            subtitle: 'Manage School of Computing & AI Bootcamp medal, Hackathons, and certificate uploads.',
            items: data.achievements,
            getPrimary: (i) => i.title,
            getSecondary: (i) => `${i.eventOrIssuer} (${i.recognitionTier})`,
          })}

        {/* 8. LEADERSHIP */}
        {activeSection === 'leadership' &&
          renderCollectionManager({
            resource: 'leadership_roles',
            title: 'Leadership & Campus Involvement',
            subtitle: 'Manage Vice President Student Engineering Council, Campus Ambassador OpenTech Developer Community, and student roles.',
            items: data.leadershipRoles,
            getPrimary: (i) => `${i.position} — ${i.organization}`,
            getSecondary: (i) => i.description,
          })}

        {/* 9. EXPERIENCE */}
        {activeSection === 'experience' &&
          renderCollectionManager({
            resource: 'experiences',
            title: 'Internships & Work Experience',
            subtitle: 'Manage Acme AI Labs internship details, start dates, and responsibilities.',
            items: data.experiences,
            getPrimary: (i) => `${i.position} at ${i.organization}`,
            getSecondary: (i) => `${i.startDate || 'Current'} — ${i.description}`,
          })}

        {/* 10. CERTIFICATIONS */}
        {activeSection === 'certifications' &&
          renderCollectionManager({
            resource: 'certifications',
            title: 'Verified Certifications',
            subtitle: 'Add verified certificates and credential URLs.',
            items: data.certifications,
            getPrimary: (i) => i.title,
            getSecondary: (i) => `${i.issuer} ${i.issueDate ? `· ${i.issueDate}` : ''}`,
          })}

        {/* 11. RESUME */}
        {activeSection === 'resume' && (
          <div className="border border-[#48DDF5]/20 bg-[#0E162D] p-6 space-y-5">
            <div>
              <h3 className="font-display text-lg font-bold">
                Verified Curriculum Vitae & Resume PDF
              </h3>
              <p className="text-sm text-[#CBD5E1] mt-1">
                Active Verified CV:{' '}
                <span className="font-mono-hud text-[#48DDF5]">
                  {profileForm.resumeFilename || 'Alex_Rivera_Resume.pdf'}
                </span>{' '}
                (
                <span className="font-mono-hud text-xs text-[#9AA6C8]">
                  {profileForm.resumeUrl || '/assets/aistudio/Alex_Rivera_resume_8bdab9ad.pdf'}
                </span>
                )
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="hud-reticle inline-flex items-center gap-2 bg-[#4169FF] px-4 py-2.5 font-mono-hud text-xs uppercase tracking-wider font-semibold text-white cursor-pointer">
                <Upload className="h-4 w-4" />
                <span>Upload Replacement PDF</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      handleFileUpload(f, 'resume', (url, origName) => {
                        handleSaveProfile({ resumeUrl: url, resumeFilename: origName });
                      });
                    }
                  }}
                />
              </label>

              {profileForm.resumeUrl !== '/assets/aistudio/Alex_Rivera_resume_8bdab9ad.pdf' && (
                <button
                  type="button"
                  onClick={() =>
                    handleSaveProfile({
                      resumeUrl: '/assets/aistudio/Alex_Rivera_resume_8bdab9ad.pdf',
                      resumeFilename: 'Alex_Rivera_Resume.pdf',
                    })
                  }
                  className="border border-white/25 px-4 py-2.5 font-mono-hud text-xs uppercase tracking-wider text-[#CBD5E1] hover:border-[#48DDF5] cursor-pointer"
                >
                  Restore Verified Curriculum Vitae PDF
                </button>
              )}

              <a
                href={
                  profileForm.resumeUrl || '/assets/aistudio/Alex_Rivera_resume_8bdab9ad.pdf'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="border border-[#48DDF5]/40 px-4 py-2.5 font-mono-hud text-xs uppercase tracking-wider text-[#48DDF5]"
              >
                Open Active Resume PDF
              </a>
            </div>

            <div className="pt-3 border-t border-white/10">
              <label className="inline-flex items-center gap-2 font-mono-hud text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(profileForm.resumeEnabled)}
                  onChange={(e) => handleSaveProfile({ resumeEnabled: e.target.checked })}
                />
                <span>Enable public Resume download button on portfolio</span>
              </label>
            </div>
          </div>
        )}

        {/* 12. SOCIAL LINKS & JOURNEY TIMELINE */}
        {activeSection === 'social_links' && (
          <div className="space-y-8">
            {renderCollectionManager({
              resource: 'social_links',
              title: 'Social & Developer Profiles',
              subtitle: 'Manage LinkedIn, GitHub, and additional social profiles.',
              items: data.socialLinks,
              getPrimary: (i) => i.platform,
              getSecondary: (i) => i.url,
            })}
            {renderCollectionManager({
              resource: 'timeline_events',
              title: 'THE JOURNEY SO FAR — Timeline Milestones',
              subtitle: 'Drag and drop or use arrows to reorder chronological milestones.',
              items: data.timelineEvents,
              getPrimary: (i) => i.title,
              getSecondary: (i) => `${i.category} — ${i.summary}`,
            })}
          </div>
        )}

        {/* 13. CONTACT MESSAGES INBOX */}
        {activeSection === 'messages' && (
          <div className="border border-[#48DDF5]/20 bg-[#0E162D] p-6">
            <h3 className="font-display text-lg font-bold">Visitor Contact Inbox</h3>
            <p className="text-xs text-[#9AA6C8] mt-0.5">
              Messages submitted via the spam-protected Connect form.
            </p>

            <div
              className={`mt-4 border p-3.5 text-xs ${
                data.emailDelivery?.configured
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  : 'border-amber-400/40 bg-amber-500/10 text-amber-200'
              }`}
            >
              {data.emailDelivery?.configured ? (
                <p>
                  <strong className="uppercase font-mono-hud">
                    Email Forwarding Active ({data.emailDelivery.provider.toUpperCase()}):
                  </strong>{' '}
                  New contact messages are automatically emailed to{' '}
                  <span className="font-mono-hud underline">{data.emailDelivery.recipientEmail}</span>{' '}
                  with Reply-To set to the visitor.
                </p>
              ) : (
                <p>
                  <strong className="uppercase font-mono-hud">
                    Inbox Storage Only (Automated Email Not Configured):
                  </strong>{' '}
                  Visitor messages are saved below in your private CMS Inbox. To also forward every
                  message directly to{' '}
                  <span className="font-mono-hud">
                    {data.emailDelivery?.recipientEmail || 'alex.rivera@example.com'}
                  </span>
                  , add either Gmail SMTP (<code>SMTP_USER</code> + 16-character Google App Password{' '}
                  <code>SMTP_PASS</code>) or <code>RESEND_API_KEY</code> in your AI Studio Secrets.
                </p>
              )}
            </div>

            {data.contactMessages.length === 0 ? (
              <p className="py-10 text-center font-mono-hud text-xs text-[#8B98B8]">
                No contact messages received yet.
              </p>
            ) : (
              <div className="mt-5 divide-y divide-white/10">
                {data.contactMessages.map((msg) => (
                  <div key={msg.id} className="py-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-display text-sm font-bold text-white">
                          {msg.subject}
                        </span>
                        <span className="ml-3 font-mono-hud text-xs text-[#48DDF5]">
                          {msg.senderName} ({msg.senderEmail})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-hud text-[11px] uppercase px-2 py-0.5 border border-white/20">
                          {msg.status}
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch(`/api/admin/messages/${msg.id}`, {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                                'X-Requested-With': 'XMLHttpRequest',
                              },
                              body: JSON.stringify({
                                status: msg.status === 'read' ? 'unread' : 'read',
                              }),
                            });
                            loadOverview();
                          }}
                          className="border border-white/20 px-2.5 py-1 font-mono-hud text-[11px] uppercase cursor-pointer"
                        >
                          Mark {msg.status === 'read' ? 'Unread' : 'Read'}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch(`/api/admin/messages/${msg.id}`, {
                              method: 'DELETE',
                              headers: { 'X-Requested-With': 'XMLHttpRequest' },
                            });
                            loadOverview();
                          }}
                          aria-label={`Delete message ${msg.subject}`}
                          className="border border-red-400/30 p-1 text-red-300 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-[#CBD5E1] whitespace-pre-line">{msg.message}</p>
                    <p className="font-mono-hud text-[11px] text-[#8B98B8]">
                      Received: {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 14. SEO SETTINGS */}
        {activeSection === 'seo' && (
          <div className="border border-[#48DDF5]/20 bg-[#0E162D] p-6 space-y-4">
            <h3 className="font-display text-lg font-bold">Search Engine & OpenGraph Metadata</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                  Site Title
                </label>
                <input
                  type="text"
                  value={seoForm.siteTitle || ''}
                  onChange={(e) => setSeoForm({ ...seoForm, siteTitle: e.target.value })}
                  className="mt-1.5 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                  Meta Description
                </label>
                <textarea
                  rows={2}
                  value={seoForm.metaDescription || ''}
                  onChange={(e) => setSeoForm({ ...seoForm, metaDescription: e.target.value })}
                  className="mt-1.5 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                  Keywords
                </label>
                <input
                  type="text"
                  value={seoForm.keywords || ''}
                  onChange={(e) => setSeoForm({ ...seoForm, keywords: e.target.value })}
                  className="mt-1.5 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                setSaveState('saving');
                const res = await fetch('/api/admin/seo', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                  },
                  body: JSON.stringify({
                    siteTitle: seoForm.siteTitle,
                    metaDescription: seoForm.metaDescription,
                    ogTitle: seoForm.ogTitle || seoForm.siteTitle,
                    ogDescription: seoForm.ogDescription || seoForm.metaDescription,
                    canonicalUrl: seoForm.canonicalUrl || '',
                    keywords: seoForm.keywords || '',
                    authorName: seoForm.authorName || 'Alex Rivera',
                    structuredDataRole: seoForm.structuredDataRole || '',
                  }),
                });
                if (res.ok) {
                  await loadOverview();
                  onPortfolioMutated();
                  notify('SEO metadata saved.');
                } else {
                  notify('Failed to save SEO settings.', 'error');
                }
              }}
              className="hud-reticle bg-[#4169FF] px-4 py-2 font-mono-hud text-xs uppercase tracking-wider font-semibold text-white cursor-pointer"
            >
              Save SEO Metadata
            </button>
          </div>
        )}

        {/* 15. THEME SETTINGS */}
        {activeSection === 'theme' && (
          <div className="border border-[#48DDF5]/20 bg-[#0E162D] p-6 space-y-5">
            <h3 className="font-display text-lg font-bold">Default Universe & Theme Defaults</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                  Default Color Mode
                </label>
                <select
                  value={themeForm.defaultColorMode || 'dark'}
                  onChange={(e) =>
                    setThemeForm({ ...themeForm, defaultColorMode: e.target.value as any })
                  }
                  className="mt-1.5 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                >
                  <option value="dark">Midnight Dark</option>
                  <option value="light">Architectural Light</option>
                </select>
              </div>
              <div>
                <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                  Default 3D Universe Mode
                </label>
                <select
                  value="circuit"
                  onChange={() =>
                    setThemeForm({ ...themeForm, defaultUniverseMode: 'circuit' })
                  }
                  className="mt-1.5 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                >
                  <option value="circuit">Isometric Circuit Command Hub</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                setSaveState('saving');
                const res = await fetch('/api/admin/theme', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                  },
                  body: JSON.stringify({
                    defaultColorMode: themeForm.defaultColorMode || 'dark',
                    defaultUniverseMode: 'circuit',
                    highQualityDefault: Boolean(themeForm.highQualityDefault ?? true),
                    soundEffectsDefault: Boolean(themeForm.soundEffectsDefault ?? false),
                    accentPrimary: themeForm.accentPrimary || '#4169FF',
                    accentViolet: themeForm.accentViolet || '#8257FF',
                    accentCyan: themeForm.accentCyan || '#48DDF5',
                    accentGold: themeForm.accentGold || '#F2B84B',
                  }),
                });
                if (res.ok) {
                  await loadOverview();
                  onPortfolioMutated();
                  notify('Theme defaults saved.');
                } else {
                  notify('Failed to save theme defaults.', 'error');
                }
              }}
              className="hud-reticle bg-[#4169FF] px-4 py-2 font-mono-hud text-xs uppercase tracking-wider font-semibold text-white cursor-pointer"
            >
              Save Theme Defaults
            </button>
          </div>
        )}

        {/* 16. SECURITY SETTINGS (Owner Password, TOTP 2FA, Active Sessions) */}
        {activeSection === 'security' && (
          <div className="space-y-6">
            <div className="border border-[#48DDF5]/20 bg-[#0E162D] p-6 space-y-5">
              <h3 className="font-display text-lg font-bold">
                Owner CMS Password & 2FA Authentication
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                    Set or Update CMS Password (Min 10 Characters)
                  </label>
                  <input
                    type="password"
                    value={newCmsPassword}
                    onChange={(e) => setNewCmsPassword(e.target.value)}
                    placeholder="Enter strong password..."
                    className="w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (newCmsPassword.length < 10) {
                        notify('Password must be at least 10 characters.', 'error');
                        return;
                      }
                      const res = await fetch('/api/admin/security', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          'X-Requested-With': 'XMLHttpRequest',
                        },
                        body: JSON.stringify({ newPassword: newCmsPassword }),
                      });
                      if (res.ok) {
                        setNewCmsPassword('');
                        await loadOverview();
                        notify('CMS password hash updated.');
                      } else {
                        const err = await res.json();
                        notify(err.error || 'Failed to update password.', 'error');
                      }
                    }}
                    className="hud-reticle bg-[#4169FF] px-4 py-2 font-mono-hud text-xs uppercase tracking-wider font-semibold text-white cursor-pointer"
                  >
                    Update CMS Password
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="font-mono-hud text-xs uppercase text-[#CBD5E1]">
                    Two-Factor Authentication (TOTP):{' '}
                    <span className="text-[#48DDF5] font-semibold">
                      {data.security.totpEnabled ? 'ENABLED' : 'NOT ENABLED'}
                    </span>
                  </p>

                  {!data.security.totpEnabled ? (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await fetch('/api/admin/security/totp-setup', {
                            method: 'POST',
                            headers: { 'X-Requested-With': 'XMLHttpRequest' },
                          });
                          if (res.ok) {
                            setTotpSetupInfo(await res.json());
                          }
                        }}
                        className="border border-[#48DDF5]/40 px-3.5 py-2 font-mono-hud text-xs uppercase text-[#48DDF5] cursor-pointer"
                      >
                        Generate 2FA Secret Key
                      </button>

                      {totpSetupInfo && (
                        <div className="border border-white/15 bg-[#080B18] p-3 space-y-2 text-xs font-mono-hud">
                          <div>Secret: {totpSetupInfo.secret}</div>
                          <input
                            type="text"
                            placeholder="Enter 6-digit code to enable"
                            value={totpVerifyCode}
                            onChange={(e) => setTotpVerifyCode(e.target.value)}
                            className="w-full border border-[#48DDF5]/35 bg-[#0E162D] px-2.5 py-1.5 text-white"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const res = await fetch('/api/admin/security', {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'X-Requested-With': 'XMLHttpRequest',
                                },
                                body: JSON.stringify({
                                  totpAction: 'enable',
                                  totpCode: totpVerifyCode,
                                }),
                              });
                              if (res.ok) {
                                setTotpSetupInfo(null);
                                setTotpVerifyCode('');
                                await loadOverview();
                                notify('2FA enabled on owner account.');
                              } else {
                                const err = await res.json();
                                notify(err.error || 'Invalid 2FA code.', 'error');
                              }
                            }}
                            className="bg-emerald-600 px-3 py-1.5 text-white uppercase cursor-pointer"
                          >
                            Verify & Enable 2FA
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch('/api/admin/security', {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                          },
                          body: JSON.stringify({ totpAction: 'disable' }),
                        });
                        await loadOverview();
                        notify('2FA disabled.');
                      }}
                      className="border border-red-400/40 px-3.5 py-2 font-mono-hud text-xs uppercase text-red-300 cursor-pointer"
                    >
                      Disable 2FA
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                    Session Lifetime (Hours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={sessionTtl}
                    onChange={(e) => setSessionTtl(Number(e.target.value))}
                    className="mt-1.5 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                    Contact Form Rate Limit (per 15 min)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={contactLimit}
                    onChange={(e) => setContactLimit(Number(e.target.value))}
                    className="mt-1.5 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  const res = await fetch('/api/admin/security', {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify({
                      sessionTtlHours: sessionTtl,
                      contactRateLimitPer15Min: contactLimit,
                    }),
                  });
                  if (res.ok) {
                    await loadOverview();
                    notify('Session & rate-limit policies saved.');
                  }
                }}
                className="border border-[#48DDF5]/40 px-4 py-2 font-mono-hud text-xs uppercase text-[#48DDF5] cursor-pointer"
              >
                Save Policy Limits
              </button>
            </div>

            {/* Active Sessions & Revocation */}
            <div className="border border-[#48DDF5]/20 bg-[#0E162D] p-6">
              <h3 className="font-display text-base font-bold">Active Owner Sessions</h3>
              <div className="mt-4 divide-y divide-white/10 text-xs font-mono-hud">
                {data.activeSessions.map((sess) => (
                  <div key={sess.id} className="py-2.5 flex items-center justify-between gap-4">
                    <div className="truncate">
                      <span className="text-[#48DDF5] uppercase">{sess.authProvider}</span> —{' '}
                      <span className="text-[#CBD5E1]">{sess.userAgent || 'Browser'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch(`/api/admin/sessions/${sess.id}`, {
                          method: 'DELETE',
                          headers: { 'X-Requested-With': 'XMLHttpRequest' },
                        });
                        loadOverview();
                      }}
                      className="border border-red-400/35 px-2.5 py-1 text-red-300 uppercase cursor-pointer shrink-0"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Universal Create / Edit Modal for Any of the 12 Collections */}
      {editingResource && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit CMS Entry"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
        >
          <form
            onSubmit={handleSaveItemDraft}
            className="w-full max-w-2xl border border-[#48DDF5]/35 bg-[#0E162D] p-6 sm:p-7 text-white space-y-4 my-8"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-display text-lg font-bold">
                {editingItemId ? 'Edit Entry' : 'Create New Entry'} ({editingResource})
              </h3>
              <label className="inline-flex items-center gap-2 font-mono-hud text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(itemDraft.isPublished ?? true)}
                  onChange={(e) =>
                    setItemDraft({ ...itemDraft, isPublished: e.target.checked })
                  }
                />
                <span>Published</span>
              </label>
            </div>

            {/* Dynamic Fields Based on Resource Type */}
            {(editingResource === 'about_themes' ||
              editingResource === 'exploring_items' ||
              editingResource === 'projects' ||
              editingResource === 'achievements' ||
              editingResource === 'certifications' ||
              editingResource === 'timeline_events') && (
              <div>
                <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={itemDraft.title || ''}
                  onChange={(e) => setItemDraft({ ...itemDraft, title: e.target.value })}
                  className="mt-1 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                />
              </div>
            )}

            {(editingResource === 'skills' ||
              editingResource === 'ai_categories' ||
              editingResource === 'ai_models') && (
              <div>
                <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={itemDraft.name || ''}
                  onChange={(e) => setItemDraft({ ...itemDraft, name: e.target.value })}
                  className="mt-1 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                />
              </div>
            )}

            {(editingResource === 'leadership_roles' || editingResource === 'experiences') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                    Position / Role *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemDraft.position || ''}
                    onChange={(e) => setItemDraft({ ...itemDraft, position: e.target.value })}
                    className="mt-1 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                    Organization *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemDraft.organization || ''}
                    onChange={(e) => setItemDraft({ ...itemDraft, organization: e.target.value })}
                    className="mt-1 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
            )}

            {editingResource === 'social_links' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                    Platform *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemDraft.platform || ''}
                    onChange={(e) => setItemDraft({ ...itemDraft, platform: e.target.value })}
                    className="mt-1 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                    Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemDraft.label || ''}
                    onChange={(e) => setItemDraft({ ...itemDraft, label: e.target.value })}
                    className="mt-1 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                    URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={itemDraft.url || ''}
                    onChange={(e) => setItemDraft({ ...itemDraft, url: e.target.value })}
                    className="mt-1 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
            )}

            {editingResource === 'ai_models' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                    Category
                  </label>
                  <select
                    value={itemDraft.categoryId || ''}
                    onChange={(e) =>
                      setItemDraft({ ...itemDraft, categoryId: Number(e.target.value) })
                    }
                    className="mt-1 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                  >
                    {data.aiCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                    Provider / Family *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemDraft.providerOrFamily || ''}
                    onChange={(e) =>
                      setItemDraft({ ...itemDraft, providerOrFamily: e.target.value })
                    }
                    className="mt-1 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                    Experience Level
                  </label>
                  <select
                    value={itemDraft.experienceLevel || 'Exploring'}
                    onChange={(e) =>
                      setItemDraft({ ...itemDraft, experienceLevel: e.target.value })
                    }
                    className="mt-1 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                  >
                    <option value="Exploring">Exploring</option>
                    <option value="Prompting">Prompting</option>
                    <option value="Experimenting">Experimenting</option>
                    <option value="Building With">Building With</option>
                  </select>
                </div>
              </div>
            )}

            {(editingResource === 'skills' ||
              editingResource === 'exploring_items' ||
              editingResource === 'projects' ||
              editingResource === 'timeline_events') && (
              <div>
                <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                  Category *
                </label>
                {editingResource === 'timeline_events' ? (
                  <select
                    value={itemDraft.category || 'Project'}
                    onChange={(e) => setItemDraft({ ...itemDraft, category: e.target.value })}
                    className="mt-1 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                  >
                    <option value="Education">Education</option>
                    <option value="Achievement">Achievement</option>
                    <option value="Leadership">Leadership</option>
                    <option value="Internship">Internship</option>
                    <option value="Project">Project</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={itemDraft.category || ''}
                    onChange={(e) => setItemDraft({ ...itemDraft, category: e.target.value })}
                    className="mt-1 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                  />
                )}
              </div>
            )}

            {editingResource === 'achievements' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                    Event or Issuer *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemDraft.eventOrIssuer || ''}
                    onChange={(e) =>
                      setItemDraft({ ...itemDraft, eventOrIssuer: e.target.value })
                    }
                    className="mt-1 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                    Recognition Tier
                  </label>
                  <select
                    value={itemDraft.recognitionTier || 'recognition'}
                    onChange={(e) =>
                      setItemDraft({ ...itemDraft, recognitionTier: e.target.value })
                    }
                    className="mt-1 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                  >
                    <option value="medal">Performance Medal</option>
                    <option value="second_place">Second Place</option>
                    <option value="finalist">Finalist</option>
                    <option value="recognition">Recognition</option>
                  </select>
                </div>
              </div>
            )}

            {editingResource === 'projects' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={itemDraft.tagline || ''}
                    onChange={(e) => setItemDraft({ ...itemDraft, tagline: e.target.value })}
                    className="mt-1 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={itemDraft.githubUrl || ''}
                    onChange={(e) => setItemDraft({ ...itemDraft, githubUrl: e.target.value })}
                    className="mt-1 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                    Tech Stack (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={itemDraft.techStackText || ''}
                    onChange={(e) => setItemDraft({ ...itemDraft, techStackText: e.target.value })}
                    className="mt-1 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
            )}

            {editingResource !== 'social_links' && (
              <div>
                <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                  Description / Narrative *
                </label>
                <textarea
                  rows={3}
                  required
                  value={
                    itemDraft.description ??
                    itemDraft.narrative ??
                    itemDraft.summary ??
                    itemDraft.experienceNotes ??
                    ''
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (editingResource === 'about_themes') {
                      setItemDraft({ ...itemDraft, narrative: val });
                    } else if (
                      editingResource === 'exploring_items' ||
                      editingResource === 'timeline_events'
                    ) {
                      setItemDraft({ ...itemDraft, summary: val });
                    } else if (editingResource === 'ai_models') {
                      setItemDraft({ ...itemDraft, experienceNotes: val });
                    } else {
                      setItemDraft({ ...itemDraft, description: val });
                    }
                  }}
                  className="mt-1 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                />
              </div>
            )}

            {(editingResource === 'leadership_roles' || editingResource === 'experiences') && (
              <div>
                <label className="block font-mono-hud text-xs uppercase text-[#CBD5E1]">
                  Responsibilities (One per line)
                </label>
                <textarea
                  rows={3}
                  value={itemDraft.responsibilitiesText || ''}
                  onChange={(e) =>
                    setItemDraft({ ...itemDraft, responsibilitiesText: e.target.value })
                  }
                  className="mt-1 w-full border border-[#48DDF5]/25 bg-[#080B18] px-3 py-2 text-sm text-white"
                />
              </div>
            )}

            {(editingResource === 'projects' || editingResource === 'achievements') && (
              <div className="pt-2">
                <label className="inline-flex items-center gap-2 border border-[#48DDF5]/40 px-3 py-1.5 font-mono-hud text-xs uppercase text-[#48DDF5] cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  <span>
                    Upload {editingResource === 'projects' ? 'Screenshot' : 'Photo / Certificate'}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      handleFileUpload(
                        f,
                        editingResource === 'projects' ? 'project' : 'certificate',
                        (url) => {
                          if (editingResource === 'projects') {
                            const existing = splitLines(itemDraft.screenshotsText || '');
                            setItemDraft({
                              ...itemDraft,
                              screenshotsText: [...existing, url].join('\n'),
                            });
                          } else if (url.endsWith('.pdf')) {
                            setItemDraft({ ...itemDraft, certificateUrl: url });
                          } else {
                            setItemDraft({ ...itemDraft, photoUrl: url });
                          }
                        },
                      );
                    }}
                  />
                </label>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setEditingResource(null);
                  setEditingItemId(null);
                }}
                className="border border-white/20 px-4 py-2 font-mono-hud text-xs uppercase tracking-wider text-[#CBD5E1] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="hud-reticle inline-flex items-center gap-1.5 bg-[#4169FF] px-5 py-2 font-mono-hud text-xs uppercase tracking-wider font-semibold text-white cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Save Entry</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
