import { TriangleAlert, Thermometer, LucideIcon } from "lucide-react";

export interface TemperatureStatus {
  type: "fever" | "hypothermia" | "normal";
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export const TEMPERATURE_LIMITS = {
  FAHRENHEIT: {
    MIN: 95,
    MAX: 107,
    INPUT_MIN: 86,
    INPUT_MAX: 113,
    FEVER: 100.4,
    LOW: 95.0,
  },
  CELSIUS: {
    MIN: 35,
    MAX: 42,
    INPUT_MIN: 30,
    INPUT_MAX: 45,
    FEVER: 38.0,
    LOW: 35.0,
  },
};

export const validateTemperatureInput = (
  value: string | number,
  useFahrenheit: boolean = true
): boolean => {
  if(!value) return true
  const num = parseFloat(value.toString());
  const limits = useFahrenheit ? TEMPERATURE_LIMITS.FAHRENHEIT : TEMPERATURE_LIMITS.CELSIUS;
  
  return !isNaN(num) && num >= limits.MIN && num <= limits.MAX;
};

export const isElevatedTemperature = (
  temperature: string | number,
  useFahrenheit: boolean = true
): boolean => {
  if (!temperature) return false;
  const temp = parseFloat(temperature.toString());
  const feverThreshold = useFahrenheit 
    ? TEMPERATURE_LIMITS.FAHRENHEIT.FEVER 
    : TEMPERATURE_LIMITS.CELSIUS.FEVER;
  
  return temp >= feverThreshold;
};

export const isLowTemperature = (
  temperature: string | number,
  useFahrenheit: boolean = true
): boolean => {
  if (!temperature) return false;
  const temp = parseFloat(temperature.toString());
  const lowThreshold = useFahrenheit 
    ? TEMPERATURE_LIMITS.FAHRENHEIT.LOW 
    : TEMPERATURE_LIMITS.CELSIUS.LOW;
  
  return temp < lowThreshold;
};

export const getTemperatureStatus = (
  temperature: string | number,
  useFahrenheit: boolean = true
): TemperatureStatus | null => {
  if (isElevatedTemperature(temperature, useFahrenheit)) {
    return {
      type: "fever",
      label: "Fever",
      icon: TriangleAlert,
      color: "text-destructive",
      bgColor: "border-destructive",
    };
  }
  
  if (isLowTemperature(temperature, useFahrenheit)) {
    return {
      type: "hypothermia",
      label: "Low",
      icon: Thermometer,
      color: "text-destructive",
      bgColor: "border-destructive",
    };
  }
  
  return null;
};

export const parseTemperatureValue = (value: string | number): number => {
  if(!value) return null
  const parsed = parseFloat(value.toString());
  return isNaN(parsed) ? 0 : parsed;
};

export const getTemperatureLimits = (useFahrenheit: boolean = true) => {
  return useFahrenheit ? TEMPERATURE_LIMITS.FAHRENHEIT : TEMPERATURE_LIMITS.CELSIUS;
};