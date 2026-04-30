export async function updateSubTask(
  email: string,
  goalId: string,
  taskId: string,
  done: boolean
) {
  try {
    const res = await fetch("/api/update-subtask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, goalId, taskId, done }),
    });

    console.log("Update response status:", res.status);

    const data = await res.json();

    console.log("Update response:", data);

    return data;
  } catch (err) {
    console.log("updateSubTask error:", err);
    return null;
  }
}