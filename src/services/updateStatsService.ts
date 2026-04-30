export async function updateStats(email: string, stats: any) {
  try {
    const res = await fetch("/api/update-stats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, stats }),
    });

    console.log("Update Stats Raw Response:", res);

    const data = await res.json();
    console.log("Update Stats Parsed Response:", data);

    return data;
  } catch (err) {
    console.log("Update Stats Service Error:", err);
    return { success: false };
  }
}