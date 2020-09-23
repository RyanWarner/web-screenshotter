const fs = require('fs')
const path = require('path')
const https = require('https')
const matter = require('gray-matter')
const getScreenshot = require('./get-screenshot')

const args = require('minimist')(process.argv.slice(2), {
  default: {
    input: 'content',
    output: 'images',
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
console.log(`exists: [${inputExists}] ${inputPath}`)
const outputExists = fs.existsSync(outputPath)
console.log(`exists: [${outputExists}] ${outputPath}`)

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
      name: args.name || 'Tony Alves',
      title: args.title || data.title,
      width: args.width,
      height: args.height,
      tag: (args.tag && args.tag.length) || data.keywords || [],
      mode: args.mode,
    },
  }

  console.log('-----------------------------------------')

  const outputName = `${nameArray[nameArray.length - 1]}.png`
  const imageArray = data.image ? data.image.split('/') : [outputName]
  const imageName = imageArray[imageArray.length - 1]
  const writePath = path.join(outputPath, outputName)
  const writeExists = fs.existsSync(writePath)

  console.log(filepath)
  console.log(`exists: [${writeExists}] ${writePath}`)
  if (imageName !== outputName)
    console.warn(
      `[warning] [${outputName}] does not match image name [${imageName}]`,
    )

  /*
      Get the image from the uri
      Make sure the file doesn't exist unless the -F (--Force)
  */
  if (!writeExists || args.F) {
    let base64String = await getScreenshot(options)

    let base64Image = base64String.split('base64,').pop()

    fs.writeFile(writePath, base64Image, {encoding: 'base64'}, function(err) {
      console.log('File created')
    })

    console.log(`[writing] ${writePath}`)
  } else {
    console.log(`[exists] ${writePath}`)
  }

  if (args.F && writeExists) {
    console.warn(`[warning] ${imageName} was overwriting!`)
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
    console.log(dirent.name)
    if (isValidExtension(dirent.name))
      processFile(path.join(dirpath, dirent.name))
  }
}

function processFiles() {
  fs.stat(inputPath, function(err, stats) {
    console.log(stats.isDirectory())
    if (stats.isDirectory()) {
      processDir(inputPath)
    } else if (stats.isFile()) {
      if (isValidExtension(inputPath)) processFile(inputPath)
    }
  })
}

if (inputExists && outputExists) processFiles(inputPath)
