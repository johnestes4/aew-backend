const express = require('express');
const morgan = require('morgan');
const Title = require('./models/title');
const Wrestler = require('./models/wrestler');
const Show = require('./models/show');
const Match = require('./models/match');

const startupRouter = require('./routes/startupRoutes');
const titleReignRouter = require('./routes/titleReignRoutes');
const wrestlerRouter = require('./routes/wrestlerRoutes');
const showRouter = require('./routes/showRoutes');
const matchRouter = require('./routes/matchRoutes');
const rankingRouter = require('./routes/rankingRoutes');

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
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');

  // Request methods you wish to allow
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  );

  // Request headers you wish to allow
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With,content-type'
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

/*======ROUTES======*/
app.use('/api/startup', startupRouter);
app.use('/api/titleReigns', titleReignRouter);
app.use('/api/wrestlers', wrestlerRouter);
app.use('/api/shows', showRouter);
app.use('/api/matches', matchRouter);
app.use('/api/rankings', rankingRouter);

module.exports = app;
