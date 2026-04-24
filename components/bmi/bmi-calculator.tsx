/**
 * BMICalculator — Self-contained BMI calculator with metric/imperial toggle.
 *
 * @props  None — fully self-contained, no external data flow.
 *
 * @usage
 *   <BMICalculator />
 *
 * @behavior
 *   Click card to enter edit mode → input weight + height → save to see BMI.
 *   Supports imperial (lbs, ft/in) and metric (kg, m) with live conversion.
 *   Displays BMI category badge: Underweight | Normal | Overweight | Obese.
 */
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, User, ToggleLeft, ToggleRight } from "lucide-react";
import { calculateBMI, getBMICategory } from "./lib";

const BMICalculator = () => {
  const [weight, setWeight] = useState("154");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("9");
  const [heightM, setHeightM] = useState("1.75");
  const [isEditMode, setIsEditMode] = useState(false);
  const [tempWeight, setTempWeight] = useState("");
  const [tempHeightFt, setTempHeightFt] = useState("");
  const [tempHeightIn, setTempHeightIn] = useState("");
  const [tempHeightM, setTempHeightM] = useState("");
  const [isMetric, setIsMetric] = useState(false);

  const labelClass = "text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none";

  const currentBMI = calculateBMI(
    weight,
    heightFt,
    heightIn,
    heightM,
    isMetric,
  );
  const currentCategory = getBMICategory(currentBMI);

  const enterEditMode = () => {
    setTempWeight(weight);
    setTempHeightFt(heightFt);
    setTempHeightIn(heightIn);
    setTempHeightM(heightM);
    setIsEditMode(true);
  };

  const saveChanges = () => {
    const newWeight = parseFloat(tempWeight);

    if (newWeight > 0) {
      if (isMetric) {
        const newHeightM = parseFloat(tempHeightM);
        if (newHeightM > 0) {
          setWeight(tempWeight);
          setHeightM(tempHeightM);
          setIsEditMode(false);
        }
      } else {
        const newHeightFt = parseFloat(tempHeightFt) || 0;
        const newHeightIn = parseFloat(tempHeightIn) || 0;
        if (newHeightFt > 0 || newHeightIn > 0) {
          setWeight(tempWeight);
          setHeightFt(tempHeightFt);
          setHeightIn(tempHeightIn);
          setIsEditMode(false);
        }
      }
    }
  };

  const cancelEdit = () => {
    setTempWeight("");
    setTempHeightFt("");
    setTempHeightIn("");
    setTempHeightM("");
    setIsEditMode(false);
  };

  const toggleUnits = () => {
    const newIsMetric = !isMetric;
    setIsMetric(newIsMetric);

    if (newIsMetric) {
      // Convert from Imperial to Metric
      const lbsToKg = parseFloat(weight) * 0.453592;
      const totalInches = parseFloat(heightFt) * 12 + parseFloat(heightIn);
      const inchesToM = totalInches * 0.0254;
      setWeight(lbsToKg.toFixed(1));
      setHeightM(inchesToM.toFixed(2));
    } else {
      // Convert from Metric to Imperial
      const kgToLbs = parseFloat(weight) / 0.453592;
      const mToInches = parseFloat(heightM) / 0.0254;
      const feet = Math.floor(mToInches / 12);
      const inches = Math.round(mToInches % 12);
      setWeight(kgToLbs.toFixed(0));
      setHeightFt(feet.toString());
      setHeightIn(inches.toString());
    }
  };

  const getWeightUnit = () => (isMetric ? "kg" : "lbs");
  const getHeightDisplay = () => {
    if (isMetric) {
      return `${heightM}m`;
    } else {
      return `${heightFt}'${heightIn}"`;
    }
  };

  const isValidEdit = () => {
    const weightValid = tempWeight && parseFloat(tempWeight) > 0;
    if (isMetric) {
      const heightValid = tempHeightM && parseFloat(tempHeightM) > 0;
      return weightValid && heightValid;
    } else {
      const ftValid = tempHeightFt && parseFloat(tempHeightFt) >= 0;
      const inValid = tempHeightIn && parseFloat(tempHeightIn) >= 0;
      const totalValid =
        (parseFloat(tempHeightFt) || 0) > 0 ||
        (parseFloat(tempHeightIn) || 0) > 0;
      return weightValid && ftValid && inValid && totalValid;
    }
  };

  if (isEditMode) {
    return (
      <div className="w-fit">
        <div className="border border-border rounded-sm p-2">
          <div className="flex items-center justify-between -mx-2 -mt-2 mb-1 px-2 py-1.5 bg-secondary rounded-t-sm">
            <span className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">BMI</span>
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

          <div className={`flex gap-4 ${isMetric ? "" : "flex-col"} `}>
            <div>
              <label className={labelClass}>Weight ({getWeightUnit()})</label>
              <Input
                value={tempWeight}
                onChange={(e) => setTempWeight(e.target.value)}
                className="text-end w-[60px] h-6 text-xs"
                placeholder="Weight"
                min="0"
                step={isMetric ? "0.1" : "1"}
              />
            </div>

            {isMetric ? (
              <div>
                <label className={labelClass}>Height (m)</label>
                <Input
                  value={tempHeightM}
                  onChange={(e) => setTempHeightM(e.target.value)}
                  className="text-end w-[60px] h-6 text-xs"
                  placeholder="Height"
                  min="0"
                  step="0.01"
                />
              </div>
            ) : (
              <div className="gap-3">
                <label className={labelClass}>Height (ft)</label>
                <div className="gap-2 flex justify-between items-center">
                  <div>
                    <label className={labelClass}>Feet</label>
                    <Input
                      value={tempHeightFt}
                      onChange={(e) => setTempHeightFt(e.target.value)}
                      className="text-end w-[50px] h-6 text-xs"
                      placeholder="Ft"
                      min="0"
                      step="1"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Inches</label>
                    <Input
                      value={tempHeightIn}
                      onChange={(e) => setTempHeightIn(e.target.value)}
                      className="text-end w-[50px] h-6 text-xs"
                      placeholder="In"
                      min="0"
                      max="11"
                      step="1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-start gap-1 py-2 text-muted-foreground">
            <span className={`text-xs ${!isMetric ? "font-semibold" : ""}`}>
              Imperial
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleUnits}
              className="h-5 w-8 p-0 hover:bg-transparent"
            >
              {isMetric ? (
                <ToggleRight className="h-4 w-4" />
              ) : (
                <ToggleLeft className="h-4 w-4" />
              )}
            </Button>
            <span className={`text-xs ${isMetric ? "font-semibold" : ""}`}>
              Metric
            </span>
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
          <div className="text-2xl font-bold">{currentBMI || "--"}</div>

          <Badge className="text-xs font-medium">
            {currentCategory}
          </Badge>
        </div>
        <div className="text-xs space-y-1">
          <div className="flex items-center justify-center gap-1">
            <User className="h-3 w-3" />
            <span>
              {weight}
              {getWeightUnit()} • {getHeightDisplay()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BMICalculator;
