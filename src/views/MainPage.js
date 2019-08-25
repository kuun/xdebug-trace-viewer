const Backbone = require('backbone');
const RecordTable = require('./RecordTable');

class MainPage extends Backbone.View {
	initialize() {
		this.el = '#layout';

		this.layout = $('#layout').w2layout({
			name: 'layout',
			panels: [
				{
					type: 'main', style: 'border-top: 0px;', content: '<div id="grid"></div>'
				}
			]
		});
		this.layout.show('main');
		this.recordTable = new RecordTable();
	}

}

module.exports = MainPage;
