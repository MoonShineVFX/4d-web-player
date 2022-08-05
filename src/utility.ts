export function pad(num: number, length: number, padString: string = '0'): string {
  const nString: string = num + '';
  if (nString.length >= length) return nString;
  return new Array(length - nString.length + 1).join(padString) + nString;
}
