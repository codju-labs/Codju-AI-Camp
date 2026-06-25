import React, { useMemo, useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

const GOALS = ["Collect", "Survive", "Race", "Solve", "Build", "Explore"];
const CONTROLS = ["Tap", "Arrow keys", "Drag", "Click", "Swipe"];
const OBSTACLES = ["Timer", "Enemies", "Locked doors", "Limited lives", "Moving platforms"];
const REWARDS = ["Points", "New level", "Power-up", "Badge", "Story clue"];

interface GameMechanicLabProps {
  sectionIndex: number;
  explanation?: string;
}

export const GameMechanicLab: React.FC<GameMechanicLabProps> = ({
  sectionIndex,
  explanation,
}) => {
  const $completedIndices = useStore(completedIndices);
  const [goal, setGoal] = useState(GOALS[0]);
  const [control, setControl] = useState(CONTROLS[1]);
  const [obstacle, setObstacle] = useState(OBSTACLES[0]);
  const [reward, setReward] = useState(REWARDS[0]);

  const pitch = useMemo(
    () =>
      `Make a game where the player must ${goal.toLowerCase()} using ${control.toLowerCase()} controls, while avoiding ${obstacle.toLowerCase()}. Reward the player with ${reward.toLowerCase()}.`,
    [goal, control, obstacle, reward],
  );

  const done = $completedIndices.has(sectionIndex);

  const finish = async () => {
    await navigator.clipboard?.writeText(pitch).catch(() => {});
    completeSection(sectionIndex, false);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border-2 border-purple-100 bg-white p-5 shadow-sm">
        <div className="mb-5 text-center">
          <p className="text-sm font-black uppercase tracking-widest text-purple-500">
            Game mechanic mixer
          </p>
          <h3 className="mt-1 text-2xl font-black text-slate-800">
            Mix the four pieces
          </h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Picker label="Goal" options={GOALS} value={goal} onChange={setGoal} />
          <Picker label="Control" options={CONTROLS} value={control} onChange={setControl} />
          <Picker label="Obstacle" options={OBSTACLES} value={obstacle} onChange={setObstacle} />
          <Picker label="Reward" options={REWARDS} value={reward} onChange={setReward} />
        </div>
      </div>

      <div className="rounded-3xl border-2 border-emerald-100 bg-emerald-50 p-5">
        <p className="mb-2 text-xs font-black uppercase tracking-widest text-emerald-600">
          Your game loop
        </p>
        <p className="text-lg font-extrabold leading-relaxed text-emerald-900">
          {pitch}
        </p>
      </div>

      {!done && (
        <div className="flex justify-center">
          <button
            onClick={finish}
            className="rounded-full bg-[#8B4EC4] px-8 py-3 text-base font-black text-white shadow-md transition hover:bg-[#7a41b0] active:scale-95"
          >
            Save this game loop
          </button>
        </div>
      )}
      <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />
    </div>
  );
};

function Picker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-black text-slate-700">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full border-2 px-3 py-2 text-sm font-extrabold transition active:scale-95 ${
              value === option
                ? "border-[#8B4EC4] bg-purple-50 text-purple-700"
                : "border-slate-200 bg-white text-slate-500 hover:border-purple-300"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default GameMechanicLab;
