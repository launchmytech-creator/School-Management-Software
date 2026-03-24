import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { useNotification } from '../../context/NotificationContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { promotionService, type Promotion, type PromotionGroup } from '../../services/promotionService';
import { classService } from '../../services/classService';
import { studentService } from '../../services/studentService';
import type { Student } from '../../types/student';
import type { Class } from '../../types/class';
import { 
  TrendingUp, 
  Check, 
  Users, 
  ArrowRight, 
  Calendar,
  Search,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  X,
  Sparkles,
  BookOpen,
  ArrowUp,
  UserCheck,
  Minimize2
} from 'lucide-react';
import { BaseModal } from '../../components/common/BaseModal';
import { Button } from '../../components/ui/button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const StudentPromotion: React.FC = () => {
  const { showNotification } = useNotification();
  const { allYears, selectedYear } = useAcademicYear();
  const [classes, setClasses] = useState<Class[]>([]);
  const [nextYearClasses, setNextYearClasses] = useState<Class[]>([]);
  const [fromClass, setFromClass] = useState<string>('');
  const [toClass, setToClass] = useState<string>('');
  const [toAcademicYear, setToAcademicYear] = useState<string>('');
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingNextYearClasses, setLoadingNextYearClasses] = useState(false);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('');
  const [filterFromClass, setFilterFromClass] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showAllStudents, setShowAllStudents] = useState<Record<string, boolean>>({});

  const getGradeLevel = (className: string): number => {
    const match = className.match(/Class\s*(\d+)/i);
    return match ? parseInt(match[1]) : 0;
  };

  const fromClassData = useMemo(() => 
    classes.find(c => c.id === fromClass), 
    [classes, fromClass]
  );

  const availableClassesForTo = useMemo(() => {
    return toAcademicYear ? nextYearClasses : classes;
  }, [toAcademicYear, nextYearClasses, classes]);

  const filteredToClasses = useMemo(() => {
    if (!fromClassData || availableClassesForTo.length === 0) return [];
    const fromGrade = getGradeLevel(fromClassData.name);
    return availableClassesForTo.filter(c => {
      const toGrade = getGradeLevel(c.name);
      return toGrade > fromGrade && c.id !== fromClass;
    });
  }, [fromClassData, availableClassesForTo, fromClass]);

  const nextYearOptions = useMemo(() => 
    allYears.filter(y => y.id !== selectedYear?.id),
    [allYears, selectedYear]
  );

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return classStudents;
    const query = searchQuery.toLowerCase();
    return classStudents.filter(s => 
      s.fullName.toLowerCase().includes(query) ||
      s.admissionNumber.toLowerCase().includes(query)
    );
  }, [classStudents, searchQuery]);

  const fetchClasses = useCallback(async () => {
    try {
      setLoadingClasses(true);
      const data = await classService.getClasses(selectedYear?.id);
      setClasses(data);
    } catch {
      showNotification('Failed to fetch classes', 'error');
    } finally {
      setLoadingClasses(false);
    }
  }, [selectedYear, showNotification]);

  const fetchNextYearClasses = useCallback(async () => {
    if (!toAcademicYear) {
      setNextYearClasses([]);
      return;
    }
    try {
      setLoadingNextYearClasses(true);
      const data = await classService.getClasses(toAcademicYear);
      setNextYearClasses(data);
    } catch {
      showNotification('Failed to fetch next year classes', 'error');
      setNextYearClasses([]);
    } finally {
      setLoadingNextYearClasses(false);
    }
  }, [toAcademicYear, showNotification]);

  const fetchPromotions = useCallback(async () => {
    try {
      setLoadingPromotions(true);
      const data = await promotionService.getPromotions({
        fromClassId: filterFromClass ? parseInt(filterFromClass) : undefined,
        academicYearId: filterAcademicYear ? parseInt(filterAcademicYear) : undefined,
      });
      setPromotions(data || []);
    } catch {
      showNotification('Failed to fetch promotions', 'error');
    } finally {
      setLoadingPromotions(false);
    }
  }, [filterAcademicYear, filterFromClass, showNotification]);

  const groupedPromotions = useMemo((): PromotionGroup[] => {
    const groups = new Map<string, PromotionGroup>();
    
    promotions.forEach(p => {
      const key = `${p.fromClassId}-${p.toClassId}-${p.fromAcademicYearId}-${p.promotedAt}`;
      
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          fromClassName: p.fromClassName,
          fromClassSection: p.fromClassSection,
          toClassName: p.toClassName,
          toClassSection: p.toClassSection,
          fromAcademicYear: p.fromAcademicYearName,
          toAcademicYear: p.toAcademicYearName,
          promotionDate: p.promotedAt,
          promotedByName: p.promotedByName,
          students: [],
        });
      }
      groups.get(key)!.students.push(p);
    });
    
    return Array.from(groups.values()).sort((a, b) => 
      new Date(b.promotionDate).getTime() - new Date(a.promotionDate).getTime()
    );
  }, [promotions]);

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleAllGroups = useCallback((expand: boolean) => {
    if (expand) {
      setExpandedGroups(new Set(groupedPromotions.map(g => g.key)));
    } else {
      setExpandedGroups(new Set());
    }
  }, [groupedPromotions]);

  const toggleShowAllStudents = useCallback((key: string) => {
    setShowAllStudents(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const fetchClassStudents = useCallback(async () => {
    if (!fromClass) {
      setClassStudents([]);
      return;
    }
    
    try {
      setLoadingStudents(true);
      const data = await studentService.getStudents({ classId: fromClass });
      setClassStudents(data);
      setSelectedStudents([]);
    } catch {
      showNotification('Failed to fetch students', 'error');
    } finally {
      setLoadingStudents(false);
    }
  }, [fromClass, showNotification]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchNextYearClasses();
  }, [fetchNextYearClasses]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions, filterFromClass]);

  useEffect(() => {
    if (fromClass) {
      fetchClassStudents();
    }
  }, [fromClass, fetchClassStudents]);

  useEffect(() => {
    if (showModal && fromClass && classStudents.length === 0) {
      fetchClassStudents();
    }
  }, [showModal, fromClass]);

  const handlePromote = async () => {
    if (selectedStudents.length === 0) {
      showNotification('Please select at least one student', 'error');
      return;
    }

    try {
      setPromoting(true);
      await promotionService.promoteStudents({
        studentIds: selectedStudents,
        toClassId: toClass,
        toAcademicYearId: toAcademicYear || selectedYear?.id || '',
      });
      showNotification(`${selectedStudents.length} students promoted successfully`, 'success');
      setShowModal(false);
      setSelectedStudents([]);
      setSearchQuery('');
      fetchPromotions();
      fetchClassStudents();
    } catch {
      showNotification('Failed to promote students', 'error');
    } finally {
      setPromoting(false);
    }
  };

  const handlePromoteAll = () => {
    setSelectedStudents(classStudents.map(s => s.id));
    setShowModal(true);
  };

  const toggleStudent = (studentId: number) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const resetFilters = () => {
    setFromClass('');
    setToClass('');
    setToAcademicYear('');
    setFilterAcademicYear('');
    setFilterFromClass('');
    setClassStudents([]);
    setSelectedStudents([]);
    setExpandedGroups(new Set());
    setShowAllStudents({});
  };

  return (
    <AdminLayout title="Student Promotion">
      <div className="space-y-8 pb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            <span>Dashboard</span>
            <span className="text-slate-300">/</span>
            <span>Academic</span>
            <span className="text-slate-300">/</span>
            <span className="text-blue-500">Student Promotion</span>
          </div>
          
          <select
            value={filterAcademicYear}
            onChange={(e) => setFilterAcademicYear(e.target.value)}
            className="text-sm font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 cursor-pointer focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Years</option>
            {allYears.map(year => (
              <option key={year.id} value={year.id.toString()}>
                {year.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 p-10 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Promote Students</h3>
              <p className="text-sm text-slate-500 mt-1">Select students to promote to the next grade</p>
            </div>
            {(fromClass || toClass) && (
              <button
                onClick={resetFilters}
                className="text-sm font-bold text-slate-500 hover:text-slate-700 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <BookOpen className="w-4 h-4 text-blue-500" />
                From Class
              </label>
              <div className="relative">
                <select
                  value={fromClass}
                  onChange={(e) => {
                    setFromClass(e.target.value);
                    setToClass('');
                  }}
                  disabled={loadingClasses}
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium text-slate-700 focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} - Section {cls.section || 'A'}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <ArrowUp className="w-4 h-4 text-emerald-500" />
                To Class
                {toAcademicYear && (
                  <span className="text-xs font-normal text-amber-600">(Next Year)</span>
                )}
              </label>
              <div className="relative">
                <select
                  value={toClass}
                  onChange={(e) => setToClass(e.target.value)}
                  disabled={!fromClass || loadingNextYearClasses}
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium text-slate-700 focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!fromClass ? 'Select From Class first' : loadingNextYearClasses ? 'Loading...' : filteredToClasses.length === 0 ? 'No higher classes available' : 'Select Class'}
                  </option>
                  {filteredToClasses.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} - Section {cls.section || 'A'}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <Calendar className="w-4 h-4 text-amber-500" />
                To Academic Year
              </label>
              <div className="relative">
                <select
                  value={toAcademicYear}
                  onChange={(e) => setToAcademicYear(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium text-slate-700 focus:outline-none focus:border-amber-500 transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Current Year</option>
                  {nextYearOptions.map(year => (
                    <option key={year.id} value={year.id.toString()}>{year.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-end gap-3">
              <Button
                onClick={() => setShowModal(true)}
                disabled={!fromClass || !toClass || loadingStudents}
                className="flex-1 h-14 rounded-2xl font-black text-sm shadow-lg shadow-blue-500/20"
              >
                <Users className="w-5 h-5 mr-2" />
                Select Students
              </Button>
              <Button
                onClick={handlePromoteAll}
                disabled={!fromClass || !toClass || classStudents.length === 0 || loadingStudents}
                variant="outline"
                className="h-14 px-5 rounded-2xl font-black text-sm border-2 border-amber-200 text-amber-600 hover:bg-amber-50"
              >
                <Sparkles className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {fromClass && toClass && (
            <div className={`mt-6 p-5 rounded-2xl border-2 ${
              classStudents.length > 0 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              {loadingStudents ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" message="Loading eligible students..." />
                </div>
              ) : classStudents.length > 0 ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-blue-900">
                        {classStudents.length} students eligible for promotion
                      </p>
                      <p className="text-sm text-blue-600">
                        From {classes.find(c => c.id === fromClass)?.name} to {classes.find(c => c.id === toClass)?.name}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handlePromoteAll}
                    className="bg-blue-500 hover:bg-blue-600 rounded-xl font-black"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Promote All
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-100 rounded-xl">
                    <Check className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-600">No eligible students</p>
                    <p className="text-sm text-slate-500">
                      All students from {classes.find(c => c.id === fromClass)?.name} have been promoted
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Promotion History</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {groupedPromotions.length > 0 
                    ? `${groupedPromotions.length} promotion${groupedPromotions.length > 1 ? 's' : ''} recorded • ${promotions.length} students total`
                    : 'No promotions yet'}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <select
                  value={filterFromClass}
                  onChange={(e) => setFilterFromClass(e.target.value)}
                  className="text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Classes</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id.toString()}>
                      {cls.name} - Section {cls.section || 'A'}
                    </option>
                  ))}
                </select>
                
                {groupedPromotions.length > 0 && (
                  <button
                    onClick={() => toggleAllGroups(expandedGroups.size < groupedPromotions.length)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    <Minimize2 className="w-4 h-4" />
                    {expandedGroups.size < groupedPromotions.length ? 'Expand All' : 'Collapse All'}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {loadingPromotions ? (
            <div className="p-12 flex items-center justify-center">
              <LoadingSpinner size="lg" message="Loading promotions..." />
            </div>
          ) : groupedPromotions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {groupedPromotions.map((group) => {
                const isExpanded = expandedGroups.has(group.key);
                const showAll = showAllStudents[group.key] || false;
                const displayedStudents = showAll ? group.students : group.students.slice(0, 3);
                const hasMoreStudents = group.students.length > 3;
                
                return (
                  <div key={group.key}>
                    <div 
                      className={`p-6 cursor-pointer transition-colors ${
                        isExpanded ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => toggleGroup(group.key)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            isExpanded ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="inline-flex px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg">
                              {group.fromClassName} {group.fromClassSection && `- Section ${group.fromClassSection}`}
                            </span>
                            <ArrowRight className="w-5 h-5 text-emerald-500" />
                            <span className="inline-flex px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-lg">
                              {group.toClassName} {group.toClassSection && `- Section ${group.toClassSection}`}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="font-bold text-slate-600">{group.students.length} student{group.students.length > 1 ? 's' : ''}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-slate-500">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">
                              {new Date(group.promotionDate).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-slate-500">
                            <UserCheck className="w-4 h-4" />
                            <span className="font-medium">{group.promotedByName || 'System'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2 ml-14 flex items-center gap-4 text-xs text-slate-500">
                        <span>{group.fromAcademicYear}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="font-medium text-emerald-600">{group.toAcademicYear}</span>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="bg-slate-25 border-t border-slate-100">
                        <div className="p-4 pl-14 space-y-2">
                          {displayedStudents.map((student, idx) => (
                            <div 
                              key={student.id} 
                              className={`flex items-center gap-4 p-3 rounded-xl ${
                                idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                              }`}
                            >
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-black text-sm">
                                {student.studentName?.charAt(0) || '?'}
                              </span>
                              <div className="flex-1">
                                <p className="font-bold text-slate-900">{student.studentName}</p>
                                <p className="text-xs text-slate-500">{student.admissionNumber}</p>
                              </div>
                              {student.rollNumber && (
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                                  Roll: {student.rollNumber}
                                </span>
                              )}
                            </div>
                          ))}
                          
                          {hasMoreStudents && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleShowAllStudents(group.key);
                              }}
                              className="flex items-center gap-2 w-full p-3 text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors"
                            >
                              {showAll ? (
                                <>
                                  <ChevronRight className="w-4 h-4" />
                                  Show less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  Show {group.students.length - 3} more student{group.students.length - 3 > 1 ? 's' : ''}
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">No Promotions Found</h3>
              <p className="text-slate-500">Student promotions will appear here once they are completed</p>
            </div>
          )}
        </div>

        <BaseModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSearchQuery('');
          }}
          title={`Select Students from ${classes.find(c => c.id === fromClass)?.name || 'Class'}`}
          size="lg"
        >
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl">
              <ArrowRight className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-700">
                Promoting to: <strong>{classes.find(c => c.id === toClass)?.name || 'Class'}</strong>
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or admission number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
              <p className="text-sm font-bold text-blue-700">
                {selectedStudents.length} of {filteredStudents.length} selected
              </p>
              <button
                onClick={toggleAll}
                className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                {selectedStudents.length === filteredStudents.length ? (
                  <>
                    <Square className="w-4 h-4" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    Select All
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {loadingStudents ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="md" message="Loading students..." />
                </div>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <label
                    key={student.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${
                      selectedStudents.includes(student.id)
                        ? 'bg-blue-50 border-2 border-blue-300'
                        : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                      selectedStudents.includes(student.id)
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-200'
                    }`}>
                      {selectedStudents.includes(student.id) && (
                        <Check className="w-4 h-4" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                      className="sr-only"
                    />
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-black text-sm">
                      {student.fullName?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{student.fullName}</p>
                      <p className="text-sm text-slate-500">{student.admissionNumber}</p>
                    </div>
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">
                      {student.className}
                    </span>
                  </label>
                ))
              ) : searchQuery ? (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No students match your search</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Check className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">All students have been promoted</p>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setSearchQuery('');
                }}
                className="flex-1 h-14 rounded-2xl font-black text-sm border-2 border-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePromote}
                loading={promoting}
                disabled={selectedStudents.length === 0}
                className="flex-1 h-14 rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600"
              >
                <Check className="w-5 h-5 mr-2" />
                Promote {selectedStudents.length} Students
              </Button>
            </div>
          </div>
        </BaseModal>
      </div>
    </AdminLayout>
  );
};

export default StudentPromotion;
