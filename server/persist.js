// where all the DATA base connection is

const mongoose = require("mongoose");
const db = mongoose.connection;

function connect(callback) {
  // connection to mongo DB atlas
  // password for cluster myCoolPassword
  let connectionString =
    "mongodb+srv://jandir_17:PtiOpPuiU8jdjXMs@cluster0.vqspd.mongodb.net/trackthetruckVille?retryWrites=true&w=majority";

  console.log("connecting to raider144...");
  mongoose
    .connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .catch(err => {
      console.log("there was an error connecting to mongo: ", err);
    });
}

// on this db connection, once open, run the 'callback'
// a wrapper method
function onConnect(callback) {
  db.once("open", callback);
}

// export as an object
module.exports = {
  connect: connect,
  onConnect: onConnect
};
