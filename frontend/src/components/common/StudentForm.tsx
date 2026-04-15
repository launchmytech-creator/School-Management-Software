import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { 
  UserPlus, 
  GraduationCap, 
  Save,
  X,
  Edit2,
} from 'lucide-react';
import { ParentSection } from '../students/ParentSection';
import { studentService, type CreateStudentDto } from '../../services/studentService';
import { feeService } from '../../services/feeService';
import { classService } from '../../services/classService';
import { parentService } from '../../services/parentService';
import { useNotification } from '../../context/NotificationContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { getLocalDateString } from '../../lib/utils';
import type { Class } from '../../types/class';
import type { Parent } from '../../types/parent';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface StudentFormProps {
  layout: 'admin' | 'accountant';
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

const generateAdmissionNumber = () => {
  const year = new Date().getFullYear();
  const timePart = Date.now().toString().slice(-6);
  const randomPart = Math.floor(Math.random() * 90 + 10);
  return `ADM-${year}-${timePart}-${randomPart}`;
};

const StudentForm: React.FC<StudentFormProps> = ({ layout, mode }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showNotification } = useNotification();
  const { selectedYear } = useAcademicYear();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [fetchingStudent, setFetchingStudent] = useState(mode === 'edit');

  const [classes, setClasses] = useState<Class[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);

  const [showNewParentForm, setShowNewParentForm] = useState(false);
  const [parentSearch, setParentSearch] = useState('');
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const [newParentData, setNewParentData] = useState<{
    fullName: string;
    email: string;
    password: string;
    phone: string;
    dateOfBirth: string;
    gender: "male" | "female" | "other";
    address: string;
  }>({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    dateOfBirth: "",
    gender: "male",
    address: "",
  });

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

  const isAdmin = layout === 'admin';
  const basePath = isAdmin ? '/admin' : '/accountant';

  // Filter parents based on search
  const filteredParents = useMemo(() => {
    if (!parentSearch) return parents;
    const search = parentSearch.toLowerCase();
    return parents.filter(p => 
      p.fullName.toLowerCase().includes(search) ||
      p.email.toLowerCase().includes(search) ||
      (p.phone && p.phone.includes(search))
    );
  }, [parents, parentSearch]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesData, parentsData] = await Promise.all([
          classService.getClasses(selectedYear?.id),
          parentService.getParents()
        ]);
        setClasses(classesData);
        setParents(parentsData);
      } catch {
        showNotification('Failed to load classes or parents.', 'error');
      } finally {
        setFetchingData(false);
      }
    };
    fetchData();
  }, [selectedYear, showNotification]);

  useEffect(() => {
    if (mode === 'create') {
      resetStudent({ admissionNumber: generateAdmissionNumber(), fullName: '', dateOfBirth: '', gender: 'male', address: '', phone: '', admissionDate: getLocalDateString(), currentClassId: '', parentId: '', rollNumber: '' });
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'edit' && id) {
      const fetchStudent = async () => {
        try {
          const data = await studentService.getStudentById(parseInt(id));
          resetStudent({
            admissionNumber: data.admissionNumber || '',
            fullName: data.fullName || '',
            dateOfBirth: data.dateOfBirth || '',
            gender: (data.gender?.toLowerCase() || 'male') as 'male' | 'female' | 'other',
            address: data.address || '',
            phone: data.phone || '',
            admissionDate: data.admissionDate || getLocalDateString(),
            currentClassId: data.currentClassId?.toString() || '',
            parentId: data.parentId?.toString() || '',
            rollNumber: data.rollNumber || ''
          });
        } catch {
          showNotification('Failed to load student data.', 'error');
          navigate(`${basePath}/students`);
        } finally {
          setFetchingStudent(false);
        }
      };
      fetchStudent();
    }
  }, [mode, id, basePath, navigate]);

  const handleParentSelect = (parentId: string) => {
    if (!parentId) {
      setSelectedParent(null);
      setStudentValue('parentId', '');
      return;
    }
    const parent = parents.find(p => p.id === parseInt(parentId));
    setSelectedParent(parent || null);
    setStudentValue('parentId', parentId);
    setShowNewParentForm(false);
  };

  const handleAddNewParent = () => {
    setShowNewParentForm(true);
    setSelectedParent(null);
    setStudentValue('parentId', '');
  };

  const handleCancelNewParent = () => {
    setShowNewParentForm(false);
    setNewParentData({
      fullName: '',
      email: '',
      password: '',
      phone: '',
      dateOfBirth: '',
      gender: 'male',
      address: ''
    });
  };

  const handleNewParentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewParentData(prev => ({ ...prev, [name]: value }));
  };

  const handleClearSelectedParent = () => {
    setSelectedParent(null);
    setStudentValue('parentId', '');
  };

  const onSubmitStudent = async (data: z.infer<typeof studentFormSchema>) => {
    setLoading(true);
    try {
      let finalParentId: number | undefined;

      if (showNewParentForm) {
        try {
          const newParent = await parentService.createParent({
            fullName: newParentData.fullName,
            email: newParentData.email,
            password: newParentData.password,
            phone: newParentData.phone || undefined,
            dateOfBirth: newParentData.dateOfBirth || undefined,
            gender: newParentData.gender as any || undefined,
            address: newParentData.address || undefined,
          } as any);
          
          finalParentId = newParent.id;
          showNotification('New parent created successfully!', 'success');
        } catch (parentError: any) {
          showNotification(parentError.response?.data?.message || 'Failed to create parent. Email might already exist.', 'error');
          setLoading(false);
          return;
        }
      } else {
        finalParentId = data.parentId ? parseInt(data.parentId) : undefined;
      }

      const studentPayload: CreateStudentDto = {
        admissionNumber: data.admissionNumber,
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth || undefined,
        gender: data.gender,
        address: data.address || undefined,
        phone: data.phone || undefined,
        admissionDate: data.admissionDate,
        currentClassId: data.currentClassId ? parseInt(data.currentClassId) : undefined,
        parentId: finalParentId,
        rollNumber: data.rollNumber || undefined,
      };
      
      await studentService.createStudent(studentPayload);

      if (data.currentClassId && selectedYear?.id) {
        try {
          const result = await feeService.generateFeeTransactions({
            classId: parseInt(data.currentClassId),
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
    } catch {
      if (mode === 'create') {
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
                disabled={fetchingData || fetchingStudent}
                {...registerStudent('currentClassId')}
              >
                <option value="">Select a Class</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section ? `- ${c.section}` : ''}
                  </option>
                ))}
              </select>
              {fetchingData && <p className="text-[10px] text-blue-500 font-bold animate-pulse">Loading classes...</p>}
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
          fetchingData={fetchingData}
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
            disabled={loading || fetchingData || fetchingStudent}
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
