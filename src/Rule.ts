import { Sheet } from "./Sheet";

export type RuleProps = Record<string, any>;

/**
 * A *Rule* represent a single CSS selector and its properties
 */
export class Rule {
  protected states: Map<string, RuleProps> = new Map();
  protected currentState: string = "default";
  protected ruleProxy: Rule;

  /**
   * Create a new *Rule* instance
   * @param sheet The instance representing the owner stylesheet
   * @param selector The CSS selector string of the rule
   * @param props Optional object with key-value pairs of CSS properties to add to current *Rule*
   */
  constructor (protected sheet: Sheet, protected selector: string, props: RuleProps = null) {

    if(props) {
      this.setProperties(props);
    }

    this.ruleProxy = new Proxy(this, {
      has: (target: Rule, name: string): boolean => {
        return this.hasProperty(name);
      },
      get: (target: Rule, name: string): any => {
        if(typeof (this as any)[name] === "function") {
          return (this as any)[name].bind(this);
        } else if(["className"].indexOf(name) > -1) {
          return (this as any)[name];
        }

        return this.getProperty(name);
      },
      set: (target: Rule, name: string, value: any): boolean => {
        if(["className"].indexOf(name) > -1) {
          (this as any)[name] = value;
        } else {
          this.setProperty(name, value);
        }

        return true;
      },
      deleteProperty: (target: Rule, name: string): boolean => {
        this.deleteProperty(name);
        return true;
      }
    });

    return this.ruleProxy;
  }

  /**
   * Check if the *Rule* has a specified property defined
   * @param name CSS property name
   */
  hasProperty (name: string): boolean {
    return this.sheet.hasProperty(this.selector, name);
  }

  /**
   * Return a property value as string if defined or false if not found
   * @param name CSS property name
   */
  getProperty (name: string): string | false {
    return this.sheet.getProperty(this.selector, name);
  }

  /**
   * Set a property value for this *Rule*
   * @param name CSS property name
   * @param value CSS property value
   */
  setProperty (name: string, value: any): boolean {
    return !!this.sheet.setProperty(this.selector, name, value);
  }

  /**
   * Remove a property from this *Rule*
   * @param name CSS property name
   */
  deleteProperty (name: string): void {
    this.sheet.deleteProperty(this.selector, name);
  }

  /**
   * Set multiple properties for this *Rule*
   * @param props *RuleProps* object with name-value pairs of properties
   */
  setProperties (props: RuleProps): void {
    this.sheet.setProperties(this.selector, props);
  }

  /**
   * Return a *RuleProps* object with name-value pairs of properties defined for this *Rule*, or false if no one property is defined
   */
  getProperties (): RuleProps | false {
    return this.sheet.getSelectorProperties(this.selector);
  }

  /**
   * *Rule* is an iterable object.<br/>
   * The iterator return for every property defined for this *Rule* a name-value pair.
   *
   * ```typescript
   * const rule = new Rule(sheet, ".selector");
   *
   * for(const [propertyName, propertyValue] of rule) {
   *   // ...
   * }
   * ```
   */
  [Symbol.iterator] (): Iterator<[string, any]> {
    const properties  = this.getProperties();
    const keys      = Object.keys(properties);

    let index      = 0;

    return {
      next (): IteratorResult<[string, any]> {
        if(properties && index < keys.length) {
          const key = keys[index++];

          return {
            done: false,
            value: [key, properties[key]]
          };
        }

        return {
          done: true,
          value: null
        };
      }
    };
  }

  /**
   * Generate a new *Rule* that represent a selector derived from the actual.
   *
   * ```typescript
   * const rule = new Rule(sheet, ".selector");
   * rule.derivedRule(".sub-selector");
   * // new Rule selector = ".selector .sub-selector"
   * ```
   *
   * ```typescript
   * const rule = new Rule(sheet, ".selector");
   * rule.derivedRule("#parent-selector &:hover");
   * // new Rule selector = "#parent-selector .selector:hover"
   * ```
   *
   * @param selector Default a child selector of current *Rule*.
   * If an **&** is present into the passed selector string,
   * it will be replaced with the current *Rule* selector.
   * @param props Optional object with key-value pairs of CSS properties to add to the new *Rule*
   */
  derivedRule (selector: string, props: RuleProps = null): Rule {
    if(selector.indexOf("&") > -1) {
      selector = selector.replace("&", this.selector);
    } else {
      selector = `${this.selector} ${selector}`;
    }
    return this.sheet.getRule(selector, props);
  }

  /**
   *
   * @param stateName The name that identify the state
   * @param props Object with key-value pairs of CSS properties to change for the state
   */
  setStateProps (stateName: string, props: RuleProps = {}): void {
    this.states.set(stateName, props);
  }

  setState (state: string): void {
    this.currentState = state;
  }

  toString (): string {
    // TODO: serialize rule selector and properties
    return "";
  }
}
