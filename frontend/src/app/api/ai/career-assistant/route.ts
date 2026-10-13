import { NextRequest } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { message, mode, history, resumeText, targetRole } = await req.json();

    if (!message && !resumeText) {
      return new Response("Message or resume content is required", { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return new Response("GROQ_API_KEY is not configured", { status: 500 });
    }

    const modelsToTry = [process.env.GROQ_MODEL || "qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"];
    const systemPrompt = buildSystemPrompt(mode, targetRole, resumeText);

    const messages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(history) ? history.slice(-6) : []),
      { role: "user", content: message || "Please analyze my provided resume." },
    ];

    let groqResponse: Response | null = null;
    let lastError = "";

    for (const model of modelsToTry) {
      try {
        const res = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
            "User-Agent": "hirelens-ai/1.0",
          },
          body: JSON.stringify({
            model,
            messages,
            stream: true,
            temperature: 0.7,
            max_tokens: 650, // stays safely within Groq OTPM limit
          }),
        });

        if (res.ok) {
          groqResponse = res;
          break;
        } else {
          lastError = await res.text();
          console.warn(`Groq model ${model} failed (${res.status}): ${lastError}. Trying fallback...`);
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    if (!groqResponse || !groqResponse.ok) {
      return new Response(
        `AI assistant temporarily busy or rate-limited. Please try again shortly. (${lastError.slice(0, 100)})`,
        { status: 503 }
      );
    }

    const reader = groqResponse.body?.getReader();
    if (!reader) {
      return new Response("Failed to read AI stream", { status: 500 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === "data: [DONE]") continue;
              if (trimmed.startsWith("data: ")) {
                try {
                  const json = JSON.parse(trimmed.slice(6));
                  const delta = json.choices?.[0]?.delta?.content || "";
                  if (delta) {
                    controller.enqueue(encoder.encode(delta));
                  }
                } catch {
                  // ignore malformed chunk
                }
              }
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err: any) {
    console.error("Career assistant error:", err);
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}

function buildSystemPrompt(mode: string, targetRole?: string, resumeText?: string): string {
  const roleContext = targetRole ? ` The candidate is targeting: "${targetRole}".` : "";
  const resumeContext = resumeText ? `\n\nCandidate's resume context:\n${resumeText.slice(0, 1500)}` : "";

  switch (mode) {
    case "resume":
      return `You are HireLens's Expert AI Resume Strategist and ATS Optimizer.${roleContext}${resumeContext}
Provide clear, actionable, evidence-backed feedback:
1. Strengths & impact statements
2. Missing keywords or technical skills
3. Specific bullet points to rewrite using the "Accomplished [X] as measured by [Y], by doing [Z]" formula
4. ATS readability tips. Keep formatting clear with bullet points and bold highlights.`;

    case "interview":
      return `You are HireLens's Senior Technical & Behavioral Interview Coach.${roleContext}
Conduct realistic, high-signal interview preparation:
- If this is the start, present 1 compelling technical or situational question relevant to the target role.
- If the candidate answered a previous question, grade their answer constructively (clarity, depth, trade-offs) and follow up with the next realistic scenario or technical challenge.
- Keep responses engaging, encouraging, and rigorous.`;

    case "outreach":
      return `You are HireLens's Professional Networking & Outreach Specialist.${roleContext}
Craft authentic, high-converting messages:
1. Short LinkedIn Connection Note (<300 characters)
2. Direct message to a Technical Recruiter (personalized, concise, value-oriented)
3. Follow-up note after an interview or application submission.
Never sound generic or spammy; focus on genuine shared interest and clear value.`;

    case "copilot":
    default:
      return `You are HireLens's AI Career Intelligence Copilot.${roleContext}${resumeContext}
You assist job seekers, software engineers, and tech professionals with:
- Career roadmaps, skills progression, and market trends
- Demystifying job descriptions and identifying key leverage points
- Actionable advice on salary negotiation, system design, and building standout portfolios.
Keep advice grounded, practical, structured, and inspiring.`;
  }
}
