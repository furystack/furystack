/**
 * Template for OData Collection Service
 */
export const odataCollectionService = `import { OdataService } from '@furystack/odata-fetchr/dist/odata-service'
import {\${entitySetModelName}} from '../entity-types/\${entitySetModelFile}'


/**
 * Service class for collection \${entitySetName}
 */
export class \${collectionServiceClassName} extends OdataService<\${entitySetModelName}> {
  protected entitySetUrl: string = '\${entitySetName}';
  
}

`
