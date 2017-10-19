'use strict';

var Core = require('../../../../../../app/core');
var Util = require('../../../../../../app/util');
// var InfinityScroll = require('../../../../../../common/infinite-scroll');
var tmpl = require('./index.ejs.html');
var itemTmpl = require('./item.ejs.html');
require('./index.css');

export default class Category extends Core {
  constructor(config) {
    super(config);

    this.renderTo(tmpl, {}, $(document.body));
    this.el = $('#J_Manage');
    this.contentEl = $('#J_ManageContainer');

    var winHeight = $(window).height();
    var hdHeight = $('.hd', this.el).height();
    this.el.height(winHeight);

    this.contentEl.css({
      'max-height': winHeight - hdHeight,
      'overflow': 'scroll'
    });
    this.contentEl.css({
      'max-height': winHeight - hdHeight,
      'overflow': 'scroll'
    });

    this._bind();


    // this._getCat();
  }

  _bind() {
    this.el.on('click', '.J_Del', (e) => {
      var curEl = $(e.currentTarget);
      var symbol = curEl.attr('data-symbol');

      this.parent.del(symbol).then(() => {
        curEl.parent().parent().remove();
      })
    });

    this.el.on('click', '.J_Up', (e) => {
      this.change = true;
      this._upSymbol(e);
    });

    this.el.on('click', '.close', (e) => {
      this.change = true;
      this.hide();
    })
  }

  sortUp(data) {
    var type = this.isDemo() ? 'demo' : 'real';
    var symbols = this._getCookieSymbols();

    var arr = [];

    for (var i = 0, len = symbols.length; i < len; i++) {
      var quote = get(symbols[i], data);
      if (quote) {
        arr.push(quote);
      }
    }
 
    return arr.concat(data)


    function get(symbol, data) {
      for (var i = 0, len = data.length; i < len; i++) {
        if (data[i].policy.symbol === symbol) {
          var tmp = data[i];
          data.splice(i, 1);

          return tmp;
        }
      }
    }
  }

  _upSymbol(e) {
    var curEl = $(e.currentTarget),
      symbol = curEl.attr('data-symbol');

    e.stopPropagation();
    e.preventDefault();

    var symbols = this._getCookieSymbols();
    var index = symbols.indexOf(symbol);

    if (index === -1) {
      symbols = [symbol].concat(symbols);
    } else {
      var tmp = symbols[index];
      symbols[index] = symbols[0];
      symbols[0] = tmp;
    }


    console.log(symbols)
    this._setCookieSymbols(symbols);


    var itemEl = curEl.parent().parent();
    var itemFristEl = $($('.cat-item', this.el)[0]);
    itemEl.insertBefore(itemFristEl);
    // $('.link', itemEl).trigger('swipeRight');
  }

  _getCookieSymbols() {
    var type = this.isDemo() ? 'demo' : 'real';
    var name = type + 'symboyup';
    var symbols = JSON.parse(Cookie.get(name) || '[]');

    return symbols;
  }

  _setCookieSymbols(symbols) {
    var type = this.isDemo() ? 'demo' : 'real';
    var name = type + 'symboyup';

    Cookie.set(name, JSON.stringify(symbols));
  }

  _render() {
    this.getList().then((list) => {
      this.sortUp(this.list);
      this.render(itemTmpl, list, this.contentEl);
    })
  }

  getList() {
    if (this.list) {
      return Promise.resolve(this.list);
    }

    return this.parent.getData()
  }

  show() {
    this._render();
    this.el.show()
  }

  hide() {
    this.parent.update();
    this.el.hide();
  }

}
