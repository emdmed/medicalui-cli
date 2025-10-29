Vital Signs Component
A comprehensive React component for capturing and displaying medical vital signs with built-in validation, FHIR R4 compliance, and AI analysis integration.
Installation
bashmedical-ui add vital-signs
Requirements

Next.js 15+
React 18+
Tailwind CSS 4+
shadcn/ui
Lucide React

Quick Start
jsximport VitalSigns from "@/components/vital-signs";

export default function PatientChart() {
  const handleVitalSignsChange = (data, fhirBundle) => {
    console.log("Vital Signs:", data);
    console.log("FHIR Bundle:", fhirBundle);
  };
  
  return (
    <VitalSigns
      onData={handleVitalSignsChange}
      useFahrenheit={true}
      assistant={true}
      assistantRoute="/api/analyze-vitals"
    />
  );
}
Props
PropTypeDefaultDescriptiondataIVitalSignsDataundefinedInitial vital signs dataonDataFunctionundefinedCallback when vital signs changeassistantbooleantrueShow AI analysis buttonuseFahrenheitbooleantrueUse Fahrenheit for temperatureeditablebooleantrueAllow editing of vital signsassistantRoutestring""API endpoint for AI analysis
Data Interface
typescriptinterface IVitalSignsData {
  bloodPressure: {
    systolic: number | null;
    diastolic: number | null;
  };
  heartRate: number | null;
  respiratoryRate: number | null;
  temperature: number | null;
  bloodOxygen: {
    saturation: number | null;
    fiO2: number | null;
  };
}
Features

Complete Coverage: Blood pressure, heart rate, respiratory rate, temperature, and SpO2
FHIR R4 Compliant: Automatic conversion to FHIR Bundle format
Medical Validation: Built-in clinical validation rules and alerts
AI Integration: Optional AI assistant for vital signs interpretation
Unit Support: Fahrenheit/Celsius temperature conversion
Responsive: Optimized for desktop and mobile devices
Accessible: Keyboard navigation and screen reader support

Examples
Pre-filled Data
jsx<VitalSigns
  data={{
    bloodPressure: { systolic: 120, diastolic: 80 },
    heartRate: 72,
    respiratoryRate: 16,
    temperature: 98.6,
    bloodOxygen: { saturation: 98, fiO2: 21 }
  }}
/>
Read-Only Display
jsx<VitalSigns
  data={vitalSigns}
  editable={false}
  assistant={false}
/>
Medical Disclaimer
This component is for educational and development purposes. Always consult healthcare professionals for medical decisions.
License
[Your License]

Version: 0.2.4 (beta)
Repository: GitHub
