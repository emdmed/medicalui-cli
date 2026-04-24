/**
 * PaFiCalculator — Self-contained PaO2/FiO2 ratio calculator with ARDS classification.
 *
 * @props  None — fully self-contained, no external data flow.
 *
 * @usage
 *   <PaFiCalculator />
 *
 * @behavior
 *   Click card to enter edit mode → input PaO2 + FiO2 → save to see PaFi ratio.
 *   Displays PaFi ratio + ARDS classification badge inline below inputs.
 *   FiO2 presets dropdown: 21% (room air), 28%, 35%, 40%, 50%, 60%, 80%, 100%.
 */
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Check, X, Wind } from "lucide-react";
import {
  calculatePaFi,
  getPaFiClassification,
  getPaFiSeverity,
} from "./lib";

const FIO2_PRESETS = [
  { label: "21% (Room air)", value: "21" },
  { label: "28%", value: "28" },
  { label: "35%", value: "35" },
  { label: "40%", value: "40" },
  { label: "50%", value: "50" },
  { label: "60%", value: "60" },
  { label: "80%", value: "80" },
  { label: "100%", value: "100" },
];

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case "normal":
      return "severity-normal";
    case "mild":
      return "severity-watch";
    case "moderate":
      return "severity-warning";
    case "severe":
      return "severity-critical";
    default:
      return "";
  }
};

const PaFiCalculator = () => {
  const [paO2, setPaO2] = useState("90");
  const [fiO2, setFiO2] = useState("21");
  const [isEditMode, setIsEditMode] = useState(false);
  const [tempPaO2, setTempPaO2] = useState("");
  const [tempFiO2, setTempFiO2] = useState("");

  const labelClass = "text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none";

  const currentPaFi = calculatePaFi(paO2, fiO2);
  const currentClassification = getPaFiClassification(currentPaFi);
  const currentSeverity = getPaFiSeverity(currentPaFi);

  const enterEditMode = () => {
    setTempPaO2(paO2);
    setTempFiO2(fiO2);
    setIsEditMode(true);
  };

  const saveChanges = () => {
    const newPaO2 = parseFloat(tempPaO2);
    const newFiO2 = parseFloat(tempFiO2);

    if (newPaO2 > 0 && newFiO2 >= 21 && newFiO2 <= 100) {
      setPaO2(tempPaO2);
      setFiO2(tempFiO2);
      setIsEditMode(false);
    }
  };

  const cancelEdit = () => {
    setTempPaO2("");
    setTempFiO2("");
    setIsEditMode(false);
  };

  const isValidEdit = () => {
    const pao2Valid = tempPaO2 && parseFloat(tempPaO2) > 0;
    const fio2Valid =
      tempFiO2 && parseFloat(tempFiO2) >= 21 && parseFloat(tempFiO2) <= 100;
    return pao2Valid && fio2Valid;
  };

  if (isEditMode) {
    return (
      <div className="w-fit">
        <div className="border border-border rounded-sm p-2">
          <div className="flex items-center justify-between -mx-2 -mt-2 mb-1 px-2 py-1.5 bg-secondary rounded-t-sm">
            <span className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">PaFi</span>
            <div className="flex gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={saveChanges}
                disabled={!isValidEdit()}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={cancelEdit}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex gap-4">
            <div>
              <Label className={labelClass}>PaO2 (mmHg)</Label>
              <Input
                value={tempPaO2}
                onChange={(e) => setTempPaO2(e.target.value)}
                className="text-end w-[70px] h-6 text-xs"
                placeholder="PaO2"
                min="0"
                step="1"
              />
            </div>

            <div>
              <Label className={labelClass}>FiO2 (%)</Label>
              <Input
                value={tempFiO2}
                onChange={(e) => setTempFiO2(e.target.value)}
                className="text-end w-[70px] h-6 text-xs"
                placeholder="FiO2"
                min="21"
                max="100"
                step="1"
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {FIO2_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    variant={tempFiO2 === preset.value ? "default" : "outline"}
                    size="sm"
                    className="h-5 text-[10px] px-1"
                    onClick={() => setTempFiO2(preset.value)}
                  >
                    {preset.value}%
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-fit">
      <div
        onClick={enterEditMode}
        className="border border-border rounded-sm p-2 cursor-pointer hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold">{currentPaFi || "--"}</div>

          <Badge
            className={`text-xs font-medium ${getSeverityColor(currentSeverity)}`}
          >
            {currentClassification}
          </Badge>
        </div>
        <div className="text-xs space-y-1">
          <div className="flex items-center justify-center gap-1">
            <Wind className="h-3 w-3" />
            <span>
              PaO2 {paO2} mmHg • FiO2 {fiO2}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaFiCalculator;
