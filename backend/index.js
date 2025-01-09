import { Builder, By, until } from 'selenium-webdriver';
import sharp from 'sharp';
import { extractAndSolve } from './test.js';
import fs from 'fs';
import chrome from 'selenium-webdriver/chrome.js';

async function solveCaptcha(driver) {
  // Wait for the CAPTCHA image to be fully visible
  const captchaElement = await driver.wait(
    until.elementIsVisible(await driver.findElement(By.id('CaptchaImgID'))),
    3000
  );

  const scaledRect = {
    left: 1000,
    top: 0,
    width: 1200,
    height: 400,
  };

  // Take a screenshot of the entire page
  const screenshot = await driver.takeScreenshot();
  const screenshotBuffer = Buffer.from(screenshot, 'base64');

  await sharp(screenshotBuffer)
    .extract(scaledRect)
    .toFile('cropped_captcha.png');

  console.log('CAPTCHA cropped successfully!');

  return extractAndSolve('cropped_captcha.png');
}

export async function fetchPnrCookie(pnrNumber, driver, startup) {
  try {
    if (startup) {
      await driver.get(
        'https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?locale=en'
      );
      await driver.manage().window().setRect({ width: 1920, height: 1080 });
    } else {
      const tabs = await driver.getAllWindowHandles();
      await driver.switchTo().window(tabs[0]);
      driver.navigate().refresh();
    }

    const pnrInput = await driver.findElement(By.id('inputPnrNo'));
    await pnrInput.sendKeys(pnrNumber);

    const submitButton = await driver.findElement(By.id('modal1'));
    // "submitPnrNo"
    await submitButton.click();
    console.log('Clicked submit button');

    const captchaResult = await solveCaptcha(driver);
    console.log('Resolved CAPTCHA Result:', captchaResult);

    const captchaInput = await driver.findElement(By.id('inputCaptcha'));
    await captchaInput.sendKeys(captchaResult);

    const submitButton1 = await driver.findElement(By.id('submitPnrNo'));
    await submitButton1.click();
    //CAPTCHA SOLVED and Cookie obtained
  } catch (error) {
    console.log('Error fetching PNR status:', error);
  }
}

export async function fetchPnrStatus(pnrNumber, driver) {
  // Open a new tab and navigate to Google
  await driver.executeScript(
    `window.open("https://www.indianrail.gov.in/enquiry/CommonCaptcha?inputPnrNo=${pnrNumber}&inputPage=PNR&language=en", '_blank');`
  );

  // Switch to the new tab
  const tabs = await driver.getAllWindowHandles();
  await driver.switchTo().window(tabs[1]);

  // Locate the <pre> tag and extract its text content
  return await driver.findElement(By.css('pre')).getText();
}
// const pnrNumber = "6920398852";
// const resultOf = fetchPnrStatus(pnrNumber);
// console.log(resultOf);
