const { ipcRenderer } = require('electron');
require('../third_party/w2ui-1.5.rc1/w2ui-1.5.rc1.js');

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
			footer: true
		},
		columns: [
			{ field: 'level', caption: 'Level', size: '60px' },
			{ field: 'funcNumber', caption: 'Function Number', size: '100px' },
			{ field: 'time', caption: 'Time', size: '100px' },
			{ field: 'timeUsage', caption: 'Time Usage', size: '100px' },
			{ field: 'mem', caption: 'mem', size: '100px' },
			{ field: 'function', caption: 'Function', size: '30%' },
			{ field: 'isUserDefined', caption: 'User Defined', size: '100px' },
			{ field: 'includeFile', caption: 'Include File', size: '100px' },
			{ field: 'file', caption: 'File', size: '100px' },
			{ field: '', caption: 'File', size: '100px' },
		],
		records: [
			//{ recid: 1, fname: 'John', lname: 'doe', email: 'jdoe@gmail.com', sdate: '4/3/2012', w2ui: { children: [] }}
		]
	});
	w2ui['grid'].refresh();

	function parseTraceFile(fileName) {

	}

	ipcMain.on('open-file', (event, fileName) => {
		w2alert(fileName);
		let traces = parseTraceFile(fileName);

	});
});
