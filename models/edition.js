//a helper class we're using as a bit of a MONAD
var Edition = function(args){
  args = args || {};
  return {
    success : false,
    message : null,
    changes : args.changes,
    article : args.article,
    setInvalid : function(mssg){
      this.message = mssg;
    }
  }
};

module.exports = Edition;