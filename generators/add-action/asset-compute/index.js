/*
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

// #########################################################################################
// 3rd party template
// #########################################################################################

const path = require('path')
const ActionGenerator = require('../../../lib/ActionGenerator')

class AssetComputeGenerator extends ActionGenerator {
  constructor (args, opts) {
    super(args, opts)
    this.props = {}
  }

  async prompting () {
    this.props.actionName = await this.promptForActionName('contains a template for a JavaScript Asset Compute worker', 'worker')
    this.props.actionDestPath = this.destinationPath(`${this.props.actionName}.js`)
  }

  writing () {
    this.sourceRoot(path.join(__dirname, './templates'))

    this.addAction(this.props.actionName, './_worker.js', {
      tplContext: this.props,
      dependencies: {
        '@nui/library': '^19.0.0' // will be replaced with open sourced @adobe scope
      },
      devDependencies: {
        '@nui/eslint-config': '^1.0.4' // will be replaced with open sourced @adobe scope
      },
      actionManifestConfig: {
        annotations: { 'require-adobe-auth': true }
      }
    })

    // modify the package.json to contain the Asset Compute testing and development tools
    const packagejsonPath = this.destinationPath('package.json')
    const packagejsonContent = this.fs.readJSON(packagejsonPath) || {}
    packagejsonContent.name = this.props.actionName
    packagejsonContent.scripts.posttest = 'eslint ./'
    packagejsonContent.scripts.test = 'aio asset-compute test-worker'
    packagejsonContent.scripts.deploy = 'aio app deploy && aio asset-compute devtool'
    // remove e2e test script and jest dependency
    delete packagejsonContent.scripts.e2e
    delete packagejsonContent.devDependencies.jest
    this.fs.writeJSON(packagejsonPath, packagejsonContent)

    const workerTemplateFiles = `${this.templatePath()}/**/!(_)*/` // copy the rest of the worker template files

    this.fs.copyTpl(
      workerTemplateFiles,
      this.destinationPath(),
      this.props
    )
    this.fs.delete(this.destinationPath('test')) // remove jest test setup since Asset Compute workers do not use jest
  }
}

module.exports = AssetComputeGenerator
