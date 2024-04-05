const express = require('express');
const morgan = require('morgan');
const Title = require('./models/title');
const Wrestler = require('./models/wrestler');
const Show = require('./models/show');
const Match = require('./models/match');

const startupRouter = require('./routes/startupRoutes');
const titleReignRouter = require('./routes/titleReignRoutes');

const app = express();

/*======MIDDLEWARES======*/
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); //morgan logs every http request with some basic info on it. neat
}
app.use(express.json()); //express middleware for json request handling, makes sure you get BODY

//this generates a time on every request and attach it to req. you could then use that within the request functions if you want
// app.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   next();
// });

/*======ROUTES======*/
app.use('/api/startup', startupRouter);
app.use('/api/titleReigns', titleReignRouter);

module.exports = app;
