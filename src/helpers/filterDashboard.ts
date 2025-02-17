export const getDaysPeriod = (
  textPeriod: string
): { start: Date; end: Date } => {
  const today = new Date();
  let start = new Date(today);
  let end = new Date(today);

  if (textPeriod === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (textPeriod === "week") {
    start.setDate(today.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (textPeriod === "month") {
    start.setMonth(today.getMonth() - 1);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};
