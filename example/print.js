let date = require('date-and-time')

const now = new Date()
const date_time = date.format(now, 'DD-MM-YYYY HH:mm:ss').toString()
 module.exports = function(string){
     console.log(date_time, string)
}
  