import tesseract from "tesseract.js";
import axios from "axios";
import sharp from "sharp";

/**
 * Solves a simple arithmetic equation (e.g., "12+34" or "56-78").
 * @param {string} s - The equation string.
 * @returns {number} - The result of the equation.
 */
export function equationSolver(s) {
  let idx = 0;
  let operator = "";

  // Identify the operator and its position
  for (let i = 0; i < s.length; i++) {
    if (s.charAt(i) === "+" || s.charAt(i) === "-") {
      idx = i;
      operator = s.charAt(i);
      break;
    }
  }

  // Split the string into two numbers based on the operator position
  const firstNumber = s.substring(0, idx);
  const secondNumber = s.substring(idx + 1);

  const first = Number.parseInt(firstNumber);

  console.log("first" + first);

  const second = Number.parseInt(secondNumber);

  console.log("second" + second);

  if (isNaN(first) || isNaN(second)) {
    throw new Error("Invalid equation format.");
  }

  // Perform the arithmetic operation
  if (operator === "+") {
    return first + second;
  }

  return first - second;
}

/**
 * Fetches the CAPTCHA image and extracts the text using Tesseract.js.
 * @param {string} url - The CAPTCHA image URL.
 * @returns {Promise<string>} - The extracted text from the CAPTCHA.
 */
export async function solveCaptchaInMemory(url) {
  try {
    // Fetch the image as a binary buffer
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const imageBuffer = Buffer.from(response.data);

    // Preprocess the image (Grayscale + Thresholding)
    const processedImageBuffer = await sharp(imageBuffer)
      .grayscale() // Convert to grayscale
      .threshold(128) // Apply Otsu's threshold (binarization)
      .toBuffer(); // Get the processed image as a buffer

    // Perform OCR on the processed image buffer
    const result = await tesseract.recognize(processedImageBuffer, "eng", {
      logger: (info) => console.log(info), // Optional: Logs OCR progress
      tessedit_char_whitelist: "0123456789+-", // Whitelist allowed characters
    });

    // Clean up the result (remove extra whitespace)
    let captchaText = result.data.text.trim();
    captchaText = captchaText.replace(/[^0-9+\-]/g, ""); // Remove unwanted characters

    console.log("Extracted CAPTCHA Text:", captchaText);

    return captchaText;
  } catch (error) {
    console.error("Error processing CAPTCHA:", error.message);
  }
}
