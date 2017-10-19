'use strict';
require('./index.css');

var Base = require('../../../../../../../app/base');
var popTmpl = require('./pop.ejs.html');

class PopDialog extends Base {
	constructor(config) {
		super(config);
		this.render();
	}

	render() {
		this.el = this.renderTo(popTmpl, {add: this.add}, document.body);
		this.el.css({
			// width: this.refEl.parent().width() - 155,
			top: this.refEl.offset().top - this.el.height() - 8,
			right: 25
		});
		this.hide();
	}

	hide() {
		setTimeout(() => {
			this.el.hide();
			this.el.remove();
		}, 800)
	}
}

module.exports = PopDialog;