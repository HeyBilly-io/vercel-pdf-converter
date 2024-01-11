import chromium from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'
// import { executablePath } from 'puppeteer'

async function getBrowser() {
  //   // local development is broken for this 👇
  //   // but it works in vercel so I'm not gonna touch it
  return puppeteer.launch({
    args: [
      ...chromium.args,
      '--hide-scrollbars',
      '--disable-web-security',
      '--arch=arm64',
    ],
	  defaultViewport: chromium.defaultViewport,
	// For dev
    // executablePath: executablePath(),
    executablePath: await chromium.executablePath(
      `https://github.com/Sparticuz/chromium/releases/download/v119.0.2/chromium-v119.0.2-pack.tar`
    ),
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  })
}

export const getPdf = async (url) => {
  // Start headless chrome instance
  const browser = await getBrowser()
  const page = await browser.newPage()
  console.log('page generated')
  // Visit URL and wait until everything is loaded (available events: load, domcontentloaded, networkidle0, networkidle2)
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 8000 })
  //   await page.goto(url, { waitUntil: 'networkidle', timeout: 8000 })

  // Scroll to bottom of page to force loading of lazy loaded images
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0
      const distance = 100
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight
        window.scrollBy(0, distance)
        totalHeight += distance

        if (totalHeight >= scrollHeight) {
          clearInterval(timer)
          resolve()
        }
      }, 5)
    })
  })

  // Tell Chrome to generate the PDF
  await page.emulateMediaType('screen')
  const buffer = await page.pdf({
    format: 'A4',
    displayHeaderFooter: true,
    headerTemplate: '',
    footerTemplate: '',
    printBackground: true,
  })

  // Close chrome instance
  await browser.close()

  return buffer
}
