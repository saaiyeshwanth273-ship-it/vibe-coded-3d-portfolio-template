import React, { useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { AdminDashboard } from './admin/AdminDashboard.tsx';
import { AdminLoginPage } from './admin/AdminLoginPage.tsx';
import { AboutExploringSection } from './components/AboutExploringSection.tsx';
import { AchievementsLeadershipTimeline } from './components/AchievementsLeadershipTimeline.tsx';
import { ContactSection } from './components/ContactSection.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { Footer, Navbar } from './components/Navbar.tsx';
import { ProjectDetailModal } from './components/ProjectDetailModal.tsx';
import { ProjectsSection } from './components/ProjectsSection.tsx';
import { ScrollReveal } from './components/ScrollReveal.tsx';
import { SkillsPlaygroundSection } from './components/SkillsPlaygroundSection.tsx';
import { TemplateRepositoryPage } from './components/TemplateRepositoryPage.tsx';
import {
  ColorMode,
  ProjectItem,
  PublicPortfolioPayload,
} from './types/portfolio.ts';
import { soundEngine } from './utils/soundEffects.ts';

export default function App() {
  const [pathname, setPathname] = useState<string>(() => window.location.pathname || '/');
  const [portfolio, setPortfolio] = useState<PublicPortfolioPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [colorMode, setColorMode] = useState<ColorMode>('dark');
  const [highQuality, setHighQuality] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [themeInitialized, setThemeInitialized] = useState<boolean>(false);

  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);
  const [cmsAuthenticated, setCmsAuthenticated] = useState<boolean>(false);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  const scrollProgressRef = useRef<number>(0);
  const scrollProgressBarRef = useRef<HTMLDivElement | null>(null);
  const heroParallaxRef = useRef<HTMLDivElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const highlightTimeoutRef = useRef<number>(0);

  const navigateTo = useCallback((nextPath: string) => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    setPathname(nextPath);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname || '/');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const fetchPortfolio = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolio');
      if (!res.ok) {
        throw new Error('Failed to load portfolio data.');
      }
      const payload: PublicPortfolioPayload = await res.json();
      setPortfolio(payload);
      setLoadError(null);

      if (!themeInitialized && payload.theme) {
        setColorMode(payload.theme.defaultColorMode || 'dark');
        setHighQuality(payload.theme.highQualityDefault ?? true);
        const sfx = Boolean(payload.theme.soundEffectsDefault);
        setSoundEnabled(sfx);
        soundEngine.setEnabled(sfx);
        setThemeInitialized(true);
      }

      if (payload.seo?.siteTitle) {
        document.title = payload.seo.siteTitle;
      }
    } catch (err: any) {
      setLoadError(err?.message || 'Unable to load portfolio right now.');
    } finally {
      setLoading(false);
    }
  }, [themeInitialized]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Synchronize Dark/Light Mode class on root <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (colorMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [colorMode]);

  // Resolve /projects/:slug route dynamically
  useEffect(() => {
    if (pathname.startsWith('/projects/')) {
      const slug = decodeURIComponent(pathname.replace('/projects/', '')).trim();
      const foundInPortfolio = portfolio?.projects.find((p) => p.slug === slug);
      if (foundInPortfolio) {
        setActiveProject(foundInPortfolio);
      } else if (slug) {
        fetch(`/api/projects/${encodeURIComponent(slug)}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((proj) => {
            if (proj) setActiveProject(proj);
          })
          .catch(() => {});
      }
    } else {
      setActiveProject(null);
    }
  }, [pathname, portfolio]);

  // Check CMS session when visiting /admin
  useEffect(() => {
    if (pathname === '/admin') {
      fetch('/api/auth/session')
        .then((r) => r.json())
        .then((data) => {
          if (data.authenticated) {
            setCmsAuthenticated(true);
          } else {
            setCmsAuthenticated(false);
            navigateTo('/admin/login');
          }
        })
        .catch(() => {
          navigateTo('/admin/login');
        });
    }
  }, [pathname, navigateTo]);

  // Lenis Smooth Scrolling + Scroll Progress tracking for 3D Camera
  useEffect(() => {
    const isAdminRoute = pathname.startsWith('/admin');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const applyScrollVisuals = (rawP: number) => {
      const p = Math.min(1, Math.max(0, Number.isFinite(rawP) ? rawP : 0));
      scrollProgressRef.current = p;
      if (scrollProgressBarRef.current) {
        scrollProgressBarRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
      }
      if (heroParallaxRef.current && !prefersReduced) {
        const yPx = (p * 44).toFixed(1);
        const sc = (1 + p * 0.035).toFixed(4);
        heroParallaxRef.current.style.transform = `translate3d(0, ${yPx}px, 0) scale(${sc})`;
      }
    };

    const handleNativeScroll = () => {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      applyScrollVisuals(window.scrollY / maxScroll);
    };

    window.addEventListener('scroll', handleNativeScroll, { passive: true });
    handleNativeScroll();

    if (isAdminRoute || prefersReduced) {
      return () => window.removeEventListener('scroll', handleNativeScroll);
    }

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', ({ progress }: { progress: number }) => {
      applyScrollVisuals(progress || 0);
    });

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleNativeScroll);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [pathname]);

  useEffect(() => {
    if (!loading && portfolio && lenisRef.current) {
      lenisRef.current.resize();
    }
  }, [loading, portfolio]);

  const handleNavigateSection = useCallback(
    (sectionId: string) => {
      setHighlightedSection(sectionId);
      window.clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = window.setTimeout(() => {
        setHighlightedSection(null);
      }, 2400);

      const scrollToTarget = (el: HTMLElement | null) => {
        if (!el) return;
        const navbarClearance =
          sectionId === 'profile-summary' || sectionId === 'send-direct-message' ? 88 : 68;
        const revealOffset = el.closest('[data-scroll-revealed="false"]') ? 12 : 0;
        const targetY = Math.max(
          0,
          Math.round(el.getBoundingClientRect().top + window.scrollY - revealOffset - navbarClearance),
        );

        if (lenisRef.current) {
          lenisRef.current.resize();
          if (Math.abs(lenisRef.current.animatedScroll - window.scrollY) > 2) {
            lenisRef.current.scrollTo(window.scrollY, { immediate: true, force: true });
          }
          lenisRef.current.scrollTo(targetY, {
            duration: 0.72,
            force: true,
          });
        } else {
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        }
      };

      if (pathname !== '/') {
        navigateTo('/');
        window.setTimeout(() => {
          scrollToTarget(document.getElementById(sectionId));
        }, 120);
        return;
      }

      scrollToTarget(document.getElementById(sectionId));
    },
    [pathname, navigateTo],
  );

  // Private Owner-Only CMS Login Route (/admin/login)
  if (pathname === '/admin/login') {
    return (
      <AdminLoginPage
        onAuthenticated={() => {
          setCmsAuthenticated(true);
          navigateTo('/admin');
        }}
        onNavigateHome={() => navigateTo('/')}
      />
    );
  }

  // Private Owner-Only CMS Dashboard Route (/admin)
  if (pathname === '/admin') {
    if (!cmsAuthenticated) {
      return (
        <div className="min-h-screen bg-[#050507] text-white flex items-center justify-center font-mono-hud text-sm">
          Verifying owner authorization...
        </div>
      );
    }
    return (
      <AdminDashboard
        onLogout={() => {
          setCmsAuthenticated(false);
          navigateTo('/admin/login');
        }}
        onNavigateHome={() => navigateTo('/')}
        onPortfolioMutated={() => {
          fetchPortfolio();
        }}
      />
    );
  }

  if (loading && !portfolio) {
    return (
      <div className="min-h-screen bg-[#F5F5F8] dark:bg-[#050507] text-[#07070B] dark:text-white flex items-center justify-center font-mono-hud text-sm">
        Initializing Alex Rivera Portfolio Universe...
      </div>
    );
  }

  if (loadError && !portfolio) {
    return (
      <div className="min-h-screen bg-[#F5F5F8] dark:bg-[#050507] text-[#07070B] dark:text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="font-mono-hud text-xs uppercase tracking-widest text-[#FF1E38]">
          Connection Interrupted
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold">{loadError}</h1>
        <button
          type="button"
          onClick={() => fetchPortfolio()}
          className="mt-5 hud-reticle bg-[#FF1E38] px-5 py-2.5 font-mono-hud text-xs uppercase text-white cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F8] dark:bg-[#050507] text-[#07070B] dark:text-white transition-colors duration-200">
      <Navbar
        profile={portfolio?.profile || null}
        onNavigateSection={handleNavigateSection}
        onNavigateHome={() => navigateTo('/')}
        scrollProgressBarRef={scrollProgressBarRef}
      />

      {pathname === '/template-repo' ? (
        <TemplateRepositoryPage onBack={() => navigateTo('/')} />
      ) : activeProject ? (
        <ProjectDetailModal
          project={activeProject}
          onClose={() => navigateTo('/')}
          onOpenTemplateRepo={() => navigateTo('/template-repo')}
        />
      ) : (
        <main className="flex-1">
          <HeroSection
            profile={portfolio?.profile || null}
            socialLinks={portfolio?.socialLinks || []}
            colorMode={colorMode}
            onToggleColorMode={() =>
              setColorMode((prev) => (prev === 'dark' ? 'light' : 'dark'))
            }
            highQuality={highQuality}
            onToggleHighQuality={() => setHighQuality((prev) => !prev)}
            soundEnabled={soundEnabled}
            onToggleSound={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              soundEngine.setEnabled(next);
              if (next) soundEngine.playSelect();
            }}
            onNavigateSection={handleNavigateSection}
            scrollProgressRef={scrollProgressRef}
            heroParallaxRef={heroParallaxRef}
          />

          <ScrollReveal>
            <AboutExploringSection
              profile={portfolio?.profile || null}
              aboutThemes={portfolio?.aboutThemes || []}
              exploringItems={portfolio?.exploringItems || []}
              highlightedSection={highlightedSection}
            />
          </ScrollReveal>

          <ScrollReveal delayMs={40}>
            <SkillsPlaygroundSection
              skills={portfolio?.skills || []}
              aiCategories={portfolio?.aiCategories || []}
              aiModels={portfolio?.aiModels || []}
            />
          </ScrollReveal>

          <ScrollReveal delayMs={40}>
            <ProjectsSection
              projects={portfolio?.projects || []}
              onSelectProject={(proj) => {
                setActiveProject(proj);
                navigateTo(`/projects/${encodeURIComponent(proj.slug)}`);
              }}
              onOpenTemplateRepo={() => navigateTo('/template-repo')}
            />
          </ScrollReveal>

          <ScrollReveal delayMs={40}>
            <AchievementsLeadershipTimeline
              achievements={portfolio?.achievements || []}
              leadershipRoles={portfolio?.leadershipRoles || []}
              experiences={portfolio?.experiences || []}
              certifications={portfolio?.certifications || []}
              timelineEvents={portfolio?.timelineEvents || []}
            />
          </ScrollReveal>

          <ScrollReveal delayMs={40}>
            <ContactSection
              profile={portfolio?.profile || null}
              socialLinks={portfolio?.socialLinks || []}
              portfolio={portfolio}
              highlightedSection={highlightedSection}
            />
          </ScrollReveal>
        </main>
      )}

      <Footer
        profile={portfolio?.profile || null}
        socialLinks={portfolio?.socialLinks || []}
        onNavigateSection={handleNavigateSection}
      />
    </div>
  );
}
