module.exports = async function giveComment({ user_id, comment_id }) {
  this.db.get(
    `select user_id, comment, time, comments_id from comments WHERE user_id = ? and comment_id = ?`,
    [user_id, comment_id],
    (err, row) => {
      if (err) {
        return console.log(err.message);
      }
      return {
        user_id: row.user_id,
        comment: row.comment,
        time: row.time,
        comments_id: row.comments_id,
      };
    }
  );
};
