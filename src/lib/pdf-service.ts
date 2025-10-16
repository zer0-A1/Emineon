import chromium from "@sparticuz/chromium-min";
import puppeteerCore from "puppeteer-core";

async function getBrowser() {
  const REMOTE_PATH = process.env.CHROMIUM_REMOTE_EXEC_PATH;
  const LOCAL_PATH = process.env.CHROMIUM_LOCAL_EXEC_PATH;
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isVercel = !!process.env.VERCEL_ENV;
  
  console.log('🔧 PDF Service Environment Check:', {
    REMOTE_PATH: REMOTE_PATH ? 'Set' : 'Not set',
    LOCAL_PATH: LOCAL_PATH ? 'Set' : 'Not set',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    isDevelopment,
    isVercel
  });

  // Prioritize local development environment
  if (isDevelopment && !isVercel) {
    if (LOCAL_PATH) {
      console.log('🚀 Using local Chromium for development environment');
      return await puppeteerCore.launch({
        executablePath: LOCAL_PATH,
        defaultViewport: null,
        headless: true,
        args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
    '--disable-gpu',
          '--window-size=1920x1080'
        ]
      });
    } else {
      // Try to find Chrome/Chromium on macOS
      const macChromePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium'
  ];

      for (const chromePath of macChromePaths) {
        try {
          console.log(`🔍 Trying Chrome path: ${chromePath}`);
          return await puppeteerCore.launch({
            executablePath: chromePath,
        defaultViewport: null,
        headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--disable-gpu',
              '--window-size=1920x1080'
            ]
          });
    } catch (error) {
          console.log(`❌ Failed to launch with ${chromePath}`);
          continue;
        }
      }
      
      throw new Error('Could not find Chrome/Chromium installation for local development');
    }
  }

  // For production/serverless environments
  if (REMOTE_PATH) {
    console.log('🚀 Using remote Chromium for serverless environment');
    return await puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(REMOTE_PATH),
      defaultViewport: null,
      headless: true,
    });
  }

  throw new Error("Missing a path for chromium executable");
}

// Generate PDF from HTML content (adapted from user's makePDFFromDomain)
export const generatePDF = async (htmlContent: string): Promise<Buffer> => {
  let browser;
  let page;
  
  try {
    console.log('🔧 Starting PDF generation from HTML content...');
    
    browser = await getBrowser();
    console.log('✅ Browser launched successfully');

    page = await browser.newPage();
    
    // Error handling
    page.on("pageerror", (err: Error) => {
      console.error('❌ Page error:', err);
      throw err;
    });
    page.on("error", (err: Error) => {
      console.error('❌ Browser error:', err);
      throw err;
    });

    // Set viewport for consistent rendering
    await page.setViewport({ width: 1080, height: 1024 });
    console.log('✅ Viewport configured');

    // Set HTML content instead of navigating to URL
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    console.log('✅ HTML content loaded');

    // Generate PDF with high-quality settings for competence files
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px", 
        right: "20px", 
        bottom: "20px", 
        left: "20px" 
      },
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      scale: 1.0,
    });
    
    console.log('✅ PDF generated successfully');
    console.log(`📄 PDF size: ${(pdf.length / 1024).toFixed(2)} KB`);

    return Buffer.from(pdf);
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    throw error;
  } finally {
    // Clean up resources
    if (page) {
      try {
        await page.close();
        console.log('✅ Page closed');
      } catch (closeError) {
        console.error('⚠️ Error closing page:', closeError);
      }
    }
    if (browser) {
    try {
        await browser.close();
      console.log('✅ Browser closed');
      } catch (closeError) {
        console.error('⚠️ Error closing browser:', closeError);
      }
    }
  }
}; 