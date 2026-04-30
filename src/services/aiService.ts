export const sendToAI = async (messages: any[], email: string) => {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      email: email,
    },
    body: JSON.stringify({ messages }),
  });

  const data = await response.json();
  console.log("AI response:", data);

  return data;
};