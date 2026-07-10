"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../context/AppContext";
import { Lock, Mail, ShieldAlert, GraduationCap } from "lucide-react";

export default function LoginPage() {
  const { login } = useApp();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      await login(email, password);
      router.push("/profile");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header Title */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-3xl drop-shadow-[0_0_12px_rgba(192,193,255,0.4)]">school</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-on-surface font-display-lg">
            Sign in to Jugaad
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant font-body-md">
            SRM Academia Student & Contributor Gateway
          </p>
        </div>

        {/* Credentials Form Box */}
        <div className="glass-panel border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <form className="space-y-4" onSubmit={handleSignIn}>
            <div>
              <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                SRM NetID / Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-on-surface-variant" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="username@srmist.edu.in"
                  className="pl-10 block w-full rounded-lg border-none bg-surface-container-low py-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary/50 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Academia Passkey
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-on-surface-variant" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 block w-full rounded-lg border-none bg-surface-container-low py-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary/50 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-950/15 border border-red-950/40 text-red-400 text-xs font-semibold rounded-lg">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 inline-flex items-center justify-center gap-1.5 py-3 rounded-lg text-xs font-bold bg-primary text-on-primary shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? "Validating with Academia..." : "Sign In"}
            </button>
          </form>


        </div>



      </div>
    </div>
  );
}
