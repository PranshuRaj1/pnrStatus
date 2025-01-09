import tesseract from 'tesseract.js';
import axios from 'axios';
import sharp from 'sharp';
import fs from 'fs';

/**
 * Solves a simple arithmetic equation (e.g., "12+34" or "56-78").
 * @param {string} s - The equation string.
 * @returns {number} - The result of the equation.
 */
export function equationSolver(s) {
  // Split the string at the '=' and take only the part before it
  const beforeEqual = s.split('=')[0];

  // Use a regular expression to extract the equation (supports + and - operators)
  const equationRegex = /(\d+)\s*([\+\-])\s*(\d+)/;
  const match = beforeEqual.match(equationRegex);

  if (!match) {
    throw new Error('No valid equation found in the string.');
  }

  // Extract the numbers and operator from the match
  const first = Number.parseInt(match[1], 10);
  const operator = match[2];
  const second = Number.parseInt(match[3], 10);

  // Perform the arithmetic operation
  if (operator === '+') {
    return first + second;
  } else if (operator === '-') {
    return first - second;
  }

  throw new Error('Unsupported operator.');
}

/**
 * Fetches the CAPTCHA image and extracts the text using Tesseract.js.
 * @param {string} url - The CAPTCHA image URL.
 * @returns {Promise<string>} - The extracted text from the CAPTCHA.
 */
export async function solveCaptchaInMemory(url) {
  try {
    // Fetch the image as a binary buffer
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data);

    // Preprocess the image (Grayscale + Thresholding)
    const processedImageBuffer = await sharp(imageBuffer)
      .grayscale() // Convert to grayscale
      .threshold(128) // Apply Otsu's threshold (binarization)
      .toBuffer(); // Get the processed image as a buffer
    // Perform OCR on the processed image buffer
    const result = await tesseract.recognize(processedImageBuffer, 'eng', {
      logger: (info) => console.log(info), // Optional: Logs OCR progress
      tessedit_char_whitelist: '0123456789+-s', // Whitelist allowed characters
    });

    // Clean up the result (remove extra whitespace)
    let captchaText = result.data.text.trim();
    captchaText = captchaText.replace(/[^0-9+\-]/g, ''); // Remove unwanted characters

    console.log('Extracted CAPTCHA Text:', captchaText);

    return captchaText;
  } catch (error) {
    console.error('Error processing CAPTCHA:', error.message);
  }
}
