const git = require('simple-git/promise')
const inquirer = require('inquirer')
const { lstatSync, readdirSync } = require('fs')
const { dirname, sep, join, basename } = require('path')

const rootDirectory = join(__dirname, '/')
const isDirectory = (source) => lstatSync(source).isDirectory() && !source.match(/(\.git)|(node_modules)/)

const remotes = []

const getGitRemotes = async (workingDir) => {
  return new Promise((res, rej) => {
    let statusSummary = null
    git(workingDir)
      .getRemotes(true)
      .then((val) => {
        remotes.push({ workingDir, fodlerName: basename(workingDir), remote: val[0].refs.fetch })
        res(statusSummary)
      })
      .catch((err) => rej(err))
  })
}

const getDirs = async (workingDir) => {
  const dirs = readdirSync(workingDir)
    .map((name) => join(workingDir, name))
    .filter(isDirectory)
  return await Promise.all(dirs.map(async (name) => getGitRemotes(name)))
}

const pullDir = async (repo) => {
  return new Promise((res, rej) => {
    git(repo)
      .pull('origin', 'master')
      .then((val) => {
        res(val)
      })
      .catch((err) => rej(err))
      .finally(() => {
        console.log('-----')
      })
  })
}
const startInquirer = () => {
  inquirer
    .prompt([
      {
        type: 'checkbox',
        message: 'Select git repos to pull',
        name: 'repos',
        choices: [
          new inquirer.Separator(' = Repositories = '),
          ...remotes.map(({ workingDir }) => ({ name: workingDir })),
        ],
        validate: function(answer) {
          if (answer.length < 1) {
            return 'You must choose at least one repo.'
          }
          return true
        },
      },
    ])
    .then(async (answers) => {
      console.log(answers)
      console.log(answers.repos)
      const pullDirs = await Promise.all(answers.repos.map((repo) => pullDir(repo)))

      return pullDirs
    })
}

;+(async () => {
  await getDirs(rootDirectory)
  startInquirer()
})()

module.exports = { startInquirer, pullDir, getDirs }
