export async function analyzeStats(data: any) {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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