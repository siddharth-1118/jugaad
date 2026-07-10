"use client";

import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { MessageSquare, ThumbsUp, MessageCircle, Send, PlusCircle, Search, Info } from "lucide-react";

export default function DiscussionPage() {
  const { threads, user, addThread, addReply, likeThread } = useApp();

  // Selected thread for detailed view (defaults to first one if present)
  const [activeThreadId, setActiveThreadId] = useState<string>(threads[0]?.id || "");
  const activeThread = threads.find((t) => t.id === activeThreadId);

  // Form States
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("Computer Science");
  const [filterCategory, setFilterCategory] = useState("");
  const [replyText, setReplyText] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() === "" || newContent.trim() === "") return;
    addThread(newTitle, newContent, newCategory);
    setNewTitle("");
    setNewContent("");
    setShowCreateForm(false);
  };

  const handleCreateReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim() === "" || !activeThreadId) return;
    addReply(activeThreadId, replyText);
    setReplyText("");
  };

  // Filtered threads list
  const filteredThreads = threads.filter((thread) => {
    return filterCategory === "" || thread.category === filterCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Academic Discussion Workspace
          </h1>
          <p className="text-zinc-500">Ask questions, share test preparation tips, and collaborate.</p>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold accent-btn-primary shadow-xs"
        >
          <PlusCircle className="h-4 w-4" />
          Create Discussion Thread
        </button>
      </div>

      {/* Grid: Form/Threads list (Left) and Thread Details View (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form & List */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Create Thread Form */}
          {showCreateForm && (
            <form onSubmit={handleCreateThread} className="bg-bg-card border border-border-card rounded-2xl p-5 shadow-md space-y-4">
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Start a new thread</h3>
              
              <div className="space-y-1">
                <label htmlFor="thread-title" className="block text-[11px] font-bold text-zinc-550">Thread Title</label>
                <input
                  id="thread-title"
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. CS101 recursion tree balancing?"
                  className="block w-full rounded-lg border border-border-card bg-zinc-50 dark:bg-zinc-900/50 p-2.5 text-xs text-zinc-900 dark:text-zinc-50 focus:border-accent-primary focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="thread-cat" className="block text-[11px] font-bold text-zinc-550">Subject Category</label>
                <select
                  id="thread-cat"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="block w-full rounded-lg border border-border-card bg-zinc-50 dark:bg-zinc-900/50 p-2.5 text-xs text-zinc-900 dark:text-zinc-50 focus:border-accent-primary focus:outline-hidden"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="General Academic">General Academic</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="thread-desc" className="block text-[11px] font-bold text-zinc-550">Thread Content</label>
                <textarea
                  id="thread-desc"
                  required
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Elaborate your question, reference resources, or list homework tips..."
                  className="block w-full rounded-lg border border-border-card bg-zinc-50 dark:bg-zinc-900/50 p-2.5 text-xs text-zinc-900 dark:text-zinc-50 focus:border-accent-primary focus:outline-hidden"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg font-bold text-xs text-white bg-accent-primary hover:bg-accent-hover transition-colors"
                >
                  Post Thread
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-2 rounded-lg border border-border-card text-xs font-semibold hover:bg-zinc-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Filter Categories Selector */}
          <div className="bg-bg-card border border-border-card rounded-2xl p-4 shadow-xs space-y-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Filter Category</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "", name: "All Topics" },
                { id: "Computer Science", name: "CS" },
                { id: "Mathematics", name: "Maths" },
                { id: "Physics", name: "Physics" }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    filterCategory === cat.id
                      ? "bg-accent-primary text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-650 hover:bg-zinc-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Threads list */}
          <div className="space-y-3">
            {filteredThreads.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">No threads found in this category.</p>
            ) : (
              filteredThreads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                return (
                  <button
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`w-full text-left p-4 border rounded-2xl transition-all flex flex-col justify-between gap-3 ${
                      isActive
                        ? "border-accent-primary bg-accent-primary/[0.02]"
                        : "border-border-card bg-bg-card hover:bg-zinc-50/50 dark:hover:bg-zinc-900/35"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-400 mb-1">
                        <span>{thread.category}</span>
                        <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 line-clamp-1 leading-5">
                        {thread.title}
                      </h4>
                      <p className="text-xs text-zinc-500 line-clamp-2 mt-1 leading-4">
                        {thread.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold text-zinc-400">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {thread.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {thread.replies.length} replies
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

        </div>

        {/* Right Column: Active Thread Deep-Dive & Comments */}
        <div className="lg:col-span-2">
          {activeThread ? (
            <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-xs space-y-6">
              
              {/* Thread Core Details */}
              <div className="space-y-4 border-b border-border-card pb-5">
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-accent-primary/10 text-accent-primary font-bold">
                      {activeThread.category}
                    </span>
                    <span className="text-zinc-500 font-semibold">
                      Posted by {activeThread.author} ({activeThread.authorRole})
                    </span>
                  </div>
                  <span className="text-zinc-400">
                    {new Date(activeThread.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-6">
                  {activeThread.title}
                </h2>
                
                <p className="text-sm text-zinc-650 dark:text-zinc-300 leading-6 whitespace-pre-line">
                  {activeThread.content}
                </p>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => likeThread(activeThread.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-card hover:bg-accent-primary/5 hover:text-accent-primary text-xs font-semibold text-zinc-500 transition-colors"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Upvote thread ({activeThread.likes})
                  </button>
                  <span className="text-xs text-zinc-400 font-medium">Academic Integrity Monitored</span>
                </div>
              </div>

              {/* Replies Thread list */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  Replies ({activeThread.replies.length})
                </h3>

                {activeThread.replies.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-4 text-center">No replies posted. Share your thoughts or answer this query.</p>
                ) : (
                  <div className="space-y-3.5">
                    {activeThread.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="p-4 border border-zinc-100 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/40 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between text-zinc-500 font-semibold">
                          <span>
                            {reply.author} <span className="text-[10px] text-zinc-400">({reply.authorRole})</span>
                          </span>
                          <span className="text-[10px]">
                            {new Date(reply.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-zinc-700 dark:text-zinc-300 leading-5 font-medium whitespace-pre-line">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comment submission form */}
              <form onSubmit={handleCreateReply} className="border-t border-border-card pt-4 space-y-3">
                <div className="relative">
                  <textarea
                    rows={3}
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Submit comments, references, or study links..."
                    className="w-full rounded-lg border border-border-card bg-zinc-50 dark:bg-zinc-900/50 p-3 pr-10 text-xs text-zinc-900 dark:text-zinc-50 focus:border-accent-primary focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="absolute right-3.5 bottom-3.5 p-1 bg-accent-primary text-white rounded-lg hover:bg-accent-hover transition-colors"
                    title="Send comment"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>

            </div>
          ) : (
            <div className="border border-dashed border-border-card rounded-2xl p-12 text-center text-xs text-zinc-450 bg-bg-card/40">
              Select any academic thread in the left column list to view complete discussion logs.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
