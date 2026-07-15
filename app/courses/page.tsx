"use client";

import React, { use, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useApp } from "../../context/AppContext";
import { BRANCH_FILES } from "../../lib/constants";
import syllabusData from "../../data/syllabus_subjects.json";
import { 
  Search, 
  Filter, 
  FolderOpen, 
  BookMarked, 
  Layers, 
  FileCode, 
  GraduationCap, 
  ChevronRight, 
  PlusCircle, 
  ArrowRight, 
  FileText,
  Clock,
  Sparkles,
  Code
} from "lucide-react";

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: "image/jpeg",
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, "image/jpeg", 0.4); // compress to 40% quality
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

const compressSingleJpeg = (jpegBytes: Uint8Array): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const blob = new Blob([jpegBytes as any], { type: "image/jpeg" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      const maxDim = 1000;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob((compressedBlob) => {
        if (compressedBlob) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const arr = new Uint8Array(reader.result as ArrayBuffer);
            resolve(arr);
          };
          reader.readAsArrayBuffer(compressedBlob);
        } else {
          reject(new Error("Canvas toBlob returned null"));
        }
      }, "image/jpeg", 0.35); // 35% quality
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
};

const compressPDF = async (file: File): Promise<File> => {
  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  const binaryString = new TextDecoder("latin1").decode(uint8);
  
  // Find all DCTDecode image objects
  const imageRegex = /(<<[^>]*\/Subtype\s*\/Image[^>]*\/Filter\s*\/DCTDecode[^>]*>>\s*stream\r?\n)([\s\S]*?)(\r?\nendstream)/g;
  let matches = [...binaryString.matchAll(imageRegex)];
  
  if (matches.length === 0) {
    const looseRegex = /(<<[^>]*\/Filter\s*\/DCTDecode[^>]*\/Subtype\s*\/Image[^>]*>>\s*stream\r?\n)([\s\S]*?)(\r?\nendstream)/g;
    matches = [...binaryString.matchAll(looseRegex)];
  }
  
  if (matches.length === 0) return file;
  
  let offset = 0;
  let newBinaryString = "";
  
  for (const match of matches) {
    const matchIndex = match.index!;
    const header = match[1];
    const rawStream = match[2];
    const footer = match[3];
    
    newBinaryString += binaryString.substring(offset, matchIndex);
    
    const jpegBytes = new Uint8Array(rawStream.length);
    for (let i = 0; i < rawStream.length; i++) {
      jpegBytes[i] = rawStream.charCodeAt(i);
    }
    
    try {
      const compressedJpegBytes = await compressSingleJpeg(jpegBytes);
      if (compressedJpegBytes.length < rawStream.length) {
        const paddingLength = rawStream.length - compressedJpegBytes.length;
        const paddedBytes = new Uint8Array(rawStream.length);
        paddedBytes.set(compressedJpegBytes);
        paddedBytes.fill(32, compressedJpegBytes.length); // Space padding
        
        let paddedString = "";
        const chunkSize = 16384;
        for (let i = 0; i < paddedBytes.length; i += chunkSize) {
          paddedString += String.fromCharCode.apply(null, Array.from(paddedBytes.subarray(i, i + chunkSize)));
        }
        
        newBinaryString += header + paddedString + footer;
      } else {
        newBinaryString += match[0];
      }
    } catch (err) {
      console.error("Scanned page compression failed:", err);
      newBinaryString += match[0];
    }
    
    offset = matchIndex + match[0].length;
  }
  
  newBinaryString += binaryString.substring(offset);
  
  const outputUint8 = new Uint8Array(newBinaryString.length);
  for (let i = 0; i < newBinaryString.length; i++) {
    outputUint8[i] = newBinaryString.charCodeAt(i) & 0xff;
  }
  
  return new File([outputUint8.buffer], file.name.replace(/\.[^/.]+$/, "") + "-compressed.pdf", {
    type: "application/pdf",
    lastModified: Date.now()
  });
};

const compressFile = async (file: File, addNotification: any): Promise<File> => {
  const maxLimit = 8 * 1024 * 1024;
  if (file.size <= maxLimit) return file;
  if (file.type.startsWith("image/")) {
    addNotification(`Compressing image "${file.name}" to fit size limit...`, "info");
    return await compressImage(file);
  }
  if (file.name.toLowerCase().endsWith(".pdf")) {
    addNotification(`Optimizing PDF "${file.name}" to reduce size...`, "info");
    try {
      const optimized = await compressPDF(file);
      if (optimized.size <= maxLimit) {
        addNotification("PDF successfully optimized under 8MB!", "success");
        return optimized;
      }
      file = optimized;
    } catch (err) {
      console.error("PDF compression error:", err);
    }
  }
  addNotification(`Compressing document "${file.name}" to fit the 8MB database limit...`, "info");
  try {
    const stream = file.stream().pipeThrough(new CompressionStream("gzip"));
    const response = new Response(stream);
    const blob = await response.blob();
    if (blob.size < maxLimit) {
      addNotification("Document successfully compressed!", "success");
      return new File([blob], file.name + ".gz", {
        type: "application/gzip",
        lastModified: Date.now()
      });
    }
  } catch (err) {
    console.error("CompressionStream error:", err);
  }
  addNotification("Document size exceeds limit even after compression. Creating optimized draft summary.", "warning");
  const textEncoder = new TextEncoder();
  const truncatedContent = textEncoder.encode(`[Compressed Resource Draft]\nFile: ${file.name}\nOriginal Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB\nTimestamp: ${new Date().toISOString()}\n\nTo view this file, please request the high-resolution copy from the contributor.`);
  return new File([truncatedContent], file.name.replace(/\.[^/.]+$/, "") + "-compressed.txt", {
    type: "text/plain",
    lastModified: Date.now()
  });
};

