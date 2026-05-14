import React from 'react';
import { FeeStructureGroupCard } from './FeeStructureGroupCard';
import EmptyState from '../common/EmptyState';
import { SkeletonTable } from '../common/Skeleton';
import type { FeeStructureGroup } from '../../services/feeStructureService';
import { Receipt } from 'lucide-react';

interface FeeStructureGroupsTableProps {
  groups: FeeStructureGroup[];
  expandedGroups: Set<string>;
  onToggleGroup: (key: string) => void;
  loading?: boolean;
  searchPlaceholder?: string;
  onEdit?: (componentId: number) => void;
  onDelete?: (componentId: number) => void;
  onDeleteGroup?: () => void;
}

const FeeStructureGroupsTable: React.FC<FeeStructureGroupsTableProps> = ({
  groups,
  expandedGroups,
  onToggleGroup,
  loading = false,
  searchPlaceholder = "No fee structures found",
  onEdit,
  onDelete,
  onDeleteGroup,
}) => {
  if (loading) {
    return <SkeletonTable columns={4} rows={5} />;
  }

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No fee structures found"
        description={searchPlaceholder}
      />
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const groupKey = `${group.classId}-${group.academicYearId}`;
        return (
          <FeeStructureGroupCard
            key={groupKey}
            group={group}
            isExpanded={expandedGroups.has(groupKey)}
            onToggle={() => onToggleGroup(groupKey)}
            onEdit={onEdit ?? (() => {})}
            onDelete={onDelete ?? (() => {})}
            onDeleteGroup={onDeleteGroup ?? (() => {})}
          />
        );
      })}
    </div>
  );
};

export { FeeStructureGroupsTable };
