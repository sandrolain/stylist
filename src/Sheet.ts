import { Rule, RuleProps } from "./Rule";
import { ClassRule } from "./ClassRule";
import { fixPropertyValue } from "./tools";
import { camelCase } from "./utils";


export interface SheetOptions {
  /** StyleSheet name for reference */
  sheetName?: string;
  /** Media types for the StyleSheet */
  media?: string;
  /** StyleSheet content as string */
  content?: string;
}

export class Sheet {
  protected $style: HTMLStyleElement;
  protected styleSheet: CSSStyleSheet;
  protected proxy: Sheet;

  constructor (protected name: string = "", media: string = "screen", content: string = null) {

    const $style = document.createElement("style");

    $style.setAttribute("media", media);
    $style.setAttribute("data-name", this.name);
    $style.appendChild(document.createTextNode(`/* SL StyleSheet : ${this.name} */`));

    if(content) {
      // TODO: manage object structures
      $style.appendChild(document.createTextNode(content));
    }

    document.head.appendChild($style);

    this.$style     = $style;
    this.styleSheet = $style.sheet as CSSStyleSheet;

    this.proxy = new Proxy(this, {
      has: (target: Sheet, name: string): boolean => {
        return target.hasRule(name);
      },
      get: (target: Sheet, name: string): any => {
        if(typeof (target as any)[name] === "function") {
          return (target as any)[name].bind(target);
        } else if(["$style", "styleSheet"].indexOf(name) > -1) {
          return (target as any)[name];
        }
        return target.getRule(name);
      },
      set: (target: Sheet, name: string, value: any): boolean => {
        if(["styleSheet"].indexOf(name) > -1) {
          (target as any)[name] = value;
        } else {
          target.setProperties(name, value);
        }
        return true;
      },
      deleteProperty: (target: Sheet, name: string): boolean => {
        target.deleteRule(name);
        return true;
      }
    });
  }

  getProxy (): Sheet {
    return this.proxy;
  }

  /**
   * Check if the *Sheet* has a specified property defined for a specified selector
   * @param selector CSS selector
   * @param property CSS property name
   */
  hasProperty (selector: string, property: string): boolean {
    const props = this.getSelectorProperties(selector);
    return props ? (property in props) : false;
  }

  /**
   * Return a property value as string for a specified selector if defined or false if not found
   * @param selector CSS selector
   * @param property CSS property name
   */
  getProperty (selector: string, property: string): string | false {
    const props = this.getSelectorProperties(selector);
    return props ? props[property] : false;
  }

  /**
   * Set a property value for a specified selector into this *Sheet*
   * @param selector CSS selector
   * @param property CSS property name
   * @param value CSS property value
   */
  setProperty (selector: string, property: string, value: any): Sheet | false {
    return this.setProperties(selector, { [property] : value });
  }

  /**
   * Remove a property for a specified selector from this *Sheet*
   * @param selector CSS selector
   * @param property CSS property name
   */
  deleteProperty (selector: string, property: string): void {
    const rules = this.getSelectorCSSRulesList(selector);
    for(const rule of rules) {
      if(rule instanceof CSSStyleRule) {
        rule.style.removeProperty(property);
      }
    }
  }

  /**
   * Verify if is defined a *Rule* for the specified selector into this *Sheet*
   * @param selector CSS selector
   */
  hasRule (selector: string): boolean {
    const rulesList = this.getSelectorCSSRulesList(selector);
    return (rulesList.length > 0);
  }

  getRule (selector: string, props: RuleProps = {}): Rule {
    return new Rule(this, selector, props);
  }

  /**
   * Remove from this *Sheet* the *Rule* for the specified selector
   * @param selector CSS selector
   */
  deleteRule (selector: string): void {
    const cssRules = this.styleSheet.cssRules;
    for(let i = 0, len = cssRules.length; i < len; i++) {
      const rule = cssRules[i];
      if(rule instanceof CSSStyleRule && rule.selectorText === selector) {
        this.styleSheet.deleteRule(i);
      }
    }
  }

  setProperties (selector: string, props: RuleProps, index = -1): Sheet | false {
    const rule = this.getSelectorLastRule(selector, index);
    return rule ? this._applyPropsToRule(rule, props) : false;
  }

  protected _applyPropsToRule (rule: CSSRule, props: RuleProps): Sheet {
    if(!(rule instanceof CSSStyleRule)) {
      return this;
    }

    const style = rule.style;

    for(const property in props) {
      const res = fixPropertyValue(property, props[property]);
      style.setProperty(res.property, res.value, res.priority);
    }

    return this;
  }

  protected getCSSRuleByIndex (index: number): CSSRule {
    return this.styleSheet.cssRules[index];
  }

  protected getSelectorCSSRulesList (selector: string): CSSRule[] {
    const rules = Array.from(this.styleSheet.cssRules);
    return rules.filter((rule) => {
      return (rule instanceof CSSStyleRule && rule.selectorText === selector);
    });
  }

  protected getSelectorLastRule (selector: string, index = -1): CSSRule {
    let rule = this.getSelectorCSSRulesList(selector).pop();
    if(!rule) {
      const sheet = this.styleSheet;
      index = index < 0 ? sheet.cssRules.length : index;
      const newIndex = sheet.insertRule(`${selector} {}`, index);
      rule = this.getCSSRuleByIndex(newIndex);
    }
    return rule;
  }

  getSelectorProperties (selector: string): RuleProps | false {
    const rules = this.getSelectorCSSRulesList(selector);
    const res: RuleProps = {};
    let defined  = false;

    for(const rule of rules) {
      if(!(rule instanceof CSSStyleRule)) {
        continue;
      }

      defined    = true;

      const styles  = rule.style;

      for(let i = 0, len = styles.length; i < len; i++) {
        const property  = camelCase(styles[i]);
        const value    = (styles as any)[property];

        if(typeof value !== "undefined") {
          res[property] = value;
        }
      }
    }

    return defined ? res : false;
  }

  protected getCSSRules (): CSSStyleRule[] {
    const allCSSRules = Array.from(this.styleSheet.cssRules);
    return allCSSRules.filter((rule) => (rule instanceof CSSStyleRule)) as CSSStyleRule[];
  }

  getRulesSelectors (): string[] {
    return this.getCSSRules().map((rule) => rule.selectorText);
  }

  [Symbol.iterator] (): Iterator<Rule> {
    const selectors = this.getRulesSelectors();
    let   index = 0;

    return {
      next (): IteratorResult<Rule> {
        if(index < selectors.length) {
          return {
            done: false,
            value: new Rule(this, selectors[index++])
          };
        }

        return {
          done: true,
          value: null
        };
      }
    };
  }

  getClassRule (className: string | RuleProps = null, props: RuleProps = {}): ClassRule {
    if(className && typeof className === "object") {
      props     = className;
      className = null;
    }
    return new ClassRule(this, className as string, props);
  }

  static _styleSheets: Map<string, Sheet> = new Map();

  static getStyleSheet ({ sheetName = "default", media = "screen", content = null }: SheetOptions = {}): Sheet {
    if(!this._styleSheets.has(sheetName)) {
      const styleSheet = new Sheet(sheetName, media, content);
      this._styleSheets.set(sheetName, styleSheet);
    }
    return this._styleSheets.get(sheetName);
  }

  static getClassRule ({ sheetName = "default", className = null, props }: {sheetName?: string; className?: string; props?: RuleProps} = {}): ClassRule {
    const sheet = this.getStyleSheet({ sheetName });
    return sheet.getClassRule(className, props);
  }
}
