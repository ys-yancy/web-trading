function Drag(el){
	this.el = el;

	this.init.apply(this,arguments);
};
Drag.prototype = {
	constructor:Drag,
	_dom : {},
	_x : 0,
	_y : 0,
	_top :0,
	_left: 0,
	move : false,
	down : false,
	init : function () {
		this.bindEvent();
	},
	bindEvent : function () {
		var self = this;
		this.el.on('mousedown', function(e) {
			e && e.preventDefault();
			if ( !self.move) {
				self.mouseDown(e);
			}
		})
		
		this.el.on('mouseup', function(e) {
			self.mouseUp(e);
		})

		this.el.on('mousemove', function(e) {
			if (self.down) {
				self.mouseMove(e);
			}
		})
	},
	mouseMove : function (e) {
		e && e.preventDefault();
		this.move = true;
		var x = this._x - e.clientX,
			y = this._y - e.clientY;

		this.el.scrollLeft(this._left + x)
		return false;
	},
	mouseUp : function (e) {
		e && e.preventDefault();
		this.move = false;
		this.down = false;
		this.el.css('cursor','');
	},
	mouseDown : function (e) {
		this.move = false;
		this.down = true;
		this._x = e.clientX;
		this._y = e.clientY;

		this._top = this.el.scrollTop();
		this._left = this.el.scrollLeft();
		this.el.css('cursor','pointer');
	}
};

module.exports = Drag;