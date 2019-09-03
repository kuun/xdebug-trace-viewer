const Backbone = require('backbone');
const RecordTableInfo = require('../models/RecordTableInfo');
const RecordDetail = require('./RecordDetail');
const StatisticsTable = require('./StatisticsTable');
const _ = require('lodash');

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
          toolbarSearch: false,
        },
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
              return `${record.timeUsage.toFixed(6)}s (${percent.toFixed(2)}%)`;
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
            render: (record) => (record.isUserDefined ? 'Yes' : 'No'),
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
              caption: 'Details',
              hint: 'Show function call details',
              onClick: () => this.onDetailClick(),
            },
            {
              type: 'button',
              caption: 'Statistics',
              hint: 'Show time usage statistics',
              onClick: () => new StatisticsTable(this.model),
            }
          ],
          tooltip: 'bottom',
        },
        onSelect: (event) => this.onSelect(event),
        onSearch: (event) => RecordTable.onSearch(event),
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

  static onSearch(event) {
    _.each(event.searchData, (data) => {
      // eslint-disable-next-line no-param-reassign
      data.operator = 'contains';
    });
  }
}

module.exports = RecordTable;
