const Backbone = require('backbone');

class MainPage extends Backbone.View {
	initialize() {
		this.el = '#layout';
	}

	render() {
		$('#layout').w2layout({
			name: 'layout',
			panels: [
				{
					type: 'main', style: 'border-top: 0px;', content: '<div id="grid"></div>'
				}
			]
		});
		w2ui.layout.show('main');
	}
}

module.exports = MainPage;
