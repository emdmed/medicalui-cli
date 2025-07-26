import { useRef, useEffect } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import VitalSignsAlert from "@/components/vital-signs/components/vital-signs-alert";
import EditSection from "@/components/vital-signs/components/edit-section";

import { BloodOxygenValidations } from "@/components/vital-signs/validations/blood-oxygen-validations";

import { BloodOxygenProps, Fio2Option, SelectChangeHandler, InputChangeHandler, KeyDownHandler } from "../types/vital-signs";


const defaultFio2Value: number = BloodOxygenValidations.fio2.DEFAULT_VALUE;

const commonFio2Values: Fio2Option[] = [
  { value: "21", label: "21%" },
  { value: "24", label: "24%" },
  { value: "28", label: "28%" },
  { value: "35", label: "35%" },
  { value: "40", label: "40%" },
  { value: "50", label: "50%" },
  { value: "60", label: "60%" },
  { value: "70", label: "70%" },
  { value: "80", label: "80%" },
  { value: "90", label: "90%" },
  { value: "100", label: "100%" },
];

const BloodOxygen: React.FC<BloodOxygenProps> = ({
  bloodOxygenValue,
  setBloodOxygenValue,
  fio2Value,
  setFio2Value,
  setClickedComponent,
  clickedComponent,
  editable
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLButtonElement>(null);

  const currentFio2Value = fio2Value ? fio2Value.toString() : defaultFio2Value.toString();
  const isLow: boolean = bloodOxygenValue !== null && BloodOxygenValidations.spo2.isLow(bloodOxygenValue);

  useEffect(() => {
    if (clickedComponent === "bloodOxygen" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [clickedComponent]);

  const handleDelete = (): void => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setBloodOxygenValue(null);
    setFio2Value(defaultFio2Value);
  };

  const handleCancel = (): void => {
    setClickedComponent("");
  };

  const handleFio2SelectChange: SelectChangeHandler = (value: string): void => {
    setFio2Value(parseInt(value));
  };

  const handleKeyDown: KeyDownHandler = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    const bloodOxygenInputValue: string = e.currentTarget.value;

    if (e.key === "Enter" && BloodOxygenValidations.spo2.isValid(bloodOxygenInputValue)) {
      setClickedComponent(""); // or next component
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleInputChange: InputChangeHandler = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value: string = e.target.value;

    if (BloodOxygenValidations.spo2.isValid(value)) {
      setBloodOxygenValue(parseInt(value));
    }
  };

  const handleEditClick = (): void => {
    setClickedComponent("bloodOxygen");
  };

  return (
    <div className="px-2 cursor-pointer relative" onClick={handleEditClick}>
      <div className="flex items-center w-full">
        <div className="flex items-center">
          <EditSection
            clickedComponent={clickedComponent}
            parentComponent="bloodOxygen"
            editable={editable}
            handleCancel={handleCancel}
            handleDelete={handleDelete}
          >
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                className="w-[60px] text-center"
                defaultValue={bloodOxygenValue || ""}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                min={BloodOxygenValidations.spo2.MIN_VALUE}
                max={BloodOxygenValidations.spo2.MAX_VALUE}
                placeholder="SpO2"
              />

              <div className="flex gap-2 items-center">
                <Select
                  value={currentFio2Value}
                  onValueChange={handleFio2SelectChange}
                >
                  <SelectTrigger ref={selectRef} className="w-[90px]">
                    <SelectValue placeholder="Select FiO2" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonFio2Values.map((option: Fio2Option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </EditSection>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {bloodOxygenValue !== null ? (
              <span className="flex items-baseline gap-2  hover:text-accent-foreground transition-all">
                {bloodOxygenValue}{" "}
                <small className="flex items-baseline gap-2">
                  <small className="opacity-50">%</small>
                  <Badge
                    className="ms-1"
                    variant={BloodOxygenValidations.fio2.isSupplemental(fio2Value as number) ? "destructive" : "secondary"}
                  >
                    {fio2Value}%
                  </Badge>
                </small>
              </span>
            ) : (
              <Button size="sm" variant="ghost" className="text-xs">
                O2 Saturation
              </Button>
            )}
          </div>
        </div>
      </div>

      {isLow && <VitalSignsAlert text="low" />}
    </div>
  );
};

export default BloodOxygen;