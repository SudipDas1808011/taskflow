export async function getStats(token: string) {
  try {
    const res = await fetch("/api/get-stats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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