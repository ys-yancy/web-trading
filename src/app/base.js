"use strict";

// require('../lib/es5-shim');
// require('../lib/es6-shim');
require('../lib/es5-sham');

var CustomEvent = require('./event');
var Tpl = require('./render');
var Io = require('./ajax');
var extend = require('./extend');
var Cookie = require('../lib/cookie');
var Login = require('./login');
var _ = require('../lib/underscore');
window._ = _;

function Base() {
  var config = arguments[0] || {};

  initAttrs(this, this.defaults());

  initAttrs(this, this.attrs || {});

  initAttrs(this, config);

  this._events = {};
  this.cookie = Cookie;
}

Base.prototype.constructor = Base;
Base.extend = extend;
Base.prototype.defaults = function() {
  return {};
};

_.extend(Base.prototype, Tpl);
_.extend(Base.prototype, CustomEvent);
_.extend(Base.prototype, Io);
_.extend(Base.prototype, Login);

function initAttrs(obj, attrs, isDefine) {
  var val, getter, setter;

  for (var key in attrs) {
    if (attrs.hasOwnProperty(key)) {
      val = attrs[key];

      obj[key] = val;
    }
  }
}

module.exports = Base;