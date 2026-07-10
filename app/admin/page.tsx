"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../context/AppContext";
import { 
  UserPlus, 
  Users, 
  Trash2, 
  Shield, 
  Mail, 
  Calendar,
  PlusCircle,
  Loader2
} from "lucide-react";

export default function AdminPage() {
  const { user, contributors, addContributor, removeContributor, addNotification } = useApp();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "Admin") {
      router.push("/");
      addNotification("Access denied. Admin privileges required.", "warning");
    }
  }, [user, router, addNotification]);

  const handleAddContributor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsAdding(true);
    try {
      await addContributor(email, name);
      setEmail("");
      setName("");
    } catch (error: any) {
      addNotification(error.message || "Failed to add contributor", "warning");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveContributor = async (id: string, contributorEmail: string) => {
    if (confirm(`Are you sure you want to remove ${contributorEmail} as a contributor?`)) {
      try {
        await removeContributor(id);
      } catch (error) {
        addNotification("Failed to remove contributor", "warning");
      }
    }
  };

  if (!user || user.role !== "Admin") {
    return null;
  }

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-accent-primary" />
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Manage contributors and oversee the course resource library
          </p>
        </div>

        {/* Add Contributor Section */}
        <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5 text-accent-primary" />
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Add New Contributor
            </h2>
          </div>
          
          <form onSubmit={handleAddContributor} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contributor-email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  SRM Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <input
                    id="contributor-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="faculty.name@srmist.edu.in"
                    className="pl-10 block w-full rounded-lg border border-border-card bg-zinc-50 dark:bg-zinc-900/50 py-2 px-3 text-sm text-zinc-900 dark:text-zinc-50 focus:border-accent-primary focus:ring-1 focus:ring-accent-primary focus:outline-hidden transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="contributor-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Name (Optional)
                </label>
                <input
                  id="contributor-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. John Doe"
                  className="block w-full rounded-lg border border-border-card bg-zinc-50 dark:bg-zinc-900/50 py-2 px-3 text-sm text-zinc-900 dark:text-zinc-50 focus:border-accent-primary focus:ring-1 focus:ring-accent-primary focus:outline-hidden transition-all"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isAdding || !email}
              className="flex items-center gap-2 px-4 py-2 rounded-lg accent-btn-primary text-white font-medium text-sm shadow-sm transition-all disabled:opacity-50"
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  Add Contributor
                </>
              )}
            </button>
          </form>
        </div>

        {/* Contributors List */}
        <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-accent-primary" />
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Contributors ({contributors.length})
            </h2>
          </div>

          {contributors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500 dark:text-zinc-400">
                No contributors added yet. Add faculty members to allow them to upload materials.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-card">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                      Added By
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                      Added On
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-card">
                  {contributors.map((contributor) => (
                    <tr key={contributor.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {contributor.name || contributor.email.split('@')[0]}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {contributor.email}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-zinc-600 dark:text-zinc-400 text-sm">
                          {contributor.addedBy}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-zinc-600 dark:text-zinc-400 text-sm flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(contributor.addedAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRemoveContributor(contributor.id, contributor.email)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Remove contributor"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-bg-card border border-border-card rounded-xl p-4">
            <div className="text-2xl font-bold text-accent-primary">{contributors.length}</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Active Contributors</div>
          </div>
          <div className="bg-bg-card border border-border-card rounded-xl p-4">
            <div className="text-2xl font-bold text-emerald-600">Unlimited</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Material Uploads</div>
          </div>
          <div className="bg-bg-card border border-border-card rounded-xl p-4">
            <div className="text-2xl font-bold text-violet-600">Full</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Admin Access</div>
          </div>
        </div>
      </div>
    </div>
  );
}
