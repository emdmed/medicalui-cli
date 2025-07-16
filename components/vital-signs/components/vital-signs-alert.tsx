import { Badge } from "@/components/ui/badge";
import { TriangleAlert } from "lucide-react";

interface VitalSignsAlertProps {
  text: string;
}

const VitalSignsAlert = ({ text }: VitalSignsAlertProps) => {
  return (
    <div
      style={{ position: "absolute", bottom: -22, left: 0 }}
      className="flex items-center gap-2 animate-in fade-in-0 slide-in-from-top-2 duration-300"
    >
      <Badge
        className="transition-all duration-200"
        variant="destructive"
      >
        <TriangleAlert className="h-4 w-4 transition-transform duration-200" />
        {text}
      </Badge>
    </div>
  );
};

export default VitalSignsAlert;