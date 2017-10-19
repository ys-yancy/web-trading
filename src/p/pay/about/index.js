"use strict";

var Base = require('../../../app/base');
var Header = require('../../../common/header');

class About extends Base {
    constructor() {
        super();

        new Header();
        
        $('.logo-link').attr("href", getHomeUrl());
        $('.company-name').text(getCompanyName());
        $('.avatar-img').attr('src', getDefaultAvatarUrl());
        $('.statement-content-inner').html(getStatementContent());
        $('.view-bank').attr("href", getBankListHref());
    }
}

new About();