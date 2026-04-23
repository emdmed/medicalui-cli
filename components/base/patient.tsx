/**
 * Patient — Basic patient demographics: name, DOB (auto-calculates age), sex, weight, height.
 * @props data? — PatientData, onData? — callback on change
 */
"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, X } from "lucide-react";
import type { PatientData } from "./types/interfaces";
import { calculateAge } from "./lib";

export interface PatientProps {
  data?: PatientData;
  onData?: (data: PatientData) => void;
}

const EMPTY: PatientData = {
  fullName: "",
  dateOfBirth: "",
  age: null,
  sex: "",
  weight: "",
  height: "",
};

export default function Patient({ data, onData }: PatientProps) {
  const [patient, setPatient] = useState<PatientData>(() => data ?? { ...EMPTY });
  const [isEditMode, setIsEditMode] = useState(false);
  const [temp, setTemp] = useState<PatientData>({ ...EMPTY });
  const prevRef = useRef("");
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  // Sync inbound data
  useEffect(() => {
    if (!data) return;
    const s = JSON.stringify(data);
    if (s !== prevRef.current) {
      prevRef.current = s;
      setPatient(data);
    }
  }, [data]);

  // Emit outbound data
  useEffect(() => {
    const s = JSON.stringify(patient);
    if (s !== prevRef.current) {
      prevRef.current = s;
      onDataRef.current?.(patient);
    }
  }, [patient]);

  const enterEditMode = () => {
    setTemp({ ...patient });
    setIsEditMode(true);
  };

  const saveChanges = () => {
    const saved = { ...temp, age: calculateAge(temp.dateOfBirth) };
    setPatient(saved);
    setIsEditMode(false);
  };

  const cancelEdit = () => {
    setIsEditMode(false);
  };

  const updateTemp = (field: keyof PatientData, value: string) => {
    setTemp((p) => ({ ...p, [field]: value }));
  };

  const hasData = patient.fullName || patient.dateOfBirth || patient.sex || patient.weight || patient.height;

  if (isEditMode) {
    return (
      <div className="border border-border rounded-sm p-2">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">Patient Info</h3>
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={saveChanges}>
              <Check className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={cancelEdit}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="col-span-2">
            <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none">Full Name</Label>
            <Input
              value={temp.fullName}
              onChange={(e) => updateTemp("fullName", e.target.value)}
              placeholder="Patient name"
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none">Date of Birth</Label>
            <Input
              type="date"
              value={temp.dateOfBirth}
              onChange={(e) => updateTemp("dateOfBirth", e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none">Sex</Label>
            <select
              value={temp.sex}
              onChange={(e) => updateTemp("sex", e.target.value)}
              className="flex h-7 w-full rounded-sm border-b border-border bg-transparent px-2 text-xs"
            >
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none">Weight (kg)</Label>
            <Input
              type="number"
              value={temp.weight}
              onChange={(e) => updateTemp("weight", e.target.value)}
              placeholder="70"
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none">Height (cm)</Label>
            <Input
              type="number"
              value={temp.height}
              onChange={(e) => updateTemp("height", e.target.value)}
              placeholder="170"
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div
        onClick={enterEditMode}
        className="cursor-pointer py-1"
      >
        <span className="text-xs text-muted-foreground">Click to add patient info</span>
      </div>
    );
  }

  return (
    <div
      onClick={enterEditMode}
      className="cursor-pointer hover:opacity-80 transition-opacity"
    >
      <div className="flex items-center gap-3 text-xs">
        <span className="font-semibold truncate">{patient.fullName || "—"}</span>
        <span className="text-muted-foreground shrink-0">|</span>
        <span className="text-muted-foreground shrink-0">
          {patient.age !== null ? `${patient.age}y` : ""}
          {patient.sex ? ` ${patient.sex.charAt(0).toUpperCase()}` : ""}
        </span>
        {(patient.weight || patient.height) && (
          <>
            <span className="text-muted-foreground shrink-0">|</span>
            <span className="text-muted-foreground shrink-0">
              {patient.weight ? `${patient.weight}kg` : ""}
              {patient.weight && patient.height ? " · " : ""}
              {patient.height ? `${patient.height}cm` : ""}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
