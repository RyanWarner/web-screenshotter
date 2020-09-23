const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

module.exports = (args) => {
  const inputPath = path.join(process.cwd(), args.input)
  const outputPath = path.join(process.cwd(), args.output)

  const inputExists = fs.existsSync(inputPath)
  const outputExists = fs.existsSync(outputPath)

  if (inputExists && outputExists) {
    console.log(`${chalk.green('✔')} Input/output paths exist`)

    return { inputPath, outputPath }
  } else {
    if (!inputExists) {
      console.log(`${chalk.red('✗')} Input path "${args.input}" does not exist`)
    }

    if (!outputExists) {
      console.log(`${chalk.red('✗')} Output path "${args.output}" does not exist`)
    }

    process.exit(0)
  }
}