var express = require("express");
var app = express();
app.use(express.static("app"));
app.listen(3000, function(){
  console.log("Serving app on http://localhost:3000/");
});


// Create your back-end logic here

var value = 0;

app.post("/save/:value", function(req, res){
  value = Number(req.params.value);
  res.send("Saved!");
});

app.get("/load", function(req, res){
  res.send(String(value));
});
