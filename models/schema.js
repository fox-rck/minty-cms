var uuid = require('node-uuid');
var Sequelize = require("sequelize-sqlite").sequelize;

var Schema = function(conn){

  var self = this;
  var Sequelize = require('sequelize-sqlite').sequelize;

  //setup the DB connection
  self.db = new Sequelize('minty','minty','password',{
    dialect: 'sqlite',
    storage: conn.db,
    logging : false
  });

  self.Article = self.db.define('articles', {
    uuid : {type : Sequelize.STRING(36), allowNull : false, unique: true},
    title : {type : Sequelize.STRING, allowNull : false},
    slug : {type : Sequelize.STRING, allowNull: false, unique: true},
    status : {type : Sequelize.STRING, allowNull: false, defaultValue: "draft"},
    summary : Sequelize.STRING,
    image : Sequelize.STRING,
    body : {type : Sequelize.STRING, allowNull: false},
    postType : {type : Sequelize.STRING, allowNull : false, defaultValue : "blog-post"},
    publishedAt : {type : Sequelize.DATE, allowNull: false, defaultValue: new Date()}
  });

  self.Version = self.db.define('versions', {
      title : {type : Sequelize.STRING, allowNull : false},
      slug : {type : Sequelize.STRING, allowNull: false},
      status : {type : Sequelize.STRING, allowNull: false, defaultValue: "draft"},
      summary : Sequelize.STRING,
      image : Sequelize.STRING,
      body : {type : Sequelize.STRING, allowNull: false},
      postType : {type : Sequelize.STRING, allowNull : false, defaultValue : "blog-post"},
      snappedAt : {type : Sequelize.DATE, allowNull: false, defaultValue: new Date()}
  });

  self.Tag = self.db.define('tags', {
    name : {type : Sequelize.STRING, allowNull : false, unique: true},
    description : {type : Sequelize.STRING}
  });


  self.Author = self.db.define("authors", {
    email : {type : Sequelize.STRING, allowNull : false},
    password : {type : Sequelize.STRING},
    name : {type : Sequelize.STRING, allowNull : false},
    github :{type : Sequelize.STRING},
    stackOverflow : {type : Sequelize.STRING},
    bio : {type : Sequelize.STRING},
    location : {type : Sequelize.STRING},
    twitter : {type : Sequelize.STRING},
    vimeo : {type : Sequelize.STRING},
    youtube : {type : Sequelize.STRING}
  });

  //associations
  self.Article
      .hasMany(self.Version, {onDelete: 'cascade'})
      .hasMany(self.Tag)
      .belongsTo(self.Author);

  self.Tag.hasMany(self.Article);
  self.Version.belongsTo(self.Article);
  self.Author.hasMany(self.Article);

  //helpy thing
  self.sync = function(next){
    self.db.drop().then(function(){
      self.db.sync().then(function(err,result){
        next(null,{success : true});
      });
    });
  };

  return self;
};

module.exports = Schema;

