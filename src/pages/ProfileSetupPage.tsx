import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Heart, Users, Activity, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { logger } from '@/lib/logger';
import { PageWrapper } from '@/components/layout';
import {
  Card,
  CardContent,
  Button,
  Input,
  Select,
  TagInput,
  LoadingSpinner,
} from '@/components/common';
import { useUserProfile } from '@/hooks/useUserProfile';
import type {
  Gender,
  SmokingStatus,
  AlcoholFrequency,
  ExerciseFrequency,
  FamilyHistory,
  CreateUserProfileInput,
} from '@/types';

// Step definitions
const STEPS = [
  { id: 'basic', title: 'Basic Information', icon: User },
  { id: 'medical', title: 'Medical History', icon: Heart },
  { id: 'family', title: 'Family History', icon: Users },
  { id: 'lifestyle', title: 'Lifestyle', icon: Activity },
] as const;

// Form data type
interface ProfileFormData {
  displayName: string;
  gender: Gender | '';
  dateOfBirth: string;
  heightCm: string;
  weightKg: string;
  medicalConditions: string[];
  currentMedications: string[];
  allergies: string[];
  surgicalHistory: string[];
  familyHistory: FamilyHistory;
  smokingStatus: SmokingStatus | '';
  alcoholFrequency: AlcoholFrequency | '';
  exerciseFrequency: ExerciseFrequency | '';
}

const initialFormData: ProfileFormData = {
  displayName: '',
  gender: '',
  dateOfBirth: '',
  heightCm: '',
  weightKg: '',
  medicalConditions: [],
  currentMedications: [],
  allergies: [],
  surgicalHistory: [],
  familyHistory: {},
  smokingStatus: '',
  alcoholFrequency: '',
  exerciseFrequency: '',
};

// Family history conditions and relatives
const FAMILY_CONDITIONS: Array<{ value: string; label: string }> = [
  { value: 'heart_disease', label: 'Heart Disease' },
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'cancer', label: 'Cancer' },
  { value: 'hypertension', label: 'High Blood Pressure' },
  { value: 'stroke', label: 'Stroke' },
  { value: 'alzheimers', label: "Alzheimer's Disease" },
  { value: 'asthma', label: 'Asthma' },
  { value: 'arthritis', label: 'Arthritis' },
  { value: 'kidney_disease', label: 'Kidney Disease' },
  { value: 'liver_disease', label: 'Liver Disease' },
  { value: 'thyroid_disorder', label: 'Thyroid Disorder' },
  { value: 'mental_health', label: 'Mental Health Conditions' },
];

const RELATIVE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'grandfather_paternal', label: 'Grandfather (Paternal)' },
  { value: 'grandmother_paternal', label: 'Grandmother (Paternal)' },
  { value: 'grandfather_maternal', label: 'Grandfather (Maternal)' },
  { value: 'grandmother_maternal', label: 'Grandmother (Maternal)' },
];

