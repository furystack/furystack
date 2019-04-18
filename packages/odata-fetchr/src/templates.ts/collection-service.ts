/**
 * Template for OData Collection Service
 */
export const odataCollectionService = `import { OdataService } from '@furystack/odata-fetchr/dist/odata-service'
import {\${entitySetModel}} from '../entity-types/\${entitySetModel}'


/**
 * Service class for collection \${entitySet}
 */
export class \${entitySet}Service extends OdataService<\${entitySetModel}> {
  protected entitySetUrl: string = '\${entitySetName}';
  
}

`
