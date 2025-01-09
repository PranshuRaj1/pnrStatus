import Tesseract from 'tesseract.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { equationSolver } from './helper.js';

// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to run OCR and solve the equation
export async function extractAndSolve(imageFileName) {
  const imagePath = path.join(__dirname, imageFileName);

  try {
    const {
      data: { text },
    } = await Tesseract.recognize(imagePath, 'eng', {
      logger: (m) => {
        // Optional: Logs progress
      },
    });
    console.log('Detected Text: ', text);
    const ans = equationSolver(text);
    return ans;
  } catch (error) {
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}