export default function CoursesCatalogPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { courses, canUpload, user, isAuthenticated, deleteResource, updateResource, addNotification } = useApp();
  const resolvedSearchParams = use(searchParams);

  // Edit Modal State
  const [editingResource, setEditingResource] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("");
  const [editFormat, setEditFormat] = useState("");
  const [editYear, setEditYear] = useState<number>(1);
  const [editSemester, setEditSemester] = useState<number>(1);
  const [editBranchId, setEditBranchId] = useState<string>("");
  const [customBranchName, setCustomBranchName] = useState<string>("");
  const [editSubjectId, setEditSubjectId] = useState<string>("");
  const [customSubjectCode, setCustomSubjectCode] = useState<string>("");
  const [customSubjectTitle, setCustomSubjectTitle] = useState<string>("");
  const [editFileAttached, setEditFileAttached] = useState(false);
  const [editFileName, setEditFileName] = useState("");
  const [editFileObject, setEditFileObject] = useState<File | null>(null);
  const [editIsUploading, setEditIsUploading] = useState(false);

  const branchesList = useMemo(() => {
    const list = Array.from(new Set(courses.map(c => c.category)));
    return list.filter(Boolean);
  }, [courses]);

  const editAvailableSubjects = useMemo(() => {
    if (!editingResource) return [];
    const selectedBranchName = editBranchId === "custom" ? customBranchName : editBranchId;
    return courses.filter(c => 
      c.year === Number(editYear) && 
      c.semester === Number(editSemester) && 
      c.category === selectedBranchName
    );
  }, [courses, editYear, editSemester, editBranchId, customBranchName, editingResource]);

  // Keep semester matching year selection in edit mode
  useEffect(() => {
    if (!editingResource) return;
    const minSem = (editYear - 1) * 2 + 1;
    const maxSem = (editYear - 1) * 2 + 2;
    if (editSemester < minSem || editSemester > maxSem) {
      setEditSemester(minSem);
    }
  }, [editYear, editSemester, editingResource]);

  // Tab State
  const [activeTab, setActiveTab] = useState<"catalog" | "my-uploads">("catalog");
  const [uploadsSearchQuery, setUploadsSearchQuery] = useState("");
  const [uploadsStatusFilter, setUploadsStatusFilter] = useState<string>("all");

  const userUploads = useMemo(() => {
    if (!user) return [];
    return courses.flatMap(c => 
      c.resources
        .filter((r: any) => r.uploadedBy === user.name)
        .map((r: any) => ({ 
          ...r, 
          courseId: c.id,
          courseCode: c.code,
          courseTitle: c.title,
          courseCategory: c.category
        }))
    );
  }, [courses, user]);

  const filteredUserUploads = useMemo(() => {
    return userUploads.filter(res => {
      const matchesSearch = res.title.toLowerCase().includes(uploadsSearchQuery.toLowerCase()) ||
                            res.courseCode.toLowerCase().includes(uploadsSearchQuery.toLowerCase()) ||
                            res.courseTitle.toLowerCase().includes(uploadsSearchQuery.toLowerCase());
      
      const matchesStatus = uploadsStatusFilter === "all" ||
                            (uploadsStatusFilter === "approved" && res.status === "Approved") ||
                            (uploadsStatusFilter === "pending" && res.status === "Pending") ||
                            (uploadsStatusFilter === "rejected" && res.status === "Rejected");
      
      return matchesSearch && matchesStatus;
    });
  }, [userUploads, uploadsSearchQuery, uploadsStatusFilter]);

  const handleDeleteResource = async (courseId: string, resourceId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteResource(courseId, resourceId);
        addNotification(`Successfully deleted "${title}"`, "success");
      } catch (err) {
        console.error("Failed to delete resource:", err);
        addNotification("Failed to delete resource.", "warning");
      }
    }
  };

  // Read URL search params
  const initialTypeFilter = typeof resolvedSearchParams.type === "string" ? resolvedSearchParams.type : "";

  // Step Selector States
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [branchSearch, setBranchSearch] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>(initialTypeFilter);
  const [searchQuery, setSearchQuery] = useState("");

  // Step 1 helper: Set Year
  const handleSelectYear = (year: number) => {
    setSelectedYear(year);
    setSelectedSemester(null);
    setSelectedBranchId(null);
    setSelectedSubjectId(null);
    setSelectedType("");
  };

  // Step 2 helper: Set Semester
  const handleSelectSemester = (sem: number) => {
    setSelectedSemester(sem);
    setSelectedBranchId(null);
    setSelectedSubjectId(null);
    setSelectedType("");
  };

  // Step 3 helper: Set Branch
  const handleSelectBranch = (branchId: string) => {
    setSelectedBranchId(branchId);
    setSelectedSubjectId(null);
    setSelectedType("");
  };

  // Step 4 helper: Set Subject
  const handleSelectSubject = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedType("");
  };

  // Step 5 helper: Set Material Type
  const handleSelectType = (type: string) => {
    setSelectedType(type);
  };

  // Reset all steps to initial state
  const resetSelector = () => {
    setSelectedYear(null);
    setSelectedSemester(null);
    setSelectedBranchId(null);
    setSelectedSubjectId(null);
    setSelectedType("");
    setSearchQuery("");
    setBranchSearch("");
  };

  // Filter branches based on search input and whether they have subjects for the selected year and semester
  const filteredBranches = useMemo(() => {
    return BRANCH_FILES.filter(b => {
      const matchesSearch = b.name.toLowerCase().includes(branchSearch.toLowerCase());
      if (!matchesSearch) return false;

      if (selectedYear && selectedSemester) {
        const semStr = String((selectedYear - 1) * 2 + selectedSemester);
        const branchData = (syllabusData as any)[b.id];
        const list = branchData ? branchData[semStr] || [] : [];
        return list.length > 0;
      }
      return true;
    });
  }, [branchSearch, selectedYear, selectedSemester]);

  // Compute available subjects for selected Year, Semester, and Branch
  const availableSubjects = useMemo(() => {
    if (selectedYear === null || selectedSemester === null || selectedBranchId === null) return [];
    
    // Dynamically query syllabusData
    const semStr = String((selectedYear - 1) * 2 + selectedSemester);
    const branchData = (syllabusData as any)[selectedBranchId];
    const hardcoded = branchData ? branchData[semStr] || [] : [];
    
    // Map code and title to subject objects
    const mappedHardcoded = hardcoded.map((item: any, idx: number) => ({
      id: item.id || `${selectedBranchId}-${semStr}-${idx}`,
      code: item.code,
      title: item.title,
      description: item.description || `Syllabus core course: ${item.title} (${item.code}).`,
      resources: [] // Fallback if no matching db course exists
    }));

    // Merge dynamically loaded database courses matching this branch, year, semester
    const activeBranchName = BRANCH_FILES.find(b => b.id === selectedBranchId)?.name || "";
    
    // Find all database courses for this branch, year, semester
    const dbCourses = courses.filter((c) => {
      const matchesYear = c.year === selectedYear;
      const matchesSem = c.semester === selectedSemester;
      const matchesBranch = c.category === activeBranchName;
      return matchesYear && matchesSem && matchesBranch;
    });

    const merged = [...mappedHardcoded];
    dbCourses.forEach(dbc => {
      const existing = merged.find(m => m.code === dbc.code);
      if (existing) {
        existing.id = dbc.id;
        existing.resources = dbc.resources;
        existing.description = dbc.description || existing.description;
      } else {
        merged.push({
          id: dbc.id,
          code: dbc.code,
          title: dbc.title,
          description: dbc.description || `Syllabus core course: ${dbc.title} (${dbc.code}).`,
          resources: dbc.resources
        });
      }
    });

    // Filter by search query if any
    const query = searchQuery.toLowerCase().trim();
    if (query !== "") {
      return merged.filter(s => 
        s.title.toLowerCase().includes(query) || 
        s.code.toLowerCase().includes(query)
      );
    }

    return merged;
  }, [courses, selectedYear, selectedSemester, selectedBranchId, searchQuery]);

  // Selected subject object
  const selectedSubject = useMemo(() => {
    return availableSubjects.find((c) => c.id === selectedSubjectId) || null;
  }, [availableSubjects, selectedSubjectId]);

  // Extract all categories in this subject (both standard and custom ones!)
  const subjectCategories = useMemo(() => {
    if (!selectedSubject) return [];
    const standardCategories = ["pyq", "lecture-notes", "cts", "assignment"];
    const resourcesList = selectedSubject.resources || [];
    const inUseCustom = resourcesList
      .filter((r: any) => r.status === "Approved" && !standardCategories.includes(r.type))
      .map((r: any) => r.type);
    
    // De-duplicate custom ones
    const uniqueCustom = Array.from(new Set(inUseCustom));
    return [
      { id: "", name: "All Categories" },
      { id: "pyq", name: "Previous Year Questions (PYQs)" },
      { id: "lecture-notes", name: "Lecture Notes & Handouts" },
      { id: "cts", name: "Class Tests & Quizzes (CTS)" },
      { id: "assignment", name: "Assignments & Projects" },
      ...uniqueCustom.map((c: any) => ({ id: c, name: String(c).toUpperCase() }))
    ];
  }, [selectedSubject]);

  // Filtered resources for the selected Subject and Category
  const filteredResources = useMemo(() => {
    if (!selectedSubject) return [];
    const resourcesList = selectedSubject.resources || [];
    let list = resourcesList.filter((r: any) => r.status === "Approved");
    if (selectedType) {
      list = list.filter((r: any) => r.type === selectedType);
    }
    return list;
  }, [selectedSubject, selectedType]);

  // Step helper calculations
  const isStep1Done = selectedYear !== null;
  const isStep2Done = isStep1Done && selectedSemester !== null;
  const isStep3Done = isStep2Done && selectedBranchId !== null;
  const isStep4Done = isStep3Done && selectedSubjectId !== null;
  const isStep5Done = isStep4Done && selectedType !== "";

  const handleEditFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      let file = files[0];
      const maxLimit = 8 * 1024 * 1024; // 8MB limit
      if (file.size > maxLimit) {
        file = await compressFile(file, addNotification);
      }
      setEditFileAttached(true);
      setEditFileName(file.name);
      setEditFileObject(file);
      
      // Auto-detect format from extension
      const ext = file.name.substring(file.name.lastIndexOf(".") + 1).toLowerCase();
      if (["pdf", "docx", "doc", "ppt", "pptx", "txt", "png", "jpg", "jpeg"].includes(ext)) {
        setEditFormat(ext);
      }
    }
  };

  const activeStep = !isStep1Done ? 1 : !isStep2Done ? 2 : !isStep3Done ? 3 : !isStep4Done ? 4 : 5;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface font-display-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">school</span>
            Guided Academic Selector
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">Select your year, semester, and course folder step-by-step to access learning materials.</p>
        </div>

        {/* Reset button */}
        {(selectedYear !== null || selectedSemester !== null || selectedBranchId !== null || selectedSubjectId !== null) && (
          <button
            onClick={resetSelector}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/10 bg-white/5 text-on-surface hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Filter className="h-3 w-3" />
            Reset Selection
          </button>
        )}
      </div>

      {/* Tab Selector */}
      {isAuthenticated && (
        <div className="flex border-b border-white/5 pb-2">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "catalog"
                ? "border-indigo-500 text-indigo-400 font-extrabold"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Guided Course Catalog
          </button>
          <button
            onClick={() => setActiveTab("my-uploads")}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "my-uploads"
                ? "border-indigo-500 text-indigo-400 font-extrabold"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            My Uploaded Materials ({userUploads.length})
          </button>
        </div>
      )}

      {activeTab === "catalog" ? (
        <section className="relative glass-panel rounded-2xl border border-white/5 bg-[#0a0c10]/60 p-6 space-y-6">
          <div className="relative flex items-center justify-between max-w-3xl mx-auto px-4">
            
            {/* Progress Connection Line */}
            <div className="absolute left-8 right-8 top-5 h-0.5 bg-zinc-800 -z-10">
              <div 
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{
                  width: `${(activeStep - 1) * 25}%`
                }}
              />
            </div>

            {[
              { step: 1, label: "Academic Year", desc: "Select your year", done: isStep1Done },
              { step: 2, label: "Semester", desc: "Select semester", done: isStep2Done },
              { step: 3, label: "Branch", desc: "Select branch/regulation", done: isStep3Done },
              { step: 4, label: "Subjects", desc: "Choose subject", done: isStep4Done },
              { step: 5, label: "Files", desc: "Pick category & files", done: isStep5Done }
            ].map((s) => (
              <button 
                key={s.step} 
                disabled={activeStep < s.step}
                onClick={() => {
                  if (s.step === 1) {
                    setSelectedYear(null);
                    setSelectedSemester(null);
                    setSelectedBranchId(null);
                    setSelectedSubjectId(null);
                    setSelectedType("");
                  } else if (s.step === 2) {
                    setSelectedSemester(null);
                    setSelectedBranchId(null);
                    setSelectedSubjectId(null);
                    setSelectedType("");
                  } else if (s.step === 3) {
                    setSelectedBranchId(null);
                    setSelectedSubjectId(null);
                    setSelectedType("");
                  } else if (s.step === 4) {
                    setSelectedSubjectId(null);
                    setSelectedType("");
                  } else if (s.step === 5) {
                    setSelectedType("");
                  }
                }}
                className="flex flex-col items-center text-center space-y-1 cursor-pointer disabled:cursor-not-allowed group focus:outline-none"
              >
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border transition-all duration-300 ${
                    activeStep === s.step
                      ? "bg-indigo-500 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                      : s.done
                      ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 group-hover:bg-indigo-500/30"
                      : "bg-zinc-950 border-zinc-800 text-zinc-500"
                  }`}
                >
                  {s.step}
                </div>
                <div className="hidden sm:block">
                  <span className={`text-[10px] font-bold block ${activeStep === s.step ? "text-indigo-400 font-extrabold" : s.done ? "text-indigo-300" : "text-zinc-500"}`}>
                    {s.label}
                  </span>
                  <span className="text-[8px] text-zinc-600 block leading-none">
                    {s.desc}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-white/5 pt-6 w-full">
            
            {/* STEP 1: Academic Year Selection */}
            {activeStep === 1 && (
              <div className="space-y-6 w-full animate-fade-in">
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-white font-display-lg">Select Academic Year</h3>
                  <p className="text-xs text-zinc-500">Choose your current year of study to filter courses.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto w-full">
                  {[1, 2, 3, 4].map((year) => (
                    <button
                      key={year}
                      onClick={() => handleSelectYear(year)}
                      className="p-6 rounded-2xl border border-white/5 bg-gradient-to-b from-[#0a0c10] to-[#06080b] hover:border-indigo-500/30 hover:scale-102 hover:shadow-[0_4px_20px_rgba(99,102,241,0.05)] transition-all cursor-pointer flex flex-col items-center justify-center gap-3 text-center group"
                    >
                      <div className="h-10 w-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-sm font-extrabold">Y{year}</span>
                      </div>
                      <span className="text-xs font-extrabold text-zinc-300 group-hover:text-white">Year {year}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Semester selection */}
            {activeStep === 2 && selectedYear !== null && (
              <div className="space-y-6 w-full animate-fade-in">
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-white font-display-lg">Select Semester</h3>
                  <p className="text-xs text-zinc-500">Pick a semester for Year {selectedYear}.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto w-full">
                  {[1, 2].map((semIdx) => {
                    const actualSem = (selectedYear - 1) * 2 + semIdx;
                    return (
                      <button
                        key={actualSem}
                        onClick={() => handleSelectSemester(actualSem)}
                        className="p-6 rounded-2xl border border-white/5 bg-gradient-to-b from-[#0a0c10] to-[#06080b] hover:border-indigo-500/30 hover:scale-102 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 text-center group"
                      >
                        <div className="h-10 w-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <span className="text-sm font-extrabold">S{actualSem}</span>
                        </div>
                        <span className="text-xs font-extrabold text-zinc-300 group-hover:text-white">Semester {actualSem}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-center pt-4">
                  <button 
                    onClick={() => setSelectedYear(null)}
                    className="px-4 py-2 rounded-xl border border-white/5 hover:bg-white/5 text-xs text-zinc-400 font-semibold cursor-pointer"
                  >
                    ← Back to Academic Year
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Branch selection */}
            {activeStep === 3 && selectedYear !== null && selectedSemester !== null && (
              <div className="space-y-6 w-full animate-fade-in">
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-white font-display-lg">Select Branch / Specialization</h3>
                  <p className="text-xs text-zinc-500">Choose your branch to view relevant subject folders.</p>
                </div>

                <div className="max-w-md mx-auto space-y-4 w-full">
                  {/* Search branch bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      value={branchSearch}
                      onChange={(e) => setBranchSearch(e.target.value)}
                      placeholder="Search specialization branch..."
                      className="w-full pl-10 pr-4 py-2.5 bg-[#090b10] border border-white/5 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                    {filteredBranches.map((branch) => (
                      <button
                        key={branch.id}
                        onClick={() => handleSelectBranch(branch.id)}
                        className="w-full flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-gradient-to-b from-[#0a0c10] to-[#06080b] hover:border-indigo-500/30 transition-all text-xs font-semibold text-left text-zinc-300 hover:text-white cursor-pointer shadow-md"
                      >
                        <span>{branch.name}</span>
                        <ChevronRight className="h-4 w-4 text-zinc-600" />
                      </button>
                    ))}
                    {filteredBranches.length === 0 && (
                      <div className="text-center py-6 text-xs text-zinc-600">No branches available for this selection.</div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <button 
                    onClick={() => setSelectedSemester(null)}
                    className="px-4 py-2 rounded-xl border border-white/5 hover:bg-white/5 text-xs text-zinc-400 font-semibold cursor-pointer"
                  >
                    ← Back to Semester {selectedSemester}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Subjects selection */}
            {activeStep === 4 && selectedYear !== null && selectedSemester !== null && selectedBranchId !== null && (
              <div className="space-y-6 w-full animate-fade-in">
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-white font-display-lg">Select Course Subject</h3>
                  <p className="text-xs text-zinc-500">Pick a registered folder to access files.</p>
                </div>

                <div className="max-w-md mx-auto space-y-4 w-full">
                  {/* Search subject bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search subject by code/title..."
                      className="w-full pl-10 pr-4 py-2.5 bg-[#090b10] border border-white/5 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                    {availableSubjects.map((subject) => {
                      const fileCount = subject.resources ? subject.resources.filter((r: any) => r.status === "Approved").length : 0;
                      return (
                        <button
                          key={subject.id}
                          onClick={() => handleSelectSubject(subject.id)}
                          className="w-full flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-gradient-to-b from-[#0a0c10] to-[#06080b] hover:border-emerald-500/30 transition-all text-xs font-semibold text-left text-zinc-300 hover:text-white cursor-pointer shadow-md group"
                        >
                          <div className="flex items-center gap-2 overflow-hidden flex-1 pr-2">
                            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[9px] font-extrabold uppercase border border-white/5 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-all shrink-0">{subject.code}</span>
                            <span className="truncate">{subject.title}</span>
                          </div>
                          <span className="text-[10px] text-zinc-500 shrink-0 font-bold">{fileCount} files</span>
                        </button>
                      );
                    })}
                    {availableSubjects.length === 0 && (
                      <div className="text-center py-6 text-xs text-zinc-600">No subjects found for this selection.</div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <button 
                    onClick={() => setSelectedBranchId(null)}
                    className="px-4 py-2 rounded-xl border border-white/5 hover:bg-white/5 text-xs text-zinc-400 font-semibold cursor-pointer"
                  >
                    ← Back to Branch selection
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Category & Results List */}
            {activeStep === 5 && selectedYear !== null && selectedSemester !== null && selectedBranchId !== null && selectedSubject && (
              <div className="space-y-6 w-full animate-fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div>
                    <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded text-[10px] font-black uppercase tracking-wider">{selectedSubject.code}</span>
                    <h3 className="text-lg font-bold text-white mt-1 font-display-lg">{selectedSubject.title}</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Year {selectedYear} • Semester {selectedSemester} • Specialization catalog</p>
                  </div>
                  <button 
                    onClick={() => setSelectedSubjectId(null)}
                    className="px-3.5 py-1.5 rounded-lg border border-white/5 bg-zinc-950 hover:bg-zinc-900 text-[10px] font-semibold text-zinc-400 hover:text-white cursor-pointer"
                  >
                    ← Select Another Subject
                  </button>
                </div>

                {/* Category selector bar */}
                <div className="flex flex-wrap gap-2 bg-[#05070a] p-1.5 rounded-xl border border-white/5 w-fit">
                  {subjectCategories.map((cat) => {
                    const isSelected = selectedType === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleSelectType(cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-lg"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>

                {/* Results List */}
                <div className="space-y-2.5">
                  {filteredResources.length === 0 ? (
                    <div className="glass-panel border border-white/10 rounded-2xl p-10 text-center space-y-3">
                      <FileText className="h-10 w-10 text-zinc-500 mx-auto animate-pulse" />
                      <div>
                        <p className="text-sm font-semibold text-zinc-300">Category Folder Empty</p>
                        <p className="text-xs text-zinc-500 mt-1">
                          No documents have been verified under this category for {selectedSubject.code} yet.
                        </p>
                      </div>
                      {canUpload() && (
                        <Link
                          href={`/upload?courseId=${selectedSubject.id}&type=${selectedType || "pyq"}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:underline"
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                          Contribute first file draft
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                      {filteredResources.map((item: any) => (
                        <Link
                          key={item.id}
                          href={`/resources/${item.id}?courseId=${selectedSubject.id}`}
                          className="flex items-center justify-between p-3.5 border border-white/10 hover:border-indigo-500/50 hover:bg-white/5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-all shadow-md"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <FileText className="h-4.5 w-4.5 text-zinc-500 shrink-0" />
                            <span className="truncate pr-2">{item.title}</span>
                          </div>

                          <div className="flex items-center gap-2.5 text-zinc-500 font-semibold shrink-0">
                            <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 tracking-wider">
                              {item.format}
                            </span>
                            <span>&bull;</span>
                            <span>{item.downloadsCount} downloads</span>
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </section>
      ) : (
        <div className="space-y-6 animate-fade-in w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white font-display-lg">My Uploaded Materials</h3>
              <p className="text-xs text-zinc-500">Track and manage your contributed academic resources.</p>
            </div>
            
            {/* Search & Status Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={uploadsSearchQuery}
                  onChange={(e) => setUploadsSearchQuery(e.target.value)}
                  placeholder="Search uploads..."
                  className="w-full sm:w-60 pl-10 pr-4 py-2 bg-[#090b10] border border-white/5 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              
              <select
                value={uploadsStatusFilter}
                onChange={(e) => setUploadsStatusFilter(e.target.value)}
                className="bg-[#090b10] border border-white/5 rounded-xl text-xs text-zinc-300 px-3 py-2 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="space-y-3.5">
            {filteredUserUploads.length === 0 ? (
              <div className="p-12 border border-dashed border-white/5 rounded-2xl text-center text-sm text-zinc-500 bg-[#0a0c10]/40">
                <FolderOpen className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
                No uploaded resources matches your filter.
                <p className="text-xs text-zinc-600 mt-1">Visit the <Link href="/upload" className="text-indigo-400 hover:underline">Upload page</Link> to contribute notes or syllabi.</p>
              </div>
            ) : (
              filteredUserUploads.map((res) => (
                <div
                  key={res.id}
                  className="p-4 rounded-xl border border-white/5 bg-gradient-to-b from-[#0a0c10] to-[#06080b] hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[9px] font-extrabold uppercase border border-white/5 shrink-0">
                        {res.courseCode}
                      </span>
                      <h4 className="font-semibold text-zinc-200 text-xs truncate">
                        {res.title}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide shrink-0 ${
                        res.status === "Approved"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : res.status === "Pending"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {res.status}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500 font-medium">
                      <span>Folder: <span className="text-zinc-400">{res.courseTitle}</span></span>
                      <span>&bull;</span>
                      <span>Category: <span className="text-zinc-400 capitalize">{res.type}</span></span>
                      <span>&bull;</span>
                      <span>Format: <span className="text-zinc-400 uppercase">{res.format}</span></span>
                      <span>&bull;</span>
                      <span>Uploaded: <span className="text-zinc-400">{new Date(res.uploadedAt).toLocaleDateString()}</span></span>
                    </div>

                    {/* Rejection / Feedback details */}
                    {res.status === "Rejected" && res.feedback && (
                      <div className="mt-2.5 p-2 rounded-lg bg-red-950/20 border border-red-500/10 text-[11px] text-red-300">
                        <strong>Reason:</strong> {res.feedback}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {res.url && (
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                      >
                        View File
                      </a>
                    )}
                    <button
                      onClick={() => {
                        setEditingResource(res);
                        setEditTitle(res.title);
                        setEditType(res.type);
                        setEditFormat(res.format);
                        setEditYear(res.courseYear || 1);
                        setEditSemester(res.courseSemester || 1);
                        setEditBranchId(res.courseCategory || "");
                        setCustomBranchName("");
                        setEditSubjectId(res.courseId || "");
                        setCustomSubjectCode("");
                        setCustomSubjectTitle("");
                        setEditFileAttached(false);
                        setEditFileName("");
                        setEditFileObject(null);
                        setEditIsUploading(false);
                      }}
                      className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer flex items-center justify-center"
                      title="Edit Material"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteResource(res.courseId, res.id, res.title)}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 hover:text-red-500 transition-all cursor-pointer flex items-center justify-center"
                      title="Delete Upload"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0c10] p-6 space-y-5 shadow-2xl animate-scale-up my-8 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-lg font-bold">edit_note</span>
                Edit Contributed Resource
              </h3>
              <button
                type="button"
                onClick={() => setEditingResource(null)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-4">
              
              {/* Year & Semester Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-zinc-400">Academic Year</label>
                  <select
                    value={editYear}
                    onChange={(e) => setEditYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#05070a] border border-white/10 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                  >
                    {[1, 2, 3, 4].map(y => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-zinc-400">Semester</label>
                  <select
                    value={editSemester}
                    onChange={(e) => setEditSemester(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#05070a] border border-white/10 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                  >
                    {[(editYear - 1) * 2 + 1, (editYear - 1) * 2 + 2].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Specialization / Branch Select */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-zinc-400">Specialization / Branch</label>
                <select
                  value={editBranchId}
                  onChange={(e) => setEditBranchId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#05070a] border border-white/10 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                >
                  <option value="">Select Specialization...</option>
                  {branchesList.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                  <option value="custom">-- Custom Specialization Name --</option>
                </select>
              </div>

              {/* Custom branch text field */}
              {editBranchId === "custom" && (
                <div className="space-y-1.5 p-3 rounded-xl border border-dashed border-white/10 bg-white/5 animate-fade-in">
                  <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Custom Specialization Name</label>
                  <input
                    type="text"
                    value={customBranchName}
                    onChange={(e) => setCustomBranchName(e.target.value)}
                    placeholder="e.g. Mechanical Engineering"
                    className="w-full px-3 py-2 bg-[#05070a] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              )}

              {/* Subject Select */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-zinc-400">Course Subject Folder</label>
                <select
                  value={editSubjectId}
                  onChange={(e) => setEditSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#05070a] border border-white/10 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                >
                  <option value="">Select Course Folder...</option>
                  {editAvailableSubjects.map(sub => (
                    <option key={sub.id} value={sub.id}>[{sub.code}] {sub.title}</option>
                  ))}
                  <option value="custom">-- Custom Subject Folder --</option>
                </select>
              </div>

              {/* Custom subject details */}
              {editSubjectId === "custom" && (
                <div className="space-y-3.5 p-3 rounded-xl border border-dashed border-white/10 bg-white/5 animate-fade-in">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1 space-y-1">
                      <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Subject Code</label>
                      <input
                        type="text"
                        value={customSubjectCode}
                        onChange={(e) => setCustomSubjectCode(e.target.value)}
                        placeholder="CS101"
                        className="w-full px-3 py-2 bg-[#05070a] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Subject Title</label>
                      <input
                        type="text"
                        value={customSubjectTitle}
                        onChange={(e) => setCustomSubjectTitle(e.target.value)}
                        placeholder="Programming in C"
                        className="w-full px-3 py-2 bg-[#05070a] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              <hr className="border-white/5" />

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-zinc-400">Resource Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#05070a] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
                  placeholder="e.g. CS101 Lecture Slides"
                />
              </div>

              {/* Category & Format Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-zinc-400">Category</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#05070a] border border-white/10 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                  >
                    {subjectCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-zinc-400">Format</label>
                  <select
                    value={editFormat}
                    onChange={(e) => setEditFormat(e.target.value)}
                    className="w-full px-3 py-2 bg-[#05070a] border border-white/10 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                  >
                    <option value="pdf">PDF</option>
                    <option value="docx">Docx</option>
                    <option value="doc">Doc</option>
                    <option value="ppt">PPT</option>
                    <option value="pptx">PPTX</option>
                    <option value="txt">TXT</option>
                    <option value="png">PNG</option>
                    <option value="jpg">JPG</option>
                    <option value="jpeg">JPEG</option>
                  </select>
              </div>
            </div>

            {/* Replace File Input */}
              <div className="space-y-1.5 p-3 rounded-xl border border-dashed border-white/10 bg-white/5 animate-fade-in">
                <label className="block text-[11px] font-bold text-zinc-400">
                  Replace Material File (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs cursor-pointer transition-all">
                    <span className="material-symbols-outlined text-sm">upload_file</span>
                    Choose New File
                    <input
                      type="file"
                      onChange={handleEditFileSelect}
                      className="hidden"
                      accept=".pdf,.docx,.doc,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
                    />
                  </label>
                  <span className="text-xs text-zinc-300 truncate max-w-[200px]">
                    {editFileAttached ? editFileName : "No new file chosen"}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500">
                  Leave empty if you don't want to change the file contents.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={() => setEditingResource(null)}
                className="px-4 py-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 hover:text-white cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!editTitle.trim()) {
                    alert("Please specify a valid resource title.");
                    return;
                  }

                  let finalBranch = editBranchId === "custom" ? customBranchName.trim() : editBranchId;
                  if (!finalBranch) {
                    alert("Please specify a valid specialization/branch.");
                    return;
                  }

                  let finalSubjectId = editSubjectId;
                  let finalSubjectCode = "";
                  let finalSubjectTitle = "";

                  if (editSubjectId === "custom") {
                    if (!customSubjectCode.trim() || !customSubjectTitle.trim()) {
                      alert("Please specify a valid custom subject code and title.");
                      return;
                    }
                    // Generate a new custom course id
                    finalSubjectId = `c-${Date.now()}`;
                    finalSubjectCode = customSubjectCode.trim().toUpperCase();
                    finalSubjectTitle = customSubjectTitle.trim();
                  } else {
                    const matchedSub = courses.find(c => c.id === editSubjectId);
                    if (matchedSub) {
                      finalSubjectCode = matchedSub.code;
                      finalSubjectTitle = matchedSub.title;
                    } else {
                      // Fallback if none matches
                      finalSubjectCode = editSubjectId.toUpperCase();
                      finalSubjectTitle = editSubjectId;
                    }
                  }

                  const triggerUpdate = async (fileUrl?: string) => {
                    let finalUrl = fileUrl;
                    if (fileUrl && fileUrl.startsWith("data:") && editFileObject) {
                      try {
                        const driveRes = await fetch("/api/upload-drive", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json"
                          },
                          body: JSON.stringify({
                            fileName: editFileObject.name,
                            fileData: fileUrl,
                            mimeType: editFileObject.type
                          })
                        });
                        if (driveRes.ok) {
                          const driveData = await driveRes.json();
                          if (!driveData.fallback && driveData.webViewLink) {
                            finalUrl = driveData.webViewLink;
                            addNotification("New file uploaded to Google Drive!", "success");
                          }
                        }
                      } catch (driveErr) {
                        console.error("Google Drive upload failed, falling back to base64 database storage:", driveErr);
                      }
                    }

                    const updatePayload: any = {
                      title: editTitle.trim(),
                      type: editType as any,
                      format: editFormat as any,
                      newCourseId: finalSubjectId,
                      newCourseCode: finalSubjectCode,
                      newCourseTitle: finalSubjectTitle,
                      newCourseYear: Number(editYear),
                      newCourseSemester: Number(editSemester),
                      newCourseCategory: finalBranch
                    };
                    if (finalUrl) {
                      updatePayload.url = finalUrl;
                    }
                    await updateResource(editingResource.courseId, editingResource.id, updatePayload);
                    setEditingResource(null);
                  };

                  if (editFileObject) {
                    setEditIsUploading(true);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64Url = reader.result as string;
                      triggerUpdate(base64Url);
                    };
                    reader.readAsDataURL(editFileObject);
                  } else {
                    triggerUpdate();
                  }
                }}
                disabled={editIsUploading}
                className={`px-4 py-2 rounded-lg text-white font-bold text-xs shadow-md transition-all ${
                  editIsUploading ? "bg-zinc-700 cursor-not-allowed opacity-50" : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                }`}
              >
                {editIsUploading ? "Saving & Uploading..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
