import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Result, Values } from "./types/interfaces";
import { analyze } from "./analyze";
import Popup from "./components/popup";
import {
  Eye,
  LucideEyeOff,
  RotateCcwIcon,
} from "lucide-react";

const DEFAULT_VALUES = {
  ph: {
    min: 7.35,
    max: 7.45
  },
  pCO2: {
    min: 36,
    max: 44
  },
  HCO3: {
    min: 22,
    max: 26
  }
}

const PLACEHOLDERS = {
  ph: "7.40",
  pCO2: "40",
  HCO3: "24",
  na: "140",
  cl: "104",
  albumin: "4"
}

const AcidBase = ({ onData }) => {
  const [values, setValues] = useState<Values>({
    pH: "",
    pCO2: "",
    HCO3: "",
    Na: "",
    Cl: "",
    Albumin: "",
  });
  const [isChronic, setIsChronic] = useState<boolean>(true);
  const [result, setResult] = useState<Result | null>(null);
  const [display, setDisplay] = useState<boolean>(true);

  const safeFloat = (val: string): number | null => {
    if (val.trim() === "") return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };

  const reset = (e) => {
    e.stopPropagation();

    setValues({
      pH: "",
      pCO2: "",
      HCO3: "",
      Na: "",
      Cl: "",
      Albumin: "",
    });
  };

  useEffect(() => {
    setResult(analyze({ values, isChronic }));
  }, [values, isChronic]);

  useEffect(() => {
    onData(result);
  }, [result]);

  const handleChange = (field: keyof Values, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const getInputClass = (value: string, min: number, max: number) => {
    if (!value) return "";
    const num = safeFloat(value);
    if (num === null) return "";
    return num < min || num > max
      ? "border-red-300 bg-red-50"
      : "border-green-300 bg-green-50";
  };

  const animations =
    "transition-all duration-300 ease-out animate-in slide-in-from-bottom-2";

  const isVisible = !!result && display;

  const handleDisplay = () => {
    setDisplay((prev) => !prev);
  };
  return (
    <Card className="flex py-1 px-2 gap-2 relative w-fit">
      <CardContent className="space-y-2 p-1 flex">
        <Popup visible={isVisible}>
          <div className="flex-col flex gap-1">
            <div className="flex gap-1">
              {result?.allDisorders?.map((disorder) => (
                <Badge variant="destructive" className={animations}>
                  {disorder}
                </Badge>
              ))}
            </div>

            <div className="flex gap-1">
              {result?.compensation !== "N/A" && (
                <div className="flex gap-1">
                  <Badge variant="outline" className={animations}>
                    {result?.compensation}
                  </Badge>
                  <Badge variant="outline" className={animations}>
                    by {result?.compensatoryResponse}
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex gap-1">
              {result?.expectedValues.low && result?.expectedValues.high && (
                <Badge className={animations}>
                  E. HCO3: {result?.expectedValues.low} |{" "}
                  {result?.expectedValues.high}
                </Badge>
              )}
              {result?.anionGap && (
                <Badge className={animations}>
                  Anion Gap {result?.anionGap} ({result?.agStatus})
                </Badge>
              )}
            </div>
          </div>
        </Popup>
        <div className="flex gap-2 justify-between">
          <div className="flex gap-1">
            <div>
              <Label className="text-xs">pH*</Label>
              <Input
                onClick={(e) => e.stopPropagation()}
                type="number"
                step="0.01"
                placeholder={PLACEHOLDERS.ph}
                value={values.pH}
                onChange={(e) => handleChange("pH", e.target.value)}
                className={`h-8 w-[80px] text-sm ${getInputClass(
                  values.pH,
                  DEFAULT_VALUES.ph.min,
                  DEFAULT_VALUES.ph.max,
                )}`}
              />
            </div>
            <div>
              <Label className="text-xs">pCO₂*</Label>
              <Input
                onClick={(e) => e.stopPropagation()}
                type="number"
                placeholder={PLACEHOLDERS.pCO2}
                value={values.pCO2}
                onChange={(e) => handleChange("pCO2", e.target.value)}
                className={`h-8 w-[65px] text-sm ${getInputClass(
                  values.pCO2,
                  DEFAULT_VALUES.pCO2.min,
                  DEFAULT_VALUES.pCO2.max,
                )}`}
              />
            </div>
            <div>
              <Label className="text-xs">HCO₃*</Label>
              <Input
                onClick={(e) => e.stopPropagation()}
                type="number"
                placeholder={PLACEHOLDERS.HCO3}
                value={values.HCO3}
                onChange={(e) => handleChange("HCO3", e.target.value)}
                className={`h-8 w-[65px] text-sm ${getInputClass(
                  values.HCO3,
                  DEFAULT_VALUES.HCO3.min,
                  DEFAULT_VALUES.HCO3.max,
                )}`}
              />
            </div>
            <div>
              <Label className="text-xs">Na⁺</Label>
              <Input
                onClick={(e) => e.stopPropagation()}
                type="number"
                placeholder={PLACEHOLDERS.na}
                value={values.Na}
                onChange={(e) => handleChange("Na", e.target.value)}
                className="h-8 w-[75px] text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Cl⁻</Label>
              <Input
                onClick={(e) => e.stopPropagation()}
                type="number"
                placeholder={PLACEHOLDERS.cl}
                value={values.Cl}
                onChange={(e) => handleChange("Cl", e.target.value)}
                className="h-8 w-[75px] text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Albumin</Label>
              <Input
                onClick={(e) => e.stopPropagation()}
                type="number"
                placeholder={PLACEHOLDERS.albumin}
                value={values.Albumin}
                onChange={(e) => handleChange("Albumin", e.target.value)}
                className="h-8 w-[75px] text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col justify-between px-1">
            <div onClick={handleDisplay}>
              {isVisible ? (
                <Eye className="h-3 w-3" />
              ) : (
                <LucideEyeOff className="h-3 w-3" />
              )}
            </div>
            <div onClick={(e) => reset(e)}>
              <RotateCcwIcon className="h-3 w-3" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AcidBase;
