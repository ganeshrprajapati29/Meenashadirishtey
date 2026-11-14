/** Strip keys starting with "$" or containing "." (NoSQL operator injection) from body/query/params */
function clean(obj) {
  if (Array.isArray(obj)) return obj.map(clean);
  if (obj && typeof obj === 'object' && !(obj instanceof Date)) {
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) delete obj[key];
      else obj[key] = clean(obj[key]);
    }
  }
  return obj;
}

module.exports = (req, res, next) => {
  if (req.body) clean(req.body);
  if (req.params) clean(req.params);
  if (req.query) clean(req.query);
  next();
};
