import React, { useState, useEffect, useCallback } from "react";
import AccountantLayout from "../../layouts/AccountantLayout";
import FilterBar from "../../components/common/FilterBar";
import EmptyState from "../../components/common/EmptyState";
import { useNotification } from "../../context/NotificationContext";
import {
  feeStructureService,
  type FeeStructureGroup,
} from "../../services/feeStructureService";
import { classService } from "../../services/classService";
import { academicYearService } from "../../services/academicYearService";
import type { Class } from "../../types/class";
import type { AcademicYear } from "../../types/academicYear";
import {
  Receipt,
  DollarSign,
  Info,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { formatCurrency } from "../../lib/utils";
import { SkeletonTable } from "../../components/common/Skeleton";

const AccountantFeeStructures: React.FC = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [groupedStructures, setGroupedStructures] = useState<
    FeeStructureGroup[]
  >([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const getFeeTermsLabel = (feeTerms: number): string => {
    switch (feeTerms) {
      case 1:
        return "Yearly";
      case 2:
        return "Half-yearly";
      case 4:
        return "Quarterly";
      case 12:
        return "Monthly";
      default:
        return `${feeTerms} terms`;
    }
  };

  const fetchClasses = useCallback(async () => {
    try {
      const data = await classService.getClasses();
      setClasses(data);
    } catch {
      showNotification("Failed to fetch classes", "error");
    }
  }, [showNotification]);

  const fetchAcademicYears = useCallback(async () => {
    try {
      const data = await academicYearService.getAllYears();
      setAcademicYears(data);
    } catch {
      showNotification("Failed to fetch academic years", "error");
    }
  }, [showNotification]);

  const fetchFeeStructuresGrouped = useCallback(async () => {
    try {
      setLoading(true);
      const filters: {
        classId?: number;
        academicYearId?: number;
      } = {};

      if (selectedClass) filters.classId = parseInt(selectedClass);
      if (selectedYear) filters.academicYearId = parseInt(selectedYear);

      const data = await feeStructureService.getFeeStructuresGrouped(filters);
      setGroupedStructures(data);
      setExpandedGroups(
        new Set(data.map((g) => `${g.classId}-${g.academicYearId}`)),
      );
    } catch {
      showNotification("Failed to fetch fee structures", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedYear, showNotification]);

  useEffect(() => {
    fetchClasses();
    fetchAcademicYears();
  }, [fetchClasses, fetchAcademicYears]);

  useEffect(() => {
    fetchFeeStructuresGrouped();
  }, [fetchFeeStructuresGrouped]);

  const filteredGroups = groupedStructures.filter(
    (g) =>
      g.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.academicYearName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalAnnualRevenue = groupedStructures.reduce(
    (sum, g) => sum + g.totalAnnualFee,
    0,
  );
  const totalClasses = groupedStructures.length;

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

  const getGroupKey = (group: FeeStructureGroup) =>
    `${group.classId}-${group.academicYearId}`;

  return (
    <AccountantLayout title="Fee Structures" subtitle="View fee structures for different classes">
      <div className="space-y-6 pb-12">
        {/* <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">View Only</p>
            <p className="text-sm text-blue-700 mt-1">
              You can view fee structures here. Contact your school administrator to create or modify fee structures.
            </p>
          </div>
        </div> */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {totalClasses}
                </p>
                <p className="text-sm text-slate-500">Classes with Fees</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Receipt className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-700">
                  {formatCurrency(totalAnnualRevenue)}
                </p>
                <p className="text-sm text-emerald-600">Total Annual Fee</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl border border-purple-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-700">
                  {formatCurrency(totalAnnualRevenue / (totalClasses || 1))}
                </p>
                <p className="text-sm text-purple-600">Avg Per Class</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

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
              const groupKey = getGroupKey(group);
              const isExpanded = expandedGroups.has(groupKey);

              return (
                <div
                  key={groupKey}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                >
                  <div
                    className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleGroup(groupKey)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          {group.className}{" "}
                          {group.classSection
                            ? `- Section ${group.classSection}`
                            : ""}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {group.academicYearName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-600">
                          {getFeeTermsLabel(group.feeTerms)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {group.components.length} components
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-600">
                          {formatCurrency(group.perTermAmount)}
                        </p>
                        <p className="text-xs text-slate-500">per term</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-purple-600">
                          {formatCurrency(group.totalAnnualFee)}
                        </p>
                        <p className="text-xs text-slate-500">annual</p>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-200">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Fee Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Annual Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Per Term
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {group.components.map((component) => (
                            <tr
                              key={component.id}
                              className="hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <span className="text-sm font-medium text-slate-900">
                                  {component.feeType}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-semibold text-slate-700">
                                  {formatCurrency(component.annualAmount)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-slate-600">
                                  {formatCurrency(
                                    component.annualAmount / group.feeTerms,
                                  )}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Receipt}
            title="No fee structures found"
            description={
              searchTerm || selectedClass || selectedYear
                ? "Try adjusting your filters"
                : "No fee structures have been created yet"
            }
          />
        )}
      </div>
    </AccountantLayout>
  );
};

export default AccountantFeeStructures;
