export type RequestActionOptions = {
  result: unknown
  url?: unknown
  query?: unknown
  body?: unknown
  headers?: unknown
}

export type RequestAction<TOptions extends RequestActionOptions> = {
  /**
   * The type of the response when the request succeeds
   */
  result: TOptions['result']
} & (TOptions extends { url: unknown }
  ? {
      /**
       * Parameters in the URL, e.g.: /api/my-entities/:entityId
       */
      url: TOptions['url']
    }
  : unknown) &
  (TOptions extends { query: unknown }
    ? {
        /**
         * Parameters in the Query String, e.g.: /api/my-entities?top=10
         */
        query: TOptions['query']
      }
    : unknown) &
  (TOptions extends { body: unknown }
    ? {
        /**
         * The Request Body
         */
        body: TOptions['body']
      }
    : unknown) &
  (TOptions extends { headers: unknown } ? { headers: TOptions['headers'] } : unknown)
