"use client";

const CONDITION_OPTIONS = [
  "Diabetes",
  "Hypertension",
  "Asthma",
  "Heart Disease",
  "None",
];

interface ConditionSelectProps {
  selected: string[];
  onChange: (conditions: string[]) => void;
}

export default function ConditionSelect({
  selected,
  onChange,
}: ConditionSelectProps) {
  function toggle(condition: string) {
    if (condition === "None") {
      onChange(selected.includes("None") ? [] : ["None"]);
      return;
    }
    const withoutNone = selected.filter((c) => c !== "None");
    if (withoutNone.includes(condition)) {
      onChange(withoutNone.filter((c) => c !== condition));
    } else {
      onChange([...withoutNone, condition]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-zinc-300">
        Pre-existing Conditions
      </label>
      <div className="flex flex-wrap gap-2">
        {CONDITION_OPTIONS.map((condition) => {
          const active = selected.includes(condition);
          return (
            <button
              key={condition}
              type="button"
              onClick={() => toggle(condition)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                active
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-zinc-700 bg-black text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
              }`}
            >
              {condition}
            </button>
          );
        })}
      </div>
    </div>
  );
}
