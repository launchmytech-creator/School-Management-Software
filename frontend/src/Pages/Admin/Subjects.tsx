import React, { useState, useCallback, useMemo } from "react";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { SubjectCard } from "../../components/academic/SubjectCard";
import { useNotification } from "../../context/NotificationContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { useClasses } from "../../hooks/queries/useClasses";
import { useSubjects, useAllClassSubjects, useCheckExistingAssignments } from "../../hooks/queries/useSubjects";
import { useCreateSubject, useAssignSubjectToClasses, useRemoveSubjectFromClass, useCreateChapter, useDeleteChapter } from "../../hooks/mutations/useSubjectMutations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createChapterSchema, type CreateChapterFormData } from "../../schemas/subject.schema";
import type { Class } from "../../types/class";
import type { Subject, ClassSubject, Chapter } from "../../services/subjectService";
import { BaseModal } from "../../components/common/BaseModal";
import { Button } from "../../components/ui/button";
import InputField from "../../components/ui/InputField";
import { Plus, BookOpen, Check, X, AlertCircle, ChevronDown } from "lucide-react";

const subjectFormSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
});

const Subjects: React.FC = () => {
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();

  const { data: classesData, isLoading: loadingClasses } = useClasses();
  const classes = classesData || [];

  const { data: allSubjectsData } = useSubjects();
  const allSubjects = allSubjectsData || [];

  const { data: allClassSubjectsData, isLoading: loadingClassSubjects, refetch: refetchClassSubjects } = useAllClassSubjects(
    selectedYear?.id ? Number(selectedYear.id) : 0
  );
  const allClassSubjects = allClassSubjectsData || [];

  const [chaptersCache, setChaptersCache] = useState<Record<number, Chapter[]>>({});
  const [loadingChaptersMap, setLoadingChaptersMap] = useState<Record<number, boolean>>({});

  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);

  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

  const [subjectCode, setSubjectCode] = useState("");
  const [codeEditedManually, setCodeEditedManually] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);
  const [isNewSubject, setIsNewSubject] = useState(true);
  const [selectedExistingSubject, setSelectedExistingSubject] = useState<Subject | null>(null);
  const [classesError, setClassesError] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    classSubjectId: number | null;
    subjectName: string;
  }>({ isOpen: false, classSubjectId: null, subjectName: "" });

  const { data: checkAssignmentsData } = useCheckExistingAssignments(
    selectedClasses.map((id) => parseInt(id)).filter((id) => !isNaN(id)),
    selectedYear?.id ? Number(selectedYear.id) : 0
  );

  const createSubjectMutation = useCreateSubject();
  const assignSubjectMutation = useAssignSubjectToClasses();
  const removeSubjectMutation = useRemoveSubjectFromClass();
  const createChapterMutation = useCreateChapter();
  const deleteChapterMutation = useDeleteChapter();

  const {
    register: registerSubject,
    handleSubmit: handleSubjectSubmit,
    watch: watchSubject,
    reset: resetSubjectForm,
    setValue: setSubjectValue,
    formState: { errors: subjectErrors },
  } = useForm<z.infer<typeof subjectFormSchema>>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: { name: "" },
  });

  const {
    register: registerChapter,
    handleSubmit: handleChapterSubmit,
    reset: resetChapterForm,
    formState: { errors: chapterErrors },
  } = useForm<CreateChapterFormData>({
    resolver: zodResolver(createChapterSchema),
    defaultValues: { name: "", sequenceNumber: "" },
  });

  const fetchChapters = useCallback(
    async (classSubjectId: number, subjectId: number) => {
      if (chaptersCache[classSubjectId]) return;
      if (loadingChaptersMap[classSubjectId]) return;

      setLoadingChaptersMap((prev) => ({ ...prev, [classSubjectId]: true }));
      try {
        const { data } = await import("../../services/subjectService").then((m) =>
          m.subjectService.getChaptersBySubject(subjectId).then((r) => ({ data: r }))
        );
        setChaptersCache((prev) => ({ ...prev, [classSubjectId]: data }));
      } catch {
        showNotification("Failed to fetch chapters", "error");
      } finally {
        setLoadingChaptersMap((prev) => ({ ...prev, [classSubjectId]: false }));
      }
    },
    [chaptersCache, loadingChaptersMap, showNotification]
  );

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

  const getSubjectsForClass = useCallback(
    (classId: number): ClassSubject[] => {
      return allClassSubjects.filter((cs) => cs.classId === Number(classId));
    },
    [allClassSubjects]
  );

  const toggleSection = (classId: number) => {
    setExpandedSection((prev) => (prev === classId ? null : classId));
    setExpandedSubject(null);
  };

  const handleSubjectClick = async (classSubjectId: number, subjectId: number) => {
    if (expandedSubject === classSubjectId) {
      setExpandedSubject(null);
    } else {
      setExpandedSubject(classSubjectId);
      await fetchChapters(classSubjectId, subjectId);
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

  const onSubmitSubject = async (data: z.infer<typeof subjectFormSchema>) => {
    if (selectedClasses.length === 0) {
      setClassesError("Please select at least one class");
      return;
    }
    if (!selectedYear?.id) {
      showNotification("No academic year selected. Please set an academic year first.", "error");
      return;
    }

    try {
      let subjectId: number;

      if (isNewSubject) {
        if (!subjectCode.trim()) {
          setClassesError("Subject code is required");
          return;
        }
        const result = await createSubjectMutation.mutateAsync({
          name: data.name,
          code: subjectCode,
        });
        subjectId = result.id;
      } else {
        subjectId = selectedExistingSubject!.id;
      }

      await assignSubjectMutation.mutateAsync({
        classIds: selectedClasses.map((id) => parseInt(id)).filter((id) => !isNaN(id)),
        subjectId,
        academicYearId: parseInt(selectedYear.id),
      });

      showNotification(`Subject assigned to ${selectedClasses.length} class(es) successfully`, "success");
      resetSubjectModal();
      setShowAddSubjectModal(false);
      refetchClassSubjects();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || "Failed to create subject";
      if (err?.response?.data?.errorCode === "SUBJECT_001") {
        showNotification(err.response.data.message, "warning");
      } else {
        showNotification(errorMessage, "error");
      }
    }
  };

  const resetSubjectModal = () => {
    resetSubjectForm();
    setSubjectCode("");
    setCodeEditedManually(false);
    setSelectedClasses([]);
    setShowSubjectSuggestions(false);
    setIsNewSubject(true);
    setSelectedExistingSubject(null);
    setClassesError("");
  };

  const onSubmitChapter = async (data: CreateChapterFormData) => {
    if (!selectedSubjectId) return;

    const classSubject = allClassSubjects.find((cs) => cs.id === selectedSubjectId);
    if (!classSubject) return;

    try {
      await createChapterMutation.mutateAsync({
        subjectId: classSubject.subjectId,
        name: data.name,
        sequenceNumber: data.sequenceNumber ? parseInt(data.sequenceNumber) : undefined,
      });

      showNotification("Chapter created successfully", "success");
      setShowAddChapterModal(false);
      resetChapterForm();

      const { data: chapterData } = await import("../../services/subjectService").then((m) =>
        m.subjectService.getChaptersBySubject(classSubject.subjectId).then((r) => ({ data: r }))
      );
      setChaptersCache((prev) => ({ ...prev, [selectedSubjectId]: chapterData }));
    } catch {
      showNotification("Failed to create chapter", "error");
    }
  };

  const handleDeleteSubject = (classSubjectId: number, subjectName: string) => {
    setDeleteConfirm({ isOpen: true, classSubjectId, subjectName });
  };

  const confirmDeleteSubject = async () => {
    if (!deleteConfirm.classSubjectId) return;
    try {
      await removeSubjectMutation.mutateAsync(deleteConfirm.classSubjectId);
      showNotification("Subject removed successfully", "success");
      setDeleteConfirm({ isOpen: false, classSubjectId: null, subjectName: "" });
      refetchClassSubjects();
    } catch (error: any) {
      showNotification(error?.message || error?.response?.data?.message || "Failed to remove subject", "error");
    }
  };

  const handleDeleteChapter = async (chapterId: number, classSubjectId: number, subjectId: number) => {
    try {
      await deleteChapterMutation.mutateAsync(chapterId);
      showNotification("Chapter deleted successfully", "success");

      const classSubject = allClassSubjects.find((cs) => cs.id === classSubjectId);
      if (classSubject) {
        const { data } = await import("../../services/subjectService").then((m) =>
          m.subjectService.getChaptersBySubject(subjectId).then((r) => ({ data: r }))
        );
        setChaptersCache((prev) => ({ ...prev, [classSubjectId]: data }));
      }
    } catch {
      showNotification("Failed to delete chapter", "error");
    }
  };

  const openAddSubjectModal = async () => {
    setSelectedClasses([]);
    setSubjectCode("");
    setCodeEditedManually(false);
    setIsNewSubject(true);
    setSelectedExistingSubject(null);
    setShowSubjectSuggestions(false);
    setClassesError("");
    resetSubjectForm();
    setShowAddSubjectModal(true);
  };

  const openAddChapter = (classSubjectId: number) => {
    setSelectedSubjectId(classSubjectId);
    setShowAddChapterModal(true);
    resetChapterForm();
  };

  const watchedSubjectName = watchSubject("name");

  const getSubjectSuggestions = useCallback(() => {
    if (!watchedSubjectName?.trim()) return [];
    return allSubjects
      .filter((s) => s.name.toLowerCase().includes(watchedSubjectName.toLowerCase().trim()))
      .slice(0, 5);
  }, [watchedSubjectName, allSubjects]);

  const selectExistingSubject = (subject: Subject) => {
    setSelectedExistingSubject(subject);
    setSubjectValue("name", subject.name);
    setSubjectCode(subject.code);
    setCodeEditedManually(true);
    setIsNewSubject(false);
    setShowSubjectSuggestions(false);
    setClassesError("");
    if (checkAssignmentsData) {
      const assignedClassIds = checkAssignmentsData
        .filter((a) => a.subjectId === subject.id)
        .map((a) => String(a.classId));
      setSelectedClasses(assignedClassIds);
    }
  };

  const handleSubjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setSubjectValue("name", newName);
    setShowSubjectSuggestions(true);
    setIsNewSubject(true);
    setSelectedExistingSubject(null);
    if (!codeEditedManually && selectedClasses.length > 0) {
      const generated = generateSubjectCode(newName, String(selectedClasses[0]));
      setSubjectCode(generated);
    }
  };

  const toggleClassSelection = (classId: string) => {
    setSelectedClasses((prev) => {
      if (prev.includes(classId)) return prev.filter((id) => id !== classId);
      return [...prev, classId];
    });
    setClassesError("");
  };

  const selectAllClasses = () => {
    setSelectedClasses(classes.map((c) => c.id));
    setClassesError("");
  };

  const clearAllClasses = () => setSelectedClasses([]);

  const isClassAssigned = (classId: string): boolean => {
    if (isNewSubject) return false;
    const numericClassId = parseInt(classId);
    return (checkAssignmentsData || []).some(
      (a) => a.classId === numericClassId && a.subjectId === selectedExistingSubject?.id
    );
  };

  const isLoading = loadingClasses || loadingClassSubjects;
  const isSaving = createSubjectMutation.isPending || assignSubjectMutation.isPending;
  const isChapterSaving = createChapterMutation.isPending;

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
        {selectedYear?.id && !isLoading && classes.length > 0 && (
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
      ) : isLoading ? (
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
                        <React.Fragment key={section.id}>
                          <tr
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
                                      const isLoadingChapters = loadingChaptersMap[cs.id];

                                      return (
                                        <SubjectCard
                                          key={cs.id}
                                          classSubject={cs}
                                          isExpanded={isSubjectExpanded}
                                          chapters={chapters}
                                          isLoadingChapters={isLoadingChapters}
                                          onToggle={() => handleSubjectClick(cs.id, cs.subjectId)}
                                          onAddChapter={() => openAddChapter(cs.id)}
                                          onDeleteSubject={() => handleDeleteSubject(cs.id, cs.subjectName)}
                                          onDeleteChapter={(chapterId) => handleDeleteChapter(chapterId, cs.id, cs.subjectId)}
                                        />
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
                        </React.Fragment>
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
        onClose={() => {
          setShowAddSubjectModal(false);
          resetSubjectModal();
        }}
        title="Add Subject to Classes"
        size="lg"
      >
        <form onSubmit={handleSubjectSubmit(onSubmitSubject)} className="p-6 space-y-5">
          <div className="relative">
            <InputField
              label="Subject Name"
              placeholder="Type to search or create new subject..."
              {...registerSubject("name")}
              onChange={handleSubjectNameChange}
              onFocus={() => setShowSubjectSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSubjectSuggestions(false), 200)}
              error={subjectErrors.name?.message}
            />

            {showSubjectSuggestions && watchedSubjectName?.trim() && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                {getSubjectSuggestions().length > 0 && (
                  <div className="p-2">
                    <p className="text-xs text-slate-500 font-medium px-2 py-1">Existing Subjects</p>
                    {getSubjectSuggestions().map((subject) => (
                      <button
                        key={subject.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectExistingSubject(subject);
                        }}
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
              <button
                type="button"
                onClick={() => {
                  setSelectedExistingSubject(null);
                  setSubjectValue("name", "");
                  setIsNewSubject(true);
                }}
                className="p-1 hover:bg-blue-100 rounded"
              >
                <X className="w-4 h-4 text-blue-500" />
              </button>
            </div>
          )}

          <InputField
            label="Subject Code"
            placeholder="e.g., 10A-MATH"
            value={subjectCode}
            onChange={(e) => {
              setSubjectCode(e.target.value.toUpperCase());
              setCodeEditedManually(true);
            }}
            error={classesError && !subjectCode.trim() && isNewSubject ? undefined : undefined}
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">Assign to Classes</label>
              <div className="flex gap-2">
                <button type="button" onClick={selectAllClasses} className="text-xs text-blue-600 hover:text-blue-700">
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button type="button" onClick={clearAllClasses} className="text-xs text-slate-500 hover:text-slate-600">
                  Clear
                </button>
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
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isAssigned ? "border-slate-300 bg-slate-200" : isSelected ? "border-blue-500 bg-blue-500" : "border-slate-300"
                      }`}
                    >
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

            {selectedClasses.length === 0 && classesError && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {classesError}
              </p>
            )}

            <p className="text-xs text-slate-500 mt-2">
              {selectedClasses.length} class(es) selected{selectedExistingSubject && ` for "${selectedExistingSubject.name}"`}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddSubjectModal(false);
                resetSubjectModal();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSaving} className="flex-1">
              {isNewSubject ? "Create & Assign" : "Assign to Classes"}
            </Button>
          </div>
        </form>
      </BaseModal>

      <BaseModal isOpen={showAddChapterModal} onClose={() => setShowAddChapterModal(false)} title="Add New Chapter" size="md">
        <form onSubmit={handleChapterSubmit(onSubmitChapter)} className="p-6 space-y-4">
          <InputField
            label="Chapter Name"
            placeholder="e.g., Chapter 1 - Introduction"
            {...registerChapter("name")}
            error={chapterErrors.name?.message}
          />
          <InputField
            label="Sequence Number (optional)"
            type="number"
            placeholder="e.g., 1"
            {...registerChapter("sequenceNumber")}
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowAddChapterModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={isChapterSaving} className="flex-1">
              Add Chapter
            </Button>
          </div>
        </form>
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
