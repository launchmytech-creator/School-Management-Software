import React from 'react';

import { useStudentPromotionPage } from '../../hooks/useStudentPromotionPage';
import { PromotionForm, PromotionHistory, StudentSelectionModal } from '../../components/promotion';
import { Minimize2 } from 'lucide-react';

const StudentPromotion: React.FC = () => {
  const {
    classes,
    classStudents,
    groupedPromotions,
    loadingPromotions,
    fromClass,
    setFromClass,
    toClass,
    setToClass,
    toAcademicYear,
    setToAcademicYear,
    selectedStudents,
    filterFromClass,
    setFilterFromClass,
    searchQuery,
    setSearchQuery,
    showModal,
    setShowModal,
    expandedGroups,
    showAllStudents,
    filteredStudents,
    nextYearOptions,
    filteredToClasses,
    loadingClasses,
    loadingNextYearClasses,
    loadingStudents,
    promoting,
    toggleGroup,
    toggleAllGroups,
    toggleShowAllStudents,
    toggleStudent,
    toggleAll,
    handlePromote,
    resetFilters,
  } = useStudentPromotionPage();

  return (
    <div className="space-y-6 pb-12">
        <div className="bg-white rounded-[2rem] border border-slate-100 p-10 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Student Promotions
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Manage student grade promotions and academic year transitions
              </p>
            </div>
          </div>

          <PromotionForm
            classes={classes}
            nextYearOptions={nextYearOptions}
            filteredToClasses={filteredToClasses}
            fromClass={fromClass}
            onFromClassChange={setFromClass}
            toClass={toClass}
            onToClassChange={setToClass}
            toAcademicYear={toAcademicYear}
            onToAcademicYearChange={setToAcademicYear}
            classStudents={classStudents}
            loadingClasses={loadingClasses}
            loadingNextYearClasses={loadingNextYearClasses}
            loadingStudents={loadingStudents}
            onOpenModal={() => setShowModal(true)}
            onReset={resetFilters}
          />
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Promotion History
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {groupedPromotions.length > 0
                    ? `${groupedPromotions.length} promotion${groupedPromotions.length > 1 ? "s" : ""} recorded • ${groupedPromotions.reduce((sum, g) => sum + g.students.length, 0)} students total`
                    : "No promotions yet"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={filterFromClass}
                  onChange={(e) => setFilterFromClass(e.target.value)}
                  className="text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id.toString()}>
                      {cls.name} - Section {cls.section || "A"}
                    </option>
                  ))}
                </select>

                {groupedPromotions.length > 0 && (
                  <button
                    onClick={() =>
                      toggleAllGroups(
                        expandedGroups.size < groupedPromotions.length,
                      )
                    }
                    className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    <Minimize2 className="w-4 h-4" />
                    {expandedGroups.size < groupedPromotions.length
                      ? "Expand All"
                      : "Collapse All"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <PromotionHistory
            promotions={groupedPromotions}
            expandedGroups={expandedGroups}
            showAllStudents={showAllStudents}
            loadingPromotions={loadingPromotions}
            onToggleGroup={toggleGroup}
            onToggleAllGroups={toggleAllGroups}
            onToggleShowAllStudents={toggleShowAllStudents}
          />
        </div>

        <StudentSelectionModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSearchQuery("");
          }}
          selectedStudents={selectedStudents}
          filteredStudents={filteredStudents}
          loadingStudents={loadingStudents}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleStudent={toggleStudent}
          onToggleAll={toggleAll}
          onConfirm={handlePromote}
          confirming={promoting}
          classes={classes}
          fromClass={fromClass}
          toClass={toClass}
        />
      </div>
  );
};

export default StudentPromotion;
