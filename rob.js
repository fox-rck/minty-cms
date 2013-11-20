var Minty = require('./index');
var blog = new Minty();
var assert = require("assert");
var Schema = require("./models/schema");
var schema = new Schema({db : "./test/test.db"});

var p1 = schema.Article.build({title : "lorf", body : "shplept"});
var p2 = schema.Article.build({title : "asdasd", body : "asdasdasd"});

var uuid = require('node-uuid');

console.log(p1.uuid);
console.log(p2.uuid);
//blog.deleteAllPosts(function(err,result){
//  console.log(result);
//});

//blog.sync(function(){
//  blog.createPost({
//    title : "Honey Balls",
//    summary : "Putters",
//    image : "Fring",
//    slug : "hot-peppers",
//    body : "## I love beef##"
//  }, ["beef","feet"], function(err,result){
//    console.log("I HAVE RETURNED");
//  });
//
//});

// blog.updatePost({id : 1, title : "There was a boy named steve", tags : ["forever", "kissy"]}, function(err,result){
//   console.log(result);
// });



//console.log(saved);
//saved.success(function(saved){
//  saved.setTags([tag1,tag2]).success(function(){
//    console.log(saved);
//  });
//});

//var post = blog.Post.find(6).success(function(post){
////  post.title = "Cheesy boogers";
////  post.save().success(function(saved){
////
////  });
//
//  post.destroy().success(function(deleted){
//    console.log("Yay");
//  });
//});

//minty.posts({},function(err,posts){
//  console.log(posts);
//});
//
//blog.getPost({id : 1}, function(err,res){
//  console.log("RTORLRL");
//});