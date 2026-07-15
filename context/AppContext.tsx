"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import initialCoursesData from "../data/courses.json";
import { supabase } from "../lib/supabase";

// Type definitions
export interface Rating {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Version {
  version: number;
  updatedAt: string;
  changesDescription: string;
  modifiedBy: string;
}

export interface Resource {
  id: string;
  title: string;
  type: "pyq" | "cts" | "lecture-notes" | "assignment";
  format: "pdf" | "image" | "video" | "doc";
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  downloadsCount: number;
  status: "Approved" | "Pending" | "Rejected";
  feedback?: string;
  ratings: Rating[];
  versions: Version[];
}

export interface Course {
  id: string;
  title: string;
  code: string;
  year: number;
  semester: number;
  category: string;
  description: string;
  resources: Resource[];
}

export interface UserProfile {
  name: string;
  email: string;
  registrationNumber?: string;
  role: "Admin" | "Contributor" | "Student";
  avatar: string;
  uploadsCount: number;
  downloadsCount: number;
  badges: string[];
  joinedDate: string;
  department?: string;
  program?: string;
  semester?: string;
  batch?: string;
  section?: string;
  mobile?: string;
  facultyAdvisor?: string;
  academicAdvisor?: string;
}

export interface Contributor {
  id: string;
  email: string;
  name: string;
  addedBy: string;
  addedAt: string;
}

export interface ForumReply {
  id: string;
  content: string;
  author: string;
  authorRole: string;
  createdAt: string;
}

export interface ForumThread {
  id: string;
  title: string;
  content: string;
  author: string;
  authorRole: string;
  category: string;
  likes: number;
  replies: ForumReply[];
  createdAt: string;
}

export interface Notification {
  id: string;
  message: string;
  type: "info" | "success" | "warning";
  timestamp: string;
  read: boolean;
}

export type AccentColor = "indigo" | "emerald" | "violet" | "amber";
export type FontFamily = "sans" | "inter" | "outfit";

export interface ThemeConfig {
  dark: boolean;
  accent: AccentColor;
  font: FontFamily;
}

interface AppContextType {
  // Auth & Profile
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setRole: (role: "Admin" | "Contributor" | "Student") => void;
  updateUserStats: (uploadsDelta: number, downloadsDelta: number) => void;
  canUpload: () => boolean;
  
  // Contributors management
  contributors: Contributor[];
  addContributor: (email: string, name?: string) => Promise<void>;
  removeContributor: (id: string) => Promise<void>;
  refreshContributors: () => Promise<void>;
  
  // Theme & Styles
  theme: ThemeConfig;
  toggleDarkMode: () => void;
  setAccentColor: (accent: AccentColor) => void;
  setFontFamily: (font: FontFamily) => void;
  
  // Courses Data
  courses: Course[];
  addResource: (
    courseId: string,
    resource: Omit<Resource, "id" | "status" | "downloadsCount" | "ratings" | "versions">,
    newCourseDetails?: {
      code: string;
      title: string;
      year: number;
      semester: number;
      category: string;
    }
  ) => void;
  addResourceMultiBranch: (
    primaryCourseId: string,
    extraCourseIds: string[],
    resource: Omit<Resource, "id" | "status" | "downloadsCount" | "ratings" | "versions">,
    newCourseDetailsMap: Record<string, any>
  ) => Promise<void>;
  approveResource: (courseId: string, resourceId: string, feedback: string) => void;
  rejectResource: (courseId: string, resourceId: string, feedback: string) => void;
  deleteResource: (courseId: string, resourceId: string) => Promise<void>;
  addReview: (courseId: string, resourceId: string, rating: number, comment: string) => void;
  incrementDownloads: (courseId: string, resourceId: string) => void;
  rollbackResource: (courseId: string, resourceId: string, versionNumber: number) => void;
  
  // Discussions
  threads: ForumThread[];
  addThread: (title: string, content: string, category: string) => void;
  addReply: (threadId: string, content: string) => void;
  likeThread: (threadId: string) => void;
  
  // Notifications
  notifications: Notification[];
  addNotification: (message: string, type: "info" | "success" | "warning") => void;
  markNotificationsAsRead: () => void;
  clearNotifications: () => void;
  
  // Offline Mode
  offlineMode: boolean;
  setOfflineMode: (offline: boolean) => void;
  
