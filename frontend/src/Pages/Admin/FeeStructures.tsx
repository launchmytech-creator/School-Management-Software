import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import { SkeletonTable } from '../../components/common/Skeleton';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useFeeStructuresPage } from '../../hooks/useFeeStructuresPage';
import { FeeStructureStats } from '../../components/fee/FeeStructureStats';
import { FeeStructureFormModal } from '../../components/fee/FeeStructureFormModal';
import { FeeGenerateModal } from '../../components/fee/FeeGenerateModal';
import { FeeStructureGroupCard } from '../../components/fee/FeeStructureGroupCard';
import { Plus, PlayCircle } from 'lucide-react';

const FeeStructures: React.FC = () => {
  const {
    groupedStructures,
    filteredGroups,
    classes,
    academicYears,
    loading,
    stats,
    selectedClass,
    setSelectedClass,
    selectedYear,
    setSelectedYear,
    searchTerm,
    setSearchTerm,
    expandedGroups,
    toggleGroup,
    showCreateModal,
    setShowCreateModal,
    editingStructure,
    formData,
    setFormData,
    errors,
    setErrors,
    saving,
    handleOpenCreate,
    handleOpenEdit,
    handleSave,
    deleteComponentDialog,
    setDeleteComponentDialog: setDeleteComponentDialogState,
    handleDeleteComponent,
    confirmDeleteComponent,
    deleteGroupDialog,
    setDeleteGroupDialog: setDeleteGroupDialogState,
    handleDeleteGroup,
    confirmDeleteGroup,
    showGenerateModal,
    setShowGenerateModal,
    generateData,
    setGenerateData,
    generating,
    generationResult,
    openGenerateModal,
    handleGenerateTransactions,
  } = useFeeStructuresPage();

  return (
    <AdminLayout title="Fee Structures">
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Fee Structures"
          subtitle="Manage fee structures for different classes"
          breadcrumb={{
            links: [
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Fee Structures", active: true },
            ],
          }}
          actions={[
            {
              label: "Add Component",
              icon: Plus,
              onClick: handleOpenCreate,
            },
            {
              label: "Generate Transactions",
              icon: PlayCircle,
              onClick: openGenerateModal,
              variant: "outline",
            },
          ]}
        />

        <FeeStructureStats {...stats} />

        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onReset={() => {
            setSearchTerm("");
            setSelectedClass("");
            setSelectedYear("");
          }}
          searchPlaceholder="Search by class or academic year..."
        >
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 min-w-40"
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} {cls.section ? `- ${cls.section}` : ""}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 min-w-40"
          >
            <option value="">All Years</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </FilterBar>

        {loading ? (
          <SkeletonTable columns={4} rows={5} />
        ) : filteredGroups.length > 0 ? (
          <div className="space-y-4">
            {filteredGroups.map((group) => {
              const groupKey = `${group.classId}-${group.academicYearId}`;
              return (
                <FeeStructureGroupCard
                  key={groupKey}
                  group={group}
                  isExpanded={expandedGroups.has(groupKey)}
                  onToggle={() => toggleGroup(groupKey)}
                  onEdit={(componentId: number) => handleOpenEdit(group, componentId)}
                  onDelete={handleDeleteComponent}
                  onDeleteGroup={() => handleDeleteGroup(group)}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500">
              {searchTerm || selectedClass || selectedYear
                ? "No fee structures match your filters"
                : "No fee structures found. Add fee components to get started."}
            </p>
          </div>
        )}

        <FeeStructureFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          editingStructure={editingStructure}
          formData={formData}
          onFormDataChange={setFormData}
          errors={errors}
          onErrorsChange={setErrors}
          onSave={handleSave}
          saving={saving}
          classes={classes}
          academicYears={academicYears}
          groupedStructures={groupedStructures}
        />

        <FeeGenerateModal
          isOpen={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
          generateData={generateData}
          onGenerateDataChange={setGenerateData}
          onGenerate={handleGenerateTransactions}
          generating={generating}
          generationResult={generationResult}
          classes={classes}
          academicYears={academicYears}
          groupedStructures={groupedStructures}
        />

        <ConfirmDialog
          isOpen={deleteComponentDialog.isOpen}
          onClose={() => setDeleteComponentDialogState({ isOpen: false, componentId: null, loading: false })}
          onConfirm={confirmDeleteComponent}
          title="Delete Fee Component"
          message="Are you sure you want to delete this fee component? This action cannot be undone."
          confirmText="Delete"
          variant="danger"
          loading={deleteComponentDialog.loading}
        />

        <ConfirmDialog
          isOpen={deleteGroupDialog.isOpen}
          onClose={() => setDeleteGroupDialogState({ isOpen: false, group: null, loading: false })}
          onConfirm={confirmDeleteGroup}
          title="Delete All Fee Components"
          message={deleteGroupDialog.group ? `Are you sure you want to delete ALL fee components for ${deleteGroupDialog.group.className} - ${deleteGroupDialog.group.academicYearName}? This will remove all ${deleteGroupDialog.group.components.length} components. This action cannot be undone.` : ""}
          confirmText="Delete All"
          variant="danger"
          loading={deleteGroupDialog.loading}
        />
      </div>
    </AdminLayout>
  );
};

export default FeeStructures;
