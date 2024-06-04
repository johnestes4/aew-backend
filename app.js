const express = require('express');
const morgan = require('morgan');
const Title = require('./models/title');
const Wrestler = require('./models/wrestler');
const Show = require('./models/show');
const Team = require('./models/team');
const Match = require('./models/match');

const startupRouter = require('./routes/startup.routes');
const titleReignRouter = require('./routes/titleReign.routes');
const titleRouter = require('./routes/title.routes');
const wrestlerRouter = require('./routes/wrestler.routes');
const teamRouter = require('./routes/team.routes');
const showRouter = require('./routes/show.routes');
const matchRouter = require('./routes/match.routes');
const rankingRouter = require('./routes/ranking.routes');
const utilityRouter = require('./routes/utility.routes');
const authRouter = require('./routes/auth.routes');

const app = express();

/*======MIDDLEWARES======*/
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); //morgan logs every http request with some basic info on it. neat
}
app.use(express.json()); //express middleware for json request handling, makes sure you get BODY
app.use(
  express.urlencoded({
    extended: true,
  })
);

//this generates a time on every request and attach it to req. you could then use that within the request functions if you want
// app.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   next();
// });
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  const allowedOrigins = [
    'http://localhost:4200',
    'http://localhost',
    'https://aew-frontend.onrender.com',
    'https://www.elite-rankings.com',
    'https://elite-rankings.com',
    'elite-rankings.com',
  ];
  const origin = req.headers.origin;
  // console.log(origin);
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
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
app.use('/api/titles', titleRouter);
app.use('/api/teams', teamRouter);
app.use('/api/matches', matchRouter);
app.use('/api/rankings', rankingRouter);
app.use('/api/utility', utilityRouter);
app.use('/api/auth', authRouter);

module.exports = app;
