// this file is where all the data[types] go
const mongoose = require("mongoose");
const { stringify } = require("querystring");

// IMPORTING BCRYPT LIBRARY TO HASH PASSWORDS
const bcrypt = require("bcrypt");

/*NOTE: user_id is tied to routeSchema because every route needs a user. Users
shouldn't have access to all routes, so no routeSchema imported to user*/

const routeSchema = mongoose.Schema(
  {
    // this is a schema. it contains all datatypes
    from_location: String,
    to_location: String,
    start_mileage: Number,
    end_mileage: Number,
    // route_Date: Date,
    //every route will have a user_id, so pass through user_id as object
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    //When we implement company/employer schema:
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  },
  { timestamps: true }
);

const userSchema = mongoose.Schema(
  {
    first_name: {
      type: String,
      required: false,
    },
    last_name: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    encrypted_password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    //DON'T pass route schema through here, because it will give access to all routes.
    //When we implement company_id schema:
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  },
  { timestamps: true }
);

//When we implement Company/Employer Schema,

const companySchema = mongoose.Schema(
  {
    company_name: {
      type: String,
      required: true,
    },
    company_email: {
      type: String,
      required: true,
      unique: true,
    },
    encrypted_password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// METHODS TO ENCRYPT PASSWORD OF USERS
userSchema.methods.setEncryptedPassword = function(plainPassword, callback) {
  bcrypt.hash(plainPassword, 12).then((hash) => {
    this.encrypted_password = hash;
    callback();
  });
};

userSchema.methods.verifyPassword = function(plainPassword, callback) {
  bcrypt.compare(plainPassword, this.encrypted_password).then((result) => {
    callback(result);
  });
};
// METHODS TO ENCRYPT PASSWORD OF COMPANY
companySchema.methods.setEncryptedPassword = function(plainPassword, callback) {
  bcrypt.hash(plainPassword, 12).then((hash) => {
    this.encrypted_password = hash;
    callback();
  });
};

companySchema.methods.verifyPassword = function(plainPassword, callback) {
  bcrypt.compare(plainPassword, this.encrypted_password).then((result) => {
    callback(result);
  });
};

const Route = mongoose.model("Route", routeSchema);
const User = mongoose.model("User", userSchema);
const Company = mongoose.model("Company", companySchema);
module.exports = {
  Route,
  User,
  Company,
};
