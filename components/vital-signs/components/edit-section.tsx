import { Button } from "@/components/ui/button";
import { Check, Trash2 } from "lucide-react";

import { EditSectionProps } from "../types/vital-signs";

const EditSection = ({
  children,
  clickedComponent,
  parentComponent,
  editable,
  handleCancel, 
  handleDelete,
  nextComponent
}: EditSectionProps) => {
  if (!editable) return null;
  
  return (
    <div
      className={`absolute bottom-10 rounded bg-background p-2 flex items-center gap-2 transition-all duration-200 ease-out ${
        clickedComponent === parentComponent
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      {children}
      <div className="flex flex-col gap-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            handleCancel();
            if(nextComponent) nextComponent()
          }}
          className="h-1/2"
        >
          <Check />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            handleDelete();
          }}
          className="h-1/2"
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
};

export default EditSection;