import type { PartialElement } from '@furystack/shades'
import { Shade, createComponent } from '@furystack/shades'
import { ObservableValue } from '@furystack/utils'
import { buildTransition, cssVariableTheme } from '../services/css-variable-theme.js'

/**
 * Props for the Carousel component.
 */
export type CarouselProps = PartialElement<HTMLElement> & {
  /** Array of slide content elements */
  slides: JSX.Element[]
  /** Whether to auto-advance slides. Defaults to false */
  autoplay?: boolean
  /** Interval between auto-advance in milliseconds. Defaults to 3000 */
  autoplayInterval?: number
  /** Whether to show dot indicators. Defaults to true */
  dots?: boolean
  /** Transition effect between slides. Defaults to 'slide' */
  effect?: 'slide' | 'fade'
  /** Whether the carousel scrolls vertically. Defaults to false */
  vertical?: boolean
  /** Index of the initially active slide. Defaults to 0 */
  defaultActiveIndex?: number
  /** Callback fired when the active slide changes */
  onChange?: (index: number) => void
}

const TRANSITION_MS = 400

/**
 * A carousel/slider component for cycling through a series of content.
 * Supports autoplay, dot indicators, slide/fade transitions, vertical orientation,
 * keyboard navigation, and swipe gestures.
 */
