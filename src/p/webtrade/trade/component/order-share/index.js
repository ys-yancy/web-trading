/**
 * 订单分享
 */

'use strict';

require('./index.css');
var app = require('../../../../../app');
var Base = require('../../../../../app/base');
var qrcode = require('../../../../../lib/jquery.qrcode-0.12.0');
var tmpl = require('./index.ejs.html');

export default class OrderDetail extends Base {
  constructor(config) {
    super(config);

    this._bind();
  }

  _bind() {
    var doc = $(document);
    this.subscribe('update:orderShare', this.update, this);
    
    doc.on('click', '.J_Close', _.bind(this.close, this));
  }

  /**
   * 更新需要分享的订单
   */
  update(order) {
    this.destroy();
    this.el = this.renderTo(tmpl, {shareUrl: 'w.invhero.com'}, $('body'));
    this._createQRCode();
  }

  close() {
    this.destroy();
  }

  destroy() {
    this.el && this.el.remove();
  }

  _createQRCode(text, typeNumber, errorCorrectLevel) {
    var qrcodeWrapEl = $('.qrcode', this.el);
    qrcodeWrapEl.qrcode({
      render  : "image",
      text    : getMobileRegisterLink(),
      size    : 205
    });
  }
}