import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  // Mariam — AI / Dynamics 365 roles
  const mariam = await db.user.upsert({
    where: { email: "mariam@autopilot.local" },
    update: {},
    create: {
      email: "mariam@autopilot.local",
      name: "Mariam",
      password: hash("mariam123"),
      profile: {
        create: {
          resumeText:
            "Mariam - AI Generalist & D365 Functional Consultant. 9 years experience in Dynamics 365, Power Platform, Azure AI, Copilot Studio, and Agile delivery.",
          preferences: JSON.stringify({
            roles: [
              "AI Consultant",
              "D365 Consultant",
              "AI Researcher",
              "Dynamics 365",
              "Machine Learning Engineer",
              "AI Engineer",
              "Power Platform",
            ],
            keywords: ["AI", "Dynamics 365", "D365", "Azure AI", "Copilot", "Power Platform", "LLM"],
            locations: ["Toronto", "Ottawa", "Vancouver", "Remote", "Canada"],
            salaryMin: 100,
            salaryUnit: "hourly",
            remote: true,
            jobType: "contract",
          }),
          credentials: JSON.stringify({}),
          city: "Toronto",
          yearsExp: 9,
        },
      },
    },
  });

  // Brother — Pharmacy Assistant
  const brother = await db.user.upsert({
    where: { email: "brother@autopilot.local" },
    update: {},
    create: {
      email: "brother@autopilot.local",
      name: "Adam",
      password: hash("adam123"),
      profile: {
        create: {
          resumeText:
            "Adam - Pharmacy Assistant. Diploma in Pharmacy Technology. Experience in prescription processing, medication dispensing, patient counselling, and pharmacy operations.",
          preferences: JSON.stringify({
            roles: [
              "Pharmacy Assistant",
              "Pharmacy Technician",
              "Pharmacy Associate",
              "Dispensary Assistant",
              "Retail Pharmacy",
            ],
            keywords: ["pharmacy", "dispensing", "pharmacy assistant", "pharmacy technician", "medications"],
            locations: [
              "Alberta",
              "British Columbia",
              "Ontario",
              "Saskatchewan",
              "Manitoba",
              "Canada",
            ],
            salaryMin: 18,
            salaryUnit: "hourly",
            remote: false,
            jobType: "full_time",
          }),
          credentials: JSON.stringify({}),
          city: "Edmonton",
          yearsExp: 2,
        },
      },
    },
  });

  console.log("✅ Seeded users:");
  console.log(`   Mariam  → email: mariam@autopilot.local  password: mariam123`);
  console.log(`   Adam    → email: brother@autopilot.local password: adam123`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
