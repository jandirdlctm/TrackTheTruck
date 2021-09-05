// this file contains all connections to server
// res.setHeader("Content-Type","application/json"); converts info to json

const express = require("express");
const { Model } = require("mongoose"); //??????
const { routeSchema, Route } = require("./model");
const { userSchema, User } = require("./model");
const { companySchema, Company } = require("./model");
const cors = require("cors");
const constants = require("./constants");

//HELPER FUNCTIONS
// MODULE EXPORTS HELPER FUNCTION TO CALCULATE AND SET TOTAL MILEAGE
const { setTotalMileageOfRoutes } = require("./server-helper-functions");

// initialize your app/server
const app = express();

app.use(cors());
app.use(express.static("public"));

// tell our app to use json
app.use(express.json({}));

// PASSPORT IMPORTS AND USE

const session = require("express-session");
const passport = require("passport");
const passportLocal = require("passport-local");

// PASSPORT MIDDLEWARES
app.use(
  session({
    secret: "fljadskjvn123bf",
    resave: false,
    saveUninitialized: true
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  console.log(
    "Time",
    Date.now(),
    "- Method",
    req.method,
    "- Path",
    req.originalUrl,
    "- Body",
    req.body,
    "--cookies",
    req.cookies
  );
  next();
});

// METHODS

// GET THE ACTIVE ROUTE
app.get("/route/active", (req, res) => {
  console.log("THis si the user: -------------------", req.user);
  if (!req.user) {
    res.sendStatus(401);
    return;
  }
  var driverID = req.user._id;
  let findQuery = {};
  if (req.user.role == constants.UserRoles.driver) {
    findQuery = {
      user: driverID,
      to_location: ""
    };
  }
  Route.findOne(findQuery, function(err, route) {
    if (err) {
      res.status(500).json({
        message: `unable to list routes`,
        error: err
      });
      return;
    }
    if (route) {
      res.status(200).json(route);
    }
  });
});

// GET METHOD FOR ADMIN TO SEE THEIR DRIVERS ROUTE INFO
app.get("/route/:driverID", (req, res) => {
  console.log("route got hit");
  console.log("This is the driver id: ", req.params.driverID);
  if (!req.user || req.user.role != "admin") {
    res.sendStatus(401);
    return;
  }
  res.setHeader("Content-Type", "application/json");

  var driverID = req.params.driverID;
  var companyID = req.user.company._id;

  User.findById(driverID, (err, user) => {
    if (user) {
      // get all the routes from the user
      console.log("User exists: ", user);
      var findQuery = {
        user: driverID,
        company: companyID
      };

      Route.find(findQuery, function(err, routes) {
        if (err) {
          res.status(500).json({
            message: "Unable to list routes",
            error: err
          });
          return;
        }
        var calculatedRoutes = setTotalMileageOfRoutes(routes);
        res.status(200).json(calculatedRoutes);
      });
    } else {
      res.status(422).json({
        error: "User does not exist"
      });
    }
  });
});
//Get - gets all of the Routes based on role
app.get("/route", (req, res, next) => {
  if (!req.user) {
    res.sendStatus(401);
    return;
  }
  res.setHeader("Content-Type", "application/json");
  //THIS LINE IS FOR TESTING PURPOSES AND CAN BE DELETED WHEN CONNECTED TO AUTHORIZATION
  // role = "driver";
  var driverID = req.user._id;
  var companyID = req.user.company._id;

  let findQuery = {};

  //Check role if role == admin look at all Queries, don't add filter

  // THIS NEEDS WORK
  if (req.user.role === constants.UserRoles.admin) {
    findQuery = {
      company: companyID,
      to_location: { $ne: "" }
    };
  }

  // IF THE USER IS A DRIVER, HE CAN SEE JUST HIS ROUTES
  else if (req.user.role === constants.UserRoles.driver) {
    findQuery = {
      user: driverID,
      to_location: { $ne: "" }
    };
  }
  console.log("This is the find query: ", findQuery);
  //
  Route.find(findQuery, function(err, routes) {
    if (err) {
      res.status(500).json({ message: `unable to list routes`, error: err });
      return;
    }
    console.log("routes", routes);
    var calculatedRoutes = setTotalMileageOfRoutes(routes);
    res.status(200).json(calculatedRoutes);
    console.log("calculated routes:", calculatedRoutes);
  });
});

//Gets specific route based on id
app.get("/route/:id", (req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  role = "driver"; //THIS LINE IS FOR TESTING PURPOSES AND CAN BE DELETED WHEN CONNECTED TO AUTHORIZATION

  console.log("getting specific route:", req.params.id);
  Route.findById(req.params.id, (err, route) => {
    if (err) {
      console.log("there was an error finding route with id");
      res.status(500).json({ message: `unable to find route`, error: err });
    } else if (route === null) {
      res.status(404).json({
        error: `Returns Null`,
        error: err
      });
      return;
    }
    var total = route.end_mileage - route.start_mileage;

    route = {
      _id: route._id,
      from_location: route.from_location,
      to_location: route.to_location,
      start_mileage: route.start_mileage,
      end_mileage: route.end_mileage,
      total_miles: total,
      created_at: route.createdAt
    };

    res.status(200).json(route);
    console.log("Getting Routes Successful");
  });
});

//post - Creates new route
app.post("/route", function(req, res) {
  // CHECKING IF THEY ARE LOGGED IN
  if (!req.user) {
    res.sendStatus(401);
    return;
  }

  res.setHeader("Content-Type", "application/json");
  console.log("Creating a new route");
  console.log("This is the user that is logged in:", req.user);

  console.log("THis is the user when creating a route: ", req.user);

  let creatingRoute = {
    from_location: req.body.from_location,
    to_location: req.body.to_location || "",
    start_mileage: req.body.start_mileage || 0,
    end_mileage: req.body.end_mileage || 0,
    // route_Date: new Date(req.body.route_Date),
    user: req.user,
    company: req.user.company._id
  };
  Route.create(creatingRoute, (err, route) => {
    if (err) {
      console.log("unable to create todo");
      res.status(500).json({
        message: "unable to create route",
        error: err
      });
      return;
    }

    res.status(201).json(route);
    console.log("successfully created route");
  });
});

app.put("/route/:routeID", function(req, res) {
  if (!req.user) {
    res.sendStatus(401);
    return;
  }
  res.setHeader("Content-Type", "application/json");
  Route.findOne({ _id: req.params.routeID }).then(function(route) {
    if (route) {
      route.to_location = req.body.to_location;
      route.end_mileage = req.body.end_mileage;
      route
        .save()
        .then(function() {
          res.status(201).json(route);
        })
        .catch(function(err) {
          res.sendStatus(500);
        });
    } else {
      res.sendStatus(404);
    }
  });
});

app.delete("/route/:id", (req, res) => {
  res.setHeader("Content-TypeError", "application/json");
  console.log("deleting route with id:", req.params._id);
  Route.findByIdAndDelete(req.params.id, (err, route) => {
    if (err) {
      res.status(500).json({
        message: "unable to find and delete route",
        error: err
      });
    } else if (route === null) {
      res.status(404).json({
        error: `Returns Null`,
        error: err
      });
      return;
    }
    res.status(201).json(route);
  });
});

app.patch("/route/:id", function(req, res) {
  res.setHeader("Content-Type", "application/json");
  console.log(
    `Patching route with updates from:${req.params.id} with body`,
    req.body
  );
  let updateRoute = {};
  if (req.body.from_location != null && req.body.from_location != undefined) {
    updateRoute.from_location = req.body.from_location;
  }
  if (req.body.to_location != null && req.body.to_location != undefined) {
    updateRoute.to_location = req.body.to_location;
  }
  if (req.body.start_mileage != null && req.body.start_mileage != undefined) {
    updateRoute.start_mileage = req.body.start_mileage;
  }
  if (req.body.end_mileage != null && req.body.end_mileage != undefined) {
    updateRoute.end_mileage = req.body.end_mileage;
  }

  Route.updateOne({ _id: req.params.id }, { $set: updateRoute }, function(
    err,
    updateResult
  ) {
    if (err) {
      console.log("unable to patch", err);
      res.status(500).json({
        message: "unable to patch todo",
        error: err
      });
    } else if (updateResult.n === 0) {
      console.log("");
      res.status(404).json({
        error: "Returns Null",
        error: err
      });
      return;
    }
    res.status(200).json(updateRoute);
  });
});

// AUTHENTICATION

// CREATING NEW USERS
app.post("/user", function(req, res) {
  // ---------CREATING AN ACCOUNT FOR A COMPANY
  if (req.body.companyName) {
    console.log("creating an account for a company");
    User.findOne({ email: req.body.companyEmail }).then(function(user) {
      if (user) {
        res.status(422).json({
          error: "Email already registered"
        });
      } else {
        var newCompany = new Company({
          company_name: req.body.companyName,
          company_email: req.body.companyEmail
        });
        var companyPlainPassword = req.body.companyPlainPassword;
        // CHECK WITH JAZE
        newCompany.setEncryptedPassword(companyPlainPassword, function() {
          newCompany.save().then(function(companyCreated) {
            var user = new User({
              email: companyCreated.company_email,
              encrypted_password: companyCreated.encrypted_password,
              role: "admin",
              company: companyCreated
            });
            user
              .save()
              .then(function() {
                res.status(201).json(user);
              })
              .catch(function(err) {
                if (err.errors) {
                  // MONGOOSE VALIDATION FAILURE
                  var messages = {};
                  for (var e in err.errors) {
                    messages[e] = err.errors[e].message;
                  }
                  res.status(422).json(messages);
                } else {
                  // worse failure
                  res.sendStatus(500);
                }
              });
          });
        });
      }
    });
  } else {
    // -------CREATING AN ACCOUNT FOR AN EMPLOYEE DRIVER---------------
    // CHECKING IF THE COMPANY IS LOGGED IN
    console.log("This is the request user that want to create the driver");
    if (!req.user || !req.user.role == "admin") {
      res.sendStatus(401);
      return;
    }

    // CHECKING IF THE EMAIL IS UNIQUE
    User.findOne({ email: req.body.email }).then(function(user) {
      if (user) {
        res.status(422).json({
          error: "Email Already registered"
        });
      } else {
        // CREATING THE NEW USER MODEL
        var user = new User({
          first_name: req.body.firstName,
          last_name: req.body.lastName,
          email: req.body.email,
          role: "driver",
          company: req.user.company
        });
        // storing the plain password
        var plainPassword = req.body.plainPassword;
        user.setEncryptedPassword(plainPassword, function() {
          user
            .save()
            .then(function() {
              res.status(201).json(user);
            })
            .catch(function(err) {
              if (err.errors) {
                // MONGOOSE VALIDATION FAILURE
                var messages = {};
                for (var e in err.errors) {
                  messages[e] = err.errors[e].message;
                }
                res.status(422).json(messages);
              } else {
                // worse failure
                res.sendStatus(500);
              }
            });
        });
      }
    });
  }
});

// GETTING THE DRIVERS FOR AN ADMIN(COMPANY) USER
app.get("/drivers", (req, res, next) => {
  if (!req.user || !req.user.role == "admin") {
    res.sendStatus(401);
    return;
  }

  res.setHeader("Content-Type", "application/json");

  console.log("This is the user: ", req.user);

  var companyID = req.user.company._id;
  console.log("This is the Company id", companyID);

  let findQuery = { company: companyID, role: "driver" };

  User.find(findQuery, function(err, users) {
    if (err) {
      console.log(`there was error finding users`, err);
      res.status(500), json({ message: `unable to list users` });
      return;
    }
    res.status(200).json(users);
  });
});
/* THIS ALREADY IS DEFINED ABOVE AND THIS IS DUPLICATE CODE
//PASSPORT
const session = require("express-session");
const passport = require("passport");
const passportLocal = require("passport-local");
*/
//PASSPORT

// 1. Local Strategy
passport.use(
  new passportLocal.Strategy(
    {
      //some configs
      usernameField: "email",
      passwordField: "plainPassword"
    },
    function(email, plainPassword, done) {
      console.log("local got hit");
      User.findOne({ email: email })
        .then(function(user) {
          console.log("this is the user: ", user);
          if (!user) {
            done(null, false, { message: "No user with that email" });
            return;
          }
          // verify that the user exists
          user.verifyPassword(plainPassword, function(result) {
            if (result) {
              done(null, user);
            } else {
              done(null, false, { message: "Password incorrect" });
            }
          });
        })
        .catch(function(err) {
          done(err);
        });
    }
  )
);
// 2. SERIALIZED USER TO SESSION
passport.serializeUser(function(user, done) {
  done(null, user._id);
});

//3. DESERIALIZED USER FROM SESSION
passport.deserializeUser(function(userId, done) {
  User.findOne({ _id: userId })
    .populate("company")
    .then(function(user) {
      done(null, user);
    })
    .catch(function(err) {
      done(err);
    });
});

// 4. Authenticate endpoint
app.post("/session", passport.authenticate("local"), function(req, res) {
  // this function is called if authentication succeeds.
  console.log("session got hit");
  res.sendStatus(201);
});

// 5. ME ENDPOINT
app.get("/session", function(req, res) {
  if (req.user) {
    // send user details
    console.log("This is the user we are sending back: ", req.user);
    res.json(req.user);
  } else {
    res.sendStatus(401);
  }
});

// LOGING OUT

app.get("/logout", function(req, res) {
  console.log("I am Logout");
  req.logout();
  res.json({
    status: "logout",
    msg: "Please Log In again"
  });
});

module.exports = app; // export app variables
