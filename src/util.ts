export function isEmptyMap<T> (map: Map<string, T> | undefined) {
  if (!map) {
    return true
  } else {
    return map.size === 0
  }
}
