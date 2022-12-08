export default function sortDependencies(packageJson) {
  const sortObj = {}

  const depTypes = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']

  for (const depType of Object.keys(depTypes)) {
    if (packageJson[depType]) {
      sortObj[depType] = {}

      Object.keys(packageJson[depType])
        .sort()
        .forEach((name) => {
          sortObj[depType][name] = packageJson[depType][name]
        })
    }
  }

  return {
    ...packageJson,
    ...sortObj
  }
}
