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
