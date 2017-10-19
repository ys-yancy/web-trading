/**
 * 经济日历
 */
"use strict";

require('./index.css');
var Base = require('../../../../../app/base');
var Util = require('../../../../../app/util');
var Config = require('../../../../../app/config');
// var FullDate = require('./fullDate');
var tmpl = require('./index.ejs.html');
var filterTmpl = require('./tmpl/index.ejs.html');
var listTmpl = require('./list.ejs.html');

class Calendar extends Base {
    constructor(config) {
        super(config);
        this.init();
    }

    init() {
        this._bind();
        this._initAttrs();
        this._getData();
        this._responsive();
    }

    _bind() {
        this.subscribe('resize:window', this._responsive, this);
        this.subscribe('calendar:scrollTop', this.scroll, this);

        this.contentEl.on('click', '.J_Filter', _.bind(this._switch, this));
        this.contentEl.on('click', '.J_FullDate', _.bind(this._fullDate, this));

        this.contentEl.on('click', '.J_Choose', _.bind(this._choose, this));
        this.contentEl.on('click', '.J_Cancel', _.bind(this._cancel, this));

        this.contentEl.on('click', '.J_FilterAction', _.bind(this._actions, this));

        this.contentEl.on('click', '.J_WeekBefore', _.bind(this._loadWeekBefore, this));
        this.contentEl.on('click', '.J_WeekAfter', _.bind(this._loadWeekAfter, this));
        this.contentEl.on('click', '.J_CurWeek', _.bind(this._scroll, this));
        this.contentEl.on('click', '.J_PubUpdate', _.bind(this._update, this))
    }

    _lazyBind() {
        this.bdEl.on('scroll', _.bind(this._resetPosition, this));
    }

    _switch(e) {
        var curEl = $(e.target);
        var index = curEl.index();
        this._toggle(curEl, index);
    }

    _actions(e) {
        var curEl = $(e.target);
        var activeEl = $('.active', this.filterCalendarEl);

        var filterFrom = curEl.attr('data-filter');

        this._getData(filterFrom);

        this._toggle(activeEl);
    }

    _getData(filterFrom, isChangeBg) {
        var params = this._getParams(filterFrom);

        this.ajax({
            url: 'http://apitest.invhero.com/v1/calendar/list/',
            type: 'GET',
            data: params,
            unjoin: true
        }).then((data) => {
            data = data.data;

            var oldWeek = 0,
                hasValue,
                newDateIndex, 
                list = [];

            for ( var j = data.length - 1; j >= 0; j-- ) {
                if (hasValue && !data[j].currentValue && Math.abs(params.weekend) != 1) {
                    data[j].updateValue = true;
                }

                if ( !hasValue && data[j].currentValue && Math.abs(params.weekend) != 1 ) {
                    hasValue = true;
                    data[j].noValue = true;
                    newDateIndex = i;
                } 
            }
            for ( var i = 0, len = data.length; i < len; i++ ) {
                if (data[i].weekend > oldWeek) {
                    var times = [...data[i].time];
                    var day = ''+ times[8] + times[9],
                        mouth = ''+ times[5] + times[6];
                    list.push({
                        nextWeek: true,
                        mouth: `${mouth}月${day}日`,
                        day: `${this.weekObj[data[i].weekend]}`
                    })
                };

                list.push(data[i]);
                oldWeek = data[i].weekend;
            }

            this.list = list;

            this.render(listTmpl, {data: list}, this.listWrapEl);
            $('.no-value').addClass('bottom-border');
            if ( isChangeBg ) {
                this.bdEl.scrollTop(0);
                return;
            }

            this._changeCurElBg(newDateIndex);   
        })
    }

    _update(e) {
        var curEl = $(e.target);
        curEl.addClass('update');
        var id = curEl.attr('data-id');

        this.params.id = id;
        this.ajax({
            url: 'http://apitest.invhero.com/v1/calendar/list/',
            type: 'GET',
            data: this.params,
            unjoin: true
        }).then((data) => {
            data = data.data[0];
            var currentValue = data.currentValue;
            if ( currentValue ) {
                this._resetCurValue(curEl, currentValue, true);
            } else {
                this._resetCurValue(curEl, currentValue, false);
            }

            this.params.id = '';

        }, function() {
           this._resetCurValue(curEl, currentValue, false);
           this.params.id = '';
        })
    }

    _resetCurValue(curEl, currentValue, isSuccess) {
        setTimeout(() => {
            if (isSuccess) {
                curEl.removeClass('update btn J_PubUpdate').addClass('num J_Pub');
                curEl.text(currentValue); 
                return;
            }
            curEl.removeClass('update');
        }, 500)
    }

    _loadWeekBefore(e) {
        var curEl = $(e.target);
        this._loadWeekControls(curEl, false);
    }

    _loadWeekAfter(e) {
        var curEl = $(e.target);
        this._loadWeekControls(curEl, true);
    }

    _loadWeekControls(curEl, isNext) {
        var curWeekEl = $('.J_CurWeek'),
            curWeek = curWeekEl.html(),
            index = this.weeks.indexOf(curWeek),
            prevText,
            weekend;

        if (isNext) {  
            prevText = this.weeks[index + 1];
        } else {
            prevText = this.weeks[index - 1];
        }
        if ( !prevText ) {
            return;
        }


        weekend = this.weeks.indexOf(prevText) - 1;
        this.params.weekend = weekend;
        this._getData(this.params, true);
        curWeekEl.html(prevText);
        curWeekEl.parent('.J_Week').removeClass('active');
    }

