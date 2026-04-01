import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import AccountantLayout from '../../layouts/AccountantLayout';
import { 
  UserPlus, 
  GraduationCap, 
  Users, 
  Save,
  X,
  Edit2
} from 'lucide-react';
import { studentService, type CreateStudentDto, type UpdateStudentDto } from '../../services/studentService';
import { feeService } from '../../services/feeService';
import { classService } from '../../services/classService';
import { parentService } from '../../services/parentService';
import { useNotification } from '../../context/NotificationContext';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { getLocalDateString } from '../../lib/utils';
import type { Class } from '../../types/class';
import type { Parent } from '../../types/parent';

interface StudentFormProps {
  layout: 'admin' | 'accountant';
  mode: 'create' | 'edit';
}

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

  const [formData, setFormData] = useState({
    admissionNumber: '',
    fullName: '',
    dateOfBirth: '',
    gender: 'male',
    address: '',
    phone: '',
    admissionDate: getLocalDateString(),
    currentClassId: '',
    parentId: '',
    rollNumber: ''
  });

  const isAdmin = layout === 'admin';
  const basePath = isAdmin ? '/admin' : '/accountant';

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
    if (mode === 'edit' && id) {
      const fetchStudent = async () => {
        try {
          const data = await studentService.getStudentById(parseInt(id));
          setFormData({
            admissionNumber: data.admissionNumber || '',
            fullName: data.fullName || '',
            dateOfBirth: data.dateOfBirth || '',
            gender: data.gender?.toLowerCase() || 'male',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'create') {
        const studentPayload: CreateStudentDto = {
          admissionNumber: formData.admissionNumber,
          fullName: formData.fullName,
          dateOfBirth: formData.dateOfBirth || undefined,
          gender: formData.gender.toLowerCase(),
          address: formData.address || undefined,
          phone: formData.phone || undefined,
          admissionDate: formData.admissionDate,
          currentClassId: formData.currentClassId ? parseInt(formData.currentClassId) : undefined,
          parentId: formData.parentId ? parseInt(formData.parentId) : undefined,
          rollNumber: formData.rollNumber || undefined,
        };
        
        await studentService.createStudent(studentPayload);

        if (isAdmin && formData.currentClassId && selectedYear?.id) {
          try {
            const result = await feeService.generateFeeTransactions({
              classId: parseInt(formData.currentClassId),
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
      } else {
        const updatePayload: UpdateStudentDto = {
          fullName: formData.fullName,
          dateOfBirth: formData.dateOfBirth || undefined,
          gender: formData.gender.toLowerCase() || undefined,
          address: formData.address || undefined,
          phone: formData.phone || undefined,
          currentClassId: formData.currentClassId ? parseInt(formData.currentClassId) : undefined,
          parentId: formData.parentId ? parseInt(formData.parentId) : undefined,
          rollNumber: formData.rollNumber || undefined,
        };
        
        await studentService.updateStudent(parseInt(id!), updatePayload);
        showNotification('Student updated successfully!', 'success');
        navigate(`${basePath}/students/${id}`);
      }
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

      <form onSubmit={handleSubmit} className="space-y-8">
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
                  name="admissionNumber" 
                  required 
                  value={formData.admissionNumber} 
                  onChange={handleChange}
                  disabled={mode === 'edit'}
                  placeholder="e.g. STU2024001"
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 disabled:opacity-50" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                <input 
                  type="text" 
                  name="fullName" 
                  required 
                  value={formData.fullName} 
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Date of Birth</label>
                <input 
                  type="date" 
                  name="dateOfBirth" 
                  required 
                  value={formData.dateOfBirth} 
                  onChange={handleChange}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" 
                />
              </div>
              <div className="space-y-4 pt-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Gender</label>
                <div className="flex gap-8">
                  {['Male', 'Female', 'Other'].map((g) => (
                    <label key={g} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="gender" 
                        value={g.toLowerCase()} 
                        checked={formData.gender === g.toLowerCase()} 
                        onChange={handleChange}
                        className="size-5 border-2 border-slate-200 text-blue-500 focus:ring-blue-500/20 transition-all cursor-pointer" 
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
                name="currentClassId" 
                required 
                value={formData.currentClassId} 
                onChange={handleChange}
                className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all appearance-none cursor-pointer disabled:opacity-50"
                disabled={fetchingData || fetchingStudent}
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
                name="admissionDate" 
                required 
                value={formData.admissionDate} 
                onChange={handleChange}
                className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Roll Number</label>
              <input 
                type="text" 
                name="rollNumber" 
                placeholder="e.g. 25" 
                value={formData.rollNumber} 
                onChange={handleChange}
                className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all placeholder:text-slate-300"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-50">
            <div className="bg-emerald-50 p-2 rounded-xl">
              <Users className="text-emerald-500 size-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Parent / Guardian Details</h2>
          </div>

          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Parent / Guardian</label>
                <select 
                  name="parentId" 
                  required 
                  value={formData.parentId} 
                  onChange={handleChange}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all appearance-none cursor-pointer disabled:opacity-50"
                  disabled={fetchingData || fetchingStudent}
                >
                  <option value="">Select Parent</option>
                  {parents.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.email})
                    </option>
                  ))}
                </select>
                {fetchingData && <p className="text-[10px] text-emerald-500 font-bold animate-pulse">Loading parents...</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Phone Number</label>
                <input 
                  type="tel" 
                  name="phone" 
                  placeholder="+1234567890" 
                  value={formData.phone} 
                  onChange={handleChange}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Address</label>
              <textarea 
                name="address" 
                rows={4} 
                placeholder="e.g. 123 Main Street, City" 
                value={formData.address} 
                onChange={handleChange}
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-300 resize-none"
              />
            </div>
          </div>
        </div>

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

  if (isAdmin) {
    return <AdminLayout title={mode === 'create' ? 'Add New Student' : 'Edit Student'}>{renderContent()}</AdminLayout>;
  }

  return <AccountantLayout title={mode === 'create' ? 'Add New Student' : 'Edit Student'}>{renderContent()}</AccountantLayout>;
};

export default StudentForm;
