# Vital Signs Component

A comprehensive React component for capturing and displaying medical vital signs with built-in validation, FHIR R4 compliance, and AI analysis integration.

## Installation
```bash
medical-ui add vital-signs
```

## Requirements

- Next.js 15+
- React 18+
- Tailwind CSS 4+
- shadcn/ui
- Lucide React

## Quick Start
```jsx
import VitalSigns from "@/components/vital-signs";

export default function PatientChart() {
  const handleVitalSignsChange = (data, fhirBundle) => {
    console.log("Vital Signs:", data);
    console.log("FHIR Bundle:", fhirBundle);
  };
  
  return (
    
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `IVitalSignsData` | `undefined` | Initial vital signs data |
| `onData` | `Function` | `undefined` | Callback when vital signs change |
| `assistant` | `boolean` | `true` | Show AI analysis button |
| `useFahrenheit` | `boolean` | `true` | Use Fahrenheit for temperature |
| `editable` | `boolean` | `true` | Allow editing of vital signs |
| `assistantRoute` | `string` | `""` | API endpoint for AI analysis |

## Data Interface
```typescript
interface IVitalSignsData {
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
```

## Features

- ✅ **Complete Coverage**: Blood pressure, heart rate, respiratory rate, temperature, and SpO2
- ✅ **FHIR R4 Compliant**: Automatic conversion to FHIR Bundle format
- ✅ **Medical Validation**: Built-in clinical validation rules and alerts
- ✅ **AI Integration**: Optional AI assistant for vital signs interpretation
- ✅ **Unit Support**: Fahrenheit/Celsius temperature conversion
- ✅ **Responsive**: Optimized for desktop and mobile devices
- ✅ **Accessible**: Keyboard navigation and screen reader support

## Examples

### Pre-filled Data
```jsx

```

### Read-Only Display
```jsx

```

### With AI Analysis
```jsx

```

## Validation Rules

| Vital Sign | Valid Range | Categories |
|------------|-------------|------------|
| Blood Pressure | Systolic: 50-350 mmHg<br>Diastolic: 10-130 mmHg | High (≥130/90), Low (<90/60), Normal |
| Heart Rate | 30-220 bpm | Elevated (>100), Low (<60), Normal (60-100) |
| Respiratory Rate | 8-40 breaths/min | Elevated (>18), Low (<12), Normal (12-18) |
| Temperature | 95-107°F (35-42°C) | Fever (≥100.4°F/38°C), Hypothermia (<95°F/35°C) |
| Blood Oxygen | SpO2: 70-100%<br>FiO2: 21-100% | Critical (<90%), Low (<95%), Normal (≥95%) |

## Medical Disclaimer

⚠️ **This component is for educational and development purposes only. Always consult healthcare professionals for medical decisions.**

## Version

**v0.2.4 (beta)**

## Repository

[GitHub - medical-ui CLI](https://github.com/emdmed/medicalui-cli)
