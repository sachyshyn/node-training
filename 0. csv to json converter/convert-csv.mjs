import fs from "node:fs";
import readline from "node:readline";

const SEPARATORS = {
  comma: ",",
  slash: "|",
};

const commandArgs = process.argv.reduce(
  (acc, current, index, arr) => {
    if (index > 0 && index % 2 === 0) {
      const argKey = current.startsWith("--") ? current.slice(2) : current;

      acc[argKey] = arr[index + 1] || "";
    }

    return acc;
  },
  { separator: "comma" }
);

if (!commandArgs.source) {
  throw new Error("No source provided. Please provide path to the CSV file.");
}

if (!commandArgs.output) {
  throw new Error(
    "No output provided. Please provide path to the output JSON file."
  );
}

const separator = SEPARATORS[commandArgs.separator || "comma"];

function arrToObjectData(cols, arrBody) {
  return cols.reduce((acc, current, index) => {
    acc[current] = arrBody[index].trim();
    return acc;
  }, {});
}

const csvStream = fs.createReadStream(commandArgs.source);
const jsonStream = fs.createWriteStream(commandArgs.output, { flags: "w" });

const rl = readline.createInterface({
  input: csvStream,
  crlfDelay: Infinity,
});

let columns = [];
let isFirstLine = true;
let isFirstData = true;

jsonStream.write("[");

rl.on("line", (line) => {
  if (!line.trim()) return;

  if (isFirstLine) {
    columns = line.split(separator).map((header) => header.trim());
    isFirstLine = false;
  } else {
    const bodyData = line.split(separator);
    const jsonObject = arrToObjectData(columns, bodyData);

    if (!isFirstData) {
      jsonStream.write(",\n");
    }

    const jsonData = JSON.stringify(jsonObject);

    jsonStream.write(jsonData);
    console.log(jsonData);

    isFirstData = false;
  }
});

rl.on("close", () => {
  jsonStream.write("\n]");

  jsonStream.end(() => {
    console.log("Data converted from CSV to JSON successfully");
  });
});
