export async function updateGoalCompletion(
  token: string,
  goalId: string,
  completionPercentage: number
) {
  const response = await fetch("/api/goals/update-completion", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      goalId,
      completionPercentage,
    }),
  });

  const data = await response.json();
  console.log("updateGoalCompletion response:", data);

  return data;
}