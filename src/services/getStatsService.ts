export async function getStats(email: string) {
  try {
    const res = await fetch("/api/get-stats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    console.log("Get Stats Response:", res);

    const data = await res.json();

    console.log("Parsed Stats from DB:", data);

    return data;
  } catch (err) {
    console.log("Get Stats Service Error:", err);
    return [];
  }
}