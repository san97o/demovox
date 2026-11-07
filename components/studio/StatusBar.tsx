"use client";

import { type AgentStep, AGENT_STEP_LABELS } from "@/types";

const STEP_ORDER: AgentStep[] = ["analyzing", "scripting", "voiceover", "rendering", "done"];

interface StatusBarProps {
  currentStep: AgentStep;
}

export function StatusBar({ currentStep }: StatusBarProps) {
  const isIdle = currentStep === "idle";
  const isDone = currentStep === "done";
  const isActive = !isIdle && !isDone;

  return (
    <div className="flex items-center gap-4 border-t border-[#222] bg-black px-5 py-2.5">
      {/* Indicator dot */}
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-300 ${
          isDone ? "bg-[#00e128]" : isActive ? "bg-[#00e128] animate-pulse" : "bg-[#333]"
        }`}
      />

      {/* Label */}
      <span
        className={`text-[10px] tracking-widest uppercase font-[400] transition-colors duration-300 ${
          isDone ? "text-[#00e128]" : isActive ? "text-[#888]" : "text-[#333]"
        }`}
      >
        {AGENT_STEP_LABELS[currentStep]}
      </span>

      {/* Step progress */}
      {!isIdle && (
        <div className="ml-auto flex items-center gap-1">
          {STEP_ORDER.map((step) => {
            const stepIdx = STEP_ORDER.indexOf(step);
            const currIdx = STEP_ORDER.indexOf(currentStep);
            const completed = isDone || currIdx > stepIdx;
            const active = step === currentStep && !isDone;

            return (
              <div
                key={step}
                className={`h-px transition-all duration-500 ${
                  completed
                    ? "w-6 bg-[#00e128]/60"
                    : active
                    ? "w-6 bg-[#00e128]"
                    : "w-3 bg-[#333]"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
