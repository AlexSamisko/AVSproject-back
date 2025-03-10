module.exports = async function findUserByLogin({ login }) {
  return new Promise((resolve, reject) => {
    this.db.get(
      'select user_id, password from users where login=?  ',
      login,
      (err, row) => {
        if (err) {
          console.log(err.message);
          reject(err);
        } else if (row) {
          console.log(`User with login:${login} exists`);
          this.user.id = row.user_id;
          this.user.password = row.password;
          this.userExists = true;
          resolve(row);
        } else {
          resolve(null);
        }
      }
    );
  });
};
