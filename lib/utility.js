var request = require('request');
var db = require('../app/config');
var exS = require('express-session');
var Users = require('../app/collections/users');
var User = require('../app/models/user');
var Links = require('../app/collections/links');
var Link = require('../app/models/link');
var Click = require('../app/models/click');
var Promise = require('bluebird');
var bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'));

exports.getUrlTitle = function(url, cb) {
  request(url, function(err, res, html) {
    if (err) {
      console.log('Error reading url heading: ', err);
      return cb(err);
    } else {
      var tag = /<title>(.*)<\/title>/;
      var match = html.match(tag);
      var title = match ? match[1] : url;
      return cb(err, title);
    }
  });
};

var rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;

exports.isValidUrl = function(url) {
  return url.match(rValidUrl);
};

/************************************************************/
// Add additional utility functions below
/************************************************************/
exports.signIn = function (req, res) {
  var s = req.session;
  s.loggedIn = true;
};


exports.verifyLogInInfo = function (req, res, next) {
  var username = req.body.username;
  var password = req.body.password;

  exports.checkUser(username, password, function(logical) {
    if (logical) {
      // console.log('username and password checks out');
      exports.signIn(req, res);
      next();
    } else {
      res.redirect('/login');
      // res.status(201);
      // res.end();
    }
  });
};

exports.isLoggedIn = function(req, res, next) {
  var s = req.session;
  if (s.loggedIn) {
    res.redirect('/');
  } else {
    next();
  }
};

exports.isAuthenticated = function(req, res, next) {
  var s = req.session;
  // console.log('clients loggedIn status', req.session.loggedIn, req.url);
  if (s.loggedIn) {
    // console.log('User is logged in', req.body);
    next();
  } else {
    // console.log('User is NOT logged in', req.body);
    res.redirect('/login');
  }
};


exports.userExists = function (username, cb) {
  return db.knex('users')
    .where('username', '=', username);
};

exports.checkPassword = function (password, hash, cb) {
  return bcrypt.compareAsync(password, hash, function (err, res) {
    if (err) {
      cb(err, null);
      return;
    }
    cb(null, res);
  });
};

exports.checkUser = function(username, password, cb) {
  // db.knex('users')
  //   .where('username', '=', username)
  exports.userExists(username)
    .then(function(rowUsernamePassword) {
      console.log("I got here from verify and found the user");
      exports.checkPassword(password, rowUsernamePassword[0].password, function(err, result) {
        if ((username === rowUsernamePassword[0].username && result) || 
              (username === rowUsernamePassword[0].username && 
              password === rowUsernamePassword[0].password)) {

          console.log("I match!");
          cb(true);
        } else { 
          //or redirect to /login
          console.log("I do not match!");
          cb(false);
        }
      });
    })
    .catch(function (err) {
      cb(false);
      throw new Error('That username does not exists');
    });
};

exports.setpassword = function(password) {
  return bcrypt.genSaltAsync(10).then(function(result) {
    return bcrypt.hashAsync(password, result, null);
  });
};



