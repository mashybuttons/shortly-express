var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',

  initialize: function (params) {
    this.set('username', params.username);
    this.set('password', params.password);
  }
});

module.exports = User;