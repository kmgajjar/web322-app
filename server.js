/********************************************************************************* 

WEB322 – Assignment 06
I declare that this assignment is my own work in accordance with Seneca
Academic Policy.  No part of this assignment has been copied manually or 
electronically from any other source (including 3rd party web sites) or 
distributed to other students. I acknoledge that violation of this policy
to any degree results in a ZERO for this assignment and possible failure of
the course. 

Name:   
Student ID:   
Date:  
Cyclic Web App URL:  https://long-ruby-cricket-tux.cyclic.app/
GitHub Repository URL:  

********************************************************************************/

const express = require("express");
const authData = require("./auth-service");
const storeData = require("./store-service");
const clientSessions = require("client-sessions");
const path = require("path");

// 3 new modules, multer, cloudinary, streamifier
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// AS4, Setup handlebars
const exphbs = require("express-handlebars");
const { Console } = require("console");

// Configure Cloudinary. This API information is
// inside of the Cloudinary Dashboard - https://console.cloudinary.com/
cloudinary.config({
  cloud_name: "datm0bllt",
  api_key: "446271268721543",
  api_secret: "Nb3E5uH5MdtqXDQIdCK7WxNPCgs",
  secure: true,
});

//  "upload" variable without any disk storage
const upload = multer(); // no { storage: storage }

const app = express();

app.use(express.urlencoded({ extended: true }));

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static("public"));

//This will add the property "activeRoute" to "app.locals" whenever the route changes, i.e. if our route is "/store/5", the app.locals.activeRoute value will be "/store".  Also, if the shop is currently viewing a category, that category will be set in "app.locals".
app.use(function (req, res, next) {
  let route = req.path.substring(1);

  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));

  app.locals.viewingCategory = req.query.category;

  next();
});

// Handlebars Setup
app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    helpers: {
      navLink: function (url, options) {
        return (
          '<li class="nav-item"><a ' +
          (url == app.locals.activeRoute
            ? ' class="nav-link active" '
            : ' class="nav-link" ') +
          ' href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
      formatDate: function (dateObj) {
        let year = dateObj.getFullYear();
        let month = (dateObj.getMonth() + 1).toString();
        let day = dateObj.getDate().toString();
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      },
    },
  })
);

app.set("view engine", ".hbs");

// Setup client-sessions
app.use(
  clientSessions({
    cookieName: "session",
    secret: "web322_assignment6",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60,
  })
);

// Add this middleware after defining the client-sessions middleware
app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

// Middleware to check if the user is logged in
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.get("/", (req, res) => {
  res.redirect("/about");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/shop", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "item" objects
    let items = [];

    // if there's a "category" query, filter the returned items by category
    if (req.query.category) {
      // Obtain the published "items" by category
      console.log("categories");
      items = await storeData.getPublishedItemsByCategory(req.query.category);
    } else {
      // Obtain the published "items"
      items = await storeData.getPublishedItems();
    }

    // sort the published items by postDate
    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // get the latest item from the front of the list (element 0)
    let item = items[0];

    // store the "items" and "item" data in the viewData object (to be passed to the view)
    viewData.items = items;
    viewData.item = item;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await storeData.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "shop" view with all of the data (viewData)
  res.render("shop", { data: viewData });
});

// Accept queryStrings
app.get("/items", ensureLogin, (req, res) => {
  let queryPromise = null;

  // Check if there is a query for Category
  if (req.query.category) {
    // Get the data for the specified category id only.
    queryPromise = storeData.getItemsByCategory(req.query.category);
  } else if (req.query.minDate) {
    // Get the data for the specified date only.
    queryPromise = storeData.getItemsByMinDate(req.query.minDate);
  } else {
    // Otherwise, get all items.
    queryPromise = storeData.getAllItems();
  }

  queryPromise
    .then((data) => {
      if (data.length > 0) {
        // Render the "items" view with the data if there are results
        res.render("items", { items: data });
      } else {
        // Render the "items" view with an error message if no results
        res.render("items", { message: "No results" });
      }
    })
    .catch((err) => {
      // Render the "items" view with an error message if there was an error in the promise(s)
      res.render("items", { message: "No results" });
    });
});

// A route for items/add
app.get("/items/add", ensureLogin, (req, res) => {
  storeData
    .getCategories()
    .then((data) => {
      res.render("addItem", { categories: data });
    })
    .catch((err) => {
      res.render("addItem", { categories: [] });
    });
});

app.post(
  "/items/add",
  ensureLogin,
  upload.single("featureImage"),
  (req, res) => {
    if (req.file) {
      let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
          let stream = cloudinary.uploader.upload_stream((error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          });

          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      };

      async function upload(req) {
        let result = await streamUpload(req);
        return result;
      }

      upload(req)
        .then((uploaded) => {
          processItem(uploaded.url);
        })
        .catch((err) => {
          processItem("");
        });
    } else {
      processItem("");
    }

    function processItem(imageUrl) {
      req.body.featureImage = imageUrl;
      req.body.postDate = new Date();
      req.body.price = 0;

      storeData
        .addItem(req.body)
        .then((post) => {
          res.redirect("/items");
        })
        .catch((err) => {
          res.status(500).send({ message: err });
        });
    }
  }
);

