import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import { AddChapterModal } from "../../components/modals/AddChapterModal";
import { ConfirmDialog } from "../../components/modals/ConfirmDialog";
import { useNotification } from "../../context/NotificationContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { useClassById } from "../../hooks/queries/useClasses";
import { useSubjectsByClass } from "../../hooks/queries/useSubjects";
import { useSubjectChapters } from "../../hooks/queries";
import { useCreateChapter, useDeleteChapter } from "../../hooks/mutations/useSubjectMutations";
import { Button } from "../../components/ui/button";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Plus, BookOpen, Trash2, ArrowLeft } from "lucide-react";
import type { CreateChapterFormData } from "../../schemas/subject.schema";

const SubjectChapters: React.FC = () => {
  const { id: classId, subjectId } = useParams<{ id: string; subjectId: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    chapterId: null as number | null,
    chapterName: "",
  });

  const { data: classData, isLoading: loadingClass } = useClassById(classId || "");
  const { data: subjectsData = [] } = useSubjectsByClass(classId ? parseInt(classId) : 0);
  const {
    data: chaptersData = [],
    isLoading: loadingChapters,
    refetch: refetchChapters,
  } = useSubjectChapters(classId || "", subjectId ? parseInt(subjectId) : 0, selectedYear?.id || "");

  const subjectName = useMemo(() => {
    const subject = subjectsData.find((s) => s.subjectId.toString() === subjectId);
    return subject?.subjectName || "";
  }, [subjectsData, subjectId]);

  const filteredChapters = chaptersData.filter((ch) =>
    ch.chapterName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createChapterMutation = useCreateChapter();
  const deleteChapterMutation = useDeleteChapter();

  const onSubmitAddChapter = async (data: CreateChapterFormData) => {
    if (!subjectId || !classId || !selectedYear?.id) {
      showNotification("Missing required information", "error");
      return;
    }

    try {
      await createChapterMutation.mutateAsync({
        subjectId: parseInt(subjectId),
        name: data.name,
        sequenceNumber: data.sequenceNumber ? +data.sequenceNumber : undefined,
      });

      showNotification("Chapter created successfully", "success");
      setShowAddModal(false);
      refetchChapters();
    } catch (err) {
      showNotification("Failed to create chapter", "error");
    }
  };

  const handleDeleteChapter = () => {
    if (!deleteDialog.chapterId) return;

    deleteChapterMutation.mutate(deleteDialog.chapterId, {
      onSuccess: () => {
        showNotification("Chapter deleted successfully", "success");
        setDeleteDialog({ isOpen: false, chapterId: null, chapterName: "" });
        refetchChapters();
      },
      onError: () => {
        showNotification("Failed to delete chapter", "error");
      },
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const isLoading = loadingClass || loadingChapters;

  if (!classData) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Class not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={`Chapters - ${subjectName || "Loading..."}`}
        subtitle={`${classData.name} - Section ${classData.section || "A"} • Manage chapters for this subject`}
        breadcrumb={{
          links: [
            { label: "Academics", href: "/admin/classes" },
            { label: "Classes", href: "/admin/classes" },
            { label: classData.name, href: `/admin/classes/${classId}` },
            { label: "Subjects", href: `/admin/classes/${classId}/subjects` },
            { label: "Chapters", active: true },
          ],
        }}
        actions={[
          {
            label: "Back",
            icon: ArrowLeft,
            onClick: handleBack,
            variant: "outline",
          },
          {
            label: "Add Chapter",
            icon: Plus,
            onClick: () => setShowAddModal(true),
          },
        ]}
      />

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onReset={() => setSearchTerm("")}
        searchPlaceholder="Search chapters..."
      />

      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 flex items-center justify-center">
          <LoadingSpinner size="lg" message="Loading chapters..." />
        </div>
      ) : filteredChapters.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Sequence
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Chapter Name
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredChapters
                .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
                .map((chapter) => (
                  <tr
                    key={chapter.chapterId}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-sm text-slate-600">
                        {chapter.sequenceNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800">
                        {chapter.chapterName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() =>
                          setDeleteDialog({
                            isOpen: true,
                            chapterId: chapter.chapterId,
                            chapterName: chapter.chapterName,
                          })
                        }
                        className="p-2 hover:bg-rose-50 rounded-lg transition-colors inline-flex"
                        title="Delete Chapter"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            No Chapters Found
          </h3>
          <p className="text-slate-500 mb-6">
            {searchTerm ? "Try adjusting your search" : "Add your first chapter for this subject"}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Chapter
            </Button>
          )}
        </div>
      )}

      <AddChapterModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={onSubmitAddChapter}
        loading={createChapterMutation.isPending}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, chapterId: null, chapterName: "" })}
        onConfirm={handleDeleteChapter}
        title="Delete Chapter"
        message={`Are you sure you want to delete "${deleteDialog.chapterName}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteChapterMutation.isPending}
      />
    </div>
  );
};

export default SubjectChapters;
