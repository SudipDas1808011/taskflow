export const getBDDateTime = () => {
  const now = new Date();

  const bdTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" })
  );

  const dueDate = bdTime.toISOString().split("T")[0];
  const dueTime = bdTime.toTimeString().slice(0, 5);

  return {
    now: bdTime,
    dueDate,
    dueTime,
  };
};