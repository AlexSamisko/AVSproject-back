module.exports = async function completeTodo({ todo_id, isComplete }) {
  this.db.run(
    'UPDATE todos SET isComplete=? WHERE todo_id=?',
    [isComplete, todo_id],
    (err) => {
      if (err) {
        return console.log(err.message);
      }
      console.log(`Acomplishness of Todo with id:${todo_id} has been updated`);
    }
  );
};
