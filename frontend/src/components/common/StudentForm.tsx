import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import { 
  UserPlus, 
  GraduationCap, 
  Save,
  X,
  Edit2,
} from 'lucide-react';
import { ParentSection } from '../students/ParentSection';
import { studentService, type CreateStudentDto } from '../../services/studentService';
import { useNotification } from '../../context/NotificationContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { getLocalDateString } from '../../lib/utils';
import type { Parent, Gender, CreateParentDto } from '../../types/parent';
import { parentService } from '../../services/parentService';
import { feeService } from '../../services/feeService';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useClasses } from '../../hooks/queries/useClasses';
import { useParents } from '../../hooks/queries/useParents';
import { useStudentById } from '../../hooks/queries/useStudents';

interface StudentFormProps {
  layout?: 'admin' | 'accountant' | 'teacher';
  mode: 'create' | 'edit';
}

const studentFormSchema = z.object({
  admissionNumber: z.string(),
  fullName: z.string().min(1, 'Full name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  address: z.string().optional(),
  phone: z.string().optional(),
  admissionDate: z.string().min(1, 'Admission date is required'),
  currentClassId: z.string(),
  parentId: z.string(),
  rollNumber: z.string().optional(),
});

const ADMISSION_NUMBER_MIN = 10;
const ADMISSION_NUMBER_MAX = 100;
const generateAdmissionNumber = (): string => {
  const year = new Date().getFullYear();
  const timePart = Date.now().toString().slice(-6);
  const randomPart = Math.floor(Math.random() * (ADMISSION_NUMBER_MAX - ADMISSION_NUMBER_MIN + 1)) + ADMISSION_NUMBER_MIN;
  return `ADM-${year}-${timePart}-${randomPart}`;
};

interface NewParentFormData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
  address: string;
}

const defaultParentFormData: NewParentFormData = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  dateOfBirth: "",
  gender: "male",
  address: "",
};