export function ProfileSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  const { create, complete, isCreating } = useUserProfile();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ProfileFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});

  const updateField = useCallback(<K extends keyof ProfileFormData>(
    field: K,
    value: ProfileFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Partial<Record<keyof ProfileFormData, string>> = {};

    if (step === 0) {
      // Basic info validation
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(currentStep)) return;

    const input: CreateUserProfileInput = {
      displayName: formData.displayName || undefined,
      gender: formData.gender as Gender,
      dateOfBirth: formData.dateOfBirth,
      heightCm: formData.heightCm ? parseFloat(formData.heightCm) : undefined,
      weightKg: formData.weightKg ? parseFloat(formData.weightKg) : undefined,
      medicalConditions: formData.medicalConditions,
      currentMedications: formData.currentMedications,
      allergies: formData.allergies,
      surgicalHistory: formData.surgicalHistory,
      familyHistory: formData.familyHistory,
      smokingStatus: formData.smokingStatus || undefined,
      alcoholFrequency: formData.alcoholFrequency || undefined,
      exerciseFrequency: formData.exerciseFrequency || undefined,
    };

    try {
      await create(input);
      // Mark profile as complete after creation
      await complete();
      navigate(returnTo);
    } catch (err) {
      logger.error('Failed to create profile', err instanceof Error ? err : undefined);
    }
  }, [formData, currentStep, validateStep, create, complete, navigate, returnTo]);

  const toggleFamilyHistory = useCallback((condition: string, relative: string) => {
    setFormData((prev) => {
      const current = prev.familyHistory[condition] || [];
      const updated = current.includes(relative)
        ? current.filter((r) => r !== relative)
        : [...current, relative];

      return {
        ...prev,
        familyHistory: {
          ...prev.familyHistory,
          [condition]: updated,
        },
      };
    });
  }, []);

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'basic':
        return (
          <div className="space-y-6">
            <Input
              label="Display Name"
              placeholder="How should we call you?"
              value={formData.displayName}
              onChange={(e) => updateField('displayName', e.target.value)}
            />

            <Select
              label="Gender"
              required
              value={formData.gender}
              onChange={(e) => updateField('gender', e.target.value as Gender | '')}
              error={errors.gender}
              options={[
                { value: '', label: 'Select gender...' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
            />

            <Input
              type="date"
              label="Date of Birth"
              required
              value={formData.dateOfBirth}
              onChange={(e) => updateField('dateOfBirth', e.target.value)}
              error={errors.dateOfBirth}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Height (cm)"
                placeholder="175"
                value={formData.heightCm}
                onChange={(e) => updateField('heightCm', e.target.value)}
              />
              <Input
                type="number"
                label="Weight (kg)"
                placeholder="70"
                value={formData.weightKg}
                onChange={(e) => updateField('weightKg', e.target.value)}
              />
            </div>
          </div>
        );

      case 'medical':
        return (
          <div className="space-y-6">
            <div>
              <TagInput
                label="Medical Conditions"
                placeholder="Type and press Enter (e.g., Type 2 Diabetes)"
                tags={formData.medicalConditions}
                onChange={(tags) => updateField('medicalConditions', tags)}
              />
              <p className="text-xs text-theme-tertiary mt-1">Add any chronic conditions or diagnoses</p>
            </div>

            <div>
              <TagInput
                label="Current Medications"
                placeholder="Type and press Enter (e.g., Metformin 500mg)"
                tags={formData.currentMedications}
                onChange={(tags) => updateField('currentMedications', tags)}
              />
              <p className="text-xs text-theme-tertiary mt-1">Include dosage if known</p>
            </div>

            <div>
              <TagInput
                label="Allergies"
                placeholder="Type and press Enter (e.g., Penicillin)"
                tags={formData.allergies}
                onChange={(tags) => updateField('allergies', tags)}
              />
              <p className="text-xs text-theme-tertiary mt-1">Drug allergies, food allergies, etc.</p>
            </div>

            <div>
              <TagInput
                label="Surgical History"
                placeholder="Type and press Enter (e.g., Appendectomy 2015)"
                tags={formData.surgicalHistory}
                onChange={(tags) => updateField('surgicalHistory', tags)}
              />
              <p className="text-xs text-theme-tertiary mt-1">Past surgeries and approximate year</p>
            </div>
          </div>
        );

      case 'family':
        return (
          <div className="space-y-6">
            <p className="text-sm text-theme-secondary mb-4">
              Select conditions that run in your family and which relatives are affected.
            </p>

            {FAMILY_CONDITIONS.map((condition) => (
              <div key={condition.value} className="border border-theme-primary rounded-lg p-4">
                <h4 className="font-medium text-theme-primary mb-3">{condition.label}</h4>
                <div className="flex flex-wrap gap-2">
                  {RELATIVE_OPTIONS.map((relative) => {
                    const isSelected =
                      formData.familyHistory[condition.value]?.includes(relative.value) ?? false;
                    return (
                      <button
                        key={relative.value}
                        type="button"
                        onClick={() => toggleFamilyHistory(condition.value, relative.value)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          isSelected
                            ? 'bg-cyan-100 border-cyan-300 text-cyan-800'
                            : 'bg-theme-secondary border-theme-primary text-theme-secondary hover:bg-theme-tertiary'
                        }`}
                      >
                        {relative.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );

      case 'lifestyle':
        return (
          <div className="space-y-6">
            <Select
              label="Smoking Status"
              value={formData.smokingStatus}
              onChange={(e) => updateField('smokingStatus', e.target.value as SmokingStatus | '')}
              options={[
                { value: '', label: 'Prefer not to say' },
                { value: 'never', label: 'Never smoked' },
                { value: 'former', label: 'Former smoker' },
                { value: 'current', label: 'Current smoker' },
              ]}
            />

            <Select
              label="Alcohol Consumption"
              value={formData.alcoholFrequency}
              onChange={(e) =>
                updateField('alcoholFrequency', e.target.value as AlcoholFrequency | '')
              }
              options={[
                { value: '', label: 'Prefer not to say' },
                { value: 'never', label: 'Never' },
                { value: 'occasional', label: 'Occasional (social drinking)' },
                { value: 'moderate', label: 'Moderate (few times per week)' },
                { value: 'heavy', label: 'Heavy (daily)' },
              ]}
            />

            <Select
              label="Exercise Frequency"
              value={formData.exerciseFrequency}
              onChange={(e) =>
                updateField('exerciseFrequency', e.target.value as ExerciseFrequency | '')
              }
              options={[
                { value: '', label: 'Prefer not to say' },
                { value: 'sedentary', label: 'Sedentary (little to no exercise)' },
                { value: 'light', label: 'Light (1-2 days per week)' },
                { value: 'moderate', label: 'Moderate (3-4 days per week)' },
                { value: 'active', label: 'Active (5-6 days per week)' },
                { value: 'very_active', label: 'Very Active (daily intense exercise)' },
              ]}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <PageWrapper title="Complete Your Profile">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    isComplete
                      ? 'bg-cyan-600 border-cyan-600 text-white'
                      : isActive
                        ? 'border-cyan-600 text-cyan-600'
                        : 'border-theme-primary text-theme-muted'
                  }`}
                >
                  {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-16 h-0.5 mx-2 ${
                      isComplete ? 'bg-cyan-600' : 'bg-theme-muted'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <Card>
          <CardContent>
            <h2 className="text-xl font-semibold text-theme-primary mb-6">
              {STEPS[currentStep].title}
            </h2>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          {isLastStep ? (
            <Button onClick={handleSubmit} disabled={isCreating}>
              {isCreating ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Setup
                  <Check className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
