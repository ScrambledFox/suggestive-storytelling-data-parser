const fs = require("fs");
const { parse } = require("csv-parse");
const { stringify } = require("csv-stringify");

const choiceLUT = {
  10: 8,
  11: 7,
  20: 9,
  21: 9,
  22: 9,
  30: 5,
  31: 6,
  40: 3,
  41: 4,
  50: 10,
  51: 10,
  60: 11,
  61: 11,
  70: 12,
  71: 13,
  80: 14,
  81: 15,
  90: 16,
  91: 16,
  100: 17,
  101: 17,
  110: 18,
  111: 19,
};

let firstRow = true;
let headers = [];

let choiceData = [];

let exportData = [
  ["Perspective", "Distopian", 0],
  ["Perspective", "Middle-ground", 0],
  ["Perspective", "Utopian", 0],
  ["Utopian", "Invest in lower community", 0],
  ["Utopian", "Invest in own community", 0],
  ["Middle-ground", "Destroy it", 0],
  ["Middle-ground", "Keep it open", 0],
  ["Distopian", "Destroy it", 0],
  ["Distopian", "Don't destroy it", 0],
  ["Don't destroy it", "Flee", 0],
  ["Destroy it", "New Life", 0],
  ["Keep it open", "Promotion", 0],
  ["Promotion", "Rebuild", 0],
  ["Promotion", "Upgrade", 0],
  ["New Life", "Rebuild", 0],
  ["New Life", "Flee", 0],
  ["Invest in own community", "Focus on yourself", 0],
  ["Invest in lower community", "After investing", 0],
  ["After investing", "Upgrade", 0],
  ["After investing", "Focus on yourself", 0],
];

if (process.argv.length < 3) {
  console.error("Please pass a data.csv file. Like: node index.js data.csv");
  return;
}

fs.createReadStream(process.argv[2])
  .pipe(parse({ delimiter: ",", escape: "\\" }))
  .on("data", (row) => {
    if (firstRow) {
      headers = row;
      firstRow = false;
      return;
    }

    const type = row[headers.findIndex((e) => e === "type")];
    if (type !== "choiceMade") {
      return;
    }

    const participantId = row[headers.findIndex((e) => e === "participantId")];
    if (participantId.includes("not_registered") || participantId === "-1") {
      return;
    }

    let recordId = -1;
    choiceData.forEach((record, index) => {
      if (record.id == participantId) {
        recordId = index;
      }
    });

    const promptId = row[headers.findIndex((e) => e === "promptOpinionId")];
    const madeChoiceId = row[headers.findIndex((e) => e === "madeChoiceId")];
    const choice = {
      prompt: promptId,
      choice: madeChoiceId,
    };

    if (recordId === -1) {
      choiceData.push({
        id: participantId,
        data: [choice],
      });
    } else {
      let dp = choiceData[recordId];
      dp.data.push(choice);
      choiceData[recordId] = dp;
    }
  })
  .on("end", () => {
    choiceData.forEach((e) => {
      e.data.forEach((route) => {
        let copy = [...exportData];

        if (route.prompt === "0") {
          copy[parseInt(route.choice)][2] += 1;
        } else {
          const combined = parseInt(route.prompt) * 10 + parseInt(route.choice);

          copy[choiceLUT[combined]][2] += 1;
        }

        exportData = copy;
      });
    });

    writeToCSV();
  });

const writeToCSV = async () => {
  stringify(exportData, (err, out) => {
    fs.writeFile(process.argv[2].split(".")[0] + "_data.csv", out, (err) => {});

    console.log("Written CSV data to 'data.csv'");
  });

  let matic = [];
  exportData.forEach((line) => {
    matic.push(`${line[0]} [${line[2]}] ${line[1]}`);
  });

  await fs.writeFileSync(
    process.argv[2].split(".")[0] + "_data-omatic.txt",
    matic.join("\n ")
  );
  console.log("Written OMATIC format data to 'data-omatic.txt'");
};
