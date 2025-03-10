module.exports = async function addTodo({
  user_id,
  todo,
  todo_id,
  isComplete,
}) {
  this.db.run(
    'insert into todos(user_id, todo, todo_id, isComplete) VALUES(?, ?, ?, ?)',
    [user_id, todo, todo_id, isComplete],
    (err) => {
      if (err) {
        return console.log(err.message);
      }
      console.log(`Row was added to the table: todos`);
    }
  );
};
