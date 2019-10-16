import { ObservableValue } from '@sensenet/client-utils'
import { ChildrenList } from './models'

export type PartialElement<T> = {
  [K in keyof T]?: T[K] extends (((...args: any[]) => any) | null | undefined) ? T[K] : PartialElement<T[K]>
}

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
      a: PartialElement<HTMLAnchorElement>
      /**
       * The <abbr> tag defines an abbreviation or an acronym, like "HTML", "Mr.", "Dec.", "ASAP", "ATM".
       */
      abbr: PartialElement<HTMLElement>
      /**
       * The <address> tag defines the contact information for the author/owner of a document or an article.
       * If the <address> element is inside the <body> element, it represents contact information for the document.
       * If the <address> element is inside an <article> element, it represents contact information for that article.
       */
      address: PartialElement<HTMLElement>
      /**
       * The <area> tag defines an area inside an image-map (an image-map is an image with clickable areas).
       * The <area> element is always nested inside a <map> tag.
       */
      area: PartialElement<HTMLAreaElement>
      /**
       * The <article> tag specifies independent, self-contained content.
       * An article should make sense on its own and it should be possible to distribute it independently from the rest of the site.
       */
      article: PartialElement<HTMLElement>
      /**
       * The <aside> tag defines some content aside from the content it is placed in.
       * The aside content should be related to the surrounding content.
       */
      aside: PartialElement<HTMLElement>
      /**
       * The <audio> tag defines sound, such as music or other audio streams.
       */
      audio: PartialElement<HTMLAudioElement>
      /**
       * The <b> tag specifies bold text without any extra importance.
       */
      b: PartialElement<HTMLElement>
      /**
       * The <blockquote> tag specifies a section that is quoted from another source.
       */
      blockquote: PartialElement<HTMLElement>
      /**
       * The <br> tag inserts a single line break.
       */
      br: PartialElement<HTMLBRElement>
      /**
       * The <button> tag defines a clickable button.
       * Inside a <button> element you can put content, like text or images. This is the difference between this element and buttons created with the <input> element.
       */
      button: PartialElement<HTMLButtonElement>
      /**
       * The <canvas> tag is used to draw graphics, on the fly, via scripting (usually JavaScript).
       */
      canvas: PartialElement<HTMLCanvasElement>
      /**
       * The <caption> tag defines a table caption. The <caption> tag must be inserted immediately after the <table> tag.
       */
      caption: PartialElement<HTMLTableCaptionElement>
      /**
       * In HTML5, the <cite> tag defines the title of a work.
       */
      cite: PartialElement<HTMLElement>
      /**
       * The <code> tag is a phrase tag. It defines a piece of computer code.
       */
      code: PartialElement<HTMLElement>
      /**
       * The <col> tag specifies column properties for each column within a <colgroup> element.
       * The <col> tag is useful for applying styles to entire columns, instead of repeating the styles for each cell, for each row.
       */
      col: PartialElement<HTMLElement>
      /**
       * The <colgroup> tag specifies a group of one or more columns in a table for formatting.
       * The <colgroup> tag is useful for applying styles to entire columns, instead of repeating the styles for each cell, for each row.
       */
      colgroup: PartialElement<HTMLElement>
      /**
       * The <data> tag links the given content with a machine-readable translation.
       * This element provides both a machine-readable value for data processors, and a human-readable value for rendering in a browser.
       */
      data: PartialElement<HTMLDataElement>
      /**
       * The <datalist> tag specifies a list of pre-defined options for an <input> element.
       * The <datalist> tag is used to provide an "autocomplete" feature on <input> elements. Users will see a drop-down list of pre-defined options as they input data.
       * Use the <input> element's list attribute to bind it together with a <datalist> element.
       */
      datalist: PartialElement<HTMLDataListElement>
      /**
       * The <dd> tag is used to describe a term/name in a description list.
       * The <dd> tag is used in conjunction with <dl> (defines a description list) and <dt> (defines terms/names).
       * Inside a <dd> tag you can put paragraphs, line breaks, images, links, lists, etc.
       */
      dd: PartialElement<HTMLElement>
      /**
       * The <del> tag defines text that has been deleted from a document.
       * **Tip:** Also look at the <ins> tag to markup inserted text.
       * **Tip:** Use <del> and <ins> to markup updates and modifications in a document. Browsers will normally strike a line through deleted text and underline inserted text.
       */
      del: PartialElement<HTMLElement>
      /**
       * The <details> tag specifies additional details that the user can view or hide on demand.
       * The <details> tag can be used to create an interactive widget that the user can open and close. Any sort of content can be put inside the <details> tag.
       * The content of a <details> element should not be visible unless the open attribute is set.
       */
      details: PartialElement<HTMLDetailsElement>
      /**
       * The <dfn> tag represents the defining instance of a term in HTML.
       * The defining instance is often the first use of a term in a document.
       * The nearest parent of the <dfn> tag must also contain the definition/explanation for the term inside <dfn>.
       * The term inside the <dfn> tag can be any of the following:
       */
      dfn: PartialElement<HTMLElement>
      /**
       * The <dialog> tag defines a dialog box or window.
       * The <dialog> element makes it easy to create popup dialogs and modals on a web page.
       */
      dialog: PartialElement<HTMLDialogElement>
      /**
       * The <div> tag defines a division or a section in an HTML document.
       * The <div> element is often used as a container for other HTML elements to style them with CSS or to perform certain tasks with JavaScript.
       */
      div: PartialElement<HTMLDivElement>
      /**
       * The <dl> tag defines a description list.
       * The <dl> tag is used in conjunction with <dt> (defines terms/names) and <dd> (describes each term/name).
       */
      dl: PartialElement<HTMLElement>
      /**
       * The <dt> tag defines a term/name in a description list.
       * The <dt> tag is used in conjunction with <dl> (defines a description list) and <dd> (describes each term/name).
       */
      dt: PartialElement<HTMLElement>
      /**
       * The <em> tag is a phrase tag. It renders as emphasized text.
       * **Tip:** This tag is not deprecated, but it is possible to achieve richer effect with CSS.
       */
      em: PartialElement<HTMLElement>
      /**
       * The <embed> tag defines a container for an external application or interactive content (a plug-in).
       */
      embed: PartialElement<HTMLEmbedElement>
      /**
       * The <fieldset> tag is used to group related elements in a form.
       * The <fieldset> tag draws a box around the related elements.
       */
      fieldset: PartialElement<HTMLFieldSetElement>
      /**
       * The <figcaption> tag defines a caption for a <figure> element.
       * The <figcaption> element can be placed as the first or last child of the <figure> element.
       */
      figcaption: PartialElement<HTMLElement>
      /**
       * The <figure> tag specifies self-contained content, like illustrations, diagrams, photos, code listings, etc.
       * While the content of the <figure> element is related to the main flow, its position is independent of the main flow, and if removed it should not affect the flow of the document.
       */
      figure: PartialElement<HTMLElement>
      /**
       * The <footer> tag defines a footer for a document or section.
       * A <footer> element should contain information about its containing element.
       */
      footer: PartialElement<HTMLElement>
      /**
       * The <form> tag is used to create an HTML form for user input.
       */
      form: PartialElement<HTMLElement> & { submit?: (ev: Event) => void | undefined | boolean }
      /**
       * The <h1> to <h6> tags are used to define HTML headings.
       * <h1> defines the most important heading. <h6> defines the least important heading.
       */
      h1: PartialElement<HTMLHeadingElement>
      /**
       * The <h1> to <h6> tags are used to define HTML headings.
       * <h1> defines the most important heading. <h6> defines the least important heading.
       */
      h2: PartialElement<HTMLHeadingElement>
      /**
       * The <h1> to <h6> tags are used to define HTML headings.
       * <h1> defines the most important heading. <h6> defines the least important heading.
       */
      h3: PartialElement<HTMLHeadingElement>
      /**
       * The <h1> to <h6> tags are used to define HTML headings.
       * <h1> defines the most important heading. <h6> defines the least important heading.
       */
      h4: PartialElement<HTMLHeadingElement>
      /**
       * The <h1> to <h6> tags are used to define HTML headings.
       * <h1> defines the most important heading. <h6> defines the least important heading.
       */
      h5: PartialElement<HTMLHeadingElement>
      /**
       * The <h1> to <h6> tags are used to define HTML headings.
       * <h1> defines the most important heading. <h6> defines the least important heading.
       */
      h6: PartialElement<HTMLHeadingElement>
      /**
       * The <header> element represents a container for introductory content or a set of navigational links.
       */
      header: PartialElement<HTMLElement>
      /**
       * The <hr> tag defines a thematic break in an HTML page (e.g. a shift of topic).
       */
      hr: PartialElement<HTMLHRElement>
      /**
       * The <i> tag defines a part of text in an alternate voice or mood. The content of the <i> tag is usually displayed in italic.
       */
      i: PartialElement<HTMLElement>
      /**
       * The <iframe> tag specifies an inline frame.
       * An inline frame is used to embed another document within the current HTML document.
       */
      iframe: PartialElement<HTMLIFrameElement>
      /**
       * The <img> tag defines an image in an HTML page. The <img> tag has two required attributes: src and alt.
       */
      img: PartialElement<HTMLImageElement> & { src: string; alt: string }
      /**
       * The <input> tag specifies an input field where the user can enter data.
       */
      input: PartialElement<HTMLInputElement>
      span: PartialElement<HTMLSpanElement>
      p: PartialElement<HTMLParagraphElement>
      style: PartialElement<HTMLStyleElement>
      textarea: PartialElement<HTMLTextAreaElement>
      ol: PartialElement<HTMLOListElement>
      li: PartialElement<HTMLElement>
      strong: PartialElement<HTMLElement>
      label: PartialElement<HTMLLabelElement>
      progress: PartialElement<HTMLProgressElement>
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
