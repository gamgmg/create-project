#!/usr/bin/env node

import minimist from 'minimist'
import prompts from 'prompts'
import fs from 'fs'
import path from 'path'
import { red, green, bold } from 'kolorist'
import { postOrderDirectoryTraverse } from './utils/directoryTraverse.js'
import renderTemplate from './utils/renderTemplate.js'
import getCommand from './utils/getCommand.js'
// import { dirname } from 'path'
// import { fileURLToPath } from 'url'

// const __dirname = dirname(fileURLToPath(import.meta.url))

function canSkipEmptying(dir) {
  if (!fs.existsSync(dir)) {
    return true
  }
}

function isValidPackageName(projectName) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(projectName)
}

function toValidPackageName(projectName) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-')
}

function emptyDir(dir) {
  if (!fs.existsSync(dir)) {
    return
  }

  postOrderDirectoryTraverse(
    dir,
    (dir) => fs.rmdirSync(dir),
    (file) => fs.unlinkSync(file)
  )
}

async function init() {
  // 返回当前文件的绝对路径
  const cwd = process.cwd()
  // console.log('init', cwd);

  const argv = minimist(process.argv.slice(2), {
    boolean: true
  })
  // console.log('argv', argv)

  const forceOverwrite = argv.force

  let targetDir: string = argv._[0]
  const defaultProjectName = targetDir ?? 'new-project'

  let result: {
    projectName?: string
    shouldOverwrite?: boolean
    packageName?: string
    templateName?: string
  } = {}

  try {
    result = await prompts(
      [
        {
          name: 'projectName',
          type: targetDir ? null : 'text',
          message: 'Project name:',
          initial: defaultProjectName,
          onState: (state) => (targetDir = String(state.value).trim() || defaultProjectName)
        },
        {
          name: 'templateName',
          type: 'select',
          message: 'Template name',
          choices: [
            { title: 'admin-template', description: '后台管理系统模版', value: 'admin-template' }
          ]
        },
        {
          name: 'shouldOverwrite',
          type: () => (canSkipEmptying(targetDir) || forceOverwrite ? null : 'confirm'),
          message: () => {
            const dirForPrompt =
              targetDir === '.' ? 'Current directory' : `Target directory "${targetDir}"`

            return `${dirForPrompt} is not empty. Remove existing files and continue?`
          }
        },
        {
          name: 'overwriteChecker',
          type: (prev, values) => {
            if (values.shouldOverwrite === false) {
              throw new Error(red('✖') + ' Operation cancelled')
            }
            return null
          }
        },
        {
          name: 'packageName',
          type: () => (isValidPackageName(targetDir) ? null : 'text'),
          message: 'Package name:',
          initial: () => toValidPackageName(targetDir),
          validate: (dir) => isValidPackageName(dir) || 'Invalid package.json name'
        }
      ],
      {
        onCancel: () => {
          throw new Error(red('✖') + ' Operation cancelled')
        }
      }
    )
  } catch (cancelled) {
    console.log(cancelled.message)
    process.exit(1)
  }

  // console.log('result', result);

  const {
    projectName,
    packageName = projectName ?? defaultProjectName,
    templateName,
    shouldOverwrite = argv.force
  } = result

  // console.log('projectName', projectName);
  // console.log('packageName', packageName);
  // console.log('templateName', templateName)
  // console.log('shouldOverwrite', shouldOverwrite);

  const root = path.join(cwd, targetDir)

  // console.log('root', root);

  if (fs.existsSync(root) && shouldOverwrite) {
    emptyDir(root)
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root)
  }

  console.log(`\nScaffolding project in ${root}...`)

  const pkg = { name: packageName, version: '0.0.0' }
  fs.writeFileSync(path.resolve(root, 'package.json'), JSON.stringify(pkg, null, 2))

  const templateRoot = path.resolve(__dirname, 'template')
  const render = (templateName) => {
    const templateDir = path.resolve(templateRoot, templateName)
    renderTemplate(templateDir, root)
  }

  render(templateName)

  // Instructions:
  // Supported package managers: pnpm > yarn > npm
  const userAgent = process.env.npm_config_user_agent ?? ''
  const packageManager = /pnpm/.test(userAgent) ? 'pnpm' : /yarn/.test(userAgent) ? 'yarn' : 'npm'

  // console.log('packageManager', packageManager)

  console.log(`\nDone. Now run:\n`)
  if (root !== cwd) {
    console.log(`  ${bold(green(`cd ${path.relative(cwd, root)}`))}`)
  }
  console.log(`  ${bold(green(getCommand(packageManager, 'install')))}`)
  console.log(`  ${bold(green(getCommand(packageManager, 'dev')))}`)
  console.log()
}

init()
