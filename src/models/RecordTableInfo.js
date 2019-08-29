const Backbone = require('backbone');
const { ipcRenderer } = require('electron');
const readline = require('readline');
const fs = require('fs');

class RecordTableInfo extends Backbone.Model {
  initialize() {
    this.handleOpenFile();
  }

  static defaults() {
    return {
      showDetail: false,
      records: [],
      selectedRecord: null,
      totalTime: 0,
    };
  }

  records() {
    return this.get('records');
  }

  setRecords(records) {
    this.set({ records });
  }

  showDetail() {
    return this.get('showDetail');
  }

  setShowDetail(showDetail) {
    this.set({ showDetail });
  }

  selectedRecord() {
    return this.get('selectedRecord');
  }

  setSelectedRecord(selectedRecord) {
    this.set({ selectedRecord });
  }

  totalTime() {
    return this.get('totalTime');
  }

  setTotalTime(totalTime) {
    this.set({ totalTime });
  }

  handleOpenFile() {
    ipcRenderer.on('open-file', async (event, fileName) => {
      const promise = RecordTableInfo.parseTraceFile(fileName);
      promise.then((records) => {
        if (records.length > 0) {
          this.setTotalTime(records[0].timeUsage);
        }
        this.setRecords(records);
      }, (error) => {
        console.log(`can not open trace file: ${fileName}, error: ${error}`);
      });
    });
  }

  static parseLine(line) {
    const fields = line.split('\t', 30);
    const callInfo = {
      level: parseInt(fields[0]),
      funcNumber: parseInt(fields[1]),
      funcState: fields[2],
    };
    if (callInfo.funcState === '0') {
      // function enter
      callInfo.time = parseFloat(fields[3]);
      callInfo.mem = parseInt(fields[4]);
      callInfo.function = fields[5];
      callInfo.isUserDefined = fields[6] === '1';
      callInfo.includeFile = fields[7];
      callInfo.file = `${fields[8]}:${fields[9]}`;
      callInfo.arguments = [];
      const argumentCount = parseInt(fields[10]);
      for (let i = 0; i < argumentCount; i++) {
        callInfo.arguments.push(fields[i + 11]);
      }
    } else if (callInfo.funcState === '1') {
      callInfo.time = fields[3];
      callInfo.mem = fields[4];
    } else {
      callInfo.returnVal = fields[5];
    }
    return callInfo;
  }

  static parseTraceFile(fileName) {
    const records = [];
    const stack = [];
    let nextRecordId = 1;
    const lineReader = readline.createInterface({
      input: fs.createReadStream(fileName),
      crlfDelay: Infinity,
      console: false,
    });
    return new Promise((resolve, reject) => {
      lineReader.on('line', (line) => {
        if (line.startsWith('Version: ')) {
          return;
        }
        if (line.startsWith('File format:')) {
          if (line !== 'File format: 4') {
            reject(new Error('unsupported trace format, trace format must be 4'));
          }
          return;
        }
        if (line.startsWith('TRACE START')) {
          return;
        }
        if (!line.match(/^\d+\t\d+\t/)) {
          console.log(`skip invalid line: ${line}`);
          return;
        }

        const callInfo = RecordTableInfo.parseLine(line);
        callInfo.w2ui = { children: [] };
        if (callInfo.funcState === '0') {
          callInfo.recid = nextRecordId;
          nextRecordId += 1;
        }
        RecordTableInfo.addToRecordTree(records, stack, callInfo);
      });
      lineReader.on('close', () => {
        resolve(records);
      });
    });
  }

  static addToRecordTree(records, stack, callInfo) {
    let lastCall;

    if (stack.length > 0) {
      lastCall = stack[stack.length - 1];
    }
    if (callInfo.funcState === '0') {
      if (lastCall) {
        if (callInfo.level === lastCall.level) {
          callInfo.caller = lastCall.caller;
        } else {
          callInfo.caller = lastCall;
        }
      }
      if (!callInfo.caller) {
        records.push(callInfo);
      } else {
        callInfo.caller.w2ui.children.push(callInfo);
      }
      stack.push(callInfo);
    } else if (callInfo.funcState === '1') {
      while (callInfo.funcNumber !== lastCall.funcNumber && lastCall.exit) {
        stack.pop();
        lastCall = stack[stack.length - 1];
      }
      lastCall.timeUsage = callInfo.time - lastCall.time;
      lastCall.memDelta = callInfo.mem - lastCall.mem;
      lastCall.exit = true;
    } else {
      while (callInfo.funcNumber !== lastCall.funcNumber && lastCall.exit) {
        stack.pop();
        lastCall = stack[stack.length - 1];
      }
      lastCall.returnVal = callInfo.returnVal;
      stack.pop();
    }
  }
}

module.exports = new RecordTableInfo();
