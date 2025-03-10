module.exports = async function saveNewToken(user_id, token) {
  return new Promise((resolve, reject) => {
    this.db.run(
      'UPDATE users SET token=? WHERE user_id=?',
      [user_id, token],
      (err) => {
        if (err) {
          console.log(err.message);
          reject(err);
        } else {
          console.log(`Token for user with id:${user_id} has been updated`);
          resolve();
        }
      }
    );
  });
};
