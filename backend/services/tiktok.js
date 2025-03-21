const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const stealthPlugin = StealthPlugin();
puppeteer.use(stealthPlugin);

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { executablePath } = require('puppeteer');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0'
];

const getRandomUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Helper function to extract video ID from TikTok URL
 * @param {string} url - TikTok video URL
 * @returns {string|null} Video ID
 */
const extractVideoId = (url) => {
  try {
    if (typeof url !== 'string') return null;
    
    let match = url.match(/\/video\/(\d+)/);
    if (match && match[1]) return match[1];
    
    match = url.match(/\d{15,20}/);
    if (match) return match[0];
    
    return null;
  } catch (error) {
    logger.log('error', `Error extracting video ID: ${error.message}`);
    return null;
  }
};

/**
 * Get TikTok video directly via Player API URL
 * @param {string} tiktokUrl - TikTok video URL
 * @returns {Promise<Object>} Object containing video URL
 */
const getVideoUrlViaPlayerApiOnly = async (tiktokUrl) => {
  try {
    const videoId = extractVideoId(tiktokUrl);
    if (!videoId) {
      logger.log('error', `Could not extract a valid TikTok video ID: ${tiktokUrl}`);
      return {
        success: false,
        error: 'Could not extract a valid TikTok video ID'
      };
    }
    
    logger.log('info', `Getting video URL via Player API. Video ID: ${videoId}`);
    
    const playerApiUrl = `https://www.tiktok.com/player/v1/${videoId}?id=7099522475452681474&hide_author=1&utm_campaign=tt4d_open_api&utm_source=awbx37vxswqcvsf6`;
    
    logger.log('info', `TikTok Player API URL: ${playerApiUrl}`);

    let browser = null;
    try {
      const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;

      const launchOptions = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--disable-extensions',
          '--disable-blink-features=AutomationControlled'
        ],
        ignoreHTTPSErrors: true
      };

      // Vercel ortamında Chrome Executable Path'i belirtmeyin
      if (!isVercel) {
        launchOptions.executablePath = executablePath();
      }

      browser = await puppeteer.launch(launchOptions);
      
      const page = await browser.newPage();
      
      await page.setUserAgent(getRandomUserAgent());
      
      await page.evaluateOnNewDocument(() => {
        delete Object.getPrototypeOf(navigator).webdriver;
        window.navigator.chrome = {
          runtime: {},
          app: {},
          loadTimes: function() {},
          csi: function() {},
        };
      });
      
      logger.log('info', 'Navigating to player page...');
      await page.goto(playerApiUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      logger.log('info', 'Looking for video tag on the page...');
      
      let videoUrl = await page.evaluate(() => {
        const videos = Array.from(document.querySelectorAll('video'));
        for (const video of videos) {
          if (video.src && !video.src.includes('blank.mp4') && !video.src.startsWith('blob:')) {
            return video.src;
          }
        }
        
        for (const video of videos) {
          const sources = Array.from(video.querySelectorAll('source'));
          for (const source of sources) {
            if (source.src && !source.src.includes('blank.mp4') && !source.src.startsWith('blob:')) {
              return source.src;
            }
          }
        }
        
        const pageContent = document.documentElement.outerHTML;
        const videoUrlMatches = pageContent.match(/https:\/\/[^"'\s]*tiktokcdn\.com[^"'\s]*/gi) || [];
        if (videoUrlMatches.length > 0) {
          const validUrls = videoUrlMatches.filter(url => 
            url.includes('video/tos') && 
            !url.includes('/i18n/') && 
            !url.includes('solution-'));
          if (validUrls.length > 0) {
            return validUrls[0];
          }
        }
        return null;
      });

      if (!videoUrl) {
        logger.log('info', 'Video URL not found, monitoring network traffic...');
        
        let videoUrls = [];
        page.on('response', async (response) => {
          const url = response.url();
          const contentType = response.headers()['content-type'] || '';
          
          if (
            (contentType.includes('video/') || 
             url.includes('.mp4') || 
             url.includes('/video/tos/') || 
             url.includes('tiktokcdn.com'))
          ) {
            videoUrls.push(url);
            logger.log('info', `Potential video URL: ${url}`);
          }
        });
        
        await page.reload({ waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const validVideoUrls = videoUrls.filter(url => 
          url.includes('video/tos') && 
          !url.includes('/i18n/') && 
          !url.includes('solution-'));
        
        if (validVideoUrls.length > 0) {
          videoUrl = validVideoUrls[0];
          logger.log('info', `Video URL found from network traffic: ${videoUrl}`);
        }
      }
      
      if (!videoUrl) {
        logger.log('info', 'Video URL not found, analyzing DOM and JavaScript...');
        
        videoUrl = await page.evaluate(() => {
          const allElements = document.querySelectorAll('*[src]');
          for (const el of allElements) {
            if (el.src && 
                (el.src.includes('tiktokcdn.com') || el.src.includes('video/tos')) && 
                !el.src.includes('blank.mp4') && 
                !el.src.startsWith('blob:')) {
              return el.src;
            }
          }
          
          for (const key in window) {
            try {
              const value = window[key];
              if (value && typeof value === 'object') {
                const str = JSON.stringify(value);
                const matches = str.match(/"(https:\/\/[^"]*tiktokcdn[^"]*\.mp4[^"]*)"/g);
                if (matches && matches.length > 0) {
                  return matches[0].replace(/"/g, '');
                }
              }
            } catch (e) {
            }
          }
          
          return null;
        });
      }
      
      await browser.close();
      browser = null;
      
      if (videoUrl) {
        videoUrl = videoUrl.replace(/&amp;/g, '&');
        
        logger.log('success', `Video URL found: ${videoUrl}`);
        
        return {
          success: true,
          video_url: videoUrl,
          video_id: videoId,
          metadata: {
            id: videoId
          }
        };
      } else {
        logger.log('error', 'Could not find video URL on the page');
        return {
          success: false,
          error: 'Could not find video URL on the page'
        };
      }
    } catch (error) {
      logger.log('error', `Error getting video via Player API: ${error.message}`);
      if (browser) await browser.close();
      
      return {
        success: false,
        error: `Error getting video via Player API: ${error.message}`
      };
    }
  } catch (error) {
    logger.log('error', `Failed to get video URL via Player API: ${error.message}`);
    return {
      success: false,
      error: `Failed to get video URL via Player API: ${error.message}`
    };
  }
};

/**
 * Get TikTok video URL via API
 * @param {string} tiktokUrl - TikTok video URL
 * @returns {Promise<Object>} Object containing video URL
 */
const getVideoUrlViaApi = async (tiktokUrl) => {
  try {
    logger.log('info', `Getting video URL via API: ${tiktokUrl}`);
    
    const playerResult = await getVideoUrlViaPlayerApiOnly(tiktokUrl);
    if (playerResult && playerResult.success) {
      return playerResult;
    }
    
    logger.log('warn', `Player API failed, trying with Puppeteer: ${playerResult.error}`);
    
    return await getVideoUrlViaPuppeteer(tiktokUrl);
  } catch (error) {
    logger.log('error', `Failed to get video URL via API: ${error.message}`);
    return {
      success: false,
      error: `Failed to get video URL via API: ${error.message}`
    };
  }
};

/**
 * Get video URL from TikTok
 * @param {string} tiktokUrl - TikTok video URL
 * @returns {Promise<Object>} Object containing video URL
 */
const getVideoUrl = async (tiktokUrl) => {
  try {
    logger.log('info', `Getting video URL: ${tiktokUrl}`);
    
    if (!tiktokUrl.includes('tiktok.com')) {
      logger.log('error', `Invalid TikTok URL: ${tiktokUrl}`);
      return {
        success: false,
        error: 'Invalid TikTok URL. URL must contain tiktok.com'
      };
    }
  
    const apiResult = await getVideoUrlViaApi(tiktokUrl);
    if (apiResult && apiResult.success) {
      return apiResult;
    }
  
    logger.log('warn', `API method failed, trying with Puppeteer: ${apiResult.error}`);
    return await getVideoUrlViaPuppeteer(tiktokUrl);
  } catch (error) {
    logger.log('error', `Failed to get video URL: ${error.message}`);
    return {
      success: false,
      error: `Failed to get video URL: ${error.message}`
    };
  }
};

/**
 * Get video URL from TikTok using Puppeteer
 * @param {string} tiktokUrl - TikTok video URL
 * @returns {Promise<Object>} Object containing video URL
 */
const getVideoUrlViaPuppeteer = async (tiktokUrl) => {
  try {
    logger.log('info', `Getting video URL via Puppeteer: ${tiktokUrl}`);
    
    const videoId = extractVideoId(tiktokUrl);
    if (!videoId) {
      logger.log('warn', `Could not extract video ID, proceeding with full URL: ${tiktokUrl}`);
    }
    
    let browser = null;
    try {
      const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;

      const launchOptions = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--disable-extensions',
          '--disable-blink-features=AutomationControlled'
        ],
        ignoreHTTPSErrors: true
      };

      // Vercel ortamında Chrome Executable Path'i belirtmeyin
      if (!isVercel) {
        launchOptions.executablePath = executablePath();
      }

      browser = await puppeteer.launch(launchOptions);
      
      const page = await browser.newPage();
      
      await page.setUserAgent(getRandomUserAgent());
      
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      });
      
      await page.evaluateOnNewDocument(() => {
        delete Object.getPrototypeOf(navigator).webdriver;
        Object.defineProperty(navigator, 'plugins', {
          get: () => [
            {
              0: {type: 'application/x-google-chrome-pdf'},
              description: 'Portable Document Format',
              filename: 'internal-pdf-viewer',
              length: 1,
              name: 'Chrome PDF Plugin'
            }
          ]
        });
        
        window.navigator.chrome = {
          runtime: {},
          app: {},
          loadTimes: function() {},
          csi: function() {},
        };
        
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en', 'de'],
        });
        
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
      });
      
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (resourceType === 'font' || resourceType === 'image') {
          req.abort();
        } else {
          req.continue();
        }
      });
      
      let videoUrls = [];
      page.on('response', async (response) => {
        const url = response.url();
        const contentType = response.headers()['content-type'] || '';
        
        if (
          (contentType.includes('video/') || 
           url.includes('.mp4') || 
           url.includes('/video/tos/') || 
           url.includes('tiktokcdn.com'))
        ) {
          videoUrls.push(url);
          logger.log('info', `Network: Potential video URL: ${url}`);
        }
      });
      
      logger.log('info', `Navigating to: ${tiktokUrl}`);
      await page.goto(tiktokUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      await page.evaluate(() => {
        const closeButtons = Array.from(document.querySelectorAll('button')).filter(el => 
          el.textContent.includes('Close') || 
          el.textContent.includes('Cancel') || 
          el.textContent.includes('Later') ||
          el.getAttribute('aria-label') === 'Close'
        );
        
        if (closeButtons.length > 0) {
          closeButtons[0].click();
        }
      });
      
      await page.waitForSelector('video', { timeout: 10000 }).catch(() => {
        logger.log('warn', 'Video element not found on page');
      });
      
      await page.evaluate(() => {
        function simulateMouseMovement() {
          const maxX = window.innerWidth;
          const maxY = window.innerHeight;
          
          function move() {
            const x = Math.floor(Math.random() * maxX);
            const y = Math.floor(Math.random() * maxY);
            const element = document.elementFromPoint(x, y);
            
            if (element) {
              const event = new MouseEvent('mouseover', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y
              });
              element.dispatchEvent(event);
            }
            
            if (Math.random() > 0.7) clearInterval(interval);
          }
          
          const interval = setInterval(move, 500);
        }
        
        function simulateScrolling() {
          const maxScroll = Math.max(document.body.scrollHeight, 2000);
          
          function scroll() {
            const scrollAmount = Math.floor(Math.random() * 100) + 50;
            window.scrollBy(0, scrollAmount);
            
            if (window.scrollY > maxScroll * 0.7 || Math.random() > 0.9) clearInterval(interval);
          }
          
          const interval = setInterval(scroll, 800);
        }
        
        simulateMouseMovement();
        simulateScrolling();
      });
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      let videoUrl = null;
      
      const validVideoUrls = videoUrls.filter(url => 
        url.includes('video/tos') && 
        !url.includes('/i18n/') && 
        !url.includes('solution-'));
      
      if (validVideoUrls.length > 0) {
        videoUrl = validVideoUrls[0];
        logger.log('info', `Video URL found from network traffic: ${videoUrl}`);
      }
      
      if (!videoUrl) {
        videoUrl = await page.evaluate(() => {
          const videos = Array.from(document.querySelectorAll('video'));
          for (const video of videos) {
            if (video.src && !video.src.includes('blank.mp4') && !video.src.startsWith('blob:')) {
              return video.src;
            }
          }
          
          for (const video of videos) {
            const sources = Array.from(video.querySelectorAll('source'));
            for (const source of sources) {
              if (source.src && !source.src.includes('blank.mp4') && !source.src.startsWith('blob:')) {
                return source.src;
              }
            }
          }
          
          const pageContent = document.documentElement.outerHTML;
          const videoUrlMatches = pageContent.match(/https:\/\/[^"'\s]*tiktokcdn\.com[^"'\s]*/gi) || [];
          if (videoUrlMatches.length > 0) {
            const validUrls = videoUrlMatches.filter(url => 
              url.includes('video/tos') && 
              !url.includes('/i18n/') && 
              !url.includes('solution-'));
            if (validUrls.length > 0) {
              return validUrls[0];
            }
          }
          
          return null;
        });
        
        if (videoUrl) {
          logger.log('info', `Video URL found from page elements: ${videoUrl}`);
        }
      }
      
      if (!videoUrl) {
        videoUrl = await page.evaluate(() => {
          for (const key in window) {
            try {
              const value = window[key];
              if (value && typeof value === 'object') {
                const str = JSON.stringify(value);
                const matches = str.match(/"(https:\/\/[^"]*tiktokcdn[^"]*\.mp4[^"]*)"/g);
                if (matches && matches.length > 0) {
                  return matches[0].replace(/"/g, '');
                }
              }
            } catch (e) {
            }
          }
          
          return null;
        });
        
        if (videoUrl) {
          logger.log('info', `Video URL found from JS variables: ${videoUrl}`);
        }
      }
      
      let metadata = null;
      try {
        metadata = await page.evaluate(() => {
          const usernameElement = document.querySelector('a[href^="/@"]');
          const username = usernameElement ? usernameElement.textContent.trim() : null;
          
          const descriptionElement = document.querySelector('div[data-e2e="video-desc"], span[data-e2e="video-desc"]');
          const description = descriptionElement ? descriptionElement.textContent.trim() : null;
          
          return {
            username,
            description
          };
        });
      } catch (error) {
        logger.log('warn', `Error extracting metadata: ${error.message}`);
        metadata = { error: 'Could not extract metadata' };
      }
      
      await browser.close();
      browser = null;
      
      if (videoUrl) {
        videoUrl = videoUrl.replace(/&amp;/g, '&');
        
        logger.log('success', `Successfully found video URL: ${videoUrl}`);
        
        return {
          success: true,
          video_url: videoUrl,
          video_id: videoId || null,
          metadata: {
            id: videoId || null,
            ...metadata
          }
        };
      } else {
        logger.log('error', 'Could not find video URL on the page');
        return {
          success: false,
          error: 'Could not find video URL on the page'
        };
      }
    } catch (error) {
      logger.log('error', `Error getting video via Puppeteer: ${error.message}`);
      if (browser) await browser.close();
      
      return {
        success: false,
        error: `Error getting video via Puppeteer: ${error.message}`
      };
    }
  } catch (error) {
    logger.log('error', `Failed to get video URL via Puppeteer: ${error.message}`);
    return {
      success: false,
      error: `Failed to get video URL via Puppeteer: ${error.message}`
    };
  }
};

