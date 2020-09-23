const playwright = require("playwright-aws-lambda")

module.exports = async (urlWithQueryparams) => {
  try {
    const uri = buildUri(urlWithQueryparams)
    console.log('uri', uri.path)

    const browser = await playwright.launchChromium()
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.setViewportSize({
      width: 1920,
      height: 1080
    })
    await page.goto(uri.path)

    await new Promise((resolve) => setTimeout(resolve, "100"))
    const boundingRect = await page.evaluate(getBoundingSize, uri)
    const screenshotBuffer = await page.screenshot({ clip: boundingRect })
    await browser.close()
    const base64Image = screenshotBuffer.toString("base64")

    return base64Image
  } catch (error) {
    console.log(error)
    return { statusCode: error.statusCode || 500, body: error.message }
  }
}

const buildUri = ({ queryStringParameters = {} }) => {
  const {
    cardpath = "http://localhost:3000/ogimage",
    id = "social-card",
    title = "No Title, Yet!",
    width,
    height,
  } = queryStringParameters;

  const dimensions = width && height ? `&width=${width}&height=${height}` : "";

  return {
    id,
    path: `${cardpath}?id=${id}&title=${title}${dimensions}`,
  }
}

const getBoundingSize = (uri) => {
  const cardBox = document.getElementById(uri.id)
  if (typeof cardBox === "undefined" || cardBox === null)
    return { x: 0, y: 0, width: 1920, height: 1080 }

  const { x, y, width, height } = cardBox.getBoundingClientRect()
  return { x, y, width, height }
}
