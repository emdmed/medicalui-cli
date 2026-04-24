/**
 * HEARTScoreCalculator — Self-contained HEART Score calculator for chest pain triage.
 *
 * @props  None — fully self-contained, no external data flow.
 * @behavior  Click card to enter edit mode → select criteria → save to see score + recommendation.
 */
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Activity } from "lucide-react";
import {
  calculateHEARTScore,
  getHEARTCategory,
  getHEARTAction,
  getHEARTSeverity,
} from "../lib";
import type { HEARTInputs } from "../types/interfaces";

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case "low":
      return "severity-normal";
    case "moderate":
      return "severity-warning";
    case "high":
      return "severity-critical";
    default:
      return "";
  }
};

type Criterion = keyof HEARTInputs;

interface CriterionConfig {
  key: Criterion;
  label: string;
  options: [string, string, string]; // labels for 0, 1, 2
}

const CRITERIA: CriterionConfig[] = [
  {
    key: "history",
    label: "History",
    options: ["Slightly suspicious", "Moderately suspicious", "Highly suspicious"],
  },
  {
    key: "ecg",
    label: "ECG",
    options: ["Normal", "Non-specific changes", "Significant ST deviation"],
  },
  {
    key: "age",
    label: "Age",
    options: ["< 45", "45-64", "≥ 65"],
  },
  {
    key: "riskFactors",
    label: "Risk Factors",
    options: ["No known factors", "1-2 risk factors", "≥ 3 or history of atherosclerosis"],
  },
  {
    key: "troponin",
    label: "Troponin",
    options: ["≤ normal limit", "1-3× normal limit", "> 3× normal limit"],
  },
];

const DEFAULTS: HEARTInputs = {
  history: 0,
  ecg: 0,
  age: 0,
  riskFactors: 0,
  troponin: 0,
};

const HEARTScoreCalculator = () => {
  const [inputs, setInputs] = useState<HEARTInputs>(DEFAULTS);
  const [isEditMode, setIsEditMode] = useState(false);
  const [temp, setTemp] = useState<HEARTInputs>(DEFAULTS);

  const score = calculateHEARTScore(inputs);
  const category = getHEARTCategory(score);
  const action = getHEARTAction(score);
  const severity = getHEARTSeverity(score);

  const enterEditMode = () => {
    setTemp({ ...inputs });
    setIsEditMode(true);
  };

  const saveChanges = () => {
    setInputs({ ...temp });
    setIsEditMode(false);
  };

  const cancelEdit = () => setIsEditMode(false);

  if (isEditMode) {
    return (
      <div className="w-full">
        <div className="border border-border rounded-sm p-2">
          <div className="flex items-center justify-between -mx-2 -mt-2 mb-1 px-2 py-1.5 bg-secondary rounded-t-sm">
            <span className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">HEART Score</span>
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={saveChanges}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={cancelEdit}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {CRITERIA.map((criterion) => (
              <div key={criterion.key}>
                <div className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none mb-1">{criterion.label}</div>
                <div className="flex flex-col gap-1">
                  {criterion.options.map((label, value) => (
                    <Button
                      key={value}
                      variant={temp[criterion.key] === value ? "default" : "outline"}
                      size="sm"
                      className="h-6 text-xs justify-start px-2"
                      onClick={() =>
                        setTemp((prev) => ({
                          ...prev,
                          [criterion.key]: value as 0 | 1 | 2,
                        }))
                      }
                    >
                      <span className="font-mono mr-1.5">{value}</span> {label}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        onClick={enterEditMode}
        className="border border-border rounded-sm p-2 cursor-pointer hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold">{score}/10</div>
          <Badge className={`text-xs font-medium ${getSeverityColor(severity)}`}>
            {category}
          </Badge>
        </div>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            <span>HEART Score</span>
          </div>
          <div className="text-muted-foreground">{action}</div>
        </div>
      </div>
    </div>
  );
};

export default HEARTScoreCalculator;
