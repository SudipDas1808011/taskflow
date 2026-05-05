export async function analyzeStats(data: any, token: string) {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    console.log("Fetch Response:", res);

    const json = await res.json();
    console.log("Parsed JSON:", json);

    return json;
  } catch (err) {
    console.log("Service Error:", err);
    return [];
  }
}