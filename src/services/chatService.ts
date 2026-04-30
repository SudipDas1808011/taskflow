export const getChatHistory = async (token: string) => {
  try {
    const response = await fetch("/api/ai/chatHistory", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Get chat status:", response.status);

    const data = await response.json();
    console.log("Get chat response:", data);

    if (!response.ok) {
      throw new Error(data.message || "Fetch failed");
    }

    return data.chatHistory || [];
  } catch (error) {
    console.error("getChatHistory error:", error);
    return [];
  }
};

export const replaceChatHistory = async (
  messages: any[],
  token: string
) => {
  try {
    console.log("Chat update payload:", messages);

    const response = await fetch("/api/ai/chatHistory", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ messages }),
    });

    console.log("Replace chat status:", response.status);

    const data = await response.json();
    console.log("Replace chat response:", data);

    if (!response.ok) {
      throw new Error(data.message || "Update failed");
    }

    return data;
  } catch (error) {
    console.error("replaceChatHistory error:", error);
    return null;
  }
};