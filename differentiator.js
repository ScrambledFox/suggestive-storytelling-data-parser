const fs = require("fs");
const { parse } = require("csv-parse");
const { stringify } = require("csv-stringify");

let data1 = [];
let data2 = [];

let firstDone = false;
let secondDone = false;

fs.createReadStream(process.argv[2])
  .pipe(parse({ delimiter: ",", escape: "\\" }))
  .on("data", (row) => {
    data1.push(row);
  })
  .on("end", () => {
    firstDone = true;
    tryToDifferentiate();
  });

fs.createReadStream(process.argv[3])
  .pipe(parse({ delimiter: ",", escape: "\\" }))
  .on("data", (row) => {
    data2.push(row);
  })
  .on("end", () => {
    secondDone = true;
    tryToDifferentiate();
  });

const writeToCSV = async (data) => {
  stringify(data, (err, out) => {
    fs.writeFile("data-diff.csv", out, (err) => {});

    console.log("Written difference CSV data to 'data-diff.csv'");
  });

  let matic = [];
  data.forEach((line) => {
    matic.push(`${line[0]} [${line[2]}] ${line[1]}`);
  });

  await fs.writeFileSync("data-omatic-diff.txt", matic.join("\n "));
  console.log(
    "Written difference OMATIC format data to 'data-omatic-diff.txt'"
  );
};

const tryToDifferentiate = () => {
  if (firstDone && secondDone) {
    let copy = [...data1];
    copy.forEach((element, index) => {
      element[2] -= data2[index][2];
    });

    writeToCSV(copy);
  }
};
