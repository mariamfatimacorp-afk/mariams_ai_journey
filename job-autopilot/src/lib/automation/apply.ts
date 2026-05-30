// Browser automation for job application submission
// Uses Playwright to fill and submit forms on job platforms.
//
// Ethical note: This uses the user's OWN account credentials to apply
// for jobs on their behalf — it is not bulk/scraping/commercial use.
// Each application still requires explicit user approval before submission.

export type PlatformCredentials = {
  linkedin?: { email: string; password: string };
  indeed?: { email: string; password: string };
};

export interface ApplicationResult {
  success: boolean;
  message: string;
  screenshotBase64?: string;
}

export async function submitApplication(
  jobUrl: string,
  source: string,
  coverLetter: string,
  tailoredResume: string,
  credentials: PlatformCredentials,
  userInfo: {
    name: string;
    email: string;
    phone?: string;
    city?: string;
    linkedinUrl?: string;
  }
): Promise<ApplicationResult> {
  switch (source) {
    case "canada_job_bank":
      return submitCanadaJobBank(jobUrl, coverLetter, userInfo);
    case "indeed":
      return submitIndeed(jobUrl, coverLetter, credentials.indeed, userInfo);
    case "greenhouse":
    case "lever":
      return submitATS(jobUrl, coverLetter, userInfo);
    case "linkedin":
      return submitLinkedIn(jobUrl, credentials.linkedin, userInfo);
    default:
      return {
        success: false,
        message: `Manual application required. URL: ${jobUrl}`,
      };
  }
}

async function launchBrowser() {
  const { chromium } = await import("playwright");
  return chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

async function submitCanadaJobBank(
  jobUrl: string,
  coverLetter: string,
  userInfo: { name: string; email: string; phone?: string }
): Promise<ApplicationResult> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.goto(jobUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Canada Job Bank "Apply" button
    const applyBtn = page.locator('a[href*="jobsearch/jobposting/apply"], button:has-text("Apply"), a:has-text("Apply Now")').first();
    if (await applyBtn.isVisible()) {
      await applyBtn.click();
      await page.waitForTimeout(2000);
    }

    // Fill email if prompted
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill(userInfo.email);
    }

    // Some CJB jobs redirect to external ATS — capture the redirect URL
    const finalUrl = page.url();

    const screenshot = await page.screenshot({ encoding: "base64" });
    return {
      success: true,
      message: `Initiated application on Canada Job Bank. Final URL: ${finalUrl}`,
      screenshotBase64: screenshot,
    };
  } catch (err: any) {
    return { success: false, message: err.message };
  } finally {
    await browser.close();
  }
}

async function submitIndeed(
  jobUrl: string,
  coverLetter: string,
  credentials: { email: string; password: string } | undefined,
  userInfo: { name: string; email: string; phone?: string }
): Promise<ApplicationResult> {
  if (!credentials?.email) {
    return { success: false, message: "Indeed credentials not configured. Add them in Profile → Settings." };
  }

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();

    // Log into Indeed
    await page.goto("https://ca.indeed.com/account/login", { waitUntil: "domcontentloaded" });
    await page.fill('input[name="__email"]', credentials.email);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);
    await page.fill('input[name="__password"]', credentials.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ timeout: 20_000 }).catch(() => {});

    // Navigate to job
    await page.goto(jobUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Click Apply button
    const applyBtn = page.locator('button:has-text("Apply now"), a:has-text("Apply now"), #indeedApplyButton').first();
    if (!(await applyBtn.isVisible())) {
      return { success: false, message: "Could not find Apply button on Indeed job page." };
    }
    await applyBtn.click();
    await page.waitForTimeout(3000);

    // Indeed Easy Apply multi-step form — handle common fields
    await fillIndeedForm(page, coverLetter, userInfo);

    const screenshot = await page.screenshot({ encoding: "base64" });
    return { success: true, message: "Application submitted via Indeed Easy Apply.", screenshotBase64: screenshot };
  } catch (err: any) {
    return { success: false, message: `Indeed submission error: ${err.message}` };
  } finally {
    await browser.close();
  }
}

