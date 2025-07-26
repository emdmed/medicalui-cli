import { useRef, useEffect } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components//ui/button";

import VitalSignsAlert from "@/components/vital-signs/components/vital-signs-alert";
import EditSection from "@/components/vital-signs/components/edit-section";

import {
  validateTemperatureInput,
  getTemperatureStatus,
  getTemperatureLimits,
} from "@/components/vital-signs/validations/temperature-validations";

import { TemperatureProps } from "../types/vital-signs";

const Temperature: React.FC<TemperatureProps> = ({
  temperatureValue,
  setTemperatureValue,
  useFahrenheit = true,
  setClickedComponent,
  clickedComponent,
  editable
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (clickedComponent === "temperature" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [clickedComponent]);

  const handleDelete = (): void => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setTemperatureValue("");
  };

  const handleCancel = (): void => {
    setClickedComponent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && validateTemperatureInput(e.currentTarget.value, useFahrenheit)) {
      handleCancel();
          setClickedComponent("bloodOxygen");
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleEditClick = (): void => {
    setClickedComponent("temperature");
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    if (validateTemperatureInput(value, useFahrenheit)) {
      setTemperatureValue(value);
    }
  };

  const temperatureStatus = getTemperatureStatus(temperatureValue, useFahrenheit);
  const limits = getTemperatureLimits(useFahrenheit);

  return (
    <div className="px-2 cursor-pointer relative">
      <div className="flex items-center" onClick={handleEditClick}>
        <EditSection
          clickedComponent={clickedComponent}
          parentComponent="temperature"
          editable={editable}
          handleCancel={handleCancel}
          handleDelete={handleDelete}
          nextComponent={() => setClickedComponent("bloodOxygen")}
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
            <Button size="sm" variant="ghost" className="text-xs">
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