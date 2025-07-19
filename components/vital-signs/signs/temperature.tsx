import { useRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components//ui/button";
import { Trash2, Check } from "lucide-react";
import VitalSignsAlert from "@/components/vital-signs/components/vital-signs-alert";
import EditSection from "@/components/vital-signs/components/edit-section";
import {
  validateTemperatureInput,
  getTemperatureStatus,
  parseTemperatureValue,
  getTemperatureLimits,
} from "@/components/vital-signs/validations/temperature-validations";

interface TemperatureProps {
  temperatureValue: string | number;
  setTemperatureValue: (value: string | number) => void;
  useFahrenheit?: boolean;
  setClickedComponent: (component: string) => void;
  clickedComponent: string;
  editable: boolean;
}

const Temperature: React.FC<TemperatureProps> = ({
  temperatureValue,
  setTemperatureValue,
  useFahrenheit = true,
  setClickedComponent,
  clickedComponent,
  editable
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayEdit, setDisplayEdit] = useState<boolean>(false);

  const handleSave = (): void => {
    if (validateTemperatureInput(temperatureValue, useFahrenheit)) {
      setTemperatureValue(parseTemperatureValue(temperatureValue));
    }
  };

  useEffect(() => {
    if (clickedComponent === "temperature") setDisplayEdit(true);
  }, [clickedComponent]);

  useEffect(() => {
    if (displayEdit && inputRef.current) inputRef.current.focus();
  }, [displayEdit]);

  const handleDelete = (): void => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setTemperatureValue("");
  };

  const handleCancel = (): void => {
    setDisplayEdit(false);
    setClickedComponent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && validateTemperatureInput(e.currentTarget.value, useFahrenheit)) {
      handleSave();
      setClickedComponent("bloodOxygen");
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleEditClick = (): void => {
    setClickedComponent("temperature");
    setDisplayEdit(true);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    if (validateTemperatureInput(value, useFahrenheit)) {
      setTemperatureValue(value);
    }
  };

  const temperatureStatus = getTemperatureStatus(temperatureValue, useFahrenheit);
  const limits = getTemperatureLimits(useFahrenheit);

  const handleSaveClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    handleSave();
    setClickedComponent("bloodOxygen");
  };

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    handleDelete();
  };

  return (
    <div className="px-2 cursor-pointer relative">
      <div className="flex items-center" onClick={handleEditClick}>
        <EditSection
          clickedComponent={clickedComponent}
          parentComponent="temperature"
          editable={editable}
        >
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              className="w-[70px] text-center"
              defaultValue={temperatureValue?.toString() || ""}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              min={limits.INPUT_MIN.toString()}
              max={limits.INPUT_MAX.toString()}
              step="0.1"
              type="number"
            />
            <div className="flex flex-col gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={handleSaveClick}
                className="h-1/2"
              >
                <Check />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleDeleteClick}
                className="h-1/2"
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        </EditSection>

        <div>
          {temperatureValue ? (
            <span className="flex items-baseline gap-2  hover:text-accent-foreground transition-all">
              {temperatureValue}{" "}
              <small className="opacity-50">
                {useFahrenheit ? "°F" : "°C"}
              </small>
            </span>
          ) : (
            <Button size="sm" variant="ghost">
              Temperature
            </Button>
          )}
        </div>
      </div>

      {temperatureStatus && <VitalSignsAlert text={temperatureStatus.label} />}
    </div>
  );
};

export default Temperature;