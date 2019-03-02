var locked = false;
var vconfirm = 0;

Module.register("MMM-Serial-Navigator", {
  defaults: {
    menuTimeout: 5000,
    serialDev: '/dev/ttyUSB0',
    baudrate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    flowControl: false,
    serialCodes:[ "CW", "CCW", "BTN2", "SW", "BTN1" ]
  },

	getStyles: function() {
    return [
      this.file('MMM-Serial-Navigator.css'), //load css
    ];
  },

  hideAfterTimeout: function(){
    var self = this;
    self.config.activeTimeoutID = self.config.activeTimeoutID + 1;
    var currentTimeoutID = self.config.activeTimeoutID;
    setTimeout(function() {
      if(self.config.activeTimeoutID == currentTimeoutID){
        self.hide(10, { lockString: "MMM-Serial-Navigator" });
      }
    }, self.config.menuTimeout);
  },

  sendAction: function(description) {
    this.show(0,{force: true, lockString: "MMM-Serial-Navigator" });

    if((description.payload.action == "SHUTDOWN"
					|| description.payload.action == "RESTART"
					|| description.payload.action == "REBOOT")
				&& (vconfirm==0)){
    	vconfirm = 1;
      this.sendNotification("SHOW_ALERT",{type:"notification",message:"Ausführen von "+ description.payload.action +" bitte durch 2.Klick bestätigen"});
    }else{
      vconfirm = 0;
      this.sendNotification(description.notification, description.payload);
    }
  },

  start: function() {
    Log.info("Starting module: " + this.name);
    this.config.current_status = "DESCRIPTION";
    this.sendSocketNotification("INITIALIZE", {
      config: this.config
    });
    this.config.activeTimeoutID = 0;
  },

	// Override dom generator.
  getDom: function() {
    //Div for loading
    if (this.loading) {
      var loading = document.createElement("div");
        loading.innerHTML = this.translate("LOADING");
        loading.className = "dimmed light small";
        wrapper.appendChild(loading);
      return wrapper;
    }

    var self = this;//makes variables usable in functions

    //Div after loading
    var parent = document.createElement("div");
        parent.className = "xsmall bright";

    //build navigation from array
    for (let index = 0; index < this.config.Action.length; index++) {
      var naviItem = document.createElement("li");
      var link = document.createElement('a');
      link.setAttribute('href', '');
      link.innerHTML = this.config.Alias[index];
      naviItem.setAttribute('id', index);
      if(index==0){ //first li gets class="selected"
        naviItem.setAttribute('class', 'selected');
      }
      naviItem.appendChild(link);
      parent.appendChild(naviItem);
    }
    return parent;
  },

	naviaction: function(payload){
    var self = this;
    if(self.config.serialCodes.indexOf(payload.inputtype) != -1){
    //if(payload.inputtype === 'CW' || payload.inputtype === 'CCW' || payload.inputtype === 'PRESSED' || payload.inputtype === 'SW'){
      navigationmove(payload.inputtype);
      self.hideAfterTimeout();
    }

    function fselectedid(){//get ID and return it
      for (let index = 0; index < self.config.Action.length; index++) {
        var test = document.getElementsByTagName('li')[index].getAttribute('class');

        if(test=='selected' || test=='selected locked' || test=='selected locked fa-lock1'){//axled lock icon
          var selectedid = document.getElementsByTagName('li')[index].getAttribute('id');
          return selectedid;
        }
      }
    }
				
    function navigationmove(input){
      self.show(0, {lockString: "MMM-Serial-Navigator"});
      selectedid = fselectedid();
      if(input===self.config.serialCodes[0] || input===self.config.serialCodes[1]){
        vconfirm = 0;

        if(input===self.config.serialCodes[0]){
          navistep = 1;
          actionstep = 0;
        }else if(input===self.config.serialCodes[1]){
          navistep = -1;
          actionstep = 1;
        }

        if(locked==true){
          self.sendAction(self.config.Action[selectedid][parseInt(actionstep)]);
        }else if(locked==false){
          document.getElementsByTagName('li')[selectedid].setAttribute('class', '');//CW&CCW
          if(selectedid==0 && input===self.config.serialCodes[0]){//mark next row
            document.getElementsByTagName('li')[parseInt(selectedid)+1].setAttribute('class', 'selected');//CW
          }else if(selectedid==0 && input===self.config.serialCodes[1]){//mark last row
            document.getElementsByTagName('li')[self.config.Action.length-1].setAttribute('class', 'selected');//CCW
          }else if(selectedid==self.config.Action.length-1 && input===self.config.serialCodes[0]){//mark first row
            document.getElementsByTagName('li')[0].setAttribute('class', 'selected');//CW
          }else if(selectedid==self.config.Action.length-1 && input===self.config.serialCodes[1]){//mark prev row
            document.getElementsByTagName('li')[parseInt(selectedid)-1].setAttribute('class', 'selected');//CCW
          }else{//mark next one in selected direction
            document.getElementsByTagName('li')[parseInt(selectedid)+navistep].setAttribute('class', 'selected');
          }
        }
      }else if(input === self.config.serialCodes[2]){
        if(locked==false){//Menu not locked so ... (see below)
          if(Array.isArray(self.config.Action[selectedid])){//if selected entry Action is array - lock it
            locked = true;
            document.getElementsByTagName('li')[selectedid].setAttribute('class', 'selected locked fa-lock1');//axled lock icon
          }else{//if selected entry Action is object - so there is nothing to lock - execute it
            self.show(0,{force: true, lockString: "MMM-Serial-Navigator"});
            self.sendAction(self.config.Action[selectedid]);
          }
        }else{//Menu locked so unlock it
          locked = false;
          document.getElementsByTagName('li')[selectedid].setAttribute('class', 'selected');
        }
      /*} else if(input === 'SW'){
        if(locked==true){
          if(self.config.Action[selectedid].length >= 3){
            self.sendAction(self.config.Action[selectedid][2]);
          }
        }
      }*/
      } else {
        if(locked==true){
          var index = self.config.serialCodes.indexOf(input);
          if(index > 1) index--;
          Log.log("code: "+input+"("+index+") / "+self.config.Action[selectedid].length);
          if(index < self.config.Action[selectedid].length){
            self.sendAction(self.config.Action[selectedid][index]);
          }
        }
      }
    }

    return parent;
  },

  // socketNotificationReceived from helper
  socketNotificationReceived: function (notification, payload) {
    Log.info("SocketNOtification: " + notification);
    if(this.config.serialCodes.indexOf(notification) != -1){
      this.naviaction({inputtype: notification});
    }
    /*if(notification === 'BTN2'){
      this.naviaction({inputtype: "PRESSED"});
    } else if(notification === 'CW'){
      this.naviaction({inputtype: "CW"});
    } else if(notification === 'CCW'){
      this.naviaction({inputtype: "CCW"});
    } else if(notification === 'SW'){
      this.naviaction({inputtype: "SW"});
    }*/
  },

  notificationReceived: function(notification, payload, sender){
    //Log.info("############### Serial Connector got notification: " + notification+" by sender " + sender);
    if(notification === 'DOM_OBJECTS_CREATED'){
      this.hide(10, { lockString: "MMM-Serial-Navigator" });
    }
  },
});
