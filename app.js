//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require ("mongoose")
const _ = require ("lodash")


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://felipedema:tontolino@cluster0-shard-00-00.92qh6.mongodb.net:27017,cluster0-shard-00-01.92qh6.mongodb.net:27017,cluster0-shard-00-02.92qh6.mongodb.net:27017/todolistDB?ssl=true&replicaSet=atlas-xcwj89-shard-0&authSource=admin&retryWrites=true&w=majority")


//Item
const itemsSchema = new mongoose.Schema ({
  name: String
})

const Item = mongoose.model("Item",itemsSchema)


//Lists
const listSchema = new mongoose.Schema ({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model("List", listSchema)

// Default Items
const item1 = new Item ({
  name: "Welcome to your to do list!"
})

const item2 = new Item ({
  name: "Hit the + to add a new item."
})

const item3 = new Item ({
  name: "<-- Hit here to delete an item"
})

const defaultItems = [item1,item2,item3]


app.get("/", function(req, res) {

  Item.find({}, function(err,foundItems){

    if(foundItems.length === 0){
      Item.insertMany (defaultItems, function(err){});
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems });
    }
  })
});


app.post("/", function(req, res){

const itemName = req.body.newItem
const listName = req.body.list

  const item = new Item ({
    name: itemName
  })

  if (listName === "Today") {
    item.save(()=> {res.redirect("/")});
  } else {
    List.findOne({name: listName}, function(err,foundList) {
      foundList.items.push(item) //VER -> NUEVA MANERA DE INCORPORAR DATA A LA COLLECTION
      foundList.save(()=> {res.redirect("/" + listName)})  //VER -> NUEVA MANERA DE INCORPORAR DATA A LA COLLECTION, AHORA GUARDA LA COLLECTION Y NO UN NUEVO DOC
    })
  }

});

app.post("/delete", function(req, res){

  const checkedItemId = req.body.checkbox;
  const listName= req.body.listName;

if(listName === "Today") {
  Item.findByIdAndRemove (checkedItemId, function(err){
    if(!err){
      console.log("Succesfully deleted the checked item!");
      res.redirect("/")
    }
  })
}
// else {
//   List.findOne({name:listName} , function(err,foundList){
//     foundList.items.pull(checkedItemId) //VER -> NUEVA MANERA DE SACAR DATA A LA COLLECTION
//     foundList.save(()=> {res.redirect("/" + listName)})
//   })
// }
// }

//Otra forma:
else {
List.findOneAndUpdate({name:listName},{$pull: {items: { _id: checkedItemId}}}, function(err, foundList){
  if (!err) {res.redirect("/" + listName)}
})
}

})


app.get("/:customListName" , function (req,res){
  const customListName = _.capitalize(req.params.customListName);

List.findOne({name: customListName}, function(err,foundList){
  if (!err) {
    if(!foundList){
      //Create a new List
      const list = new List ({
        name: customListName,
        items: defaultItems
      });
    list.save(() => {res.redirect("/" + customListName)});
    // setTimeout(() => {res.redirect("/" + customListName)} , 1000 )
    } else
    //Show existing List
    res.render("list", {listTitle: foundList.name , newListItems: foundList.items });
  }
})



})


app.get("/about", function(req, res){
  res.render("about");
});



//Heroku

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started succesfully");
});
