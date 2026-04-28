export const sendToAI = async (messages: any[]) => {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  const data = await response.json();
  console.log("AI response:", data);

  return data;
};