// Get an individual item
app.get("/item/:id", (req, res) => {
  storeData
    .getItemById(req.params.id)
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      res.json({ message: err });
    });
});

app.get("/categories", ensureLogin, (req, res) => {
  storeData
    .getCategories()
    .then((data) => {
      if (data.length > 0) {
        // Render the "categories" view with the data if there are results
        res.render("categories", { categories: data });
      } else {
        // Render the "categories" view with an error message if no results
        res.render("categories", { message: "No results" });
      }
    })
    .catch((err) => {
      // Render the "categories" view with an error message if there was an error in the promise(s)
      res.render("categories", { message: "No results" });
    });
});

app.get("/shop/:id", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "item" objects
    let items = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      items = await storeData.getPublishedItemsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      items = await storeData.getPublishedItems();
    }

    // sort the published items by postDate
    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // store the "items" and "item" data in the viewData object (to be passed to the view)
    viewData.items = items;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the item by "id"
    viewData.item = await storeData.getItemById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await storeData.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "shop" view with all of the data (viewData)
  res.render("shop", { data: viewData });
});

// Categories route to render the "addCategory" view
app.get("/categories/add", ensureLogin, (req, res) => {
  res.render("addCategory"); // Replace 'addCategory' with the actual name of your view for adding categories
});

// Categories route to handle adding a new category
app.post("/categories/add", ensureLogin, (req, res) => {
  const categoryData = req.body;

  storeData
    .addCategory(categoryData)
    .then(() => {
      res.redirect("/categories");
    })
    .catch((err) => {
      res.status(500).send("Unable to create category");
    });
});

// Categories route to handle deleting a category
app.get("/categories/delete/:id", ensureLogin, (req, res) => {
  const categoryId = req.params.id;

  storeData
    .deleteCategoryById(categoryId)
    .then(() => {
      res.redirect("/categories");
    })
    .catch((err) => {
      res.status(500).send("Unable to Remove Category / Category not found");
    });
});

// Items route to handle deleting an item
app.get("/items/delete/:id", ensureLogin, (req, res) => {
  const itemId = req.params.id;

  storeData
    .deletePostById(itemId)
    .then(() => {
      res.redirect("/categories");
    })
    .catch((err) => {
      res.status(500).send("Unable to Remove Item / Item not found");
    });
});

// GET route for "/Items/delete/:id"
app.get("/items/delete/:id", ensureLogin, (req, res) => {
  const itemId = req.params.id;

  storeData
    .deletePostById(itemId)
    .then(() => {
      res.redirect("/items");
    })
    .catch((err) => {
      res.status(500).send("Unable to Remove Post / Post not found");
    });
});

// NEW AUTH ROUTES
// GET route to render the login view
app.get("/login", function (req, res) {
  res.render("login", {});
});

// GET route to render the register view
app.get("/register", function (req, res) {
  res.render("register", {});
});

// POST route to handle user registration
app.post("/register", function (req, res) {
  authData
    .registerUser(req.body)
    .then(() => {
      res.render("register", { successMessage: "User created" });
    })
    .catch((err) => {
      res.render("register", {
        errorMessage: err,
        userName: req.body.userName,
      });
    });
});

// POST route to handle user login
app.post("/login", function (req, res) {
  req.body.userAgent = req.get("User-Agent"); // Set the User-Agent in the request body

  authData.checkUser(req.body).then((user) => {
    req.session.user = {
      userName: user.userName,
      email: user.email,
      loginHistory: user.loginHistory,
    };
    res.redirect("/items");
  }).catch((err) => {
    res.render("login", { errorMessage: err, userName: req.body.userName });
  });


  // authData
  //   .checkUser(req.body)
  //   .then((user) => {
  //     req.session.user = {
  //       userName: user.userName,
  //       email: user.email,
  //       loginHistory: user.loginHistory,
  //     };
  //     res.redirect("/items");
  //   })
  //   .catch((err) => {
  //     res.render("login", { errorMessage: err, userName: req.body.userName });
  //   });
});

// GET route to handle user logout
app.get("/logout", function (req, res) {
  req.session.reset(); // Reset the session to log out the user
  res.redirect("/");
});

// GET route to render the userHistory view
app.get("/userHistory", ensureLogin, function (req, res) {
  res.render("userHistory", {});
});

app.use((req, res) => {
  res.status(404).render("404");
});

storeData
  .initialize()
  .then(authData.initialize)
  .then(function () {
    app.listen(HTTP_PORT, function () {
      console.log("app listening on: " + HTTP_PORT);
    });
  })
  .catch(function (err) {
    console.log("unable to start server: " + err);
  });
