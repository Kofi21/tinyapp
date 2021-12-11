const express = require("express");
const app = express();
const PORT = 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const getUserByEmail = (email, database) => {
  for (const userID in database) {
    if (database[userID].email === email) {
      return database[userID];
    }
  }
  return undefined;
};

// const urlForUser = (userID, database) => {
//   const userURLs = {};
//   for (const shortURL in database) {
//     const longURL = database[shortURL].longURL;
//     if (database[shortURL].userID === userID) {
//       userURLs[shortURL] = longURL;
//     }
//   }
//   return userURLs;
// };

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
  const userId = req.cookies["user_id"];

  const templateVars = {
    urls: urlDatabase,
    users: users[userId],
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  // const email = req.body.email;
  // // const password = req.body.password;
  // console.log(email);
  // const currentUser = getUserByEmail(email, users);
  const userId = req.cookies.user_id;
  const templateVars = {
    users,
  };
  if (userId) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  //What would happen if a client requests a non-existent shortURL?
  // if (!urlDatabase[shortURL]) {
  //   res.send("<html><body>Error</body></html>\n");
  //   return;
  // }

  const templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    users: req.cookies[users],
  };
  res.render("urls_show", templateVars);
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
  const id = req.cookies["user_id"];

  if (urlDatabase[shortURL].userID === id) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    res.status(403).send("Error: You are not logged in");
  }
  // delete urlDatabase[shortURL];
  // res.redirect(`/urls`); // Respond redirect to index page
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const id = req.cookies.user_id;

  if (urlDatabase[shortURL].userID === id) {
    urlDatabase[shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.status(403).send("Error: You are not logged in");
  }
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

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const currentUser = getUserByEmail(email, users);

  if (!currentUser) {
    return res.status(403).send("user does not exist!");
  }

  if (password !== currentUser.password) {
    return res.status(403).send("Incorrect password");
  }

  res.cookie("user_id", currentUser.id);
  return res.redirect(`/urls`);

  // for (const [userID, value] of Object.entries(users)) {
  //   console.log(req.body.email, req.body.password);
  //   if (req.body.email === value.email) {
  //     if (req.body.password === value.password) {

  //     } // Respond redirect to urls page
  //   }
  // }
  // res.status(403).send("403");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect(`/urls`); // Respond redirect to index page
});

app.listen(PORT, () => {
  console.log(`Tinyapp is listening on port ${PORT}.`);
});
