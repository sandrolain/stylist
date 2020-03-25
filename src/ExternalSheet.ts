import { Sheet } from "./Sheet";

export class ExternalSheet extends Sheet {
  constructor (url: string, name?: string, media: string = "screen") {
    super(name || url, media);

    if(ExternalSheet.isSameDomain(url)) {
      url = ExternalSheet.getAbsoluteUrl(url);

      fetch(url).then((res) => res.text()).then((css) => {
        const addedCss = [];

        for(const rule of Array.from(this.styleSheet.cssRules)) {
          addedCss.push(rule.cssText);
        }

        this.$style.appendChild(document.createTextNode(`${css} ${addedCss.join("")}`));

        // after the addition of a new source a new instance of CSSStyleSheet linked to the DOM node is created
        this.styleSheet = this.$style.sheet as CSSStyleSheet;
      });
    } else {
      this.$style.appendChild(document.createTextNode(`@import url(${url})`));
    }

    return this.sheetProxy as ExternalSheet;
  }

  static isSameDomain (url: string): boolean {
    const $a = document.createElement("a");
    $a.setAttribute("href", url);

    return ($a.hostname === window.location.hostname);
  }

  static getAbsoluteUrl (url: string): string {
    const $a = document.createElement("a");
    $a.setAttribute("href", url);

    return $a.href.toString();
  }

  static import (url: string): ExternalSheet {
    return new ExternalSheet(url);
  }
}

