const {
    Property,
    Thing,
    SingleThing,
    WebThingServer,
    Action
} = require('webthing')
const { MyStrom } = require('./my-strom.js')
const http = require('http')
const log = require('./print.js')
const request = require('request')
const myStrom = new MyStrom({ baseUrl: 'http://192.168.43.57/', name: 'MyStrom'})

function runServer() {
    const server = new WebThingServer(new SingleThing(myStrom), 8888);
    process.on ('SIGINT', () => {
        server.stop()
        process.exit()
    });
    process.on('uncaughtExeption', function (err){
        log('Caught exeption: ' + err)
   });
    server.start()
}
runServer()

