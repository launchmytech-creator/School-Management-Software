import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { 
  UserPlus, 
  GraduationCap, 
  Users, 
  Save,
  X,
  Edit2,
  Search,
  Plus,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Shield,
  ChevronDown,
  Check
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

  // Parent mode state
  const [showNewParentForm, setShowNewParentForm] = useState(false);
  const [parentSearch, setParentSearch] = useState('');
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const [newParentData, setNewParentData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
    address: ''
  });

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
    if (mode === 'create' && !formData.admissionNumber) {
      setFormData(prev => ({
        ...prev,
        admissionNumber: generateAdmissionNumber()
      }));
    }
  }, [mode]);

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

  const handleParentSelect = (parentId: string) => {
    if (!parentId) {
      setSelectedParent(null);
      setFormData(prev => ({ ...prev, parentId: '' }));
      return;
    }
    const parent = parents.find(p => p.id === parseInt(parentId));
    setSelectedParent(parent || null);
    setFormData(prev => ({ ...prev, parentId }));
    setShowNewParentForm(false);
  };

  const handleAddNewParent = () => {
    setShowNewParentForm(true);
    setSelectedParent(null);
    setFormData(prev => ({ ...prev, parentId: '' }));
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
    setFormData(prev => ({ ...prev, parentId: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalParentId: number | undefined;

      if (showNewParentForm) {
        if (!newParentData.fullName || !newParentData.email || !newParentData.password) {
          showNotification('Please fill all required fields for new parent (Full Name, Email, Password).', 'error');
          setLoading(false);
          return;
        }
        
        try {
          const newParent = await parentService.createParent({
            fullName: newParentData.fullName,
            email: newParentData.email,
            password: newParentData.password,
            phone: newParentData.phone || undefined,
            dateOfBirth: newParentData.dateOfBirth || undefined,
            gender: newParentData.gender || undefined,
            address: newParentData.address || undefined,
          });
          
          finalParentId = newParent.id;
          showNotification('New parent created successfully!', 'success');
        } catch (parentError: any) {
          showNotification(parentError.response?.data?.message || 'Failed to create parent. Email might already exist.', 'error');
          setLoading(false);
          return;
        }
      } else {
        finalParentId = formData.parentId ? parseInt(formData.parentId) : undefined;
      }

      const studentPayload: CreateStudentDto = {
        admissionNumber: formData.admissionNumber,
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender.toLowerCase(),
        address: formData.address || undefined,
        phone: formData.phone || undefined,
        admissionDate: formData.admissionDate,
        currentClassId: formData.currentClassId ? parseInt(formData.currentClassId) : undefined,
        parentId: finalParentId,
        rollNumber: formData.rollNumber || undefined,
      };
      
      await studentService.createStudent(studentPayload);

      if (formData.currentClassId && selectedYear?.id) {
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
                  readOnly
                  disabled={mode === 'edit'}
                  placeholder="Auto-generated on load"
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300 disabled:opacity-50" 
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
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-50">
            <div className="bg-emerald-50 p-2 rounded-xl">
              <Users className="text-emerald-500 size-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Parent / Guardian Details</h2>
          </div>

          {/* Search and Add Parent */}
          <div className="mb-6">
            {!showNewParentForm && !selectedParent && (
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search parent by name, email or phone..."
                      value={parentSearch}
                      onChange={(e) => {
                        setParentSearch(e.target.value);
                        setShowParentDropdown(true);
                      }}
                      onFocus={() => setShowParentDropdown(true)}
                      disabled={fetchingData || fetchingStudent}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddNewParent}
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Add New
                  </button>
                </div>
                
                {showParentDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                    {filteredParents.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-slate-500 text-center">
                        {parentSearch ? 'No parents found matching your search' : 'No parents available'}
                      </div>
                    ) : (
                      <>
                        <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                          {parentSearch ? `Results for "${parentSearch}"` : 'All Parents'}
                        </div>
                        {filteredParents.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              handleParentSelect(String(p.id));
                              setShowParentDropdown(false);
                              setParentSearch('');
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-b-0 flex items-center gap-3"
                          >
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{p.fullName}</div>
                              <div className="text-xs text-slate-500">
                                {p.email} {p.phone ? `• ${p.phone}` : ''}
                              </div>
                            </div>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {fetchingData && <p className="text-[10px] text-emerald-500 font-bold animate-pulse mt-2">Loading parents...</p>}
          </div>

          {/* Selected Parent Details */}
          {selectedParent && !showNewParentForm && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{selectedParent.fullName}</h3>
                    <p className="text-sm text-emerald-600 font-medium">Selected Parent</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelectedParent}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4 text-emerald-500" />
                  <span>{selectedParent.email}</span>
                </div>
                {selectedParent.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    <span>{selectedParent.phone}</span>
                  </div>
                )}
                {selectedParent.dateOfBirth && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <span>{new Date(selectedParent.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
                {selectedParent.gender && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <User className="w-4 h-4 text-emerald-500" />
                    <span className="capitalize">{selectedParent.gender}</span>
                  </div>
                )}
                {selectedParent.address && (
                  <div className="col-span-2 flex items-start gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-emerald-500 mt-0.5" />
                    <span>{selectedParent.address}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* New Parent Form */}
          {showNewParentForm && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Plus className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Add New Parent</h3>
                    <p className="text-sm text-amber-600">Fill in the details below</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelNewParent}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={newParentData.fullName}
                      onChange={handleNewParentChange}
                      placeholder="e.g. John Parent"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={newParentData.email}
                      onChange={handleNewParentChange}
                      placeholder="parent@example.com"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="password"
                        required
                        value={newParentData.password}
                        onChange={handleNewParentChange}
                        placeholder="Enter password for parent login"
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={newParentData.phone}
                      onChange={handleNewParentChange}
                      placeholder="9876543210"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={newParentData.dateOfBirth}
                      onChange={handleNewParentChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Gender</label>
                    <select
                      name="gender"
                      value={newParentData.gender}
                      onChange={handleNewParentChange}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Address</label>
                  <textarea
                    name="address"
                    rows={3}
                    value={newParentData.address}
                    onChange={handleNewParentChange}
                    placeholder="123 Main Street, City"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* OR Divider */}
          {!showNewParentForm && !selectedParent && (
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>
          )}

          {/* Info message when nothing selected */}
          {!showNewParentForm && !selectedParent && !formData.parentId && (
            <div className="text-center py-4">
              <p className="text-sm text-slate-500">
                Search for an existing parent or add a new parent
              </p>
            </div>
          )}
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

  return renderContent();
};

export default StudentForm;
