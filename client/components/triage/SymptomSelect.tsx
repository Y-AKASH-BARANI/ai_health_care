"use client";

const SYMPTOM_OPTIONS = [
  "Chest Pain",
  "Breathing Difficulty",
  "Severe Headache",
  "Fever",
  "Dizziness",
  "Abdominal Pain",
  "Fatigue",
  "Nausea",
];

interface SymptomSelectProps {
  selected: string[];
  onChange: (symptoms: string[]) => void;
}

export default function SymptomSelect({
  selected,
  onChange,
}: SymptomSelectProps) {
  function toggle(symptom: string) {
    if (selected.includes(symptom)) {
      onChange(selected.filter((s) => s !== symptom));
    } else {
      onChange([...selected, symptom]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-zinc-300">Symptoms</label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SYMPTOM_OPTIONS.map((symptom) => {
          const active = selected.includes(symptom);
          return (
            <button
              key={symptom}
              type="button"
              onClick={() => toggle(symptom)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                active
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-zinc-700 bg-black text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              }`}
            >
              {symptom}
            </button>
          );
        })}
      </div>
    </div>
  );
}
