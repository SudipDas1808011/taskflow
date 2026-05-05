export const generateGoalPlan = async (
  goal: string,
  context: string,
  token: string,
  email: string
) => {
  try {
    const res = await fetch("/api/ai/goal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        goal,
        context,
      }),
    });

    console.log("await goal response");

    const data = await res.json();

    console.log("Goal service response:", data);

    return data;
  } catch (error) {
    console.error("Goal service error:", error);
    return null;
  }
};