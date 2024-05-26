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
  var urlIsValid = req.body.url.includes(process.env.ADMIN_URL);
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
    if (passIsValid || urlIsValid) {
      res.status(200).json({
        status: 'success',
        data: true,
      });
    } else {
      throw Error('NOT AUTHORIZED');
    }
  } catch (err) {
    res.status(401).json({
      status: 'Not Authorized',
      message: 'Not Authorized',
      data: false,
    });
  }
};
