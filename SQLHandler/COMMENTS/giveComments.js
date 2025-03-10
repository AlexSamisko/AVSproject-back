module.exports = async function giveComments() {
  return new Promise((resolve, reject) => {
    this.db.each(
      `select * from comments`,
      [],
      (err, row) => {
        if (err) {
          console.log(err.message);
          reject(err);
        } else {
          this.fillResponce(
            {
              user_id: row.user_id,
              comment: row.comment,
              comment_id: row.comment_id,
              time: row.time,
            },
            'comments'
          );
        }
      },
      () => {
        resolve();
      }
    );
  });
};
