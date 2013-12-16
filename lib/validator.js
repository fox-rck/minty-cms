var Emitter = require("events").EventEmitter;
var util = require("util");

var Article = require("../models/article");

var Validator = function(db){
  Emitter.call(this);
  var self = this;

  self.checkRequired = function(edition){
    //need an author, title, and body
    if(edition.changes.author && edition.changes.title && edition.changes.body){
      self.emit("validated", edition);
    }else{
      edition.setInvalid("Need an author, title, and body", edition);
      self.emit("invalid", edition);
    }
  };

  self.checkExistence = function(edition){
    db.articles.findOne({slug : edition.changes.slug}, function(err,found){
      if(found){
        //move the passed in bits to the changes to be made
        edition.article = new Article(found);
        self.emit("exists", edition);
      }else{
        self.emit("doesnt-exist", edition);
      }
    });
  };

};

util.inherits(Validator,Emitter);
module.exports = Validator;