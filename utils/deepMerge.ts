const isObject = (val) => val && typeof val === 'object'
const mergeArrayWithDedupe = (a, b) => [...new Set([...a, ...b])]

const deepMerge = (target, newTarget) => {
  for (const key of Object.keys(newTarget)) {
    const oldVal = target[key]
    const newVal = newTarget[key]

    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      target[key] = mergeArrayWithDedupe(oldVal, newVal)
    } else if (isObject(oldVal) && isObject(newVal)) {
      target[key] = deepMerge(oldVal, newVal)
    } else {
      target[key] = newVal
    }
  }

  return target
}

export default deepMerge
