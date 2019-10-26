export const odataCustomActionTemplate = `\t/**
\t* Custom action '\${customActionName}'
\t*/
\tpublic \${customActionName} = (entityId: \${entityIdType}, \${paramsWithType}) => this.getService().execCustomAction\${returnType}('\${customActionName}', entityId\${params});`

export const odataCustomCollectionActionTemplate = `\t/**
\t* Custom collection action '\${customActionName}'
\t*/
\tpublic \${customActionName} = (\${paramsWithType}) => this.getService().execCustomCollectionAction\${returnType}('\${customActionName}'\${params});`

export const odataCustomFunctionTemplate = `\t/**
\t* Custom action '\${customActionName}'
\t*/
\tpublic \${customActionName} = (entityId: \${entityIdType}) => this.getService().execCustomFunction\${returnType}('\${customActionName}', entityId);`

export const odataCustomCollectionFunctionTemplate = `\t/**
\t* Custom collection action '\${customActionName}'
\t*/
\tpublic \${customActionName} = () => this.getService().execCustomCollectionFunction\${returnType}('\${customActionName}');`
