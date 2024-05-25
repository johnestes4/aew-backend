const mongoose = require('mongoose');
const dotenv = require('dotenv');
//make sure to config dotenv BEFORE requiring app, that way the variables work everywhere
dotenv.config({ path: './config.env' });
//good to keep express and server in separate files
const app = require('./app');

//remember: environment variables go in CONFIG.ENV

/*======DATABASE======*/
var dbString = process.env.DATABASE_LOCAL;
if (process.env.NODE_ENV == 'production') {
  dbString = process.env.MONGO_URI;
}
mongoose
  .connect(dbString, {})
  .then(() => console.log('<DATABASE CONNECTION ESTABLISHED>'));

/*======SERVER======*/
const port = process.env.PORT;
if (process.env.NODE_ENV == 'production') {
  port = process.env.PROD_PORT;
}

app.listen(port, () => {
  console.log(`<PORT ${port} SERVER CONNECTION ESTABLISHED>`);
});
