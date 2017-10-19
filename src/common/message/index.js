'use strict';

require('./index.css');
var Base = require('../../app/base');
// var tmpl = require('./index.ejs.html');
var tmpl = require('./newMessage.ejs.html');

export default class Message extends Base {
  constructor(config) {
    super(config);


    this.disappearTime = this.disappearTime || 1500;

    this._render();
    this._bind();
  }

  _bind() {
    this.el.on('click', '.J_Close', (e) => {
      this.hide();
    });
  }

  _render() {

    this.show();
    if (this.disappearTime) {
      this.timer = setTimeout(() => {
        this.hide();
      }, this.disappearTime);
    }
  }

  show() {
    var infoCon, toastCon;

    if (this.timer) {
      clearTimeout(this.timer);
    }

    var data = this[this.type];
    data.message = this.message;

    var html = tmpl({
      data: data
    });
    var el = $(html);
    $(document.body).append(el);

    this.el = el;
  }

  hide() {
    if (this.el) {
      $(this.el).remove();
    }
  }

  defaults() {
    return {
      type: 'error',
      message: '',
      success: {
        title: '操作完成',
        className: 'success'
      },

      warn: {
        title: '警告',
        className: 'warn'
      },

      error: {
        title: '错误',
        className: ''
      }
    }
  }
}