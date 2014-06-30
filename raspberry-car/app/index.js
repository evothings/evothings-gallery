
var ThumbStick = function() {

	this.DIRECTION = {UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3}

	this.canvas = document.getElementById("stage")
	this.context = this.canvas.getContext("2d")

	this.thumbstickImage = new Image()
	this.thumbstickStickImage = new Image()
	this.holderSizePerc = 50 // percent of canvas width
	this.knobSizePerc = 48 // percent of holderSize
	this.inputSize = 20 // percent of holderSize

	this.lastTime = Date.now()

	this.holderSize = Math.round((this.holderSizePerc / 100) * this.canvas.offsetWidth)
	this.knobSize = Math.round((this.knobSizePerc / 100) * this.holderSize)

	this.stick = new Stick((this.inputSize / 100) * this.holderSize)

	this.threshold = 2

	this.directions = []

	this.point = {
		radius: 20,
		speed: 15,
		x: (this.canvas.offsetWidth / 2),
		y: (this.canvas.offsetHeight / 2)
	}

	this.eventNames = [
		'UP', 'STOPUP', 'DOWN', 'STOPDOWN', 'LEFT', 'STOPLEFT',
		'RIGHT', 'STOPRIGHT'
	]
	this.eventListeners = {}

};

ThumbStick.prototype.draw = function() {
	this.context.clearRect(
		0,
		0,
		this.canvas.offsetWidth,
		this.canvas.offsetHeight
	)
	this.drawStick()
};

ThumbStick.prototype.drawStick = function() {
	this.context.save()

	this.context.drawImage(
		this.thumbstickImage,
		0, 0,
		100, 100,
		(this.canvas.offsetWidth / 2) - (this.holderSize / 2),
		(this.canvas.offsetHeight / 2) - (this.holderSize / 2),
		this.holderSize,
		this.holderSize
	)

	this.context.drawImage(
		this.thumbstickStickImage,
		0, 0,
		100, 100,
		(this.canvas.offsetWidth / 2) + (this.stick.input.x - this.stick.limit.x) - (this.knobSize / 2),
		(this.canvas.offsetHeight / 2) + (this.stick.input.y - this.stick.limit.y) - (this.knobSize / 2),
		this.knobSize,
		this.knobSize
	)

	this.context.restore()
};

ThumbStick.prototype.init = function() {
	this.onResizeCanvas()

	ts = this

	$(this.canvas).bind('vmousedown', function(e) {
		e.preventDefault()
		if (!e.touches)
			e.touches = [{pageX: e.pageX, pageY: e.pageY}]
		for (var i = 0; i < e.touches.length; ++i) {
			var touch = e.touches[i]

			ts.stick.setLimitXY(touch.pageX, touch.pageY)
			ts.stick.setInputXY(touch.pageX, touch.pageY)
			ts.stick.active = true
		}
	})

	$(document).bind('vmousemove', function(e) {
		e.preventDefault()
		if (!e.touches)
			e.touches = [{pageX: e.pageX, pageY: e.pageY}]
		for (var i = 0; i < e.touches.length; ++i) {
			var touch = e.touches[i]

			if (ts.stick.active) {
				ts.stick.setInputXY(touch.pageX, touch.pageY)
			}
		}
	})

	$(document).bind('vmouseup', function(e) {
		var touches = e.changedTouches
		if (!touches)
			touches = [{pageX: e.pageX, pageY: e.pageY}]
		for (var i = 0; i < touches.length; ++i) {
			ts.stick.active = false
			ts.stick.setInputXY(ts.stick.limit.x, ts.stick.limit.y)
		}
	})

	ts = this
	ts.thumbstickImage.src = "gfx/thumbstick.svg"
	ts.thumbstickImage.onload = function ()
	{
		ts.thumbstickStickImage.src = "gfx/thumbstick-stick.svg"
		ts.thumbstickStickImage.onload = function()
		{
			setInterval(ts.main.bind(ts), 1)
		};
	};
};

ThumbStick.prototype.onResizeCanvas = function()
{
	var container = $(this.canvas).parent()

	$(this.canvas).attr('width', $(container).width() )
	$(this.canvas).attr('height', $(container).height() )

	this.holderSize = Math.round(
		(this.holderSizePerc / 100) * this.canvas.offsetWidth)
	this.knobSize = Math.round((this.knobSizePerc / 100) * this.holderSize)

	this.stick.setSize((this.inputSize / 100) * this.holderSize)

	this.stick.setLimitXY(
		this.canvas.offsetWidth / 2,
		this.canvas.offsetHeight /2 )

	this.stick.setInputXY(
		this.canvas.offsetWidth / 2,
		this.canvas.offsetHeight / 2 )
};

