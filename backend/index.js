import { Builder, By, until } from "selenium-webdriver";
import fs from "fs";
import { createWorker } from "tesseract.js";
import sharp from "sharp";
import { equationSolver } from "./helper.js";
import { extractAndSolve } from "./test.js";

async function solveCaptcha(driver) {
  // Wait for the CAPTCHA image to be fully visible
  const captchaElement = await driver.wait(
    until.elementIsVisible(await driver.findElement(By.id("CaptchaImgID"))),
    5000
  );

  // Get the bounding rectangle of the CAPTCHA image
  const location = await captchaElement.getRect();

  console.log(location);

  if (location.width === 0 || location.height === 0) {
    throw new Error("CAPTCHA image has zero width or height. Retrying...");
  }

  // Take a screenshot of the entire page
  const screenshot = await driver.takeScreenshot();
  const screenshotBuffer = Buffer.from(screenshot, "base64");

  // Crop the CAPTCHA image from the screenshot using sharp
  const croppedCaptchaPath = "cropped_captcha.png";
  await sharp(screenshotBuffer)
    .extract({
      left: 1112,
      top: 198,
      width: 200,
      height: 75,
    })
    .toFile(croppedCaptchaPath);

  console.log("```````````````````````````````````````````````````````````");

  return extractAndSolve(croppedCaptchaPath);
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
    const result = await driver.findElement(By.id("resultDiv")).getText();
    console.log("PNR Status:", result);
  } catch (error) {
    console.error("Error fetching PNR status:", error);
  } finally {
    await driver.quit();
  }
}

const pnrNumber = "6920398852";
fetchPnrStatus(pnrNumber);
