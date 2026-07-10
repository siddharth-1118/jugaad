"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import {
  BookOpen,
  UploadCloud,
  MessageSquare,
  User,
  Bell,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Menu,
  X,
  Shield,
  GraduationCap,
  Sparkles,
  LogIn,
  LogOut,
  Users,
  UserPlus,
  LayoutGrid,
  Library,
  Layers,
  BarChart3,
  Crown,
  ChevronDown,
  ChevronUp,
  Globe,
  UserCheck
} from "lucide-react";

export default function GlobalShell({ children }: { children: React.ReactNode }) {
  const {
    user,
    isAuthenticated,
    login,
    logout,
    setRole,
    theme,
    toggleDarkMode,
    notifications,
    markNotificationsAsRead,
    clearNotifications,
    offlineMode,
    setOfflineMode,
    canUpload
  } = useApp();

  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Navigation links aligned with mockup screenshot tabs
  const navLinks = [
    { name: "Dashboard", href: "/", icon: LayoutGrid },
    { name: "My Library", href: "/courses", icon: Library },
  ];

  if (isAuthenticated && canUpload()) {
    navLinks.push({ name: "Uploads", href: "/upload", icon: UploadCloud });
  }

  if (isAuthenticated) {
    navLinks.push({ name: "Analytics", href: "/profile", icon: BarChart3 });
  }

  // Admin/Contributor only links
  const showModeration = isAuthenticated && (user?.role === "Admin" || user?.role === "Contributor");
  const showAdmin = isAuthenticated && user?.role === "Admin";

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="flex flex-col min-h-screen">


      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-surface-container-low/70 backdrop-blur-xl transition-colors duration-200 shadow-sm">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Logo */}
          <Link href="/" className="flex flex-col gap-0.5 justify-center py-1" aria-label="Course Library Home">
            <div className="flex items-center gap-2 text-lg font-bold tracking-tight text-white drop-shadow-[0_0_8px_rgba(99,102,241,0.3)] font-display-lg">
              <Layers className="h-5 w-5 text-indigo-500 glowing-icon" />
              <span>Jugaad</span>
            </div>
            <span className="text-[9px] text-zinc-500 font-semibold tracking-wide block leading-none">Academic Resource Library</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-2" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const LinkIcon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.15)]"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Persona Picker (always visible if authenticated to allow role simulation easily) */}
            {isAuthenticated && user && (
              <div className="relative">
                <button
                  onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-yellow-500/20 bg-yellow-500/10 text-yellow-400 text-xs font-bold hover:bg-yellow-500/20 transition-all cursor-pointer"
                >
                  <Crown className="h-4 w-4 text-yellow-400" />
                  <span>{user?.role === "Admin" ? "Admin" : user?.role === "Contributor" ? "Faculty" : user?.role}</span>
                  {personaDropdownOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-yellow-400/70" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-yellow-400/70" />
                  )}
                </button>

                {/* Persona Simulator Dropdown Menu */}
                {personaDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-60 bg-[#0c0e14]/98 border border-white/10 rounded-xl p-3 shadow-2xl z-50 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-400 border-b border-white/5 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Persona Simulator</span>
                      </div>
                      <button onClick={() => setPersonaDropdownOpen(false)}>
                        <ChevronUp className="h-4 w-4 text-zinc-500 hover:text-zinc-300" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-1 pt-1">
                      {[
                        { name: "Student", icon: GraduationCap, role: "Student" },
                        { name: "Faculty", icon: UserCheck, role: "Contributor" },
                        { name: "Moderator", icon: Shield, role: "Admin" },
                        { name: "Guest", icon: Globe, role: "Guest" }
                      ].map((p) => {
                        const Icon = p.icon;
                        const isCurrent = (p.role === "Guest" && !isAuthenticated) || (isAuthenticated && user?.role === p.role);
                        return (
                          <button
                            key={p.name}
                            onClick={async () => {
                              if (p.role === "Guest") {
                                await logout();
                                router.push("/login");
                              } else {
                                if (!isAuthenticated) {
                                  await login(p.role === "Admin" ? "admin@srmist.edu.in" : p.role === "Contributor" ? "test.educator@srmist.edu.in" : "random.student@srmist.edu.in", "password");
                                }
                                setRole(p.role as any);
                              }
                              setPersonaDropdownOpen(false);
                            }}
                            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold w-full transition-all text-left ${
                              isCurrent
                                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{p.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Avatar with Active Status Indicator */}
            {isAuthenticated && user && (
              <div className="w-8 h-8 rounded-full bg-indigo-950/60 border border-indigo-400/30 text-xs font-bold flex items-center justify-center text-indigo-200 relative select-none">
                {user.role === "Admin" ? "AD" : user.role === "Contributor" ? "FC" : "ST"}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-[#090d16] rounded-full"></span>
              </div>
            )}



            {/* Login/Logout Button */}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
              >
                <LogOut className="h-4.5 w-4.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold accent-btn-primary text-white transition-colors"
              >
                <LogIn className="h-4.5 w-4.5" />
                <span className="hidden sm:inline">Login</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-zinc-600 rounded-lg hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 md:hidden transition-colors"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border-card bg-bg-card py-2 px-4 space-y-1 shadow-md">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? "bg-accent-primary/10 text-accent-primary"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.name}
                </Link>
              );
            })}
            
            {showModeration && (
              <Link
                href="/moderation"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                  pathname === "/moderation"
                    ? "bg-amber-600/10 text-amber-700"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                }`}
              >
                <Shield className="h-5 w-5" />
                Moderation
              </Link>
            )}

            {showAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                  pathname === "/admin"
                    ? "bg-violet-600/10 text-violet-700"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                }`}
              >
                <Users className="h-5 w-5" />
                Admin
              </Link>
            )}

            {/* Mobile auth actions */}
            <div className="pt-2 border-t border-border-card mt-2">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium accent-btn-primary text-white"
                >
                  <LogIn className="h-5 w-5" />
                  Login with SRM
                </Link>
              )}
            </div>
          </div>
        )}
      </header>



      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer System */}
      <footer className="border-t border-border-card bg-bg-card mt-auto transition-colors duration-200">
        <div className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8 md:flex md:items-center md:justify-between">
          <div className="flex justify-center space-x-6 md:order-2">
            <span className="text-xs text-zinc-500 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              WCAG 2.1 Compliant (AA)
            </span>
          </div>
          <div className="mt-8 md:order-1 md:mt-0 text-center md:text-left">
            <p className="text-xs text-zinc-500">&copy; {new Date().getFullYear()} Jugaad Academic Resource Library. SRM Academia Integration.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
