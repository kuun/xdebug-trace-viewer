const Backbone = require('backbone');
const RecordTableInfo = require('../models/RecordTableInfo');
const RecordDetail = require('./RecordDetail');

class RecordTable extends Backbone.View {
  initialize() {
    this.el = '#grid';

    this.model = RecordTableInfo;

    this.grid = $('#grid')
      .w2grid({
        name: 'grid',
        show: {
          toolbar: true,
          footer: true,
        },
        multiSearch: true,
        searches: [
          {
            field: 'function',
            caption: 'Function',
            type: 'text',
          },
          {
            field: 'file',
            caption: 'File',
            type: 'text',
          },
        ],
        columns: [
          {
            field: 'function',
            caption: 'Function',
            size: '30%',
            sortable: true,
          },
          {
            field: 'funcNumber',
            caption: 'Function Number',
            size: '115px',
            sortable: true,
          },
          {
            field: 'time',
            caption: 'Time',
            size: '100px',
            sortable: true,
          },
          {
            field: 'timeUsage',
            caption: 'Time Usage',
            size: '150px',
            render: (record) => {
              const percent = (record.timeUsage / RecordTableInfo.totalTime()) * 100;
              return `${record.timeUsage}s (${percent.toFixed(2)}%)`;
            },
            sortable: true,
          },
          {
            field: 'mem',
            caption: 'Mem',
            size: '100px',
          },
          {
            field: 'memDelta',
            caption: 'Mem Delta',
            size: '100px',
          },
          {
            field: 'isUserDefined',
            caption: 'User Defined',
            size: '100px',
          },
          {
            field: 'file',
            caption: 'File',
            size: '30%',
          },
          {
            field: 'includeFile',
            caption: 'Include File',
            size: '100px',
          },
        ],
        records: [],
        toolbar: {
          items: [
            {
              type: 'check',
              id: 'showDetail',
              caption: w2utils.lang('Details'),
              hint: w2utils.lang('Show function call details'),
              onClick: () => this.onDetailClick(),
            },
          ],
          tooltip: 'bottom',
        },
        onSelect: (event) => this.onSelect(event),
      });
    this.grid.refresh();

    this.detailView = new RecordDetail({ model: this.model });

    this.listenTo(this.model, 'change:records', () => this.onRecordsChange());
  }

  onSelect(event) {
    const record = this.grid.get(event.recid);
    this.model.setSelectedRecord(record);
  }

  onDetailClick() {
    this.model.setShowDetail(!this.model.showDetail());
  }

  onRecordsChange() {
    this.grid.clear();
    this.grid.add(this.model.records());
    this.grid.refresh();
  }
}

module.exports = RecordTable;
