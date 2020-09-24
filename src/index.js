const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')
const getScreenshot = require('./get-screenshot')
const getPaths = require('./get-paths')
const defaults = require('./config')

const chalk = require('chalk')
const terminalError = chalk.bold.red
const terminalSuccess = chalk.bold.green

const args = require('minimist')(process.argv.slice(2), {
  alias: {
    i: 'input',
    o: 'output',
    n: 'name',
    t: 'title',
    F: 'force'
  }
})

const options = {
  ...defaults,
  ...args
}

const { inputPath, outputPath } = getPaths(options)

async function processFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf8')
  const frontmatter = matter(content).data
  
  const nameArray = frontmatter.path
    ? frontmatter.path.split('/')
    : ['site-default']

  if (Boolean(frontmatter.draft)) {
    console.warn(`[skipping-draft] ${filepath}`)
    return
  }

  const outputName = `${nameArray[nameArray.length - 1]}.${options.extension}`
  const imageArray = frontmatter.image ? frontmatter.image.split('/') : [outputName]
  const imageName = imageArray[imageArray.length - 1]
  const writePath = path.join(outputPath, outputName)
  const writeExists = fs.existsSync(writePath)

  if (imageName !== outputName)
    console.warn(
      `[warning] [${outputName}] does not match image name [${imageName}]`,
    )

  // 
  if (!writeExists || args.F) {
    // TODO: just use buffer instead of string
    // TODO: terminal params should have priority over frontmatter
    // TODO: test arrays
    const optionsWithFrontmatter = Object.assign({}, options, frontmatter)
    let base64String = await getScreenshot(optionsWithFrontmatter)

    let base64Image = base64String.split('base64,').pop()

    fs.writeFile(writePath, base64Image, {encoding: 'base64'}, function(err) {
      console.log(terminalSuccess('✔ File created'))
      console.log('-----------------------------------------')
    })

    let forced = args.F ? ' (forced update)' : ''

    console.log(`${chalk.green('✔')} Creating image ${chalk.hex('#BAFFC5')(imageName)}${forced}...`)
  } else {
    console.log(`Skipping this image, it already exists.`)
  }
}

function isValidExtension(filePath) {
  const fArray = filePath.split('.')
  const extension = fArray[fArray.length - 1]
  return ['md', 'mdx'].includes(extension)
}

async function processDir(dirpath) {
  const dir = await fs.promises.opendir(dirpath)
  for await (const dirent of dir) {
    if (isValidExtension(dirent.name))
      await processFile(path.join(dirpath, dirent.name))
  }
}

function processFiles() {
  fs.stat(inputPath, function(err, stats) {
    if (stats.isDirectory()) {
      processDir(inputPath)
    } else if (stats.isFile()) {
      if (isValidExtension(inputPath)) processFile(inputPath)
    }
  })
}

processFiles(inputPath)
