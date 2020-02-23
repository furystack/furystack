/** Default template for Entity Types */
export const entityTypeTemplate = `
/**
 * Model for Entity Type \${name}
 * Primary key: '\${key}'
 */
export class \${name} {
    \${navigationProperties}
    \${properties}
}
`
