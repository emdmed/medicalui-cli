const Popup = ({visible, children}) => {
  return (
    <div
      className={`absolute bottom-15 left-0 rounded bg-none p-1 flex items-center gap-2 transition-all duration-300 ease-out ${
        visible
          ? "opacity-100 pointer-events-auto translate-y-0"
          : "opacity-0 pointer-events-none translate-y-2"
      }`}
    >
      {children}
    </div>
  );
};

export default Popup;