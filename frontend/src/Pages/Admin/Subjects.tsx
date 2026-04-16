import React, { useState, useCallback, useMemo } from "react";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { SubjectCard } from "../../components/academic/SubjectCard";
import { AddSubjectModal } from "../../components/academic/AddSubjectModal";
import { AddChapterModal } from "../../components/academic/AddChapterModal";
import { useNotification } from "../../context/NotificationContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { useClasses } from "../../hooks/queries/useClasses";
import { useSubjects, useAllClassSubjects, useCheckExistingAssignments } from "../../hooks/queries/useSubjects";
import { useCreateSubject, useAssignSubjectToClasses, useRemoveSubjectFromClass, useCreateChapter, useDeleteChapter } from "../../hooks/mutations/useSubjectMutations";
import { type CreateChapterFormData } from "../../schemas/subject.schema";
import type { Class } from "../../types/class";
import type { ClassSubject, Chapter } from "../../services/subjectService";
import { Button } from "../../components/ui/button";
import { Plus, BookOpen, ChevronDown } from "lucide-react";

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

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    classSubjectId: number | null;
    subjectName: string;
  }>({ isOpen: false, classSubjectId: null, subjectName: "" });

  const allClassIds = useMemo(() => classes.map((c) => parseInt(c.id)).filter((id) => !isNaN(id)), [classes]);

  const { data: checkAssignmentsData } = useCheckExistingAssignments(
    allClassIds,
    selectedYear?.id ? Number(selectedYear.id) : 0
  );

  const existingClassSubjectIds = useMemo(() => {
    const set = new Set<number>();
    (checkAssignmentsData || []).forEach((a) => {
      set.add(a.classId * 1000 + a.subjectId);
    });
    return set;
  }, [checkAssignmentsData]);

  const createSubjectMutation = useCreateSubject();
  const assignSubjectMutation = useAssignSubjectToClasses();
  const removeSubjectMutation = useRemoveSubjectFromClass();
  const createChapterMutation = useCreateChapter();
  const deleteChapterMutation = useDeleteChapter();

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

  const onSubmitSubject = async (data: {
    subjectId?: number;
    name: string;
    code: string;
    classIds: string[];
  }) => {
    if (!selectedYear?.id) {
      showNotification("No academic year selected. Please set an academic year first.", "error");
      return;
    }

    try {
      let subjectId: number;

      if (data.subjectId) {
        subjectId = data.subjectId;
      } else {
        const result = await createSubjectMutation.mutateAsync({
          name: data.name,
          code: data.code,
        });
        subjectId = result.id;
      }

      await assignSubjectMutation.mutateAsync({
        classIds: data.classIds.map((id) => parseInt(id)).filter((id) => !isNaN(id)),
        subjectId,
        academicYearId: parseInt(selectedYear.id),
      });

      showNotification(`Subject assigned to ${data.classIds.length} class(es) successfully`, "success");
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

  const openAddChapter = (classSubjectId: number) => {
    setSelectedSubjectId(classSubjectId);
    setShowAddChapterModal(true);
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
          <Button onClick={() => setShowAddSubjectModal(true)} className="gap-2">
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

      <AddSubjectModal
        isOpen={showAddSubjectModal}
        onClose={() => setShowAddSubjectModal(false)}
        onSubmit={onSubmitSubject}
        allSubjects={allSubjects}
        classes={classes}
        existingClassSubjectIds={existingClassSubjectIds}
        loading={isSaving}
      />

      <AddChapterModal
        isOpen={showAddChapterModal}
        onClose={() => setShowAddChapterModal(false)}
        onSubmit={onSubmitChapter}
        loading={isChapterSaving}
      />

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
