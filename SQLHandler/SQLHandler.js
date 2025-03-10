var sqlite3 = require('sqlite3');

const {
  giveTodos,
  addTodo,
  deleteTodo,
  deleteAllTodos,
  deleteCompletedTodos,
  completeTodo,
} = require('./TODOS');

const {
  addComment,
  redactComment,
  giveComment,
  giveComments,
  deleteComment,
} = require('./COMMENTS');

const {
  userLogin,
  saveNewToken,
  addUser,
  findLogin,
  findUserByLogin,
  findUserById,
  userStatus,
  replacePassword,
} = require('./USER');

class SQLHandler {
  constructor() {
    this.db = new sqlite3.Database(
      './data.db',
      sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
      (err) => {
        if (err && err.code == 'SQLITE_CANTOPEN') {
          this.createDatabase();
          return;
        } else if (err) {
          console.log('Getting error ' + err);
          exit(1);
        }
        this.createTables(this.db);
        this.db.run('PRAGMA foreign_keys = ON;', (err) => {
          if (err) {
            console.error('Failed to enable foreign keys:', err.message);
          } else {
            console.log('Foreign key support is enabled.');
          }
        });
      }
    );

    this.giveTodos = giveTodos;
    this.addTodo = addTodo;
    this.deleteTodo = deleteTodo;
    this.deleteAllTodos = deleteAllTodos;
    this.deleteCompletedTodos = deleteCompletedTodos;
    this.completeTodo = completeTodo;
    this.giveComment = giveComment;
    this.giveComments = giveComments;
    this.addComment = addComment;
    this.redactComment = redactComment;
    this.deleteComment = deleteComment;
    this.userLogin = userLogin;
    this.saveNewToken = saveNewToken;
    this.addUser = addUser;
    this.findLogin = findLogin;
    this.findUserByLogin = findUserByLogin;
    this.findUserById = findUserById;
    this.userStatus = userStatus;
    this.replacePassword = replacePassword;
    this.responce = {};
    this.user = {};
    this.loginAlreadyExists = false;
    this.userExists = false;
    this.verification = [];
    this.verificationToRestore = [];
  }

  async createDatabase() {
    const newdb = new sqlite3.Database('./data.db', (err) => {
      if (err) {
        console.log('Getting error ' + err);
        exit(1);
      }
      this.createTables(newdb);
    });
  }

  async createTables(newdb) {
    newdb.exec(
      `
        create table users (
            user_id text primary key not null,
            login text not null,
            password text not null,
            nickname text not null,
            token text not null
        );

        insert into users (user_id, login, password, nickname , token) VALUES('1', '79110092725@yandex.ru', '123', 'Sasha', '');
    
        

        create table todos (
            user_id text not null,
            todo text not null,
            todo_id text primary key not null,
            isComplete integer,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        );

        create table comments (
            user_id text not null,
            comment text not null,
            time text not null,
            comment_id int primary key not null,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        );
        
            `,
      (err) => {
        err
          ? console.log('createTables ' + err.message)
          : console.log('таблицы созданы');
        // runQueries(newdb);
      }
    );
  }

  async sendLoginStatusBack(id) {
    await this.findUserById(id);
    if (this.userExists) {
      await this.userStatus(id);
    } else {
      throw new Error('Wrong credentials');
    }
  }

  async sendPreSignInStatusBack(data) {
    await this.findLogin(data);
    if (this.loginAlreadyExists) {
      this.loginAlreadyExists = false;
      throw new Error('This login already occupied');
    }
  }

  async sendSignInStatusBack(data, hash, token) {
    await this.findLogin(data);
    if (this.loginAlreadyExists) {
      this.loginAlreadyExists = false;
      throw new Error('This login already occupied');
    } else {
      await this.addUser(data, hash, token);
      await this.userStatus(this.user.id);
    }
  }

  fillResponce(rowObject, user_id) {
    this.responce[user_id]
      ? (this.responce[user_id] = [...this.responce[user_id], rowObject])
      : (this.responce[user_id] = [rowObject]);
  }

  clearResponce(user_id) {
    this.responce[user_id] = null;
  }
}

module.exports = {
  SQLHandler,
};
