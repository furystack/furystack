export type SwaggerDocument = {
  openapi: string
  info: {
    title: string
    version: string
    description: string
  }
  paths: Record<
    string,
    Record<
      string,
      {
        summary: string
        description: string
        operationId: string
        security: Array<Record<string, any>>
        parameters: Array<{
          name: string
          in: string
          required: boolean
          description: string
          schema: {
            type: string
          }
        }>
        responses: Record<
          string,
          {
            description: string
            content?: {
              'application/json': {
                schema: {
                  $ref: string
                }
              }
            }
          }
        >
      }
    >
  >
  components: {
    schemas: Record<string, unknown>
    securitySchemes: {
      cookieAuth: {
        type: string
        in: string
        name: string
      }
    }
  }
}
