module.exports = async function userStatus(id) {
  return new Promise((resolve, reject) => {
    this.db.get(
      'SELECT user_id, login, token FROM users WHERE user_id=?',
      id,
      (err, row) => {
        if (err) {
          console.log(err.message);
          reject(err);
        } else if (row) {
          (this.user = {
            user_id: row.user_id,
            login: row.login,
            token: row.token,
          }),
            console.log(`User with id:${id} status revealed`);
          resolve(row);
        } else {
          resolve(null);
        }
      }
    );
  });
};
