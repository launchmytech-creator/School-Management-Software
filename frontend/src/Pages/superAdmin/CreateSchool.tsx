import { useNavigate, useLocation } from 'react-router-dom';
import { schoolService } from '../../services/schoolService';
import type { CreateSchoolRequest, SchoolCreateData, SubscriptionTier, School, FeeTerm, SchoolUpdateData } from '../../types/school';
import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { useNotification } from '../../context/NotificationContext';
import { getCurrentAcademicYear, getLocalDateString } from '../../lib/utils';

const generateSchoolCode = (name: string): string => {
  const prefix = name.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}${timestamp}`;
};

// Sub-components
import SchoolInfoForm from '../../components/superAdmin/CreateSchool/SchoolInfoForm';
import AdminInfoForm from '../../components/superAdmin/CreateSchool/AdminInfoForm';
import SubscriptionSettingsForm from '../../components/superAdmin/CreateSchool/SubscriptionSettingsForm';
import PlanSelection from '../../components/superAdmin/CreateSchool/PlanSelection';
import FeeTermsSelection from '../../components/superAdmin/CreateSchool/FeeTermsSelection';

const CreateSchool: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  const editSchool = location.state?.school as School | undefined;
  const isEditMode = !!editSchool;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: editSchool?.name || '',
    address: editSchool?.address || '',
    phone: editSchool?.phone || '',
    email: editSchool?.email || '',
    code: editSchool?.id?.slice(-8).toUpperCase() || '',
    academicYear: editSchool?.academicYear || getCurrentAcademicYear(),
    logo: editSchool?.logo || '',
    // Admin details (only used for creation)
    adminFullName: '',
    adminEmail: '',
    adminPassword: '',
    adminPhone: '',
    // Subscription details
    subscriptionStatus: editSchool ? (editSchool.status ? 'active' : 'expired') : 'trial',
    subscriptionEndDate: (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      return getLocalDateString(d);
    })(),
  });
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>(editSchool?.plan || 'PREMIUM');
  const [feeTerm, setFeeTerm] = useState<FeeTerm>(editSchool?.feeTerm || 'YEARLY');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /\S+@\S+\.\S+/;

    // School Info
    if (!formData.name || formData.name.length < 3) newErrors.name = 'Min 3 characters';
    if (!formData.code || formData.code.length < 2) newErrors.code = 'Min 2 characters';
    if (!formData.address) newErrors.address = 'Required';
    if (!formData.phone) newErrors.phone = 'Required';
    if (!formData.email || !emailRegex.test(formData.email)) newErrors.email = 'Invalid email';

    // Admin Info (only if not editing)
    if (!isEditMode) {
      if (!formData.adminFullName || formData.adminFullName.length < 3) newErrors.adminFullName = 'Min 3 characters';
      if (!formData.adminEmail || !emailRegex.test(formData.adminEmail)) newErrors.adminEmail = 'Invalid email';
      if (!formData.adminPassword || formData.adminPassword.length < 8) newErrors.adminPassword = 'Min 8 characters';
      if (!formData.adminPhone) newErrors.adminPhone = 'Required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const planMapping: Record<SubscriptionTier, number> = {
    'BASIC': 1,
    'PREMIUM': 2,
    'BUSINESS': 3,
  };

  const feeTermsNumeric = [
    { id: 'YEARLY', numericId: 1 },
    { id: 'HALF-YEARLY', numericId: 2 },
    { id: 'QUARTERLY', numericId: 4 },
    { id: 'MONTHLY', numericId: 12 },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showNotification('Please fix the errors in the form.', 'error');
      return;
    }
    try {
      setLoading(true);
      
      const currentFeeTermObj = feeTermsNumeric.find(t => t.id === feeTerm);
      
      if (isEditMode && editSchool) {
        const payload: SchoolUpdateData = {
          name: formData.name,
          address: formData.address,
          contactPhone: formData.phone,
          contactEmail: formData.email,
          subscriptionPlanId: planMapping[selectedPlan],
          feeTerms: currentFeeTermObj?.numericId || 1,
          subscriptionStatus: formData.subscriptionStatus,
          subscriptionEndDate: formData.subscriptionEndDate,
        };
        await schoolService.updateSchool(editSchool.id, payload);
      } else {
        const payload: CreateSchoolRequest = {
          school: {
            name: formData.name,
            code: formData.code || generateSchoolCode(formData.name),
            subscriptionPlanId: planMapping[selectedPlan],
            feeTerms: currentFeeTermObj?.numericId || 1,
            contactEmail: formData.email,
            contactPhone: formData.phone,
            address: formData.address,
            subscriptionStatus: formData.subscriptionStatus as SchoolCreateData['subscriptionStatus'],
            subscriptionEndDate: formData.subscriptionEndDate,
          },
          admin: {
            email: formData.adminEmail,
            password: formData.adminPassword,
            fullName: formData.adminFullName,
            phone: formData.adminPhone,
          }
        };
        await schoolService.createSchool(payload);
      }
      showNotification(`School ${isEditMode ? 'updated' : 'registered'} successfully!`, 'success');
      navigate('/super-admin/schools');
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'register'} school.`;
      showNotification(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Register New School">
      <div className="max-w-4xl mx-auto space-y-12 pb-20">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-4xl font-display font-black text-[#1E3A5F] tracking-tight">
            {isEditMode ? 'Update School Details' : 'Register New School'}
          </h2>
          <p className="text-slate-400 font-medium">
            {isEditMode 
              ? `Refining configuration for ${editSchool?.name}.` 
              : 'Enter the essential details to onboard a new institution to the platform.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-premium p-12 space-y-16">
          <SchoolInfoForm formData={formData} handleChange={handleChange} errors={errors} />

          {!isEditMode && (
            <>
              <hr className="border-slate-50" />
              <AdminInfoForm formData={formData} handleChange={handleChange} errors={errors} />
            </>
          )}

          <hr className="border-slate-50" />
          <SubscriptionSettingsForm formData={formData} handleChange={handleChange} errors={errors} />

          <hr className="border-slate-50" />
          <PlanSelection selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />

          <hr className="border-slate-50" />
          <FeeTermsSelection feeTerm={feeTerm} setFeeTerm={setFeeTerm} />

          {/* Footer Actions */}
          <div className="flex justify-center items-center gap-6 pt-8">
               <button 
                 type="button"
                 onClick={() => navigate('/super-admin/schools')}
                 className="h-14 px-10 rounded-xl border border-primary text-primary font-black text-xs uppercase tracking-widest hover:bg-primary/5 transition-all cursor-pointer"
               >
                 Cancel
               </button>
               <button 
                 type="submit"
                 disabled={loading}
                 className="h-14 px-12 rounded-xl bg-[#4A9FD4] text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200/50 hover:bg-[#4A9FD4]/95 transition-all flex items-center gap-3 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
               >
                 <span className="material-symbols-outlined">{loading ? 'sync' : isEditMode ? 'save' : 'add_business'}</span>
                 {loading ? (isEditMode ? 'Updating...' : 'Creating...') : isEditMode ? 'Update School' : 'Create School'}
               </button>
          </div>
        </form>

        <p className="text-center text-[11px] font-bold text-slate-300 uppercase tracking-widest">
           © 2024 EduManage System. All rights reserved.
        </p>
      </div>
    </AdminLayout>
  );
};

export default CreateSchool;