"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export function AdminLoginModal() {
  const { isLoginModalOpen, closeLoginModal, login, verifyOtp, directTokenLogin } = useAuth();

  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Resend cooldown timer
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (!isLoginModalOpen) return null;

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result.requiresOtp) {
        setStep("otp");
        setOtp("");
        setSuccessMsg(`A 6-digit verification code has been sent to ${email}. Please check your inbox.`);
      } else {
        setSuccessMsg("Logged in as System Administrator!");
        setTimeout(() => {
          closeLoginModal();
          resetState();
        }, 1000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to authenticate. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await login(email, password);
      setSuccessMsg(`A new 6-digit verification code has been sent to ${email}. Please check your inbox.`);
      setResendCooldown(30);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to resend verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      await verifyOtp(email, otp);
      setSuccessMsg("2-Factor Authentication Verified! Administrator session active.");
      setTimeout(() => {
        closeLoginModal();
        resetState();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Invalid OTP code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectOAuthLogin = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await directTokenLogin(email, password);
      setSuccessMsg("Direct OAuth2 Token Granted! Administrator session active.");
      setTimeout(() => {
        closeLoginModal();
        resetState();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to authenticate.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setStep("credentials");
    setErrorMsg(null);
    setSuccessMsg(null);
    setOtp("");
  };

  const handleClose = () => {
    resetState();
    closeLoginModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {step === "credentials" ? "Admin Authentication" : "Two-Factor Verification"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {step === "credentials"
              ? "Sign in with national administrator credentials to unlock full write access."
              : `Enter the 6-digit OTP code sent to ${email}`}
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-snug">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-snug font-medium">{successMsg}</p>
          </div>
        )}

        {/* Step 1: Credentials Form */}
        {step === "credentials" && (
          <form onSubmit={handleCredentialsSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full h-10 rounded-xl border border-border bg-background pl-10 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 rounded-xl border border-border bg-background pl-10 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Authenticating with Render...
                  </>
                ) : (
                  <>
                    Sign In with Email & OTP
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleDirectOAuthLogin}
                className="w-full h-9 rounded-xl border border-border bg-card text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 transition-colors"
              >
                Fast Sign In via OAuth2 /auth/token
              </button>
            </div>
          </form>
        )}

        {/* Step 2: 2FA OTP Form */}
        {step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">6-Digit OTP Code</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full h-11 text-center font-mono tracking-widest text-base rounded-xl border border-border bg-background pl-10 pr-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                disabled={isLoading || otp.length < 4}
                className="w-full h-10 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying OTP...
                  </>
                ) : (
                  <>
                    Verify Code & Complete Login
                    <CheckCircle2 className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep("credentials")}
                  className="text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                  ← Back to credentials
                </button>

                <button
                  type="button"
                  disabled={isLoading || resendCooldown > 0}
                  onClick={handleResendOtp}
                  className="text-primary hover:underline font-bold disabled:opacity-40 transition-opacity"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
