const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')
const getScreenshot = require('./get-screenshot')
const config = require('./config')

const chalk = require('chalk')
const terminalError = chalk.bold.red
const terminalSuccess = chalk.bold.green

const args = require('minimist')(process.argv.slice(2), {
  default: {
    input: config.inputPath,
    output: config.outputPath,
    width: 1200,
    height: 630,
    tag: []
  },
  alias: {
    i: 'input',
    o: 'output',
    n: 'name',
    t: 'title',
    m: 'mode',
    F: 'force'
  }
})

const inputPath = path.join(process.cwd(), args.input)
const outputPath = path.join(process.cwd(), args.output)

const inputExists = fs.existsSync(inputPath)
const outputExists = fs.existsSync(outputPath)

if (inputExists && outputExists) {
  console.log(`${chalk.green('✔')} Input/output paths exist`)
} else {
  if (!inputExists) {
    console.log(`${chalk.red('✗')} Input path "${args.input}" does not exist`)
  }

  if (!outputExists) {
    console.log(`${chalk.red('✗')} Output path "${args.output}" does not exist`)
  }
}

async function processFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf8')
  const { data } = matter(content)
  const nameArray = data.path ? data.path.split('/') : ['site-default']

  if (Boolean(data.draft)) {
    console.warn(`[skipping-draft] ${filepath}`)
    return
  }

  const options = {
    queryStringParameters: {
      name: args.name || config.name,
      title: args.title || data.title,
      width: args.width,
      height: args.height,
      tag: (args.tag && args.tag.length) || data.keywords || [],
      mode: args.mode,
    }
  }

  const outputName = `${nameArray[nameArray.length - 1]}.${config.extension}`
  const imageArray = data.image ? data.image.split('/') : [outputName]
  const imageName = imageArray[imageArray.length - 1]
  const writePath = path.join(outputPath, outputName)
  const writeExists = fs.existsSync(writePath)

  // console.log(filepath)
  // console.log(`exists: [${writeExists}] ${writePath}`)
  if (imageName !== outputName)
    console.warn(
      `[warning] [${outputName}] does not match image name [${imageName}]`,
    )

  // 
  if (!writeExists || args.F) {
    // TODO: just use buffer instead of string
    let base64String = await getScreenshot(options)

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

if (inputExists && outputExists) processFiles(inputPath)
