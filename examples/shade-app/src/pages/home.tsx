import { Shade, createComponent } from '@furystack/shades'

export const HomePage = Shade({
  initialState: undefined,
  shadowDomName: 'shade-app-home-page',
  render: () => {
    return (
      <div
        style={{
          margin: '0 2em',
        }}>
        <h1>Welcome to Shade App Demo! 🎉 </h1>
        <hr />
        <p>
          The application's main purpose is to showcase the outstanding features of the <strong>Shade</strong> UI
          Library
        </p>
      </div>
    )
  },
})
