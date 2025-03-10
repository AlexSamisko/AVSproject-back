module.exports = async function deleteAllTodos(user_id) {
  this.db.run('DELETE FROM todos WHERE user_id=?', user_id, (err) => {
    if (err) {
      return console.log(err.message);
    }
    console.log(
      `All todos of user with id:${user_id} was deleted from the table: todos`
    );
  });
};
