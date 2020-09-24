const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

module.exports = (options) => {
  const inputPath = path.join(process.cwd(), options.inputPath)
  const outputPath = path.join(process.cwd(), options.outputPath)
  const inputExists = fs.existsSync(inputPath)
  const outputExists = fs.existsSync(outputPath)

  if (inputExists && outputExists) {
    console.log(`${chalk.green('✔')} Input/output paths exist`)

    return { inputPath, outputPath }
  } else {
    if (!inputExists) {
      console.log(`${chalk.red('✗')} Input path "${options.input}" does not exist`)
    }

    if (!outputExists) {
      console.log(`${chalk.red('✗')} Output path "${options.output}" does not exist`)
    }

    process.exit(0)
  }
}