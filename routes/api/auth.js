const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');

//POST new user route (optional, everyone has access)
router.post('/signup', auth.optional, (req, res) => {
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

  // Cerco prima se la mail è già stata inserita
  Users.findOne({ email: user.email }, async (err, doc) => {
    if (err) throw err;
    if (doc) {
      return res.status(422).json({ message: 'Questa email è già stata utilizzata' });
    }
    if (!doc) {
      // Cerco se l'username è già stato inserito
      Users.findOne({ username: user.username }, async (err, usDoc) => {
        if (err) throw err;
        if (usDoc) {
          return res.status(422).json({ message: 'Questo username è già stato preso' });
        }
        if (!usDoc) {
          const finalUser = new Users(user);
          finalUser.setPassword(user.password);
          await finalUser.save();
          res.json(finalUser.toAuthJSON());
        }
      });
    }
  });
});

//POST login route (optional, everyone has access)
router.post('/signin', auth.optional, (req, res, next) => {
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
      const pUser = passportUser;
      pUser.token = passportUser.generateJWT();
      return res.status(201).json(pUser.toAuthJSON());
    }

    return res.status(401).json({ message: 'Email o password sbagliati' });

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