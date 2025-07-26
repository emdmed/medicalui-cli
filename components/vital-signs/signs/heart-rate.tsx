import { useRef, useEffect, RefObject } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import VitalSignsAlert from "@/components/vital-signs/components/vital-signs-alert";
import EditSection from "@/components/vital-signs/components/edit-section";
import {
  validateHeartRateInput,
  getHeartRateCategory,
  parseHeartRateValue,
  HEART_RATE_LIMITS,
} from "@/components/vital-signs/validations/heart-rate-validations";

import { HeartRateProps } from "../types/vital-signs";

const HeartRate = ({
  heartRateValue,
  setHeartRateValue,
  setClickedComponent,
  clickedComponent,
  editable,
}: HeartRateProps) => {
  const inputRef: RefObject<HTMLInputElement> = useRef(null);

  useEffect(() => {
    if (clickedComponent === "heartRate" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [clickedComponent]);

  const handleDelete = (): void => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setHeartRateValue(0);
  };

  const handleCancel = (): void => {
    setClickedComponent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && validateHeartRateInput(e.currentTarget.value)) {
      setClickedComponent("respiratoryRate");
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleEditClick = (): void => {
    setClickedComponent("heartRate");
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    if (validateHeartRateInput(value)) {
      setHeartRateValue(parseHeartRateValue(value));
    }
  };

  const currentCategory = getHeartRateCategory(heartRateValue);

  return (
    <div
      className="px-2 cursor-pointer relative heart_rate_container"
      onClick={handleEditClick}
      role="button"
    >
      <div className="flex items-center" id="heartRate">
        <EditSection
          clickedComponent={clickedComponent}
          parentComponent="heartRate"
          editable={editable}
          handleCancel={handleCancel}
          handleDelete={handleDelete}
          nextComponent={() => setClickedComponent("respiratoryRate")}
        >
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              className="w-[50px] text-center"
              defaultValue={heartRateValue || ""}
              onKeyDown={handleKeyDown}
              min={HEART_RATE_LIMITS.MIN.toString()}
              max={HEART_RATE_LIMITS.MAX.toString()}
              onChange={onChange}
            />
          </div>
        </EditSection>
        <div>
          {heartRateValue ? (
            <span className="flex items-baseline gap-2  hover:text-accent-foreground transition-all">
              {heartRateValue} <small className="opacity-50">beats/min</small>
            </span>
          ) : (
            <Button size="sm" variant="ghost" className="text-xs">
              Heart rate
            </Button>
          )}
        </div>
      </div>
      {currentCategory && currentCategory.category !== "Normal" && (
        <VitalSignsAlert text={currentCategory.category} />
      )}
    </div>
  );
};

export default HeartRate;
