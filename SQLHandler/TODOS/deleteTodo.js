module.exports = async function deleteTodo(todo_id) {
  this.db.run('DELETE FROM todos WHERE todo_id=?', todo_id, (err) => {
    if (err) {
      return console.log(err.message);
    }
    console.log(
      `Row with id:${todo_id} has been deleted from the table: todos`
    );
  });
};
