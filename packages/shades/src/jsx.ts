import { ObservableValue } from '@sensenet/client-utils'
import { ChildrenList, PartialElement } from './models'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace JSX {
    interface Element<TProps = any, TState = any> extends HTMLElement {
      state: ObservableValue<TState>
      props: ObservableValue<TProps>
      updateComponent: () => void
      shadeChildren: ObservableValue<ChildrenList>
      callConstructed: () => void
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
      /**
       * The <ins> tag defines a text that has been inserted into a document.
       */
      ins: PartialElement<HTMLElement>
      /**
       * The <kbd> tag is a phrase tag. It defines keyboard input.
       */
      kbd: PartialElement<HTMLElement>
      /**
       * The <label> tag defines a label for a <button>, <input>, <meter>, <output>, <progress>, <select>, or <textarea> element.
       */
      label: PartialElement<HTMLLabelElement>
      /**
       * The <legend> tag defines a caption for the <fieldset> element.
       */
      legend: PartialElement<HTMLLegendElement>
      /**
       * The <li> tag defines a list item.
       */
      li: PartialElement<HTMLElement>
      /**
       * The <main> tag specifies the main content of a document.
       * The content inside the <main> element should be unique to the document. It should not contain any content that is repeated across documents such as sidebars, navigation links, copyright information, site logos, and search forms.
       * Note: There must not be more than one <main> element in a document. The <main> element must NOT be a descendant of an <article>, <aside>, <footer>, <header>, or <nav> element.
       */
      main: PartialElement<HTMLElement>
      /**
       * The <map> tag is used to define a client-side image-map. An image-map is an image with clickable areas.
       * The required name attribute of the <map> element is associated with the <img>'s usemap attribute and creates a relationship between the image and the map.
       * The <map> element contains a number of <area> elements, that defines the clickable areas in the image map.
       */
      map: PartialElement<HTMLMapElement>
      /**
       * The <mark> tag defines marked text.
       * Use the <mark> tag if you want to highlight parts of your text.
       */
      mark: PartialElement<HTMLElement>
      /**
       *
       * The <meter> tag defines a scalar measurement within a known range, or a fractional value. This is also known as a gauge.
       * Examples: Disk usage, the relevance of a query result, etc.
       * Note: The <meter> tag **should not be used to indicate progress** (as in a progress bar). For progress bars, use the <progress> tag.
       */
      meter: PartialElement<HTMLMeterElement>
      /**
       * The <nav> tag defines a set of navigation links.
       * Notice that NOT all links of a document should be inside a <nav> element. The <nav> element is intended only for major block of navigation links.
       * Browsers, such as screen readers for disabled users, can use this element to determine whether to omit the initial rendering of this content.
       */
      nav: PartialElement<HTMLElement>
      /**
       * The <object> tag defines an embedded object within an HTML document. Use this element to embed multimedia (like audio, video, Java applets, ActiveX, PDF, and Flash) in your web pages.
       * You can also use the <object> tag to embed another webpage into your HTML document.
       * You can use the <param> tag to pass parameters to plugins that have been embedded with the <object> tag.
       */
      object: PartialElement<HTMLObjectElement>
      /**
       * The <ol> tag defines an ordered list. An ordered list can be numerical or alphabetical.
       * Use the <li> tag to define list items.
       */
      ol: PartialElement<HTMLOListElement>
      /**
       * The <optgroup> is used to group related options in a drop-down list.
       * If you have a long list of options, groups of related options are easier to handle for a user.
       */
      optgroup: PartialElement<HTMLOptGroupElement>
      /**
       * The <option> tag defines an option in a select list.
       * <option> elements go inside a <select> or <datalist> element.
       */
      option: PartialElement<HTMLOptionElement>
      /**
       * The <output> tag represents the result of a calculation (like one performed by a script).
       */
      output: PartialElement<HTMLOutputElement>
      /**
       * The <p> tag defines a paragraph.
       */
      p: PartialElement<HTMLParagraphElement>
      /**
       * The <param> tag is used to define parameters for plugins embedded with an <object> element.
       * **Tip:** HTML 5 also includes two new elements for playing audio or video: The <audio> and <video> tags.
       */
      param: PartialElement<HTMLParamElement>
      /**
       * The <picture> tag gives web developers more flexibility in specifying image resources.
       * The most common use of the <picture> element will be for art direction in responsive designs. Instead of having one image that is scaled up or down based on the viewport width, multiple images can be designed to more nicely fill the browser viewport.
       * The <picture> element holds two different tags: one or more <source> tags and one <img> tag.
       *
       * The <source> element has the following attributes:
       * - srcset (required) - defines the URL of the image to show
       * - media - accepts any valid media query that would normally be defined in a CSS
       * - sizes - defines a single width descriptor, a single media query with width descriptor, or a comma-delimited list of media queries with a width descriptor
       * - type - defines the MIME type
       *
       * The browser will use the attribute values to load the most appropriate image. The browser will use the first <source> element with a matching hint and ignore any following <source> tags.
       * The <img> element is required as the last child tag of the <picture> declaration block. The <img> element is used to provide backward compatibility for browsers that do not support the <picture> element, or if none of the <source> tags matched.
       * The <picture> element works similar to the <video> and <audio> elements. You set up different sources, and the first source that fits the preferences is the one being used.
       */
      picture: PartialElement<HTMLPictureElement>
      /**
       * The <pre> tag defines preformatted text.
       * Text in a <pre> element is displayed in a fixed-width font (usually Courier), and it preserves both spaces and line breaks.
       */
      pre: PartialElement<HTMLPreElement>
      /**
       * The <progress> tag represents the progress of a task.
       */
      progress: PartialElement<HTMLProgressElement>
      /**
       * The <q> tag defines a short quotation.
       * Browsers normally insert quotation marks around the quotation.
       */
      q: PartialElement<HTMLQuoteElement>
      /**
       * The <rp> tag can be used to provide parentheses around a ruby text, to be shown by browsers that do not support ruby annotations.
       * Use the <rp> tag together with the <ruby> and the <rt> tags: The <ruby> element consists of one or more characters that needs an explanation/pronunciation, and an <rt> element that gives that information, and an optional <rp> element that defines what to show for browsers that not support ruby annotations.
       */
      rp: PartialElement<HTMLElement>
      /**
       * The <rt> tag defines an explanation or pronunciation of characters (for East Asian typography) in a ruby annotation.
       * Use the <rt> tag together with the <ruby> and the <rp> tags: The <ruby> element consists of one or more characters that needs an explanation/pronunciation, and an <rt> element that gives that information, and an optional <rp> element that defines what to show for browsers that not support ruby annotations.
       */
      rt: PartialElement<HTMLElement>
      /**
       * The <ruby> tag specifies a ruby annotation.
       * A ruby annotation is a small extra text, attached to the main text to indicate the pronunciation or meaning of the corresponding characters. This kind of annotation is often used in Japanese publications.
       * Use the <ruby> tag together with the <rt> and/or the <rp> tags: The <ruby> element consists of one or more characters that needs an explanation/pronunciation, and an <rt> element that gives that information, and an optional <rp> element that defines what to show for browsers that do not support ruby annotations.
       */
      ruby: PartialElement<HTMLElement>
      /**
       * The <s> tag specifies text that is no longer correct, accurate or relevant.
       * The <s> tag should not be used to define replaced or deleted text, use the <del> tag to define replaced or deleted text.
       */
      s: PartialElement<HTMLElement>
      /**
       * The <samp> tag is a phrase tag. It defines sample output from a computer program.
       */
      samp: PartialElement<HTMLElement>
      /**
       * The <section> tag defines sections in a document, such as chapters, headers, footers, or any other sections of the document.
       */
      section: PartialElement<HTMLElement>
      /**
       * The <select> element is used to create a drop-down list.
       * The <option> tags inside the <select> element define the available options in the list.
       */
      select: PartialElement<HTMLSelectElement>
      /**
       * The <small> tag defines smaller text (and other side comments).
       */
      small: PartialElement<HTMLElement>
      /**
       * The <source> tag is used to specify multiple media resources for media elements, such as <video>, <audio>, and <picture>.
       * The <source> tag allows you to specify alternative video/audio/image files which the browser may choose from, based on its media type, codec support or media query.
       */
      source: PartialElement<HTMLSourceElement>
      /**
       * The <span> tag is used to group inline-elements in a document.
       * The <span> tag provides no visual change by itself.
       * The <span> tag provides a way to add a hook to a part of a text or a part of a document.
       */
      span: PartialElement<HTMLSpanElement>
      /**
       * The <strong> tag is a phrase tag. It defines important text.
       */
      strong: PartialElement<HTMLElement>
      /**
       * The <style> tag is used to define style information for an HTML document.
       */
      style: PartialElement<HTMLStyleElement>
      /**
       * The <sub> tag defines subscript text. Subscript text appears half a character below the normal line, and is sometimes rendered in a smaller font. Subscript text can be used for chemical formulas, like H2O.
       */
      sub: PartialElement<HTMLElement>
      /**
       * The <summary> tag defines a visible heading for the <details> element. The heading can be clicked to view/hide the details.
       */
      summary: PartialElement<HTMLElement>
      /**
       * The <sup> tag defines superscript text. Superscript text appears half a character above the normal line, and is sometimes rendered in a smaller font. Superscript text can be used for footnotes, like WWW[1].
       */
      sup: PartialElement<HTMLElement>
      /**
       * The <svg> tag defines a container for SVG graphics.
       * SVG has several methods for drawing paths, boxes, circles, text, and graphic images.
       */
      svg: PartialElement<SVGElement>
      /**
       * The <table> tag defines an HTML table.
       * An HTML table consists of the <table> element and one or more <tr>, <th>, and <td> elements.
       * The <tr> element defines a table row, the <th> element defines a table header, and the <td> element defines a table cell.
       * A more complex HTML table may also include <caption>, <col>, <colgroup>, <thead>, <tfoot>, and <tbody> elements.
       */
      table: PartialElement<HTMLTableElement>
      /**
       * The <tbody> tag is used to group the body content in an HTML table.
       * The <tbody> element is used in conjunction with the <thead> and <tfoot> elements to specify each part of a table (body, header, footer).
       * Browsers can use these elements to enable scrolling of the table body independently of the header and footer. Also, when printing a large table that spans multiple pages, these elements can enable the table header and footer to be printed at the top and bottom of each page.
       * The <tbody> tag must be used in the following context: As a child of a <table> element, after any <caption>, <colgroup>, and <thead> elements.
       */
      tbody: PartialElement<HTMLElement>
      /**
       * The <td> tag defines a standard cell in an HTML table.
       * An HTML table has two kinds of cells:
       *  - Header cells - contains header information (created with the <th> element)
       *  - Standard cells - contains data (created with the <td> element)
       * The text in <th> elements are bold and centered by default.
       * The text in <td> elements are regular and left-aligned by default.
       */
      td: PartialElement<HTMLTableCellElement>
      /**
       * The <template> tag holds its content hidden from the client.
       * Content inside a <template> tag will not be rendered.
       * The content can be made visible and rendered later by using JavaScript.
       * Use the <template> tag when you have HTML code you want to use over and over again, but not until you ask for it. To do this without the <template> tag, you have to create the HTML code with JavaScript to prevent the browser from rendering the code.
       */
      template: PartialElement<HTMLTemplateElement>
      /**
       * The <textarea> tag defines a multi-line text input control.
       * A text area can hold an unlimited number of characters, and the text renders in a fixed-width font (usually Courier).
       * The size of a text area can be specified by the cols and rows attributes, or even better; through CSS' height and width properties.
       */
      textarea: PartialElement<HTMLTextAreaElement>
      /**
       * The <tfoot> tag is used to group footer content in an HTML table.
       * The <tfoot> element is used in conjunction with the <thead> and <tbody> elements to specify each part of a table (footer, header, body).
       * Browsers can use these elements to enable scrolling of the table body independently of the header and footer. Also, when printing a large table that spans multiple pages, these elements can enable the table header and footer to be printed at the top and bottom of each page.
       * The <tfoot> tag must be used in the following context: As a child of a <table> element, after any <caption>, <colgroup>, <thead>, and <tbody> elements.
       */
      tfoot: PartialElement<HTMLElement>

      /**
       * The <th> tag defines a header cell in an HTML table.
       * An HTML table has two kinds of cells:
       *  - Header cells - contains header information (created with the <th> element)
       *  - Standard cells - contains data (created with the <td> element)
       * The text in <th> elements are bold and centered by default.
       * The text in <td> elements are regular and left-aligned by default.
       */
      th: PartialElement<HTMLTableHeaderCellElement>
      /**
       * The <thead> tag is used to group header content in an HTML table. The <thead> element is used in conjunction with the <tbody> and <tfoot> elements to specify each part of a table (header, body, footer).
       * Browsers can use these elements to enable scrolling of the table body independently of the header and footer. Also, when printing a large table that spans multiple pages, these elements can enable the table header and footer to be printed at the top and bottom of each page.
       * The <thead> tag must be used in the following context: As a child of a <table> element, after any <caption>, and <colgroup> elements, and before any <tbody>, <tfoot>, and <tr> elements.
       */
      thead: PartialElement<HTMLElement>
      /**
       * The <time> tag defines a human-readable date/time. This element can also be used to encode dates and times in a machine-readable way so that user agents can offer to add birthday reminders or scheduled events to the user's calendar, and search engines can produce smarter search results.
       */
      time: PartialElement<HTMLTimeElement>
      /**
       * The <tr> tag defines a row in an HTML table.
       * A <tr> element contains one or more <th> or <td> elements.
       */
      tr: PartialElement<HTMLTableRowElement>
      /**
       * The <track> tag specifies text tracks for media elements (<audio> and <video>).
       * This element is used to specify subtitles, caption files or other files containing text, that should be visible when the media is playing.
       */
      track: PartialElement<HTMLTrackElement>
      /**
       * The <u> tag represents some text that should be stylistically different from normal text, such as misspelled words or proper nouns in Chinese.
       */
      u: PartialElement<HTMLElement>
      /**
       * The <ul> tag defines an unordered (bulleted) list.
       * Use the <ul> tag together with the <li> tag to create unordered lists.
       */
      ul: PartialElement<HTMLUListElement>
      /**
       * The <var> tag is a phrase tag. It defines a variable.
       */
      var: PartialElement<HTMLElement>
      /**
       * The <video> tag specifies video, such as a movie clip or other video streams.
       */
      video: PartialElement<HTMLVideoElement>
      /**
       * The <wbr> (Word Break Opportunity) tag specifies where in a text it would be ok to add a line-break.
       * Tip: When a word is too long, or you are afraid that the browser will break your lines at the wrong place, you can use the <wbr> element to add word break opportunities.
       */
      wbr: PartialElement<HTMLElement>
    }
  }
}

export const isJsxElement = (obj: any): obj is JSX.Element => {
  const casted = obj as JSX.Element
  return casted.props !== undefined && casted.state !== undefined
}
