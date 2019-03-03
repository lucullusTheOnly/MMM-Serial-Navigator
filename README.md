# MMM-Serial-Navigator

This is a module for the [MagicMirror](https://github.com/MichMich/MagicMirror) project, which provides the possibility to navigate through a menu and send notifications based on input trough a serial interface of the server. It can be used to connect input devices (like a rotary encoder and buttons) through a device with serial interface (like an Arduino or other Microcontrollers).

The menu can be permanently hidden, to simply provide a simple interface between serial and notifications. The module can also receive notifications to send serial data to the client.

The communication protocol is line based. Every command from the serial interface should be a seperate line. It does not matter, what line ending you use (line feed, carriage return or both). When you use the `WRITE_TO_SERIAL` notification, a line feed character ("\n") is appended to the data.

## Images

## Installation
Run these command at the root of your magic mirror install.

```shell
cd modules
git clone https://github.com/lucullusTheOnly/MMM-Serial-Navigator.git
cd MMM-Serial-Navigator
npm install
```

## Using the module
To use this module, add the following configuration block to the modules array in the `config/config.js` file:
```js
var config = {
  modules: [
    {
      module: 'MMM-Serial-Navigator',
      position: 'bottom_right', // choose your desired position of the shown menu from the options provided by MagicMirror^2
      config: {
        // See below for configurable options
      }
    }
  ]
}
```

The standard configuration (as below) is written for an Arduino and a rotary encoder (with integrated switch) an an extra button. The menu navigation is done with the rotary encoder, whose action will emit the serial commands "CW", "CCW" and "SW". When a menu entry is locked, the rotary encoder can be rotated to control a module (for example scroll through the profiles of the MMM-Carousel module). To also provide an OK button for the module, an extra button with the serial command "BTN1" is used. You can find the corresponding Arduino sketch in the docs folder.

For further information about how the parameters for the serial interface can be configured, please refer to the nodejs module serialport, since the corresponding parameters of this module are just handed over to it.

Standard Configuration:
```js
config: {
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
}
```

## Configuration options
The following properties can be set for this module:

<table width="100%">
	<!-- why, markdown... -->
	<thead>
		<tr>
			<th>Option</th>
			<th width="100%">Description</th>
		</tr>
	<thead>
	<tbody>
		<tr>
			<td><code>hideMenu</code></td>
			<td>Hides the visual output of the module for making it work only in background.
				<br> <br> This value is <b>OPTIONAL</b>
				<br><b>Possible values:</b> <code>true</code> or <code>false</code>
                <br><b>Default value:</b> <code>false</code>
			</td>
		</tr>
		<tr>
			<td><code>menuTimeout</code></td>
			<td>Time in milliseconds, when the menu will be hidden after the last activity
				<br> <br> This value is <b>OPTIONAL</b>
				<br><b>Possible values:</b> any positive, valid <code>integer</code>
                <br><b>Default value:</b> <code>5000</code>
			</td>
		</tr>
    <tr>
      <td><code>serialDev</code></td>
      <td>Serial device to open.
        <br> <br> This value is <b>OPTIONAL</b>
        <br><b>Possible values:</b> any valid path (String) to a readable serial device
                <br><b>Default value:</b> <code>'/dev/ttyUSB0'</code>
      </td>
    </tr>
    <tr>
      <td><code>baudrate</code></td>
      <td>The baudrate to use with the serial device.
        <br> <br> This value is <b>OPTIONAL</b>
        <br><b>Possible values:</b> any valid baudrate (int)
                <br><b>Default value:</b> <code>9600</code>
      </td>
    </tr>
    <tr>
      <td><code>dataBits</code></td>
      <td>The number of databits to use with the serial device.
        <br> <br> This value is <b>OPTIONAL</b>
        <br><b>Possible values:</b> any vaild number of databits (int)
                <br><b>Default value:</b> <code>8</code>
      </td>
    </tr>
    <tr>
      <td><code>parity</code></td>
      <td>The parity mode, in which the serial device should operate.
        <br> <br> This value is <b>OPTIONAL</b>
        <br><b>Possible values:</b> any valid parity mode (String)
                <br><b>Default value:</b> <code>'none'</code>
      </td>
    </tr>
    <tr>
      <td><code>stopBits</code></td>
      <td>The number of stopbits to use with the serial device.
        <br> <br> This value is <b>OPTIONAL</b>
        <br><b>Possible values:</b> any valid number of stopBits (int)
                <br><b>Default value:</b> <code>1</code>
      </td>
    </tr>
    <tr>
      <td><code>flowControl</code></td>
      <td>If flow control should be used on the serial interface.
        <br> <br> This value is <b>OPTIONAL</b>
        <br><b>Possible values:</b> <code>true</code> or <code>false</code>
                <br><b>Default value:</b> <code>false</code>
      </td>
    </tr>
		<tr>
			<td><code>serialCodes</code></td>
			<td>A list of serial codes (strings), that should be used as input. Any code, that is not in this list, will be ignored.
				<br> <br> This value is <b>OPTIONAL</b>
				<br><b>Possible values:</b> <code>String array</code>
                <br><b>Default value:</b> <code>[ "CW", "CCW", "SW", "BTN1" ]</code>
			</td>
		</tr>
    <tr>
      <td><code>states</code></td>
      <td>A list of states/menu entries, that will be displayed in the menu.
        <br> <br> This value is <b>OPTIONAL</b>
        <br><b>Possible values:</b> <code>String array</code>
                <br><b>Default value:</b> <code>[
      'Change Profile',
      'News Feed',
      'Test notification',
      'Restart MagicMirror (PM2)',
      'Restart',
      'Shutdown'
    ]</code>
      </td>
    </tr>
    <tr>
      <td><code>serialCodes</code></td>
      <td>A list of actions, that will be executed on serial commands (see below).
        <br> <br> This value is <b>OPTIONAL</b>
        <br><b>Possible values:</b> Any valid actions as defined below
                <br><b>Default value:</b> (see the standard configuration above)
      </td>
    </tr>
	</tbody>
</table>

### Action Configuration

This is the logic core of the module. An actions defines, which notifications will be send and which menu navigations will be executed due to which serial command and in which situation.

Each action must have a unique serialCode, which is the corresponding command, that will be receive through the serial interface. An action can have the `menuAction` parameter. It defines the commands role in navigating through the menu and can have one the values "next", "previous" and "lock".

The notifications that will be emitted from a serial command, are listed in the `notifications` array. Each notification can have a state, in which it should be active. If the state is `test`, the notification will only be send, if `test` menu entry is currently locked. If you don't specify a state (omitting this parameter), the notification can be send from every state, except for the once, where a better fit is listed for this action. For example you can specify two notifications for an action:

```js
{
  serialCode: "BTN1",
  notifications: [
    {
      notification: "GENERAL_NOTIFICATION",
      payload: ''
    },
    {
      state: "Specific state",
      notification: "SPECIFIC_NOTIFICATION",
      payload: ''
    }
  ]
}
```

The serial command `BTN1` will emit the `GENERAL_NOTIFICATION` from everywhere, except when being in the state/locked menu entry `Specific state`, in which case it will emit the `SPECIFIC_NOTIFICATION`, since it is a better fit for the situation.
Furthermore you have to specify the notification and it's payload (optional).

<br>The action with `menuAction: "lock"` cannot be used for controlling other modules, since it has to unlock the entry, when necessary. So it can only contain notifications for unlockable menu entries.</br>

<table width="100%">
	<!-- why, markdown... -->
	<thead>
		<tr>
			<th>Option</th>
			<th width="100%">Description</th>
		</tr>
	<thead>
	<tbody>
		<tr>
			<td><code>serialCode</code></td>
			<td>Command string, that should trigger the following actions, when received through the serial interface.
				<br> <br> This value is <b>NOT OPTIONAL</b>
				<br><b>Possible values:</b> any String (not containing line feed or carriage return characters)
			</td>
		</tr>
		<tr>
			<td><code>menuAction</code></td>
			<td>If included, this will set the menu action, that will be executed on receiving the serial command, when in menu state. If you use the value `lock`, you should not include notifications for lockable menu entries.
				<br> <br> This value is <b>OPTIONAL</b>
				<br><b>Possible values:</b> String, one of `'next'`, `'previous'` or `'lock'`
			</td>
		</tr>
		<tr>
			<td><code>notifications</code></td>
			<td>A list of notifications, that can be triggered by this serial command.
				<br> <br> This value is <b>NOT OPTIONAL</b>
				<br><b>Possible values:</b> notifications as defined below
			</td>
		</tr>
	</tbody>
</table>

### Notification configuration options

<table width="100%">
	<!-- why, markdown... -->
	<thead>
		<tr>
			<th>Option</th>
			<th width="100%">Description</th>
		</tr>
	<thead>
	<tbody>
		<tr>
			<td><code>state</code></td>
			<td>State/Menu entry, for which the notification should be emitted. If omitted, the notification will be used for every state, for which no better fit is listed.
				<br> <br> This value is <b>OPTIONAL</b>
				<br><b>Possible values:</b> String, one of the previously defined states
			</td>
		</tr>
		<tr>
			<td><code>notification</code></td>
			<td>Notification, that should be emitted to the MagicMirror System for other modules to receive.
				<br> <br> This value is <b>NOT OPTIONAL</b>
				<br><b>Possible values:</b> any valid String
			</td>
		</tr>
		<tr>
			<td><code>payload</code></td>
			<td>Payload for the notification.
				<br> <br> This value is <b>OPTIONAL</b>
				<br><b>Possible values:</b> Any valid JSON object
                <br><b>Default value:</b> <code>''</code>
			</td>
		</tr>
	</tbody>
</table>


## Notifications

The module can receive the following notifications.

<table width="100%">
	<!-- why, markdown... -->
	<thead>
		<tr>
			<th>Option</th>
			<th width="100%">Description</th>
		</tr>
	<thead>
	<tbody>
		<tr>
			<td><code>WRITE_TO_SERIAL</code></td>
			<td>Sends data over the serial interface to the client. The payload has to contain the key
        <ul>
          <li> data   (String)
        </ul>
			</td>
		</tr>
	</tbody>
</table>
