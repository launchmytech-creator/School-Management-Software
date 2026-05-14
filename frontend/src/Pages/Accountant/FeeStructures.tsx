import React, { useState, useEffect, useMemo } from "react";
import FilterBar from "../../components/common/FilterBar";
import { FeeStructureStats } from "../../components/fee/FeeStructureStats";
import { FeeStructureGroupsTable } from "../../components/fee/FeeStructureGroupsTable";
import type { FeeStructureGroup } from "../../services/feeStructureService";
import { useClasses, useFeeStructuresGrouped } from "../../hooks/queries";
import { useAcademicYear } from "../../context/AcademicYearContext";

const EMPTY_STRUCTURES: FeeStructureGroup[] = [];

const AccountantFeeStructures: React.FC = () => {
  const { data: classesData } = useClasses();
  const classes = classesData || [];
  const { selectedYear } = useAcademicYear();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const { data: groupedStructuresData, isLoading: loading } = useFeeStructuresGrouped({
    classId: selectedClass ? parseInt(selectedClass) : undefined,
    academicYearId: selectedYear?.id ? Number(selectedYear.id) : undefined,
  });
  const groupedStructures = groupedStructuresData || EMPTY_STRUCTURES;

  useEffect(() => {
    if (groupedStructuresData) {
      setExpandedGroups(
        new Set(groupedStructuresData.map((g) => `${g.classId}-${g.academicYearId}`)),
      );
    }
  }, [groupedStructuresData]);



  const filteredGroups = groupedStructures.filter(
    (g) =>
      g.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.academicYearName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const stats = useMemo(() => {
    const totalAnnualRevenue = groupedStructures.reduce(
      (sum, g) => sum + g.totalAnnualFee,
      0,
    );
    return {
      totalClasses: groupedStructures.length,
      totalAnnualRevenue,
      avgPerClass: totalAnnualRevenue / (groupedStructures.length || 1),
    };
  }, [groupedStructures]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
      <div className="space-y-6 pb-12">
        <FeeStructureStats {...stats} />

        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onReset={() => {
            setSearchTerm("");
            setSelectedClass("");
          }}
          searchPlaceholder="Search by class..."
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
        </FilterBar>

        <FeeStructureGroupsTable
          groups={filteredGroups}
          expandedGroups={expandedGroups}
          onToggleGroup={toggleGroup}
          loading={loading}
          searchPlaceholder="Try adjusting your filters"
        />
      </div>
  );
};

export default AccountantFeeStructures;
