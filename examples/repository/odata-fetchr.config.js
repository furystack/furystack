const fs = require('fs')

/**
 * @type import("@furystack/odata-fetchr/dist/models/configuration").Configuration
 */
module.exports = {
  /**
   * Default root path for output
   */
  outputPath: './metadata',
  /**
   * In the following example we read it from a persisted example file. You can usually fetch it from your service endpoint.
   */
  getMetadataXml: async () => {
    return new Promise((resolve, reject) =>
      fs.readFile('example-metadata.xml', {}, (err, data) => {
        err ? reject(err) : resolve(data.toString())
      }),
    )
  },
  writeDump: true,
}
