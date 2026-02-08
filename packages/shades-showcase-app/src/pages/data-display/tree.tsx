import { createComponent, Shade } from '@furystack/shades'
import { PageContainer, PageHeader, Paper, Tree, TreeService } from '@furystack/shades-common-components'

type FileNode = { name: string; icon: string; children?: FileNode[] }
const fileTree: FileNode[] = [
  {
    name: 'src',
    icon: '📁',
    children: [
      {
        name: 'components',
        icon: '📁',
        children: [
          { name: 'list.tsx', icon: '📄' },
          { name: 'tree.tsx', icon: '📄' },
          { name: 'context-menu.tsx', icon: '📄' },
        ],
      },
      {
        name: 'services',
        icon: '📁',
        children: [
          { name: 'list-service.ts', icon: '📄' },
          { name: 'tree-service.ts', icon: '📄' },
        ],
      },
      { name: 'index.ts', icon: '📄' },
    ],
  },
  { name: 'package.json', icon: '📦' },
  { name: 'tsconfig.json', icon: '⚙️' },
  { name: 'README.md', icon: '📝' },
]

export const TreePage = Shade({
  tagName: 'shades-tree-page',
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
      <PageContainer maxWidth="900px" centered>
        <PageHeader
          icon="🌲"
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
                <span>{item.children && item.children.length > 0 ? (isExpanded ? '📂' : '📁') : item.icon}</span>
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
