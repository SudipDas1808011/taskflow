export const postTask = async (taskData: any, token: string) => {
  try {
    const response = await fetch("/api/tasks/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        token,
        task: taskData,
      }),
    });

    console.log("Post task status:", response.status);

    let data;
    try {
      data = await response.json();
    } catch (err) {
      console.log("Response is not JSON");
      throw new Error("Invalid server response");
    }

    console.log("Post task response:", data);

    if (!response.ok) {
      throw new Error(data?.message || "Task creation failed");
    }

    return data;
  } catch (error) {
    console.error("Fetch error in service:", error);
    throw error;
  }
};

export const getTasks = async (token: string) => {
  try {
    const response = await fetch("/api/tasks/get", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token }),
    });

    console.log("Get tasks status:", response.status);

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    const data = await response.json();

    console.log("Get tasks response:", data);

    return data;
  } catch (error) {
    console.error("Fetch error in service:", error);
    throw error;
  }
};

export const updateTask = async (
  email: string,
  taskId: string,
  isCompleted: boolean,
  token: string
) => {
  const res = await fetch(`/api/tasks`, {
    method: "PUT",
    headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
},
    body: JSON.stringify({
      email,
      taskId,
      isCompleted,
    }),
  });

  const result = await res.json();

  console.log("Update response:", result);

  if (!res.ok) {
    throw new Error(result.message || "Update failed");
  }

  return result;
};

export const deleteTask = async (email: string, taskId: string, token: string) => {
  const res = await fetch(`/api/tasks`, {
    method: "DELETE",
    headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
},
    body: JSON.stringify({
      email,
      taskId,
    }),
  });

  console.log("Delete status:", res.status);

  const result = await res.json();
  console.log("Delete response:", result);

  if (!res.ok) {
    throw new Error(result.message || "Delete failed");
  }

  return result;
};
