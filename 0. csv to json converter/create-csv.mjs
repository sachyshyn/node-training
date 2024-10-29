import {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} from "node:worker_threads";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE_PATH = path.resolve(__dirname, "./data.csv");
const COLUMNS = ["id", "name", "createdAt"];
const ROW_COUNT = 1e8; // Approximately 10GB
const THREAD_COUNT = 4;

function* rowGenerator(startIndex, count) {
  for (let i = startIndex; i < startIndex + count; i++) {
    const id = i;
    const name = randomUUID();
    const createdAt = Date.now();
    yield `${id},${name},${createdAt}\n`;
  }
}

function runWorker(startIndex, rowCount) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename, {
      workerData: { startIndex, rowCount },
    });
    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

if (isMainThread) {
  const writeStream = fs.createWriteStream(FILE_PATH);
  writeStream.write(COLUMNS.join(",") + "\n");

  const rowsPerThread = Math.floor(ROW_COUNT / THREAD_COUNT);

  (async () => {
    try {
      for (let i = 0; i < THREAD_COUNT; i++) {
        const startIndex = i * rowsPerThread + 1;
        const rowCount =
          i === THREAD_COUNT - 1 ? ROW_COUNT - startIndex + 1 : rowsPerThread;
        await runWorker(startIndex, rowCount);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      writeStream.end();
      console.log("CSV file creation complete.");
    }
  })();
} else {
  const { startIndex, rowCount } = workerData;
  const generator = rowGenerator(startIndex, rowCount);
  const batch = [];

  for (const row of generator) {
    batch.push(row);
    if (batch.length >= 1000) {
      fs.appendFileSync(FILE_PATH, batch.join(""));
      batch.length = 0;
    }
  }
  if (batch.length > 0) {
    fs.appendFileSync(FILE_PATH, batch.join(""));
  }

  parentPort.postMessage(
    `Worker finished from ${startIndex} to ${startIndex + rowCount - 1}`
  );
}
