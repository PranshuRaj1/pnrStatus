import { Builder, By } from "selenium-webdriver";
import { solveCaptchaInMemory, equationSolver } from "./helper.js";

/**
 * Automates fetching PNR status from IRCTC.
 * @param {string} pnrNumber - The PNR number to check.
 */
async function fetchPnrStatus(pnrNumber) {
  const driver = await new Builder().forBrowser("chrome").build();

  try {
    // Navigate to the IRCTC Common Captcha page
    await driver.get(
      "https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?locale=en"
    );

    // Input the PNR number
    const pnrInput = await driver.findElement(By.id("inputPnrNo"));
    await pnrInput.sendKeys(pnrNumber);

    const submitButton = await driver.findElement(By.id("modal1"));
    await submitButton.click();

    // Get the CAPTCHA image URL
    const captchaImageElement = await driver.findElement(By.id("CaptchaImgID"));
    const captchaSrc = await captchaImageElement.getAttribute("src");
    const captchaImageUrl = new URL(captchaSrc, "https://www.indianrail.gov.in")
      .href;

    console.log("Captcha Image URL:", captchaImageUrl);

    // Solve the CAPTCHA
    const captchaText = await solveCaptchaInMemory(captchaImageUrl);
    const captchaResult = equationSolver(captchaText);
    console.log("Resolved CAPTCHA Result:", captchaResult);

    // Input the CAPTCHA result
    const captchaInput = await driver.findElement(By.id("inputCaptcha"));
    await captchaInput.sendKeys(captchaResult);

    // Submit the form

    const submitButton1 = await driver.findElement(By.id("submitPnrNo"));
    await submitButton1.click();

    // Wait for results and extract them
    await driver.sleep(5000); // Adjust as needed
    const result = await driver.findElement(By.id("resultDiv")).getText();
    console.log("PNR Status:", result);
  } catch (error) {
    console.error("Error fetching PNR status:", error);
  } finally {
    await driver.quit();
  }
}

// Example usage
const pnrNumber = "6920398852"; // Replace with your PNR number
fetchPnrStatus(pnrNumber);
