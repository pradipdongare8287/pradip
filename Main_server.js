const express = require('express')
const Main = express()
const session = require('express-session')


Main.use(session({
    secret:'mykey',
    resave:false,
    saveUninitialized:true
}))

var admin = require('./router/admin.js')
var doctorroute = require('./router/doctor.js')
var petient = require('./router/petient.js')
var website = require('./router/website.js')


Main.use('/',website)
Main.use('/admin',admin)
Main.use('/doctor',doctorroute)
Main.use('/patient',petient)



Main.set('view engine', 'ejs');
Main.use(express.static('public'))


const PORT = process.env.PORT || 3000;

Main.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});



// Main.listen(3000)

