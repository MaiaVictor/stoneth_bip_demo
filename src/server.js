const ssm = require("./../../../../shared-state-machine");
const app = require("./bipApp.js");
ssm.init(app, 7171).then(() => console.log("Started machine on port 7171"));
