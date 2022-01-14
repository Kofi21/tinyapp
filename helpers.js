const getUserByEmail = (email, database) => {
  for (const userID in database) {
    if (database[userID].email === email) {
      return database[userID];
    }
  }
  return undefined;
};

const userUrl = (userID, database) => {
  let newUrl = {};

  for (const url in database) {
    if (database[url].userID === userID) {
      newUrl[url] = database[url];
    }
  }
  return newUrl;
};

function generateRandomString() {
  return Math.random().toString(20).substr(2, 6);
}

module.exports = { getUserByEmail, generateRandomString, userUrl };
