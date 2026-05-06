import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import { AddSubjectModal } from "../../components/modals/AddSubjectModal";
import { ConfirmDialog } from "../../components/modals/ConfirmDialog";
import { useNotification } from "../../context/NotificationContext";
import { useAcademicYear } from "../../context/AcademicYearContext";
import { useClassById } from "../../hooks/queries/useClasses";
import { useSubjectsByClass, useAllClassSubjects, useCheckExistingAssignments, useChapters } from "../../hooks/queries/useSubjects";
import {
  useCreateSubject,
  useAssignSubjectToClasses,
  useRemoveSubjectFromClass,
} from "../../hooks/mutations/useSubjectMutations";
import { Button } from "../../components/ui/button";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Plus, BookOpen, Trash2, ListChecks } from "lucide-react";
import { subjectIcon } from "../../lib/subject-utils";

const ClassSubjects: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    classSubjectId: null as number | null,
    subjectName: "",
  });

  const { data: classData, isLoading: loadingClass } = useClassById(id || "");
  const { data: subjectsData, isLoading: loadingSubjects, refetch: refetchSubjects } = useSubjectsByClass(
    id ? parseInt(id) : 0
  );
  const subjects = subjectsData || [];

  const {
    refetch: refetchAllClassSubjects,
  } = useAllClassSubjects(selectedYear?.id ? Number(selectedYear.id) : 0);

  const filteredSubjects = useMemo(() => {
    if (!searchTerm) return subjects;
    return subjects.filter((s) =>
      s.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subjects, searchTerm]);

  const createSubjectMutation = useCreateSubject();
  const assignSubjectMutation = useAssignSubjectToClasses();
  const removeSubjectMutation = useRemoveSubjectFromClass();

  const allClassIds = useMemo(
    () => [id ? parseInt(id) : 0],
    [id]
  );

  const { data: checkAssignmentsData } = useCheckExistingAssignments(
    allClassIds,
    selectedYear?.id ? Number(selectedYear.id) : 0,
  );

  const existingClassSubjectIds = useMemo(() => {
    const set = new Set<number>();
    (checkAssignmentsData || []).forEach((a) => {
      set.add(a.classId * 1000 + a.subjectId);
    });
    return set;
  }, [checkAssignmentsData]);

  const onSubmitAddSubject = async (data: {
    subjectId?: number;
    name: string;
    code: string;
    classIds: string[];
  }) => {
    if (!selectedYear?.id || !id) {
      showNotification("No academic year or class selected", "error");
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
        classIds: [parseInt(id)],
        subjectId,
        academicYearId: parseInt(selectedYear.id),
      });

      showNotification("Subject added successfully", "success");
      setShowAddModal(false);
      refetchSubjects();
      refetchAllClassSubjects();
    } catch (err: any) {
      showNotification(
        err?.response?.data?.message || "Failed to add subject",
        "error"
      );
    }
  };

  const handleDeleteSubject = (classSubjectId: number, subjectName: string) => {
    setDeleteDialog({ isOpen: true, classSubjectId, subjectName });
  };

  const confirmDeleteSubject = async () => {
    if (!deleteDialog.classSubjectId) return;

    removeSubjectMutation.mutate(deleteDialog.classSubjectId, {
      onSuccess: () => {
        showNotification("Subject removed successfully", "success");
        setDeleteDialog({ isOpen: false, classSubjectId: null, subjectName: "" });
        refetchSubjects();
        refetchAllClassSubjects();
      },
      onError: () => {
        showNotification("Failed to remove subject", "error");
      },
    });
  };

  const handleManageChapters = (subjectId: number) => {
    if (!id) return;
    navigate(`/admin/classes/${id}/subjects/${subjectId}/chapters`);
  };

  const isLoading = loadingClass || loadingSubjects;

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
        title={`Subjects - ${classData.name}`}
        subtitle={`Section ${classData.section || "A"} • Manage subjects for this class`}
        breadcrumb={{
          links: [
            { label: "Academics", href: "/admin/classes" },
            { label: "Classes", href: "/admin/classes" },
            { label: classData.name, href: `/admin/classes/${id}` },
            { label: "Subjects", active: true },
          ],
        }}
        actions={[
          {
            label: "Add Subject",
            icon: Plus,
            onClick: () => setShowAddModal(true),
          },
        ]}
      />

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onReset={() => setSearchTerm("")}
        searchPlaceholder="Search subjects..."
      />

      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 flex items-center justify-center">
          <LoadingSpinner size="lg" message="Loading subjects..." />
        </div>
      ) : filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onManageChapters={() => handleManageChapters(subject.subjectId)}
              onDelete={() => handleDeleteSubject(subject.id, subject.subjectName)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            No Subjects Found
          </h3>
          <p className="text-slate-500 mb-6">
            {searchTerm ? "Try adjusting your search" : "Add your first subject to this class"}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Subject
            </Button>
          )}
        </div>
      )}

      <AddSubjectModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={onSubmitAddSubject}
        allSubjects={[]}
        classes={classData ? [{ id: classData.id, name: classData.name, section: classData.section }] as any : []}
        existingClassSubjectIds={existingClassSubjectIds}
        loading={createSubjectMutation.isPending || assignSubjectMutation.isPending}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, classSubjectId: null, subjectName: "" })}
        onConfirm={confirmDeleteSubject}
        title="Remove Subject"
        message={`Are you sure you want to remove "${deleteDialog.subjectName}" from this class? This action cannot be undone.`}
        confirmText="Remove"
        variant="danger"
        loading={removeSubjectMutation.isPending}
      />
    </div>
  );
};

interface SubjectCardProps {
  subject: {
    id: number;
    subjectId: number;
    subjectName: string;
    classId: number;
    className: string;
    academicYearId: number;
    academicYearName: string;
  };
  onManageChapters: () => void;
  onDelete: () => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onManageChapters, onDelete }) => {
  const { icon: subjectIconName, bg: iconBg, text: iconText } = subjectIcon(subject.subjectName);
  const { data: chapters = [] } = useChapters(subject.subjectId);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${iconBg}`}>
          <span
            className={`material-symbols-outlined text-xl ${iconText}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {subjectIconName}
          </span>
        </div>
        <button
          onClick={onDelete}
          className="p-2 hover:bg-rose-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4 text-rose-400" />
        </button>
      </div>

      <h3 className="text-lg font-bold text-slate-900 mb-1">{subject.subjectName}</h3>
      <p className="text-sm text-slate-500 mb-3">
        {chapters.length} chapter{chapters.length !== 1 ? "s" : ""}
      </p>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <button
          onClick={onManageChapters}
          className="w-full py-2 bg-blue-500 text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <ListChecks className="w-4 h-4" />
          Manage Chapters
        </button>
      </div>
    </div>
  );
};

export default ClassSubjects;
