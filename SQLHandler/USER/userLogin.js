module.exports = async function userLogin({ login, password }) {
  return new Promise((resolve, reject) => {
    this.db.run(
      'UPDATE users SET isLogin=? WHERE login=? AND password=?',
      [1, login, password],
      (err) => {
        if (err) {
          console.log(err.message);
          reject(err);
        } else {
          console.log(`User with login:${login} has logged in on the site`);
          resolve();
        }
      }
    );
  });
};
