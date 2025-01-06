import express from 'express';
import { fetchPnrCookie, fetchPnrStatus } from './index.js';
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

const app = express();
const port = 3000;

const samplePNR=2426776616;

let driver; // Declare the driver variable in the global scope

app.use(express.json());

app.get('/', async (req, res) => {
  try {
    const data = req.body;
    if (!data.pnr) {
      return res.status(400).send({ error: 'PNR number is required' });
    }

    const ans = await fetchPnrStatus(data.pnr, driver); // Pass the driver to fetchPnrStatus
    const tabs = await driver.getAllWindowHandles(); // Get all open tabs

    if (tabs.length > 1) {
      await driver.switchTo().window(tabs[1]); // Switch to the second tab
      await driver.close(); // Close the second tab
      await driver.switchTo().window(tabs[0]); // Switch back to the original tab
    }

    res.send(ans);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ error: 'An error occurred' });
  }
});

app.listen(port, async () => {
  try {
    const options = new chrome.Options();
    options.addArguments(
      // '--headless', // Run in headless mode
      '--disable-gpu', // Disable GPU for stability
      '--no-sandbox', // Recommended for certain environments
      '--start-maximized', // Start in full screen
      '--window-size=1920,1080', // Set a consistent resolution for headless mode
      '--enable-unsafe-swiftshader'
    );

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    console.log('Selenium driver started.');

    // Run fetchPnrCookie on server startup
    await fetchPnrCookie(samplePNR, driver);

    // Schedule fetchPnrCookie to run every 2 minutes
    setInterval(async () => {
      try {
        console.log('Refreshing cookies...');
        await fetchPnrCookie(samplePNR, driver);
      } catch (error) {
        console.error('Error refreshing cookies:', error);
      }
    }, 20000); // 

    console.log(`Server is running on http://localhost:${port}`);
  } catch (error) {
    console.error('Failed to start the Selenium driver:', error);
  }
});

// Gracefully shut down the driver when the server stops
process.on('SIGINT', async () => {
  if (driver) {
    await driver.quit();
    console.log('Selenium driver shut down');
  }
  process.exit();
});
