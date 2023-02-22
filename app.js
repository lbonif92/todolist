//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('strictQuery', true);
mongoose.connect('mongodb+srv://'); // connecter la base de donnée

const itemsSchema = new mongoose.Schema({ name: String });

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Bienvenue dans todolist"
});

const item2 = new Item({
  name: "Faire (+) pour ajouter une tâche"
});

const item3 = new Item({
  name: "coche pour supprimer la tâche"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("list", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){
    if (foundItems.length === 0){

      Item.insertMany(defaultItems, function (err) {
        if (err){
          console.log(err)
        } else {
          console.log('defaultItems saved successfully in the DB');
          res.redirect("/");
        }
      });

    } else {
    res.render("list", {listTitle: "today", newListItems: foundItems});
    }
  
  });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  
  const item = new Item({
  name: itemName
  });

  if (listName === "today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
    foundList.items.push(item);
    foundList.save();
    res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res){

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully deleted checked item.");
      res.redirect("/");
    }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id:checkedItemId}} }, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      } 
    });
  }
  
});

app.get("/:customListName", function(req,res){

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if(!foundList){
        // create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        
        list.save();
        res.redirect("/" + customListName);

      } else {
        // show the actual list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  }
  });


});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