export const Carousel = Shade<CarouselProps>({
  shadowDomName: 'shade-carousel',
  css: {
    display: 'block',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: cssVariableTheme.typography.fontFamily,
    userSelect: 'none',

    '& .carousel-viewport': {
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
    },

    // Slide-effect track: width: 100% gives a definite size so child
    // percentage flex-basis resolves correctly.
    '& .carousel-track': {
      display: 'flex',
      width: '100%',
      transition: `transform ${TRANSITION_MS}ms ease-in-out`,
    },
    '&:not([data-vertical]) .carousel-track': {
      flexDirection: 'row',
    },
    '&[data-vertical] .carousel-track': {
      flexDirection: 'column',
    },

    '& .carousel-slide': {
      flexShrink: '0',
      overflow: 'hidden',
    },

    // Fade-effect layers
    '& .carousel-fade-container': {
      position: 'relative',
      width: '100%',
    },
    '& .carousel-fade-slide': {
      position: 'absolute',
      inset: '0',
      opacity: '0',
      pointerEvents: 'none',
      transition: `opacity ${TRANSITION_MS}ms ease-in-out`,
    },
    '& .carousel-fade-slide[data-active]': {
      opacity: '1',
      pointerEvents: 'auto',
    },
    // The first slide stays in flow to give the container its natural height
    '& .carousel-fade-slide:first-child': {
      position: 'relative',
    },

    // Arrow buttons
    '& .carousel-arrow': {
      position: 'absolute',
      zIndex: '2',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '36px',
      height: '36px',
      border: 'none',
      borderRadius: cssVariableTheme.shape.borderRadius.full,
      background: 'rgba(0,0,0,0.35)',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '20px',
      lineHeight: '1',
      transition: buildTransition([
        'background',
        cssVariableTheme.transitions.duration.fast,
        cssVariableTheme.transitions.easing.default,
      ]),
    },
    '& .carousel-arrow:hover': {
      background: 'rgba(0,0,0,0.55)',
    },
    // Horizontal arrows
    '&:not([data-vertical]) .carousel-arrow-prev': {
      top: '50%',
      left: '8px',
      transform: 'translateY(-50%)',
    },
    '&:not([data-vertical]) .carousel-arrow-next': {
      top: '50%',
      right: '8px',
      transform: 'translateY(-50%)',
    },
    // Vertical arrows
    '&[data-vertical] .carousel-arrow-prev': {
      top: '8px',
      left: '50%',
      transform: 'translateX(-50%)',
    },
    '&[data-vertical] .carousel-arrow-next': {
      bottom: '8px',
      left: '50%',
      transform: 'translateX(-50%)',
    },

    // Dots
    '& .carousel-dots': {
      position: 'absolute',
      zIndex: '2',
      display: 'flex',
      gap: '8px',
    },
    '&:not([data-vertical]) .carousel-dots': {
      bottom: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      flexDirection: 'row',
    },
    '&[data-vertical] .carousel-dots': {
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      flexDirection: 'column',
    },
    '& .carousel-dot': {
      width: '10px',
      height: '10px',
      borderRadius: cssVariableTheme.shape.borderRadius.full,
      border: 'none',
      padding: '0',
      cursor: 'pointer',
      background: 'rgba(255,255,255,0.5)',
      transition: buildTransition([
        'background',
        cssVariableTheme.transitions.duration.fast,
        cssVariableTheme.transitions.easing.default,
      ]),
    },
    '& .carousel-dot[data-active]': {
      background: '#fff',
    },
    '& .carousel-dot:hover:not([data-active])': {
      background: 'rgba(255,255,255,0.75)',
    },
  },
  render: ({ props, element, useDisposable }) => {
    const {
      slides,
      autoplay = false,
      autoplayInterval = 3000,
      dots = true,
      effect = 'slide',
      vertical = false,
      defaultActiveIndex = 0,
      onChange,
      style,
    } = props

    if (vertical) {
      element.setAttribute('data-vertical', '')
    } else {
      element.removeAttribute('data-vertical')
    }

    if (style) {
      Object.assign(element.style, style)
    }

    element.setAttribute('role', 'region')
    element.setAttribute('aria-roledescription', 'carousel')
    element.setAttribute('tabindex', '0')

    const initial = Math.max(0, Math.min(defaultActiveIndex, slides.length - 1))

    const activeIndex = useDisposable('activeIndex', () => new ObservableValue(initial))

    const goTo = (index: number) => {
      if (slides.length === 0 || activeIndex.isDisposed) return
      const clamped = ((index % slides.length) + slides.length) % slides.length
      activeIndex.setValue(clamped)
      onChange?.(clamped)
    }

    const goNext = () => {
      if (activeIndex.isDisposed) return
      goTo(activeIndex.getValue() + 1)
    }
    const goPrev = () => {
      if (activeIndex.isDisposed) return
      goTo(activeIndex.getValue() - 1)
    }

    // Keyboard navigation
    element.onkeydown = (e: KeyboardEvent) => {
      const nextKey = vertical ? 'ArrowDown' : 'ArrowRight'
      const prevKey = vertical ? 'ArrowUp' : 'ArrowLeft'
      if (e.key === nextKey) {
        e.preventDefault()
        goNext()
      } else if (e.key === prevKey) {
        e.preventDefault()
        goPrev()
      }
    }

    // Touch / swipe support
    let touchStartX = 0
    let touchStartY = 0

    element.ontouchstart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
    }

    element.ontouchend = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX
      const dy = e.changedTouches[0].clientY - touchStartY

      const threshold = 50
      if (vertical) {
        if (dy < -threshold) goNext()
        else if (dy > threshold) goPrev()
      } else {
        if (dx < -threshold) goNext()
        else if (dx > threshold) goPrev()
      }
    }

    // Autoplay
    if (autoplay && slides.length > 1) {
      const timer = setInterval(goNext, autoplayInterval)
      element.addEventListener(
        'shades-disconnect',
        () => {
          clearInterval(timer)
        },
        { once: true },
      )
    }

    const current = activeIndex.getValue()

    /**
     * Imperatively updates the DOM when the active slide changes.
     * This avoids a full re-render which would destroy/recreate child elements
     * and break CSS transitions.
     */
    const updateDOM = (newIndex: number) => {
      if (effect === 'slide') {
        const track = element.querySelector<HTMLElement>('.carousel-track')
        if (track) {
          if (vertical) {
            const slideHeight = element.offsetHeight
            track.style.transform = `translateY(-${newIndex * slideHeight}px)`
          } else {
            track.style.transform = `translateX(-${newIndex * 100}%)`
          }
        }
      } else {
        const fadeSlides = element.querySelectorAll<HTMLElement>('.carousel-fade-slide')
        fadeSlides.forEach((s, i) => {
          const isActive = i === newIndex
          s.toggleAttribute('data-active', isActive)
          s.style.opacity = isActive ? '1' : '0'
          s.style.pointerEvents = isActive ? 'auto' : 'none'
        })
      }

      const dotEls = element.querySelectorAll('.carousel-dot')
      dotEls.forEach((d, i) => {
        d.toggleAttribute('data-active', i === newIndex)
      })
    }

    // Subscribe to index changes and update DOM imperatively
    const observer = activeIndex.subscribe(updateDOM)
    element.addEventListener(
      'shades-disconnect',
      () => {
        observer[Symbol.dispose]()
      },
      { once: true },
    )

    // For vertical slide mode: after render, measure the host height and
    // size each slide to exactly that height so translateY works correctly.
    if (vertical && effect === 'slide') {
      requestAnimationFrame(() => {
        const hostHeight = element.offsetHeight
        if (!hostHeight) return
        const slideEls = element.querySelectorAll<HTMLElement>('.carousel-slide')
        slideEls.forEach((s) => {
          s.style.height = `${hostHeight}px`
        })
        if (current > 0) {
          const track = element.querySelector<HTMLElement>('.carousel-track')
          if (track) {
            track.style.transform = `translateY(-${current * hostHeight}px)`
          }
        }
      })
    }

    // Clone each slide so the same element array can be safely passed to
    // multiple Carousel instances (DOM nodes can only have one parent).
    const clonedSlides = slides.map((slide) =>
      slide instanceof Node ? (slide.cloneNode(true) as typeof slide) : slide,
    )

    // Build JSX — rendered once, then updated imperatively
    const slideContent =
      effect === 'fade' ? (
        <div className="carousel-fade-container">
          {clonedSlides.map((slide, i) => {
            const isFirst = i === 0
            const isActive = i === current
            return (
              <div
                className="carousel-fade-slide"
                role="group"
                aria-roledescription="slide"
                aria-label={`Slide ${i + 1} of ${slides.length}`}
                {...(isActive ? { 'data-active': '' } : {})}
                style={{
                  position: isFirst ? 'relative' : 'absolute',
                  inset: isFirst ? undefined : '0',
                  opacity: isActive ? '1' : '0',
                  pointerEvents: isActive ? 'auto' : 'none',
                  transition: `opacity ${TRANSITION_MS}ms ease-in-out`,
                }}
              >
                {slide}
              </div>
            )
          })}
        </div>
      ) : (
        <div
          className="carousel-track"
          style={{
            display: 'flex',
            flexDirection: vertical ? 'column' : 'row',
            transition: `transform ${TRANSITION_MS}ms ease-in-out`,
            transform: vertical ? 'translateY(0)' : `translateX(-${current * 100}%)`,
          }}
        >
          {clonedSlides.map((slide, i) => (
            <div
              className="carousel-slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${i + 1} of ${slides.length}`}
              style={{ flexShrink: '0', width: '100%', overflow: 'hidden' }}
            >
              {slide}
            </div>
          ))}
        </div>
      )

    const prevArrow = vertical ? '▲' : '◀'
    const nextArrow = vertical ? '▼' : '▶'

    return (
      <>
        <div className="carousel-viewport">{slideContent}</div>

        {slides.length > 1 && (
          <button
            className="carousel-arrow carousel-arrow-prev"
            aria-label="Previous slide"
            onclick={(e: MouseEvent) => {
              e.stopPropagation()
              goPrev()
            }}
          >
            {prevArrow}
          </button>
        )}

        {slides.length > 1 && (
          <button
            className="carousel-arrow carousel-arrow-next"
            aria-label="Next slide"
            onclick={(e: MouseEvent) => {
              e.stopPropagation()
              goNext()
            }}
          >
            {nextArrow}
          </button>
        )}

        {dots && slides.length > 1 && (
          <div className="carousel-dots">
            {slides.map((_, i) => (
              <button
                className="carousel-dot"
                aria-label={`Go to slide ${i + 1}`}
                {...(i === current ? { 'data-active': '' } : {})}
                onclick={(e: MouseEvent) => {
                  e.stopPropagation()
                  goTo(i)
                }}
              />
            ))}
          </div>
        )}
      </>
    )
  },
})
