
export type ForEachIterable =
  | Map<any, any>
  | Array<any>
  | Set<any>
  | Record<string, any>;

/**
 * Invoke a *callback* function for every key-value pair of the passed {@link ForEachIterable} data
 * @param list The iterable data
 * @param callback The callback function invoked for every key-value pair
 */
export function forEach (
  list: ForEachIterable,
  callback: (value: any, key: any) => any
): void {
  if(list) {
    if(list instanceof Map || list instanceof Array || list instanceof Set) {
      list.forEach(callback);
    } else if(typeof list === "object") {
      for(const key in list) {
        callback.call(list, list[key], key);
      }
    }
  }
}


export function camelCase (str: string): string {
  return str.replace(/-\D/g, function (m: string): string {
    return m.charAt(1).toUpperCase();
  });
}

export function hyphenate (str: string): string {
  return str.replace(/[A-Z]/g, function (m: string): string {
    return `-${m.toLowerCase()}`;
  });
}
