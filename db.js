const mysql = require('mysql2');
const util = require('util');

const database = mysql.createPool({
    host:'bkgwrn6gtcty6cdwl5o2-mysql.services.clever-cloud.com',
    user:'u2egwb6gtty7oe3d',
    port: '3306',
    password:'To6M35rfToqNQJe9dtUm',
    database:'bkgwrn6gtcty6cdwl5o2'
})

const query = util.promisify(database.query).bind(database);

module.exports=query
