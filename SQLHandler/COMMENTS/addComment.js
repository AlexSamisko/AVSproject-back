module.exports = async function addComment({
  user_id,
  comment,
  time,
  comment_id,
}) {
  this.db.run(
    'insert into comments(user_id, comment, time, comment_id) VALUES(?, ?, ?, ?)',
    [user_id, comment, time, comment_id],
    (err) => {
      if (err) {
        return console.log(err.message);
      }
      console.log(`Row was added to the table: comments`);
    }
  );
};
