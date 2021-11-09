// create variable to hold db connection
let db;
// establish a connection to IndexedDB database and set it to version 1
const request = indexedDB.open("budget_tracker", 1);

// executes if DB version goes up
request.onupgradeneeded = function (event) {
  // save a reference to the database
  const db = event.target.result;
  // create an object store (table) and set it to have an auto incrementing primary key of sorts
  db.createObjectStore("new_budget", { autoIncrement: true });
};

request.onsuccess = function (event) {
  // on success save db as global variable
  db = event.target.result;
  db;

  // if online
  if (navigator.onLine) {
    uploadRecord();
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(["new_budget"], "readwrite");
  const budgetObjectStore = transaction.objectStore("new_budget");
  budgetObjectStore.add(record);
}

function uploadRecord() {
  const transaction = db.transaction(["new_budget"], "readwrite");

  const budgetObjectStore = transaction.objectStore("new_budget");

  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function () {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(["new_budget"], "readwrite");

          const budgetObjectStore = transaction.objectStore("new_budget");
          // clear all items in your store
          budgetObjectStore.clear();

          alert("All transactions uploaded!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

window.addEventListener("online", uploadRecord);
