// this file is in charge of starting the application
// it is split up in this way for organization
// 'import' the server.js and persist.js and model.js into this file.

const server = require("./server.js"); // import from 'server.js'
const persist = require("./persist.js"); // import from 'persist.js'
const fs = require("fs");
//const model = require("./model.js");
const background = require("./background");

//define a port
const port = process.argv[2] || process.env.PORT || 8080;

// importing onConnect func from persist.js
persist.onConnect(() => {
  server.listen(port, () => {
    console.log("running server on port", port);
  });
});

// connect to database
persist.connect(() => {
  server.listen(port, () => {
    console.log(`Server Running! on ${port}`);
  });
});

// start the background process
