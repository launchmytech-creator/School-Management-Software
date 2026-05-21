import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import { ExamCard } from "./ExamCard";
import { CreateExamModal } from "../../components/modals/CreateExamModal";
import { EditExamModal } from "../../components/modals/EditExamModal";
import { useNotification } from "../../context/NotificationContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { examService, type Exam } from "../../services/examService";
import { useExams, useCreateExam, useUpdateExam, useDeleteExam } from "../../hooks/queries";
import { useClasses } from "../../hooks/queries";
import { Plus, GraduationCap, ArrowLeft, FileText } from "lucide-react";
import { Button } from "../../components/ui/button";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { sortByGrade } from "../../lib/utils";
import { ConfirmDialog } from "../../components/modals/ConfirmDialog";
import type { Class } from "../../types/class";

interface ExamsListProps {
  layout: "admin" | "accountant";
}

type ViewMode = "classes" | "exams";

const ExamsList: React.FC<ExamsListProps> = ({ layout }) => {
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();
  const navigate = useNavigate();

  const isAdmin = layout === "admin";
  const basePath = isAdmin ? "/admin" : "/accountant";

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("classes");
  const [selectedClassData, setSelectedClassData] = useState<Class | null>(null);
  const [classSearch, setClassSearch] = useState("");

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, examId: null as number | null });

  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editHasResults, setEditHasResults] = useState(false);
  const [checkingResults, setCheckingResults] = useState(false);

  const { data: exams = [], isLoading } = useExams({
    classId: selectedClassData ? parseInt(selectedClassData.id) : undefined,
  });
  const { data: classes = [], isLoading: loadingClasses } = useClasses(selectedYear?.id);

  const createExam = useCreateExam();
  const updateExam = useUpdateExam();
  const deleteExam = useDeleteExam();

  const filteredClasses = useMemo(() => {
    if (!classSearch.trim()) return sortByGrade(classes);
    const s = classSearch.toLowerCase();
    return sortByGrade(
      classes.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          (c.section && c.section.toLowerCase().includes(s)),
      )
    );
  }, [classes, classSearch]);

  const handleDeleteExam = () => {
    if (!deleteDialog.examId) return;

    deleteExam.mutate(deleteDialog.examId, {
      onSuccess: () => {
        showNotification("Exam deleted successfully", "success");
      },
      onError: () => {
        showNotification("Failed to delete exam", "error");
      },
      onSettled: () => {
        setDeleteDialog({ isOpen: false, examId: null });
      },
    });
  };

  const handleEditExam = async (exam: Exam) => {
    try {
      setCheckingResults(true);
      const results = await examService.getResults({ examId: exam.id });
      setEditHasResults(results.length > 0);
      setEditingExam(exam);
      setShowEditModal(true);
    } catch {
      showNotification("Failed to load exam details", "error");
    } finally {
      setCheckingResults(false);
    }
  };

  const onCreateExam = async (data: Parameters<typeof createExam.mutateAsync>[0]) => {
    await createExam.mutateAsync(data);
    showNotification("Exam created successfully", "success");
    setShowCreateModal(false);
  };

  const onUpdateExam = async (data: Parameters<typeof updateExam.mutateAsync>[0]["data"]) => {
    if (!editingExam) return;
    await updateExam.mutateAsync({ id: editingExam.id, data });
    showNotification("Exam updated successfully", "success");
    setShowEditModal(false);
    setEditingExam(null);
  };

  const handleViewClassExams = (cls: Class) => {
    setSelectedClassData(cls);
    setViewMode("exams");
  };

  const handleBackToClasses = () => {
    setViewMode("classes");
    setSelectedClassData(null);
  };

  // ── Class list view ──────────────────────────────────────────────

  const renderClassListView = () => (
    <>
      {isAdmin && (
        <PageHeader
          title="Examinations"
          subtitle="Select a class to view and manage exams"
          breadcrumb={{
            links: [
              { label: "Exams", href: `${basePath}/exams` },
              { label: "Examinations", active: true },
            ],
          }}
        />
      )}

      <FilterBar
        searchTerm={classSearch}
        onSearchChange={setClassSearch}
        onReset={() => setClassSearch("")}
        searchPlaceholder="Search class or section..."
      >
        {!isAdmin && (
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Exam
          </Button>
        )}
      </FilterBar>

      {loadingClasses ? (
        <div className="bg-white rounded-2xl p-12 flex items-center justify-center">
          <LoadingSpinner size="lg" message="Loading classes..." />
        </div>
      ) : filteredClasses.length > 0 ? (
        <div className="space-y-4">
          {filteredClasses.map((cls) => (
            <div
              key={cls.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewClassExams(cls)}
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-violet-50 text-violet-600">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {cls.name}
                        {cls.section && ` - Section ${cls.section}`}
                      </h3>
                      <p className="text-sm text-slate-500">
                        Section {cls.section || "A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewClassExams(cls);
                      }}
                    >
                      <FileText className="w-4 h-4" />
                      View Exams
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center">
          <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Classes Found</h3>
          <p className="text-slate-500">
            {classSearch
              ? "Try adjusting your search"
              : "No classes available for the selected academic year"}
          </p>
        </div>
      )}
    </>
  );

  // ── Class exams view ────────────────────────────────────────────

  const renderClassExamsView = () => {
    if (!selectedClassData) return null;

    return (
      <>
        {isAdmin && (
          <PageHeader
            title={`${selectedClassData.name} - Section ${selectedClassData.section || "A"}`}
            subtitle="Manage exams for this class"
            breadcrumb={{
              links: [
                { label: "Exams", href: `${basePath}/exams` },
                { label: selectedClassData.name, active: true },
              ],
            }}
            actions={[
              {
                label: "Create Exam",
                icon: Plus,
                onClick: () => setShowCreateModal(true),
              },
            ]}
          />
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={handleBackToClasses}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Classes
          </button>
          {!isAdmin && (
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Exam
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 flex items-center justify-center">
            <LoadingSpinner size="lg" message="Loading exams..." />
          </div>
        ) : exams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                basePath={basePath}
                onEdit={handleEditExam}
                onDelete={(examId) => setDeleteDialog({ isOpen: true, examId })}
                onNavigate={navigate}
                isCheckingResults={checkingResults}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center">
            <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Exams Found</h3>
            <p className="text-slate-500 mb-6">Create your first exam for this class</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Exam
            </Button>
          </div>
        )}
      </>
    );
  };

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {viewMode === "classes" ? renderClassListView() : renderClassExamsView()}

      <CreateExamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={onCreateExam}
        classes={classes}
        academicYearId={selectedYear?.id ? Number(selectedYear.id) : 0}
        loading={createExam.isPending}
        preSelectedClassId={selectedClassData ? parseInt(selectedClassData.id) : undefined}
      />

      <EditExamModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingExam(null);
        }}
        onSubmit={onUpdateExam}
        exam={editingExam}
        hasResults={editHasResults}
        loading={updateExam.isPending}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, examId: null })}
        onConfirm={handleDeleteExam}
        title="Delete Exam"
        message="Are you sure you want to delete this exam? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default ExamsList;