async function fillIndeedForm(
  page: any,
  coverLetter: string,
  userInfo: { name: string; email: string; phone?: string }
) {
  // Phone number
  if (userInfo.phone) {
    const phoneInput = page.locator('input[id*="phone"], input[name*="phone"]').first();
    if (await phoneInput.isVisible()) await phoneInput.fill(userInfo.phone);
  }

  // Cover letter textarea
  const coverLetterArea = page
    .locator('textarea[id*="cover"], textarea[name*="cover"], textarea[placeholder*="cover"]')
    .first();
  if (await coverLetterArea.isVisible()) await coverLetterArea.fill(coverLetter);

  // Click through "Continue" buttons
  for (let i = 0; i < 6; i++) {
    const continueBtn = page
      .locator('button:has-text("Continue"), button:has-text("Next"), button[type="submit"]')
      .first();
    if (!(await continueBtn.isVisible())) break;
    const text = (await continueBtn.textContent())?.toLowerCase() ?? "";
    if (text.includes("submit")) {
      await continueBtn.click();
      break;
    }
    await continueBtn.click();
    await page.waitForTimeout(1500);
  }
}

async function submitLinkedIn(
  jobUrl: string,
  credentials: { email: string; password: string } | undefined,
  userInfo: { name: string; email: string; phone?: string }
): Promise<ApplicationResult> {
  if (!credentials?.email) {
    return { success: false, message: "LinkedIn credentials not configured. Add them in Profile → Settings." };
  }

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();

    // LinkedIn login
    await page.goto("https://www.linkedin.com/login");
    await page.fill('#username', credentials.email);
    await page.fill('#password', credentials.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ timeout: 20_000 }).catch(() => {});

    // Check for CAPTCHA / verification
    if (page.url().includes("challenge") || page.url().includes("checkpoint")) {
      return {
        success: false,
        message: "LinkedIn security challenge detected. Log in manually once then retry.",
      };
    }

    // Navigate to job
    await page.goto(jobUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Easy Apply button
    const easyApply = page
      .locator('button:has-text("Easy Apply"), .jobs-apply-button--top-card')
      .first();
    if (!(await easyApply.isVisible())) {
      return { success: false, message: "This LinkedIn job does not support Easy Apply." };
    }
    await easyApply.click();
    await page.waitForTimeout(2000);

    // Fill Easy Apply modal — step through pages
    for (let step = 0; step < 8; step++) {
      if (userInfo.phone) {
        const phone = page.locator('input[id*="phoneNumber"], input[id*="phone"]').first();
        if (await phone.isVisible()) await phone.fill(userInfo.phone);
      }

      const nextBtn = page
        .locator('button:has-text("Next"), button:has-text("Review"), button:has-text("Submit application")')
        .first();
      if (!(await nextBtn.isVisible())) break;
      const btnText = (await nextBtn.textContent())?.toLowerCase() ?? "";
      await nextBtn.click();
      await page.waitForTimeout(1500);
      if (btnText.includes("submit")) break;
    }

    const screenshot = await page.screenshot({ encoding: "base64" });
    return {
      success: true,
      message: "Application submitted via LinkedIn Easy Apply.",
      screenshotBase64: screenshot,
    };
  } catch (err: any) {
    return { success: false, message: `LinkedIn submission error: ${err.message}` };
  } finally {
    await browser.close();
  }
}

async function submitATS(
  jobUrl: string,
  coverLetter: string,
  userInfo: { name: string; email: string; phone?: string }
): Promise<ApplicationResult> {
  // For Greenhouse/Lever, navigate and fill the standard form
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.goto(jobUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(2000);

    // Common Greenhouse/Lever fields
    const firstNameInput = page.locator('input[id*="first_name"], input[name*="first_name"]').first();
    const lastNameInput = page.locator('input[id*="last_name"], input[name*="last_name"]').first();
    const emailInput = page.locator('input[type="email"]').first();

    const [firstName, ...rest] = userInfo.name.split(" ");
    if (await firstNameInput.isVisible()) await firstNameInput.fill(firstName);
    if (await lastNameInput.isVisible()) await lastNameInput.fill(rest.join(" ") || "");
    if (await emailInput.isVisible()) await emailInput.fill(userInfo.email);

    if (userInfo.phone) {
      const phone = page.locator('input[id*="phone"], input[type="tel"]').first();
      if (await phone.isVisible()) await phone.fill(userInfo.phone);
    }

    // Cover letter
    const coverArea = page
      .locator('textarea[id*="cover"], textarea[name*="cover"]')
      .first();
    if (await coverArea.isVisible()) await coverArea.fill(coverLetter);

    const screenshot = await page.screenshot({ encoding: "base64" });
    return {
      success: true,
      message: "Filled ATS application form. Review screenshot for confirmation.",
      screenshotBase64: screenshot,
    };
  } catch (err: any) {
    return { success: false, message: `ATS submission error: ${err.message}` };
  } finally {
    await browser.close();
  }
}