ThumbStick.prototype.emitChangedDirection = function()
{
	// If any current directions are absent, send for each a stop event.
	for (var dir in this.directions)
	{
		var found = false
		for (var arg in arguments)
			if (arguments[arg] == this.directions[dir]) found = true
		if (!found)
		{
			this.emitEvent('STOP' + this.getDirectionName(this.directions[dir]))
			this.directions.splice(dir, 1)
		}
	}

	// If any new directions are present, send for each a start event.
	for (var i = 0; i < arguments.length; i++)
	{
		if (-1 == this.directions.indexOf(arguments[i]) && arguments[i] != null)
		{
			this.emitEvent(this.getDirectionName(arguments[i]))
			this.directions.push(arguments[i])
		}
	}
};

ThumbStick.prototype.addEventListener = function(eventNames, callback) {
	if (typeof eventNames == 'string')
		eventNames = [eventNames];
	if (typeof eventNames == 'object')
	{
		for (var name in eventNames) {
			if (!(eventNames[name] in this.eventListeners))
				this.eventListeners[eventNames[name]] = []
			this.eventListeners[eventNames[name]].push(callback)
		}
	}
}

ThumbStick.prototype.emitEvent = function(eventName) {
	if (!(eventName in this.eventListeners))
		return false;
	for (var listener in this.eventListeners[eventName])
		this.eventListeners[eventName][listener](eventName)
};

ThumbStick.prototype.getDirectionName = function(direction)
{
	for (var key in this.DIRECTION)
		if (this.DIRECTION[key] == direction)
			return key
	return 'NONE'
};

ThumbStick.prototype.update = function(elapsed)
{
	this.stick.update()

	this.updateDirection(elapsed)

	this.updatePoint(elapsed)
};

ThumbStick.prototype.updateDirection = function(elapsed)
{
	// atan2 works between -pi and + pi
	var angle = Math.atan2(
		-this.stick.normal.y, // y extends downwards so invert it
		this.stick.normal.x
	)

	if (-this.stick.normal.y < 0) angle += 2 * Math.PI
	angle = Math.abs( (angle / (Math.PI * 2)) * 360 )

	if (this.stick.length > 25.0) {

		if (Math.abs(this.stick.normal.x) == 0 && Math.abs(this.stick.normal.y) == 0)
			this.emitChangedDirection(null)
		else if (angle > 65 && angle < 115)
			this.emitChangedDirection(this.DIRECTION.UP)
		else if (angle >= 10 && angle <= 65)
			this.emitChangedDirection(this.DIRECTION.UP,
									  this.DIRECTION.RIGHT)
		else if (angle >= 115 && angle <= 170)
			this.emitChangedDirection(this.DIRECTION.UP,
									  this.DIRECTION.LEFT)
		else if (angle > 170 && angle <= 190)
			this.emitChangedDirection(this.DIRECTION.LEFT)
		else if (angle > 190 && angle <= 245)
			this.emitChangedDirection(this.DIRECTION.DOWN,
									  this.DIRECTION.LEFT)
		else if (angle > 245 && angle < 295)
			this.emitChangedDirection(this.DIRECTION.DOWN)
		else if (angle >= 295 && angle < 350)
			this.emitChangedDirection(this.DIRECTION.DOWN,
									  this.DIRECTION.RIGHT)
		else if (angle < 10 || angle >= 350)
			this.emitChangedDirection(this.DIRECTION.RIGHT)
		else 
			this.emitChangedDirection(null)

	}else if (this.stick.length == 0) {

		this.emitChangedDirection(null)

	}
};

ThumbStick.prototype.updatePoint = function(elapsed) {
	if (!this.stick.active || (this.stick.length < this.threshold))
		return;

	this.point.x += (
		(this.stick.length * this.stick.normal.x)
		* this.point.speed
		* (elapsed / 1000)
	)
	this.point.y += (
		(this.stick.length * this.stick.normal.y)
		* this.point.speed
		* (elapsed / 1000)
	)

	if (this.point.x < this.point.radius)
		this.point.x = this.point.radius
	else if (this.point.x > (this.canvas.offsetWidth - this.point.radius))
		this.point.x = (this.canvas.offsetWidth - this.point.radius)

	if (this.point.y < this.point.radius)
		this.point.y = this.point.radius
	else if (this.point.y > (this.canvas.offsetHeight - this.point.radius))
		this.point.y = (this.canvas.offsetHeight - this.point.radius)
};

ThumbStick.prototype.main = function() {
	var now = Date.now()
	var elapsed = (now - this.lastTime)

	this.update(elapsed)
	this.draw()

	this.lastTime = now
};