  // Mock Active Cursors for Collab Screen
  mockCursors: Record<string, { x: number; y: number; name: string; color: string }>;
}

const initialProfiles: Record<string, UserProfile> = {
  Student: {
    name: "Alex Johnson",
    email: "alex.student@university.edu",
    role: "Student",
    avatar: "🎒",
    uploadsCount: 2,
    downloadsCount: 18,
    badges: ["Quick Learner", "PYQ Explorer"],
    joinedDate: "2025-09-01"
  },
  Contributor: {
    name: "Dr. Sarah Jenkins",
    email: "s.jenkins@university.edu",
    role: "Contributor",
    avatar: "🧪",
    uploadsCount: 12,
    downloadsCount: 45,
    badges: ["Knowledge Sharer", "Top Reviewer"],
    joinedDate: "2025-01-15"
  },
  Admin: {
    name: "Chief Academic Officer",
    email: "admin@srmist.edu.in",
    role: "Admin",
    avatar: "🛡️",
    uploadsCount: 24,
    downloadsCount: 154,
    badges: ["Founding Administrator", "WCAG Champion"],
    joinedDate: "2024-08-10"
  }
};

const initialThreads: ForumThread[] = [
  {
    id: "t-1",
    title: "How to prepare for CS101 final exam?",
    content: "Prof. Alan Turing's past papers seem a bit challenging, especially the recursive functions section. Any tips or summary notes?",
    author: "Alex Johnson",
    authorRole: "Student",
    category: "Computer Science",
    likes: 8,
    replies: [
      {
        id: "rep-1",
        content: "Make sure you draw recursion trees for every problem. It makes tracking stacks much easier! Also, check out Ada's Loops & Conditions notes in the CS101 folder.",
        author: "Dr. Sarah Jenkins",
        authorRole: "Contributor",
        createdAt: "2026-06-28T09:12:00Z"
      },
      {
        id: "rep-2",
        content: "Definitely recursive backtracking. Make sure you practice N-Queens or simple subset generation problems.",
        author: "Prof. Alan Turing",
        authorRole: "Contributor",
        createdAt: "2026-06-28T14:30:00Z"
      }
    ],
    createdAt: "2026-06-27T18:00:00Z"
  },
  {
    id: "t-2",
    title: "Calculus Linear Algebra cheat sheet?",
    content: "Has anyone summarized the eigenvalues and eigenvectors calculations? Finding it hard to remember the diagonalizability rules.",
    author: "Alice Cooper",
    authorRole: "Student",
    category: "Mathematics",
    likes: 5,
    replies: [],
    createdAt: "2026-07-01T10:45:00Z"
  }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Offline Mode
  const [offlineMode, setOfflineMode] = useState<boolean>(false);

  // Auth & Profile
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Contributors
  const [contributors, setContributors] = useState<Contributor[]>([]);

  // Theme Config
  const [theme, setTheme] = useState<ThemeConfig>({
    dark: false,
    accent: "indigo",
    font: "sans"
  });

  // Data state
  const [courses, setCourses] = useState<Course[]>(initialCoursesData as Course[]);
  const [threads, setThreads] = useState<ForumThread[]>(initialThreads);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "n-1",
      message: "Welcome to the Course Resource Library! Explore academic resources here.",
      type: "info",
      timestamp: new Date().toISOString(),
      read: false
    }
  ]);

  // Collab Mock Cursors State
  const [mockCursors, setMockCursors] = useState<Record<string, { x: number; y: number; name: string; color: string }>>({
    "user-1": { x: 120, y: 250, name: "David (Student)", color: "rgba(249, 115, 22, 0.8)" },
    "user-2": { x: 380, y: 150, name: "Maria (Contributor)", color: "rgba(16, 185, 129, 0.8)" },
    "user-3": { x: 550, y: 320, name: "Raj (Student)", color: "rgba(59, 130, 246, 0.8)" }
  });

  // Auth functions
  const login = async (email: string, password: string) => {
    try {
      // Call login API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }

      const data = await response.json();
      
      // Check if user is in contributors list
      let userRole = data.user.role;
      
      if (userRole !== "Admin") {
        const isContributor = contributors.some(c => c.email.toLowerCase() === email.toLowerCase());
        if (isContributor) {
          userRole = "Contributor";
        }
      }

      const userData: UserProfile = {
        ...data.user,
        role: userRole,
      };

      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem("crl_user", JSON.stringify(userData));
      addNotification(`Logged in successfully as ${userRole}`, "success");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("crl_user");
      localStorage.removeItem("crl_role");
      addNotification("Logged out successfully", "info");
    }
  };

  const canUpload = () => {
    if (!user) return false;
    return user.role === "Admin" || user.role === "Contributor";
  };

  // Contributors functions
  const refreshContributors = async () => {
    try {
      const response = await fetch("/api/contributors");
      const data = await response.json();
      setContributors(data.contributors || []);
    } catch (error) {
      console.error("Failed to fetch contributors:", error);
    }
  };

  const addContributor = async (email: string, name?: string) => {
    try {
      const response = await fetch("/api/contributors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, addedBy: user?.email || "admin" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add contributor");
      }

      const data = await response.json();
      setContributors(prev => [...prev, data.contributor]);
      addNotification(`Added ${email} as contributor`, "success");
    } catch (error) {
      console.error("Add contributor error:", error);
      throw error;
    }
  };

  const removeContributor = async (id: string) => {
    try {
      const response = await fetch("/api/contributors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove contributor");
      }

      setContributors(prev => prev.filter(c => c.id !== id));
      addNotification("Contributor removed successfully", "success");
    } catch (error) {
      console.error("Remove contributor error:", error);
      throw error;
    }
  };

  // Load from LocalStorage on mount
  useEffect(() => {
    const cachedOffline = localStorage.getItem("crl_offline");
    if (cachedOffline) setOfflineMode(JSON.parse(cachedOffline));

    const cachedTheme = localStorage.getItem("crl_theme");
    if (cachedTheme) {
      const parsedTheme = JSON.parse(cachedTheme);
      setTheme(parsedTheme);
      applyThemeClasses(parsedTheme);
    }

    const cachedUser = localStorage.getItem("crl_user");
    if (cachedUser) {
      const parsedUser = JSON.parse(cachedUser);
      setUser(parsedUser);
      setIsAuthenticated(true);
    }

    const cachedCourses = localStorage.getItem("crl_courses");
    let currentCoursesList: Course[] = [];
    if (cachedCourses && !cachedCourses.includes("res-101")) {
      currentCoursesList = JSON.parse(cachedCourses);
      setCourses(currentCoursesList);
    } else {
      localStorage.setItem("crl_courses", "[]");
      setCourses([]);
    }
    syncWithSupabase([]);

    const cachedThreads = localStorage.getItem("crl_threads");
    if (cachedThreads) setThreads(JSON.parse(cachedThreads));

    syncNotificationsWithSupabase();

    // Load contributors
    refreshContributors();
  }, []);

  // Update theme settings helper
  const applyThemeClasses = (t: ThemeConfig) => {
    const root = document.documentElement;
    
    // Light/Dark
    if (t.dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Custom Font selector override
    root.style.setProperty("--font-family-override", 
      t.font === "inter" ? "Inter, system-ui, sans-serif" :
      t.font === "outfit" ? "Outfit, system-ui, sans-serif" :
      "var(--font-geist-sans), system-ui, sans-serif"
    );

    // Dynamic accent color
    const accentColors = {
      indigo: { primary: "#4f46e5", hover: "#4338ca", ring: "rgba(79, 70, 229, 0.4)", text: "text-indigo-600 dark:text-indigo-400" },
      emerald: { primary: "#059669", hover: "#047857", ring: "rgba(5, 150, 105, 0.4)", text: "text-emerald-600 dark:text-emerald-400" },
      violet: { primary: "#7c3aed", hover: "#6d28d9", ring: "rgba(124, 58, 237, 0.4)", text: "text-violet-600 dark:text-violet-400" },
      amber: { primary: "#d97706", hover: "#b45309", ring: "rgba(217, 119, 6, 0.4)", text: "text-amber-600 dark:text-amber-400" }
    };
    const choice = accentColors[t.accent];
    root.style.setProperty("--accent-primary", choice.primary);
    root.style.setProperty("--accent-hover", choice.hover);
    root.style.setProperty("--accent-ring", choice.ring);
  };

  const cacheCoursesToLocalStorage = (coursesList: Course[]) => {
    try {
      const sanitized = coursesList.map(c => ({
        ...c,
        resources: (c.resources || []).map(r => {
          if (r.url && r.url.startsWith("data:")) {
            return { ...r, url: "" }; // Strip large base64 data to keep localStorage footprint tiny
          }
          return r;
        })
      }));
      localStorage.setItem("crl_courses", JSON.stringify(sanitized));
    } catch (error) {
      console.error("Failed to write crl_courses to localStorage:", error);
    }
  };

  // Sync utilities
  const saveCourses = (newCourses: Course[]) => {
    setCourses(newCourses);
    cacheCoursesToLocalStorage(newCourses);
  };

  const syncResourceToSupabase = async (
    courseId: string,
    resource: Resource,
    newCourseDetails?: {
      code: string;
      title: string;
      year: number;
      semester: number;
      category: string;
    }
  ) => {
    try {
      let uploaderEmail: string | null = user?.email || null;
      
      if (uploaderEmail) {
        const { data: dbUser } = await supabase
          .from("users")
          .select("email")
          .eq("email", uploaderEmail)
          .single();
        
        if (!dbUser) {
          uploaderEmail = null;
        }
      }

      const { data: dbItems } = await supabase
        .from("items")
        .select("id, photo_url")
        .eq("type", "FOUND")
        .eq("location", "material");

      const targetItem = dbItems?.find(item => {
        try {
          const meta = JSON.parse(item.photo_url);
          return meta.id === resource.id;
        } catch {
          return false;
        }
      });

      const targetCourse = courses.find(c => c.id === courseId);

      const payload = {
        type: "FOUND",
        title: resource.title,
        description: resource.url || "https://example.com/placeholder.pdf",
        category: resource.type,
        location: "material",
        user_email: uploaderEmail,
        photo_url: JSON.stringify({
          id: resource.id,
          downloadsCount: resource.downloadsCount,
          uploadedBy: resource.uploadedBy,
          ratings: resource.ratings,
          versions: resource.versions,
          courseId: courseId,
          realStatus: resource.status,
          format: resource.format,
          feedback: resource.feedback,
          // Store course metadata so we can reconstruct the course folder dynamically!
          courseCode: newCourseDetails?.code || targetCourse?.code || courseId.toUpperCase(),
          courseTitle: newCourseDetails?.title || targetCourse?.title || "Untitled Course",
          courseYear: newCourseDetails?.year || targetCourse?.year || 1,
          courseSemester: newCourseDetails?.semester || targetCourse?.semester || 1,
          courseCategory: newCourseDetails?.category || targetCourse?.category || "Computer Science",
          courseDescription: "Student contributed course folder."
        }),
        status: "Active"
      };

      if (targetItem) {
        await supabase
          .from("items")
          .update(payload)
          .eq("id", targetItem.id);
      } else {
        await supabase
          .from("items")
          .insert([payload]);
      }
    } catch (e: any) {
      console.error("Supabase resource sync error:", e.message);
    }
  };

  const syncNotificationsWithSupabase = async () => {
    try {
      console.log("[Supabase Sync] Fetching notifications from Supabase...");
      const { data: dbNotifs, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Supabase Sync] Error fetching notifications:", error.message);
        const cachedNotifications = localStorage.getItem("crl_notifications");
        if (cachedNotifications) {
          const parsedNotifs = JSON.parse(cachedNotifications);
          setNotifications(parsedNotifs);
        }
        return;
      }

      // Load read IDs from localStorage
      const readIdsRaw = localStorage.getItem("crl_read_notif_ids");
      const readIds = readIdsRaw ? JSON.parse(readIdsRaw) : [];

      const mappedNotifs: Notification[] = dbNotifs.map((dbn: any) => {
        const fullMessage = dbn.title ? `${dbn.title} - ${dbn.message}` : dbn.message;
        let typeMapped: "info" | "success" | "warning" = "info";
        if (dbn.type === "warning" || dbn.type === "admin-broadcast") {
          typeMapped = "warning";
        } else if (dbn.type === "success") {
          typeMapped = "success";
        }

        return {
          id: dbn.id,
          message: fullMessage,
          type: typeMapped,
          timestamp: dbn.created_at || new Date().toISOString(),
          read: readIds.includes(dbn.id)
        };
      });

      setNotifications(mappedNotifs);
      localStorage.setItem("crl_notifications", JSON.stringify(mappedNotifs));
    } catch (e: any) {
      console.error("[Supabase Sync] Notifications sync error:", e.message);
      const cachedNotifications = localStorage.getItem("crl_notifications");
      if (cachedNotifications) {
        const parsedNotifs = JSON.parse(cachedNotifications);
        setNotifications(parsedNotifs);
      }
    }
  };

  const sendDbNotification = async (title: string, message: string, type: string = "broadcast") => {
    try {
      const { error } = await supabase
        .from("notifications")
        .insert([{
          title,
          message,
          type
        }]);
      if (error) {
        console.error("Error inserting notification to DB:", error.message);
      } else {
        await syncNotificationsWithSupabase();
      }
    } catch (e: any) {
      console.error("Failed to send DB notification:", e.message);
    }
  };

  const syncWithSupabase = async (currentCourses: Course[]) => {
    try {
      console.log("[Supabase Sync] Fetching materials from Supabase...");
      const { data: dbItems, error } = await supabase
        .from("items")
        .select("id, title, category, photo_url, location, created_at")
        .eq("type", "FOUND")
        .eq("location", "material");

      if (error) {
        console.error("[Supabase Sync] Error fetching materials:", error.message);
        return;
      }

      console.log(`[Supabase Sync] Fetched ${dbItems?.length || 0} materials.`);

      const coursesMap = new Map<string, Course>();

      // Seed default courses shown in the UI mockup screenshot
      const defaultCourses: Course[] = [
        {
          id: "cs201",
          code: "CS201",
          title: "Data Structures & Algorithms",
          year: 1,
          semester: 1,
          category: "Computer Science & Engineering",
          description: "Advance programming knowledge with structured collections. Covers stacks, queues, linked lists, binary trees, heaps, hash tables, and graphs.",
          resources: []
        },
        {
          id: "cs202",
          code: "CS202",
          title: "Computer Networks",
          year: 1,
          semester: 1,
          category: "Computer Science & Engineering",
          description: "Introduction to computer network architectures, protocol stacks, routing, and sockets.",
          resources: []
        },
        {
          id: "cs203",
          code: "CS203",
          title: "Database Systems",
          year: 1,
          semester: 1,
          category: "Computer Science & Engineering",
          description: "Explores database models, SQL, indexing, transaction management, and schema optimization.",
          resources: []
        },
        {
          id: "cs204",
          code: "CS204",
          title: "Operating Systems",
          year: 1,
          semester: 1,
          category: "Computer Science & Engineering",
          description: "Covers process scheduling, memory virtualization, file systems, and concurrency primitives.",
          resources: []
        },
        {
          id: "cs205",
          code: "CS205",
          title: "Software Engineering",
          year: 1,
          semester: 1,
          category: "Computer Science & Engineering",
          description: "Focuses on software design patterns, testing, modular code structures, and development lifecycles.",
          resources: []
        },
        {
          id: "math102",
          code: "MATH102",
          title: "Calculus & Linear Algebra",
          year: 1,
          semester: 2,
          category: "Mathematics",
          description: "Explores system matrices, linear systems, eigenvalues, differential equations, and calculus.",
          resources: []
        },
        {
          id: "cs301",
          code: "CS301",
          title: "Theory of Computation",
          year: 2,
          semester: 1,
          category: "Computer Science & Engineering",
          description: "Automata theory, formal languages, Turing machines, decidability, and complexity classes.",
          resources: []
        }
      ];

      defaultCourses.forEach(c => coursesMap.set(c.id, c));

      if (dbItems && dbItems.length > 0) {
        dbItems.forEach((item: any) => {
          try {
            const meta = JSON.parse(item.photo_url || "{}");
            const courseId = meta.courseId || "unknown";
            
            const resource: Resource = {
              id: meta.id || `res-${item.id}`,
              title: item.title,
              type: item.category as any,
              format: meta.format || "pdf",
              url: item.description || "",
              uploadedBy: meta.uploadedBy || "Syllabus Coordinator",
              uploadedAt: item.date_time || item.created_at,
              downloadsCount: meta.downloadsCount || 0,
              status: meta.realStatus || "Approved",
              feedback: meta.feedback || undefined,
              ratings: meta.ratings || [],
              versions: meta.versions || []
            };

            let targetCourse = coursesMap.get(courseId);
            if (!targetCourse) {
              targetCourse = {
                id: courseId,
                code: meta.courseCode || courseId.toUpperCase(),
                title: meta.courseTitle || "Untitled Course",
                year: Number(meta.courseYear) || 1,
                semester: Number(meta.courseSemester) || 1,
                category: meta.courseCategory || "Computer Science",
                description: meta.courseDescription || "Student contributed course folder.",
                resources: []
              };
              coursesMap.set(courseId, targetCourse);
            }
            targetCourse.resources.push(resource);
          } catch (e: any) {
            console.error("[Supabase Sync] Error parsing item metadata:", e.message);
          }
        });
      }

      const updatedCourses = Array.from(coursesMap.values());
      setCourses(updatedCourses);
      cacheCoursesToLocalStorage(updatedCourses);
      console.log("[Supabase Sync] Successfully synced local state with DB!");
    } catch (e: any) {
      console.error("[Supabase Sync] Fatal sync error:", e.message);
    }
  };

  const saveThreads = (newThreads: ForumThread[]) => {
    setThreads(newThreads);
    localStorage.setItem("crl_threads", JSON.stringify(newThreads));
  };

  const saveNotifications = (newNotifs: Notification[]) => {
    setNotifications(newNotifs);
    localStorage.setItem("crl_notifications", JSON.stringify(newNotifs));
  };

  // Auth Functions
  const setRole = (role: "Admin" | "Contributor" | "Student") => {
    const profile = initialProfiles[role];
    setUser(profile);
    localStorage.setItem("crl_role", role);
    addNotification(`Switched active profile view to ${role}`, "info");
  };

  const updateUserStats = (uploadsDelta: number, downloadsDelta: number) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        uploadsCount: prev.uploadsCount + uploadsDelta,
        downloadsCount: prev.downloadsCount + downloadsDelta
      };
      
      // Dynamic achievement badge awards
      const badges = [...prev.badges];
      if (updated.uploadsCount >= 1 && !badges.includes("First Upload")) {
        badges.push("First Upload");
        addNotification("Achievement Unlocked: 'First Upload' Badge!", "success");
      }
      if (updated.uploadsCount >= 5 && !badges.includes("Elite Contributor")) {
        badges.push("Elite Contributor");
        addNotification("Achievement Unlocked: 'Elite Contributor' Badge!", "success");
      }
      if (updated.downloadsCount >= 25 && !badges.includes("Knowledge Collector")) {
        badges.push("Knowledge Collector");
        addNotification("Achievement Unlocked: 'Knowledge Collector' Badge!", "success");
      }
      return {
        ...updated,
        badges
      };
    });
  };

  // Theme Functions
  const toggleDarkMode = () => {
    setTheme(prev => {
      const updated = { ...prev, dark: !prev.dark };
      localStorage.setItem("crl_theme", JSON.stringify(updated));
      applyThemeClasses(updated);
      return updated;
    });
  };

  const setAccentColor = (accent: AccentColor) => {
    setTheme(prev => {
      const updated = { ...prev, accent };
      localStorage.setItem("crl_theme", JSON.stringify(updated));
      applyThemeClasses(updated);
      return updated;
    });
  };

  const setFontFamily = (font: FontFamily) => {
    setTheme(prev => {
      const updated = { ...prev, font };
      localStorage.setItem("crl_theme", JSON.stringify(updated));
      applyThemeClasses(updated);
      return updated;
    });
  };

  // Course Data Operations
  const addResource = async (
    courseId: string,
    resource: Omit<Resource, "id" | "status" | "downloadsCount" | "ratings" | "versions">,
    newCourseDetails?: {
      code: string;
      title: string;
      year: number;
      semester: number;
      category: string;
    }
  ) => {
    if (!user) return;
    const newResource: Resource = {
      ...resource,
      id: `res-${Date.now()}`,
      status: user.role === "Admin" ? "Approved" : "Pending", // Admins skip moderation
      downloadsCount: 0,
      ratings: [],
      versions: [
        {
          version: 1,
          updatedAt: new Date().toISOString(),
          changesDescription: "Initial Uploaded File Draft",
          modifiedBy: user.name
        }
      ]
    };

    let updatedCoursesList = [...courses];
    const courseExists = courses.some(c => c.id === courseId);
    if (!courseExists && newCourseDetails) {
      const newCourse: Course = {
        id: courseId,
        title: newCourseDetails.title,
        code: newCourseDetails.code,
        year: newCourseDetails.year,
        semester: newCourseDetails.semester,
        category: newCourseDetails.category,
        description: "Student contributed course folder.",
        resources: [newResource]
      };
      updatedCoursesList.push(newCourse);
    } else {
      updatedCoursesList = courses.map(course => {
        if (course.id === courseId) {
          return {
            ...course,
            resources: [...course.resources, newResource]
          };
        }
        return course;
      });
    }

    saveCourses(updatedCoursesList);
    updateUserStats(1, 0);

    // Sync to Supabase
    await syncResourceToSupabase(courseId, newResource, newCourseDetails);

    if (user.role === "Admin") {
      addNotification(`New resource '${resource.title}' uploaded and automatically approved.`, "success");
      await sendDbNotification(
        "New Resource Uploaded",
        `Resource '${resource.title}' has been uploaded and automatically approved by Admin.`
      );
    } else {
      addNotification(`Contribution '${resource.title}' submitted for moderation approval.`, "info");
      await sendDbNotification(
        "New Contribution Submitted",
        `Material '${resource.title}' has been submitted by ${user.name} and is pending moderation.`,
        "warning"
      );
    }
  };

  const addResourceMultiBranch = async (
    primaryCourseId: string,
    extraCourseIds: string[],
    resource: Omit<Resource, "id" | "status" | "downloadsCount" | "ratings" | "versions">,
    newCourseDetailsMap: Record<string, any>
  ) => {
    if (!user) return;
    const newResource: Resource = {
      ...resource,
      id: `res-${Date.now()}`,
      status: user.role === "Admin" ? "Approved" : "Pending", // Admins skip moderation
      downloadsCount: 0,
      ratings: [],
      versions: [
        {
          version: 1,
          updatedAt: new Date().toISOString(),
          changesDescription: "Initial Uploaded File Draft",
          modifiedBy: user.name
        }
      ]
    };

    // Chunk DB insertions in batches of 5 to prevent connection pool exhaustion / timeouts
    const allCourseIds = Array.from(new Set([primaryCourseId, ...extraCourseIds]));
    const chunkSize = 5;
    for (let i = 0; i < allCourseIds.length; i += chunkSize) {
      const chunk = allCourseIds.slice(i, i + chunkSize);
      const chunkPromises = chunk.map(courseId => {
        const details = newCourseDetailsMap[courseId];
        return syncResourceToSupabase(courseId, newResource, details);
      });
      await Promise.all(chunkPromises);
      if (i + chunkSize < allCourseIds.length) {
        await new Promise(resolve => setTimeout(resolve, 150)); // tiny cooldown between batches
      }
    }

    // Sync database state back to React context in one unified call
    await syncWithSupabase(courses);

    updateUserStats(allCourseIds.length, 0);

    if (user.role === "Admin") {
      addNotification(`New resource '${resource.title}' uploaded and automatically approved.`, "success");
      await sendDbNotification(
        "New Resource Uploaded",
        `Resource '${resource.title}' has been uploaded and automatically approved by Admin.`
      );
    } else {
      addNotification(`Contribution '${resource.title}' submitted for moderation approval.`, "info");
      await sendDbNotification(
        "New Contribution Submitted",
        `Material '${resource.title}' has been submitted by ${user.name} and is pending moderation.`,
        "warning"
      );
    }
  };

  const deleteResource = async (courseId: string, resourceId: string) => {
    let deletedTitle = "";
    const newCourses = courses.map(course => {
      if (course.id === courseId) {
        return {
          ...course,
          resources: course.resources.filter(res => {
            if (res.id === resourceId) {
              deletedTitle = res.title;
              return false;
            }
            return true;
          })
        };
      }
      return course;
    });
    saveCourses(newCourses);

    // Also remove from Supabase
    try {
      const response = await fetch("/api/delete-resource", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ courseId, resourceId })
      });
      if (!response.ok) {
        const errData = await response.json();
        console.error("Failed to delete from DB via API:", errData.error);
      }
    } catch (e: any) {
      console.error("Supabase delete error:", e.message);
    }

    addNotification(`Material '${deletedTitle}' has been deleted.`, "success");
  };

  const approveResource = async (courseId: string, resourceId: string, feedback: string) => {
    let approvedTitle = "";
    let targetRes: Resource | null = null;
    const newCourses = courses.map(course => {
      if (course.id === courseId) {
        return {
          ...course,
          resources: course.resources.map(res => {
            if (res.id === resourceId) {
              approvedTitle = res.title;
              targetRes = {
                ...res,
                status: "Approved" as const,
                feedback: feedback || "Your academic contribution has been approved by CAO."
              };
              return targetRes;
            }
            return res;
          })
        };
      }
      return course;
    });

    saveCourses(newCourses);
    if (targetRes) {
      await syncResourceToSupabase(courseId, targetRes);
      await sendDbNotification(
        "Resource Approved",
        `Material '${approvedTitle}' has been approved and published to catalog!`,
        "success"
      );
    }
    addNotification(`Resource '${approvedTitle}' has been approved and published to catalog!`, "success");
  };

  const rejectResource = async (courseId: string, resourceId: string, feedback: string) => {
    let rejectedTitle = "";
    let targetRes: Resource | null = null;
    const newCourses = courses.map(course => {
      if (course.id === courseId) {
        return {
          ...course,
          resources: course.resources.map(res => {
            if (res.id === resourceId) {
              rejectedTitle = res.title;
              targetRes = {
                ...res,
                status: "Rejected" as const,
                feedback: feedback || "Content did not meet verification standards."
              };
              return targetRes;
            }
            return res;
          })
        };
      }
      return course;
    });

    saveCourses(newCourses);
    if (targetRes) {
      await syncResourceToSupabase(courseId, targetRes);
      await sendDbNotification(
        "Resource Moderation Update",
        `Material '${rejectedTitle}' did not meet moderation verification criteria.`,
        "warning"
      );
    }
    addNotification(`Resource '${rejectedTitle}' rejected. Feedback: ${feedback}`, "warning");
  };

  const addReview = async (courseId: string, resourceId: string, rating: number, comment: string) => {
    if (!user) return;
    const newReview: Rating = {
      id: `rev-${Date.now()}`,
      user: user.name,
      rating,
      comment,
      date: new Date().toISOString().split("T")[0]
    };

    let targetRes: Resource | null = null;
    const newCourses = courses.map(course => {
      if (course.id === courseId) {
        return {
          ...course,
          resources: course.resources.map(res => {
            if (res.id === resourceId) {
              targetRes = {
                ...res,
                ratings: [...res.ratings, newReview]
              };
              return targetRes;
            }
            return res;
          })
        };
      }
      return course;
    });

    saveCourses(newCourses);
    if (targetRes) {
      await syncResourceToSupabase(courseId, targetRes);
    }
    addNotification(`Thank you! Submitted a ${rating}-star review for resource.`, "success");
  };

  const incrementDownloads = async (courseId: string, resourceId: string) => {
    let targetRes: Resource | null = null;
    const newCourses = courses.map(course => {
      if (course.id === courseId) {
        return {
          ...course,
          resources: course.resources.map(res => {
            if (res.id === resourceId) {
              targetRes = {
                ...res,
                downloadsCount: res.downloadsCount + 1
              };
              return targetRes;
            }
            return res;
          })
        };
      }
      return course;
    });

    saveCourses(newCourses);
    if (targetRes) {
      await syncResourceToSupabase(courseId, targetRes);
    }
    updateUserStats(0, 1);
  };

  const rollbackResource = async (courseId: string, resourceId: string, versionNumber: number) => {
    if (!user) return;
    let targetRes: Resource | null = null;
    const newCourses = courses.map(course => {
      if (course.id === courseId) {
        return {
          ...course,
          resources: course.resources.map(res => {
            if (res.id === resourceId) {
              const targetVerObj = res.versions.find(v => v.version === versionNumber);
              const changesDescription = targetVerObj 
                ? `Rolled back to Version ${versionNumber}: ${targetVerObj.changesDescription}`
                : `Rolled back to Version ${versionNumber}`;

              const nextVersionNo = res.versions.length + 1;
              const newVersionObj: Version = {
                version: nextVersionNo,
                updatedAt: new Date().toISOString(),
                changesDescription,
                modifiedBy: user.name
              };

              targetRes = {
                ...res,
                title: `${res.title.replace(/\s\(V\d+\)/g, "")} (V${versionNumber})`,
                versions: [...res.versions, newVersionObj]
              };
              return targetRes;
            }
            return res;
          })
        };
      }
      return course;
    });

    saveCourses(newCourses);
    if (targetRes) {
      await syncResourceToSupabase(courseId, targetRes);
    }
    addNotification(`Resource version reverted to V${versionNumber}.`, "success");
  };

  // Discussions forum
  const addThread = (title: string, content: string, category: string) => {
    if (!user) return;
    const newThread: ForumThread = {
      id: `t-${Date.now()}`,
      title,
      content,
      author: user.name,
      authorRole: user.role,
      category,
      likes: 0,
      replies: [],
      createdAt: new Date().toISOString()
    };

    const newThreads = [newThread, ...threads];
    saveThreads(newThreads);
    addNotification(`New thread '${title}' successfully posted.`, "success");
  };

  const addReply = (threadId: string, content: string) => {
    if (!user) return;
    const newReply: ForumReply = {
      id: `rep-${Date.now()}`,
      content,
      author: user.name,
      authorRole: user.role,
      createdAt: new Date().toISOString()
    };

    const newThreads = threads.map(thread => {
      if (thread.id === threadId) {
        return {
          ...thread,
          replies: [...thread.replies, newReply]
        };
      }
      return thread;
    });

    saveThreads(newThreads);
    addNotification(`Reply submitted to thread.`, "success");
  };

  const likeThread = (threadId: string) => {
    const newThreads = threads.map(thread => {
      if (thread.id === threadId) {
        return {
          ...thread,
          likes: thread.likes + 1
        };
      }
      return thread;
    });
    saveThreads(newThreads);
  };

  // Notifications
  const addNotification = (message: string, type: "info" | "success" | "warning") => {
    const newNotif: Notification = {
      id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev].slice(0, 30); // limit to 30 items
      localStorage.setItem("crl_notifications", JSON.stringify(updated));
      return updated;
    });
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      const readIds = updated.map(n => n.id);
      localStorage.setItem("crl_read_notif_ids", JSON.stringify(readIds));
      localStorage.setItem("crl_notifications", JSON.stringify(updated));
      return updated;
    });
  };

  const clearNotifications = () => {
    setNotifications(prev => {
      const readIds = prev.map(n => n.id);
      localStorage.setItem("crl_read_notif_ids", JSON.stringify(readIds));
      return [];
    });
    localStorage.removeItem("crl_notifications");
  };

  // Offline Mode toggle
  const toggleOfflineMode = (offline: boolean) => {
    setOfflineMode(offline);
    localStorage.setItem("crl_offline", JSON.stringify(offline));
    if (offline) {
      addNotification("Offline Access Enabled. Reading course index from cached local storage.", "warning");
    } else {
      addNotification("Sync complete. Academic network connections active.", "success");
    }
  };

  // Mock collaboration updates - simulate random pointer moves
  useEffect(() => {
    const interval = setInterval(() => {
      setMockCursors(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          // Add small jitter
          const dx = (Math.random() - 0.5) * 35;
          const dy = (Math.random() - 0.5) * 35;
          next[key] = {
            ...next[key],
            x: Math.max(20, Math.min(750, next[key].x + dx)),
            y: Math.max(20, Math.min(450, next[key].y + dy))
          };
        });
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        setRole,
        updateUserStats,
        canUpload,
        contributors,
        addContributor,
        removeContributor,
        refreshContributors,
        theme,
        toggleDarkMode,
        setAccentColor,
        setFontFamily,
        courses,
        addResource,
        addResourceMultiBranch,
        approveResource,
        rejectResource,
        deleteResource,
        addReview,
        incrementDownloads,
        rollbackResource,
        threads,
        addThread,
        addReply,
        likeThread,
        notifications,
        addNotification,
        markNotificationsAsRead,
        clearNotifications,
        offlineMode,
        setOfflineMode: toggleOfflineMode,
        mockCursors
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
