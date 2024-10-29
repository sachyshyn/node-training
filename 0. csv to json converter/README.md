# CSV to JSON Converter

This project provides two main commands:

1. **Creating a CSV file**
2. **Converting the CSV file to JSON**

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your system.

### Commands

1. **Create a CSV file**

   To generate a CSV file, run:

   ```bash
   node create-csv.mjs
   ```

2. **Convert the CSV file to a JSON file**

   To convert the file, run:

   ```bash
   node convert-csv.mjs --source ./data.csv --output ./data.json
   ```

   Optionally, there is a possibility to provide a separator (either comma or slash) adding --separator comma (or slash)
