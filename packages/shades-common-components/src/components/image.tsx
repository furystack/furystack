import { Shade, createComponent } from '@furystack/shades'
import { buildTransition, cssVariableTheme } from '../services/css-variable-theme.js'
import { promisifyAnimation } from '../utils/promisify-animation.js'
import { Icon } from './icons/icon.js'
import { close, imageBroken, rotate, search, zoomIn, zoomOut } from './icons/icon-definitions.js'

export type ImageProps = {
  /**
   * The image source URL
   */
  src: string
  /**
   * Alt text for the image
   */
  alt?: string
  /**
   * Width of the image
   */
  width?: string
  /**
   * Height of the image
   */
  height?: string
  /**
   * Object-fit CSS property for the image
   */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  /**
   * Fallback content to display when the image fails to load
   */
  fallback?: JSX.Element | string
  /**
   * Whether clicking the image opens a preview lightbox
   */
  preview?: boolean
  /**
   * Whether to use lazy loading (loading="lazy")
   */
  lazy?: boolean
  /**
   * Optional style overrides
   */
  style?: Partial<CSSStyleDeclaration>
}

export type ImageGroupProps = {
  /**
   * Gap between images
   */
  gap?: string
}

const LIGHTBOX_Z_INDEX = '2000'

const closeLightbox = async (backdrop: HTMLElement) => {
  // Clean up keyboard listener stored on the backdrop element
  const storedCleanup = (backdrop as unknown as Record<string, unknown>).__lightboxKeyCleanup as
    | (() => void)
    | undefined
  storedCleanup?.()

  const panel = backdrop.querySelector('.lightbox-panel')
  if (panel) {
    try {
      await promisifyAnimation(panel, [{ opacity: 1 }, { opacity: 0 }], {
        duration: 150,
        easing: 'ease-out',
        fill: 'forwards',
      })
    } catch {
      // Animation may not be available (e.g. in jsdom)
    }
  }
  backdrop.remove()
}

