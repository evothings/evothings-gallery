//
// Copyright 2014, Aaron Ardiri
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// evothings client - car control (BLE)
//                                               version: 1.0 - 15.07.2014

// route all console logs to Evothings studio log
if (window.hyper) { console.log = hyper.log; }

// 
// cordova entrypoint
// 

document.addEventListener('deviceready',function(){ app.initialize() }, false);

//
// application 
//

var app = {};
app.ID_SERVICE = '713d0000-503e-4c75-ba94-3148f18d941e'; // UUID
app.ID_CHARACT = '713d0003-503e-4c75-ba94-3148f18d941e'; // UUID
app.ID_NAME = 'carcontrol';

app.initialize = function()
{
	// application state: no connection, no device
	app.connected = false;
	app.connected_lost = false;
	app.interval = null;

	// create our thumbstick
	app.thumbStick = new ThumbStick('stage');
	app.thumbStick.init();
	app.thumbStick.onUpdate = 
		function()
		{
			// calibrate to -127 .. 127 from raw data of thumbstick
			var val = app.thumbStick.stick;
			app.controlX = Math.round(-((val.length*val.normal.x)/val.maxLength)*127);
			app.controlY = Math.round(-((val.length*val.normal.y)/val.maxLength)*127);
		};

	// make sure the thumbstick is bound
	$(window).resize(app.thumbStick.onResizeCanvas.bind(app.thumbStick));

	// inform the user they should search for a BLE device
	app.showInfo('start the car control and tap start');
}

app.showInfo = function(info)
{
	// display something to the user and console log
	console.log(info)
	document.getElementById('info').innerHTML = info;
};

app.deviceIsCarControl = function(device)
{
	// the name is defined within the arduino code
	return ((device != null) && (device.name != null) &&
					(device.name.indexOf(app.ID_NAME) > -1));
};

app.onStartButton = function(user)
{
	// shutdown old state
	app.onStopButton(user);

	function onScanSuccess(device)
	{
		function onConnectSuccess(device)
		{
		 	// define some callbacks for our next routine
			function onServiceSuccess(device)
			{
				// show a message to the user
				app.showInfo('connect: service success');

				// the application is now connected
				app.connected = true;
				app.connected_lost = false;
				app.device = device;

				// setup an interval timer to periocally send information over BLE
				app.interval = 
					setInterval(function() { app.sendDataPeriodically(); }, 50);
			};

			function onServiceFailure(errorCode)
			{
				// show an error to the user
				app.showInfo('connect: error reading services: ' + errorCode);
			};

			// connect to the appropriate BLE service
			device.readServices([ app.ID_SERVICE ], onServiceSuccess, onServiceFailure);
		};

		function onConnectFailure(errorCode)
		{
			app.showInfo('connect: error: ' + errorCode);
		};

		// connect if we have found our car control device
		if (app.deviceIsCarControl(device))
		{
			// inform user, stop looking
			app.showInfo('scanning: found "' + device.name + '"');
			easyble.stopScan();

			// connect to our device
			app.showInfo('connect: identifying service for communication');
			device.connect(onConnectSuccess, onConnectFailure);
		};
	};

	function onScanFailure(errorCode)
	{
		// inform user of error, stop looking
		app.showInfo('scanning: error: ' + errorCode);
		easyble.stopScan();
	};

	// inform user that we are starting
	app.showInfo('starting scan');
	easyble.startScan(onScanSuccess, onScanFailure); 
};

app.onStopButton = function(user)
{
	// when called from user, stop trying to reconnect
	if (user) app.connected_lost = false;

	if (app.interval) clearInterval(app.interval);
	app.connected = false;
	app.device = null;

	// stop any ongoing scan and close devices.
	easyble.stopScan();
	easyble.closeConnectedDevices();

	app.showInfo('stopped');
};

// send the thrust & steering data to the car control BLE device.
app.sendDataPeriodically = function()
{
	function onDataSendSuccess()
	{
	};

	function onDataSendFailure(errorCode)
	{
		// inform the user that the connection has been lost
		app.showInfo('lost connection');

		// flag that we have lost connection, try to re-connect in a second
		app.connected_lost = true;
		app.checkConnectionState();
	};

	// only send information if we are actually connected
	if (app.connected)
	{
		// show some information to the user
		app.showInfo('sending data [ -128, ' + app.controlX + ', ' + app.controlY + ']');

		// write a packet of information to the service
		var packet = new Uint8Array([-128, app.controlX, app.controlY]);
		app.device.writeCharacteristic(
			app.ID_CHARACT, packet, onDataSendSuccess, onDataSendFailure
		);
	};
};

// connection status check when possible out of range
app.checkConnectionState = function()
{
	// if we have lost the connection, we can attempt to re-scan every second
	if (app.connected_lost)
	{
		// we may be out of range for BLE, try to connect again 
		app.onStartButton(false);
		setTimeout(app.checkConnectionState, 1000);
	}
};
