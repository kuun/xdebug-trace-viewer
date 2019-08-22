const { ipcRenderer } = require('electron');
const readline = require('readline');
const fs = require('fs');

$(function () {
	$('#layout').w2layout({
		name: 'layout',
		panels: [
			{
				type: 'main', style: 'border-top: 0px;', content: '<div id="grid"></div>'
			}
		]
	});
	w2ui.layout.show('main');

	$('#grid').w2grid({
		name: 'grid',
		show: {
			toolbar: true,
			footer: true
		},
		columns: [
			{ field: 'level', caption: 'Level', size: '150px' },
			{ field: 'funcNumber', caption: 'Function Number', size: '100px' },
			{ field: 'time', caption: 'Time', size: '100px' },
			{ field: 'timeUsage', caption: 'Time Usage', size: '100px', render: (record) => record.timeUsage.toFixed(6)},
			{ field: 'mem', caption: 'Mem', size: '100px' },
			{ field: 'memDelta', caption: 'Mem Delta', size: '100px'},
			{ field: 'function', caption: 'Function', size: '30%' },
			{ field: 'isUserDefined', caption: 'User Defined', size: '100px' },
			{ field: 'file', caption: 'File', size: '30%' },
			{ field: 'includeFile', caption: 'Include File', size: '100px' }
		],
		records: [
			//{ recid: 1, fname: 'John', lname: 'doe', email: 'jdoe@gmail.com', sdate: '4/3/2012', w2ui: { children: [] }}
		]
	});
	w2ui['grid'].refresh();

	function parseLine(line) {
		let fields = line.split('\t', 30);
		let callInfo = {
			level: parseInt(fields[0]),
			funcNumber: parseInt(fields[1]),
			funcState: fields[2]
		}
		if (callInfo.funcState === '0') {
			// function enter
			callInfo.time = parseFloat(fields[3]);
			callInfo.mem = parseInt(fields[4]);
			callInfo.function = fields[5];
			callInfo.isUserDefined = fields[6] === '1';
			callInfo.includeFile = fields[7];
			callInfo.file = fields[8] + ':' + fields[9];
			callInfo.arguments = [];
			let argumentCount = parseInt(fields[10]);
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

	async function parseTraceFile(fileName) {
		let records = [];
		let stack = [];
		let nextRecordId = 1;
		let lineReader = readline.createInterface({
			input: fs.createReadStream(fileName),
			crlfDelay: Infinity
		});
		for await (const line of lineReader) {
			if (line.startsWith("Version: ")) {
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

			let callInfo = parseLine(line);
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
		lineReader.close();
		return records;
	}

	ipcRenderer.on('open-file', async (event, fileName) => {
		let records = await parseTraceFile(fileName);
		w2ui.grid.add(records);
		w2ui.grid.clear();
		w2ui.grid.refresh();
	});
});
