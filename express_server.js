const express = require("express");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 3000;
const { getUserByEmail, generateRandomString, userUrl } = require("./helpers");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const cookieSession = require("cookie-session");
app.use(
  cookieSession({
    name: "session",
    keys: ["key1"],
  })
);

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "user2RandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "userRandomID",
  },
};

let users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10),
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10),
  },
};

app.set("view engine", "ejs");

//GET ROUTES

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase, users);
});

//Registration Page
app.get("/register", (req, res) => {
  const userId = req.session.user_id;

  const templateVars = {
    users: users[userId],
  };

  if (userId) {
    return res.redirect("/urls");
  }
  res.render("urls_register", templateVars);
});

//Login page
app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = {
    users: users[userId],
  };

  if (userId) {
    return res.redirect("/urls");
  }
  res.render("urls_login", templateVars);
});

//URLs Index page
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  let currentUserUrl = userUrl(userId, urlDatabase);
  console.log(currentUserUrl);
  const templateVars = {
    urls: currentUserUrl,
    users: users[userId],
  };
  res.render("urls_index", templateVars);
});

//New URLs page
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = {
    users: users[userId],
  };
  if (userId) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

//Individual URL page
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const id = req.session.user_id;

  if (urlDatabase[req.params.shortURL].userID !== id) {
    res.send("User does not have access to the url or is not logged in");
  }

  const templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    users: users[id],
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL]) {
    const longURL = urlDatabase[shortURL].longURL;
    if (longURL) {
      res.redirect("http://" + longURL);
    }
  } else {
    res.send(
      `<html><h3>Invalid short URL. Please resubmit your URL <a href="/urls/new">here</a></h3></html>`
    );
  }
});

//POST ROUTES

//Create new URL
app.post("/urls", (req, res) => {
  let newID = generateRandomString();
  urlDatabase[newID] = {
    longURL: req.body.longURL,
    userID: req.session.user_id,
  };

  res.redirect(`/urls/${newID}`);
});

// Delete a URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const id = req.session.user_id;

  if (urlDatabase[shortURL].userID === id) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    console.log(id, urlDatabase[shortURL].userID);
    res.status(403).send("Error: You are not logged in");
  }
});

// Edit a URL
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const id = req.session.user_id;
  console.log(shortURL);

  if (urlDatabase[shortURL].userID === id) {
    urlDatabase[shortURL].longURL = req.body.longURL;
    console.log(" longurl", req.body.longURL);
    res.redirect("/urls");
  } else {
    res.status(403).send("Error: You are not logged in");
  }
});

//Register a new user
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  const userId = generateRandomString();

  const newUser = {
    id: userId,
    email,
    password: hashedPassword,
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

  req.session.user_id = ("user_id", userId);
  res.redirect("/urls");
});

//Login as a registered user
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const currentUser = getUserByEmail(email, users);

  if (!currentUser) {
    return res.status(403).send("user does not exist!");
  }

  if (bcrypt.compareSync(password, currentUser.password)) {
    req.session.user_id = currentUser.id;
    console.log(req.session.user_id);
    return res.redirect(`/urls`);
  } else {
    return res.status(403).send("Incorrect password");
  }
});

//Logout of account
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`Tinyapp is listening on port ${PORT}.`);
});
