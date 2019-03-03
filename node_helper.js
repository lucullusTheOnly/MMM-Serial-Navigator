var NodeHelper = require("node_helper");
var SerialPort = require("serialport");
const Readline = SerialPort.parsers.Readline;
var serial_listener = null;

module.exports = NodeHelper.create({
  
  start: function() {
    var self = this;
    this.loaded = false;
    //this.initialize();
  },

  initialize: function() {
    var self = this;

    if(serial_listener == null){
      self.serialport = new SerialPort(self.config.serialDev,
      {
        baudRate: self.config.baudrate,
        dataBits: self.config.dataBits,
        parity: self.config.parity,
        stopBits: self.config.stopBits,
        flowControl: self.config.flowControl,
      });
      self.parser = self.serialport.pipe(new Readline());
      console.log('MMM-Serial-Connector, starting listening on '+self.config.serialDev+" with "+self.config.baudrate+" baud");

      serial_listener = self.serialport.on("open",function () {
        self.parser.on('data', function(data) {
          action = data;
          
          if(self.serialCodes.indexOf(action) != -1){
            self.sendSocketNotification(action,{inputtype: ""+action+""});
          }
        });
      });
    }
  },
	
	// Override socketNotificationReceived method.
  socketNotificationReceived: function(notification, payload) {
    switch(notification){
      case 'INITIALIZE':
        this.config = payload.config;
        this.serialCodes = payload.serialCodes;
        this.initialize();
        break;
      case 'WRITE_TO_SERIAL':
        this.serialport.write(payload.data+"\n", function(err) {
          if (err) {
            return console.log('Error on write: ', err.message)
          }
        });
        break;
    }
  }
});
