# Medical UI

Open-source clinical UI components for React. Like shadcn/ui, but for medical interfaces.

```bash
npx medical-ui-cli add vital-signs
```

## Requirements

- Next.js 15+
- React 18+
- Tailwind CSS 4+
- shadcn/ui
- Lucide React

## Components

### Monitoring

| Component | Install | Description |
|-----------|---------|-------------|
| **vital-signs** | `npx medical-ui-cli add vital-signs` | BP, HR, RR, Temp, SpO2/FiO2 with validation and FHIR R4 export |
| **sepsis** | `npx medical-ui-cli add sepsis` | Sepsis-3/SOFA monitoring, qSOFA screening, hour-1 bundle tracker |
| **dka** | `npx medical-ui-cli add dka` | DKA monitoring: glucose, ketones, K+, GCS, ABG integration |

### Nephrology

| Component | Install | Description |
|-----------|---------|-------------|
| **nephrology** (group) | `npx medical-ui-cli add nephrology` | Full nephrology suite — installs both CKD and nephrology modules |
| **ckd** | `npx medical-ui-cli add ckd` | CKD evaluator: GFR staging, albuminuria, risk classification |
| **phospho-calcic** | `npx medical-ui-cli add phospho-calcic` | Phospho-calcic balance (installs nephrology module) |
| **anemia** | `npx medical-ui-cli add anemia` | Renal anemia tracking (installs nephrology module) |
| **cardio-metabolic** | `npx medical-ui-cli add cardio-metabolic` | Cardio-metabolic risk in CKD (installs nephrology module) |

### Calculators

| Component | Install | Description |
|-----------|---------|-------------|
| **acid-base** | `npx medical-ui-cli add acid-base` | ABG analyzer — disorder detection, compensation, anion gap |
| **bmi** | `npx medical-ui-cli add bmi` | BMI calculator with imperial/metric toggle |
| **water-balance** | `npx medical-ui-cli add water-balance` | Fluid intake/output tracker with insensible loss calculation |
| **pafi** | `npx medical-ui-cli add pafi` | PaO2/FiO2 ratio with ARDS classification |
| **cardiology** | `npx medical-ui-cli add cardiology` | ASCVD risk, HEART Score, CHA₂DS₂-VASc calculators |

### Documentation

| Component | Install | Description |
|-----------|---------|-------------|
| **clinical-notes** | `npx medical-ui-cli add clinical-notes` | Encounter note editor with clinical highlighting and local storage |

## Commands

```bash
npx medical-ui-cli add <component>    # Install a component
npx medical-ui-cli add <group>        # Install a component group (e.g. nephrology)
npx medical-ui-cli add <sub-component> # Install via sub-component alias
npx medical-ui-cli list               # List all available components, groups, and aliases
npx medical-ui-cli debug              # Show debug information
```

## Quick Start

```tsx
import VitalSigns from "@/components/vital-signs/vital-signs";

export default function PatientDashboard() {
  return (
    <VitalSigns
      editable
      useFahrenheit={false}
      onData={(data, fhir) => console.log(data, fhir)}
    />
  );
}
```

## Medical Disclaimer

This component library is for educational and development purposes only. Always consult healthcare professionals for medical decisions. All clinical logic (validations, calculations, classifications) is unit tested but not FDA-cleared.

## Version

**v0.3.6**

## Repository

[GitHub - medical-ui CLI](https://github.com/emdmed/medicalui-cli)