/**
 * Download TikTok video
 * @param {string} tiktokUrl - TikTok video URL
 * @returns {Promise<Object>} Object containing download information
 */
const downloadTikTokVideo = async (tiktokUrl) => {
  try {
    logger.log('info', `Downloading TikTok video: ${tiktokUrl}`);
    
    const result = await getVideoUrl(tiktokUrl);
    
    if (!result || !result.success || !result.video_url) {
      logger.log('error', `Failed to get video URL: ${result?.error || 'Unknown error'}`);
      return {
        success: false,
        error: result?.error || 'Failed to get video URL'
      };
    }
    
    const videoUrl = result.video_url;
    
    const videoId = result.video_id || extractVideoId(tiktokUrl) || crypto.createHash('md5').update(tiktokUrl).digest('hex').substring(0, 10);
    const fileName = `tiktok_${videoId}.mp4`;
    
    const downloadDir = path.join(__dirname, '../../downloads');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    
    const filePath = path.join(downloadDir, fileName);
    
    logger.log('info', `Downloading video to: ${filePath}`);
    
    const response = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'stream',
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Referer': 'https://www.tiktok.com/',
        'sec-ch-ua': '"Google Chrome";v="124", "Chromium";v="124", "Not-A.Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Origin': 'https://www.tiktok.com'
      },
      maxRedirects: 5,
      timeout: 30000
    });
    
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        logger.log('success', `Video downloaded successfully: ${filePath}`);
        resolve({
          success: true,
          video_url: videoUrl,
          file_name: fileName,
          download_path: filePath,
          metadata: result.metadata
        });
      });
      
      writer.on('error', (err) => {
        logger.log('error', `Error writing video file: ${err.message}`);
        reject({
          success: false,
          error: `Error writing video file: ${err.message}`
        });
      });
    });
  } catch (error) {
    logger.log('error', `Failed to download TikTok video: ${error.message}`);
    return {
      success: false,
      error: `Failed to download TikTok video: ${error.message}`
    };
  }
};