const createLightbox = (
  src: string,
  alt: string,
  groupSrcs?: Array<{ src: string; alt: string }>,
  initialIndex?: number,
) => {
  let zoom = 1
  let rotation = 0
  let currentIndex = initialIndex ?? 0

  const getCurrentSrc = () => (groupSrcs ? groupSrcs[currentIndex].src : src)
  const getCurrentAlt = () => (groupSrcs ? groupSrcs[currentIndex].alt : alt)

  const updateTransform = (img: HTMLImageElement) => {
    img.style.transform = `scale(${zoom}) rotate(${rotation}deg)`
  }

  const backdrop = (
    <div
      className="lightbox-backdrop"
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: cssVariableTheme.action.backdrop,
        zIndex: LIGHTBOX_Z_INDEX,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'default',
      }}
      onclick={async (ev: MouseEvent) => {
        if ((ev.target as HTMLElement).classList.contains('lightbox-backdrop')) {
          await closeLightbox(ev.target as HTMLElement)
        }
      }}
    >
      {/* Image panel - centered, can overflow visually when zoomed */}
      <div
        className="lightbox-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <img
          className="lightbox-image"
          src={getCurrentSrc()}
          alt={getCurrentAlt()}
          style={{
            maxWidth: '85vw',
            maxHeight: 'calc(100vh - 100px)',
            objectFit: 'contain',
            transition: 'transform 0.2s ease',
            userSelect: 'none',
            pointerEvents: 'auto',
          }}
          draggable={false}
        />
      </div>

      {/* Toolbar - fixed to bottom center, always above image */}
      <div
        className="lightbox-toolbar"
        style={{
          position: 'fixed',
          bottom: cssVariableTheme.spacing.lg,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: cssVariableTheme.spacing.sm,
          padding: `${cssVariableTheme.spacing.sm} ${cssVariableTheme.spacing.md}`,
          borderRadius: cssVariableTheme.shape.borderRadius.md,
          backgroundColor: cssVariableTheme.action.backdrop,
          backdropFilter: `blur(${cssVariableTheme.effects.blurMd})`,
          zIndex: '1',
        }}
      >
        <button
          className="lightbox-zoom-in"
          title="Zoom in"
          style={toolbarButtonStyle()}
          onclick={() => {
            zoom = Math.min(zoom + 0.25, 5)
            const img = backdrop.querySelector('.lightbox-image') as HTMLImageElement
            if (img) updateTransform(img)
          }}
        >
          <Icon icon={zoomIn} size="small" />
        </button>
        <button
          className="lightbox-zoom-out"
          title="Zoom out"
          style={toolbarButtonStyle()}
          onclick={() => {
            zoom = Math.max(zoom - 0.25, 0.25)
            const img = backdrop.querySelector('.lightbox-image') as HTMLImageElement
            if (img) updateTransform(img)
          }}
        >
          <Icon icon={zoomOut} size="small" />
        </button>
        <button
          className="lightbox-rotate"
          title="Rotate"
          style={toolbarButtonStyle()}
          onclick={() => {
            rotation = (rotation + 90) % 360
            const img = backdrop.querySelector('.lightbox-image') as HTMLImageElement
            if (img) updateTransform(img)
          }}
        >
          <Icon icon={rotate} size="small" />
        </button>
        <div style={{ width: '1px', height: '20px', backgroundColor: cssVariableTheme.action.subtleBorder }} />
        <button
          className="lightbox-close"
          title="Close"
          style={toolbarButtonStyle()}
          onclick={async () => {
            await closeLightbox(backdrop as unknown as HTMLElement)
          }}
        >
          <Icon icon={close} size="small" />
        </button>
      </div>

      {/* Navigation arrows + counter for group */}
      {groupSrcs && groupSrcs.length > 1 ? (
        <>
          <button
            className="lightbox-prev"
            title="Previous image"
            style={{
              ...navButtonStyle(),
              position: 'fixed',
              left: cssVariableTheme.spacing.md,
              top: '50%',
              zIndex: '1',
            }}
            onclick={() => {
              currentIndex = (currentIndex - 1 + groupSrcs.length) % groupSrcs.length
              const img = backdrop.querySelector('.lightbox-image') as HTMLImageElement
              if (img) {
                img.src = getCurrentSrc()
                img.alt = getCurrentAlt()
                zoom = 1
                rotation = 0
                updateTransform(img)
              }
              const counter = backdrop.querySelector('.lightbox-counter')
              if (counter) counter.textContent = `${currentIndex + 1} / ${groupSrcs.length}`
            }}
          >
            ‹
          </button>
          <button
            className="lightbox-next"
            title="Next image"
            style={{
              ...navButtonStyle(),
              position: 'fixed',
              right: cssVariableTheme.spacing.md,
              top: '50%',
              zIndex: '1',
            }}
            onclick={() => {
              currentIndex = (currentIndex + 1) % groupSrcs.length
              const img = backdrop.querySelector('.lightbox-image') as HTMLImageElement
              if (img) {
                img.src = getCurrentSrc()
                img.alt = getCurrentAlt()
                zoom = 1
                rotation = 0
                updateTransform(img)
              }
              const counter = backdrop.querySelector('.lightbox-counter')
              if (counter) counter.textContent = `${currentIndex + 1} / ${groupSrcs.length}`
            }}
          >
            ›
          </button>
          <div
            className="lightbox-counter"
            style={{
              position: 'fixed',
              bottom: '72px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: cssVariableTheme.text.secondary,
              fontSize: cssVariableTheme.typography.fontSize.md,
              zIndex: '1',
            }}
          >
            {currentIndex + 1} / {groupSrcs.length}
          </div>
        </>
      ) : null}
    </div>
  ) as unknown as HTMLElement

  document.body.appendChild(backdrop)

  const handleKeydown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      void closeLightbox(backdrop)
    }
    if (groupSrcs && groupSrcs.length > 1) {
      if (ev.key === 'ArrowLeft') {
        const prevBtn = backdrop.querySelector<HTMLButtonElement>('.lightbox-prev')
        prevBtn?.click()
      }
      if (ev.key === 'ArrowRight') {
        const nextBtn = backdrop.querySelector<HTMLButtonElement>('.lightbox-next')
        nextBtn?.click()
      }
    }
  }

  document.addEventListener('keydown', handleKeydown)
  // Store cleanup function on the backdrop so closeLightbox can remove it
  ;(backdrop as unknown as Record<string, unknown>).__lightboxKeyCleanup = () => {
    document.removeEventListener('keydown', handleKeydown)
  }

  // Animate in (may not be available in test environments)
  const panel = backdrop.querySelector('.lightbox-panel')
  if (panel) {
    void promisifyAnimation(panel, [{ opacity: 0 }, { opacity: 1 }], {
      duration: 200,
      easing: 'ease-out',
      fill: 'forwards',
    }).catch(() => {
      // Animation may not be available
    })
  }
}

const toolbarButtonStyle = (): Partial<CSSStyleDeclaration> => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: cssVariableTheme.spacing.xl,
  height: cssVariableTheme.spacing.xl,
  border: 'none',
  background: 'transparent',
  color: cssVariableTheme.background.paper,
  borderRadius: cssVariableTheme.shape.borderRadius.sm,
  cursor: 'pointer',
  fontSize: cssVariableTheme.typography.fontSize.lg,
  padding: '0',
  transition: `background ${cssVariableTheme.transitions.duration.fast} ease`,
})

