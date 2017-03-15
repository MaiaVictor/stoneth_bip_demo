const Q = require("bluebird");
const ssm = require("shared-state-machine");
const bip = require("./bipApp.js");
ssm.init(bip, 7991).then(() => console.log("Started machine on port 7991"));
setTimeout(() => {
  ssm.play(bip, "http://localhost:7991").then(ssm => {
    [ {type: "new_company", name: "Paypal"},
      {type: "new_company", name: "PagSeguro"},
      {type: "new_user", name: "Fernanda"},
      {type: "new_user", name: "Victor"},
      {type: "fund_company", name: "Paypal", value: 500},
      {type: "fund_company", name: "PagSeguro", value: 500},
      {type: "fund_user", name: "Fernanda", company: "Paypal", value: 1000},
      {type: "fund_user", name: "Victor", company: "PagSeguro", value: 1000},
    ].reduce((a, b) => a.then(() => ssm.act(b)), Q.resolve(null));
  });
}, 500);

const express = require("express");
const app = express();
app.use(express.static("app"));
app.listen(7990, () => console.log("Serving app on port 7990"));


