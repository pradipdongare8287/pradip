const mysql = require('mysql2');
const util = require('util');

const database = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'root',
    database:'hospital'
})

const query = util.promisify(database.query).bind(database);

module.exports=query