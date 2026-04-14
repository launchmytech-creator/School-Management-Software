import { useNavigate, useLocation } from 'react-router-dom';
import type { CreateSchoolRequest, SchoolCreateData, SubscriptionTier, School, FeeTerm, SchoolUpdateData, SchoolAdmin, UpdateSchoolAdminData } from '../../types/school';
import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { useNotification } from '../../context/NotificationContext';
import { useCreateSchool, useUpdateSchool } from '../../hooks/queries/useSchools';
import { getCurrentAcademicYear, getLocalDateString } from '../../lib/utils';
import { schoolService } from '../../services/schoolService';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createSchoolFormSchema, type CreateSchoolFormData } from '../../schemas/school.schema';
import SchoolInfoForm from '../../components/superAdmin/CreateSchool/SchoolInfoForm';
import AdminInfoForm from '../../components/superAdmin/CreateSchool/AdminInfoForm';
import SubscriptionSettingsForm from '../../components/superAdmin/CreateSchool/SubscriptionSettingsForm';
import PlanSelection from '../../components/superAdmin/CreateSchool/PlanSelection';
import FeeTermsSelection from '../../components/superAdmin/CreateSchool/FeeTermsSelection';

const generateSchoolCode = (name: string): string => {
  const prefix = name.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}${timestamp}`;
};

const CreateSchool: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  const createMutation = useCreateSchool();
  const updateMutation = useUpdateSchool();
  const editSchool = location.state?.school as School | undefined;
  const isEditMode = !!editSchool;

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>(editSchool?.plan || 'PREMIUM');
  const [feeTerm, setFeeTerm] = useState<FeeTerm>(editSchool?.feeTerm || 'YEARLY');
  const [schoolAdmin, setSchoolAdmin] = useState<SchoolAdmin | null>(null);

  const defaultValues = isEditMode ? {
    isEditMode: true as const,
    name: editSchool?.name || '',
    address: editSchool?.address || '',
    phone: editSchool?.phone || '',
    email: editSchool?.email || '',
    subscriptionStatus: (editSchool?.subscriptionStatus || 'active') as 'trial' | 'active' | 'suspended' | 'expired',
    subscriptionEndDate: (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      return getLocalDateString(d);
    })(),
    academicYear: editSchool?.academicYear || getCurrentAcademicYear(),
  } : {
    isEditMode: false as const,
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    subscriptionStatus: 'active' as const,
    subscriptionEndDate: (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      return getLocalDateString(d);
    })(),
    academicYear: getCurrentAcademicYear(),
    adminFullName: '',
    adminEmail: '',
    adminPassword: '',
    adminPhone: '',
  };

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof createSchoolFormSchema>>({
    resolver: zodResolver(createSchoolFormSchema),
    defaultValues,
  });

  const fetchSchoolAdmin = async (id: string) => {
    try {
      const admin = await schoolService.getSchoolAdmin(id);
      setSchoolAdmin(admin);
    } catch {
      // Handle silently
    }
  };

  useEffect(() => {
    if (isEditMode && editSchool?.id) {
      fetchSchoolAdmin(editSchool.id);
    }
  }, [isEditMode, editSchool?.id]);

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

  const onSubmit = async (data: z.infer<typeof createSchoolFormSchema>) => {
    try {
      const currentFeeTermObj = feeTermsNumeric.find(t => t.id === feeTerm);
      
      if (data.isEditMode && editSchool) {
        const payload: SchoolUpdateData = {
          name: data.name,
          address: data.address,
          contactPhone: data.phone,
          contactEmail: data.email,
          subscriptionPlanId: planMapping[selectedPlan],
          subscriptionStatus: data.subscriptionStatus,
          subscriptionEndDate: data.subscriptionEndDate,
        };
        await updateMutation.mutateAsync({ id: editSchool.id, data: payload });

        if (schoolAdmin && data.adminFullName) {
          const adminUpdates: UpdateSchoolAdminData = {};
          if (data.adminFullName !== schoolAdmin.fullName) {
            adminUpdates.fullName = data.adminFullName;
          }
          if (data.adminEmail && data.adminEmail !== schoolAdmin.email) {
            adminUpdates.email = data.adminEmail;
          }
          if (data.adminPhone && data.adminPhone !== schoolAdmin.phone) {
            adminUpdates.phone = data.adminPhone;
          }
          if (data.adminPassword) {
            adminUpdates.password = data.adminPassword;
          }
          if (Object.keys(adminUpdates).length > 0) {
            await schoolService.updateSchoolAdmin(editSchool.id, adminUpdates);
          }
        }
      } else {
        const createData = data as CreateSchoolFormData & { isEditMode: false };
        const payload: CreateSchoolRequest = {
          school: {
            name: createData.name,
            code: createData.code || generateSchoolCode(createData.name),
            subscriptionPlanId: planMapping[selectedPlan],
            feeTerms: currentFeeTermObj?.numericId || 1,
            contactEmail: createData.email,
            contactPhone: createData.phone,
            address: createData.address,
            subscriptionStatus: createData.subscriptionStatus as SchoolCreateData['subscriptionStatus'],
            subscriptionEndDate: createData.subscriptionEndDate,
          },
          admin: {
            email: createData.adminEmail,
            password: createData.adminPassword,
            fullName: createData.adminFullName,
            phone: createData.adminPhone,
          }
        };
        await createMutation.mutateAsync(payload);
      }
      showNotification(`School ${isEditMode ? 'updated' : 'registered'} successfully!`, 'success');
      navigate('/super-admin/schools');
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'register'} school.`;
      showNotification(message, 'error');
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

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-slate-100 shadow-premium p-12 space-y-16">
          <SchoolInfoForm register={register} errors={errors} />

          <hr className="border-slate-50" />
          <AdminInfoForm 
            register={register} 
            errors={errors}
            isEditMode={isEditMode}
          />

          <hr className="border-slate-50" />
          <SubscriptionSettingsForm 
            register={register} 
            errors={errors}
            selectedPlan={selectedPlan}
            onPlanChange={setSelectedPlan}
            isEditMode={isEditMode}
          />

          <hr className="border-slate-50" />
          <PlanSelection selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} />

          <hr className="border-slate-50" />
          <FeeTermsSelection feeTerm={feeTerm} setFeeTerm={setFeeTerm} />

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
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="h-14 px-12 rounded-xl bg-[#4A9FD4] text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200/50 hover:bg-[#4A9FD4]/95 transition-all flex items-center gap-3 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined">{createMutation.isPending || updateMutation.isPending ? 'sync' : isEditMode ? 'save' : 'add_business'}</span>
                  {createMutation.isPending || updateMutation.isPending ? (isEditMode ? 'Updating...' : 'Creating...') : isEditMode ? 'Update School' : 'Create School'}
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
