function defineReadOnlyProperty (obj, key, value) {
  Object.defineProperty(obj, key, {
      value        : value
    , writeable    : false
    , enumerable   : true
    , configurable : false
  })
}

function Creator (name) {
  this._name = name
}

Creator.prototype = {
    setBase: function (base) {
      this._base = base
      return this
    }

  , setConstructor: function (constructor) {
      this._constructor = constructor
      return this
    }

  , setPrototype: function (proto) {
      this._proto = proto
      return this
    }

  , setMethods: function (methods) {
      this._methods = methods
      return this
    }

  , setPrivateMethods: function (privateMethods) {
      this._privateMethods = privateMethods
      return this
    }

  , setReadOnlyProperties: function (readOnlyPropertiesCallback) {
      this._readOnlyPropertiesCallback = readOnlyPropertiesCallback
      return this
    }

  , setPrivateReadOnlyProperties: function (privateReadOnlyPropertiesCallback) {
      this._privateReadOnlyPropertiesCallback = privateReadOnlyPropertiesCallback
      return this
    }

  , setGetters: function (getters) {
      this._getters = getters
      return this
    }

  , create: function () {
      var args         = Array.prototype.slice.call(arguments)
        , obj          = !!this._base ? new this._base() : {}
        , ctx          = { pub: obj }
        , readOnly     = this._readOnlyPropertiesCallback && this._readOnlyPropertiesCallback(args)
        , privReadOnly = this._privateReadOnlyPropertiesCallback && this._privateReadOnlyPropertiesCallback(args)
        , name         = this._name

      if (this._proto)
        obj.__proto__ = Object.create(this._proto.prototype)

      readOnly && Object.keys(readOnly).forEach(function (p) {
        defineReadOnlyProperty(obj, p, readOnly[p])
        defineReadOnlyProperty(ctx, p, readOnly[p])
      })

      privReadOnly && Object.keys(privReadOnly).forEach(function (p) {
        defineReadOnlyProperty(ctx, p, privReadOnly[p])
      })

      this._methods && Object.keys(this._methods).forEach(function (m) {
        obj[m] = ctx[m] = this._methods[m].bind(ctx)
      }.bind(this))

      this._privateMethods && Object.keys(this._privateMethods).forEach(function (m) {
        ctx[m] = this._privateMethods[m].bind(ctx)
      }.bind(this))

      this._getters && Object.keys(this._getters).forEach(function (g) {
        obj.__defineGetter__(g, this._getters[g].bind(ctx))
      }.bind(this))

      if (name)
        obj.toString = function () { return name }

      if (this._constructor)
        this._constructor.apply(ctx, args)

      return obj
    }
}

module.exports.Creator = Creator