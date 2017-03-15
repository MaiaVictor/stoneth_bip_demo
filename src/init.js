const ssm = require("./../../../../shared-state-machine");
const app = require("./bipApp.js");
const Q = require("bluebird");

ssm.play(app, "http://localhost:7171").then(ssm => {
  ssm.get(state => console.log("STATE:",JSON.stringify(state, null, 2)));
  [ {type: "new_company", name: "Paypal"},
    {type: "new_company", name: "PagSeguro"},
    {type: "new_user", name: "Fernanda"},
    {type: "new_user", name: "Victor"},
    {type: "fund_company", name: "Paypal", value: 500},
    {type: "fund_company", name: "PagSeguro", value: 500},
    {type: "fund_user", name: "Fernanda", company: "Paypal", value: 1000},
    {type: "fund_user", name: "Victor", company: "PagSeguro", value: 1000},
    //{type: "send", from: ["Victor", "PagSeguro"], to: ["Fernanda", "Paypal"], value: 1000},
    //{type: "fund_company", name: "PagSeguro", value: 500},
    //{type: "send", from: ["Victor", "PagSeguro"], to: ["Fernanda", "Paypal"], value: 500},
    //{type: "clear"}
  ].reduce((a, b) => a.then(() => ssm.act(b)), Q.resolve(null));
});
