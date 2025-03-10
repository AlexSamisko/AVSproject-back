module.exports = async function redactComment({ comment_id, comment }) {
  this.db.run(
    'UPDATE comments SET comment=? WHERE comment_id=?',
    [comment, comment_id],
    (err) => {
      if (err) {
        return console.log(err.message);
      }
      console.log(`Comment with id:${comment_id} has been changed`);
    }
  );
};
