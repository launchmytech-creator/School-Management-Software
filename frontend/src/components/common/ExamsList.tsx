import React, { useState } from "react";
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
import { Plus, GraduationCap } from "lucide-react";
import { Button } from "../../components/ui/button";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { ConfirmDialog } from "../../components/modals/ConfirmDialog";

interface ExamsListProps {
  layout: "admin" | "accountant";
}

const ExamsList: React.FC<ExamsListProps> = ({ layout }) => {
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();
  const navigate = useNavigate();

  const isAdmin = layout === "admin";
  const basePath = isAdmin ? "/admin" : "/accountant";

  const [selectedClass, setSelectedClass] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, examId: null as number | null });

  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editHasResults, setEditHasResults] = useState(false);
  const [checkingResults, setCheckingResults] = useState(false);

  const { data: exams = [], isLoading } = useExams({
    classId: selectedClass ? parseInt(selectedClass) : undefined,
  });
  const { data: classes = [] } = useClasses(selectedYear?.id);

  const createExam = useCreateExam();
  const updateExam = useUpdateExam();
  const deleteExam = useDeleteExam();

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

  const renderContent = () => (
    <>
      {isAdmin && (
        <PageHeader
          title="Examinations"
          subtitle="Manage exams and view results"
          breadcrumb={{
            links: [
              { label: "Exams", href: `${basePath}/exams` },
              { label: "Examinations", active: true },
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

      <FilterBar
        searchTerm=""
        onSearchChange={() => {}}
        onReset={() => setSelectedClass("")}
      >
        {!isAdmin && (
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Exam
          </Button>
        )}
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700"
        >
          <option value="">All Classes</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name} - Section {cls.section || "A"}
            </option>
          ))}
        </select>
      </FilterBar>

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
          <p className="text-slate-500 mb-6">Create your first exam to get started</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Exam
          </Button>
        </div>
      )}

      <CreateExamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={onCreateExam}
        classes={classes}
        academicYearId={selectedYear?.id ? Number(selectedYear.id) : 0}
        loading={createExam.isPending}
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
    </>
  );

  return <div className="space-y-6">{renderContent()}</div>;
};

export default ExamsList;
