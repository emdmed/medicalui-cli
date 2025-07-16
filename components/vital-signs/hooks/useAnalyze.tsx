import { useState } from "react";

export const useAnalyzeVitalSigns = ({ route, getCurrentVitalSignsData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [showAnalysis, setShowAnalysis] = useState(false);

  const analyzeVitalSigns = async () => {
    setIsLoading(true);
    setError("");
    setAnalysis("");

    const vitalSigns = getCurrentVitalSignsData();
    if (!route) return;
    try {
      const response = await fetch(route, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vitalSigns }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze vital signs");
      }

      setAnalysis(data.analysis);
      setShowAnalysis(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetAnalysis = () => {
    setShowAnalysis(false);
    setAnalysis("");
    setError("");
  };

  return {
    analyzeVitalSigns,
    resetAnalysis,
    isLoading,
    error,
    analysis,
    showAnalysis,
  };
};
