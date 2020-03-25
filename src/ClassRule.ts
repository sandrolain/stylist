import { Sheet } from "./Sheet";
import { Rule, RuleProps } from "./Rule";

export class ClassRule extends Rule {
  public readonly className: string;

  constructor (sheet: Sheet, className: string = null, props: RuleProps = {}) {
    className = className || ClassRule.generateClassName();

    super(sheet, `.${className}`, props);

    this.className = className;

    return this.ruleProxy as ClassRule;
  }

  protected static _counter = 0;

  static generateClassName (): string {

    const num = (Math.round(Math.random() * 9999999999) * 10000) + this._counter++;

    return `sl-${num.toString(36)}`;
  }

  toString (): string {
    return this.className;
  }
}
