'use strict';


var Base = require('../../../app/base');
var Util = require('../../../common/pagination');
var ZHeader = require('../../../common/zHeader');

class NewsList extends Base {
    constructor() {
        super();

        $('#J_Page').pagination({
            items: 100,
            itemsOnPage: 10,
            cssStyle: 'light-theme',
            prevText: '&#xe602;',
            nextText: '&#xe601;'
        });
    }


    _bind() {
        var doc = $(document);


    }
}

new NewsList();