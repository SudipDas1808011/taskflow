export async function updateStats(token: string, stats: any) {
  try {
    const res = await fetch("/api/update-stats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stats }),
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