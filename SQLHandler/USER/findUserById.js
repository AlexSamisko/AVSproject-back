module.exports = async function findUserById(id) {
  return new Promise((resolve, reject) => {
    this.db.get(
      'select user_id from users where user_id=?  ',
      id,
      (err, row) => {
        if (err) {
          console.log(err.message);
          reject(err);
        } else if (row) {
          console.log(`User with user_id:${id} exists`);
          this.userExists = true;
          resolve(row);
        } else {
          resolve(null);
        }
      }
    );
  });
};
