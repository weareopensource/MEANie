'use strict';

/**
 * Module dependencies
 */

var mongoose = require('mongoose'),
  path = require('path'),
  config = require(path.resolve('./config')),
  Schema = mongoose.Schema,
  crypto = require('crypto'),
  bluebird = require('bluebird');
// validator = require('validator');
mongoose.Promise = Promise;

/**
 * A Validation function for local strategy properties
 */
// var validateLocalStrategyProperty = function (property) {
//   return ((this.provider !== 'local' && !this.updated) || property.length);
// };

/**
 * A Validation function for local strategy email
 */
// var validateLocalStrategyEmail = function (email) {
//   return ((this.provider !== 'local' && !this.updated) || validator.isEmail(email, { require_tld: false }));
// };

/**
 * A Validation function for username
 * - at least 3 characters
 * - only a-z0-9_-.
 * - contain at least one alphanumeric character
 * - not in list of illegal usernames
 * - no consecutive dots: "." ok, ".." nope
 * - not begin or end with "."
 */
// var validateUsername = function(username) {
//   var usernameRegex = /^(?=[\w.-]+$)(?!.*[._-]{2})(?!\.)(?!.*\.$).{3,34}$/;
//   return (
//     this.provider !== 'local' ||
//     (username && usernameRegex.test(username) && config.illegalUsernames.indexOf(username) < 0)
//   );
// };

/**
 * User Schema
 */
var UserSchema = new Schema({
  sub: {
    type: String,
    default: ''
  },
  firstName: {
    type: String,
    trim: true,
    default: ''
    // validate: [validateLocalStrategyProperty, 'Please fill in your first name']
  },
  lastName: {
    type: String,
    trim: true,
    default: ''
    // validate: [validateLocalStrategyProperty, 'Please fill in your last name']
  },
  displayName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    index: {
      unique: true,
      sparse: true // For this to work on a previously indexed field, the index must be dropped & the application restarted.
    },
    lowercase: true,
    trim: true,
    default: ''
    // validate: [validateLocalStrategyEmail, 'Please fill a valid email address']
  },
  username: {
    type: String,
    required: 'Please fill in a username',
    // validate: [validateUsername, 'Please enter a valid username: 3+ characters long, non restricted word, characters "_-.", no consecutive dots, does not begin or end with dots, letters a-z and numbers 0-9.'],
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    default: ''
  },
  salt: {
    type: String
  },
  profileImageURL: {
    type: String,
    default: 'assets/ic_profile.png'
  },
  provider: {
    type: String,
    required: 'Provider is required'
  },
  providerData: {},
  additionalProvidersData: {},
  roles: {
    type: [{
      type: String,
      enum: ['user', 'admin']
    }],
    default: ['user'],
    required: 'Please provide at least one role'
  },
  updated: {
    type: Date
  },
  created: {
    type: Date,
    default: Date.now
  },
  /* For reset password */
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  }
});

/**
 * Hook a pre save method to hash the password
 */
// UserSchema.pre('save', function (next) {
//   if (this.password && this.isModified('password')) {
//     this.salt = crypto.randomBytes(16).toString('base64');
//     this.password = this.hashPassword(this.password);
//   }
//
//   next();
// });

/**
 * Hook a pre validate method to test the local password
 */
// UserSchema.pre('validate', function (next) {
//   if (this.provider === 'local' && this.password && this.isModified('password')) {
//     var result = owasp.test(this.password);
//     if (result.errors.length) {
//       var error = result.errors.join(' ');
//       this.invalidate('password', error);
//     }
//   }
//
//   next();
// });

/**
 * Create instance method for hashing a password
 */
// UserSchema.methods.hashPassword = function (password) {
//   if (this.salt && password) {
//     return crypto.pbkdf2Sync(password, new Buffer(this.salt, 'base64'), 10000, 64, 'SHA1').toString('base64');
//   } else {
//     return password;
//   }
// };

/**
 * Create instance method for authenticating user
 */
UserSchema.methods.authenticate = function(password) {
  return this.password === this.hashPassword(password);
};

/**
 * Find possible not used username
 */
UserSchema.statics.findUniqueUsername = function(username, suffix, callback) {
  var _this = this;
  var possibleUsername = username.toLowerCase() + (suffix || '');

  _this.findOne({
    username: possibleUsername
  }, function(err, user) {
    if (!err) {
      if (!user) {
        callback(possibleUsername);
      } else {
        return _this.findUniqueUsername(username, (suffix || 0) + 1, callback);
      }
    } else {
      callback(null);
    }
  });
};

UserSchema.static('findOneOrCreate', async function findOneOrCreate(condition, doc) {
  const one = await this.findOne(condition);
  return one || this.create(doc).then(doc => {
    console.log('docteur', doc);
    return doc;
  }).catch((err) => {
    console.log(err);
    return Promise.resolve(doc);
  });
});

mongoose.model('User', UserSchema);
