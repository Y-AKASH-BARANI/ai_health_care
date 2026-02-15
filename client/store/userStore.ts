import { create } from "zustand";

interface MedicalFile {
  id: string;
  fileName: string;
  uploadDate: string;
}

interface MLPrediction {
  risk_level: string;
  department: string;
  risk_confidence: number;
  department_confidence: number;
}

interface AIExplanation {
  risk_level: string;
  summary: string;
  key_findings: string[];
  recommended_action: string;
  urgency_score: number;
}

interface FinalRecommendation {
  risk_level: string;
  department: string;
  summary: string;
  recommended_action: string;
  urgency_score: number;
}

export interface VitalCheck {
  name: string;
  value: string;
  status: "normal" | "warning" | "critical";
  score: number;
}

export interface DepartmentInsight {
  department_name: string;
  wait_time_estimate: string;
  immediate_action: string;
  specialist_type: string;
}

export interface CarePlan {
  care_instructions: string[];
  dietary_recommendations: string[];
  dietary_restrictions: string[];
}

export interface TriageResult {
  ml_prediction: MLPrediction | null;
  ai_explanation: AIExplanation;
  final_recommendation: FinalRecommendation;
  risk_factors: string[];
  vital_analysis: VitalCheck[];
  dept_insights: DepartmentInsight;
  care_plan: CarePlan;
  confidence_score: number;
}

interface UserState {
  displayName: string;
  email: string;
  photoURL: string;
  uid: string;
  age: string;
  gender: string;
  sessionCount: number;
  triageResult: TriageResult | null;
  medicalHistory: MedicalFile[];
  setUser: (user: {
    displayName: string;
    email: string;
    photoURL: string;
    uid: string;
  }) => void;
  setDemographics: (demographics: { age: string; gender: string }) => void;
  setSessionCount: (count: number) => void;
  setTriageResult: (result: TriageResult) => void;
  addMedicalFile: (file: { fileName: string }) => void;
  removeMedicalFile: (id: string) => void;
  updateDemographics: (age: string, gender: string) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  displayName: "",
  email: "",
  photoURL: "",
  uid: "",
  age: "",
  gender: "",
  sessionCount: 0,
  triageResult: null,
  medicalHistory: [],
  setUser: (user) =>
    set({
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      uid: user.uid,
    }),
  setDemographics: (demographics) =>
    set({
      age: demographics.age,
      gender: demographics.gender,
    }),
  setSessionCount: (count) => set({ sessionCount: count }),
  setTriageResult: (result) => set({ triageResult: result }),
  addMedicalFile: (file) =>
    set((state) => ({
      medicalHistory: [
        ...state.medicalHistory,
        {
          id: crypto.randomUUID(),
          fileName: file.fileName,
          uploadDate: new Date().toLocaleDateString("en-US"),
        },
      ],
    })),
  removeMedicalFile: (id) =>
    set((state) => ({
      medicalHistory: state.medicalHistory.filter((f) => f.id !== id),
    })),
  updateDemographics: (age, gender) => set({ age, gender }),
  clearUser: () =>
    set({
      displayName: "",
      email: "",
      photoURL: "",
      uid: "",
      age: "",
      gender: "",
      sessionCount: 0,
      triageResult: null,
      medicalHistory: [],
    }),
}));
