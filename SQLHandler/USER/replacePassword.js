module.exports = async function replacePassword({ login, password }) {
  return new Promise((resolve, reject) => {
    this.db.run(
      'UPDATE users SET password=? WHERE login=?',
      [password, login],
      (err) => {
        if (err) {
          console.log(err.message);
          reject(err);
        } else {
          console.log(
            `Password for user with login:${login} has been changed succesfully to ${password}`
          );
          resolve();
        }
      }
    );
  });
};
