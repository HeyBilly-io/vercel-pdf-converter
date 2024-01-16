const { getPdf } = require('../service/convert')
const { getCompressedPdf } = require('../service/convert')
const { getPdfStream } = require('../service/convert')

// Cache header max age
const maxAge = 24 * 60 * 60

const sendPdfStream = async (url, isDev) => {
  const pdfStream = await getPdfStream(url, isDev)
  console.log('pdf stream start!')
  // pdfStream.pipe(res)

  let i = 1
  return new Promise((resolve, reject) => {
    pdfStream.on('data', (chunk) => {
      console.log(`Chunk ${i} (${chunk.length} bytes)`)
      i++
      // console.log('new chunk')
      // Check if the response is still writable
      if (!res.writable) {
        pdfStream.destroy() // Close the PDF stream if the response is closed
        reject(new Error('Response closed prematurely.'))
      } else {
        // Write the chunk to the response
        res.write(chunk)
      }
    })

    pdfStream.on('end', () => {
      // End the response when all chunks are sent
      res.end()
      resolve()
    })

    pdfStream.on('error', (error) => {
      // Handle errors during streaming
      reject(error)
    })
  })
}

module.exports = async (req, res) => {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') return res.status(405).end()

    // Strip leading slash from request path
    const url = req.url.replace(/^\/+/, '')

    // Block favicon.ico requests from reaching puppeteer
    if (url === 'favicon.ico') return res.status(404).end()

    console.log(`Converting: ${url}`)
    const isDev = req?.headers?.host?.startsWith('localhost') ?? false

    // return await getCompressedPdf(res, url, isDev)

    // const pdfBuffer = await getPdf(url)

    // if (!pdfBuffer) return res.status(400).send('Error: could not generate PDF')

    // Instruct browser to cache PDF for maxAge ms
    if (process.env.NODE_ENV !== 'development')
      res.setHeader('Cache-control', `public, max-age=${maxAge}`)

    // Set Content type to PDF and send the PDF to the client
    res.setHeader('Content-type', 'application/pdf')

    // return await sendPdfStream(url, isDev);
    // const pdfBuffer = await getPdf(url, isDev)
    const pdfBuffer = await getCompressedPdf(res, url, isDev)
    //5039028
    console.log(pdfBuffer.byteLength)

    if (!pdfBuffer) return res.status(400).send('Error: could not generate PDF')
    if (process.env.NODE_ENV !== 'development')
      res.setHeader('Cache-control', `public, max-age=${maxAge}`)

    // Set Content type to PDF and send the PDF to the client
    res.setHeader('Content-type', 'application/pdf')
    res.send(pdfBuffer)
  } catch (err) {
    if (
      err.message ===
      'Protocol error (Page.navigate): Cannot navigate to invalid URL'
    )
      return res.status(404).end()

    console.error(err)
    res.status(500).send('Error: ' + err)
  }
}
