var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');

exports.auth = (req, res, next) => {
  //middleware to check for valid secret password before editing the database or triggering utility functions
  var passIsValid = false;
  if (req.body.password) {
    passIsValid = bcrypt.compareSync(
      req.body.password,
      bcrypt.hashSync(process.env.SECRET_PASS, 8)
    );
  }
  var urlIsValid = false;
  if (req.body.url) {
    urlIsValid = req.body.url.includes(process.env.ADMIN_URL);
  }
  if (passIsValid || urlIsValid) {
    next();
  } else {
    res.status(401).json({
      status: 'Not Authorized',
      message: 'Not Authorized',
    });
  }
};

exports.login = async (req, res) => {
  try {
    var passIsValid = bcrypt.compareSync(
      req.body.password,
      bcrypt.hashSync(process.env.SECRET_PASS, 8)
    );

    var urlIsValid = req.body.url.includes(process.env.ADMIN_URL);
    // var ipIsValid = req.ip == process.env.ADMIN_IP;
    ipIsValid = true;
    if (passIsValid || (urlIsValid && ipIsValid)) {
      res.status(200).json({
        status: 'Auth Successful',
        data: true,
      });
    } else {
      res.status(200).json({
        status: 'Auth Failed',
        data: false,
      });
    }
  } catch (err) {
    res.status(401).json({
      status: 'Auth Error',
      message: 'Auth Error',
      data: false,
    });
  }
};
