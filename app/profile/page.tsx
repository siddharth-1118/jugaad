"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../context/AppContext";
import {
  Award,
  Upload,
  Download,
  Calendar,
  Settings,
  Palette,
  Type,
  LayoutGrid,
  FileText,
  Mail,
  IdCard,
  Building2,
  GraduationCap,
  BookOpen,
  Users,
  Hash,
  Phone,
  UserCheck
} from "lucide-react";

export default function ProfilePage() {
  const {
    user,
    isAuthenticated,
    theme,
    toggleDarkMode,
    setAccentColor,
    setFontFamily,
    courses
  } = useApp();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Render loading or null state while redirecting
  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-zinc-400">Loading profile...</div>
      </div>
    );
  }

  // Find some activity logs - now safely inside user check
  const userUploads = useMemo(() => {
    if (!user) return [];
    return courses.flatMap(c => 
      c.resources.filter(r => r.uploadedBy === user.name)
    );
  }, [courses, user]);

  const uploadsCount = userUploads.length;
  const downloadsCount = userUploads.reduce((sum, r) => sum + r.downloadsCount, 0);

  const dynamicBadges = useMemo(() => {
    const list = [];
    if (user.role === "Admin") {
      list.push("Founding Administrator");
    }
    if (uploadsCount >= 1) {
      list.push("First Contribution");
    }
    if (uploadsCount >= 5) {
      list.push("Elite Contributor");
    }
    if (downloadsCount >= 25) {
      list.push("Knowledge Collector");
    }
    return list;
  }, [user.role, uploadsCount, downloadsCount]);

  const getTier = () => {
    if (user.role === "Admin") return "System Administrator";
    if (user.role === "Contributor") return "Verified Educator Contributor";
    return "Student Member";
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          SRM Profile Dashboard
        </h1>
        <p className="text-zinc-500">Manage your SRM profile, achievements, and settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Card: Profile & Stats */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main profile details card */}
          <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="h-20 w-20 bg-accent-primary/10 rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-accent-primary/20">
                {user.avatar}
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{user.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-primary/10 text-accent-primary">
                    {user.role}
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </p>
                {(user as any).registrationNumber && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <IdCard className="h-3.5 w-3.5" />
                    Registration Number: {(user as any).registrationNumber}
                  </p>
                )}
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Joined {new Date(user.joinedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                </div>
              </div>
              
              <div className="text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-1">Status Tier</span>
                <span className="px-3.5 py-1.5 rounded-lg border border-border-card bg-zinc-50 dark:bg-zinc-900/60 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  {getTier()}
                </span>
              </div>
            </div>
          </div>

          {/* SRM Academic Information */}
          {user.role !== "Admin" && (user.department || user.program || user.semester || (user as any).mobile || (user as any).facultyAdvisor || (user as any).academicAdvisor) && (
            <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-xs">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 mb-4">
                <GraduationCap className="h-5 w-5 text-accent-primary" />
                SRM Academic Information
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {user.department && user.department !== "N/A" && (
                  <div className="flex items-start gap-2.5">
                    <Building2 className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">Department</span>
                      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{user.department}</span>
                    </div>
                  </div>
                )}
                {user.program && user.program !== "N/A" && (
                  <div className="flex items-start gap-2.5">
                    <BookOpen className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">Program</span>
                      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{user.program}</span>
                    </div>
                  </div>
                )}
                {user.semester && user.semester !== "N/A" && (
                  <div className="flex items-start gap-2.5">
                    <Hash className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">Semester</span>
                      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{user.semester}</span>
                    </div>
                  </div>
                )}
                {user.batch && user.batch !== "N/A" && (
                  <div className="flex items-start gap-2.5">
                    <Users className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">Batch</span>
                      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{user.batch}</span>
                    </div>
                  </div>
                )}
                {user.section && user.section !== "N/A" && (
                  <div className="flex items-start gap-2.5">
                    <LayoutGrid className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">Section</span>
                      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{user.section}</span>
                    </div>
                  </div>
                )}
                {(user as any).mobile && (user as any).mobile !== "N/A" && (
                  <div className="flex items-start gap-2.5">
                    <Phone className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">Mobile Contact</span>
                      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{(user as any).mobile}</span>
                    </div>
                  </div>
                )}
                {(user as any).facultyAdvisor && (user as any).facultyAdvisor !== "N/A" && (
                  <div className="flex items-start gap-2.5">
                    <UserCheck className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">Faculty Advisor</span>
                      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{(user as any).facultyAdvisor}</span>
                    </div>
                  </div>
                )}
                {(user as any).academicAdvisor && (user as any).academicAdvisor !== "N/A" && (
                  <div className="flex items-start gap-2.5">
                    <UserCheck className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">Academic Advisor</span>
                      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{(user as any).academicAdvisor}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-bg-card border border-border-card rounded-2xl p-5 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-zinc-500 block">Total Contributions</span>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{uploadsCount}</span>
              </div>
            </div>
            
            <div className="bg-bg-card border border-border-card rounded-2xl p-5 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-zinc-500 block">Resources Downloaded</span>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{downloadsCount}</span>
              </div>
            </div>

            <div className="bg-bg-card border border-border-card rounded-2xl p-5 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs text-zinc-500 block">Unlocked Badges</span>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{dynamicBadges.length}</span>
              </div>
            </div>
          </div>

          {/* Achievement Badges Block */}
          <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Dynamic Achievement Badges
            </h3>
            {dynamicBadges.length === 0 ? (
              <p className="text-sm text-zinc-500">Upload files or review syllabus materials to unlock badges!</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {dynamicBadges.map((badge) => (
                  <div
                    key={badge}
                    className="flex flex-col items-center justify-center p-4 border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/10 rounded-xl text-center shadow-2xs hover:scale-102 transition-transform cursor-pointer"
                  >
                    <Award className="h-8 w-8 text-amber-500 mb-2 animate-pulse" />
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-400">{badge}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Activity Log History Trackers */}
          <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-accent-primary" />
              Activity Feed Tracker
            </h3>
            
            <div className="space-y-3">
              {userUploads.length === 0 ? (
                <div className="p-4 border border-dashed border-border-card rounded-xl text-center text-sm text-zinc-500">
                  No uploads tracked for your active name. Visit <a href="/upload" className="text-accent-primary underline">Upload</a> to publish notes.
                </div>
              ) : (
                userUploads.map((res) => (
                  <div key={res.id} className="flex items-center justify-between p-3.5 border border-border-card bg-zinc-50/50 dark:bg-zinc-900/40 rounded-xl text-sm">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-accent-primary" />
                      <div>
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">{res.title}</p>
                        <span className="text-xs text-zinc-400 capitalize">{res.type} &bull; {res.format}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        res.status === "Approved" 
                          ? "bg-emerald-500/10 text-emerald-600" 
                          : res.status === "Pending"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-red-500/10 text-red-600"
                      }`}>
                        {res.status}
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-1">
                        {new Date(res.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Card: Dynamic Theme Customizer */}
        <div className="space-y-6">
          <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-xs space-y-6 sticky top-24">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Settings className="h-5 w-5 text-accent-primary" />
                Theme Customizer
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Configure layout look, accents, and font variants dynamically.</p>
            </div>

            {/* Light / Dark selector */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Mode Selection
              </label>
              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-between p-3.5 border border-border-card bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-sm font-medium transition-colors"
              >
                <span>Dark Mode Enabled</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  theme.dark 
                    ? "bg-accent-primary text-white" 
                    : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                }`}>
                  {theme.dark ? "ON" : "OFF"}
                </span>
              </button>
            </div>

            {/* Accent Palette Selector */}
            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Palette className="h-4.5 w-4.5 text-zinc-400" />
                Color Theme Variant
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: "indigo", name: "Classic Indigo", color: "bg-indigo-600" },
                  { id: "emerald", name: "Forest Emerald", color: "bg-emerald-600" },
                  { id: "violet", name: "Vibrant Violet", color: "bg-violet-600" },
                  { id: "amber", name: "Warm Amber", color: "bg-amber-600" }
                ].map((item) => {
                  const isSel = theme.accent === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setAccentColor(item.id as any)}
                      className={`flex items-center gap-2 p-2.5 border rounded-xl text-xs font-semibold transition-all ${
                        isSel 
                          ? "border-accent-primary bg-accent-primary/10 text-accent-primary" 
                          : "border-border-card hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      <span className={`h-3 w-3 rounded-full ${item.color}`} />
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Family Selector */}
            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Type className="h-4.5 w-4.5 text-zinc-400" />
                Font Typography
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: "sans", name: "Geist Sans (Default)", desc: "Modern, high readability", fontCls: "font-sans" },
                  { id: "inter", name: "Inter Sans-Serif", desc: "Corporate clean tech standard", fontCls: "font-sans" },
                  { id: "outfit", name: "Outfit Google Font", desc: "Round geometric luxury", fontCls: "font-sans" }
                ].map((item) => {
                  const isSel = theme.font === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setFontFamily(item.id as any)}
                      className={`flex flex-col items-start p-3 border rounded-xl text-left transition-all ${
                        isSel 
                          ? "border-accent-primary bg-accent-primary/10 text-accent-primary" 
                          : "border-border-card hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-750 dark:text-zinc-300"
                      }`}
                    >
                      <span className="text-xs font-bold">{item.name}</span>
                      <span className="text-[10px] text-zinc-500 mt-0.5">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
