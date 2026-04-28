export const postTask = async (taskData: any) => {
  try {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });

    return response;
    
  } catch (error) {
    console.error("Fetch error in service:", error);
    throw error; 
  }
};

export const getTasks = async () => {
  try {
    const response = await fetch("/api/tasks", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error in service:", error);
    throw error;
  }
};

export const updateTask = async (id: string, data: any) => {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

 if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Update failed");
  }

  return res.json();
};

export const deleteTask = async (id: string) => {
    try {
        const res = await fetch(`/api/tasks/${id}`, {
            method: "DELETE",
        });

        console.log("Delete API response:", res);

        const data = await res.json();
        console.log("Delete response data:", data);

        if (!res.ok) {
            throw new Error(data.message);
        }

        console.log("Task deleted successfully");
    } catch (error) {
        console.error("Error deleting task:", error);
    }
};