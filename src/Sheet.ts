import { Rule, RuleProps } from "./Rule";
import { ClassRule } from "./ClassRule";
import { fixPropertyValue, fixPropertyValueAsString } from "./tools";
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
  protected sheetProxy: {};

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

    this.sheetProxy = new Proxy({}, {
      has: (target: {}, name: string): boolean => {
        return this.hasRule(name);
      },
      get: (target: {}, name: string): any => {
        if(typeof (this as any)[name] === "function") {
          return (this as any)[name].bind(this);
        } else if(["$style", "styleSheet"].indexOf(name) > -1) {
          return (this as any)[name];
        }

        return this.selectorRule(name);
      },
      set: (target: {}, name: string, value: any): boolean => {
        if(["styleSheet"].indexOf(name) > -1) {
          (this as any)[name] = value;
        } else {
          this.setProperties(name, value);
        }

        return true;
      },
      deleteProperty: (target: {}, name: string): boolean => {
        this.deleteRule(name);
        return true;
      }
    });

    return this.sheetProxy as Sheet;
  }

  hasProperty (selector: string, property: string): boolean {
    const props = this.getSelectorProperties(selector);
    return props ? (property in props) : false;
  }

  getProperty (selector: string, property: string): string | false {
    const props = this.getSelectorProperties(selector);
    return props ? props[property] : false;
  }

  setProperty (selector: string, property: string, value: any): Sheet | false {
    return this.setProperties(selector, { [property] : value });
  }

  deleteProperty (selector: string, property: string): void {
    const rules = this.getSelectorRulesList(selector);

    for(const rule of rules) {
      if(!( rule instanceof CSSStyleRule)) {
        continue;
      }

      const style = rule.style;

      style.removeProperty(property);
    }
  }

  hasRule (selector: string): boolean {
    const rule = this.getSelectorRulesList(selector);

    return (rule.length > 0);
  }

  deleteRule (selector: string): void {
    const cssRules = this.styleSheet.cssRules;

    for(let i = 0, len = cssRules.length; i < len; i++) {
      const rule = cssRules[i];

      if(!( rule instanceof CSSStyleRule)) {
        continue;
      }

      if(rule.selectorText === selector) {
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

  getRuleByIndex (index: number): CSSRule {
    return this.styleSheet.cssRules[index];
  }

  getSelectorRulesList (selector: string): CSSRule[] {
    const rules = Array.from(this.styleSheet.cssRules);

    return rules.filter((rule) => {
      return (rule instanceof CSSStyleRule && rule.selectorText === selector);
    });
  }

  getSelectorLastRule (selector: string, index = -1): CSSRule {
    let rule = this.getSelectorRulesList(selector).pop();

    if(!rule) {
      const sheet = this.styleSheet;

      index = index < 0 ? sheet.cssRules.length : index;

      const newIndex = sheet.insertRule(`${selector} {}`, index);

      rule = this.getRuleByIndex(newIndex);
    }

    return rule;
  }

  getSelectorProperties (selector: string): RuleProps | false {
    const rules = this.getSelectorRulesList(selector);
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

  getRules (): CSSRule[] {
    return Array.from(this.styleSheet.cssRules);
  }

  [Symbol.iterator] (): Iterator<CSSRule> {
    const rules = this.styleSheet.cssRules;
    let   index = 0;

    return {
      next (): IteratorResult<CSSRule> {
        if(index < rules.length) {
          return {
            done: false,
            value: rules[index++]
          };
        }

        return {
          done: true,
          value: null
        };
      }
    };
  }

  selectorRule (selector: string, props: RuleProps = {}): Rule {
    return new Rule(this, selector, props);
  }

  classRule (className: string | RuleProps = null, props: RuleProps = {}): ClassRule {
    if(className && typeof className === "object") {
      props    = className;
      className  = null;
    }

    return new ClassRule(this, className as string, props);
  }

  static getRulesString (rules: RuleProps): string {
    const temp: string[] = [];

    for(const prop in rules) {
      temp.push(fixPropertyValueAsString(prop, rules[prop]));
    }

    return temp.join("\n");
  }

  static _styleSheets: Map<string, Sheet> = new Map();

  static getStyleSheet ({ sheetName = "default", media = "screen", content = null }: SheetOptions = {}): Sheet {
    if(!this._styleSheets.has(sheetName)) {
      const styleSheet = new Sheet(sheetName, media, content);

      this._styleSheets.set(sheetName, styleSheet);
    }

    return this._styleSheets.get(sheetName);
  }

  static classRule ({ sheetName = "default", className = null, props }: {sheetName?: string; className?: string; props?: RuleProps} = {}): ClassRule {
    const sheet = this.getStyleSheet({ sheetName });

    return sheet.classRule(className, props);
  }
}

