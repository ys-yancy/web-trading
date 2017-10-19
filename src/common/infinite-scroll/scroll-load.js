"use strict";

var Base = require('../../app/base');

var win = $(window);
var doc = $(document);

function ScrollLoad() {
  ScrollLoad.superclass.constructor.apply(this, arguments);
  this.init();
}

Base.extend(ScrollLoad, Base, {
  init: function() {
    
    this.referEl = this.referEl || win;
    this.winHeight = this.referEl.height();
    this._bind();
  },

  _bind: function() {
    this.scrollFn = $.proxy(this._scroll, this);
    // this.resizeFn = $.proxy(this._resize, this);

    this.referEl.on('scroll', this.scrollFn);
    // win.on('resize', this.resizeFn);
  },

  _scroll: function() {
    if (!this.isPause() && !this._isLoading()) {
      if (this.referEl.height() - this.referEl.scrollTop() - this.winHeight - this.bufferHeight <= 0) {
        //this.pause();
        this.resetLoading();
        this.fire('request:nextPage');
      }
    }
  },

  _resize: function() {
    this.winHeight = this.referEl.height();
  },

  destroy: function() {},

  resetLoading: function() {
    this.loading = false;
  },

  _isLoading: function() {
    return this.loading === true;
  },

  resume: function() {
    this.isPauseNow = false;
  },

  pause: function() {
    this.isPauseNow = true;
  },

  isPause: function() {
    return this.isPauseNow;
  },

  attrs: {
    // 是否在正在加载
    loading: false,
    bufferHeight: 100, // 缓冲高度
    isPauseNow: false
  },

  states: {

  }
});

module.exports = ScrollLoad;