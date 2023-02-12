let express = require("express");
let sqlite3 = require("sqlite3");
let { open } = require("sqlite");
let path = require("path");

let app = express();
app.use(express.json());
let db = null;

let dbPath = path.join(__dirname, "todoApplication.db");

let initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is runnig at http://localhost:3000");
    });
  } catch (e) {
    console.log(`Db Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatus = (query) => {
  return query.priority !== undefined && query.status !== undefined;
};

const hasPriority = (query) => {
  return query.priority !== undefined;
};

const hasStatus = (query) => {
  return query.status !== undefined;
};

// API 1 GET Todos
app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status } = request.query;
  let getTodosQuery = null;

  switch (true) {
    case hasPriorityAndStatus(request.query):
      getTodosQuery = `
            SELECT 
                *
            FROM 
                todo
            WHERE 
                todo LIKE '%${search_q}%'
                AND status = '${status}'
                AND priority = '${priority}';`;
      break;

    case hasPriority(request.query):
      getTodosQuery = ` 
            SELECT 
                *
             FROM
                todo
             WHERE 
                todo LIKE '%${search_q}%'
                AND priority = '${priority}';`;
      break;

    case hasStatus(request.query):
      getTodosQuery = ` 
            SELECT 
                *
             FROM
                todo
             WHERE 
                todo LIKE '%${search_q}%'
                AND status = '${status}';`;
      break;

    default:
      getTodosQuery = ` 
            SELECT 
                *
             FROM
                todo
             WHERE 
                todo LIKE '%${search_q}%';`;
  }
  const todos = await db.all(getTodosQuery);
  response.send(todos);
});

// API 2 GET a particular Todo
app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = ` 
    SELECT
        *
     FROM
        todo
     WHERE
        id = ${todoId};`;
  const todoObj = await db.get(getTodoQuery);
  response.send(todoObj);
});

// API 3 Create a new Todo
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const createTodoQuery = ` 
    INSERT INTO
        todo (id, todo, priority, status)
     VALUES
        (${id}, '${todo}', '${priority}', '${status}');`;
  await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

//API 4 UPDATE the details of a Todo
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const detailsTobeUpdated = request.body;
  let updateColumn = "";

  switch (true) {
    case detailsTobeUpdated.status !== undefined:
      updateColumn = "Status";
      break;

    case detailsTobeUpdated.priority !== undefined:
      updateColumn = "Priority";
      break;

    case detailsTobeUpdated.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const getRequiredTodoQuery = ` 
    SELECT
        *
     FROM
        todo
     WHERE id = ${todoId};`;
  const requiredTodo = await db.get(getRequiredTodoQuery);
  console.log(requiredTodo);

  const {
    todo = requiredTodo.todo,
    status = requiredTodo.status,
    priority = requiredTodo.priority,
  } = request.body;

  const updateTodoQuery = ` 
    UPDATE 
        todo
     SET
        todo = '${todo}',
        priority = '${priority}',
        status = '${status}'
    WHERE
        id = ${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

// API 5 DELETE a Todo
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM 
        todo 
     WHERE 
        id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
