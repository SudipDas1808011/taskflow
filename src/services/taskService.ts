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