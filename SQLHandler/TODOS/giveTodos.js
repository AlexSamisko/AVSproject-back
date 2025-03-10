module.exports = async function giveTodos(user_id) {
  return new Promise((resolve, reject) => {
    this.db.each(
      `select * from todos WHERE user_id = ?`,
      user_id,
      (err, row) => {
        if (err) {
          console.log(err.message);
          reject(err);
        } else {
          this.fillResponce(
            {
              user_id: row.user_id,
              todo: row.todo,
              todo_id: row.todo_id,
              isComplete: row.isComplete,
            },
            user_id
          );
        }
      },
      () => {
        resolve();
      }
    );
  });
};
