import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import VitalSignsAlert from "@/components/vital-signs/components/vital-signs-alert";
import EditSection from "@/components/vital-signs/components/edit-section";

import {
  validateBloodPressureInput,
  isValidBloodPressureInput,
  getBloodPressureCategory,
  parseBloodPressureValues,
} from "@/components/vital-signs/validations/blood-pressure-validations";

import { BloodPressureProps } from "../types/vital-signs";

const BloodPressure = ({
  bloodPressureValue,
  setBloodPressureValue,
  setClickedComponent,
  clickedComponent,
  editable,
}: BloodPressureProps) => {
  const [validationError, setValidationError] = useState<string | null>(null);

  const systolicInputRef = useRef<HTMLInputElement>(null);
  const diastolicInputRef = useRef<HTMLInputElement>(null);

  const onSystolicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (isValidBloodPressureInput(value, "systolic")) {
      setBloodPressureValue({
        ...bloodPressureValue,
        systolic: parseInt(value),
      });

      if (validationError) {
        setValidationError(null);
      }
    }
  };

  const onDiastolicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (isValidBloodPressureInput(value, "diastolic")) {
      setBloodPressureValue({
        ...bloodPressureValue,
        diastolic: parseInt(value),
      });

      if (validationError) {
        setValidationError(null);
      }
    }
  };

  const onClick = () => {
    setClickedComponent("bloodPressure");
  };

  useEffect(() => {
    if (clickedComponent === "bloodPressure" && systolicInputRef.current) {
      systolicInputRef.current.focus();
    }
  }, [clickedComponent, systolicInputRef]);

  const handleSave = () => {
    const error = validateBloodPressureInput(bloodPressureValue);

    if (error) {
      setValidationError(error);
      return;
    }

    const parsedValues = parseBloodPressureValues(bloodPressureValue);

    if (parsedValues) {
      setBloodPressureValue({
        systolic: parsedValues.systolic,
        diastolic: parsedValues.diastolic,
      });
    }

    setValidationError(null);
  };

  const handleDelete = () => {
    setBloodPressureValue({
      systolic: null,
      diastolic: null,
    });

    if (systolicInputRef.current) {
      systolicInputRef.current.value = "";
    }
    if (diastolicInputRef.current) {
      diastolicInputRef.current.value = "";
    }
    setValidationError(null);
  };

  const handleCancel = () => {
    setClickedComponent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
      setClickedComponent("heartRate");
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const parsedValues = parseBloodPressureValues(bloodPressureValue);
  const currentBPCategory = parsedValues
    ? getBloodPressureCategory(parsedValues.systolic, parsedValues.diastolic)
    : null;

  return (
    <div
      className={`px-2 cursor-pointer relative`}
      onClick={onClick}
      role="button"
    >
      <div className="flex items-center" id="bloodPressure">
        <EditSection
          clickedComponent={clickedComponent}
          parentComponent="bloodPressure"
          editable={editable}
          nextComponent={() => setClickedComponent("heartRate")}
          handleCancel={handleCancel}
          handleDelete={handleDelete}
        >
          <Input
            ref={systolicInputRef}
            value={bloodPressureValue?.systolic || ""}
            onChange={onSystolicChange}
            onKeyDown={handleKeyDown}
            placeholder="120"
            className="w-[50px] text-center"
            maxLength={3}
          />
          <span className="text-muted-foreground">/</span>
          <Input
            ref={diastolicInputRef}
            value={bloodPressureValue?.diastolic || ""}
            onChange={onDiastolicChange}
            onKeyDown={handleKeyDown}
            placeholder="80"
            className="w-[50px] text-center"
            maxLength={3}
          />
        </EditSection>

        {bloodPressureValue?.systolic && bloodPressureValue?.diastolic ? (
          <span className="flex items-baseline gap-2 hover:text-accent-foreground transition-all">
            {bloodPressureValue.systolic}/{bloodPressureValue.diastolic}{" "}
            <small className="opacity-50">mmHg</small>
          </span>
        ) : (
          <Button size="sm" variant="ghost" className="text-xs">
            Blood pressure
          </Button>
        )}

        {currentBPCategory && (
          <VitalSignsAlert text={currentBPCategory.category || "Warning"} />
        )}
      </div>
    </div>
  );
};

export default BloodPressure;