const navButtonStyle = (): Partial<CSSStyleDeclaration> => ({
  transform: 'translateY(-50%)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  border: 'none',
  background: cssVariableTheme.action.backdrop,
  color: cssVariableTheme.background.paper,
  borderRadius: cssVariableTheme.shape.borderRadius.full,
  cursor: 'pointer',
  fontSize: cssVariableTheme.typography.fontSize.xl,
  padding: '0',
  transition: `background ${cssVariableTheme.transitions.duration.fast} ease`,
})

/**
 * Image component with preview lightbox, zoom/rotate, fallback, and lazy loading support.
 */
export const Image = Shade<ImageProps>({
  shadowDomName: 'shade-image',
  css: {
    display: 'inline-block',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: cssVariableTheme.shape.borderRadius.sm,
    transition: buildTransition([
      'box-shadow',
      cssVariableTheme.transitions.duration.fast,
      cssVariableTheme.transitions.easing.default,
    ]),

    '&[data-preview] img': {
      cursor: 'pointer',
    },

    '&[data-preview]:hover': {
      boxShadow: cssVariableTheme.shadows.md,
    },

    '& img': {
      display: 'block',
      transition: buildTransition([
        'opacity',
        cssVariableTheme.transitions.duration.normal,
        cssVariableTheme.transitions.easing.default,
      ]),
    },

    '& .image-fallback': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `color-mix(in srgb, ${cssVariableTheme.palette.primary.main} 8%, ${cssVariableTheme.background.paper})`,
      color: cssVariableTheme.text.secondary,
      fontSize: cssVariableTheme.typography.fontSize.sm,
      fontFamily: cssVariableTheme.typography.fontFamily,
      border: `1px dashed ${cssVariableTheme.divider}`,
      borderRadius: cssVariableTheme.shape.borderRadius.sm,
    },

    '& .image-preview-icon': {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%) scale(0.8)',
      opacity: '0',
      transition: buildTransition(
        ['opacity', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
        ['transform', cssVariableTheme.transitions.duration.fast, cssVariableTheme.transitions.easing.default],
      ),
      pointerEvents: 'none',
      backgroundColor: cssVariableTheme.action.backdrop,
      color: cssVariableTheme.background.paper,
      borderRadius: cssVariableTheme.shape.borderRadius.full,
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: cssVariableTheme.typography.fontSize.lg,
    },

    '&[data-preview]:hover .image-preview-icon': {
      opacity: '1',
      transform: 'translate(-50%, -50%) scale(1)',
    },
  },
  render: ({ props, element }) => {
    const {
      src,
      alt = '',
      width,
      height,
      objectFit = 'cover',
      fallback,
      preview = false,
      lazy = false,
      style: styleOverrides,
    } = props

    if (preview) {
      element.setAttribute('data-preview', '')
    } else {
      element.removeAttribute('data-preview')
    }

    if (styleOverrides) {
      Object.assign(element.style, styleOverrides)
    }

    const isInGroup = element.closest('shade-image-group') !== null

    const handleClick = () => {
      if (!preview) return

      if (isInGroup) {
        const group = element.closest('shade-image-group')
        if (group) {
          const images = Array.from(group.querySelectorAll('shade-image'))
          const groupSrcs = images.map((img) => ({
            src: img.getAttribute('data-src') || '',
            alt: img.getAttribute('data-alt') || '',
          }))
          const index = images.indexOf(element)
          createLightbox(src, alt, groupSrcs, index >= 0 ? index : 0)
          return
        }
      }

      createLightbox(src, alt)
    }

    element.setAttribute('data-src', src)
    element.setAttribute('data-alt', alt)

    return (
      <>
        <img
          src={src}
          alt={alt}
          loading={lazy ? 'lazy' : undefined}
          style={{
            width: width || '100%',
            height: height || 'auto',
            objectFit,
          }}
          onclick={handleClick}
          onerror={() => {
            const img = element.querySelector('img')
            if (img) img.style.display = 'none'
            const fallbackEl = element.querySelector<HTMLElement>('.image-fallback')
            if (fallbackEl) fallbackEl.style.display = 'flex'
          }}
        />
        <div
          className="image-fallback"
          style={{
            display: 'none',
            width: width || '200px',
            height: height || '150px',
          }}
        >
          {fallback || <Icon icon={imageBroken} size="large" />}
        </div>
        {preview ? (
          <div className="image-preview-icon">
            <Icon icon={search} size="small" />
          </div>
        ) : null}
      </>
    )
  },
})

/**
 * ImageGroup wraps multiple Image components and enables group preview navigation.
 * When one image is clicked, the lightbox shows navigation controls to browse all images in the group.
 */
export const ImageGroup = Shade<ImageGroupProps>({
  shadowDomName: 'shade-image-group',
  css: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  render: ({ props, children, element }) => {
    const { gap = cssVariableTheme.spacing.sm } = props
    element.style.gap = gap

    return <>{children}</>
  },
})
