// Object.hasOwn — not available in Chrome < 93 (Sentry NODE-1)
// Reference captured once at install time to guard against prototype pollution.
// defineProperty used to match native non-enumerable descriptor.
if (!Object.hasOwn) {
  const hop = Object.prototype.hasOwnProperty;
  Object.defineProperty(Object, 'hasOwn', {
    value: (obj: object, prop: PropertyKey) => hop.call(obj, prop),
    writable: true,
    configurable: true,
    enumerable: false,
  });
}
