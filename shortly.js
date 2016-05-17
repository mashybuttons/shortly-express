var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var exS = require('express-session');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// //make expresss-session
app.use(exS({secret: 'kat needs a cookie', cookie: {maxAge: 10000}}));

var isAuthenticated = function(req, res, next) {
  var s = req.session;
  // console.log(req.session);
  if (s.cookie.secure) {
    next();
  } else {
    res.redirect('/login');
  }

  // next();
};

var generateSession = function (req, res, next) {
  // exS({secret: 'kat needs a cookie', cookie: {maxAge: 10000}});
  next();
};

app.get('/', isAuthenticated,
function(req, res) {
  // console.log(req.session.id);
  // console.log(req.session.cookie);
  res.render('index');

  // var username = req.body.username;
  // var password = req.body.password;


  // if (!username || !password) {
  //   res.redirect('/login');
  // } else {
  //   res.render('index');
  // }
  //check if user loggedin
    //if yes, go to index
    //else redirect to login
  
});

app.get('/create', isAuthenticated,
function(req, res) {
  res.render('index');
});

app.get('/links', isAuthenticated,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
});

app.post('/links', isAuthenticated,
function(req, res) {
  console.log("I PRESSED SUMBIT AND IM HERE In /links");
  var uri = req.body.url;
  // var username = req.body.username;
  // var password = req.body.password;

  // if (!username || !password) {
  //   res.redirect('/login');
  // }


  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', generateSession,
  function (req, res) {
    res.render('login');
  }
);

app.post('/login',
  function (req, res) {
    var s = req.session;
    s.cookie.secure = true;
    var username = req.body.username;
    var password = req.body.password;

    verifyLogInInfo(username, password);
    res.redirect('/');
  }
);

var verifyLogInInfo = function (username, password, cb) {
  db.knex('users')
    .where('username', '=', username)
};

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/***********************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
