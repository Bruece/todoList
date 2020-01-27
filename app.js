//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

//mongoose.set('useFindAndModify', false);

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//LOCALHOST DB
//mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

//mongoose.connect("mongodb+srv://admin-bruce:ktEGHp2yEJ2jYugO@cluster0-brujb.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true,  useCreateIndex: true });
mongoose.connect("mongodb+srv://admin-bruce:zyFdVg81tt4YwO3u@cluster0-brujb.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

//mongoose.promise = global.promise;

const itemsSchema = ({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

//DEFAULT ITEMS
const item1 = new Item ({
  name: "Welcome to your To Do List!"
});
const item2 = new Item ({
  name: "Hit the + button to add a new item"
});
const item3 = new Item ({
  name: "<--- Hit this to delete an item."
});

const defaultItems= [item1, item2, item3];

//For CUSTOM LIST /work /home etc
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  //FIND IN MONGODB
  Item.find({},function(err, foundItems){

      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function(err){
          if (err){
            console.log(err);
          } else {
            console.log("Successfully saved default items to DB");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems})
      }
  });

});

app.get("/:customListName", function(req, res){

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        //Create New List
        //console.log("doesnt exist");
        const list= new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
    } else {
      //Show existing
      //console.log("list exits");
      res.render("list",{listTitle: foundList.name, newListItems: foundList.items})
    }
  }
  });


});

app.post("/", function(req, res){
  const itemName = req.body.newItem;

  //list in this line is the value of button
  const listName = req.body.list

  const item = new Item ({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function (err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  var listName = req.body.listName;
  console.log(listName);
  if (listName ==="Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (err){
        console.log(err);
      } else {
        console.log("Successfully deleted");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
        if (!err){
          res.redirect("/"+ listName);
        }
      });
  }
});


app.get("/about", function(req, res){
  res.render("about");
});

//LISTEN ON HEROKU AND LOCAL PORT
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);

app.listen(port, function() {
  console.log("Server started on port 3000");
});
