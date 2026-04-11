/**
 * CHADSVAScCalculator — Self-contained CHA₂DS₂-VASc stroke risk calculator for AF.
 *
 * @props  None — fully self-contained, no external data flow.
 * @behavior  Click card to enter edit mode → check risk factors → save to see score + guidance.
 */
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Zap } from "lucide-react";
import {
  calculateCHADSVASc,
  getCHADSVAScCategory,
  getCHADSVAScAction,
  getCHADSVAScSeverity,
} from "../lib";
import type { CHADSVAScInputs } from "../types/interfaces";

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

interface CheckboxConfig {
  key: keyof CHADSVAScInputs;
  label: string;
  points: string;
}

const CHECKBOXES: CheckboxConfig[] = [
  { key: "chf", label: "CHF / LV dysfunction", points: "+1" },
  { key: "hypertension", label: "Hypertension", points: "+1" },
  { key: "age75", label: "Age ≥ 75", points: "+2" },
  { key: "diabetes", label: "Diabetes mellitus", points: "+1" },
  { key: "stroke", label: "Stroke / TIA / Thromboembolism", points: "+2" },
  { key: "vascularDisease", label: "Vascular disease (MI, PAD, aortic plaque)", points: "+1" },
  { key: "age65", label: "Age 65-74", points: "+1" },
  { key: "sexFemale", label: "Sex category (female)", points: "+1" },
];

const DEFAULTS: CHADSVAScInputs = {
  chf: false,
  hypertension: false,
  age75: false,
  diabetes: false,
  stroke: false,
  vascularDisease: false,
  age65: false,
  sexFemale: false,
};

const CHADSVAScCalculator = () => {
  const [inputs, setInputs] = useState<CHADSVAScInputs>(DEFAULTS);
  const [isEditMode, setIsEditMode] = useState(false);
  const [temp, setTemp] = useState<CHADSVAScInputs>(DEFAULTS);

  const score = calculateCHADSVASc(inputs);
  const category = getCHADSVAScCategory(score, inputs.sexFemale);
  const action = getCHADSVAScAction(score, inputs.sexFemale);
  const severity = getCHADSVAScSeverity(score, inputs.sexFemale);

  const enterEditMode = () => {
    setTemp({ ...inputs });
    setIsEditMode(true);
  };

  const saveChanges = () => {
    setInputs({ ...temp });
    setIsEditMode(false);
  };

  const cancelEdit = () => setIsEditMode(false);

  const toggleField = (field: keyof CHADSVAScInputs) => {
    setTemp((prev) => {
      const next = { ...prev, [field]: !prev[field] };
      // Mutual exclusivity: age75 and age65
      if (field === "age75" && next.age75) next.age65 = false;
      if (field === "age65" && next.age65) next.age75 = false;
      return next;
    });
  };

  if (isEditMode) {
    return (
      <div className="w-full">
        <Card className="shadow-lg border p-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">CHA₂DS₂-VASc</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={saveChanges}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" onClick={cancelEdit}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {CHECKBOXES.map(({ key, label, points }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={temp[key]}
                    onChange={() => toggleField(key)}
                    className="rounded"
                  />
                  <span className="flex-1">{label}</span>
                  <span className="text-xs opacity-50 font-mono">{points}</span>
                </label>
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
            <div className="text-2xl font-bold">{score}/9</div>
            <Badge className={`text-xs font-medium ${getSeverityColor(severity)}`}>
              {category}
            </Badge>
          </div>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>CHA₂DS₂-VASc</span>
            </div>
            <div className="opacity-60">{action}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CHADSVAScCalculator;
