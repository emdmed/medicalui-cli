export const safeFloat = (val: string): number | null => {
  if (val.trim() === "") return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};
