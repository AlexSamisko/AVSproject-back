module.exports = async function addUser(
  { user_id, login, nickname },
  password,
  token
) {
  return new Promise((resolve, reject) => {
    this.db.run(
      'insert into users(user_id, login, password, nickname, token) VALUES(?, ?, ?, ?, ?)',
      [user_id, login, password, nickname, token],
      (err) => {
        if (err) {
          console.log(err.message);
          reject(err);
        } else {
          this.user.id = user_id;
          console.log(`User with login:${login} has signed up on the site`);
          resolve();
        }
      }
    );
  });
};
