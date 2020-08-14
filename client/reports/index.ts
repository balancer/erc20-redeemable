const requireFile = require.context('./', true, /[\w-]+\.json$/);

export default Object.fromEntries(
  requireFile
    .keys()
    .map(name => [
      name.replace('/_totals.json', '').replace('./', ''),
      requireFile(name)
    ])
);
