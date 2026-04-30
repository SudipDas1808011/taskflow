export async function updateGoalCompletion(
  email: string,
  goalId: string,
  completionPercentage: number
) {
  const response = await fetch("/api/goals/update-completion", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      goalId,
      completionPercentage,
    }),
  });

  const data = await response.json();
  console.log("updateGoalCompletion response:", data);

  return data;
}