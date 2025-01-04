import { Builder, By, until } from "selenium-webdriver";
import sharp from "sharp";
import { extractAndSolve } from "./test.js";
import fs from 'fs'

async function solveCaptcha(driver) {
  // Wait for the CAPTCHA image to be fully visible
  const captchaElement = await driver.wait(
    until.elementIsVisible(await driver.findElement(By.id("myModal"))),
    5000
  );

  // Get the bounding rectangle of the CAPTCHA image
  const rect  = await captchaElement.getRect();

  if (rect.width === 0 || rect.height === 0) {
    throw new Error("CAPTCHA image has zero width or height. Retrying...");
  }

  // Take a screenshot of the entire page
  const screenshot = await driver.takeScreenshot();
  const screenshotBuffer = Buffer.from(screenshot, "base64");

  // Save the screenshot for debugging
  fs.writeFileSync("screenshot.png", screenshotBuffer);

  // Calculate cropping area dynamically
  const extractArea = {
    left: 370, // X-coordinate of the CAPTCHA
    top: 130, // Y-coordinate of the CAPTCHA
    width: 440, // Width of the CAPTCHA
    height: 50, // Height of the CAPTCHA
  };
  console.log("Calculated extract area:", extractArea);


  // Crop the CAPTCHA image from the screenshot using sharp
  const metadata = await sharp(screenshotBuffer).metadata();
  console.log("Image dimensions:", metadata.width, metadata.height);



if (
  extractArea.left + extractArea.width <= metadata.width &&
  extractArea.top + extractArea.height <= metadata.height
) {

  await sharp(screenshotBuffer)
    .extract(extractArea)
    .toFile("cropped_captcha.png");
    console.log("CAPTCHA cropped successfully!");
} else {
  console.log("Extract area exceeds screenshot bounds. Check calculations.");
}

console.log("Processing CAPTCHA...");

  return extractAndSolve("cropped_captcha.png");
}

async function fetchPnrStatus(pnrNumber) {
  const driver = await new Builder().forBrowser("chrome").build();

  try {
    await driver.get(
      "https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?locale=en"
    );

    const pnrInput = await driver.findElement(By.id("inputPnrNo"));
    await pnrInput.sendKeys(pnrNumber);

    const submitButton = await driver.findElement(By.id("modal1"));
    await submitButton.click();

    const captchaResult = await solveCaptcha(driver);

    console.log("Resolved CAPTCHA Result:", captchaResult);

    const captchaInput = await driver.findElement(By.id("inputCaptcha"));
    await captchaInput.sendKeys(captchaResult);

    const submitButton1 = await driver.findElement(By.id("submitPnrNo"));
    await submitButton1.click();

    await driver.sleep(5000);
    const result = await driver.findElement(By.id("resultDiv")).getTaat();
    console.log("PNR Status:", result);
  } catch (error) {
    console.error("Error fetching PNR status:", error);
  } finally {
    await driver.quit();
  }
}

const pnrNumber = "6920398852";
fetchPnrStatus(pnrNumber);
