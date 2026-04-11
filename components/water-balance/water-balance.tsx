/**
 * WaterBalanceCalculator — Fluid intake/output tracker with net balance.
 *
 * @props
 *   data? — { weight?: number, intakeOral?: number, intakeIv?: number,
 *             diuresis?: number, defecations?: number }
 *           Initial values to hydrate the calculator. All fields optional.
 *
 * @usage
 *   <WaterBalanceCalculator data={{ weight: 70, intakeOral: 1500, intakeIv: 500, diuresis: 1200, defecations: 2 }} />
 *   <WaterBalanceCalculator />  // starts empty, user fills in via edit mode
 *
 * @calculations
 *   Insensible loss     = weight × 12 mL
 *   Endogenous water    = weight × 4.5 mL
 *   Defecation loss     = count × 120 mL
 *   Net balance         = (oral + IV + endogenous) - (diuresis + defecation + insensible)
 *
 * @behavior  Click card to enter edit mode. No callbacks — display only.
 */
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  safeParseFloat,
  calculateInsensibleLoss,
  calculateEndogenousGeneration,
  calculateDefecationLoss,
  calculateWaterBalance as calculateWaterBalanceLib,
} from "./lib";

interface WaterBalanceData {
  weight?: number | string;
  intakeOral?: number | string;
  intakeIv?: number | string;
  diuresis?: number | string;
  defecations?: number | string;
}

interface WaterBalanceProps {
  data?: WaterBalanceData;
}

