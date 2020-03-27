import { hyphenate } from "./utils";

const numberOnlyProperties: Record<string, boolean> = {
  "z-index": true,
  "font-weight": true,
  "opacity": true,
  "zoom": true
};

const multiValuesProperties: Record<string, boolean> = {
  "margin": true,
  "padding": true,
  "border-radius": true
};

// TODO: better name
export function fixPropertyValue (property: string, value: any, priority = ""): {property: string; value: string; priority: string} {
  property = hyphenate(property);

  const valType = typeof value;

  if(valType === "number") {
    if(property.match(/color/i)) {
      value = `#${value.toString(16)}`;
    } else if(!numberOnlyProperties[property]) {
      value += "px";
    }
  } else {
    if(property === "background-image-url") {
      property  = "background-image";
      value    = `url(${value})`;
    }

    if(value instanceof Array) {
      // TODO: caso array [valore, unità] es [10, "em"]
      const list = [];

      for(const val of value) {
        const res = this.fixPropertyValue(property, val);

        list.push(res.value);
      }

      const sep = multiValuesProperties[property] ? " " : ", ";

      value = list.join(sep);
    }
  }

  value = `${value}`;

  return {
    property,
    value,
    priority
  };
}

// TODO: better name
export function fixPropertyValueAsString (property: string, value: any, pad = 0): string {
  const res = this.fixPropertyValue(property, value);
  return `${"  ".repeat(pad)}${res.property}: ${res.value}${res.priority ? " " : ""}${res.priority};`;
}

export const objectToCSSString = (obj: Record<string, any>, parentKey: string = null, pad: number = 0): string => {
  const res = [];
  const sub = [];

  for(const key in obj) {
    let val     = obj[key];
    let valType = typeof val;
    let subKey  = key;
    let mediaKey;

    if(key.match(/@media/i)) {
      mediaKey  = key;
      subKey    = null;
      pad      += 1;
    } else if(parentKey) {
      subKey = `${parentKey} ${key}`;
    }

    // check ed esecuzuone se funzione
    if(valType === "function") {
      val     = val();
      valType = typeof val;
    }

    if(mediaKey) {
      sub.push(`${mediaKey} {`);
    }

    if(valType !== "undefined" && val !== null) {
      if(valType === "object" && !(val instanceof Array)) {
        sub.push(objectToCSSString(val, subKey, pad));

        // TODO: caso Array?
      } else {
        res.push(fixPropertyValueAsString(key, val, pad + 1));
      }
    }

    if(mediaKey) {
      sub.push("}");
    }
  }

  if(res.length > 0 && parentKey) {
    res.unshift(`${"  ".repeat(pad)}${parentKey} {`);
    res.push(`${"  ".repeat(pad)}}\n`);
  }

  return res.concat(sub).join("\n");
};

export function getRulesString (rules: Record<string, any>): string {
  const temp: string[] = [];
  for(const prop in rules) {
    temp.push(fixPropertyValueAsString(prop, rules[prop]));
  }
  return temp.join("\n");
}
