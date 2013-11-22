var assert = require("assert");
var gravatar = require('node-gravatar');

var Author = function(args){

  //gotta have an email and a name here
  assert.ok(args.email && args.name, "Need a name and an email");

  this.email = args.email;
  this.name = args.name;

  this.gravatarUrl = function(options){
    return gravatar.get(this.email, options);
  };

};
module.exports = Author;
