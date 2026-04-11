/**
 * HEARTScoreCalculator — Self-contained HEART Score calculator for chest pain triage.
 *
 * @props  None — fully self-contained, no external data flow.
 * @behavior  Click card to enter edit mode → select criteria → save to see score + recommendation.
 */
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "moderate":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "high":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
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
        <Card className="shadow-lg border p-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">HEART Score</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={saveChanges}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" onClick={cancelEdit}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {CRITERIA.map((criterion) => (
                <div key={criterion.key}>
                  <div className="text-sm font-medium mb-1">{criterion.label}</div>
                  <div className="flex flex-col gap-1">
                    {criterion.options.map((label, value) => (
                      <Button
                        key={value}
                        variant={temp[criterion.key] === value ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs justify-start px-2"
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card
        onClick={enterEditMode}
        className="cursor-pointer hover:shadow-md transition-shadow duration-200 p-1"
      >
        <CardContent className="p-2">
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
            <div className="opacity-60">{action}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HEARTScoreCalculator;
