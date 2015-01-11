module.exports = function (db) {
  if (!db || typeof db !== 'object') return false
  return typeof db.iterator === 'function'
    && typeof db.get === 'function'
    && typeof db.put === 'function'
    && typeof db.batch === 'function'
}