const StudentForm: React.FC<StudentFormProps> = ({ layout, mode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();
  
  // Auto-detect layout from AuthContext if not provided
  const resolvedLayout = layout ?? (user?.role === 'teacher' ? 'teacher' 
    : user?.role === 'accountant' ? 'accountant' 
    : 'admin');
    
  const [loading, setLoading] = useState(false);
  const [fetchingStudent, setFetchingStudent] = useState(mode === 'edit');

  const [showNewParentForm, setShowNewParentForm] = useState(false);
  const [parentSearch, setParentSearch] = useState('');
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const [newParentData, setNewParentData] = useState<NewParentFormData>(defaultParentFormData);

  // Use React Query hooks for data fetching - provides caching and deduplication
  const { data: classesData, isLoading: loadingClasses } = useClasses(selectedYear?.id);
  const { data: parentsData, isLoading: _loadingParents } = useParents();
  const { data: studentData, isLoading: loadingStudent } = useStudentById(mode === 'edit' && id ? parseInt(id, 10) : 0);

  const classes = classesData || [];
  const parents = parentsData || [];

  const {
    register: registerStudent,
    handleSubmit: handleStudentSubmit,
    reset: resetStudent,
    setValue: setStudentValue,
  } = useForm<z.infer<typeof studentFormSchema>>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      admissionNumber: '',
      fullName: '',
      dateOfBirth: '',
      gender: 'male',
      address: '',
      phone: '',
      admissionDate: getLocalDateString(),
      currentClassId: '',
      parentId: '',
      rollNumber: '',
    },
  });

  const isAdmin = resolvedLayout === 'admin';
  const basePath = isAdmin ? '/admin' : '/accountant';

  const filteredParents = useMemo(() => {
    if (!parentSearch) return parents;
    const search = parentSearch.toLowerCase();
    return parents.filter(p => 
      p.fullName.toLowerCase().includes(search) ||
      p.email.toLowerCase().includes(search) ||
      (p.phone && p.phone.includes(search))
    );
  }, [parents, parentSearch]);

  // Populate student data when editing
  useEffect(() => {
    if (mode === 'edit' && studentData) {
      resetStudent({
        admissionNumber: studentData.admissionNumber || '',
        fullName: studentData.fullName || '',
        dateOfBirth: studentData.dateOfBirth || '',
        gender: (studentData.gender?.toLowerCase() || 'male') as 'male' | 'female' | 'other',
        address: studentData.address || '',
        phone: studentData.phone || '',
        admissionDate: studentData.admissionDate || getLocalDateString(),
        currentClassId: studentData.currentClassId?.toString() || '',
        parentId: studentData.parentId?.toString() || '',
        rollNumber: studentData.rollNumber || ''
      });
    }
    if (mode === 'edit' && !loadingStudent && id) {
      setFetchingStudent(false);
    }
  }, [mode, studentData, loadingStudent]);

  useEffect(() => {
    if (mode === 'create') {
      resetStudent({ admissionNumber: generateAdmissionNumber(), fullName: '', dateOfBirth: '', gender: 'male', address: '', phone: '', admissionDate: getLocalDateString(), currentClassId: '', parentId: '', rollNumber: '' });
    }
  }, [mode]);

  const handleParentSelect = useCallback((parentId: string) => {
    if (!parentId) {
      setSelectedParent(null);
      setStudentValue('parentId', '');
      return;
    }
    const parent = parents.find(p => p.id === parseInt(parentId, 10));
    setSelectedParent(parent || null);
    setStudentValue('parentId', parentId);
    setShowNewParentForm(false);
  }, [parents, setStudentValue]);

  const handleAddNewParent = useCallback(() => {
    setShowNewParentForm(true);
    setSelectedParent(null);
    setStudentValue('parentId', '');
  }, [setStudentValue]);

  const handleCancelNewParent = useCallback(() => {
    setShowNewParentForm(false);
    setNewParentData(defaultParentFormData);
  }, []);

  const handleNewParentChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewParentData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleClearSelectedParent = useCallback(() => {
    setSelectedParent(null);
    setStudentValue('parentId', '');
  }, [setStudentValue]);

  const onSubmitStudent = async (data: z.infer<typeof studentFormSchema>) => {
    setLoading(true);
    try {
      let finalParentId: number | undefined;

      if (showNewParentForm) {
        try {
          const parentPayload: CreateParentDto = {
            fullName: newParentData.fullName,
            email: newParentData.email,
            password: newParentData.password,
            phone: newParentData.phone || undefined,
            dateOfBirth: newParentData.dateOfBirth || undefined,
            gender: newParentData.gender,
            address: newParentData.address || undefined,
          };
          
          const newParent = await parentService.createParent(parentPayload);
          
          finalParentId = newParent.id;
          showNotification('New parent created successfully!', 'success');
        } catch (parentError: any) {
          showNotification(parentError.response?.data?.message || 'Failed to create parent. Email might already exist.', 'error');
          setLoading(false);
          return;
        }
      } else {
        finalParentId = data.parentId ? parseInt(data.parentId, 10) : undefined;
      }

      const studentPayload: CreateStudentDto = {
        admissionNumber: data.admissionNumber,
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth || undefined,
        gender: data.gender,
        address: data.address || undefined,
        phone: data.phone || undefined,
        admissionDate: data.admissionDate,
        currentClassId: data.currentClassId ? parseInt(data.currentClassId, 10) : undefined,
        parentId: finalParentId,
        rollNumber: data.rollNumber || undefined,
      };
      
      await studentService.createStudent(studentPayload);

      if (data.currentClassId && selectedYear?.id) {
        try {
          const result = await feeService.generateFeeTransactions({
            classId: parseInt(data.currentClassId, 10),
            academicYearId: Number(selectedYear.id),
          });
          
          if (result.generated > 0) {
            showNotification(
              `Student enrolled successfully! Fee transactions of ${result.totalAnnualFee} generated.`,
              'success'
            );
          } else {
            showNotification(
              'Student enrolled successfully, but no fee structure found for this class/year.',
              'warning'
            );
          }
        } catch {
          showNotification(
            'Student enrolled successfully, but fee generation failed. Please generate fees manually.',
            'error'
          );
        }
      } else {
        showNotification('Student enrolled successfully!', 'success');
      }
      
      navigate(`${basePath}/students`);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error;
      
      // Check for roll number duplicate error
      if (errorMessage?.toLowerCase().includes('roll number') || errorMessage?.toLowerCase().includes('rollnumber')) {
        showNotification('A student with this roll number already exists in this class', 'error');
      } else if (mode === 'create') {
        showNotification('Failed to enroll student. Please check all fields.', 'error');
      } else {
        showNotification('Failed to update student. Please check all fields.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
          <span>Students</span>
          <span className="text-slate-300">/</span>
          <span className="text-blue-500">{mode === 'create' ? 'Add New Student' : 'Edit Student'}</span>
        </div>
        <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">
          {mode === 'create' ? 'Add New Student' : 'Edit Student'}
        </h1>
        <p className="text-slate-400 font-bold text-sm tracking-tight mt-1">
          {mode === 'create' 
            ? 'Fill in the details below to enroll a new student into the system.'
            : 'Update the student information below.'}
        </p>
      </div>

      <form onSubmit={handleStudentSubmit(onSubmitStudent)} className="space-y-8">
        <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-50">
            <div className="bg-blue-50 p-2 rounded-xl">
              {mode === 'create' ? (
                <UserPlus className="text-blue-500 size-6" />
              ) : (
                <Edit2 className="text-blue-500 size-6" />
              )}
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Student Information</h2>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Admission Number</label>
                <input 
                  type="text" 
                  readOnly
                  disabled={mode === 'edit'}
                  placeholder="Auto-generated on load"
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300 disabled:opacity-50" 
                  {...registerStudent('admissionNumber')}
                />
                {mode === 'create' && (
                  <p className="text-[10px] text-slate-400">
                    Unique admission number auto-generated for this enrollment
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300" 
                  {...registerStudent('fullName')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Date of Birth</label>
                <input 
                  type="date" 
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                  {...registerStudent('dateOfBirth')}
                />
              </div>
              <div className="space-y-4 pt-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Gender</label>
                <div className="flex gap-8">
                  {(['male', 'female', 'other'] as const).map((g) => (
                    <label key={g} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        value={g}
                        className="size-5 border-2 border-slate-200 text-blue-500 focus:ring-blue-500/20 transition-all cursor-pointer" 
                        {...registerStudent('gender')}
                      />
                      <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{g}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-50">
            <div className="bg-sky-50 p-2 rounded-xl">
              <GraduationCap className="text-sky-500 size-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Academic Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Current Class</label>
              <select 
                className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all appearance-none cursor-pointer disabled:opacity-50"
                disabled={loadingClasses || fetchingStudent}
                {...registerStudent('currentClassId')}
              >
                <option value="">Select a Class</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section ? `- ${c.section}` : ''}
                  </option>
                ))}
              </select>
              {loadingClasses && <p className="text-[10px] text-blue-500 font-bold animate-pulse">Loading classes...</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Admission Date</label>
              <input 
                type="date" 
                className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all"
                {...registerStudent('admissionDate')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Roll Number</label>
              <input 
                type="text" 
                placeholder="e.g. 25" 
                className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all placeholder:text-slate-300"
                {...registerStudent('rollNumber')}
              />
            </div>
          </div>
        </div>

        <ParentSection
          parents={parents}
          filteredParents={filteredParents}
          selectedParent={selectedParent}
          newParentData={newParentData}
          showNewParentForm={showNewParentForm}
          showParentDropdown={showParentDropdown}
          parentSearch={parentSearch}
          fetchingData={loadingClasses}
          onSearchChange={setParentSearch}
          onParentSelect={handleParentSelect}
          onAddNewParent={handleAddNewParent}
          onCancelNewParent={handleCancelNewParent}
          onNewParentChange={handleNewParentChange}
          onClearSelectedParent={handleClearSelectedParent}
          onDropdownToggle={setShowParentDropdown}
          onDropdownClose={() => { setShowParentDropdown(false); setParentSearch(""); }}
        />

        <div className="flex items-center justify-end gap-4 pt-6">
          <button 
            type="button" 
            onClick={() => navigate(`${basePath}/students`)}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all active:scale-95"
          >
            <X className="size-5" />
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading || loadingClasses || fetchingStudent}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-10 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
          >
            {loading ? (
              <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Save className="size-5" />
            )}
            {loading ? 'Saving...' : (mode === 'create' ? 'Save Student' : 'Update Student')}
          </button>
        </div>
      </form>

      <p className="text-center mt-12 text-[10px] font-bold text-slate-400/80 tracking-tight">
        © {new Date().getFullYear()} EduManage SMS. All student data is processed in accordance with the school's privacy policy.
      </p>
    </div>
  );

  return renderContent();
};

export default StudentForm;
