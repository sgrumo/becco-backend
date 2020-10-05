const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');

//POST new user route (optional, everyone has access)
router.post('/', auth.optional, (req, res) => {
  const user = req.body;

  if (!user.username) {
    return res.status(422).json({
      'message': 'Username is required'
    });
  }

  if (!user.email) {
    return res.status(422).json({
      'message': 'Email is required'
    });
  }

  if (!user.password) {
    return res.status(422).json({
      'message': 'Password is required'
    });
  }

  Users.findOne({ email: user.email }, async (err, doc) => {
    if (err) throw err;
    if (doc) {
      return res.status(422).json({ message: 'Email già presente nel database' });
    }
    if (!doc) {
      const finalUser = new Users(user);
      finalUser.setPassword(user.password);
      await finalUser.save();
      res.send('User created');
    }
  });
});

//POST login route (optional, everyone has access)
router.post('/login', auth.optional, (req, res, next) => {
  const user = req.body;

  if (!user.email) {
    return res.status(422).json({ message: 'Email is required' });
  }

  if (!user.password) {
    return res.status(422).json({ 'message': 'Password is required' });
  }

  return passport.authenticate('local', { session: false }, (err, passportUser) => {
    if (err) {
      return next(err);
    }

    if (passportUser) {
      const user = passportUser;
      user.token = passportUser.generateJWT();

      return res.json(user.toAuthJSON());
    }

    return res.sendStatus(400).info;
  })(req, res, next);
});

//GET current route (required, only authenticated users have access)
router.get('/current', auth.required, (req, res) => {
  const { payload: { id } } = req;

  return Users.findById(id)
    .then((user) => {
      if (!user) {
        return res.sendStatus(400);
      }

      return res.json(user.toAuthJSON());
    });
});

module.exports = router;