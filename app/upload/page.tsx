"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "../../context/AppContext";
import { BRANCH_FILES } from "../../lib/constants";
import syllabusData from "../../data/syllabus_subjects.json";

function getSubjectsForBranch(branchId: string, semester: number) {
  const semStr = String(semester);
  const branchData = (syllabusData as any)[branchId];
  const list = branchData ? branchData[semStr] || [] : [];
  
  return list.map((item: any) => ({
    // Use course code as stable unique ID — codes are unique per branch+semester
    id: item.id || `${branchId}-${semStr}-${item.code}`,
    code: item.code,
    title: item.title,
    description: item.description || `Syllabus core course: ${item.title} (${item.code}).`
  }));
}
import { 
  UploadCloud, 
  CheckCircle, 
  FileText, 
  ArrowLeft, 
  Info, 
  Lock,
  UserPlus
} from "lucide-react";

export default function UploadPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { courses, addResource, user, isAuthenticated, canUpload, addNotification } = useApp();
  const router = useRouter();
  const resolvedSearchParams = use(searchParams);

  // Pre-select inputs based on query string
  const urlCourseId = typeof resolvedSearchParams.courseId === "string" ? resolvedSearchParams.courseId : "";
  const urlType = typeof resolvedSearchParams.type === "string" ? resolvedSearchParams.type : "pyq";
  const urlYear = typeof resolvedSearchParams.year === "string" ? Number(resolvedSearchParams.year) : 1;
  const urlSem = typeof resolvedSearchParams.semester === "string" ? Number(resolvedSearchParams.semester) : 1;

  // Form States
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState(urlCourseId || (courses[0]?.id || ""));
  const [isNewCourse, setIsNewCourse] = useState(courses.length === 0 || urlCourseId === "new");
  const [type, setType] = useState<string>(urlType);
  const [customCategoryText, setCustomCategoryText] = useState("");
  const [format, setFormat] = useState<"pdf" | "image" | "video" | "doc">("pdf");
  const [fileAttached, setFileAttached] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [redirected, setRedirected] = useState(false);

  // Selector Wizard States for Existing Folder
  const [selectedYear, setSelectedYear] = useState<number>(urlYear);
  const [selectedSemester, setSelectedSemester] = useState<number>(urlSem);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("cse");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(urlCourseId || "");
  const [extraBranchIds, setExtraBranchIds] = useState<string[]>([]); // extra branches to share the same upload

  // New Course Custom Fields
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseYear, setNewCourseYear] = useState<number>(urlYear);
  const [newCourseSem, setNewCourseSem] = useState<number>(urlSem);
  const [newCourseCategory, setNewCourseCategory] = useState(BRANCH_FILES[0]?.name || "Artificial Intelligence");
  const [customBranchText, setCustomBranchText] = useState("");
  const [customSubjectCode, setCustomSubjectCode] = useState("");
  const [customSubjectTitle, setCustomSubjectTitle] = useState("");

  // Dynamically calculate subjects for the selected Branch and Semester
  const availableSubjects = React.useMemo(() => {
    // Get official syllabus mapped subjects
    const syllabusSubjects = getSubjectsForBranch(selectedBranchId, selectedSemester);
    
    // Get database subjects for this branch and semester
    const activeBranchName = BRANCH_FILES.find(b => b.id === selectedBranchId)?.name || "";
    const dbSubjects = courses.filter(
      (c) => c.year === selectedYear && c.semester === selectedSemester && c.category === activeBranchName
    );

    // Merge database subjects with syllabus subjects
    const merged = [...syllabusSubjects];
    dbSubjects.forEach((dbc) => {
      const existing = merged.find(m => m.code.toLowerCase().trim() === dbc.code.toLowerCase().trim());
      if (existing) {
        existing.id = dbc.id;
      } else {
        merged.push({
          id: dbc.id,
          code: dbc.code,
          title: dbc.title,
          description: dbc.description || `Syllabus core course: ${dbc.title} (${dbc.code}).`
        });
      }
    });

    return merged;
  }, [courses, selectedYear, selectedSemester, selectedBranchId]);

  useEffect(() => {
    if (selectedSubjectId === "custom-subject") {
      return; // Keep custom subject selection intact
    }
    if (availableSubjects.length > 0) {
      const isValid = availableSubjects.some(s => s.id === selectedSubjectId);
      if (!isValid) {
        setSelectedSubjectId(availableSubjects[0].id);
      }
    } else {
      setSelectedSubjectId("");
    }
  }, [availableSubjects, selectedSubjectId]);

  useEffect(() => {
    const minSem = (newCourseYear - 1) * 2 + 1;
    const maxSem = (newCourseYear - 1) * 2 + 2;
    if (newCourseSem < minSem || newCourseSem > maxSem) {
      setNewCourseSem(minSem);
    }
  }, [newCourseYear, newCourseSem]);

  useEffect(() => {
    const minSem = (selectedYear - 1) * 2 + 1;
    const maxSem = (selectedYear - 1) * 2 + 2;
    if (selectedSemester < minSem || selectedSemester > maxSem) {
      setSelectedSemester(minSem);
    }
  }, [selectedYear, selectedSemester]);

  useEffect(() => {
    if (!isAuthenticated && !redirected) {
      setRedirected(true);
      router.push("/login");
      addNotification("Please login to upload materials.", "warning");
    }
  }, [isAuthenticated, redirected, router, addNotification]);

  if (!isAuthenticated) {
    return null;
  }

  if (!canUpload()) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md glass-panel rounded-2xl p-6 border border-white/10 shadow-xl">
          <Lock className="h-16 w-16 text-on-surface-variant mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-on-surface mb-2 font-display-lg">
            Upload Access Required
          </h2>
          <p className="text-on-surface-variant text-xs leading-5 mb-6">
            Only administrators and authorized contributors can upload course materials. 
            Contact an administrator to request contributor access.
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-bold shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse Materials
          </Link>
        </div>
      </div>
    );
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setFileAttached(true);
      setFileName(files[0].name);
      setFileObject(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileAttached(true);
      setFileName(files[0].name);
      setFileObject(files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileAttached) {
      alert("Please attach a syllabus resource file draft to proceed.");
      return;
    }

    const finalCourseId = isNewCourse 
      ? newCourseCode.trim().toLowerCase().replace(/\s+/g, "-")
      : (selectedSubjectId === "custom-subject"
          ? customSubjectCode.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
          : selectedSubjectId);

    const finalType = type === "custom" ? customCategoryText.trim().toLowerCase() : type;

    if (!finalCourseId) {
      alert("Please specify a valid Course Folder.");
      return;
    }
    if (!finalType) {
      alert("Please specify a valid Resource Category.");
      return;
    }

    setSubmitting(true);

     let newCourseDetails = undefined;
    if (isNewCourse) {
      newCourseDetails = {
        code: newCourseCode.trim().toUpperCase(),
        title: newCourseTitle.trim(),
        year: newCourseYear,
        semester: newCourseSem,
        category: (newCourseCategory === "custom-branch" ? customBranchText.trim() : newCourseCategory.trim()) || "Computer Science"
      };
    } else {
      const finalBranchName = selectedBranchId === "custom-branch"
        ? customBranchText.trim()
        : (BRANCH_FILES.find(b => b.id === selectedBranchId)?.name || "");

      if (selectedSubjectId === "custom-subject") {
        newCourseDetails = {
          code: customSubjectCode.trim().toUpperCase(),
          title: customSubjectTitle.trim(),
          year: selectedYear,
          semester: selectedSemester,
          category: finalBranchName || "Computer Science"
        };
      } else {
        const courseExists = courses.some(c => c.id === selectedSubjectId);
        if (!courseExists) {
          const matchedSubject = availableSubjects.find(s => s.id === selectedSubjectId);
          if (matchedSubject) {
            newCourseDetails = {
              code: matchedSubject.code,
              title: matchedSubject.title,
              year: selectedYear,
              semester: selectedSemester,
              category: finalBranchName
            };
          }
        }
      }
    }

    const triggerUpload = (fileUrl: string) => {
      // Determine primary and all branches to target
      const primaryBranchId = isNewCourse
        ? (newCourseCategory === "custom-branch"
            ? customBranchText.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
            : (BRANCH_FILES.find(b => b.name === newCourseCategory)?.id || BRANCH_FILES[0]?.id))
        : (selectedBranchId === "custom-branch"
            ? customBranchText.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
            : selectedBranchId);
      const allBranchIds = [primaryBranchId, ...extraBranchIds.filter(b => b !== primaryBranchId)];

      setTimeout(async () => {
        for (const branchId of allBranchIds) {
          let branchName = "";
          if (isNewCourse) {
            if (branchId === primaryBranchId && newCourseCategory === "custom-branch") {
              branchName = customBranchText.trim();
            } else {
              branchName = BRANCH_FILES.find(b => b.id === branchId)?.name || "";
            }
          } else {
            if (branchId === primaryBranchId && selectedBranchId === "custom-branch") {
              branchName = customBranchText.trim();
            } else {
              branchName = BRANCH_FILES.find(b => b.id === branchId)?.name || "";
            }
          }
          
          let branchCourseId: string;
          let branchCourseDetails: any;

          if (isNewCourse) {
            // New folder registry across branches
            branchCourseId = branchId === primaryBranchId
              ? finalCourseId
              : `${finalCourseId}-${branchId}`;

            branchCourseDetails = {
              code: newCourseCode.trim().toUpperCase(),
              title: newCourseTitle.trim(),
              year: newCourseYear,
              semester: newCourseSem,
              category: branchName
            };
          } else {
            // Existing course registry
            if (selectedSubjectId === "custom-subject") {
              branchCourseId = branchId === primaryBranchId
                ? finalCourseId
                : `${finalCourseId}-${branchId}`;

              branchCourseDetails = {
                code: customSubjectCode.trim().toUpperCase(),
                title: customSubjectTitle.trim(),
                year: selectedYear,
                semester: selectedSemester,
                category: branchName
              };
            } else {
              const branchSubjects = getSubjectsForBranch(branchId, selectedSemester);
              const matchedSubject = branchSubjects.find(
                (s: any) => s.id === selectedSubjectId || s.code === availableSubjects.find(a => a.id === selectedSubjectId)?.code
              );
              branchCourseId = branchId === selectedBranchId ? finalCourseId : (matchedSubject?.id || `${branchId}-${selectedSemester}-${selectedSubjectId}`);
              branchCourseDetails = branchId === selectedBranchId
                ? newCourseDetails
                : {
                    code: matchedSubject?.code || finalCourseId.toUpperCase(),
                    title: matchedSubject?.title || title,
                    year: selectedYear,
                    semester: selectedSemester,
                    category: branchName
                  };
            }
          }

          await addResource(branchCourseId, {
            title,
            type: finalType as any,
            format,
            url: fileUrl,
            uploadedBy: user?.name || "Unknown User",
            uploadedAt: new Date().toISOString()
          }, branchCourseDetails);
        }
        setSubmitting(false);
        router.push(`/courses`);
      }, 1000);
    };

    if (fileObject) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result as string;
        triggerUpload(base64Url);
      };
      reader.readAsDataURL(fileObject);
    } else {
      triggerUpload(`/mock-files/${fileName}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Back button */}
      <div>
        <Link
          href="/courses"
          className="inline-flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Link>
      </div>

      <header className="mb-lg text-center md:text-left">
        <h1 className="font-display-lg text-3xl font-extrabold text-on-surface mb-xs">Contribute Resources</h1>
        <p className="text-on-surface-variant text-sm max-w-2xl leading-6 font-body-md mt-1">Enhance the collective knowledge base by uploading academic papers, notes, or course materials.</p>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Upload Zone */}
        <section className="lg:col-span-7">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className={`glass-panel rounded-xl p-8 border-2 border-dashed transition-all duration-300 group cursor-pointer h-[400px] flex flex-col items-center justify-center text-center ${
              fileAttached
                ? "border-secondary bg-secondary/5"
                : "border-outline-variant hover:border-primary/50"
            }`}
          >
            <input
              id="file-input"
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.mp4"
            />
            
            {fileAttached ? (
              <div className="space-y-4">
                <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-md scale-110 transition-transform duration-300">
                  <CheckCircle className="h-10 w-10 text-secondary glowing-icon" />
                </div>
                <h3 className="font-headline-md text-xl font-bold text-on-surface mb-sm">Resource Draft Connected!</h3>
                <p className="text-on-surface-variant text-xs">{fileName}</p>
                <button
                  type="button"
                  onClick={() => { setFileAttached(false); setFileName(""); }}
                  className="text-xs text-red-400 font-bold hover:underline"
                >
                  Remove and re-upload
                </button>
              </div>
            ) : (
              <label htmlFor="file-input" className="cursor-pointer space-y-4 block">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-md group-hover:scale-110 transition-transform duration-300">
                  <span className="material-symbols-outlined text-primary text-[40px] drop-shadow-[0_0_12px_rgba(192,193,255,0.4)]">upload_file</span>
                </div>
                <h3 className="font-headline-md text-xl font-bold text-on-surface mb-sm">Drag & drop files here</h3>
                <p className="text-on-surface-variant text-xs mb-lg">Support for PDF, DOCX, Video, and high-res images (Max 50MB)</p>
                <span className="px-6 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-lg shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 inline-block">
                  Browse Files
                </span>
              </label>
            )}
          </div>
        </section>

        {/* Right Side: Metadata Form */}
        <aside className="lg:col-span-5 space-y-4">
          <div className="glass-panel rounded-xl p-6 border border-white/10 space-y-4 shadow-xl">
            <h2 className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">description</span>
              Document Details
            </h2>

            {/* Title */}
            <div className="space-y-1.5">
              <label htmlFor="title" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Resource Title
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CS101 Final Exam Paper 2025 Solutions"
                className="block w-full rounded-lg border-none bg-surface-container-low px-3.5 py-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary/50 focus:outline-hidden"
              />
            </div>

            {/* Select/Create Course */}
            {courses.length > 0 && (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Folder Registry Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsNewCourse(false); setExtraBranchIds([]); }}
                    className={`py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      !isNewCourse
                        ? "bg-primary/10 border-primary text-primary shadow-[inset_0_0_12px_rgba(99,102,241,0.1)]"
                        : "bg-surface-container-low border-white/10 text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Existing Folder
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsNewCourse(true); setExtraBranchIds([]); }}
                    className={`py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      isNewCourse
                        ? "bg-primary/10 border-primary text-primary shadow-[inset_0_0_12px_rgba(99,102,241,0.1)]"
                        : "bg-surface-container-low border-white/10 text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    New Folder
                  </button>
                </div>
              </div>
            )}

            {isNewCourse ? (
              <div className="space-y-3 p-3 bg-white/5 rounded-xl border border-white/5 animate-fade-in">
                <div className="space-y-1.5">
                  <label htmlFor="newCourseCode" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    New Course Code
                  </label>
                  <input
                    id="newCourseCode"
                    type="text"
                    required={isNewCourse}
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    placeholder="e.g. CS302"
                    className="block w-full rounded-lg border-none bg-surface-container-low px-3.5 py-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary/50 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="newCourseTitle" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    New Course Title
                  </label>
                  <input
                    id="newCourseTitle"
                    type="text"
                    required={isNewCourse}
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    placeholder="e.g. Database Management Systems"
                    className="block w-full rounded-lg border-none bg-surface-container-low px-3.5 py-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary/50 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="newCourseYear" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Academic Year
                    </label>
                    <select
                      id="newCourseYear"
                      value={newCourseYear}
                      onChange={(e) => setNewCourseYear(Number(e.target.value))}
                      className="block w-full rounded-lg border-none bg-[#05070a] p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary/50 focus:outline-hidden cursor-pointer"
                    >
                      <option value="1">Year 1</option>
                      <option value="2">Year 2</option>
                      <option value="3">Year 3</option>
                      <option value="4">Year 4</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="newCourseSem" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Semester
                    </label>
                    <select
                      id="newCourseSem"
                      value={newCourseSem}
                      onChange={(e) => setNewCourseSem(Number(e.target.value))}
                      className="block w-full rounded-lg border-none bg-[#05070a] p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary/50 focus:outline-hidden cursor-pointer"
                    >
                      <option value={(newCourseYear - 1) * 2 + 1}>Semester {(newCourseYear - 1) * 2 + 1}</option>
                      <option value={(newCourseYear - 1) * 2 + 2}>Semester {(newCourseYear - 1) * 2 + 2}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="newCourseCategory" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Branch / Specialization
                  </label>
                  <select
                    id="newCourseCategory"
                    value={newCourseCategory}
                    onChange={(e) => { setNewCourseCategory(e.target.value); setExtraBranchIds([]); setCustomBranchText(""); }}
                    className="block w-full rounded-lg border-none bg-[#05070a] p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary/50 focus:outline-hidden cursor-pointer"
                  >
                    {BRANCH_FILES.map((branch) => (
                      <option key={branch.id} value={branch.name}>
                        {branch.name}
                      </option>
                    ))}
                    <option value="custom-branch">-- Custom Specialization / Branch --</option>
                  </select>
                </div>

                {newCourseCategory === "custom-branch" && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label htmlFor="customBranchText" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Custom Branch / Specialization Name
                    </label>
                    <input
                      id="customBranchText"
                      type="text"
                      required={newCourseCategory === "custom-branch"}
                      value={customBranchText}
                      onChange={(e) => setCustomBranchText(e.target.value)}
                      placeholder="e.g. Robotics & Automation"
                      className="block w-full rounded-lg border-none bg-surface-container-low px-3.5 py-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary/50 focus:outline-hidden"
                    />
                  </div>
                )}

                {/* Multi-branch selector for New Folder */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Also Visible In (Multi-branch)
                  </label>
                  <div className="bg-[#05070a] rounded-lg p-2 space-y-1 max-h-36 overflow-y-auto border border-white/5">
                    {BRANCH_FILES.filter(b => b.name !== newCourseCategory).map((branch) => {
                      const checked = extraBranchIds.includes(branch.id);
                      return (
                        <label
                          key={branch.id}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                            checked ? "bg-indigo-500/10 text-indigo-300" : "hover:bg-white/5 text-zinc-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setExtraBranchIds(prev =>
                                checked ? prev.filter(id => id !== branch.id) : [...prev, branch.id]
                              );
                            }}
                            className="accent-indigo-500 w-3 h-3"
                          />
                          <span className="text-[11px] font-medium">{branch.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  {extraBranchIds.length > 0 && (
                    <p className="text-[10px] text-indigo-400 font-semibold">
                      ✓ Will be created and uploaded to {extraBranchIds.length + 1} branches
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-3 bg-white/5 rounded-xl border border-white/5 animate-fade-in">
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="selectYear" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Academic Year
                    </label>
                    <select
                      id="selectYear"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="block w-full rounded-lg border-none bg-[#05070a] p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary/50 focus:outline-hidden cursor-pointer"
                    >
                      <option value="1">Year 1</option>
                      <option value="2">Year 2</option>
                      <option value="3">Year 3</option>
                      <option value="4">Year 4</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="selectSem" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Semester
                    </label>
                    <select
                      id="selectSem"
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(Number(e.target.value))}
                      className="block w-full rounded-lg border-none bg-[#05070a] p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary/50 focus:outline-hidden cursor-pointer"
                    >
                      <option value={(selectedYear - 1) * 2 + 1}>Semester {(selectedYear - 1) * 2 + 1}</option>
                      <option value={(selectedYear - 1) * 2 + 2}>Semester {(selectedYear - 1) * 2 + 2}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="selectBranch" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Primary Branch / Specialization
                  </label>
                  <select
                    id="selectBranch"
                    value={selectedBranchId}
                    onChange={(e) => { setSelectedBranchId(e.target.value); setExtraBranchIds([]); setCustomBranchText(""); }}
                    className="block w-full rounded-lg border-none bg-[#05070a] p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary/50 focus:outline-hidden cursor-pointer"
                  >
                    {BRANCH_FILES.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                    <option value="custom-branch">-- Custom Specialization / Branch --</option>
                  </select>
                </div>

                {selectedBranchId === "custom-branch" && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label htmlFor="customBranchTextExisting" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Custom Branch / Specialization Name
                    </label>
                    <input
                      id="customBranchTextExisting"
                      type="text"
                      required={selectedBranchId === "custom-branch"}
                      value={customBranchText}
                      onChange={(e) => setCustomBranchText(e.target.value)}
                      placeholder="e.g. Robotics & Automation"
                      className="block w-full rounded-lg border-none bg-surface-container-low px-3.5 py-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary/50 focus:outline-hidden"
                    />
                  </div>
                )}

                {/* Multi-branch selector */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Also Visible In (Multi-branch)
                  </label>
                  <div className="bg-[#05070a] rounded-lg p-2 space-y-1 max-h-36 overflow-y-auto border border-white/5">
                    {BRANCH_FILES.filter(b => b.id !== selectedBranchId).map((branch) => {
                      const checked = extraBranchIds.includes(branch.id);
                      return (
                        <label
                          key={branch.id}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                            checked ? "bg-indigo-500/10 text-indigo-300" : "hover:bg-white/5 text-zinc-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setExtraBranchIds(prev =>
                                checked ? prev.filter(id => id !== branch.id) : [...prev, branch.id]
                              );
                            }}
                            className="accent-indigo-500 w-3 h-3"
                          />
                          <span className="text-[11px] font-medium">{branch.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  {extraBranchIds.length > 0 && (
                    <p className="text-[10px] text-indigo-400 font-semibold">
                      ✓ Will be uploaded to {extraBranchIds.length + 1} branches
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="selectSubject" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Course Subject
                  </label>
                  <select
                    id="selectSubject"
                    value={selectedSubjectId}
                    onChange={(e) => { setSelectedSubjectId(e.target.value); setCustomSubjectCode(""); setCustomSubjectTitle(""); }}
                    className="block w-full rounded-lg border-none bg-[#05070a] p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary/50 focus:outline-hidden cursor-pointer"
                  >
                    {availableSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.title}
                      </option>
                    ))}
                    <option value="custom-subject">-- Custom Course Subject --</option>
                    {availableSubjects.length === 0 && (
                      <option value="">No subjects available</option>
                    )}
                  </select>
                </div>

                {selectedSubjectId === "custom-subject" && (
                  <div className="space-y-3 p-3 bg-white/5 rounded-xl border border-white/5 animate-fade-in">
                    <div className="space-y-1.5">
                      <label htmlFor="customSubjectCode" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                        Custom Course Code
                      </label>
                      <input
                        id="customSubjectCode"
                        type="text"
                        required={selectedSubjectId === "custom-subject"}
                        value={customSubjectCode}
                        onChange={(e) => setCustomSubjectCode(e.target.value)}
                        placeholder="e.g. CS402"
                        className="block w-full rounded-lg border-none bg-surface-container-low px-3.5 py-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary/50 focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="customSubjectTitle" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                        Custom Course Title
                      </label>
                      <input
                        id="customSubjectTitle"
                        type="text"
                        required={selectedSubjectId === "custom-subject"}
                        value={customSubjectTitle}
                        onChange={(e) => setCustomSubjectTitle(e.target.value)}
                        placeholder="e.g. Distributed Computing"
                        className="block w-full rounded-lg border-none bg-surface-container-low px-3.5 py-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary/50 focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Select Resource Type */}
            <div className="space-y-1.5">
              <label htmlFor="type" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Resource Category
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="block w-full rounded-lg border-none bg-[#05070a] p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary/50 focus:outline-hidden cursor-pointer"
              >
                <option value="pyq">Previous Year Question (PYQ)</option>
                <option value="lecture-notes">Lecture Notes / Handout</option>
                <option value="cts">Class Test / Quiz (CTS)</option>
                <option value="assignment">Assignment Sheet</option>
                <option value="custom">-- Custom Category... --</option>
              </select>
            </div>

            {type === "custom" && (
              <div className="space-y-1.5 animate-fade-in">
                <label htmlFor="customCategory" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Custom Category Name
                </label>
                <input
                  id="customCategory"
                  type="text"
                  required={type === "custom"}
                  value={customCategoryText}
                  onChange={(e) => setCustomCategoryText(e.target.value)}
                  placeholder="e.g. Lab Manual, Syllabus"
                  className="block w-full rounded-lg border-none bg-surface-container-low px-3.5 py-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary/50 focus:outline-hidden"
                />
              </div>
            )}

            {/* Format selection */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Document Format
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "pdf", name: "PDF" },
                  { id: "image", name: "Image" },
                  { id: "video", name: "Video" },
                  { id: "doc", name: "Docx" }
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setFormat(fmt.id as any)}
                    className={`py-2 rounded-lg border text-xs font-semibold transition-all ${
                      format === fmt.id
                        ? "bg-primary/10 border-primary text-primary shadow-[inset_0_0_12px_rgba(99,102,241,0.1)]"
                        : "bg-surface-container-low border-white/10 text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {fmt.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 inline-flex items-center justify-center gap-1.5 py-3 rounded-lg text-xs font-bold bg-primary text-on-primary shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Uploading material..." : "Submit File to Library"}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}
