import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import PageHeader from '../../components/common/PageHeader';
import { useNotification } from '../../context/NotificationContext';
import { schoolSettingsService, type SchoolSettings, type UpdateSettingsDto } from '../../services/schoolSettingsService';
import { Save, Building2, Award, Calendar, FileText } from 'lucide-react';
import { Button } from '../../components/ui/button';
import InputField from '../../components/ui/InputField';

const SchoolSettingsPage: React.FC = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [formData, setFormData] = useState<UpdateSettingsDto>({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await schoolSettingsService.getSettings();
        setSettings(data);
        setFormData({
          schoolName: data.schoolName || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          address: data.address || '',
          gradingSystem: data.gradingSystem,
          examPolicy: data.examPolicy,
        });
      } catch {
        showNotification('Failed to fetch settings', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await schoolSettingsService.updateSettings(formData);
      showNotification('Settings saved successfully', 'success');
    } catch {
      showNotification('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="School Settings">
        <div className="space-y-6 pb-12">
          <PageHeader title="School Settings" subtitle="Configure your school preferences" />
          <div className="bg-white rounded-xl border border-slate-200 p-12 flex items-center justify-center">
            <div className="animate-pulse text-slate-400">Loading settings...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="School Settings">
      <div className="space-y-6 pb-12">
        <PageHeader 
          title="School Settings"
          subtitle="Configure your school preferences and policies"
          actions={[
            {
              label: "Save Changes",
              icon: Save,
              onClick: handleSave
            }
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              Basic Information
            </h3>
            <div className="space-y-4">
              <InputField
                label="School Name"
                value={formData.schoolName || ''}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
              />
              <InputField
                label="Contact Email"
                type="email"
                value={formData.contactEmail || ''}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
              <InputField
                label="Contact Phone"
                value={formData.contactPhone || ''}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Grading System */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-500" />
              Grading System
            </h3>
            <div className="space-y-4">
              <InputField
                label="A Grade (90+)"
                type="number"
                value={formData.gradingSystem?.A || 90}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  gradingSystem: { ...formData.gradingSystem!, A: Number(e.target.value) }
                })}
              />
              <InputField
                label="B Grade (80+)"
                type="number"
                value={formData.gradingSystem?.B || 80}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  gradingSystem: { ...formData.gradingSystem!, B: Number(e.target.value) }
                })}
              />
              <InputField
                label="C Grade (70+)"
                type="number"
                value={formData.gradingSystem?.C || 70}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  gradingSystem: { ...formData.gradingSystem!, C: Number(e.target.value) }
                })}
              />
              <InputField
                label="D Grade (60+)"
                type="number"
                value={formData.gradingSystem?.D || 60}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  gradingSystem: { ...formData.gradingSystem!, D: Number(e.target.value) }
                })}
              />
              <InputField
                label="F Grade (Fail)"
                type="number"
                value={formData.gradingSystem?.F || 0}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  gradingSystem: { ...formData.gradingSystem!, F: Number(e.target.value) }
                })}
              />
            </div>
          </div>

          {/* Exam Policy */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              Exam Policy
            </h3>
            <div className="space-y-4">
              <InputField
                label="Passing Marks (%)"
                type="number"
                value={formData.examPolicy?.passingMarks || 35}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  examPolicy: { ...formData.examPolicy!, passingMarks: Number(e.target.value) }
                })}
              />
              <InputField
                label="Internal Assessment Weightage (%)"
                type="number"
                value={formData.examPolicy?.internalWeightage || 25}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  examPolicy: { ...formData.examPolicy!, internalWeightage: Number(e.target.value) }
                })}
              />
            </div>
          </div>

          {/* Attendance Policy */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Attendance Policy
            </h3>
            <div className="space-y-4">
              <InputField
                label="Allowed Leaves per Year"
                type="number"
                value={settings?.attendancePolicy?.allowedLeaves || 10}
                onChange={() => {}}
              />
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="requireMedical"
                  checked={settings?.attendancePolicy?.requireMedicalCertificate || false}
                  onChange={() => showNotification('Coming soon', 'info')}
                  className="w-4 h-4"
                />
                <label htmlFor="requireMedical" className="text-sm text-slate-700">
                  Require medical certificate for sick leaves
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving} size="lg">
            <Save className="w-4 h-4 mr-2" />
            Save All Changes
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SchoolSettingsPage;
