"use strict";

require('./index.css');
var Base = require('../../../../../../../app/base');
var tmpl = require('./index.ejs.html');
class ChartDesc extends Base {
	constructor(config) {
		super(config)

		this._init();
	}

	_init() {
		this.show();
	}

	_lazyBind() {
		this.referEl.on('mouseleave', () => {
			this.el.hide()
		})

		this.el.on('mouseleave', () => {
			this.el.hide()
		})
	}

	show() {
		this.el = this.renderTo(tmpl, {content: this.content}, $('body'));
		this.setPos();
		this._lazyBind();
	}

	hide() {
		this.el.remove();
	}

	setPos() {
		var position = this.referEl.offset();
		this.el.css({
			top: position.top,
			left: position.left - this.el.width() - 18
		}).show();
	}
}

module.exports = ChartDesc;