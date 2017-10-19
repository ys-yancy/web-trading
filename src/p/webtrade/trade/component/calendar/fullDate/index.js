"use strict";

require('./index.css');
var Base = require('../../../../../../app/base');
var tmpl = require('./index.ejs.html');

class FullDate extends Base {
	constructor(config) {
		super(config);
		this._bind();
	}

	_bind() {
	}

	_update(data) {
		// var list = this._sort(data);
		// this.render(tmpl, {list:list}, $('body'));
	}

	_destroy() {

	}

	_sort(data) {
		
	}

	toggleFullDate(isShow, data) {
		data  = data || null;
		if (isShow) {
			this._update(data);
		} else {
			this._destroy();
		}

	}
}

module.exports = FullDate;