import { createComponent, Shade } from '@furystack/shades'
import { Avatar, PageContainer, PageHeader, Paper } from '@furystack/shades-common-components'

export const AvatarPage = Shade({
  shadowDomName: 'shades-avatar-page',
  render: () => {
    return (
      <PageContainer centered>
        <PageHeader
          icon="👤"
          title="Avatar"
          description="Avatar displays user images with fallback support for broken URLs."
        />
        <Paper elevation={3} style={{ padding: '32px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Avatar title="Avatar" avatarUrl="avatar.jpg" />
            <Avatar title="Broken Avatar without fallback" avatarUrl="broken.jpg" />
            <Avatar title="Broken Avatar with fallback" avatarUrl="broken.jpg" fallback={<>👽</>} />
          </div>
        </Paper>
      </PageContainer>
    )
  },
})
