// JavaScript code for the BLE TI SensorTag example app.

// Object that holds application data and functions.
var app = {};

// Data that is plotted on the canvas.
app.dataPoints = [];

app.connected = false;

app.device = null;

// Initialise the application.
app.initialize = function()
{
	document.addEventListener('deviceready', app.onDeviceReady, false);
};

app.onDeviceReady = function()
{
	app.showInfo('Start the BLE Shield and tap Start');
};

app.showInfo = function(info)
{
	console.log(info)
	document.getElementById('info').innerHTML = info;
};

app.onStartButton = function()
{
	app.onStopButton();
	app.startScan();
	app.showInfo('Starting');
};

app.onStopButton = function()
{
	// Stop any ongoing scan and close devices.
	easyble.stopScan();
	easyble.closeConnectedDevices();
	app.showInfo('Stopped');
};

app.startScan = function()
{
	easyble.closeConnectedDevices();
	easyble.startScan(
		function(device)
		{
			// Connect if we have found a sensor tag.
			if (app.deviceIsBLEShield(device))
			{
				app.showInfo('Device found: ' + device.name);
				easyble.stopScan();
				app.connectToDevice(device);
			}
		},
		function(errorCode)
		{
			app.showInfo('startScan error: ' + errorCode);
			app.startScan()
			//app.reset();
		});
};

app.deviceIsBLEShield = function(device)
{
	return (device != null) &&
		(device.name != null) &&
		(device.name.indexOf('control') > -1);
};

// Read services for a device.
app.connectToDevice = function(device)
{
	device.connect(
		function(device)
		{
			app.showInfo('Connected - reading BLE Shield services');
			app.device = device;
			app.readServices(device);
			//app.startMagnetometerNotification(device)
		},
		function(errorCode)
		{
			app.showInfo('Connect error: ' + errorCode);
			evothings.ble.reset();
			// This can cause an infinite loop...
			//app.connectToDevice(device);
		});
};

app.readServices = function(device)
{
	device.readServices(
		[
		'713d0000-503e-4c75-ba94-3148f18d941e' // BLE Shield service UUID.
		],
		app.sendData,
		function(errorCode)
		{
			console.log('Error reading services: ' + errorCode);
		});
};

// Send the thrust & steering data to the connected BLE Shield.
app.sendData = function(device)
{
	app.connected = true;
	//app.showInfo('Sending notification');

	// Set magnetometer to ON.
	device.writeCharacteristic(
		'713d0003-503e-4c75-ba94-3148f18d941e',
		new Uint8Array([-128, controlX, controlY]),
		function()
		{
			//console.log('send data ok');
		},
		function(errorCode)
		{
			console.log('send data error: ' + errorCode);
		});
};

// Initialize the app.
app.initialize();
