//a helper class we're using as a bit of a MONAD
var Edition = function(args){
  return {
    success : false,
    message : null,
    changes : args.changes,
    article : args.article,
    author : args.author,
    tags : args.tags || [],
    setInvalid : function(mssg){

      this.message = mssg;
    },
    hasAuthorAndArticle : function(){
      return this.article && this.author;
    },
    articleIsValid : function(){
      return this.article && this.article.isValid();
    },
    createSlugFromTitle : function(){
      return this.sluggify(this.article.title);
    },
    sluggify : function(str){
      var from  = "ąàáäâãåæćęèéëêìíïîłńòóöôõøśùúüûñçżź",
          to    = "aaaaaaaaceeeeeiiiilnoooooosuuuunczz",
          regex = new RegExp('[' + from.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1') + ']', 'g');
      if (str == null) return '';
      str = String(str).toLowerCase().replace(regex, function(c) {
        return to.charAt(from.indexOf(c)) || '-';
      });
      return str.replace(/[^\w\s-]/g, '').replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase();
    }
  }
};

module.exports = Edition;