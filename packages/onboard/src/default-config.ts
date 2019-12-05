import { Config } from './models/config'

export const defaultConfig: Config = {
  $schema: 'https://gist.github.com/gallayl/38b1a1c279ad8ff192e3902ba020f101/raw',
  services: [],
  directories: { output: '~/dev/onboard-output', input: '~/dev/onboard-input' },
}
