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

export interface TriageResult {
  ml_prediction: MLPrediction | null;
  ai_explanation: AIExplanation;
  final_recommendation: FinalRecommendation;
}

interface UserState {
  displayName: string;
  email: string;
  photoURL: string;
  uid: string;
  age: string;
  gender: string;
  triageResult: TriageResult | null;
  medicalHistory: MedicalFile[];
  setUser: (user: {
    displayName: string;
    email: string;
    photoURL: string;
    uid: string;
  }) => void;
  setDemographics: (demographics: { age: string; gender: string }) => void;
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
  setTriageResult: (result) => set({ triageResult: result }),
  addMedicalFile: (file) =>
    set((state) => ({
      medicalHistory: [
        ...state.medicalHistory,
        {
          id: crypto.randomUUID(),
          fileName: file.fileName,
          uploadDate: new Date().toLocaleDateString(),
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
      triageResult: null,
      medicalHistory: [],
    }),
}));
