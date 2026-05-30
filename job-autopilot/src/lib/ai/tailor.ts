import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface TailorResult {
  tailoredResume: string;
  coverLetter: string;
  matchScore: number;
  matchReasons: string[];
}

export async function tailorApplicationForJob(
  resumeText: string,
  jobTitle: string,
  company: string,
  jobDescription: string,
  userName: string,
  userCity: string,
  userPhone?: string
): Promise<TailorResult> {
  const prompt = `You are an expert career coach and resume writer.

USER'S BASE RESUME:
<resume>
${resumeText}
</resume>

TARGET JOB:
Title: ${jobTitle}
Company: ${company}
Description:
<job_description>
${jobDescription.slice(0, 4000)}
</job_description>

TASK:
1. Tailor the user's resume for this specific job. Keep all facts true — reframe and reorder existing experience to match the job requirements. Do NOT invent skills, credentials, or experience.
2. Write a concise, personalized cover letter (3 short paragraphs max). Ground every claim in the resume facts above.
3. Give a match score 0-100 and 2-4 specific reasons why this job is a good/bad match.

RULES:
- Never fabricate credentials, dates, companies, or achievements
- Use keywords from the job description naturally in the resume
- Cover letter should be warm, specific, and under 200 words
- Match score should be honest

Return a JSON object with this exact structure:
{
  "tailoredResume": "full resume text here",
  "coverLetter": "cover letter text here",
  "matchScore": 85,
  "matchReasons": ["reason 1", "reason 2", "reason 3"]
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from AI");

  // Extract JSON from the response (handle markdown code blocks)
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse AI response as JSON");

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    tailoredResume: parsed.tailoredResume ?? "",
    coverLetter: parsed.coverLetter ?? "",
    matchScore: Math.min(100, Math.max(0, Number(parsed.matchScore) || 0)),
    matchReasons: Array.isArray(parsed.matchReasons) ? parsed.matchReasons : [],
  };
}
