"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HeartPulse,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Sparkles,
  Building2,
  Activity,
  Brain,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, login, verifyOtp, directTokenLogin } = useAuth();

  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // If already authenticated, navigate to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/overview");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const result = await login(email, password);

      if (result.requiresOtp) {
        setStep("otp");
        setOtp(""); // Require typing the code sent to inbox
        setSuccessMsg(`A 6-digit verification code has been sent to ${email}. Please check your inbox and enter it below.`);
      } else {
        setSuccessMsg("Welcome back! Redirecting to your workspace...");
        setTimeout(() => {
          router.replace("/overview");
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      setSuccessMsg(`A new 6-digit verification code has been sent to ${email}. Please check your inbox.`);
      setResendCooldown(30);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to resend verification code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await verifyOtp(email, otp);
      setSuccessMsg("Two-factor verification successful! Accessing workspace...");
      setTimeout(() => {
        router.replace("/overview");
      }, 800);
    } catch (err: any) {
      setErrorMsg(err?.message || "Invalid OTP code. Please check and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectOAuthLogin = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await directTokenLogin(email, password);
      setSuccessMsg("Signed in via OAuth2 token! Opening dashboard...");
      setTimeout(() => {
        router.replace("/overview");
      }, 800);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to authenticate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const autofillAdmin = () => {
    setEmail("machariaevans636@gmail.com");
    setPassword("Admin@123");
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-background font-sans">
      {/* LEFT COLUMN: Dark Brand Showcase */}
      <div className="relative hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-12 xl:p-16 bg-[#080b10] text-white overflow-hidden border-r border-border/20">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-rose-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full bg-rose-950/20 blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg p-2.5">
              <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-rose-700 text-white">
                <HeartPulse className="h-5 w-5" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white">MaishaWatch</span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-rose-500">
                Healthcare Intelligence
              </span>
            </div>
          </div>

          <div className="space-y-4 pt-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-400">
              <Sparkles className="h-3 w-3" />
              Kenya Ministry of Health Capstone
            </div>

            <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-[1.15] text-white">
              Better insights. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-rose-400">
                Stronger hospitals.
              </span>
            </h1>

            <p className="max-w-xl text-base text-slate-400 leading-relaxed pt-2">
              Bring hospital telemetry, maintenance risk, and medical equipment utilization together in one trusted national workspace.
            </p>
          </div>
        </div>

        {/* Live Metrics Grid on Left Panel */}
        <div className="relative z-10 grid grid-cols-3 gap-4 py-8 border-y border-white/10 my-8">
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
              <Building2 className="h-3.5 w-3.5 text-rose-500" /> Facilities
            </div>
            <p className="mt-1 text-2xl font-black text-white">12,394</p>
            <p className="text-[11px] text-slate-500">47 Counties</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
              <Activity className="h-3.5 w-3.5 text-blue-400" /> Equipment
            </div>
            <p className="mt-1 text-2xl font-black text-white">150 Assets</p>
            <p className="text-[11px] text-slate-500">Critical care units</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
              <Brain className="h-3.5 w-3.5 text-emerald-400" /> ML Models
            </div>
            <p className="mt-1 text-2xl font-black text-white">24/7 RUL</p>
            <p className="text-[11px] text-slate-500">Predictive risk</p>
          </div>
        </div>

        {/* Footer Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-300 backdrop-blur-md">
            <ShieldCheck className="h-4 w-4 text-rose-500" />
            <span className="font-semibold">Secure hospital equipment intelligence</span>
          </div>
          <span className="text-[11px] text-slate-500">v2.1.0 · FastApi & Next.js</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Authentication Form */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-12 xl:p-16 bg-card text-foreground">
        {/* Top Header / Guest Link */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md">
              <HeartPulse className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm">MaishaWatch</span>
          </div>

          <div className="ml-auto">
            <Link
              href="/overview"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-border/60 hover:bg-accent"
            >
              <span>Explore as Guest</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Form Container */}
        <div className="max-w-md w-full mx-auto my-auto py-8">
          <div className="space-y-2 mb-8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Welcome back
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Sign in to MaishaWatch
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Enter your details to access your healthcare workspace.
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">{successMsg}</p>
            </div>
          )}

          {/* STEP 1: EMAIL & PASSWORD */}
          {step === "credentials" && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold tracking-wider uppercase text-foreground">
                  Work Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@maishawatch.go.ke"
                    className="w-full h-12 rounded-2xl border border-border bg-background/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold tracking-wider uppercase text-foreground">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={autofillAdmin}
                    className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-12 rounded-2xl border border-border bg-background/50 pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-xs text-muted-foreground">Remember my email on this device</span>
                </label>
              </div>

              {/* Submit CTA */}
              <div className="pt-3 space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Authenticating with Backend...
                    </>
                  ) : (
                    <>
                      Sign in securely
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleDirectOAuthLogin}
                  className="w-full h-10 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-50 transition-colors"
                >
                  Quick Sign In via OAuth2 (/auth/token)
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: 2-FACTOR OTP */}
          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-muted-foreground space-y-2">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <Mail className="h-4 w-4" />
                  Code Dispatched to Your Email
                </div>
                <p className="text-foreground leading-relaxed">
                  A 6-digit verification code has been sent to <strong className="font-mono text-rose-600 dark:text-rose-400">{email}</strong>.
                  Please check your inbox (and Spam/Junk folder) and enter it below.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold tracking-wider uppercase text-foreground">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full h-12 text-center font-mono tracking-[0.35em] text-xl rounded-2xl border border-border bg-background pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting || otp.length < 4}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying Code...
                    </>
                  ) : (
                    <>
                      Verify and enter workspace
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setStep("credentials")}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back to credentials
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting || resendCooldown > 0}
                    onClick={handleResendOtp}
                    className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline disabled:opacity-40 transition-opacity"
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer Security Notice */}
        <div className="text-center pt-8 border-t border-border/40">
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
            <Lock className="h-3 w-3" />
            Your connection is secure and encrypted
          </p>
        </div>
      </div>
    </div>
  );
}