const WaterBalanceCalculator = ({ data }: WaterBalanceProps) => {
  // Convert incoming data to strings, handling both numbers and strings
  const [weight, setWeight] = useState(data?.weight ? String(data.weight) : "");
  const [fluidIntakeOral, setFluidIntakeOral] = useState(
    data?.intakeOral ? String(data.intakeOral) : "",
  );
  const [fluidIntakeIV, setFluidIntakeIV] = useState(
    data?.intakeIv ? String(data.intakeIv) : "",
  );
  const [diuresis, setDiuresis] = useState(
    data?.diuresis ? String(data.diuresis) : "",
  );
  const [defecationCount, setDefecationCount] = useState(
    data?.defecations ? String(data.defecations) : "",
  );
  const [isEditMode, setIsEditMode] = useState(false);

  // Temporary values for editing
  const [tempWeight, setTempWeight] = useState("");
  const [tempFluidIntakeOral, setTempFluidIntakeOral] = useState("");
  const [tempFluidIntakeIV, setTempFluidIntakeIV] = useState("");
  const [tempDiuresis, setTempDiuresis] = useState("");
  const [tempDefecationCount, setTempDefecationCount] = useState("");

  const calculateWaterBalance = () => {
    return calculateWaterBalanceLib(weight, fluidIntakeOral, fluidIntakeIV, diuresis, defecationCount);
  };

  const currentBalance = calculateWaterBalance();

  const enterEditMode = () => {
    setTempWeight(weight);
    setTempFluidIntakeOral(fluidIntakeOral);
    setTempFluidIntakeIV(fluidIntakeIV);
    setTempDiuresis(diuresis);
    setTempDefecationCount(defecationCount);
    setIsEditMode(true);
  };

  const saveChanges = () => {
    const values = [
      tempWeight,
      tempFluidIntakeOral,
      tempFluidIntakeIV,
      tempDiuresis,
      tempDefecationCount,
    ];

    const allValid = values.every(
      (val) => val !== "" && safeParseFloat(val) >= 0,
    );

    if (allValid) {
      setWeight(tempWeight);
      setFluidIntakeOral(tempFluidIntakeOral);
      setFluidIntakeIV(tempFluidIntakeIV);
      setDiuresis(tempDiuresis);
      setDefecationCount(tempDefecationCount);
      setIsEditMode(false);
    }
  };

  const cancelEdit = () => {
    setTempWeight("");
    setTempFluidIntakeOral("");
    setTempFluidIntakeIV("");
    setTempDiuresis("");
    setTempDefecationCount("");
    setIsEditMode(false);
  };

  const isValidEdit = () => {
    const values = [
      tempWeight,
      tempFluidIntakeOral,
      tempFluidIntakeIV,
      tempDiuresis,
      tempDefecationCount,
    ];

    return values.every((val) => val !== "" && safeParseFloat(val) >= 0);
  };

  const weightNum = safeParseFloat(weight);
  const insensibleLoss = calculateInsensibleLoss(weightNum);
  const endogenousGeneration = calculateEndogenousGeneration(weightNum);
  const defecationLoss = calculateDefecationLoss(defecationCount);
  const labelClass = "opacity-60 text-xs my-1";

  if (isEditMode) {
    return (
      <div className="w-fit">
        <Card className="shadow-lg border p-0">
          <CardContent className="p-2">
            <div className="flex items-center justify-between mb-1 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Water Balance</span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={saveChanges}
                  disabled={!isValidEdit()}
                >
                  <Check />
                </Button>
                <Button size="icon" variant="ghost" onClick={cancelEdit}>
                  <X />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2 py-2">
              <Label>In</Label>
              <div className="flex items-center justify-between">
                <div>
                  <Label className={labelClass}>Oral (mL)</Label>
                  <Input
                    value={tempFluidIntakeOral}
                    onChange={(e) => setTempFluidIntakeOral(e.target.value)}
                    className="text-end w-[60px]"
                    placeholder="0"
                    min="0"
                    step="50"
                  />
                </div>
                <div>
                  <Label className={labelClass}>IV (mL)</Label>
                  <Input
                    value={tempFluidIntakeIV}
                    onChange={(e) => setTempFluidIntakeIV(e.target.value)}
                    className="text-end w-[60px]"
                    placeholder="0"
                    min="0"
                    step="50"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 py-2 border-t">
              <Label>Out</Label>
              <div className="flex items-center justify-between">
                <div>
                  <Label className={labelClass}>Urine (mL)</Label>
                  <Input
                    value={tempDiuresis}
                    onChange={(e) => setTempDiuresis(e.target.value)}
                    className="text-end w-[60px]"
                    placeholder="0"
                    min="0"
                    step="50"
                  />
                </div>
                <div>
                  <Label className={labelClass}>Stools (#)</Label>
                  <Input
                    value={tempDefecationCount}
                    onChange={(e) => setTempDefecationCount(e.target.value)}
                    className="text-end w-[60px]"
                    placeholder="1"
                    min="0"
                    max="20"
                    step="1"
                  />
                </div>
              </div>
            </div>
            <div className="py-2 border-t">
              <Label className={labelClass}>Weight (kg)</Label>
              <Input
                value={tempWeight}
                onChange={(e) => setTempWeight(e.target.value)}
                className="text-end w-[60px]"
                placeholder="70"
                min="0"
                step="0.1"
              />
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
          <div className="flex justify-between gap-2 items-center">
            <span className="font-medium">Water balance</span>

            <div className="text-2xl font-bold">
              {Number(currentBalance) > 0 ? "+" : ""}
              {currentBalance || "--"}
            </div>
          </div>
          <div className="text-xs space-y-1 py-1">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              {/* <Badge variant="outline" className="text-xs">
                {weight}kg
              </Badge> */}
              <Badge variant="default">
                IN:{" "}
                {(
                  safeParseFloat(fluidIntakeOral) +
                  safeParseFloat(fluidIntakeIV) +
                  safeParseFloat(endogenousGeneration)
                ).toFixed(0)}
                mL
              </Badge>
              <Badge variant="secondary">
                OUT:{" "}
                {(
                  safeParseFloat(diuresis) +
                  safeParseFloat(defecationLoss) +
                  safeParseFloat(insensibleLoss)
                ).toFixed(0)}
                mL
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaterBalanceCalculator;
