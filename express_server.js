const express = require("express");
const app = express();
const PORT = 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

let users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

function generateRandomString() {
  return Math.random().toString(20).substr(2, 6);
}

app.set("view engine", "ejs");

app.get("/", function (req, res) {
  // Cookies that have not been signed
  console.log("Cookies: ", req.cookies);
});

app.get("/", (req, res) => {
  res.send("Welcome to Tinyapp");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase, users);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", (req, res) => {
  const userId = req.cookies["user_id"];

  const templateVars = {
    users: users[userId],
  };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const userId = req.cookies["user_id"];
  const templateVars = {
    users: users[userId],
  };
  res.render("urls_login", templateVars);
});

app.get("/urls", (req, res) => {
  console.log(users);
  const userId = req.cookies["user_id"];
  console.log("user_id", userId);
  console.log(users[userId]);
  const templateVars = {
    urls: urlDatabase,
    users: users[userId],
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    users,
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  //What would happen if a client requests a non-existent shortURL?
  if (!urlDatabase[shortURL]) {
    res.send("<html><body>Error</body></html>\n");
    return;
  }
  const templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[req.params.shortURL],
    users: req.cookies[users],
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  let newID = generateRandomString();
  urlDatabase[newID] = req.body.longURL;

  const templateVars = {
    users,
  };
  res.redirect(`/urls/${newID}`, templateVars); // Respond redirect
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect(`/urls`); // Respond redirect to index page
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.longURL;

  res.redirect(`/urls`); // Respond redirect to index page
});

app.post("/login", (req, res) => {
  const users = req.body.users;

  res.cookie("users", users);

  res.redirect(`/urls`); // Respond redirect to index page
});

app.post("/logout", (req, res) => {
  res.clearCookie("users");

  res.redirect(`/urls`); // Respond redirect to index page
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const userId = generateRandomString();

  const newUser = {
    id: userId,
    email,
    password,
  };

  if (!email || !password) {
    return res.status(400).send("email and password cannot be blank");
  }

  for (let userId in users) {
    let user = users[userId];

    if (user.email === email) {
      res.status(403).send("Sorry, user already exists!");
      return;
    }
  }

  users[userId] = newUser;

  res.cookie("user_id", userId);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Tinyapp is listening on port ${PORT}.`);
});
