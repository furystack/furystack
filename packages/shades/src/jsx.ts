import { DeepPartial, ObservableValue } from '@sensenet/client-utils'
import { ChildrenList } from './models'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace JSX {
    interface Element<TProps = any, TState = any> extends HTMLElement {
      onAttached: ObservableValue<void>
      onDetached: ObservableValue<void>
      state: ObservableValue<TState>
      props: ObservableValue<TProps>
      updateComponent: () => JSX.Element
      shadeChildren: ObservableValue<ChildrenList>
      callConstruct: () => void
    }

    interface IntrinsicElements {
      /**
       * The <a> tag defines a hyperlink, which is used to link from one page to another.
       */
      a: DeepPartial<HTMLAnchorElement>
      /**
       * The <abbr> tag defines an abbreviation or an acronym, like "HTML", "Mr.", "Dec.", "ASAP", "ATM".
       */
      abbr: DeepPartial<HTMLElement>
      /**
       * The <address> tag defines the contact information for the author/owner of a document or an article.
       * If the <address> element is inside the <body> element, it represents contact information for the document.
       * If the <address> element is inside an <article> element, it represents contact information for that article.
       */
      address: DeepPartial<HTMLElement>
      /**
       * The <area> tag defines an area inside an image-map (an image-map is an image with clickable areas).
       * The <area> element is always nested inside a <map> tag.
       */
      area: DeepPartial<HTMLAreaElement>
      /**
       * The <article> tag specifies independent, self-contained content.
       * An article should make sense on its own and it should be possible to distribute it independently from the rest of the site.
       */
      article: DeepPartial<HTMLElement>
      /**
       * The <aside> tag defines some content aside from the content it is placed in.
       * The aside content should be related to the surrounding content.
       */
      aside: DeepPartial<HTMLElement>
      /**
       * The <audio> tag defines sound, such as music or other audio streams.
       */
      audio: DeepPartial<HTMLAudioElement>
      /**
       * The <b> tag specifies bold text without any extra importance.
       */
      b: DeepPartial<HTMLElement>
      /**
       * The <blockquote> tag specifies a section that is quoted from another source.
       */
      blockquote: DeepPartial<HTMLElement>
      /**
       * The <br> tag inserts a single line break.
       */
      br: DeepPartial<HTMLBRElement>
      /**
       * The <button> tag defines a clickable button.
       * Inside a <button> element you can put content, like text or images. This is the difference between this element and buttons created with the <input> element.
       */
      button: DeepPartial<HTMLButtonElement>
      /**
       * The <canvas> tag is used to draw graphics, on the fly, via scripting (usually JavaScript).
       */
      canvas: DeepPartial<HTMLCanvasElement>
      /**
       * The <caption> tag defines a table caption. The <caption> tag must be inserted immediately after the <table> tag.
       */
      caption: DeepPartial<HTMLTableCaptionElement>
      /**
       * In HTML5, the <cite> tag defines the title of a work.
       */
      cite: DeepPartial<HTMLElement>
      /**
       * The <code> tag is a phrase tag. It defines a piece of computer code.
       */
      code: DeepPartial<HTMLElement>
      /**
       * The <col> tag specifies column properties for each column within a <colgroup> element.
       * The <col> tag is useful for applying styles to entire columns, instead of repeating the styles for each cell, for each row.
       */
      col: DeepPartial<HTMLElement>
      /**
       * The <colgroup> tag specifies a group of one or more columns in a table for formatting.
       * The <colgroup> tag is useful for applying styles to entire columns, instead of repeating the styles for each cell, for each row.
       */
      colgroup: DeepPartial<HTMLElement>
      /**
       * The <data> tag links the given content with a machine-readable translation.
       * This element provides both a machine-readable value for data processors, and a human-readable value for rendering in a browser.
       */
      data: DeepPartial<HTMLDataElement>
      /**
       * The <datalist> tag specifies a list of pre-defined options for an <input> element.
       * The <datalist> tag is used to provide an "autocomplete" feature on <input> elements. Users will see a drop-down list of pre-defined options as they input data.
       * Use the <input> element's list attribute to bind it together with a <datalist> element.
       */
      datalist: DeepPartial<HTMLDataListElement>
      /**
       * The <dd> tag is used to describe a term/name in a description list.
       * The <dd> tag is used in conjunction with <dl> (defines a description list) and <dt> (defines terms/names).
       * Inside a <dd> tag you can put paragraphs, line breaks, images, links, lists, etc.
       */
      dd: DeepPartial<HTMLElement>
      /**
       * The <del> tag defines text that has been deleted from a document.
       * **Tip:** Also look at the <ins> tag to markup inserted text.
       * **Tip:** Use <del> and <ins> to markup updates and modifications in a document. Browsers will normally strike a line through deleted text and underline inserted text.
       */
      del: DeepPartial<HTMLElement>
      /**
       * The <details> tag specifies additional details that the user can view or hide on demand.
       * The <details> tag can be used to create an interactive widget that the user can open and close. Any sort of content can be put inside the <details> tag.
       * The content of a <details> element should not be visible unless the open attribute is set.
       */
      details: DeepPartial<HTMLDetailsElement>
      /**
       * The <dfn> tag represents the defining instance of a term in HTML.
       * The defining instance is often the first use of a term in a document.
       * The nearest parent of the <dfn> tag must also contain the definition/explanation for the term inside <dfn>.
       * The term inside the <dfn> tag can be any of the following:
       */
      dfn: DeepPartial<HTMLElement>
      /**
       * The <dialog> tag defines a dialog box or window.
       * The <dialog> element makes it easy to create popup dialogs and modals on a web page.
       */
      dialog: DeepPartial<HTMLDialogElement>
      /**
       * The <div> tag defines a division or a section in an HTML document.
       * The <div> element is often used as a container for other HTML elements to style them with CSS or to perform certain tasks with JavaScript.
       */
      div: DeepPartial<HTMLDivElement>
      span: DeepPartial<HTMLSpanElement>
      input: DeepPartial<HTMLInputElement>
      h1: DeepPartial<HTMLHeadingElement>
      h2: DeepPartial<HTMLHeadingElement>
      h3: DeepPartial<HTMLHeadingElement>
      h4: DeepPartial<HTMLHeadingElement>
      h5: DeepPartial<HTMLHeadingElement>
      p: DeepPartial<HTMLParagraphElement>
      style: DeepPartial<HTMLStyleElement>
      textarea: DeepPartial<HTMLTextAreaElement>
      ol: DeepPartial<HTMLOListElement>
      li: DeepPartial<HTMLElement>

      hr: DeepPartial<HTMLHRElement>
      strong: DeepPartial<HTMLElement>
      label: DeepPartial<HTMLLabelElement>
      form: DeepPartial<HTMLElement> & { submit?: (ev: Event) => void | undefined | boolean }
      progress: DeepPartial<HTMLProgressElement>
      img: DeepPartial<HTMLImageElement>
    }
  }
}

export const isJsxElement = (obj: any): obj is JSX.Element => {
  const casted = obj as JSX.Element
  return (
    casted.props !== undefined &&
    casted.state !== undefined &&
    casted.onAttached !== undefined &&
    casted.onDetached !== undefined
  )
}
