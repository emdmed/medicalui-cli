const EditSection = ({
  children,
  clickedComponent,
  parentComponent,
  editable,
}) => {
  if (!editable) return null;
  return (
    <div
      className={`absolute bottom-10 shadow-sm rounded bg-background border p-2 flex items-center gap-2 transition-all duration-200 ease-out ${
        clickedComponent === parentComponent
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      {children}
    </div>
  );
};

export default EditSection;
