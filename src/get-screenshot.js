const playwright = require('playwright-aws-lambda')
const queryString = require('query-string')
const config = require('./config')

module.exports = async (urlWithQueryparams) => {
  try {
    const uri = buildUri(urlWithQueryparams)
    console.log('uri', uri.path)

    const browser = await playwright.launchChromium({ headless: true })
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.setViewportSize({
      width: 1920,
      height: 1080
    })
    await page.goto(uri.path)

    await page.waitForSelector('body')
    const boundingRect = await page.evaluate(getBoundingSize, uri)
    const screenshotBuffer = await page.screenshot({ clip: boundingRect })
    await browser.close()
    const base64Image = screenshotBuffer.toString('base64')

    return base64Image
  } catch (error) {
    console.log(error)
    return { error }
  }
}

const buildUri = ({ queryStringParameters = {} }) => {
  const {
    url = config.url,
    id = config.elementId,
    title = "No Title, Yet!",
    width,
    height,
  } = queryStringParameters

  const params = {
    width,
    height,
    title,
    id
  }

  const urlParamString = queryString.stringify(params)

  return {
    id,
    path: `${url}?${urlParamString}`
  }
}

const getBoundingSize = (uri) => {
  const element = document.getElementById(uri.id)
  if (typeof element === 'undefined' || element === null)
    return { x: 0, y: 0, width: 1920, height: 1080 }

  const { x, y, width, height } = element.getBoundingClientRect()
  return { x, y, width, height }
}