    _choose() {
        var constrolBdEl = $('.constrol-bd');
        var checkEls = $('.J_Check', constrolBdEl);
        checkEls.prop("checked", true); 
    }

    _cancel() {
        var constrolBdEl = $('.constrol-bd');
        var checkEls = $('.J_Check', constrolBdEl);
        checkEls.prop("checked", false); 
    }

    _fullDate(e) {
        var curEl = $(e.target);

        if (curEl.hasClass('active')) {
            curEl.siblings('.item').removeClass('active');
            curEl.removeClass('active');
            this.fullDate.toggleFullDate(false, this.list);
            return;
        }

        this.fullDate.toggleFullDate(true, this.list);
        curEl.siblings('.item').removeClass('active');
        curEl.addClass('active');
    }

    _getParams(filterFrom) {
        if( filterFrom == 'country' ) {
           var weightEls = $('.J_Weight:checked', this.contentEl);
           var countryEls = $('.J_Check:checked', this.contentEl);
           var weightparams = [];
           for ( var i = 0, len = weightEls.length; i < len; i++ ) {
                weightparams.push($(weightEls[i]).val());
           }

           var countryNames = [];
           for ( var j = 0, len = countryEls.length; j < len; j++ ) {
                countryNames.push($(countryEls[j]).val())
           }

           this.params.weightiness = weightparams.toString();
           this.params.countryName = countryNames.toString();
        }

        return this.params;
    }

    _toggle(curEl, index) {
        if ( curEl.hasClass('active') ) {
            curEl.siblings().removeClass('active');
            curEl.removeClass('active');
            this.filterWrapEls.hide();
            return;
        } 

        curEl.siblings().removeClass('active');
        curEl.addClass('active');
        this.filterWrapEls.hide();
        $(this.filterWrapEls[index]).show();
    }

    scroll(curEl) {
        if (Math.abs(this.params.weekend) !== 1) {
            var curvalueEl = $('.no-value', this.listWrapEl).prev(),
                parentEl = $('.J_CurWeek').parent('.J_Week');

            parentEl.removeClass('active');
            $('.J_CurWeek').trigger('click');
        }
    }

    _scroll(e) {
        var curEl = $(e.target),
            parentEl = curEl.parent('.J_Week'),
            moveEl = $('.no-value', this.listWrapEl),
            headEl = $('thead', this.contentEl);

        var movePosition = moveEl.offset();
        var hdPosition = headEl.offset();

        $('.paddingEl', this.contentEl).height(this.bdEl.height() - headEl.height())

        parentEl.siblings().removeClass('active'); 

        if(curEl && parentEl.hasClass('active')) {
            parentEl.removeClass('active');
            this.bdEl.scrollTop(0);
            return;
        }

        parentEl.addClass('active');

        if (moveEl.length > 0 && moveEl.prev().length > 0) {
            var scrollTop = movePosition.top + this.bdEl.scrollTop() - hdPosition.top - headEl.height();
            moveEl.addClass('bottom-border');
            this.bdEl.scrollTop(scrollTop);
        }
       
    }

    _changeCurElBg(newDateIndex) {
        if (this.noValueIndex != newDateIndex) {
            var curvalueEl = $('.no-value', this.listWrapEl);
            curvalueEl.addClass('cur-value bottom-border');
            this.noValueIndex = newDateIndex;
            setTimeout(() => {
                curvalueEl.removeClass('cur-value');
            }, 1500)
        }
    }

    _resetPosition() {
        var el = $('.J_CurWeek').parent('.J_Week');
        if ( el.hasClass('active') ) {
            el.removeClass('active');
        }
    }

    _setInterval() {
        clearTimeout(this.setControls);
        this.setControls = setTimeout(() => {
            this._getData();
            this._setInterval();
        }, Config.getCalendarUpdateTime())
    }

    destroy() {
        console.log('destroy:calendar');
        clearTimeout(this.setControls);
    }

    rebuild() {
        console.log('rebuild:calendar');
        this._setInterval(); 
    }

    _responsive() {
        var winHeight = $(window).height();
        var headerHeight = $('header').height();
        this.bdEl.height(winHeight - headerHeight - 91); // 多减1px   solid
    }

    _initAttrs() {
        this.render(tmpl, {}, this.contentEl);
        this.render(filterTmpl, {}, $('.J_FilterControls'));
        this.filterCalendarEl = $('.J_FilterCalendar', this.contentEl);
        this.filterWrapEls = $('.J_FilterWrap', this.contentEl);
        this.listWrapEl = $('.J_List', this.contentEl);
        this.bdEl = $('.bd', '#J_Calendar');
        // this.fullDate = new FullDate({parent: this});
    }

    defaults() {
        return {
            noValueIndex: '',
            weeks: ['上一周', '本周', '下一周'],
            weekObj: {
                '1': '一',
                '2': '二',
                '3': '三',
                '4': '四',
                '5': '五',
                '6': '六',
                '7': '日'
            },
            params: {
                id: '',
                weekend: '',
                weightiness: '',
                dataTypeName: '',
                countryName: ''
            }
        }
    }
    
}

module.exports = Calendar;