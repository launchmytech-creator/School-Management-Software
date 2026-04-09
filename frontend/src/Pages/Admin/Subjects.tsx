import React, { useState, useEffect, useCallback, useMemo } from "react";

import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { useNotification } from "../../context/NotificationContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import {
  subjectService,
  type ClassSubject,
  type Chapter,
} from "../../services/subjectService";
import { classService, type Class } from "../../services/classService";
import { BaseModal } from "../../components/common/BaseModal";
import { Button } from "../../components/ui/button";
import InputField from "../../components/ui/InputField";
import { Plus, BookOpen, ChevronRight, Loader, Trash2 } from "lucide-react";

const EMPTY_CLASSES: Class[] = [];

const Subjects: React.FC = () => {
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>(EMPTY_CLASSES);
  const [allClassSubjects, setAllClassSubjects] = useState<ClassSubject[]>([]);
  const [chaptersCache, setChaptersCache] = useState<Record<number, Chapter[]>>(
    {},
  );

  const [expandedClasses, setExpandedClasses] = useState<Set<number>>(
    new Set(),
  );
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);
  const [loadingChapters, setLoadingChapters] = useState<Set<number>>(
    new Set(),
  );

  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [selectedClassInModal, setSelectedClassInModal] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(
    null,
  );

  const [subjectForm, setSubjectForm] = useState({ name: "" });
  const [subjectCode, setSubjectCode] = useState("");
  const [codeEditedManually, setCodeEditedManually] = useState(false);
  const [chapterForm, setChapterForm] = useState({
    name: "",
    sequenceNumber: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchClasses = useCallback(async () => {
    try {
      const data = await classService.getClasses();
      setClasses(data);
      // Classes will be collapsed by default - user clicks to expand
    } catch {
      showNotification("Failed to fetch classes", "error");
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
      const data = await subjectService.getAllClassSubjects(
        Number(selectedYear.id),
      );
      console.log("All ClassSubjects loaded:", data);
      setAllClassSubjects(data);
    } catch {
      showNotification("Failed to fetch subjects", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedYear?.id]);

  const fetchChapters = useCallback(
    async (classSubjectId: number) => {
      const classSubject = allClassSubjects.find(
        (cs) => cs.id === classSubjectId,
      );
      if (!classSubject) return;

      if (chaptersCache[classSubjectId]) return;
      if (loadingChapters.has(classSubjectId)) return;

      setLoadingChapters((prev) => new Set(prev).add(classSubjectId));

      try {
        const data = await subjectService.getChaptersBySubject(
          classSubject.subjectId,
        );
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
    [allClassSubjects, chaptersCache, loadingChapters],
  );

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchAllClassSubjects();
  }, [fetchAllClassSubjects]);

  const generateSubjectCode = (
    subjectName: string,
    classId: string,
  ): string => {
    if (!classId || !subjectName) return "";

    const parsedClassId = parseInt(classId);
    console.log("generateSubjectCode:", {
      subjectName,
      classId,
      parsedClassId,
      classes: classes.map((c) => c.id),
    });

    const selectedClassData = classes.find(
      (c) => Number(c.id) === parsedClassId,
    );
    console.log("selectedClassData:", selectedClassData);

    if (!selectedClassData) return "";

    const classNum = selectedClassData.name.replace(/\D/g, "");
    const section = (selectedClassData.section || "A").charAt(0).toUpperCase();
    const subjectCode = subjectName.substring(0, 4).toUpperCase();

    return `${classNum}${section}-${subjectCode}`;
  };

  const getSubjectsForClass = (classId: number): ClassSubject[] => {
    const filtered = allClassSubjects.filter(
      (cs) => cs.classId === Number(classId),
    );
    console.log(`getSubjectsForClass(${classId}):`, filtered);
    return filtered;
  };

  const toggleClassExpand = (classId: number) => {
    setExpandedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      return next;
    });
  };

  const handleCreateSubject = async () => {
    if (!subjectForm.name.trim()) {
      setErrors({ name: "Subject name is required" });
      return;
    }
    if (!selectedClassInModal) {
      setErrors({ class: "Please select a class" });
      return;
    }
    if (!selectedYear?.id) {
      setErrors({
        year: "No academic year selected. Please set an academic year first.",
      });
      return;
    }
    if (!subjectCode.trim()) {
      setErrors({ code: "Subject code is required" });
      return;
    }

    try {
      setSaving(true);

      const subject = await subjectService.createSubject({
        name: subjectForm.name,
        code: subjectCode,
      });

      await subjectService.assignSubjectToClass({
        classId: parseInt(selectedClassInModal),
        subjectId: subject.id,
        academicYearId: selectedYear.id,
      });

      showNotification("Subject created and assigned successfully", "success");
      setShowAddSubjectModal(false);
      setSubjectForm({ name: "" });
      setSubjectCode("");
      setCodeEditedManually(false);
      setErrors({});
      fetchAllClassSubjects();
    } catch (err) {
      console.error("Create subject error:", err);
      showNotification("Failed to create subject", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateChapter = async () => {
    if (!chapterForm.name.trim()) {
      setErrors({ chapterName: "Chapter name is required" });
      return;
    }
    if (!selectedSubjectId) return;

    const classSubject = allClassSubjects.find(
      (cs) => cs.id === selectedSubjectId,
    );
    if (!classSubject) return;

    try {
      setSaving(true);

      await subjectService.createChapter({
        subjectId: classSubject.subjectId,
        name: chapterForm.name,
        sequenceNumber: chapterForm.sequenceNumber
          ? parseInt(chapterForm.sequenceNumber)
          : undefined,
      });

      showNotification("Chapter created successfully", "success");
      setShowAddChapterModal(false);
      setChapterForm({ name: "", sequenceNumber: "" });
      setErrors({});

      const data = await subjectService.getChaptersBySubject(
        classSubject.subjectId,
      );
      setChaptersCache((prev) => ({ ...prev, [selectedSubjectId]: data }));
    } catch (err) {
      console.error("Create chapter error:", err);
      showNotification("Failed to create chapter", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubject = async (classSubjectId: number) => {
    if (
      !confirm("Are you sure you want to delete this subject from this class?")
    )
      return;

    try {
      await subjectService.removeSubjectFromClass(classSubjectId);
      showNotification("Subject removed successfully", "success");
      fetchAllClassSubjects();
    } catch {
      showNotification("Failed to remove subject", "error");
    }
  };

  const handleSubjectClick = async (classSubjectId: number) => {
    if (expandedSubject === classSubjectId) {
      setExpandedSubject(null);
    } else {
      setExpandedSubject(classSubjectId);
      await fetchChapters(classSubjectId);
    }
  };

  const openAddSubjectModal = (classId?: number) => {
    const classToSelect = classId
      ? String(classId)
      : classes[0]?.id
        ? String(classes[0].id)
        : "";
    console.log("openAddSubjectModal called:", {
      classId,
      classesFirstId: classes[0]?.id,
      classToSelect,
    });
    setSelectedClassInModal(classToSelect);
    setErrors({});
    setSubjectForm({ name: "" });
    setSubjectCode("");
    setCodeEditedManually(false);
    setShowAddSubjectModal(true);
  };

  const openAddChapter = (classSubjectId: number) => {
    setSelectedSubjectId(classSubjectId);
    setShowAddChapterModal(true);
    setErrors({});
    setChapterForm({ name: "", sequenceNumber: "" });
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Subjects"
        subtitle="Manage subjects and chapters for each class"
        breadcrumb={{
          links: [
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Subjects", active: true },
          ],
        }}
      />

      {!selectedYear?.id ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-700 font-medium">
            Please set an academic year first to manage subjects.
          </p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 flex items-center justify-center">
          <div className="animate-pulse text-slate-400">
            Loading subjects...
          </div>
        </div>
      ) : classes.length > 0 ? (
        <div className="space-y-4">
          {classes.map((cls) => {
            const classSubjects = getSubjectsForClass(Number(cls.id));
            const isClassExpanded = expandedClasses.has(cls.id);

            return (
              <div
                key={cls.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <div
                  className="p-4 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between"
                  onClick={() => toggleClassExpand(cls.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        isClassExpanded ? "bg-blue-100" : "bg-slate-100"
                      }`}
                    >
                      <BookOpen
                        className={`w-5 h-5 ${isClassExpanded ? "text-blue-600" : "text-slate-500"}`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {cls.name} - Section {cls.section || "A"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {classSubjects.length} subject
                        {classSubjects.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddSubjectModal(cls.id);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Subject
                    </Button>
                    <ChevronRight
                      className={`w-5 h-5 text-slate-400 transition-transform ${isClassExpanded ? "rotate-90" : ""}`}
                    />
                  </div>
                </div>

                {isClassExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50 p-4">
                    {classSubjects.length > 0 ? (
                      <div className="space-y-3">
                        {classSubjects.map((cs) => {
                          const isSubjectExpanded = expandedSubject === cs.id;
                          const chapters = chaptersCache[cs.id] || [];
                          const isLoadingChapters = loadingChapters.has(cs.id);

                          return (
                            <div
                              key={cs.id}
                              className="bg-white rounded-lg border border-slate-200 overflow-hidden"
                            >
                              <div
                                className="p-3 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between"
                                onClick={() => handleSubjectClick(cs.id)}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <BookOpen className="w-4 h-4 text-indigo-600" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-slate-800 text-sm">
                                      {cs.subjectName}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {chapters.length} chapter
                                      {chapters.length !== 1 ? "s" : ""}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openAddChapter(cs.id);
                                    }}
                                    className="text-xs"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add
                                  </Button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSubject(cs.id);
                                    }}
                                    className="p-1.5 hover:bg-red-50 rounded-lg"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                  </button>
                                  <ChevronRight
                                    className={`w-4 h-4 text-slate-400 transition-transform ${isSubjectExpanded ? "rotate-90" : ""}`}
                                  />
                                </div>
                              </div>

                              {isSubjectExpanded && (
                                <div className="border-t border-slate-100 p-3 bg-slate-50">
                                  {isLoadingChapters ? (
                                    <div className="text-center py-3 text-slate-400">
                                      <Loader className="w-4 h-4 animate-spin mx-auto" />
                                    </div>
                                  ) : chapters.length > 0 ? (
                                    <div className="space-y-2">
                                      {chapters.map((chapter) => (
                                        <div
                                          key={chapter.id}
                                          className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200"
                                        >
                                          <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center font-bold text-xs text-slate-600">
                                              {chapter.sequenceNumber}
                                            </div>
                                            <span className="text-sm text-slate-700">
                                              {chapter.name}
                                            </span>
                                          </div>
                                          <button
                                            onClick={() =>
                                              showNotification(
                                                "Delete coming soon",
                                                "info",
                                              )
                                            }
                                            className="p-1 hover:bg-red-50 rounded-lg"
                                          >
                                            <Trash2 className="w-3 h-3 text-red-400" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-500 text-center py-2">
                                      No chapters yet
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-slate-500 mb-3">
                          No subjects added to this class yet.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => openAddSubjectModal(cls.id)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Subject
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No classes found"
          description="No classes have been set up yet."
        />
      )}

      {/* Add Subject Modal */}
      <BaseModal
        isOpen={showAddSubjectModal}
        onClose={() => setShowAddSubjectModal(false)}
        title="Add New Subject"
        size="md"
      >
        <div className="p-6 space-y-4">
          <InputField
            label="Subject Name"
            placeholder="e.g., Mathematics"
            value={subjectForm.name}
            onChange={(e) => {
              const newName = e.target.value;
              console.log("=== Subject name changed ===", newName);
              console.log("selectedClassInModal:", selectedClassInModal);
              console.log("codeEditedManually:", codeEditedManually);

              setSubjectForm({ name: newName });

              if (!codeEditedManually) {
                const generated = generateSubjectCode(
                  newName,
                  selectedClassInModal,
                );
                console.log("Generated code:", generated);
                setSubjectCode(generated);
              } else {
                console.log(
                  "Skipping auto-generate because user edited manually",
                );
              }
              setErrors((prev) => ({ ...prev, name: "" }));
            }}
            error={errors.name}
          />

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Class
            </label>
            <select
              value={selectedClassInModal}
              onChange={(e) => {
                console.log("Class changed to:", e.target.value);
                setSelectedClassInModal(e.target.value);
                if (!codeEditedManually) {
                  const generated = generateSubjectCode(
                    subjectForm.name,
                    e.target.value,
                  );
                  setSubjectCode(generated);
                }
                setErrors((prev) => ({ ...prev, class: "" }));
              }}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Class {cls.name} - Section {cls.section || "A"}
                </option>
              ))}
            </select>
            {errors.class && (
              <p className="text-red-500 text-xs mt-1">{errors.class}</p>
            )}
          </div>

          <InputField
            label="Subject Code"
            placeholder="e.g., 10A-MATH"
            value={subjectCode}
            onChange={(e) => {
              setSubjectCode(e.target.value.toUpperCase());
              setCodeEditedManually(true);
              setErrors((prev) => ({ ...prev, code: "" }));
            }}
            error={errors.code}
          />

          {errors.year && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              {errors.year}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAddSubjectModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubject}
              loading={saving}
              className="flex-1"
            >
              Create Subject
            </Button>
          </div>
        </div>
      </BaseModal>

      {/* Add Chapter Modal */}
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
            onChange={(e) => {
              setChapterForm({ ...chapterForm, name: e.target.value });
              setErrors((prev) => ({ ...prev, chapterName: "" }));
            }}
            error={errors.chapterName}
          />
          <InputField
            label="Sequence Number (optional)"
            type="number"
            placeholder="e.g., 1"
            value={chapterForm.sequenceNumber}
            onChange={(e) =>
              setChapterForm({ ...chapterForm, sequenceNumber: e.target.value })
            }
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAddChapterModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateChapter}
              loading={saving}
              className="flex-1"
            >
              Add Chapter
            </Button>
          </div>
        </div>
      </BaseModal>
    </div>
  );
};

export default Subjects;
