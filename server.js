const express = require("express");
const mysql = require("mysql");
const inquirer = require("inquirer");
const cTable = require("console.table");
const util = require("util");

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
          "View All Employee's By Roles?",
          "View all Employees By Departments?",
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

        case "View All Employee's By Roles?":
          viewAllRoles();
          break;
        case "View all Employees By Departments?":
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

async function selectManager() {
  const managerQuery = `SELECT first_name, last_name, manager_id FROM employee WHERE manager_id IS NOT NULL;`;
  const query = await connection.query(managerQuery);
  const newArray = query.map((data) => {
    return data.title;
  });
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
        type: "list",
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

function addRoles() {
  connection.query(
    "SELECT role.title AS Title, role.salary AS Salary FROM role",
    function (err, res) {
      inquirer
        .prompt([
          {
            name: "Title",
            type: "list",
            message: "What is the roles Title?",
            choices: selectRole(),
          },
          {
            name: "Salary",
            type: "input",
            message: "What is the Salary?",
          },
        ])
        .then(function (response) {
          console.log(response);
          connection.query(
            "INSERT INTO role SET ?",
            {
              title: response.Title,
              salary: response.Salary,
            },
            function (err) {
              if (err) throw err;
              console.table(response);
              init();
            }
          );
        });
    }
  );
}

function viewAllDepartments() {
  console.log("hello");
  connection.query(
    "SELECT employee.first_name, employee.last_name, department.name AS Department FROM employee JOIN role ON employee.role_id = role.id JOIN department ON role.department_id = department.id ORDER BY employee.id;",
    function (err, res) {
      if (err) throw err;
      console.table(res);
      init();
    }
  );
}

function viewAllRoles() {
  connection.query(
    "SELECT employee.first_name, employee.last_name, role.title AS Title FROM employee JOIN role ON employee.role_id = role.id;",
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
