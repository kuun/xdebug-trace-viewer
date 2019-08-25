const Backbone = require('backbone');
const { ipcRenderer } = require('electron');
const readline = require('readline');
const fs = require('fs');

class RecordTableInfo extends Backbone.Model {
  initialize() {
    this.handleOpenFile();
  }

  defaults() {
    return {
      showDetail: false,
      records: [],
      selectedRecord: null,
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

  handleOpenFile() {
    ipcRenderer.on('open-file', async (event, fileName) => {
      const records = await this.parseTraceFile(fileName);
      this.setRecords(records);
    });
  }

  parseLine(line) {
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
      callInfo.returnVal = fields[3];
    }
    return callInfo;
  }

  async parseTraceFile(fileName) {
    const records = [];
    const stack = [];
    let nextRecordId = 1;
    const lineReader = readline.createInterface({
      input: fs.createReadStream(fileName),
      crlfDelay: Infinity,
    });
    for await (const line of lineReader) {
      if (line.startsWith('Version: ')) {
        continue;
      }
      if (line.startsWith('File format:')) {
        if (line !== 'File format: 4') {
          throw 'unsupported trace format, trace format must be 4';
        }
        continue;
      }
      if (line.startsWith('TRACE START')) {
        continue;
      }
      if (!line.match(/^\d+\t\d+\t/)) {
        console.log(`skip invalid line: ${line}`);
        continue;
      }

      const callInfo = this.parseLine(line);
      callInfo.w2ui = { children: [] };
      let lastCall;
      if (stack.length > 0) {
        lastCall = stack[stack.length - 1];
      }
      if (callInfo.funcState === '0') {
        callInfo.recid = nextRecordId++;
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
        lastCall.timeUsage = (callInfo.time - lastCall.time).toFixed(6);
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
    lineReader.close();
    return records;
  }
}

module.exports = new RecordTableInfo();
