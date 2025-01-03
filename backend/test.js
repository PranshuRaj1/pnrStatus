import Tesseract from "tesseract.js";
import path from "path";
import { fileURLToPath } from "url";
import { equationSolver, solveCaptchaInMemory } from "./helper.js";

// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the image
const imagePath = path.join(__dirname, "cropped_captcha.png");

// Run OCR on the image
Tesseract.recognize(imagePath, "eng", {
  logger: (m) => {}, // Optional: Logs progress
})
  .then(({ data: { text } }) => {
    // console.log("Extracted Text:", text);
    const ans = equationSolver(text);
    console.log(ans);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
