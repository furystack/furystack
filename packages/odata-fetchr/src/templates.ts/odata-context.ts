/**
 * Template string for OData Context model
 */
export const odataContext = `
/**
 * The OData endpoint context
 */
export const odataContext = {
    /**
     * The root of the odata service endpoint, e.g.: http://my-site/odata/
     */
    odataRootPath: '\${odataRootPath}',
    /**
     * Metadata creation date
     */
    creationDate: '\${creationDate}',
}`
