/**
 * Template for OData Collection Service
 */
export const odataCollectionService = `import "@furystack/odata-fetchr";
import { Injectable, Injector } from "@furystack/inject";
import { \${entitySetModelName} } from "../entity-types/\${entitySetModelFile}";

/**
 * Service class for collection \${entitySetName}
 * File created by @furystack/odata-fetchr
 */
@Injectable({ lifetime: "transient" })
export class \${collectionServiceClassName} {
  public readonly entitySetUrl = "\${entitySetName}";
  public getService = () => this.injector.getOdataServiceFor(\${entitySetModelName}, "\${entitySetName}");
  constructor(private injector: Injector) {}
}
`
