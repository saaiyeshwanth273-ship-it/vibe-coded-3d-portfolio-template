import React, { useEffect, useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { ArrowLeft, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { auth, googleAuthProvider } from '../lib/firebase.ts';

interface AdminLoginPageProps {
  onAuthenticated: () => void;
  onNavigateHome: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onAuthenticated,
  onNavigateHome,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [requiresTotp, setRequiresTotp] = useState(false);

  const [hasPasswordConfigured, setHasPasswordConfigured] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Forgot / Reset Password State
  const [resetMode, setResetMode] = useState<'none' | 'request' | 'confirm'>('none');
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetInfoMsg, setResetInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          onAuthenticated();
          return;
        }
        if (typeof data.hasPasswordConfigured === 'boolean') {
          setHasPasswordConfigured(data.hasPasswordConfigured);
        }
        if (data.totpEnabled) {
          setRequiresTotp(true);
        }
      })
      .catch(() => {
        // Ignore transient status fetch failure
      });
  }, [onAuthenticated]);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await cred.user.getIdToken();

      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          idToken,
          totpCode: totpCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.requiresTotp) {
        setRequiresTotp(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setErrorMsg(data.error || 'Owner authorization rejected.');
        return;
      }

      onAuthenticated();
    } catch (err: any) {
      setErrorMsg(
        err?.message?.includes('popup')
          ? 'Google sign-in popup was closed or blocked. Ensure popups are allowed or use Owner Password login.'
          : 'Google sign-in could not be completed.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          totpCode: totpCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.requiresTotp) {
        setRequiresTotp(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setErrorMsg(data.error || 'Invalid owner credentials.');
        return;
      }

      onAuthenticated();
    } catch {
      setErrorMsg('Authentication request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResetInfoMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      const data = await res.json();
      setResetInfoMsg(
        data.message ||
          'If this email matches the designated owner account, a single-use reset token has been generated in server logs.',
      );
      setResetMode('confirm');
    } catch {
      setErrorMsg('Unable to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResetInfoMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ token: resetToken.trim(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Password reset failed.');
        return;
      }
      setResetInfoMsg(data.message || 'Password updated. Sign in with your new password.');
      setResetMode('none');
      setHasPasswordConfigured(true);
    } catch {
      setErrorMsg('Password reset confirmation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <button
          type="button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 font-mono-hud text-xs uppercase tracking-wider text-[#A0A0B2] hover:text-[#FF1E38] cursor-pointer transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Public Portfolio</span>
        </button>

        <div className="mt-6 hud-reticle border border-[#FF1E38]/35 bg-[#0B0B10] p-7 sm:p-8 shadow-[0_0_32px_rgba(255,30,56,0.12)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border border-[#FF1E38]/40 bg-[#050507] text-[#FF1E38]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono-hud text-[11px] uppercase tracking-widest text-[#FF1E38]">
                Owner-Only Control Plane
              </p>
              <h1 className="font-display text-xl font-bold">Portfolio CMS Sign In</h1>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-[#A0A0B2]">
            Restricted exclusively to the designated portfolio owner account. Public visitor
            registration is permanently disabled.
          </p>

          {resetMode === 'none' ? (
            <>
              {/* Google Owner Sign-In */}
              <div className="mt-6">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleSignIn}
                  className="hud-reticle w-full flex items-center justify-center gap-2.5 bg-[#FF1E38] hover:bg-[#E60023] px-4 py-3 font-display text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,30,56,0.4)] transition-all cursor-pointer disabled:opacity-50"
                >
                  <Lock className="h-4 w-4" />
                  <span>Sign in with Owner Google Account</span>
                </button>
              </div>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/15" />
                <span className="font-mono-hud text-[11px] uppercase tracking-wider text-[#A0A0B2]">
                  Or Owner Credentials
                </span>
                <div className="h-px flex-1 bg-white/15" />
              </div>

              {/* Owner Email & Password Login */}
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label
                    htmlFor="cms-email"
                    className="block font-mono-hud text-xs uppercase tracking-wider text-[#E4E4ED]"
                  >
                    Owner Email
                  </label>
                  <input
                    id="cms-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.rivera@example.com"
                    className="mt-1.5 w-full border border-white/20 bg-[#050507] px-3.5 py-2.5 text-sm text-white focus:border-[#FF1E38] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cms-password"
                    className="block font-mono-hud text-xs uppercase tracking-wider text-[#E4E4ED]"
                  >
                    CMS Password
                  </label>
                  <input
                    id="cms-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      hasPasswordConfigured
                        ? 'Enter CMS password'
                        : 'Configure password in Security Settings after Google sign-in'
                    }
                    className="mt-1.5 w-full border border-white/20 bg-[#050507] px-3.5 py-2.5 text-sm text-white focus:border-[#FF1E38] focus:outline-none"
                  />
                </div>

                {requiresTotp && (
                  <div>
                    <label
                      htmlFor="cms-totp"
                      className="block font-mono-hud text-xs uppercase tracking-wider text-[#FF1E38]"
                    >
                      6-Digit 2FA Authenticator Code
                    </label>
                    <input
                      id="cms-totp"
                      type="text"
                      inputMode="numeric"
                      maxLength={8}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      placeholder="123456"
                      className="mt-1.5 w-full border border-[#FF1E38]/45 bg-[#050507] px-3.5 py-2.5 font-mono-hud text-sm text-white focus:border-[#FF1E38] focus:outline-none"
                    />
                  </div>
                )}

                {errorMsg && (
                  <div
                    role="alert"
                    className="border border-red-400/50 bg-red-500/15 px-3.5 py-2.5 text-xs text-red-200"
                  >
                    {errorMsg}
                  </div>
                )}

                {resetInfoMsg && (
                  <div
                    role="status"
                    className="border border-white/30 bg-white/10 px-3.5 py-2.5 text-xs text-white"
                  >
                    {resetInfoMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full border border-[#FF1E38]/50 bg-[#050507] hover:bg-[#FF1E38] hover:text-white px-4 py-2.5 font-mono-hud text-xs uppercase tracking-wider font-semibold text-[#FF1E38] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Sign In with Password'}
                </button>
              </form>

              <div className="mt-4 text-right">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setResetMode('request');
                  }}
                  className="font-mono-hud text-xs text-[#A0A0B2] hover:text-[#FF1E38] cursor-pointer"
                >
                  Forgot / Reset CMS Password?
                </button>
              </div>
            </>
          ) : resetMode === 'request' ? (
            <form onSubmit={handleRequestReset} className="mt-6 space-y-4">
              <h2 className="font-display text-base font-bold flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-[#FF1E38]" />
                <span>Request Owner Password Reset</span>
              </h2>
              <p className="text-xs text-[#A0A0B2]">
                Generates a single-use 15-minute cryptographic reset token on the server console.
              </p>
              <div>
                <label
                  htmlFor="reset-email"
                  className="block font-mono-hud text-xs uppercase tracking-wider text-[#E4E4ED]"
                >
                  Designated Owner Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="mt-1.5 w-full border border-white/20 bg-[#050507] px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              {errorMsg && (
                <div role="alert" className="text-xs text-red-300">
                  {errorMsg}
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#FF1E38] px-4 py-2.5 font-mono-hud text-xs uppercase tracking-wider font-semibold text-white cursor-pointer"
                >
                  Issue Reset Token
                </button>
                <button
                  type="button"
                  onClick={() => setResetMode('none')}
                  className="border border-white/20 px-4 py-2.5 font-mono-hud text-xs uppercase tracking-wider text-[#E4E4ED] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleConfirmReset} className="mt-6 space-y-4">
              <h2 className="font-display text-base font-bold">Apply New CMS Password</h2>
              {resetInfoMsg && (
                <div className="border border-[#FF1E38]/35 bg-[#050507] p-3 text-xs text-[#E4E4ED]">
                  {resetInfoMsg}
                </div>
              )}
              <div>
                <label
                  htmlFor="reset-token"
                  className="block font-mono-hud text-xs uppercase tracking-wider text-[#E4E4ED]"
                >
                  Single-Use Reset Token
                </label>
                <input
                  id="reset-token"
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="mt-1.5 w-full border border-white/20 bg-[#050507] px-3.5 py-2.5 font-mono-hud text-xs text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="reset-new-password"
                  className="block font-mono-hud text-xs uppercase tracking-wider text-[#E4E4ED]"
                >
                  New Password (Min 10 Characters)
                </label>
                <input
                  id="reset-new-password"
                  type="password"
                  required
                  minLength={10}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1.5 w-full border border-white/20 bg-[#050507] px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              {errorMsg && (
                <div role="alert" className="text-xs text-red-300">
                  {errorMsg}
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#FF1E38] px-4 py-2.5 font-mono-hud text-xs uppercase tracking-wider font-semibold text-white cursor-pointer"
                >
                  Confirm Password Reset
                </button>
                <button
                  type="button"
                  onClick={() => setResetMode('none')}
                  className="border border-white/20 px-4 py-2.5 font-mono-hud text-xs uppercase tracking-wider text-[#E4E4ED] cursor-pointer"
                >
                  Back
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
