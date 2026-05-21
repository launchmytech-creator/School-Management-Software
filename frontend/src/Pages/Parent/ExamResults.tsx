import React from 'react';
import { useParams } from 'react-router-dom';
import { useSelectedChild } from '../../context/SelectedChildContext';
import { useParentChildren } from '../../hooks/queries';
import { GraduationCap } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ParentExamList from '../../components/parent/exam/ExamList';
import ParentExamSubjectGrid from '../../components/parent/exam/ExamSubjectGrid';
import ParentExamMarksDetail from '../../components/parent/exam/ExamMarksDetail';

const EMPTY_CHILDREN: any[] = [];

const ParentExamResults: React.FC = () => {
  const { examId, subjectName } = useParams<{ examId?: string; subjectName?: string }>();
  const { selectedChildId } = useSelectedChild();

  const { data: childrenData, isLoading: childrenLoading } = useParentChildren(0);
  const children = childrenData || EMPTY_CHILDREN;
  const selectedChild = children.find((c: any) => c.id === selectedChildId);

  if (childrenLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  if (!selectedChildId) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-10">
        <PageHeader
          title="Exam Results"
          breadcrumb={{
            links: [
              { label: 'Dashboard', href: '/parent/dashboard' },
              { label: 'Exam Results', active: true },
            ],
          }}
        />
        <EmptyState
          icon={GraduationCap}
          title="No Student Selected"
          description="Please select a child from the dashboard to view exam results."
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <PageHeader
        title="Exam Results"
        subtitle={`${selectedChild?.fullName || "Student"} • ${selectedChild?.className || ""}`}
        breadcrumb={{
          links: [
            { label: 'Dashboard', href: '/parent/dashboard' },
            { label: 'Exam Results', active: true },
          ],
        }}
      />

      {subjectName && examId ? (
        <ParentExamMarksDetail
          examId={parseInt(examId)}
          subjectName={decodeURIComponent(subjectName)}
        />
      ) : examId ? (
        <ParentExamSubjectGrid examId={parseInt(examId)} />
      ) : (
        <ParentExamList />
      )}
    </div>
  );
};

export default ParentExamResults;