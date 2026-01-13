const passport = require('passport');

const auth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server error during authentication'
      });
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }
    
    req.user = user;
    next();
  })(req, res, next);
};

module.exports = auth;