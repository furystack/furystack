import { writeFile } from 'fs'
import { createGenerator } from 'ts-json-schema-generator'
import { JSONSchema7 } from 'json-schema'

export const createJsonSchema = async (options: {
  schemaName: string
  inputTsFile: string
  rootType: string
  outputJsonFile: string
}) => {
  const p = createGenerator({
    path: options.inputTsFile,
    expose: 'export',
    jsDoc: 'extended',
    skipTypeCheck: false,
    topRef: true,
    type: options.rootType,
  })
  const schema = p.createSchema(options.schemaName)
  return await new Promise<JSONSchema7>((resolve, reject) =>
    writeFile(options.outputJsonFile, JSON.stringify(schema), (err) => {
      err ? reject(err) : resolve(schema)
    }),
  )
}
