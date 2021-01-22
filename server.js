const express = require("express");
const mysql = require("mysql");
const inquirer = require("inquirer");

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

function init() {
  inquirer
    .prompt([
      {
        type: "list",
        message: "What would you like to do?",
        name: "choice",
        choices: [
          "View All Employees?",
          "View All Employee's By Roles?",
          "View all Emplyees By Deparments",
          "Update Employee",
          "Add Employee?",
          "Add Role?",
          "Add Department?",
        ],
      },
    ])
    .then(function (val) {
      switch (val.choice) {
        case "View All Employees?":
          viewAllEmployees();
          break;

        case "View All Employee's By Roles?":
          viewAllRoles();
          break;
        case "View all Emplyees By Deparments":
          viewAllDepartments();
          break;

        case "Add Employee?":
          addEmployee();
          break;

        case "Update Employee":
          updateEmployee();
          break;

        case "Add Role?":
          addRole();
          break;

        case "Add Department?":
          addDepartment();
          break;
      }
    });
}

const roleArr = [];
function selectRole() {
  connection.query("SELECT * FROM role", function (err, res) {
    if (err) throw err;
    for (let i = 0; i < res.length; i++) {
      roleArr.push(res[i].title);
    }
  });
  return roleArr;
}

const managersArr = [];
function selectManager() {
  connection.query(
    "SELECT first_name, last_name FROM employee WHERE manager_id IS NULL",
    function (err, res) {
      if (err) throw err;
      for (const i = 0; i < res.length; i++) {
        managersArr.push(res[i].first_name);
      }
    }
  );
  return managersArr;
}

function addDepartment() {
  inquirer
    .prompt([
      {
        type: "input",
        name: "first name",
        message: "Enter their first name",
      },
      {
        type: "input",
        name: "last name",
        message: "Enter their last name",
      },
      {
        type: "input",
        name: "role",
        message: "Enter their role",
        choices: selectRole(),
      },
      {
        type: "input",
        name: "manager list",
        message: "Enter their manager's name",
        choices: selectManager(),
      },
    ])
    .then((response) => {
      const roleId = selectRole().indexOf(response.role) + 1;
      const managerId = selectManager().indexOf(response.choice) + 1;
      connection.query(
        "INSERT INTO employee SET ?",
        {
          first_name: response.first_name,
          last_name: response.last_name,
          managerId: managerId,
          role_id: roleId,
        },
        function (err) {
          if (err) throw err;
          console.table(response);
          init();
        }
      );
    });
}

function addRoles() {}

function addEmployees() {}

function viewDepartment() {}

function viewRoles() {}

function viewEmployees() {}

function updateDepartment() {}

function updateRoles() {}

function updateEmployees() {}

app.get("/", (req, res) => {
  res.send("Hello world!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
