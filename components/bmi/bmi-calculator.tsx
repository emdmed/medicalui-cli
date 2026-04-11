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
import { Card, CardContent } from "@/components/ui/card";
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

  const labelClass = "cmb-1 text-sm opacity-50";

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
      <div className="w-fit mx-auto">
        <Card className="shadow-lg border p-0">
          <CardContent className="p-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span>BMI</span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={saveChanges}
                  disabled={!isValidEdit()}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" onClick={cancelEdit}>
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
                  className="text-end w-[60px]"
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
                    className="text-end w-[60px]"
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
                        className="text-end w-[50px]"
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
                        className="text-end w-[50px]"
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
            <div className="flex items-center justify-start gap-1 py-2 opacity-50">
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-fit mx-auto">
      <Card
        onClick={enterEditMode}
        className="cursor-pointer hover:shadow-md transition-shadow duration-200 p-1"
      >
        <CardContent className="p-2">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default BMICalculator;
