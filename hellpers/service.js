const { Pool } = require('pg');

const pool = new Pool({
  host: '10.0.0.5',
  user: 'server4',
  password: 'server4jadin',
  database: 'postgres', 
  port: 45432, 
});


module.exports = pool;
