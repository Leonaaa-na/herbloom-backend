// pick(req.body, ["name", "phone"])  →  { name, phone } only
module.exports = (obj = {}, keys = []) =>
  keys.reduce((out, key) => {
    if (obj[key] !== undefined) out[key] = obj[key];
    return out;
  }, {});