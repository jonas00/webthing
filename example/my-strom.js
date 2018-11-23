const {
    Property,
    Thing,
    Value,
    Action
} = require('webthing')
const http = require('http')
const log = require('./print.js')
const request = require('request')

class RefreshAction extends Action {
  constructor(thing, input) {
	super(50, thing, 'refresh', input)
  }
  
  //Is reading the temperature when you press the action button!
  performAction() {
    return new Promise((resolve, reject) => {
      log("Manual power refresh")
      this.request(this.thing.baseUrl + 'report',(err, res, body) => {
			if (body) {
				let power = JSON.parse(body).power.toFixed(2)
                log('Updating Power consumption level for ' + this.thing.name + '(' + this.thing.baseUrl + '): ' + power)
                this.thing.power.notifyOfExternalUpdate(power)
                resolve()
            }
	  })
	})
  }
}

class MyStromValue extends Value {
    /**
   * Initialize the object.
   *
   * @param {*} initialValue The initial value
   * @param {function} valueForwarder The method that updates the actual value
   *                                  on the thing
   * @param {string} url Url for the Smart Plug. It can include the token: http://192.168.2.143/token=3y4u3rhbfoewqdSE
   */
    constructor(initialValue, valueForwarder, url, thing_name) {
    super(initialValue, valueForwarder)
        this.thing_name = thing_name
        this.url = url
        this.request = request
    }

    /**
   * Set a new value for this thing. Overrides Value.set
   *
   * @param {*} value Value to set
   */
    set(value) {
        this.valueForwarder(value, this.url);
        this.notifyOfExternalUpdate(value);
    }
}

class MyStrom extends Thing {
    constructor({ name = 'MyStrom', type = 'OnOffSwitch', description = '', baseUrl = '' } = {}) {
        super(name, type, description)
        
        this.baseUrl = baseUrl
        
        // Creating an On/Off property
        this.on = new MyStromValue(false, this.onOff, baseUrl + 'relay', name)
        let onProperty = new Property(this, 'on',
                this.on,
                {
                    '@type': 'OnOffProperty',
                    label: 'On/Off',
                    type: 'boolean',
                    description: 'Whether the output is changed',
                }
            )
        this.addProperty(onProperty)
        
        // Creating a temperature property
        this.temperature = new Value(0.0)
        this.addProperty(
            new Property(
                this,
                'temperature',
                this.temperature,
                {
                    '@type': 'LevelProperty',
                    laber: 'Temperature',
                    description: 'Current Temperature in Celsius',
                    minimum: -20,
                    maximum: 100,
                    unit: 'celsius',
                }
            )

        )
        // Creating a power property
        this.power = new Value(0.0)
        this.addProperty(
            new Property(
                this,
                'power',
                this.power,
                {
                    '@type': 'LevelProperty',
                    label: 'Power',
                    description: 'Power in switch',
                    unit: 'volt',
                }
            )
        )
		
		this.addAvailableAction(
			'refresh',
			{
				label: 'refresh',
				description: 'Refresh the power'
			},
			RefreshAction
		)
        // Reading temperature and power consumption every 5 min
        setInterval(() => {
			request(baseUrl + 'temp',(err, res, body) => {
				if (body) {
					let temp = Number(JSON.parse(body).compensated.toFixed(2))
					log('Updating Temperature level for ' + this.name + '(' + baseUrl + '): ' + temp)
					this.temperature.notifyOfExternalUpdate(temp)
				}
		     })

			request(this.baseUrl + 'report',(err, res, body) => {
				if (body) {
					let power = JSON.parse(body).power.toFixed(2)
					log('Updating Power consumption level for ' + this.name + '(' + this.baseUrl + '): ' + power)
					this.power.notifyOfExternalUpdate(power)
				}
		  })
        }, 300000)

        // Reading the status from all the switches
        setInterval(() => {
			request(this.baseUrl + 'report',(err, res, body) => {
				if (body) {
					let status = JSON.parse(body).relay
					log('Updating status for ' + this.name + '(' + this.baseUrl + '): ' + status)
					this.on.notifyOfExternalUpdate(Number(status))
				}
		  })
            
        }, 10000)
    
    
    }
    
    // Turning On or Off the switch
    onOff(status, url) {
        url = url + '?state=' + Number(status)
        log('Calling ' + this.thing_name + '(' + url + '), status: ' + status)
        this.request(url, (err, res, body) => {})
    }
}

module.exports = { MyStrom }
