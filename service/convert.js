import chromium from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'
import { executablePath } from 'puppeteer'
const { Readable } = require('stream')

async function getBrowser(isDev = false) {
  const params = {
    args: [
      ...chromium.args,
      '--hide-scrollbars',
      '--disable-web-security',
      '--arch=arm64',
    ],
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(
      `https://github.com/Sparticuz/chromium/releases/download/v119.0.2/chromium-v119.0.2-pack.tar`
    ),
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  }

  if (isDev) {
    params['executablePath'] = executablePath()
  }
  return puppeteer.launch(params)
}

export const getPdfStream = async (url, isDev = false) => {
  // Start headless chrome instance
  const browser = await getBrowser(isDev)
  const page = await browser.newPage()
  console.log('page generated')
  // Visit URL and wait until everything is loaded (available events: load, domcontentloaded, networkidle0, networkidle2)
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 8000 })
  //   await page.goto(url, { waitUntil: 'networkidle', timeout: 8000 })
  console.log('page evaluate start...')

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
  console.log('page emulateMediaType start...')

  // Tell Chrome to generate the PDF
  await page.emulateMediaType('screen')
  console.log('page stream start...')

  const pdfStream = await page.createPDFStream()

  // Close chrome instance
  // await browser.close()

  return pdfStream
}

export const getPdf = async (url, isDev) => {
  // Start headless chrome instance
  const browser = await getBrowser(isDev)
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

async function getImageAsBuffer(url) {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`
      )
    }

    const buffer = await response.arrayBuffer()
    return buffer
  } catch (error) {
    console.error('Error fetching image:', error.message)
    throw error
  }
}

export const getCompressedPdf = async (url, isDev) => {
  // Start headless chrome instance
  const browser = await getBrowser(isDev)
  const page = await browser.newPage()


  const imgBuffer = await getImageAsBuffer(url)
  const mimeType =
    url.endsWith('.jpg') || url.endsWith('.jpeg') ? 'image/jpeg' : 'image/png'

  // Convert ArrayBuffer to Buffer
  const imgBufferAsBuffer = Buffer.from(imgBuffer)

  // Convert Buffer to base64
  const base64Image = imgBufferAsBuffer.toString('base64')
  const htmlImage = `<img src="data:${mimeType};base64,${base64Image}">`


  await page.setContent(htmlImage)

  // await page.setContent(imgBuffer)
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
