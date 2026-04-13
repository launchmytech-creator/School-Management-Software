import React, { useState, useEffect, useCallback, useMemo } from "react";

import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { useNotification } from "../../context/NotificationContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import {
  subjectService,
  type ClassSubject,
  type Chapter,
  type Subject,
} from "../../services/subjectService";
import { classService } from "../../services/classService";
import type { Class } from "../../types/class";
import { BaseModal } from "../../components/common/BaseModal";
import { Button } from "../../components/ui/button";
import InputField from "../../components/ui/InputField";
import { Plus, BookOpen, ChevronRight, Loader, Trash2, Check, X, AlertCircle, ChevronDown } from "lucide-react";

const Subjects: React.FC = () => {
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [allClassSubjects, setAllClassSubjects] = useState<ClassSubject[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [chaptersCache, setChaptersCache] = useState<Record<number, Chapter[]>>({});

  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);
  const [loadingChapters, setLoadingChapters] = useState<Set<number>>(new Set());

  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

  const [subjectForm, setSubjectForm] = useState({ name: "" });
  const [subjectCode, setSubjectCode] = useState("");
  const [codeEditedManually, setCodeEditedManually] = useState(false);
  const [chapterForm, setChapterForm] = useState({ name: "", sequenceNumber: "" });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [existingAssignments, setExistingAssignments] = useState<ClassSubject[]>([]);
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);
  const [isNewSubject, setIsNewSubject] = useState(true);
  const [selectedExistingSubject, setSelectedExistingSubject] = useState<Subject | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    classSubjectId: number | null;
    subjectName: string;
  }>({ isOpen: false, classSubjectId: null, subjectName: "" });

  const fetchClasses = useCallback(async () => {
    try {
      const data = await classService.getClasses();
      setClasses(data);
    } catch {
      showNotification("Failed to fetch classes", "error");
    }
  }, [showNotification]);

  const fetchAllSubjects = useCallback(async () => {
    try {
      const data = await subjectService.getSubjects();
      setAllSubjects(data);
    } catch {
      // Silently fail for subject list
    }
  }, []);

  const fetchAllClassSubjects = useCallback(async () => {
    if (!selectedYear?.id) {
      setAllClassSubjects([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await subjectService.getAllClassSubjects(Number(selectedYear.id));
      setAllClassSubjects(data);
    } catch {
      showNotification("Failed to fetch subjects", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedYear?.id, showNotification]);

  const fetchChapters = useCallback(
    async (classSubjectId: number) => {
      const classSubject = allClassSubjects.find((cs) => cs.id === classSubjectId);
      if (!classSubject) return;
      if (chaptersCache[classSubjectId]) return;
      if (loadingChapters.has(classSubjectId)) return;

      setLoadingChapters((prev) => new Set(prev).add(classSubjectId));
      try {
        const data = await subjectService.getChaptersBySubject(classSubject.subjectId);
        setChaptersCache((prev) => ({ ...prev, [classSubjectId]: data }));
      } catch {
        showNotification("Failed to fetch chapters", "error");
      } finally {
        setLoadingChapters((prev) => {
          const next = new Set(prev);
          next.delete(classSubjectId);
          return next;
        });
      }
    },
    [allClassSubjects, chaptersCache, loadingChapters, showNotification],
  );

  useEffect(() => {
    fetchClasses();
    fetchAllSubjects();
  }, [fetchClasses, fetchAllSubjects]);

  useEffect(() => {
    fetchAllClassSubjects();
  }, [fetchAllClassSubjects]);

  const groupedByClass = useMemo(() => {
    const grouped: Record<string, Class[]> = {};
    classes.forEach((cls) => {
      if (!grouped[cls.name]) grouped[cls.name] = [];
      grouped[cls.name].push(cls);
    });
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => (a.section || "A").localeCompare(b.section || "A"));
    });
    return grouped;
  }, [classes]);

  const getSubjectsForClass = useCallback((classId: number): ClassSubject[] => {
    return allClassSubjects.filter((cs) => cs.classId === Number(classId));
  }, [allClassSubjects]);

  const toggleSection = (classId: number) => {
    setExpandedSection((prev) => (prev === classId ? null : classId));
    setExpandedSubject(null);
  };

  const handleSubjectClick = async (classSubjectId: number) => {
    if (expandedSubject === classSubjectId) {
      setExpandedSubject(null);
    } else {
      setExpandedSubject(classSubjectId);
      await fetchChapters(classSubjectId);
    }
  };

  const generateSubjectCode = (subjectName: string, classId: string): string => {
    if (!classId || !subjectName) return "";
    const selectedClassData = classes.find((c) => Number(c.id) === parseInt(classId));
    if (!selectedClassData) return "";
    const classNum = selectedClassData.name.replace(/\D/g, "");
    const section = (selectedClassData.section || "A").charAt(0).toUpperCase();
    return `${classNum}${section}-${subjectName.substring(0, 4).toUpperCase()}`;
  };

  const handleCreateSubject = async () => {
    if (!subjectForm.name.trim()) {
      setErrors({ name: "Subject name is required" });
      return;
    }
    if (selectedClasses.length === 0) {
      setErrors({ classes: "Please select at least one class" });
      return;
    }
    if (!selectedYear?.id) {
      setErrors({ year: "No academic year selected. Please set an academic year first." });
      return;
    }
    if (!subjectCode.trim()) {
      setErrors({ code: "Subject code is required" });
      return;
    }

    try {
      setSaving(true);
      let subjectId: number;

      if (isNewSubject) {
        const subject = await subjectService.createSubject({
          name: subjectForm.name,
          code: subjectCode,
        });
        subjectId = subject.id;
      } else {
        subjectId = selectedExistingSubject!.id;
      }

      const results = await subjectService.assignSubjectToMultipleClasses(
        selectedClasses.map((id) => parseInt(id)).filter((id) => !isNaN(id)),
        subjectId,
        parseInt(selectedYear.id),
      );

      showNotification(`Subject assigned to ${results.length} class(es) successfully`, "success");
      resetSubjectModal();
      setShowAddSubjectModal(false);
      fetchAllClassSubjects();
      fetchAllSubjects();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || "Failed to create subject";
      if (err?.response?.data?.errorCode === "SUBJECT_001") {
        showNotification(err.response.data.message, "warning");
      } else {
        showNotification(errorMessage, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const resetSubjectModal = () => {
    setSubjectForm({ name: "" });
    setSubjectCode("");
    setCodeEditedManually(false);
    setErrors({});
    setSelectedClasses([]);
    setExistingAssignments([]);
    setShowSubjectSuggestions(false);
    setIsNewSubject(true);
    setSelectedExistingSubject(null);
  };

  const handleCreateChapter = async () => {
    if (!chapterForm.name.trim()) {
      setErrors({ chapterName: "Chapter name is required" });
      return;
    }
    if (!selectedSubjectId) return;

    const classSubject = allClassSubjects.find((cs) => cs.id === selectedSubjectId);
    if (!classSubject) return;

    try {
      setSaving(true);
      await subjectService.createChapter({
        subjectId: classSubject.subjectId,
        name: chapterForm.name,
        sequenceNumber: chapterForm.sequenceNumber ? parseInt(chapterForm.sequenceNumber) : undefined,
      });

      showNotification("Chapter created successfully", "success");
      setShowAddChapterModal(false);
      setChapterForm({ name: "", sequenceNumber: "" });
      setErrors({});

      const data = await subjectService.getChaptersBySubject(classSubject.subjectId);
      setChaptersCache((prev) => ({ ...prev, [selectedSubjectId]: data }));
    } catch {
      showNotification("Failed to create chapter", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubject = (classSubjectId: number, subjectName: string) => {
    setDeleteConfirm({ isOpen: true, classSubjectId, subjectName });
  };

  const confirmDeleteSubject = async () => {
    if (!deleteConfirm.classSubjectId) return;
    try {
      await subjectService.removeSubjectFromClass(deleteConfirm.classSubjectId);
      showNotification("Subject removed successfully", "success");
      setDeleteConfirm({ isOpen: false, classSubjectId: null, subjectName: "" });
      fetchAllClassSubjects();
    } catch (error: any) {
      showNotification(error?.message || error?.response?.data?.message || "Failed to remove subject", "error");
    }
  };

  const handleDeleteChapter = async (chapterId: number, classSubjectId: number) => {
    try {
      await subjectService.deleteChapter(chapterId);
      showNotification("Chapter deleted successfully", "success");

      const classSubject = allClassSubjects.find((cs) => cs.id === classSubjectId);
      if (classSubject) {
        const data = await subjectService.getChaptersBySubject(classSubject.subjectId);
        setChaptersCache((prev) => ({ ...prev, [classSubjectId]: data }));
      }
    } catch {
      showNotification("Failed to delete chapter", "error");
    }
  };

  const openAddSubjectModal = async () => {
    setSelectedClasses([]);
    setErrors({});
    setSubjectForm({ name: "" });
    setSubjectCode("");
    setCodeEditedManually(false);
    setIsNewSubject(true);
    setSelectedExistingSubject(null);
    setShowSubjectSuggestions(false);

    if (selectedYear?.id) {
      try {
        const numericClassIds = classes.map((c) => parseInt(c.id)).filter((id) => !isNaN(id));
        const assignments = await subjectService.checkExistingAssignments(numericClassIds, parseInt(selectedYear.id));
        setExistingAssignments(assignments);
      } catch {
        setExistingAssignments([]);
      }
    }

    setShowAddSubjectModal(true);
  };

  const openAddChapter = (classSubjectId: number) => {
    setSelectedSubjectId(classSubjectId);
    setShowAddChapterModal(true);
    setErrors({});
    setChapterForm({ name: "", sequenceNumber: "" });
  };

  const getSubjectSuggestions = useCallback(() => {
    if (!subjectForm.name.trim()) return [];
    return allSubjects.filter((s) => s.name.toLowerCase().includes(subjectForm.name.toLowerCase().trim())).slice(0, 5);
  }, [subjectForm.name, allSubjects]);

  const selectExistingSubject = (subject: Subject) => {
    setSelectedExistingSubject(subject);
    setSubjectForm({ name: subject.name });
    setSubjectCode(subject.code);
    setCodeEditedManually(true);
    setIsNewSubject(false);
    setShowSubjectSuggestions(false);
    setErrors({});
    const assignedClassIds = existingAssignments.filter((a) => a.subjectId === subject.id).map((a) => String(a.classId));
    setSelectedClasses(assignedClassIds);
  };

  const toggleClassSelection = (classId: string) => {
    setSelectedClasses((prev) => {
      if (prev.includes(classId)) return prev.filter((id) => id !== classId);
      return [...prev, classId];
    });
    setErrors({ classes: "" });
  };

  const selectAllClasses = () => {
    setSelectedClasses(classes.map((c) => c.id));
    setErrors({ classes: "" });
  };

  const clearAllClasses = () => setSelectedClasses([]);

  const isClassAssigned = (classId: string): boolean => {
    if (isNewSubject) return false;
    const numericClassId = parseInt(classId);
    return existingAssignments.some((a) => a.classId === numericClassId && a.subjectId === selectedExistingSubject?.id);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Subjects"
          subtitle="Manage subjects and chapters for each class"
          breadcrumb={{
            links: [
              { label: "Academics", href: "/admin/subjects" },
              { label: "Subjects", active: true },
            ],
          }}
        />
        {selectedYear?.id && !loading && classes.length > 0 && (
          <Button onClick={openAddSubjectModal} className="gap-2">
            <Plus className="size-4" />
            Add Subject
          </Button>
        )}
      </div>

      {!selectedYear?.id ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-700 font-medium">Please set an academic year first to manage subjects.</p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex items-center justify-center">
          <div className="animate-pulse text-slate-400">Loading subjects...</div>
        </div>
      ) : Object.keys(groupedByClass).length === 0 ? (
        <EmptyState icon={BookOpen} title="No classes found" description="No classes have been set up yet." />
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedByClass).map(([className, sections]) => (
            <div key={className} className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-100" />
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                  {className}
                </h2>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-visible">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Section</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Subjects</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Expand</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sections.map((section) => {
                      const sectionSubjects = getSubjectsForClass(Number(section.id));
                      const isExpanded = expandedSection === Number(section.id);

                      return (
                        <>
                          <tr
                            key={section.id}
                            className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                            onClick={() => toggleSection(Number(section.id))}
                          >
                            <td className="px-10 py-6">
                              <div className="flex items-center gap-4">
                                <div className="size-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                  <BookOpen className="size-5" />
                                </div>
                                <span className="font-display font-black text-slate-900 text-lg tracking-tight">
                                  Section {section.section || "N/A"}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span className="font-display font-black text-slate-900 text-lg">{sectionSubjects.length}</span>
                            </td>
                            <td className="py-6 text-center">
                              <ChevronDown
                                className={`size-5 text-slate-400 mx-auto transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                              />
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr>
                              <td colSpan={3} className="bg-slate-50 p-4">
                                <div className="space-y-2">
                                  {sectionSubjects.length > 0 ? (
                                    sectionSubjects.map((cs) => {
                                      const isSubjectExpanded = expandedSubject === cs.id;
                                      const chapters = chaptersCache[cs.id] || [];
                                      const isLoadingChapters = loadingChapters.has(cs.id);

                                      return (
                                        <div key={cs.id} className="bg-white rounded-xl overflow-hidden border border-slate-200">
                                          <div
                                            className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                                            onClick={() => handleSubjectClick(cs.id)}
                                          >
                                            <div className="flex items-center gap-3 flex-1">
                                              <BookOpen className="size-4 text-indigo-500" />
                                              <span className="font-medium text-slate-700">{cs.subjectName}</span>
                                              <span className="text-xs text-slate-400">({chapters.length} chapters)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={(e) => { e.stopPropagation(); openAddChapter(cs.id); }}
                                                className="p-1.5 hover:bg-slate-100 rounded-lg"
                                                title="Add Chapter"
                                              >
                                                <Plus className="size-4 text-slate-400" />
                                              </button>
                                              <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteSubject(cs.id, cs.subjectName); }}
                                                className="p-1.5 hover:bg-red-50 rounded-lg"
                                                title="Delete Subject"
                                              >
                                                <Trash2 className="size-4 text-red-400" />
                                              </button>
                                              <ChevronRight
                                                className={`size-4 text-slate-400 transition-transform ${isSubjectExpanded ? "rotate-90" : ""}`}
                                              />
                                            </div>
                                          </div>

                                          {isSubjectExpanded && (
                                            <div className="border-t border-slate-100 p-3 bg-slate-50">
                                              {isLoadingChapters ? (
                                                <div className="text-center py-2">
                                                  <Loader className="size-4 animate-spin mx-auto text-slate-400" />
                                                </div>
                                              ) : chapters.length > 0 ? (
                                                <div className="space-y-1">
                                                  {chapters.map((chapter) => (
                                                    <div key={chapter.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                                                      <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 bg-slate-200 rounded flex items-center justify-center font-bold text-xs text-slate-600">
                                                          {chapter.sequenceNumber}
                                                        </div>
                                                        <span className="text-sm text-slate-600">{chapter.name}</span>
                                                      </div>
                                                      <button
                                                        onClick={() => handleDeleteChapter(chapter.id, cs.id)}
                                                        className="p-1 hover:bg-red-50 rounded"
                                                      >
                                                        <Trash2 className="size-3 text-red-400" />
                                                      </button>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <p className="text-xs text-slate-400 text-center py-2">No chapters yet</p>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <p className="text-sm text-slate-400 text-center py-4 bg-white rounded-xl border border-slate-200">
                                      No subjects added to this section
                                    </p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <BaseModal
        isOpen={showAddSubjectModal}
        onClose={() => { setShowAddSubjectModal(false); resetSubjectModal(); }}
        title="Add Subject to Classes"
        size="lg"
      >
        <div className="p-6 space-y-5">
          <div className="relative">
            <InputField
              label="Subject Name"
              placeholder="Type to search or create new subject..."
              value={subjectForm.name}
              onChange={(e) => {
                const newName = e.target.value;
                setSubjectForm({ name: newName });
                setShowSubjectSuggestions(true);
                setIsNewSubject(true);
                setSelectedExistingSubject(null);
                if (!codeEditedManually && selectedClasses.length > 0) {
                  const generated = generateSubjectCode(newName, String(selectedClasses[0]));
                  setSubjectCode(generated);
                }
                setErrors((prev) => ({ ...prev, name: "" }));
              }}
              onFocus={() => setShowSubjectSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSubjectSuggestions(false), 200)}
              error={errors.name}
            />

            {showSubjectSuggestions && subjectForm.name.trim() && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                {getSubjectSuggestions().length > 0 && (
                  <div className="p-2">
                    <p className="text-xs text-slate-500 font-medium px-2 py-1">Existing Subjects</p>
                    {getSubjectSuggestions().map((subject) => (
                      <button
                        key={subject.id}
                        onMouseDown={(e) => { e.preventDefault(); selectExistingSubject(subject); }}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800">{subject.name}</p>
                          <p className="text-xs text-slate-500">{subject.code}</p>
                        </div>
                        <Check className="w-4 h-4 text-blue-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedExistingSubject && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">Using existing: {selectedExistingSubject.name}</span>
              </div>
              <button onClick={() => { setSelectedExistingSubject(null); setSubjectForm({ name: "" }); setIsNewSubject(true); }} className="p-1 hover:bg-blue-100 rounded">
                <X className="w-4 h-4 text-blue-500" />
              </button>
            </div>
          )}

          <InputField
            label="Subject Code"
            placeholder="e.g., 10A-MATH"
            value={subjectCode}
            onChange={(e) => { setSubjectCode(e.target.value.toUpperCase()); setCodeEditedManually(true); setErrors((prev) => ({ ...prev, code: "" })); }}
            error={errors.code}
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">Assign to Classes</label>
              <div className="flex gap-2">
                <button type="button" onClick={selectAllClasses} className="text-xs text-blue-600 hover:text-blue-700">Select All</button>
                <span className="text-slate-300">|</span>
                <button type="button" onClick={clearAllClasses} className="text-xs text-slate-500 hover:text-slate-600">Clear</button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg max-h-48 overflow-auto">
              {classes.map((cls) => {
                const isSelected = selectedClasses.includes(cls.id);
                const isAssigned = isClassAssigned(cls.id);

                return (
                  <div
                    key={cls.id}
                    onClick={() => !isAssigned && toggleClassSelection(cls.id)}
                    className={`p-3 flex items-center gap-3 border-b border-slate-100 last:border-b-0 cursor-pointer transition-colors ${
                      isAssigned ? "bg-slate-50 cursor-not-allowed" : isSelected ? "bg-blue-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isAssigned ? "border-slate-300 bg-slate-200" : isSelected ? "border-blue-500 bg-blue-500" : "border-slate-300"
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isAssigned ? "text-slate-500" : "text-slate-800"}`}>
                        Class {cls.name} - Section {cls.section || "A"}
                      </p>
                    </div>
                    {isAssigned && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">Already assigned</span>}
                  </div>
                );
              })}
            </div>

            {selectedClasses.length === 0 && errors.classes && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.classes}
              </p>
            )}

            <p className="text-xs text-slate-500 mt-2">
              {selectedClasses.length} class(es) selected{selectedExistingSubject && ` for "${selectedExistingSubject.name}"`}
            </p>
          </div>

          {errors.year && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {errors.year}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => { setShowAddSubjectModal(false); resetSubjectModal(); }} className="flex-1">Cancel</Button>
            <Button onClick={handleCreateSubject} loading={saving} className="flex-1">
              {isNewSubject ? "Create & Assign" : "Assign to Classes"}
            </Button>
          </div>
        </div>
      </BaseModal>

      <BaseModal
        isOpen={showAddChapterModal}
        onClose={() => setShowAddChapterModal(false)}
        title="Add New Chapter"
        size="md"
      >
        <div className="p-6 space-y-4">
          <InputField
            label="Chapter Name"
            placeholder="e.g., Chapter 1 - Introduction"
            value={chapterForm.name}
            onChange={(e) => { setChapterForm({ ...chapterForm, name: e.target.value }); setErrors((prev) => ({ ...prev, chapterName: "" })); }}
            error={errors.chapterName}
          />
          <InputField
            label="Sequence Number (optional)"
            type="number"
            placeholder="e.g., 1"
            value={chapterForm.sequenceNumber}
            onChange={(e) => setChapterForm({ ...chapterForm, sequenceNumber: e.target.value })}
          />

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowAddChapterModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleCreateChapter} loading={saving} className="flex-1">Add Chapter</Button>
          </div>
        </div>
      </BaseModal>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, classSubjectId: null, subjectName: "" })}
        onConfirm={confirmDeleteSubject}
        title="Delete Subject"
        message={`Are you sure you want to remove "${deleteConfirm.subjectName}" from this class? This will also remove all chapters associated with this subject.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default Subjects;
