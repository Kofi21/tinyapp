const express = require("express");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 5000;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

// const cookieParser = require("cookie-parser");
// app.use(cookieParser());

const cookieSession = require("cookie-session");
app.use(
  cookieSession({
    name: "session",
    keys: ["key1"],
  })
);

const { getUserByEmail } = require("./helpers");
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
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10),
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10),
  },
};

// console.log(users);

function generateRandomString() {
  return Math.random().toString(20).substr(2, 6);
}

app.set("view engine", "ejs");

app.get("/", function (req, res) {
  // Cookies that have not been signed
  // console.log("Cookies: ", req.cookies);
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
  const userId = req.session.user_id; //["user_id"];

  const templateVars = {
    users: users[userId],
  };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const userId = req.session.user_id; //["user_id"];
  const templateVars = {
    users: users[userId],
  };
  res.render("urls_login", templateVars);
});

app.get("/urls", (req, res) => {
  const userId = req.session.user_id; //["user_id"];
  console.log(req.session.user_id);

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
  const userId = req.session.user_id;
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
    users: req.session.user_id[users],
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  console.log("------------", req.session.user_id); // Log the POST request body to the console
  let newID = generateRandomString();
  urlDatabase[newID] = {
    longURL: req.body.longURL,
    userID: req.session.user_id,
  };

  // const templateVars = {
  //   users,
  // };
  res.redirect(`/urls/${newID}`); // Respond redirect
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const id = req.session.user_id; //["user_id"];

  if (urlDatabase[shortURL].userID === id) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    console.log(id, urlDatabase[shortURL].userID);
    res.status(403).send("Error: You are not logged in");
  }
  // delete urlDatabase[shortURL];
  // res.redirect(`/urls`); // Respond redirect to index page
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const id = req.session.user_id;

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
  const hashedPassword = bcrypt.hashSync(password, 10);

  const userId = generateRandomString();

  const newUser = {
    id: userId,
    email,
    password: hashedPassword,
  };

  if (!email || !hashedPassword) {
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

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // const hashedPassword = bcrypt.hashSync(password, 10);

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
  req.session = null;
  res.redirect(`/urls`); // Respond redirect to index page
});

app.listen(PORT, () => {
  console.log(`Tinyapp is listening on port ${PORT}.`);
});
