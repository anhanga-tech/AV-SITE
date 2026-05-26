// Object.hasOwn — not available in Chrome < 93 (Sentry NODE-1)
// Reference captured once at install time to guard against prototype pollution.
if (!Object.hasOwn) {
  const hop = Object.prototype.hasOwnProperty;
  Object.hasOwn = (obj: object, prop: PropertyKey) => hop.call(obj, prop);
}
