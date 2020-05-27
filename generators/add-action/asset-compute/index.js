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
const { actionsDirname } = require('../../../lib/constants')

class AssetComputeGenerator extends ActionGenerator {
  constructor (args, opts) {
    super(args, opts)
    this.props = {}
  }

  async prompting () {
    this.props.actionName = await this.promptForActionName('example of a custom worker for the Adobe Asset Compute service', 'worker-example')
  }

  writing () {
    this.sourceRoot(path.join(__dirname, './templates'))

    this.addAction(this.props.actionName, './_worker.js', {
      tplContext: this.props,
      dependencies: {
        '@adobe/asset-compute-sdk': '^1.0.2'
      },
      devDependencies: {
        '@adobe/aio-cli-plugin-asset-compute': '^1.0.1'
      },
      //   scripts: { // where to put the scripts?
      //     'asset-compute-debug': 'aio app run && aio asset-compute devtool',
      //     'asset-compute-test': 'aio app run && aio asset-compute test-worker'
      //   },
      dotenvStub: {
        label: 'please provide the following environment variables for the Asset Compute devtool. You can use AWS or Azure, not both:',
        vars: [
          'ASSET_COMPUTE_INTEGRATION_FILE_PATH',
          'S3_BUCKET',
          'AWS_ACCESS_KEY_ID',
          'AWS_SECRET_ACCESS_KEY',
          'AWS_REGION',
          'AZURE_STORAGE_ACCOUNT',
          'AZURE_STORAGE_KEY',
          'AZURE_STORAGE_CONTAINER_NAME'
        ]
      },
      actionManifestConfig: {
        inputs: { LOG_LEVEL: 'debug' },
        annotations: { 'require-adobe-auth': true }
      }
    })

    // modify the package.json to contain the Asset Compute testing and development tools
    const packagejsonPath = this.destinationPath('package.json')
    const packagejsonContent = this.fs.readJSON(packagejsonPath)

    // add asset compute worker-tests in packages.json scripts
    if (!packagejsonContent.scripts) {
      packagejsonContent.scripts = {}
      packagejsonContent.scripts.test = 'aio asset-compute test-worker'
      packagejsonContent.scripts.debug = 'aio app run && aio asset-compute devtool'
    } else {
      packagejsonContent.scripts.test = packagejsonContent.scripts.test ? packagejsonContent.scripts.test.concat(' && aio asset-compute test-worker') : 'aio asset-compute test-worker'
      packagejsonContent.scripts.debug = packagejsonContent.scripts.debug ? packagejsonContent.scripts.test.concat(' && aio app run && aio asset-compute devtool') : 'aio app run && aio asset-compute devtool'
    }
    this.fs.writeJSON(packagejsonPath, packagejsonContent)

    const destinationFolder = this.destinationPath(actionsDirname, this.props.actionName)
    this.fs.delete(path.join(destinationFolder, 'test')) // remove jest test setup since Asset Compute workers do not use jest

    const workerTemplateFiles = `${this.templatePath()}/**/!(_)*/` // copy the rest of the worker template files
    this.fs.copyTpl(
      workerTemplateFiles,
      destinationFolder,
      this.props
    )
  }
}

module.exports = AssetComputeGenerator
