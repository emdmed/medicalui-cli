import { useRef, useState } from "react";
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

type BloodOxygenValue = number | null;
type Fio2Value = number | null;
type ClickedComponent = string | null | undefined;

interface Fio2Option {
  value: string;
  label: string;
}

interface BloodOxygenProps {
  bloodOxygenValue: BloodOxygenValue;
  setBloodOxygenValue: (value: BloodOxygenValue) => void;
  fio2Value: Fio2Value;
  setFio2Value: (value: Fio2Value) => void;
  setClickedComponent: (component: ClickedComponent) => void;
  clickedComponent: ClickedComponent;
  editable: boolean;
}

type InputChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => void;
type KeyDownHandler = (e: React.KeyboardEvent<HTMLInputElement>) => void;
type SelectChangeHandler = (value: string) => void;

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
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedFio2, setSelectedFio2] = useState<string>(defaultFio2Value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  const currentFio2Value = fio2Value ? fio2Value.toString() : defaultFio2Value.toString();
  const currentInputValue = bloodOxygenValue ? bloodOxygenValue.toString() : "";
  const isLow: boolean = bloodOxygenValue !== null && BloodOxygenValidations.spo2.isLow(bloodOxygenValue);

  const handleSave = (bloodOxygenInputValue: string, fio2InputValue: string): void => {
    if (BloodOxygenValidations.spo2.isValid(bloodOxygenInputValue)) {
      setBloodOxygenValue(parseInt(bloodOxygenInputValue));

      if (fio2InputValue && BloodOxygenValidations.fio2.isValid(fio2InputValue)) {
        setFio2Value(parseInt(fio2InputValue));
      } else if (fio2Value === null) {
        setFio2Value(defaultFio2Value);
      }
    }
  };

  const handleDelete = (): void => {
    setInputValue("");
    setBloodOxygenValue(null);
    setFio2Value(defaultFio2Value);
    setSelectedFio2(defaultFio2Value.toString());
  };

  const handleCancel = (): void => {
    setClickedComponent("");
    setInputValue("");
    setSelectedFio2(defaultFio2Value.toString());
  };

  const handleFio2SelectChange: SelectChangeHandler = (value: string): void => {
    setSelectedFio2(value);
    setFio2Value(parseInt(value));
  };

  const handleKeyDown: KeyDownHandler = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    const bloodOxygenInputValue: string = e.currentTarget.value;
    const fio2InputValue: string = selectedFio2;

    if (e.key === "Enter" && BloodOxygenValidations.spo2.isValid(bloodOxygenInputValue)) {
      handleSave(bloodOxygenInputValue, fio2InputValue);
      setClickedComponent("");
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleInputChange: InputChangeHandler = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value: string = e.target.value;
    setInputValue(value);

    if (BloodOxygenValidations.spo2.isValid(value)) {
      setBloodOxygenValue(parseInt(value));
    } else if (value === "") {
      setBloodOxygenValue(null);
    }
  };

  const handleEditClick = (): void => {
    setClickedComponent("bloodOxygen");
    setInputValue(currentInputValue);
    setSelectedFio2(currentFio2Value);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  return (
    <div className="px-2 cursor-pointer relative">
      <div
        className={`flex items-center w-full`}
        onClick={handleEditClick}
      >
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
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                min={BloodOxygenValidations.spo2.MIN_VALUE}
                max={BloodOxygenValidations.spo2.MAX_VALUE}
                placeholder="SpO2"
              />

              <div className="flex gap-2 items-center">
                <Select
                  value={selectedFio2}
                  onValueChange={handleFio2SelectChange}
                >
                  <SelectTrigger className="w-[90px]">
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
              <Button size="sm" variant="ghost">
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