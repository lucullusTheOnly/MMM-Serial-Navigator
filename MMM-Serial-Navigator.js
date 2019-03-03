var locked = false;
var vconfirm = 0;

Module.register("MMM-Serial-Navigator", {
  defaults: {
    hideMenu: false,
    menuTimeout: 5000,
    serialDev: '/dev/ttyUSB0',
    baudrate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    flowControl: false,
    serialCodes:[ "CW", "CCW", "SW", "BTN1" ],
    states: [
      'Change Profile',
      'News Feed',
      'Test notification',
      'Restart MagicMirror (PM2)',
      'Restart',
      'Shutdown'
    ],
    actions: [
      {
        serialCode: "CW",
        menuAction: "next",
        notifications: [
          {
            state: 'Change Profile',
            notification: 'CAROUSEL_NEXT',
            payload: ''
          },
          {
            state: 'News Feed',
            notification: 'ARTICLE_NEXT',
            payload: ''
          }
        ]
      },
      {
        serialCode: "CCW",
        menuAction: "previous",
        notifications: [
          {
            state: 'Change Profile',
            notification: 'CAROUSEL_PREVIOUS',
            payload: ''
          },
          {
            state: 'News Feed',
            notification: 'ARTICLE_PREVIOUS',
            payload: ''
          }
        ]
      },
      {
        serialCode: "SW",
        menuAction: "lock",
        notifications: [
          {
            state: 'Test notification',
            notification: 'SHOW_ALERT',
            payload: { type: "notification", message: "This is a test message."}
          },
          {
            state: 'Restart MagicMirror (PM2)',
            notification: 'REMOTE_ACTION',
            payload: {action: "RESTART"}
          },
          {
            state: 'Restart',
            notification: 'REMOTE_ACTION',
            payload: {action: "REBOOT"}
          },
          {
            state: 'Shutdown',
            notification: 'REMOTE_ACTION',
            payload: {action: "SHUTDOWN"}
          }
        ]
      },
      {
        serialCode: "BTN1",
        notifications: [
          {
            state: 'News Feed',
            notification: 'ARTICLE_TOGGLE_FULL',
            payload: ''
          }
        ]
      }
    ]
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

  getAction: function(serialCode, state, stateless=false){
    var self=this;
    for(var i=0;i<self.config.actions.length;i++){
      if(self.config.actions[i].serialCode == serialCode){
        var menuaction = "";
        if(self.config.actions[i].menuAction !== undefined){
          menuaction = self.config.actions[i].menuAction;
        }
        for(var j=0;j<self.config.actions[i].notifications.length;j++){
          if(self.config.actions[i].notifications[j].state != undefined && self.config.actions[i].notifications[j].state == state){
            return { menuAction:menuaction,
              notification: self.config.actions[i].notifications[j].notification,
              payload: self.config.actions[i].notifications[j].payload
            };
          }
        }
        if(stateless){
          for(var j=0;j<self.config.actions[i].notifications.length;j++){
            if(self.config.actions[i].notifications[j].state == undefined){
              return { menuAction: menuaction,
                notification: self.config.actions[i].notifications[j].notification,
                payload: self.config.actions[i].notifications[j].payload
              };
            }
          }
        }
        return {menuAction: menuaction};
      }
    }
  },

  sendAction: function(description) {
    if(!this.config.hideMenu) this.show(0,{force: true, lockString: "MMM-Serial-Navigator" });

    if(description.payload == undefined) description.payload = {};
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
    this.serialCodes = [];
    this.menuactionCodes = {next: '', previous: '', lock: ''};
    for(var i=0;i<this.config.actions.length;i++){
      this.serialCodes.push(this.config.actions[i].serialCode);
      if(this.config.actions[i].menuAction === "next"){
        this.menuactionCodes.next = this.config.actions[i].serialCode;
      } else if(this.config.actions[i].menuAction === "previous"){
        this.menuactionCodes.previous = this.config.actions[i].serialCode;
      } else if(this.config.actions[i].menuAction === "lock"){
        this.menuactionCodes.lock = this.config.actions[i].serialCode;
      }
    }
    this.stateselected = 0;
    this.state = "GROUND_STATE";
    this.sendSocketNotification("INITIALIZE", {
      config: this.config,
      serialCodes: this.serialCodes
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
    for (let index = 0; index < this.config.states.length; index++) {
      var naviItem = document.createElement("li");
      var link = document.createElement('a');
      link.setAttribute('href', '');
      link.innerHTML = this.config.states[index];
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
    if(self.serialCodes.indexOf(payload.inputtype) != -1){
      navigationmove(payload.inputtype);
      self.hideAfterTimeout();
    }

    function fselectedid(){//get ID and return it
      for (let index = 0; index < self.config.states.length; index++) {
        var test = document.getElementsByTagName('li')[index].getAttribute('class');

        if(test=='selected' || test=='selected locked' || test=='selected locked fa-lock1'){//axled lock icon
          var selectedid = document.getElementsByTagName('li')[index].getAttribute('id');
          return selectedid;
        }
      }
    }
				
    function navigationmove(input){
      if(!self.config.hideMenu) self.show(0, {lockString: "MMM-Serial-Navigator"});
      selectedid = fselectedid();
      if(input===self.menuactionCodes.next || input===self.menuactionCodes['previous']){ // Menu actions "next" and "previous"
        vconfirm = 0;

        if(input===self.menuactionCodes.next){
          navistep = 1;
          actionstep = 0;
        }else if(input===self.menuactionCodes.previous){
          navistep = -1;
          actionstep = 1;
        }

        if(locked==true){
          self.sendAction(self.getAction(input, self.state));
        }else if(locked==false){
          document.getElementsByTagName('li')[selectedid].setAttribute('class', '');//CW&CCW
          if(selectedid==0 && input===self.config.serialCodes[0]){//mark next row
            document.getElementsByTagName('li')[parseInt(selectedid)+1].setAttribute('class', 'selected');//CW
            self.stateselected++;
          }else if(selectedid==0 && input===self.config.serialCodes[1]){//mark last row
            document.getElementsByTagName('li')[self.config.states.length-1].setAttribute('class', 'selected');//CCW
            self.stateselected = self.config.states.length - 1;
          }else if(selectedid==self.config.states.length-1 && input===self.config.serialCodes[0]){//mark first row
            document.getElementsByTagName('li')[0].setAttribute('class', 'selected');//CW
            self.stateselected = 0;
          }else if(selectedid==self.config.states.length-1 && input===self.config.serialCodes[1]){//mark prev row
            document.getElementsByTagName('li')[parseInt(selectedid)-1].setAttribute('class', 'selected');//CCW
            self.stateselected--;
          }else{//mark next one in selected direction
            document.getElementsByTagName('li')[parseInt(selectedid)+navistep].setAttribute('class', 'selected');
            self.stateselected = self.stateselected + navistep;
          }
        }
      }else if(input === self.menuactionCodes.lock){
        if(locked==false){//Menu not locked so ... (see below)
          var foundaction = self.getAction(input, self.config.states[self.stateselected]);
          if(foundaction.notification == undefined){ // Menu can be locked, so do this
            locked = true;
            self.state = self.config.states[self.stateselected];
            document.getElementsByTagName('li')[selectedid].setAttribute('class', 'selected locked fa-lock1');//axled lock icon
          }else{//if selected entry Action is object - so there is nothing to lock - execute it
            if(!self.config.hideMenu) self.show(0,{force: true, lockString: "MMM-Serial-Navigator"});
            self.sendAction(foundaction);
          }
        }else{//Menu locked so unlock it
          locked = false;
          self.state = "GROUND_STATE";
          document.getElementsByTagName('li')[selectedid].setAttribute('class', 'selected');
        }
      } else {
        var actionfound = self.getAction(input, self.state, stateless= true);
        if(actionfound.notification != undefined) {
          self.sendAction(actionfound);
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
  },

  notificationReceived: function(notification, payload, sender){
    switch(notification){
      case 'DOM_OBJECTS_CREATED':
        this.hide(10, { lockString: "MMM-Serial-Navigator" });
        break;
      case 'WRITE_TO_SERIAL':
        if(payload.data == undefined) break;
        this.sendSocketNotification('WRITE_TO_SERIAL',payload);
        break;
    }
  },
});
