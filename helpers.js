const getUserByEmail = (email, database) => {
  for (const userID in database) {
    if (database[userID].email === email) {
      return database[userID];
    }
  }
  return undefined;
};

function generateRandomString() {
  return Math.random().toString(20).substr(2, 6);
}

module.exports = { getUserByEmail, generateRandomString };
