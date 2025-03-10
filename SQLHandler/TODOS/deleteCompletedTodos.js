module.exports = async function deleteCompletedTodos(user_id) {
  this.db.run(
    'DELETE FROM todos WHERE user_id=? and isComplete=?',
    [user_id, 1],
    (err) => {
      if (err) {
        return console.log(err.message);
      }
      console.log(
        `Todos for user with id:${user_id} were deleted due their completion`
      );
    }
  );
};
