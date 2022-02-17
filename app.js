//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({
  extended: true
}));
app.use(express.static("public"));

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect("mongodb+srv://admin-josh:test123@cluster0.pqq8u.mongodb.net/todolistDB?retryWrites=true&w=majority");
}

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});
const item4 = new Item({
  name: "For custom lists, enter any name of your choice behind the URL e.g /wishlist."
});

const defaultItems = [item1, item2, item3, item4];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  const day = date.getDate();

  Item.find({}, function(err, foundItems) {
    if (err) {
      console.log(err);
    } else if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Default items saved to DB");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: day,
        newListItems: foundItems
      });
    }
  });

});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save(() => res.redirect("/" + customListName));

      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    } else {
      console.log(err);
    }
  });
});

app.post("/", function(req, res) {

  const newItemName = req.body.newItem;
  const currentList = req.body.list;
  const day = date.getDate();

  const item = new Item({
    name: newItemName
  });

  if (currentList === day) {
    item.save(() => res.redirect("/"));
  } else {
    List.findOne({
      name: currentList
    }, function(err, foundList) {
      if (!err) {
        foundList.items.push(item);
        foundList.save(() => res.redirect("/" + currentList));
      } else {
        console.log(err);
      }
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemID = req.body.checkbox;
  const currentList = req.body.list;
  const day = date.getDate();

  if (currentList === day) {
    Item.findByIdAndRemove(checkedItemID, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: currentList}, {$pull: {items: {_id: checkedItemID}}}, function(err, foundList) {
      if (!err) {
        res.redirect("/" + currentList);
      }
    });
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server has started successfully");
});
