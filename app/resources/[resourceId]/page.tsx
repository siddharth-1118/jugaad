"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "../../../context/AppContext";
import {
  ArrowLeft,
  Download,
  Star,
  History,
  Users,
  Play,
  Volume2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  FileSpreadsheet,
  FileText,
  MousePointer2,
  CheckCircle,
  MessageSquare
} from "lucide-react";

export default function ResourceDetailsPage({
  params,
  searchParams
}: {
  params: Promise<{ resourceId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { resourceId } = use(params);
  const resolvedSearchParams = use(searchParams);
  const courseIdParam = typeof resolvedSearchParams.courseId === "string" ? resolvedSearchParams.courseId : "";

  const {
    courses,
    user,
    addReview,
    incrementDownloads,
    rollbackResource,
    mockCursors,
    addNotification
  } = useApp();

  // Find course and resource
  const course = courses.find(
    (c) => c.id === courseIdParam || c.resources.some((r) => r.id === resourceId)
  );
  const resource = course?.resources.find((r) => r.id === resourceId);

  // Review Form States
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hasDownloaded, setHasDownloaded] = useState(false);

  // PDF Zoom state
  const [zoom, setZoom] = useState(100);

  // Simulated Video state
  const [isPlaying, setIsPlaying] = useState(false);

  if (!course || !resource) {
    return (
      <div className="text-center py-16 bg-bg-card border border-border-card rounded-2xl">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Resource Not Found</h2>
        <p className="text-sm text-zinc-500 mt-1">The resource document could not be retrieved.</p>
        <Link
          href="/courses"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-primary text-white text-xs font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Catalog
        </Link>
      </div>
    );
  }

  const handleDownload = () => {
    incrementDownloads(course.id, resource.id);
    setHasDownloaded(true);
    addNotification(`Downloaded resource: ${resource.title}`, "success");

    // Simulate browser download file triggering
    const link = document.createElement("a");
    link.href = "#";
    link.setAttribute("download", `${resource.title}.${resource.format}`);
    document.body.appendChild(link);
    // clean link
    document.body.removeChild(link);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim() === "") return;
    addReview(course.id, resource.id, rating, comment);
    setComment("");
    setRating(5);
  };

  // Calculate average rating
  const avgRating =
    resource.ratings.length > 0
      ? (resource.ratings.reduce((sum, r) => sum + r.rating, 0) / resource.ratings.length).toFixed(1)
      : null;

  return (
    <div className="space-y-8">
      {/* Header and Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href={`/courses/${course.id}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {course.code} Folder
        </Link>

        {/* Action Controls */}
        <button
          onClick={handleDownload}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm accent-btn-primary shadow-xs"
        >
          <Download className="h-4 w-4" />
          Download resource file ({resource.format.toUpperCase()})
        </button>
      </div>

      {/* Resource Header info block */}
      <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 uppercase">
              {resource.type}
            </span>
            <span className="px-2.5 py-0.5 rounded bg-accent-primary/10 text-[10px] font-bold text-accent-primary uppercase">
              {resource.format}
            </span>
            <span className="text-xs text-zinc-400">
              Uploaded by {resource.uploadedBy} on {new Date(resource.uploadedAt).toLocaleDateString()}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {resource.title}
          </h1>
          <p className="text-xs text-zinc-400">
            Linked to syllabus: <span className="font-semibold text-zinc-600 dark:text-zinc-300">{course.code} - {course.title}</span>
          </p>
        </div>

        {/* Ratings details stats */}
        <div className="flex items-center gap-6 shrink-0 md:border-l md:border-border-card md:pl-6">
          <div className="text-center">
            <span className="text-xs text-zinc-500 block font-medium">Rating Score</span>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <Star className="h-5.5 w-5.5 text-amber-500 fill-amber-500" />
              <span className="text-xl font-extrabold text-zinc-800 dark:text-zinc-200">
                {avgRating ? avgRating : "N/A"}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 block mt-0.5">({resource.ratings.length} reviews)</span>
          </div>

          <div className="text-center">
            <span className="text-xs text-zinc-500 block font-medium">Downloads</span>
            <span className="text-xl font-extrabold text-zinc-800 dark:text-zinc-200 block mt-1">
              {resource.downloadsCount}
            </span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">times downloaded</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Viewer + Collab Workspace (Left) and Feedback/Version logs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Interactive File Viewer & Collaborative Workspace Overlay */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-bg-card border border-border-card rounded-2xl overflow-hidden shadow-xs flex flex-col">
            
            {/* Viewer Controls */}
            <div className="bg-zinc-50 dark:bg-zinc-900 px-4 py-3 border-b border-border-card flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-emerald-500 animate-pulse" />
                Simulated Collaborative Workspace
              </span>
              
              {/* Document specific headers */}
              {resource.format === "pdf" && (
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                    className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 min-w-10 text-center">{zoom}%</span>
                  <button 
                    onClick={() => setZoom(Math.min(150, zoom + 10))}
                    className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Viewer Area containing mock cursor overlay */}
            <div className="relative min-h-[480px] bg-zinc-100 dark:bg-zinc-950 p-6 overflow-hidden flex items-center justify-center">
              
              {/* Collaborative active cursor mock indicators */}
              <div className="absolute inset-0 z-10 pointer-events-none">
                {Object.entries(mockCursors).map(([id, cursor]) => (
                  <div
                    key={id}
                    className="absolute flex items-center gap-1 transition-all duration-700 ease-out"
                    style={{ left: `${cursor.x}px`, top: `${cursor.y}px` }}
                  >
                    <MousePointer2 className="h-5.5 w-5.5 rotate-270 drop-shadow-md text-white fill-current" style={{ color: cursor.color }} />
                    <span 
                      className="px-2 py-0.5 rounded text-[9px] font-bold text-white shadow-xs" 
                      style={{ backgroundColor: cursor.color }}
                    >
                      {cursor.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Render player matches format */}
              <div className="w-full h-full flex items-center justify-center z-0">
                {resource.format === "pdf" && (
                  <div 
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 max-w-2xl w-full shadow-md text-zinc-800 dark:text-zinc-200 space-y-4"
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center", transition: "transform 0.2s" }}
                  >
                    <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase">
                      <span>Document Page 1 of 3</span>
                      <span>Syllabus: {course.code}</span>
                    </div>
                    <h3 className="text-lg font-bold border-l-3 border-accent-primary pl-2 text-zinc-900 dark:text-zinc-50">
                      {resource.title}
                    </h3>
                    <p className="text-xs leading-5">
                      This is a simulated PDF file preview compiled for {course.title}. In a production environment, this workspace connects to an S3 bucket or Supabase Storage and renders vector-tiles using PDF.js.
                    </p>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Recommended Prep Instructions:</p>
                      <ul className="text-xs list-disc pl-4 space-y-1">
                        <li>Practice recursion equations by mapping tree traces.</li>
                        <li>Reference past solutions from Prof. Alan Turing.</li>
                        <li>Submit code reviews to course forums for contributor feedback.</li>
                      </ul>
                    </div>
                    <p className="text-xs leading-5">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                  </div>
                )}

                {resource.format === "image" && (
                  <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-md text-center">
                    <div className="h-64 bg-zinc-50 dark:bg-zinc-800 border border-dashed border-border-card rounded-xl flex items-center justify-center text-zinc-400 mb-4">
                      <FileSpreadsheet className="h-16 w-16 text-accent-primary" />
                    </div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{resource.title}</h4>
                    <p className="text-xs text-zinc-500 mt-1">Simulated JPG Scan Resource Sheet</p>
                  </div>
                )}

                {resource.format === "video" && (
                  <div className="max-w-xl w-full bg-zinc-900 border border-zinc-850 rounded-2xl shadow-xl overflow-hidden flex flex-col justify-between aspect-video">
                    {/* Mock video canvas screen */}
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-6 relative">
                      {isPlaying ? (
                        <div className="text-center space-y-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto" />
                          <p className="text-xs text-zinc-300">Streaming lecture guide video (01:24 / 45:10)...</p>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setIsPlaying(true)}
                          className="h-16 w-16 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center transition-all scale-102 hover:scale-105"
                        >
                          <Play className="h-7 w-7 fill-white translate-x-0.5" />
                        </button>
                      )}
                    </div>
                    
                    {/* Media Bar Controls */}
                    <div className="bg-black/90 p-3 flex items-center justify-between text-white text-xs border-t border-zinc-800">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-accent-primary">
                          {isPlaying ? <span className="font-bold">Pause</span> : <Play className="h-4 w-4 fill-white" />}
                        </button>
                        <span>01:24 / 45:10</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Volume2 className="h-4 w-4" />
                        <Maximize2 className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                )}

                {resource.format === "doc" && (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 max-w-xl w-full shadow-md text-zinc-800 dark:text-zinc-200 space-y-4">
                    <div className="flex items-center gap-2 text-xs text-blue-500 font-semibold uppercase">
                      <FileText className="h-4.5 w-4.5" />
                      <span>Microsoft Word Mock Doc</span>
                    </div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">{resource.title}</h3>
                    <p className="text-xs leading-5">
                      This is a docx assignment instructions sheet template. You can download this document using the action download button above to review full course directions.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Feedback & Review System */}
          <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-xs space-y-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-accent-primary" />
              Syllabus Resource Reviews
            </h3>

            {/* Leave a review block */}
            <form onSubmit={handleReviewSubmit} className="space-y-4 border-b border-border-card pb-6">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-zinc-650 dark:text-zinc-300">Your Rating:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-0.5 text-amber-500"
                    >
                      <Star className={`h-5 w-5 ${rating >= star ? "fill-amber-500" : "text-zinc-300 dark:text-zinc-700"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="comment" className="block text-xs font-semibold text-zinc-500 mb-1">Feedback Comment</label>
                <textarea
                  id="comment"
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details on whether this was helpful, accurate to exam syllabus, etc."
                  className="w-full rounded-lg border border-border-card bg-zinc-50 dark:bg-zinc-900/50 p-3 text-xs text-zinc-900 dark:text-zinc-50 focus:border-accent-primary focus:ring-1 focus:ring-accent-primary focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg accent-btn-primary shadow-xs"
                >
                  Submit Academic Feedback
                </button>
              </div>
            </form>

            {/* Reviews display */}
            <div className="space-y-4">
              {resource.ratings.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">No reviews submitted yet. Be the first to leave a feedback rating!</p>
              ) : (
                resource.ratings.map((rev) => (
                  <div key={rev.id} className="p-4 border border-zinc-100 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/40 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{rev.user}</span>
                      <span className="text-zinc-400">{rev.date}</span>
                    </div>
                    
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            rev.rating >= star ? "text-amber-500 fill-amber-500" : "text-zinc-200 dark:text-zinc-700"
                          }`}
                        />
                      ))}
                    </div>
                    
                    <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-5">{rev.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Version Control Log Workspace */}
        <div className="space-y-6">
          <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-xs space-y-5 sticky top-24">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <History className="h-5 w-5 text-accent-primary" />
                Document Version History
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Revert draft edits or review submission logs.</p>
            </div>

            <div className="space-y-4">
              {resource.versions.map((ver) => {
                const canRevert = user && (user.role === "Admin" || user.role === "Contributor") && ver.version < resource.versions.length;
                return (
                  <div
                    key={ver.version}
                    className="p-3.5 border border-border-card rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-accent-primary">Draft Version V{ver.version}</span>
                      {ver.version === resource.versions.length && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[9px]">
                          Active Build
                        </span>
                      )}
                    </div>

                    <div className="text-zinc-500 space-y-1">
                      <p className="leading-4 font-medium text-zinc-750 dark:text-zinc-350">{ver.changesDescription}</p>
                      <p className="text-[10px] text-zinc-400">
                        Modified by {ver.modifiedBy} &bull; {new Date(ver.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    {canRevert && (
                      <button
                        onClick={() => rollbackResource(course.id, resource.id, ver.version)}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold rounded-lg border border-accent-primary/20 bg-accent-primary/5 text-accent-primary hover:bg-accent-primary hover:text-white transition-all"
                      >
                        Revert Active to V{ver.version}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
