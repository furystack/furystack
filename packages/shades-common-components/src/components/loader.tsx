import { Shade, createComponent } from '@furystack/shades'

export const Loader = Shade<{ style?: Partial<CSSStyleDeclaration> }>({
  shadowDomName: 'shade-loader',
  render: ({ props }) => {
    return (
      <div
        style={{
          ...((props && props.style) || {}),
        }}
      >
        <style>
          {`/* LOADER 1 */

        #loader-1:before, #loader-1:after{
          content: "";
          position: absolute;
          width: calc(100% - 20px);
          height: calc(100% - 20px);
          border-radius: 100%;
          border: 10px solid transparent;
          border-top-color: #3498db;
        }
        
        #loader-1:before{
          z-index: 100;
          animation: spin 1s infinite;
        }
        
        #loader-1:after{
          border: 10px solid rgba(128,128,128,0.3);
        }
        
        @keyframes spin{
          0%{
            -webkit-transform: rotate(0deg);
            -ms-transform: rotate(0deg);
            -o-transform: rotate(0deg);
            transform: rotate(0deg);
          }
        
          100%{
            -webkit-transform: rotate(360deg);
            -ms-transform: rotate(360deg);
            -o-transform: rotate(360deg);
            transform: rotate(360deg);
          }
        }`}
        </style>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
        >
          <div className="three col">
            <div className="loader" id="loader-1"></div>
          </div>
        </div>
      </div>
    )
  },
})
