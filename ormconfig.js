let path = require('path');

module.exports = {
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "username": "root",
  "password": "a.123456",
  "database": "nest",
  "entities": [path.join(__dirname, '**', '*.entity.{ts,js}')],
  "synchronize": true,
  "logging": true
}
