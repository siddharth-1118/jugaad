"use client";

import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { ShieldAlert, Check, X, FileText, ArrowRight, MessageSquare, AlertCircle, UserPlus, Trash } from "lucide-react";

interface PendingItem {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  resourceId: string;
  title: string;
  type: string;
  format: string;
  uploadedBy: string;
  uploadedAt: string;
}

export default function ModerationPage() {
  const { 
    courses, 
    user, 
    approveResource, 
    rejectResource, 
    addNotification,
    contributors,
    addContributor,
    removeContributor
  } = useApp();

  // Tab State
  const [activeTab, setActiveTab] = useState<"pending" | "contributors">("pending");

  // Dialog States
  const [selectedItem, setSelectedItem] = useState<PendingItem | null>(null);
  const [feedback, setFeedback] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  // Add Contributor States
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Read all pending uploads across catalog
  const pendingItems: PendingItem[] = [];
  courses.forEach((course) => {
    course.resources.forEach((res) => {
      if (res.status === "Pending") {
        pendingItems.push({
          courseId: course.id,
          courseCode: course.code,
          courseTitle: course.title,
          resourceId: res.id,
          title: res.title,
          type: res.type,
          format: res.format,
          uploadedBy: res.uploadedBy,
          uploadedAt: res.uploadedAt
        });
      }
    });
  });

  const triggerActionDialog = (item: PendingItem, type: "approve" | "reject") => {
    setSelectedItem(item);
    setActionType(type);
    setFeedback(type === "approve" ? "Excellent quality academic resource. Approved for catalog indexing." : "Formatting errors or incorrect folder categorization. Please re-upload.");
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !actionType) return;

    if (actionType === "approve") {
      approveResource(selectedItem.courseId, selectedItem.resourceId, feedback);
    } else {
      rejectResource(selectedItem.courseId, selectedItem.resourceId, feedback);
    }

    // Reset dialog
    setSelectedItem(null);
    setActionType(null);
    setFeedback("");
  };

  const handleAddContributor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setIsAdding(true);
    try {
      await addContributor(newEmail, newName);
      setNewEmail("");
      setNewName("");
    } catch (err: any) {
      alert(err.message || "Failed to add contributor.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveContributor = async (id: string) => {
    if (!confirm("Are you sure you want to remove this contributor? They will lose upload privileges.")) return;
    try {
      await removeContributor(id);
    } catch (err: any) {
      alert(err.message || "Failed to remove contributor.");
    }
  };

  // If user role doesn't have privileges, block
  const hasPrivileges = user && (user.role === "Admin" || user.role === "Contributor");
  if (!hasPrivileges) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-bg-card border border-border-card rounded-2xl space-y-4">
        <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Access Unauthorized</h2>
        <p className="text-sm text-zinc-500">
          Only users holding the Admin or Educator Contributor persona can access the moderation pipeline.
        </p>
        <p className="text-xs text-zinc-400">
          Use the credentials page or header selector to switch your role to Contributor or Admin.
        </p>
      </div>
    );
  }

  const isAdmin = user && user.role === "Admin";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Moderation & Administration
        </h1>
        <p className="text-zinc-500">Review student uploads, check formatting, and manage registered contributors.</p>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-border-card">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2.5 border-b-2 font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === "pending"
              ? "border-accent-primary text-accent-primary"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          Pending Submissions ({pendingItems.length})
        </button>
        <button
          onClick={() => setActiveTab("contributors")}
          className={`px-4 py-2.5 border-b-2 font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === "contributors"
              ? "border-accent-primary text-accent-primary"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          Contributor Registry ({contributors.length})
        </button>
      </div>

      {activeTab === "pending" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Pending Items List (Left/Main) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
              <span>{pendingItems.length} submissions awaiting review</span>
              <span>Policy: WCAG contrast check required</span>
            </div>

            {pendingItems.length === 0 ? (
              <div className="border border-dashed border-border-card rounded-2xl p-12 text-center bg-bg-card space-y-2">
                <Check className="h-10 w-10 text-emerald-500 bg-emerald-500/10 p-2 rounded-full mx-auto" />
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Moderation Queue Clear!</p>
                <p className="text-xs text-zinc-500">All submitted academic files have been indexed and reviewed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingItems.map((item) => (
                  <div
                    key={item.resourceId}
                    className="bg-bg-card border border-border-card rounded-2xl p-5 hover:shadow-xs transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 uppercase">
                            {item.type}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-zinc-150 dark:bg-zinc-800 text-zinc-500 uppercase">
                            {item.format}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            Course folder: <span className="font-semibold">{item.courseCode}</span>
                          </span>
                        </div>
                        
                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                          {item.title}
                        </h3>
                        
                        <p className="text-xs text-zinc-500">
                          Contributed by <span className="font-semibold text-zinc-700 dark:text-zinc-300">{item.uploadedBy}</span> &bull; {new Date(item.uploadedAt).toLocaleString()}
                        </p>
                      </div>

                      {/* Action button panel */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => triggerActionDialog(item, "approve")}
                          className="p-2 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 rounded-lg transition-all"
                          title="Approve and Publish"
                        >
                          <Check className="h-4.5 w-4.5" />
                        </button>
                        
                        <button
                          onClick={() => triggerActionDialog(item, "reject")}
                          className="p-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-650 rounded-lg transition-all"
                          title="Reject submission"
                        >
                          <X className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Panel / Confirmation dialog (Right) */}
          <div className="lg:col-span-1">
            {selectedItem && actionType ? (
              <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-md space-y-4 sticky top-24">
                <div className="flex items-center gap-2 border-b border-border-card pb-3">
                  <AlertCircle className={`h-5 w-5 ${actionType === "approve" ? "text-emerald-500" : "text-red-500"}`} />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 capitalize">
                    Confirm {actionType} Action
                  </h3>
                </div>

                <div className="text-xs space-y-1.5 text-zinc-600 dark:text-zinc-400">
                  <p><strong>File:</strong> {selectedItem.title}</p>
                  <p><strong>Uploader:</strong> {selectedItem.uploadedBy}</p>
                  <p><strong>Course:</strong> {selectedItem.courseCode}</p>
                </div>

                <form onSubmit={handleConfirmAction} className="space-y-4">
                  <div>
                    <label htmlFor="feedback-text" className="block text-xs font-semibold text-zinc-500 mb-1">
                      Feedback message to contributor
                    </label>
                    <textarea
                      id="feedback-text"
                      required
                      rows={4}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full rounded-lg border border-border-card bg-zinc-50 dark:bg-zinc-900/50 p-3 text-xs text-zinc-900 dark:text-zinc-50 focus:border-accent-primary focus:outline-hidden"
                    />
                  </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className={`flex-1 py-2 rounded-lg font-bold text-xs text-white transition-colors ${
                      actionType === "approve" 
                        ? "bg-emerald-600 hover:bg-emerald-700" 
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    Confirm {actionType === "approve" ? "Approval" : "Rejection"}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => { setSelectedItem(null); setActionType(null); }}
                    className="px-3 py-2 rounded-lg border border-border-card bg-bg-card text-zinc-650 hover:bg-zinc-50 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="border border-dashed border-border-card rounded-2xl p-6 text-center text-xs text-zinc-400 sticky top-24 bg-bg-card/40">
              Select action check/cross button on any pending item to view draft feedback panel.
            </div>
          )}
        </div>
      </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contributor List Registry (Left) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
              <span>{contributors.length} registered contributors</span>
              <span>These email accounts hold upload access privileges</span>
            </div>

            <div className="bg-bg-card border border-border-card rounded-2xl overflow-hidden shadow-xs">
              <table className="min-w-full divide-y divide-border-card text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 font-bold">
                  <tr>
                    <th scope="col" className="px-6 py-3">Name</th>
                    <th scope="col" className="px-6 py-3">SRM Email</th>
                    <th scope="col" className="px-6 py-3">Registered By</th>
                    <th scope="col" className="px-6 py-3">Date Added</th>
                    {isAdmin && <th scope="col" className="px-6 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-card text-zinc-700 dark:text-zinc-300">
                  {contributors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-zinc-400">
                        No contributor accounts registered.
                      </td>
                    </tr>
                  ) : (
                    contributors.map((contrib) => (
                      <tr key={contrib.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                        <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-50">{contrib.name}</td>
                        <td className="px-6 py-4 font-mono">{contrib.email}</td>
                        <td className="px-6 py-4">{contrib.addedBy}</td>
                        <td className="px-6 py-4">{new Date(contrib.addedAt).toLocaleDateString()}</td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleRemoveContributor(contrib.id)}
                              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors"
                              title="Delete Contributor"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Contributor Form (Right) - Visible to Admins */}
          <div className="lg:col-span-1">
            {isAdmin ? (
              <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-md space-y-4 sticky top-24">
                <div className="flex items-center gap-2 border-b border-border-card pb-3">
                  <UserPlus className="h-5 w-5 text-accent-primary" />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">
                    Register Contributor
                  </h3>
                </div>

                <form onSubmit={handleAddContributor} className="space-y-4">
                  <div className="space-y-1">
                    <label htmlFor="contrib-email" className="block text-xs font-semibold text-zinc-500">
                      SRM Email Address
                    </label>
                    <input
                      id="contrib-email"
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="username@srmist.edu.in"
                      className="block w-full rounded-lg border border-border-card bg-zinc-50 dark:bg-zinc-900/50 p-2.5 text-xs text-zinc-900 dark:text-zinc-50 focus:border-accent-primary focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="contrib-name" className="block text-xs font-semibold text-zinc-500">
                      Contributor Name (Optional)
                    </label>
                    <input
                      id="contrib-name"
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Dr. Jane Doe"
                      className="block w-full rounded-lg border border-border-card bg-zinc-50 dark:bg-zinc-900/50 p-2.5 text-xs text-zinc-900 dark:text-zinc-50 focus:border-accent-primary focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAdding}
                    className="w-full py-2 px-4 rounded-lg font-bold text-xs text-white bg-accent-primary hover:bg-accent-hover transition-colors flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="h-4.5 w-4.5" />
                    {isAdding ? "Adding..." : "Add Contributor"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-bg-card border border-border-card rounded-2xl p-5 shadow-xs text-xs text-zinc-500 space-y-3 sticky top-24">
                <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  <span>Admin Authority Required</span>
                </div>
                <p className="leading-5">
                  Only the Administrator role can add or remove registered contributor accounts. 
                  Educators have view-only access to this registry.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
