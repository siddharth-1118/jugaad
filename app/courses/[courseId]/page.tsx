"use client";

import React, { use } from "react";
import Link from "next/link";
import { useApp } from "../../../context/AppContext";
import {
  ArrowLeft,
  GraduationCap,
  BookOpen,
  FileText,
  FileCode,
  FolderOpen,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function CourseDetailsPage({
  params
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const { courses, user, canUpload } = useApp();

  const course = courses.find((c) => c.id === courseId);

  if (!course) {
    return (
      <div className="text-center py-16 bg-bg-card border border-border-card rounded-2xl">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Course Folder Not Found</h2>
        <p className="text-sm text-zinc-500 mt-1">The requested course directory does not exist or was deleted.</p>
        <Link
          href="/courses"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-primary text-white text-xs font-semibold shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Catalog
        </Link>
      </div>
    );
  }

  // Filter resources based on role
  // Students only see Approved resources
  // Contributors see Approved resources + their own Pending uploads
  // Admins see everything
  const visibleResources = course.resources.filter((res) => {
    if (!user) return res.status === "Approved";
    if (user.role === "Admin") return true;
    if (res.status === "Approved") return true;
    if (res.uploadedBy === user.name) return true;
    return false;
  });

  // Group by category type
  const pyqs = visibleResources.filter((r) => r.type === "pyq");
  const notes = visibleResources.filter((r) => r.type === "lecture-notes");
  const cts = visibleResources.filter((r) => r.type === "cts");
  const assigns = visibleResources.filter((r) => r.type === "assignment");

  // Get custom categories in use
  const standardTypes = ["pyq", "lecture-notes", "cts", "assignment"];
  const customTypes = Array.from(new Set(visibleResources
    .filter(r => !standardTypes.includes(r.type))
    .map(r => r.type)));

  const resourceGroups = [
    { title: "Previous Year Questions (PYQs)", type: "pyq", items: pyqs, icon: GraduationCap, color: "text-primary bg-primary/10 border-primary/20" },
    { title: "Lecture Notes & Handouts", type: "lecture-notes", items: notes, icon: BookOpen, color: "text-secondary bg-secondary/10 border-secondary/20" },
    { title: "Class Tests & Quizzes (CTS)", type: "cts", items: cts, icon: FileCode, color: "text-tertiary bg-tertiary/10 border-tertiary/20" },
    { title: "Assignments & Projects", type: "assignment", items: assigns, icon: FileText, color: "text-primary bg-primary/10 border-primary/20" },
    ...customTypes.map(c => ({
      title: c.toUpperCase(),
      type: c,
      items: visibleResources.filter(r => r.type === c),
      icon: FileText,
      color: "text-secondary bg-secondary/10 border-secondary/20"
    }))
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumbs & Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses Catalog
        </Link>

        {/* Upload Contribution Button */}
        {canUpload() && (
          <Link
            href={`/upload?courseId=${course.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-primary text-on-primary shadow-[0_0_15px_rgba(192,193,255,0.4)] hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <PlusCircle className="h-4 w-4" />
            Contribute Material
          </Link>
        )}
      </div>

      {/* Course Heading Summary Banner */}
      <div className="glass-panel border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary uppercase tracking-wide border border-primary/20">
            {course.code}
          </span>
          <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-on-surface-variant">
            Year {course.year} &bull; Semester {course.semester}
          </span>
          <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-on-surface-variant">
            {course.category}
          </span>
        </div>
        
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight font-display-lg">
          {course.title}
        </h1>
        <p className="text-sm text-on-surface-variant max-w-3xl leading-6 font-body-md">
          {course.description}
        </p>
      </div>

      {/* Folders categorized by type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {resourceGroups.map((group) => {
          const Icon = group.icon;
          return (
            <div
              key={group.title}
              className="glass-card border border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Folder Header */}
                <div className={`flex items-center justify-between border border-dashed p-3 rounded-xl mb-4 ${group.color}`}>
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-5.5 w-5.5" />
                    <h3 className="font-bold text-sm tracking-tight text-on-surface">
                      {group.title}
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 text-on-surface-variant border border-white/10">
                    {group.items.length} Files
                  </span>
                </div>

                {/* Resource List in folder */}
                {group.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 text-center space-y-2.5 transition-all">
                    <FolderOpen className="h-7 w-7 text-zinc-350 dark:text-zinc-650 animate-pulse" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-350">Folder is Empty</p>
                      <p className="text-[11px] text-zinc-500 max-w-[200px] leading-4">No verified academic materials have been uploaded here yet.</p>
                    </div>
                    {canUpload() && (
                      <Link
                        href={`/upload?courseId=${course.id}&type=${group.type}`}
                        className="inline-flex items-center gap-1 text-[10px] font-extrabold text-accent-primary hover:underline hover:gap-1.5 transition-all"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        Upload {group.type.toUpperCase()}
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {group.items.map((item) => (
                      <Link
                        key={item.id}
                        href={`/resources/${item.id}?courseId=${course.id}`}
                        className="flex items-center justify-between p-3 border border-white/10 hover:border-primary/50 hover:bg-white/5 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-all"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <FileText className="h-4.5 w-4.5 text-on-surface-variant shrink-0" />
                          <span className="truncate pr-2">{item.title}</span>
                          {/* Pending indicators */}
                          {item.status === "Pending" && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-bold">
                              <Clock className="h-3 w-3" />
                              Pending
                            </span>
                          )}
                          {item.status === "Rejected" && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-bold">
                              <AlertCircle className="h-3 w-3" />
                              Rejected
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-on-surface-variant font-semibold shrink-0">
                          <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                            {item.format}
                          </span>
                          <span>&bull;</span>
                          <span>{item.downloadsCount} dl</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Folder Actions */}
              {canUpload() && (
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                  <Link
                    href={`/upload?courseId=${course.id}&type=${group.type}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-primary hover:underline"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    Add to {group.type === "pyq" ? "PYQs" : group.type === "lecture-notes" ? "Notes" : group.type === "cts" ? "Tests" : "Assignments"}
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
