'use strict';

require('./index.css');

var Base = require('../../../../../../app/base');
// var dialog = require('../../../../../../common/dialog');
// var tmpl = require('./guadan.ejs.html');
// var closeTmpl = require('./index.ejs.html');
var popTmpl = require('./pop.ejs.html');


export default class Dialog extends Base {
  constructor(config) {
    super(config);

    this._render();

    this._bind();
  }

  _bind() {

    // this.el.on('click', '.J_Radio', (e) => {
    //   var curEl = $(e.currentTarget);

    //   curEl.toggleClass('active');
    //   if (curEl.hasClass('active')) {
    //     // app.oneKeyDel(true);
    //     this.oneKeyDel = true;
    //   } else {
    //     this.oneKeyDel = false;
    //     // app.oneKeyDel(false);
    //   }
    // });

    this.el.on('click', '.J_Close', (e) => {
      this.close();
    });
    this.el.on('click', '.J_Confirm', (e) => {
      this.fire('confirm', {
        oneKeyDel: this.oneKeyDel
      });
    });

    this.listEl.on('scroll', (e) => {
      this.destroy();
    });

    this._triggerEvent();
  }

  unbind() {
    this.el.off('click', '.J_Close');
    this.el.off('click', '.J_Confirm');
    this.listEl.off('scroll');
  }

  _render() {
    this.el = this.render(popTmpl);
    // this.el.hide();
    $('body').append(this.el);

    this.el.css({
      top: this.referEl.offset().top - this.el.height() - 20,
      left: this.referEl.offset().left - this.el.width() + this.referEl.width()
    });

    this._triggerEvent();
    // if (this.type == 'close') {
    //   var content = this.render(closeTmpl, this.order);
    // } else {
    //   var content = this.render(tmpl, this.order);
    // }

    // vex.open({
    //   content: content,
    //   afterOpen: ($vexContent) => {
    //     this.el = $vexContent;

    //     this._bind();
    //   },
    //   afterClose: function() {
    //     // return console.log('vexClose');
    //   },
    //   showCloseButton: false,
    //   contentClassName: 'vex-order ' + this.className
    //     // showConfirmButton: true
    // });
  }

  _triggerEvent() {
    this.fire('confirm', {
      oneKeyDel: this.oneKeyDel
    });
  }

  close() {
    // vex.close(this.el.data().vex.id);
    this.el.hide();

    setTimeout(() => {
      this.el.remove();
    }, 500);
  }

  destroy() {
    this.close();
    this.unbind();
  }

  defaults() {
    return {
      className: '',
      listEl: $('#J_List')
    }
  }
}