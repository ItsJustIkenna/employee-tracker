const express = require("express");
const mysql = require("mysql");
const inquirer = require("inquirer");
const cTable = require("console.table");
const util = require("util");
const { title } = require("process");

const app = express();

const PORT = 8080;

const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "employee_db",
});

connection.connect(function (err) {
  if (err) throw err;
  console.log("connected as id " + connection.threadId);
  init();
});

connection.query = util.promisify(connection.query);

function init() {
  inquirer
    .prompt([
      {
        type: "list",
        message: "What would you like to do?",
        name: "choice",
        choices: [
          "View All Employees?",
          "View All Roles!",
          "View all Departments?",
          "Update Employee?",
          "Add Employee?",
          "Add Role?",
          "Add Department?",
        ],
      },
    ])
    .then(function (response) {
      switch (response.choice) {
        case "View All Employees?":
          viewAllEmployees();
          break;

        case "View All Roles!":
          viewAllRoles();
          break;
        case "View all Departments?":
          viewAllDepartments();
          break;

        case "Add Employee?":
          addEmployees();
          break;

        case "Update Employee?":
          updateRoles();
          break;

        case "Add Role?":
          addRoles();
          break;

        case "Add Department?":
          addDepartment();
          break;
      }
    });
}

async function selectRole() {
  const roleQuery = `SELECT * FROM role;`;
  const query = await connection.query(roleQuery);
  const newArray = query.map((data) => {
    const dataObject = { name: data.title, value: data.id };
    return dataObject;
  });
  return newArray;
}

async function selectManager2() {
  const managerQuery = `SELECT * FROM employee;`;
  const query = await connection.query(managerQuery);
  const newArray = query.map((data) => {
    console.log(data);
    const dataObject = {
      name: data.first_name + " " + data.last_name,
      value: data.ID,
    };
    return dataObject;
  });
  console.log(newArray);
  return newArray;
}

function addDepartment() {
  inquirer
    .prompt([
      {
        name: "name",
        type: "input",
        message: "What Department would you like to add?",
      },
    ])
    .then(function (response) {
      var query = connection.query(
        "INSERT INTO department SET ? ",
        {
          name: response.name,
        },
        function (err) {
          if (err) throw err;
          console.table(response);
          init();
        }
      );
    });
}

function addEmployees() {
  inquirer
    .prompt([
      {
        type: "input",
        name: "firstName",
        message: "Enter their first name",
      },
      {
        type: "input",
        name: "lastName",
        message: "Enter their last name",
      },
      {
        type: "list",
        name: "role",
        message: "Enter their role",
        choices: selectRole,
      },
      {
        type: "list",
        name: "manager",
        message: "Enter their manager's name",
        choices: selectManager2,
      },
    ])
    .then((response) => {
      console.log(response);

      connection.query(
        "INSERT INTO employee (first_name, last_name, role_id, manager_id) values (?, ?, ?, ?)",
        [
          response.firstName,
          response.lastName,
          response.manager,
          response.role,
        ],
        function (err) {
          if (err) throw err;
          console.table(response);
          init();
        }
      );
    });
}

function addRoles() {
  connection.query("SELECT * FROM department", function (err, data) {
    let deptArr = data.map((department) => {
      return {
        name: department.name,
        value: department.id,
      };
    });
    inquirer
      .prompt([
        {
          name: "Title",
          type: "input",
          message: "What is the roles Title?",
        },
        {
          name: "Salary",
          type: "input",
          message: "What is the Salary?",
        },
        {
          type: "list",
          name: "department",
          message: "Please select a department",
          choices: deptArr,
        },
      ])
      .then(function (response) {
        console.log(response);
        connection.query(
          "INSERT INTO role (title, salary, department_id) Value (?, ?, ?)",
          [response.Title, response.Salary, response.department],
          function (err) {
            if (err) throw err;
            console.log("Your role has been added.");
            init();
          }
        );
      });
  });
}

function viewAllDepartments() {
  connection.query("SELECT * FROM department", function (err, res) {
    if (err) throw err;
    console.table(res);
    init();
  });
}

function viewAllRoles() {
  connection.query(
    "SELECT id, title, salary FROM role",
    function (err, res) {
      if (err) throw err;
      console.table(res);
      init();
    }
  );
}

function viewAllEmployees() {
  connection.query(
    "SELECT employee.first_name, employee.last_name, role.title, role.salary, department.name, CONCAT(e.first_name, ' ' ,e.last_name) AS Manager FROM employee INNER JOIN role on role.id = employee.role_id INNER JOIN department on department.id = role.department_id left join employee e on employee.manager_id = e.id;",
    function (err, res) {
      if (err) throw err;
      console.table(res);
      init();
    }
  );
}

function updateRoles() {
  connection.query(
    "SELECT employee.last_name, role.title FROM employee JOIN role ON employee.role_id = role.id;",
    function (err, res) {
      // console.log(res)
      if (err) throw err;
      console.log(res);
      inquirer
        .prompt([
          {
            type: "list",
            name: "lastName",
            message: "What is the Employee's last name? ",
            choices: function () {
              var lastName = [];
              for (var i = 0; i < res.length; i++) {
                lastName.push(res[i].last_name);
              }
              return lastName;
            },
          },
          {
            type: "list",
            name: "role",
            message: "What is the Employees new title? ",
            choices: selectRole,
          },
        ])
        .then(async function (response) {
          console.log(response);
          let role = response.role;
          let lastName = response.lastName;
          await connection.query(
            "UPDATE employee SET role_id = ? WHERE employee.last_name = ?;",
            [role, lastName],
            function (err) {
              if (err) throw err;
              console.log("employee has been updated");
              init();
            }
          );
        });
    }
  );
}

app.get("/", (req, res) => {
  res.send("Hello world!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
