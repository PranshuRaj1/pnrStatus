import { Builder, By, until } from "selenium-webdriver";
import sharp from "sharp";
import { extractAndSolve } from "./test.js";
import fs from "fs";
import chrome from "selenium-webdriver/chrome.js";

async function solveCaptcha(driver) {
  // Wait for the CAPTCHA image to be fully visible
  const captchaElement = await driver.wait(
    until.elementIsVisible(await driver.findElement(By.id("myModal"))),
    7000
  );

  // Get the bounding rectangle of the CAPTCHA image
  const rect = await captchaElement.getRect();

  if (rect.width === 0 || rect.height === 0) {
    throw new Error("CAPTCHA image has zero width or height. Retrying...");
  }

  // Get the device pixel ratio (DPR)
  const devicePixelRatio = await driver.executeScript("return window.devicePixelRatio;");
  console.log("Device Pixel Ratio (DPR):", devicePixelRatio);

  // Adjust rectangle dimensions based on DPR
  const scaledRect = {
    left: 1000,
    top: Math.round(rect.y * devicePixelRatio),
    width: 800,
    height: 400,
  };
  console.log("Scaled rectangle:", scaledRect);

  // Take a screenshot of the entire page
  const screenshot = await driver.takeScreenshot();
  const screenshotBuffer = Buffer.from(screenshot, "base64");

  // Save the screenshot for debugging
  fs.writeFileSync("screenshot.png", screenshotBuffer);

  // Crop the CAPTCHA image from the screenshot using sharp
  const metadata = await sharp(screenshotBuffer).metadata();
  console.log("Image dimensions:", metadata.width, metadata.height);

  if (
    scaledRect.left + scaledRect.width <= metadata.width &&
    scaledRect.top + scaledRect.height <= metadata.height
  ) {
    await sharp(screenshotBuffer)
      .extract(scaledRect)
      .toFile("cropped_captcha.png");
    console.log("CAPTCHA cropped successfully!");
  } else {
    console.log("Extract area exceeds screenshot bounds. Check calculations.");
  }

  console.log("Processing CAPTCHA...");

  return extractAndSolve("cropped_captcha.png");
}

async function fetchPnrStatus(pnrNumber) {
  const options = new chrome.Options();
  options.addArguments(
    "--headless", // Run in headless mode
    "--disable-gpu", // Disable GPU for stability
    "--no-sandbox", // Recommended for certain environments
    "--start-maximized", // Start in full screen
    "--window-size=1920,1080" // Set a consistent resolution for headless mode
  );

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    await driver.get(
      "https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?locale=en"
    );

    // Set a consistent viewport size
    await driver.manage().window().setRect({ width: 1920, height: 1080 });

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

    // Wait for the PNR status to load
    await driver.sleep(1000);

    // Open a new tab and navigate to Google
    await driver.executeScript(`window.open("https://www.indianrail.gov.in/enquiry/CommonCaptcha?inputPnrNo=${pnrNumber}&inputPage=PNR&language=en", '_blank');`);

    // Switch to the new tab
    const tabs = await driver.getAllWindowHandles();
    await driver.switchTo().window(tabs[1]);
    
    // Wait for the page to load completely
    await driver.sleep(1000);

    // Locate the <pre> tag and extract its text content
    const preTagElement = await driver.findElement(By.css("pre"));
    const preTagData = await preTagElement.getText();

    // Log the data to the console
    console.log("Data inside <pre> tag:", preTagData);

  } catch (error) {
    console.error("Error fetching PNR status:", error);
  } finally {
    console.log("success")
  }
}

const pnrNumber = "6920398852";
fetchPnrStatus(pnrNumber);
