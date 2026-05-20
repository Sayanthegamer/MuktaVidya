import { POST } from "./route";

describe("Feedback API Route", () => {
  it("should return 400 Invalid JSON when payload is malformed", async () => {
    // We instantiate a generic Request with a malformed body
    const request = new Request("http://localhost/api/feedback", {
      method: "POST",
      body: "{ broken-json-payload ...",
    });

    const res = await POST(request);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toEqual({ error: "Invalid JSON" });
  });

  it("should return success when JSON is valid", async () => {
    const request = new Request("http://localhost/api/feedback", {
      method: "POST",
      body: JSON.stringify({ type: "positive", solutionLength: 42 }),
      headers: {
        "Content-Type": "application/json"
      }
    });

    const res = await POST(request);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ success: true });
  });
});
