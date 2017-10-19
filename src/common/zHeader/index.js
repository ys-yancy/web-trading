"use strict";

require('./index.css');
var Base = require('../../app/base');
var Uri = require('../../app/uri');
var tmpl = require('./index.ejs.html');

export default class ZHeader extends Base {
  constructor() {
    super();

    this.option = location.pathname.indexOf('/option.html') !== -1;
    var symbolType = new Uri().getParam('symbolType');

    if (this.option) {
      symbolType = symbolType || 0;
    }

    this.renderTo(tmpl, {
      symbolType: symbolType
    }, $('#J_OptionTop'));

    this.el = $('#J_OptionTop');
    this.navEl = $('#J_SymbolNav');

    if (!this.option) {
      this.navEl.hide();
      this._bind();
    } else {
      this._optionBind();
    }
  }

  _bind() {

    this.el.on('click', 'a', (e) => {
      var curEl = $(e.currentTarget),
        parent = curEl.parent();

      // e.preventDefault();
      // if (parent.hasClass('active')) {
      //   return;
      // }

      // parent.siblings().removeClass('active');
      // parent.addClass('active');
      var index = parent.index();
      if (!this.option) {
        location.href = './option.html?symbolType=' + index;
      }
    });

    this.el.on('mouseenter', (e) => {
      this.navEl.show();
    });

    this.el.on('mouseleave', (e) => {
      this.navEl.hide();
    });
  }

  _optionBind() {
    this.el.on('click', 'a', (e) => {
      var curEl = $(e.currentTarget),
        parent = curEl.parent();

      e.preventDefault();
      if (parent.hasClass('active')) {
        return;
      }

      parent.siblings().removeClass('active');
      parent.addClass('active');
      var index = parent.index();

      this.broadcast('switch:symbol', {
        index: index
      });

    });
  }
}

new ZHeader();