/**
 * Download video directly from URL
 * @param {string} videoUrl - Direct video URL
 * @param {string} sourceUrl - Original source URL (optional)
 * @returns {Promise<Object>} Object containing download information
 */
const downloadDirectVideo = async (videoUrl, sourceUrl = "") => {
  try {
    logger.log('info', `Downloading video directly from URL: ${videoUrl}`);
    
    const urlHash = crypto.createHash('md5').update(videoUrl).digest('hex').substring(0, 10);
    const fileName = `direct_${urlHash}.mp4`;
    
    const downloadDir = path.join(__dirname, '../../downloads');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    
    const filePath = path.join(downloadDir, fileName);
    
    logger.log('info', `Downloading video to: ${filePath}`);
    
    const response = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'stream',
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Referer': sourceUrl || 'https://www.tiktok.com/',
        'sec-ch-ua': '"Google Chrome";v="124", "Chromium";v="124", "Not-A.Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Origin': sourceUrl ? new URL(sourceUrl).origin : 'https://www.tiktok.com'
      },
      maxRedirects: 5,
      timeout: 30000
    });
    
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        logger.log('success', `Video downloaded successfully: ${filePath}`);
        resolve({
          success: true,
          video_url: videoUrl,
          file_name: fileName,
          download_path: filePath,
          mimeType: 'video/mp4',
          metadata: {
            source_url: sourceUrl
          }
        });
      });
      
      writer.on('error', (err) => {
        logger.log('error', `Error writing video file: ${err.message}`);
        reject({
          success: false,
          error: `Error writing video file: ${err.message}`
        });
      });
    });
  } catch (error) {
    logger.log('error', `Failed to download video directly: ${error.message}`);
    return {
      success: false,
      error: `Failed to download video directly: ${error.message}`
    };
  }
};

module.exports = {
  getVideoUrl,
  getVideoUrlViaPlayerApiOnly,
  downloadTikTokVideo,
  downloadDirectVideo,
  extractVideoId
}; 