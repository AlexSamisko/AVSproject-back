module.exports = async function deleteComment({ comment_id }) {
  this.db.run('DELETE FROM comments WHERE comment_id=?', comment_id, (err) => {
    if (err) {
      return console.log(err.message);
    }
    console.log(
      `Row with id:${comment_id} was deleted from the table: comments`
    );
  });
};
