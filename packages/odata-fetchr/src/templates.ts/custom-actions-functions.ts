export const odataCustomActionTemplate = `\t/**
\t* Custom action '\${customActionName}'
\t*/
\tpublic \${customActionName} = (entityId: \${entityIdType}, params: any /** todo */) => this.getService().execCustomAction('\${customActionName}', entityId, params);`

export const odataCustomCollectionActionTemplate = `\t/**
\t* Custom collection action '\${customActionName}'
\t*/
\tpublic \${customActionName} = (params: any) => this.getService().execCustomCollectionAction('\${customActionName}', params);`

export const odataCustomFunctionTemplate = `\t/**
\t* Custom action '\${customActionName}'
\t*/
\tpublic \${customActionName} = (entityId: \${entityIdType}) => this.getService().execCustomFunction('\${customActionName}', entityId);`

export const odataCustomCollectionFunctionTemplate = `\t/**
\t* Custom collection action '\${customActionName}'
\t*/
\tpublic \${customActionName} = () => this.getService().execCustomCollectionFunction('\${customActionName}');`
