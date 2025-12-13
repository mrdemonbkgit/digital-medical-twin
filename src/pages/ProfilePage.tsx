import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Heart,
  Users,
  Activity,
  Edit2,
  Save,
  X,
  Calendar,
  Ruler,
  Scale,
} from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Input,
  Select,
  TagInput,
  LoadingSpinner,
} from '@/components/common';
import { useUserProfile } from '@/hooks/useUserProfile';
import { calculateAge, calculateBMI, getBMICategory } from '@/types/userProfile';
import type {
  Gender,
  SmokingStatus,
  AlcoholFrequency,
  ExerciseFrequency,
  FamilyHistory,
  UpdateUserProfileInput,
} from '@/types';

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

// Form data type for editing
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

type EditSection = 'basic' | 'medical' | 'family' | 'lifestyle' | null;

export function ProfilePage() {
  const navigate = useNavigate();
  const { profile, isLoading, error, update, isUpdating } = useUserProfile();
  const [editSection, setEditSection] = useState<EditSection>(null);
  const [formData, setFormData] = useState<ProfileFormData | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const startEditing = useCallback(
    (section: EditSection) => {
      if (!profile) return;

      setFormData({
        displayName: profile.displayName || '',
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth,
        heightCm: profile.heightCm?.toString() || '',
        weightKg: profile.weightKg?.toString() || '',
        medicalConditions: profile.medicalConditions || [],
        currentMedications: profile.currentMedications || [],
        allergies: profile.allergies || [],
        surgicalHistory: profile.surgicalHistory || [],
        familyHistory: profile.familyHistory || {},
        smokingStatus: profile.smokingStatus || '',
        alcoholFrequency: profile.alcoholFrequency || '',
        exerciseFrequency: profile.exerciseFrequency || '',
      });
      setEditSection(section);
      setSaveError(null);
    },
    [profile]
  );

  const cancelEditing = useCallback(() => {
    setEditSection(null);
    setFormData(null);
    setSaveError(null);
  }, []);

  const updateField = useCallback(
    <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => {
      setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
    },
    []
  );

  const toggleFamilyHistory = useCallback((condition: string, relative: string) => {
    setFormData((prev) => {
      if (!prev) return null;
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

  const handleSave = useCallback(async () => {
    if (!formData) return;

    setSaveError(null);

    const input: UpdateUserProfileInput = {};

    // Only include changed fields based on section
    if (editSection === 'basic') {
      input.displayName = formData.displayName || undefined;
      input.gender = formData.gender as Gender;
      input.dateOfBirth = formData.dateOfBirth;
      input.heightCm = formData.heightCm ? parseFloat(formData.heightCm) : undefined;
      input.weightKg = formData.weightKg ? parseFloat(formData.weightKg) : undefined;
    } else if (editSection === 'medical') {
      input.medicalConditions = formData.medicalConditions;
      input.currentMedications = formData.currentMedications;
      input.allergies = formData.allergies;
      input.surgicalHistory = formData.surgicalHistory;
    } else if (editSection === 'family') {
      input.familyHistory = formData.familyHistory;
    } else if (editSection === 'lifestyle') {
      input.smokingStatus = formData.smokingStatus || undefined;
      input.alcoholFrequency = formData.alcoholFrequency || undefined;
      input.exerciseFrequency = formData.exerciseFrequency || undefined;
    }

    try {
      await update(input);
      setEditSection(null);
      setFormData(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
    }
  }, [formData, editSection, update]);

  if (isLoading) {
    return (
      <PageWrapper title="Your Profile">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner className="w-8 h-8" />
        </div>
      </PageWrapper>
    );
  }

  if (error || !profile) {
    return (
      <PageWrapper title="Your Profile">
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-theme-secondary mb-4">
                {error || 'No profile found. Please complete your profile setup.'}
              </p>
              <Button onClick={() => navigate('/profile/setup')}>Setup Profile</Button>
            </div>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  const age = calculateAge(profile.dateOfBirth);
  const bmi =
    profile.heightCm && profile.weightKg
      ? calculateBMI(profile.heightCm, profile.weightKg)
      : null;
  const bmiCategory = bmi ? getBMICategory(bmi) : null;

  const renderSectionHeader = (
    title: string,
    icon: React.ReactNode,
    section: EditSection
  ) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-lg font-semibold text-theme-primary">{title}</h3>
      </div>
      {editSection === section ? (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={cancelEditing} disabled={isUpdating}>
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? (
              <LoadingSpinner className="w-4 h-4 mr-1" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            Save
          </Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => startEditing(section)}>
          <Edit2 className="w-4 h-4 mr-1" />
          Edit
        </Button>
      )}
    </div>
  );

  const formatGender = (gender: Gender) => {
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  const formatSmokingStatus = (status?: SmokingStatus) => {
    if (!status) return 'Not specified';
    const labels: Record<SmokingStatus, string> = {
      never: 'Never smoked',
      former: 'Former smoker',
      current: 'Current smoker',
    };
    return labels[status];
  };

  const formatAlcoholFrequency = (freq?: AlcoholFrequency) => {
    if (!freq) return 'Not specified';
    const labels: Record<AlcoholFrequency, string> = {
      never: 'Never',
      occasional: 'Occasional',
      moderate: 'Moderate',
      heavy: 'Heavy',
    };
    return labels[freq];
  };

  const formatExerciseFrequency = (freq?: ExerciseFrequency) => {
    if (!freq) return 'Not specified';
    const labels: Record<ExerciseFrequency, string> = {
      sedentary: 'Sedentary',
      light: 'Light (1-2 days/week)',
      moderate: 'Moderate (3-4 days/week)',
      active: 'Active (5-6 days/week)',
      very_active: 'Very Active (daily)',
    };
    return labels[freq];
  };

  const getRelativeLabel = (value: string) => {
    return RELATIVE_OPTIONS.find((r) => r.value === value)?.label || value;
  };

  return (
    <PageWrapper title="Your Profile">
      <div className="max-w-3xl mx-auto space-y-6">
        {saveError && (
          <div className="bg-danger-muted border border-danger text-danger px-4 py-3 rounded-lg">
            {saveError}
          </div>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            {renderSectionHeader(
              'Basic Information',
              <User className="w-5 h-5 text-cyan-600" />,
              'basic'
            )}
          </CardHeader>
          <CardContent>
            {editSection === 'basic' && formData ? (
              <div className="space-y-4">
                <Input
                  label="Display Name"
                  value={formData.displayName}
                  onChange={(e) => updateField('displayName', e.target.value)}
                />
                <Select
                  label="Gender"
                  required
                  value={formData.gender}
                  onChange={(e) => updateField('gender', e.target.value as Gender | '')}
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
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Height (cm)"
                    value={formData.heightCm}
                    onChange={(e) => updateField('heightCm', e.target.value)}
                  />
                  <Input
                    type="number"
                    label="Weight (kg)"
                    value={formData.weightKg}
                    onChange={(e) => updateField('weightKg', e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <p className="text-sm text-theme-tertiary">Display Name</p>
                  <p className="font-medium text-theme-primary">
                    {profile.displayName || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-theme-tertiary">Gender</p>
                  <p className="font-medium text-theme-primary">{formatGender(profile.gender)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-theme-muted" />
                  <div>
                    <p className="text-sm text-theme-tertiary">Age</p>
                    <p className="font-medium text-theme-primary">{age} years old</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-theme-muted" />
                  <div>
                    <p className="text-sm text-theme-tertiary">Height</p>
                    <p className="font-medium text-theme-primary">
                      {profile.heightCm ? `${profile.heightCm} cm` : 'Not set'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-theme-muted" />
                  <div>
                    <p className="text-sm text-theme-tertiary">Weight</p>
                    <p className="font-medium text-theme-primary">
                      {profile.weightKg ? `${profile.weightKg} kg` : 'Not set'}
                    </p>
                  </div>
                </div>
                {bmi && (
                  <div>
                    <p className="text-sm text-theme-tertiary">BMI</p>
                    <p className="font-medium text-theme-primary">
                      {bmi.toFixed(1)}{' '}
                      <span className="text-sm text-theme-tertiary">({bmiCategory})</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medical History */}
        <Card>
          <CardHeader>
            {renderSectionHeader(
              'Medical History',
              <Heart className="w-5 h-5 text-red-500" />,
              'medical'
            )}
          </CardHeader>
          <CardContent>
            {editSection === 'medical' && formData ? (
              <div className="space-y-4">
                <TagInput
                  label="Medical Conditions"
                  placeholder="Type and press Enter"
                  tags={formData.medicalConditions}
                  onChange={(tags) => updateField('medicalConditions', tags)}
                />
                <TagInput
                  label="Current Medications"
                  placeholder="Type and press Enter"
                  tags={formData.currentMedications}
                  onChange={(tags) => updateField('currentMedications', tags)}
                />
                <TagInput
                  label="Allergies"
                  placeholder="Type and press Enter"
                  tags={formData.allergies}
                  onChange={(tags) => updateField('allergies', tags)}
                />
                <TagInput
                  label="Surgical History"
                  placeholder="Type and press Enter"
                  tags={formData.surgicalHistory}
                  onChange={(tags) => updateField('surgicalHistory', tags)}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-theme-tertiary mb-2">Medical Conditions</p>
                  {profile.medicalConditions?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.medicalConditions.map((condition) => (
                        <span
                          key={condition}
                          className="px-2 py-1 bg-danger-muted text-danger rounded-full text-sm"
                        >
                          {condition}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-theme-muted italic">None reported</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-theme-tertiary mb-2">Current Medications</p>
                  {profile.currentMedications?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.currentMedications.map((med) => (
                        <span
                          key={med}
                          className="px-2 py-1 bg-info-muted text-info rounded-full text-sm"
                        >
                          {med}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-theme-muted italic">None reported</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-theme-tertiary mb-2">Allergies</p>
                  {profile.allergies?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.allergies.map((allergy) => (
                        <span
                          key={allergy}
                          className="px-2 py-1 bg-warning-muted text-warning rounded-full text-sm"
                        >
                          {allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-theme-muted italic">None reported</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-theme-tertiary mb-2">Surgical History</p>
                  {profile.surgicalHistory?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.surgicalHistory.map((surgery) => (
                        <span
                          key={surgery}
                          className="px-2 py-1 bg-event-metric text-event-metric rounded-full text-sm"
                        >
                          {surgery}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-theme-muted italic">None reported</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Family History */}
        <Card>
          <CardHeader>
            {renderSectionHeader(
              'Family History',
              <Users className="w-5 h-5 text-green-600" />,
              'family'
            )}
          </CardHeader>
          <CardContent>
            {editSection === 'family' && formData ? (
              <div className="space-y-4">
                <p className="text-sm text-theme-secondary mb-4">
                  Select conditions that run in your family and which relatives are
                  affected.
                </p>
                {FAMILY_CONDITIONS.map((condition) => (
                  <div key={condition.value} className="border border-theme-primary rounded-lg p-4">
                    <h4 className="font-medium text-theme-primary mb-3">{condition.label}</h4>
                    <div className="flex flex-wrap gap-2">
                      {RELATIVE_OPTIONS.map((relative) => {
                        const isSelected =
                          formData.familyHistory[condition.value]?.includes(
                            relative.value
                          ) ?? false;
                        return (
                          <button
                            key={relative.value}
                            type="button"
                            onClick={() =>
                              toggleFamilyHistory(condition.value, relative.value)
                            }
                            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                              isSelected
                                ? 'bg-info-muted border-info text-info'
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
            ) : (
              <div className="space-y-3">
                {Object.entries(profile.familyHistory || {}).filter(
                  ([, relatives]) => relatives && relatives.length > 0
                ).length > 0 ? (
                  Object.entries(profile.familyHistory || {})
                    .filter(([, relatives]) => relatives && relatives.length > 0)
                    .map(([condition, relatives]) => {
                      const conditionLabel =
                        FAMILY_CONDITIONS.find((c) => c.value === condition)?.label ||
                        condition;
                      return (
                        <div
                          key={condition}
                          className="flex items-start gap-3 py-2 border-b border-theme-primary last:border-0"
                        >
                          <span className="font-medium text-theme-primary shrink-0">
                            {conditionLabel}:
                          </span>
                          <span className="text-theme-secondary">
                            {relatives.map((r) => getRelativeLabel(r)).join(', ')}
                          </span>
                        </div>
                      );
                    })
                ) : (
                  <p className="text-theme-muted italic">No family history reported</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lifestyle */}
        <Card>
          <CardHeader>
            {renderSectionHeader(
              'Lifestyle',
              <Activity className="w-5 h-5 text-amber-500" />,
              'lifestyle'
            )}
          </CardHeader>
          <CardContent>
            {editSection === 'lifestyle' && formData ? (
              <div className="space-y-4">
                <Select
                  label="Smoking Status"
                  value={formData.smokingStatus}
                  onChange={(e) =>
                    updateField('smokingStatus', e.target.value as SmokingStatus | '')
                  }
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
                    updateField(
                      'exerciseFrequency',
                      e.target.value as ExerciseFrequency | ''
                    )
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
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <p className="text-sm text-theme-tertiary">Smoking</p>
                  <p className="font-medium text-theme-primary">
                    {formatSmokingStatus(profile.smokingStatus)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-theme-tertiary">Alcohol</p>
                  <p className="font-medium text-theme-primary">
                    {formatAlcoholFrequency(profile.alcoholFrequency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-theme-tertiary">Exercise</p>
                  <p className="font-medium text-theme-primary">
                    {formatExerciseFrequency(profile.exerciseFrequency)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
