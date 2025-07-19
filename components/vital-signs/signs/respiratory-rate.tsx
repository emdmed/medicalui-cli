import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Trash2 } from "lucide-react";
import VitalSignsAlert from "@/components/vital-signs/components/vital-signs-alert";
import EditSection from "@/components/vital-signs/components/edit-section";
import {
  validateRespiratoryRateInput,
  isValidRespiratoryRateInput,
  getRespiratoryRateCategory,
  parseRespiratoryRateValue,
  RESPIRATORY_RATE_LIMITS
} from "@/components/vital-signs/validations/respiratory-rate-validations";

interface RespiratoryRateProps {
  respiratoryRateValue: number;
  setRespiratoryRateValue: (value: string | number) => void;
  setClickedComponent: (component: string) => void;
  clickedComponent: string;
  editable: boolean;
}

const RespiratoryRate: React.FC<RespiratoryRateProps> = ({
  respiratoryRateValue,
  setRespiratoryRateValue,
  setClickedComponent,
  clickedComponent,
  editable
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = (): void => {
    const error = validateRespiratoryRateInput(respiratoryRateValue);
    
    if (error) {
      setValidationError(error);
      return;
    }
    
    setRespiratoryRateValue(parseRespiratoryRateValue(respiratoryRateValue));
    setValidationError(null);
  };

  const handleCancel = (): void => {
    setClickedComponent("");
  };

  const handleDelete = (): void => {
    setRespiratoryRateValue("");
  };

  useEffect(() => {
    if (clickedComponent === "respiratoryRate" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [clickedComponent]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    
    if (isValidRespiratoryRateInput(value)) {
      setRespiratoryRateValue(value);
      if (validationError) {
        setValidationError(null);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
      setClickedComponent("temperature");
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleEditClick = (): void => {
    setClickedComponent("respiratoryRate");
  };

  const currentCategory = getRespiratoryRateCategory(respiratoryRateValue);

  return (
    <div className="px-2 cursor-pointer relative">
      <div className="flex items-center" onClick={handleEditClick}>
        <EditSection
          clickedComponent={clickedComponent}
          parentComponent="respiratoryRate"
          editable={editable}
        >
          <Input
            ref={inputRef}
            className="w-[50px] text-center"
            value={respiratoryRateValue?.toString() || ""}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            maxLength={2}
            min={RESPIRATORY_RATE_LIMITS.MIN.toString()}
            max={RESPIRATORY_RATE_LIMITS.MAX.toString()}
          />
          <div className="flex flex-col gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleSave();
                setClickedComponent("temperature");
              }}
              className="h-1/2"
            >
              <Check />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="h-1/2"
            >
              <Trash2 />
            </Button>
          </div>
        </EditSection>
        <div>
          {respiratoryRateValue ? (
            <span className="flex items-baseline gap-2  hover:text-accent-foreground transition-all">
              {respiratoryRateValue}{" "}
              <small className="opacity-50">breaths/min</small>
            </span>
          ) : (
            <Button size="sm" variant="ghost">
              Respiratory rate
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

export default RespiratoryRate;