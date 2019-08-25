const Backbone = require('backbone')
const ejs = require('ejs')

class RecordDetail extends Backbone.View {
	initialize () {
		this.listenTo(this.model, 'change:showDetail', () => this.toggleDetail())
		this.listenTo(this.model, 'change:selectedRecord', () => this.onRecordSelected())
		jsPanel.ziBase = 500
		this.panel = null
	}

	toggleDetail () {
		if (this.model.showDetail()) {
			this.createPanel()
		} else {
			this.closePanel()
		}
	}

	onRecordSelected () {
		if (this.model.showDetail()) {
			this.createPanel()
			this.renderDetail()
		}
	}

	createPanel () {
		if (!this.panel && this.model.showDetail() && this.model.selectedRecord()) {
			this.panel = jsPanel.create({
				headerTitle: 'Function call details',
				theme: 'light',
				position: 'right-bottom',
				contentSize: '550 700',
				contentOverflow: 'auto',
				headerControls: 'closeonly xs',
				content: '<div id="functionDetails"></div>',
				onclosed: () => {
					this.panel = null
				}
			})
		}
	}

	closePanel () {
		if (this.panel) {
			this.panel.close()
			this.panel = null
		}
	}

	renderDetail () {
		ejs.renderFile('src/views/FunctionCallDetails.ejs', {record: this.model.selectedRecord()}, {root: 'src'}, (err, str) => {
			if (err) {
				console.log('failed to render template, ', err)
				return
			}
			$('#functionDetails').html(str)
		})
	}
}

module.exports = RecordDetail
