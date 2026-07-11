"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useApp } from "../context/AppContext";
import {
  GraduationCap,
  Folder,
  Code,
  Network,
  Database,
  Settings,
  Layers,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  List,
  Grid,
  BookOpen,
  FolderOpen,
  FileCode,
  FileText,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Search
} from "lucide-react";

import { BRANCH_FILES } from "../lib/constants";

import syllabusData from "../data/syllabus_subjects.json";

function getSubjectsForBranch(branchId: string, semester: number) {
  const semStr = String(semester);
  const branchData = (syllabusData as any)[branchId];
  const list = branchData ? branchData[semStr] || [] : [];
  
  // Map helper attributes for rendering compatibility
  return list.map((item: any, idx: number) => ({
    id: item.id || `${branchId}-${semStr}-${idx}`,
    code: item.code,
    title: item.title,
    description: item.description || `Syllabus core course: ${item.title} (${item.code}).`,
    icon: Code
  }));
}

export default function Home() {
  const { courses, user, isAuthenticated } = useApp();

  // Active step state defaults to null/empty for progressive select
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null); // holds absolute index 1-8
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [branchSearch, setBranchSearch] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<string>("latest");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Step helper calculations
  const isStep1Done = selectedYear !== null;
  const isStep2Done = isStep1Done && selectedSemester !== null;
  const isStep3Done = isStep2Done && selectedBranchId !== null;
  const isStep4Done = isStep3Done && selectedSubjectId !== "";
  const isStep5Done = isStep4Done && selectedCategory !== null;

  const activeStep = !isStep1Done ? 1 : !isStep2Done ? 2 : !isStep3Done ? 3 : !isStep4Done ? 4 : 5;

  // Filter branches based on search input and whether they have subjects for the selected year and semester
  const filteredBranches = useMemo(() => {
    return BRANCH_FILES.filter(b => {
      const matchesSearch = b.name.toLowerCase().includes(branchSearch.toLowerCase());
      if (!matchesSearch) return false;

      if (selectedYear && selectedSemester) {
        const subjects = getSubjectsForBranch(b.id, selectedSemester);
        return subjects.length > 0;
      }
      return true;
    });
  }, [branchSearch, selectedYear, selectedSemester]);

  // Compute available subjects for selected Year, Semester, and Branch
  const availableSubjects = useMemo(() => {
    if (!selectedBranchId || !selectedYear || !selectedSemester) return [];
    
    const hardcoded = getSubjectsForBranch(selectedBranchId, selectedSemester);
    const activeBranchName = BRANCH_FILES.find(b => b.id === selectedBranchId)?.name || "";
    
    // Merge dynamically loaded database courses matching this branch, year, semester
    const dbCourses = courses.filter(c => 
      c.year === selectedYear && 
      ((selectedYear - 1) * 2 + c.semester) === selectedSemester &&
      c.category === activeBranchName
    );

    const merged = [...hardcoded];
    dbCourses.forEach(dbc => {
      if (!merged.some(h => h.id === dbc.id)) {
        merged.push({
          id: dbc.id,
          code: dbc.code,
          title: dbc.title,
          icon: Code,
          description: dbc.description
        });
      }
    });

    return merged;
  }, [courses, selectedBranchId, selectedYear, selectedSemester]);

  // Selected Subject details
  const selectedSubject = useMemo(() => {
    if (!selectedSubjectId || !selectedYear || !selectedSemester || !selectedBranchId) return null;
    
    const dbCourse = courses.find((c) => c.id === selectedSubjectId);
    if (dbCourse) return dbCourse;

    const localSub = availableSubjects.find((s) => s.id === selectedSubjectId);
    if (localSub) {
      return {
        id: localSub.id,
        code: localSub.code,
        title: localSub.title,
        year: selectedYear,
        semester: selectedSemester,
        category: BRANCH_FILES.find(b => b.id === selectedBranchId)?.name || "",
        description: localSub.description,
        resources: []
      };
    }
    return null;
  }, [courses, selectedSubjectId, availableSubjects, selectedYear, selectedSemester, selectedBranchId]);

  // Categories list with counts to match mockup screenshot
  const categoriesList = useMemo(() => {
    if (!selectedSubject) return [];
    
    const countForType = (type: string) => {
      if (type === "custom") {
        return selectedSubject.resources.filter(
          (r) => !["pyq", "lecture-notes", "cts", "assignment", "lab"].includes(r.type) && r.status === "Approved"
        ).length;
      }
      return selectedSubject.resources.filter((r) => r.type === type && r.status === "Approved").length;
    };

    return [
      { id: "pyq", name: "PYQs", icon: HelpCircleIcon, count: countForType("pyq"), color: "text-amber-400" },
      { id: "lecture-notes", name: "Notes", icon: FileText, count: countForType("lecture-notes"), color: "text-indigo-400" },
      { id: "cts", name: "Tests", icon: FileCheckIcon, count: countForType("cts"), color: "text-emerald-400" },
      { id: "assignment", name: "Assignments", icon: FileCode, count: countForType("assignment"), color: "text-purple-400" },
      { id: "lab", name: "Lab Manuals", icon: FlaskIcon, count: countForType("lab"), color: "text-sky-400" },
      { id: "custom", name: "Custom Categories", icon: Layers, count: countForType("custom"), color: "text-rose-400" }
    ];
  }, [selectedSubject]);

  // Filtered resources for selected subject
  const filteredResources = useMemo(() => {
    if (!selectedSubject) return [];
    
    if (selectedCategory === "custom") {
      return selectedSubject.resources.filter(
        (r) => !["pyq", "lecture-notes", "cts", "assignment", "lab"].includes(r.type) && r.status === "Approved"
      );
    }
    
    return selectedSubject.resources.filter(
      (r) => r.type === selectedCategory && r.status === "Approved"
    );
  }, [selectedSubject, selectedCategory]);

  // Horizontal Tab sync click
  const handleTabClick = (tabId: string) => {
    setSelectedCategory(tabId);
  };

  return (
    <div className="space-y-8 py-4 bg-[#05070a] min-h-screen text-zinc-100">
      
      {/* Search Header Banner */}
      <section className="relative space-y-2 pt-4 pb-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2 font-display-lg">
          Find the perfect academic resources
          <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 font-medium">
          Follow the steps to discover and access high-quality resources
        </p>
      </section>

      {/* Progressive Steps Indicator */}
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
                  setSelectedSubjectId("");
                  setSelectedCategory(null);
                } else if (s.step === 2) {
                  setSelectedSemester(null);
                  setSelectedBranchId(null);
                  setSelectedSubjectId("");
                  setSelectedCategory(null);
                } else if (s.step === 3) {
                  setSelectedBranchId(null);
                  setSelectedSubjectId("");
                  setSelectedCategory(null);
                } else if (s.step === 4) {
                  setSelectedSubjectId("");
                  setSelectedCategory(null);
                } else if (s.step === 5) {
                  setSelectedCategory(null);
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
                <span className="text-[9px] text-zinc-600 block leading-none">{s.desc}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Step Content Panels */}
        <div className="pt-4 max-w-4xl mx-auto min-h-[300px] flex flex-col justify-between">
          
          {/* STEP 1: Year selection */}
          {activeStep === 1 && (
            <div className="space-y-6 w-full animate-fade-in">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-white font-display-lg">Select Academic Year</h3>
                <p className="text-xs text-zinc-500">Pick your current academic year division to load matching folders.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
                {[1, 2, 3, 4].map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className="p-6 rounded-2xl bg-gradient-to-b from-[#0a0c10] to-[#06080b] border border-white/5 hover:border-indigo-500/30 hover:scale-103 transition-all text-center flex flex-col items-center gap-3 cursor-pointer group shadow-lg"
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-all">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Year {year}</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Academic folders</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Semester selection */}
          {activeStep === 2 && selectedYear !== null && (
            <div className="space-y-6 w-full animate-fade-in">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-white font-display-lg">Select Semester Division</h3>
                <p className="text-xs text-zinc-500">Select semester mapping for Year {selectedYear}.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                {[
                  (selectedYear - 1) * 2 + 1,
                  (selectedYear - 1) * 2 + 2
                ].map((sem) => (
                  <button
                    key={sem}
                    onClick={() => setSelectedSemester(sem)}
                    className="p-6 rounded-2xl bg-gradient-to-b from-[#0a0c10] to-[#06080b] border border-white/5 hover:border-emerald-500/30 hover:scale-103 transition-all text-center flex flex-col items-center gap-3 cursor-pointer group shadow-lg"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
                      <Folder className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Semester {sem}</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Syllabus plan term</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-center pt-4">
                <button 
                  onClick={() => setSelectedYear(null)}
                  className="px-4 py-2 rounded-xl border border-white/5 hover:bg-white/5 text-xs text-zinc-400 font-semibold cursor-pointer"
                >
                  ← Back to Year selection
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Branch selection */}
          {activeStep === 3 && selectedYear !== null && selectedSemester !== null && (
            <div className="space-y-6 w-full animate-fade-in">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-white font-display-lg">Select Branch Specialization</h3>
                <p className="text-xs text-zinc-500">Find the curriculum for your specific branch.</p>
              </div>
              
              <div className="max-w-md mx-auto space-y-4">
                {/* Search branch bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search your branch..."
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#090b10] border border-white/5 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                  {filteredBranches.map((branch) => (
                    <button
                      key={branch.id}
                      onClick={() => setSelectedBranchId(branch.id)}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-gradient-to-b from-[#0a0c10] to-[#06080b] hover:border-indigo-500/30 transition-all text-xs font-semibold text-left text-zinc-300 hover:text-white cursor-pointer shadow-md"
                    >
                      <span>{branch.name}</span>
                      <ChevronRight className="h-4 w-4 text-zinc-600" />
                    </button>
                  ))}
                  {filteredBranches.length === 0 && (
                    <div className="text-center py-6 text-xs text-zinc-600">No branches available for this semester selection.</div>
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
                <p className="text-xs text-zinc-500">Pick the subject folder to access resources.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto">
                {availableSubjects.map((subject) => {
                  const SubjectIcon = subject.icon || Code;
                  return (
                    <button
                      key={subject.id}
                      onClick={() => {
                        setSelectedSubjectId(subject.id);
                        setSelectedCategory("pyq");
                      }}
                      className="p-4 rounded-xl bg-gradient-to-b from-[#0a0c10] to-[#06080b] border border-white/5 hover:border-emerald-500/30 hover:scale-102 transition-all text-left flex flex-col justify-between min-h-[100px] cursor-pointer group shadow-md"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[9px] font-extrabold uppercase border border-white/5">{subject.code}</span>
                        <SubjectIcon className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-all" />
                      </div>
                      <div className="mt-4">
                        <h4 className="text-xs font-extrabold text-white leading-tight line-clamp-2">{subject.title}</h4>
                      </div>
                    </button>
                  );
                })}
                {availableSubjects.length === 0 && (
                  <div className="col-span-full text-center py-10 text-xs text-zinc-600">No subjects mapped for this configuration.</div>
                )}
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

          {/* STEP 5: Category & Files list view */}
          {activeStep === 5 && selectedYear !== null && selectedSemester !== null && selectedBranchId !== null && selectedSubject && (
            <div className="space-y-6 w-full animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded text-[10px] font-black uppercase tracking-wider">{selectedSubject.code}</span>
                  <h3 className="text-lg font-bold text-white mt-1 font-display-lg">{selectedSubject.title}</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Year {selectedYear} • Semester {selectedSemester} • Regulation curriculum</p>
                </div>
                <button 
                  onClick={() => setSelectedSubjectId("")}
                  className="px-3.5 py-1.5 rounded-lg border border-white/5 bg-zinc-950 hover:bg-zinc-900 text-[10px] font-semibold text-zinc-400 hover:text-white cursor-pointer"
                >
                  ← Select Another Subject
                </button>
              </div>

              {/* PDF Curriculum Plan Download Card */}
              {selectedBranchId && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/20 to-zinc-900 border border-white/5 flex items-center justify-between gap-4 shadow-md">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                    <span className="text-[10px] text-zinc-300 font-bold truncate">Download Regulation Curriculum PDF</span>
                  </div>
                  <a 
                    href={`/api/syllabus?file=${BRANCH_FILES.find(b => b.id === selectedBranchId)?.file}`}
                    className="flex items-center gap-1 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-[9px] font-extrabold text-white transition-all shadow cursor-pointer uppercase tracking-wider"
                    download
                  >
                    <Download className="h-3 w-3" />
                    <span>Download Plan</span>
                  </a>
                </div>
              )}

              {/* Horizontal Tabs Filter Bar */}
              <section className="border-b border-white/5">
                <div className="flex items-center gap-6 overflow-x-auto py-2">
                  {[
                    { id: "pyq", name: "PYQs" },
                    { id: "lecture-notes", name: "Notes" },
                    { id: "cts", name: "Tests" },
                    { id: "assignment", name: "Assignments" },
                    { id: "lab", name: "Lab Manuals" },
                    { id: "custom", name: "Custom Categories" }
                  ].map((tab) => {
                    const isTabActive = selectedCategory === tab.id || (tab.id === "custom" && !["pyq", "lecture-notes", "cts", "assignment", "lab"].includes(selectedCategory || ""));
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={`text-xs font-bold pb-2 transition-all border-b-2 relative ${
                          isTabActive 
                            ? "text-amber-400 border-amber-400" 
                            : "text-zinc-500 hover:text-zinc-300 border-transparent"
                        }`}
                      >
                        {tab.name}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Empty State warning card (only visible if the category has 0 items) */}
              {filteredResources.length === 0 && (
                <section className="glass-panel border border-dashed border-white/10 rounded-2xl p-10 text-center space-y-4 shadow-xl">
                  <div className="mx-auto w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center animate-pulse-glow">
                    <FolderOpen className="h-8 w-8 text-indigo-400" />
                  </div>
                  <div className="space-y-2 max-w-sm mx-auto">
                    <h3 className="text-base font-bold text-white leading-none">This material is coming soon</h3>
                    <p className="text-[11px] text-zinc-500 leading-normal">
                      We are actively indexing and verifying resources for this category. Contributor uploads are welcome!
                    </p>
                  </div>
                  <Link
                    href={`/upload?year=${selectedYear}&semester=${selectedSemester}&courseId=${selectedSubjectId}&type=${selectedCategory}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-xs font-bold text-white transition-all shadow-lg hover:scale-103"
                  >
                    <span>Upload a resource now</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </section>
              )}

              {/* Resources list details panel */}
              {filteredResources.length > 0 && (
                <section className="space-y-4">
                  
                  {/* List Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-white">Resources in this category</h2>
                      <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full font-bold">
                        {filteredResources.length} Items
                      </span>
                    </div>

                    {/* List Filter Options */}
                    <div className="flex items-center gap-3">
                      {/* Sorting */}
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <span>Sort by:</span>
                        <div className="flex items-center gap-0.5 bg-zinc-950 border border-white/5 rounded-lg px-2 py-1 cursor-pointer hover:border-white/10 text-white font-semibold">
                          <span>{sortOrder === "latest" ? "Latest" : "Most Downloaded"}</span>
                          <ChevronDown className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      {/* Layout Grid/List Toggle */}
                      <div className="flex items-center gap-1 bg-[#090b10] border border-white/5 p-1 rounded-lg">
                        <button 
                          onClick={() => setViewMode("list")}
                          className={`p-1 rounded transition-colors ${viewMode === "list" ? "bg-zinc-800 text-indigo-400" : "text-zinc-500"}`}
                        >
                          <List className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => setViewMode("grid")}
                          className={`p-1 rounded transition-colors ${viewMode === "grid" ? "bg-zinc-800 text-indigo-400" : "text-zinc-500"}`}
                        >
                          <Grid className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Items List container */}
                  <div className="space-y-2">
                    {filteredResources.map((resource) => {
                      const FileIcon = getFormatIcon(resource.format);
                      
                      return (
                        <div 
                          key={resource.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-b from-[#0a0c10] to-[#06080b] border border-white/5 hover:border-indigo-500/30 transition-all group shadow-md"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Glowing Format icon container */}
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${getFormatClass(resource.format)}`}>
                              <FileIcon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-xs font-bold text-zinc-100 truncate hover:text-indigo-400 transition-colors">
                                <Link href={`/resources/${resource.id}`}>{resource.title}</Link>
                              </h3>
                              <p className="text-[10px] text-zinc-500 mt-1">
                                Uploaded on {new Date(resource.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • By {resource.uploadedBy}
                              </p>
                            </div>
                          </div>

                          {/* Badges & Action Arrow */}
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="hidden sm:inline text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-900 border border-white/5 text-zinc-500">
                              {resource.format.toUpperCase()}
                            </span>
                            <span className="hidden sm:inline text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-900 border border-white/5 text-zinc-500">
                              5.42 MB
                            </span>
                            <button className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                              <Download className="h-3 w-3" />
                              <span>{formatDownloads(resource.downloadsCount)}</span>
                            </button>
                            <Link 
                              href={`/resources/${resource.id}`}
                              className="w-7 h-7 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center hover:border-indigo-500 hover:bg-indigo-500/10 text-zinc-400 hover:text-indigo-400 transition-all"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </section>
              )}
            </div>
          )}

        </div>
      </section>

    </div>
  );
}

// Custom Icons
function HelpCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function FileCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <polyline points="9 15 11 17 15 13" />
    </svg>
  );
}

function FlaskIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 3h12" />
      <path d="M12 3v12" />
      <path d="M12 15a4 4 0 0 0-4 4v2h8v-2a4 4 0 0 0-4-4z" />
    </svg>
  );
}

// File extension helpers
function getFormatIcon(format: string) {
  if (format === "pdf") return FileText;
  if (format === "doc" || format === "docx") return FileText;
  if (format === "image") return FileSpreadsheet;
  return FileCode;
}

function getFormatClass(format: string) {
  if (format === "pdf") return "bg-red-500/10 text-red-400 border border-red-500/20";
  if (format === "doc" || format === "docx") return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
  if (format === "image") return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
}

function formatDownloads(count: number) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
