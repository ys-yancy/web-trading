'use strict';
require('./index.css');
var Base = require('../../../../../app/base');
var tmpl = require('./index.ejs.html');

class About extends Base {
    constructor(config) {
        super(config);
        this._bind();
        this._render();
        this._responsive();
    }

    _bind() {
        this.subscribe('resize:window', this._responsive, this);
    }

    _render() {
        var list = getAboutContent().map((item) => {
            item = item.trim();
            var items = item.split(':');
            return {
                date: items[0],
                content: items[1]
            }
        });
        this.render(tmpl, { list: list }, this.contentEl);
    }

    _responsive() {
        var winHeight = $(window).height();
        var headerHeight = $('header').height();
        $('.bd', '#J_About').height(winHeight - 38 - headerHeight - 10);
    }
}

module.exports = About;