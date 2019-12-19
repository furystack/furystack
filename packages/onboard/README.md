# onboard

A helper tool to instantly setup dozens of microservices with ease

## Installation

You can install the tool globally with `npm install @furystack/onboard -g`

## Init and customize a new config

Once installed, you can create a new config file with the `onboard init` command. This will create a default (and nearly empty) `onboard-config.json` config file in the current working directory. You can edit that file to customize your dev environment. You can also use auto completition in IDEs that supports it (e.g. VS Code)

### Input and output dirs

**Input** can be used for input artifacts (e.g. database dumps) that are neccessary for the service initialization. The services will be cloned to the **output** directory. Both paths should be absolute.

### Service list

The **services** should contain a list of services that you want to install. Service installs can run parallelly but the install steps will be executed in a series. If one step fails, the install process will be aborted.
There is a fixed set of steps available at the moment:

- DockerInstall - Installs a Docker container (if it's not already installed). Requires Docker.
- GitClone - Clones a GIT repository (optionally pulls it if already exists). Requires GIT client.
- BowerInstall - Install dependencies via Bower. Requires Bower.
- NpmInstall - Executes the NPM Install command. Requires NPM
- NpmScript - Executes a specific NPM script
- MongoRestore - Restores a specific dump file (should be relative to the input directory)
- AddToPm2 - Adds a specific file to the PM2 Process Manager
  An example install can look like: GitClone -> NpmInstall -> NpmScript (build) -> AddToPm2
