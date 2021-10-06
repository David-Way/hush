#! /usr/bin/env node
const util = require('util');
const Table = require('easy-table');
const readline = require("readline");
const { exec } = require('child_process');
const chalk = require('chalk');
const log = console.log;

const CONST = {
  PROCESS_ID_IDENTIFIER: 'p',
  PROCESS_ID: 'pid',
  COMMAND_NAME_IDENTIFIER: 'c',
  COMMAND_NAME: 'commandName',
  FILE_NAME_IDENTIFIER: 'n',
  FILE_NAME: 'fileName',
  FILE_DESCRIPTOR_IDENTIFIER: 'f',
  FILE_DESCRIPTOR: 'fileDescriptor',
};
const OUTPUT_IDENTIFIER = [
  CONST.PROCESS_ID_IDENTIFIER,
  CONST.COMMAND_NAME_IDENTIFIER,
  CONST.FILE_NAME_IDENTIFIER,
  CONST.FILE_DESCRIPTOR_IDENTIFIER
].join('');
const lsof = `lsof -nP -iTCP -F ${OUTPUT_IDENTIFIER} -sTCP:LISTEN`;
const USER_PROMPT = [
  chalk.white('>'),
  chalk.red.bold('Select an Index to kill,'),
  chalk.red('"q" to quit: ')
].join(' ');

/*
 * Main function: Sets up users initial view of open files, listens for input and kills selected processes.
 * Returns a promise.
 */
function hush() {
  return new Promise(function (resolve, reject) {
    const inputReader = readline.createInterface(process.stdin, process.stdout);
    let referenceFileList;

    /* Initial File list menu */
    getListOfOpenFiles().then((fileList, error) => {
      if (error) reject();
      /* Store copy of the latest processes presented to the user, this is used to compare their selection against */
      referenceFileList = JSON.parse(JSON.stringify(fileList));
      printIndexedFileList(fileList).then(() => { /* Print table of currently running processes list */
        promptUser(inputReader);
      })
    }).catch((e) => { log('Error retrieving list of open files', e) });

    /* Listen for user input */
    inputReader.on('line', function (line) {
      /* Close input if the user exits application */
      if (line.toLowerCase() === "exit" || line.toLowerCase() === "quit" || line.toLowerCase() == 'q') {
        inputReader.close();
        return; /* Bail here, so inputReader.prompt() isn't called again */
      }

      /* Check to see if the user selected process remains a valid and running process */
      checkValidProcess(referenceFileList[line]).then(
        () => { /* Valid process selected */
          killProcess(referenceFileList[line]).then(
            () => {
              clearTerminal();
              getListOfOpenFiles().then(
                fileList => {
                  /* Update copy of the latest processes */
                  referenceFileList = JSON.parse(JSON.stringify(fileList));
                  printIndexedFileList(fileList).then(
                    () => promptUser(inputReader)
                  );
                }
              );
            }
          );
        },
        invalidSelection  => { /* Invalid process selected */
          clearTerminal();
          log('Err!', invalidSelection)
          getListOfOpenFiles().then(
            fileListReturned => {
              printIndexedFileList(fileListReturned).then(
                () => {
                  promptUser(inputReader);
                }
              );
            }
          );
        }
      );
    }).on('close', () => resolve('bye'));
  })
}

/*
 * Checks if a user selected file is valid
 */
function checkValidProcess(selectedFile) {
  return new Promise(function (resolve, reject) {
    getListOfOpenFiles().then((fileList, err) => {
      if (err) reject('Error:' + err);

      const result = fileList.filter(function (file) {
        return JSON.stringify(file) === JSON.stringify(selectedFile)
      });

      if (result && result.length === 1) /* Once matching process found */
        resolve();
      else
        reject();
    });
  });
}

/*
 * Kills a process for a given file
 */
function killProcess(selectedFile) {
  return new Promise(function (resolve, reject) {
    if (selectedFile && selectedFile[CONST.PROCESS_ID]) {
      exec(`kill -9 ${selectedFile[CONST.PROCESS_ID]}`, (error, stdout, stderr) => {
        if (error || stderr) reject(err + stderr);
        resolve();
      }).stdout.on('data', data => {
        resolve(data);
      });
    } else {
      reject('No file selected');
    }
  });
}

/*
 * Sets the terminal prompt for next user input
 */
function promptUser(reader) {
  reader.setPrompt(USER_PROMPT);
  reader.prompt();
}

/*
 * Execs the lsof command to return an array of objects representing the running processes
 */
function getListOfOpenFiles() {
  return new Promise(function (resolve, reject) {
    exec(lsof, (error, stdout, stderr) => {
      if (error || stderr) reject(err + stderr);
    }).stdout.on('data', (data) => {
      resolve(outputStringToDataStructure(data))
    })
  });
}

/*
 * Hard clears the users terminal
 */
function clearTerminal() {
  process.stdout.write("\u001b[3J\u001b[2J\u001b[1J");
  console.clear();
}

/*
 * Returns an array of objects from lsof output
 */
function outputStringToDataStructure(str) {
  const stringRows = str.split("\n");
  let objectRows = [];
  for (var i = 0; i < stringRows.length; i++) {
    const rowItem = stringRows[i];
    if (rowItem) {
      const key = mapFieldToKey(rowItem);
      const value = rowItem.substring(1); /* strip leading row identifier */
      if (key === CONST.PROCESS_ID) {
        objectRows.push({ [CONST.PROCESS_ID]: value });
      } else if (objectRows.length) {
        let lastElement = objectRows.pop();
        lastElement[key] = value;
        objectRows.push(lastElement);
      }
    }
  }
  return objectRows;
}

/*
 * Prints a formatted table of the file list array
 */
function printIndexedFileList(fileList) {
  return new Promise(function (resolve, reject) {
    if (fileList && fileList.length && fileList.length > 0) {
      var outputTable = new Table;
      fileList.forEach(function (file, index) {
        outputTable.cell('Index', chalk.red.bold(index));
        outputTable.cell('Command', file[CONST.COMMAND_NAME]);
        outputTable.cell('PID', file[CONST.PROCESS_ID]);
        outputTable.cell('Name', file[CONST.FILE_NAME]);
        outputTable.newRow();
      });
      log(outputTable.toString());
      resolve();
    } else {
      reject('Problem with fileList', fileList);
    }
  })
}

/*
 * Checks the indicator character for a given field and returns mapped key
 */
function mapFieldToKey(field) {
  switch (field.charAt(0)) { // check first character identifier
    case CONST.PROCESS_ID_IDENTIFIER:
      return CONST.PROCESS_ID;
    case CONST.COMMAND_NAME_IDENTIFIER:
      return CONST.COMMAND_NAME;
    case CONST.FILE_NAME_IDENTIFIER:
      return CONST.FILE_NAME;
    case CONST.FILE_DESCRIPTOR_IDENTIFIER:
      return CONST.FILE_DESCRIPTOR;
    default:
      break;
  }
}

async function run() {
  try {
    let hushResult = await hush();
    log(hushResult);
  } catch (err) {
    log('Error:', err);
  }
}

run();
