/**
 * ASCVDCalculator — Self-contained 10-year ASCVD risk estimator (Pooled Cohort Equations).
 *
 * @props  None — fully self-contained, no external data flow.
 * @behavior  Click card to enter edit mode → input values → save to see 10-year risk.
 */
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Check, X, Heart } from "lucide-react";
import {
  calculateASCVD,
  getASCVDCategory,
  getASCVDSeverity,
} from "../lib";
import type { ASCVDInputs } from "../types/interfaces";

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case "low":
      return "severity-normal";
    case "borderline":
      return "severity-watch";
    case "intermediate":
      return "severity-warning";
    case "high":
      return "severity-critical";
    default:
      return "";
  }
};

const DEFAULTS: ASCVDInputs = {
  age: "55",
  sex: "male",
  race: "white",
  totalCholesterol: "213",
  hdlCholesterol: "50",
  systolicBP: "120",
  bpTreatment: false,
  diabetes: false,
  smoker: false,
};

const ASCVDCalculator = () => {
  const [inputs, setInputs] = useState<ASCVDInputs>(DEFAULTS);
  const [isEditMode, setIsEditMode] = useState(false);
  const [temp, setTemp] = useState<ASCVDInputs>(DEFAULTS);

  const labelClass = "text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none";

  const risk = calculateASCVD(inputs);
  const category = getASCVDCategory(risk);
  const severity = getASCVDSeverity(risk);

  const enterEditMode = () => {
    setTemp({ ...inputs });
    setIsEditMode(true);
  };

  const saveChanges = () => {
    const result = calculateASCVD(temp);
    if (result !== null) {
      setInputs({ ...temp });
      setIsEditMode(false);
    }
  };

  const cancelEdit = () => setIsEditMode(false);

  const updateTemp = (field: keyof ASCVDInputs, value: string | boolean) => {
    setTemp((prev) => ({ ...prev, [field]: value }));
  };

  const isValidEdit = () => calculateASCVD(temp) !== null;

  if (isEditMode) {
    return (
      <div className="w-full">
        <div className="border border-border rounded-sm p-2">
          <div className="flex items-center justify-between -mx-2 -mt-2 mb-1 px-2 py-1.5 bg-secondary rounded-t-sm">
            <span className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">ASCVD Risk</span>
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={saveChanges} disabled={!isValidEdit()}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={cancelEdit}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <Label className={labelClass}>Age (40-79)</Label>
              <Input
                value={temp.age}
                onChange={(e) => updateTemp("age", e.target.value)}
                className="text-end w-full h-6 text-xs"
                placeholder="Age"
              />
            </div>
            <div>
              <Label className={labelClass}>Systolic BP</Label>
              <Input
                value={temp.systolicBP}
                onChange={(e) => updateTemp("systolicBP", e.target.value)}
                className="text-end w-full h-6 text-xs"
                placeholder="mmHg"
              />
            </div>
            <div>
              <Label className={labelClass}>Total Cholesterol</Label>
              <Input
                value={temp.totalCholesterol}
                onChange={(e) => updateTemp("totalCholesterol", e.target.value)}
                className="text-end w-full h-6 text-xs"
                placeholder="mg/dL"
              />
            </div>
            <div>
              <Label className={labelClass}>HDL Cholesterol</Label>
              <Input
                value={temp.hdlCholesterol}
                onChange={(e) => updateTemp("hdlCholesterol", e.target.value)}
                className="text-end w-full h-6 text-xs"
                placeholder="mg/dL"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <div>
              <Label className={labelClass}>Sex</Label>
              <div className="flex gap-1">
                {(["male", "female"] as const).map((s) => (
                  <Button
                    key={s}
                    variant={temp.sex === s ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={() => updateTemp("sex", s)}
                  >
                    {s === "male" ? "Male" : "Female"}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className={labelClass}>Race</Label>
              <div className="flex gap-1">
                {(["white", "aa", "other"] as const).map((r) => (
                  <Button
                    key={r}
                    variant={temp.race === r ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={() => updateTemp("race", r)}
                  >
                    {r === "aa" ? "AA" : r === "white" ? "White" : "Other"}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-2">
            {(
              [
                ["bpTreatment", "BP Treatment"],
                ["diabetes", "Diabetes"],
                ["smoker", "Smoker"],
              ] as const
            ).map(([field, label]) => (
              <label key={field} className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={temp[field] as boolean}
                  onChange={(e) => updateTemp(field, e.target.checked)}
                  className="rounded"
                />
                {label}
              </label>
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
          <div className="text-2xl font-bold">{risk ? `${risk}%` : "--"}</div>
          <Badge className={`text-xs font-medium ${getSeverityColor(severity)}`}>
            {category}
          </Badge>
        </div>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            <span>10-year ASCVD Risk</span>
          </div>
          <div className="text-muted-foreground">
            {inputs.age}yo {inputs.sex} • TC {inputs.totalCholesterol} • HDL{" "}
            {inputs.hdlCholesterol} • SBP {inputs.systolicBP}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ASCVDCalculator;
