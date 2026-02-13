import { createComponent, Shade } from '@furystack/shades'
import type { IconDefinition } from '@furystack/shades-common-components'
import { Icon, icons, PageContainer, PageHeader, Paper, Tree, TreeService } from '@furystack/shades-common-components'

type FileNode = { name: string; icon: IconDefinition; children?: FileNode[] }
const fileTree: FileNode[] = [
  {
    name: 'src',
    icon: icons.folder,
    children: [
      {
        name: 'components',
        icon: icons.folder,
        children: [
          { name: 'list.tsx', icon: icons.file },
          { name: 'tree.tsx', icon: icons.file },
          { name: 'context-menu.tsx', icon: icons.file },
        ],
      },
      {
        name: 'services',
        icon: icons.folder,
        children: [
          { name: 'list-service.ts', icon: icons.file },
          { name: 'tree-service.ts', icon: icons.file },
        ],
      },
      { name: 'index.ts', icon: icons.file },
    ],
  },
  { name: 'package.json', icon: icons.packageIcon },
  { name: 'tsconfig.json', icon: icons.settings },
  { name: 'README.md', icon: icons.fileText },
]

export const TreePage = Shade({
  shadowDomName: 'shades-tree-page',
  render: ({ useDisposable }) => {
    const treeService = useDisposable(
      'treeService',
      () =>
        new TreeService<FileNode>({
          getChildren: (item) => item.children ?? [],
          searchField: 'name',
        }),
    )

    return (
      <PageContainer centered>
        <PageHeader
          icon={<Icon icon={icons.treeDeciduous} />}
          title="Tree"
          description="Hierarchical tree view with keyboard navigation and expand/collapse."
        />
        <Paper elevation={3} style={{ padding: '32px' }}>
          <h3>File system tree</h3>
          <p style={{ marginBottom: '8px', opacity: '0.7' }}>
            Arrow Right/Left to expand/collapse, Up/Down to navigate, Space to select
          </p>
          <div style={{ maxHeight: '300px', border: '1px solid rgba(128,128,128,0.3)', borderRadius: '6px' }}>
            <Tree<FileNode>
              rootItems={fileTree}
              treeService={treeService}
              renderIcon={(item, isExpanded) => (
                <Icon
                  icon={
                    item.children && item.children.length > 0
                      ? isExpanded
                        ? icons.folderOpen
                        : icons.folder
                      : item.icon
                  }
                  size="small"
                />
              )}
              renderItem={(item) => <span>{item.name}</span>}
              onItemActivate={(item) => console.log('Activated:', item.name)}
            />
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
