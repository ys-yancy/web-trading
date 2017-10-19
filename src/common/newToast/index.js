'use strict';
require('./index.css');

var Base = require('../../app/base');
var tmpl = require('./index.ejs.html');

class NewToast extends Base {
	constructor(config) {
		super(config);
		this.render();
	}

	render() {
		var position = this.refEl.offset();
		this.el = this.renderTo(tmpl, {message:this.message}, document.body);
		this.el.css({
			// width: this.refEl.parent().width() - 155,
			top: this.refEl.offset().top - this.el.height() - 8,
			left: position.left + 14
		});
		this.hide();
	}

	hide() {
		setTimeout(() => {
			this.el.hide();
			this.el.remove();
		}, 1500)
	}
}

module.exports = NewToast;