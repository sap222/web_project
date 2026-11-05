// Copies only the listed fields that were actually sent, so a partial
// update never overwrites other fields and clients cannot set extra ones.
export function pick(source, keys) {
  const result = {};
  for (const key of keys) {
    if (source[key] !== undefined) result[key] = source[key];
  }
  return result;
}
