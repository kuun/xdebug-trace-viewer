const Backbone = require('backbone');
const _ = require('lodash');

class StatisticsTable extends Backbone.View {
  initialize(model) {
    this.model = model;
    this.render();
    this.analyzeTimeUsage();
  }

  render() {
    w2popup.open({
      width: 800,
      height: 500,
      showMax: true,
      modal: true,
      title: 'Time Usage Statistics',
      body: '<div id="statsTable" style="width: 100%; height: 100%;"></div>',
      onClose: () => {
        this.statsTable.destroy();
      },
    });
    this.statsTable = $('#statsTable').w2grid({
      name: 'statsTable',
      tooltip: 'bottom',
      recid: 'function',
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
      ],
      columns: [
        {
          field: 'function',
          caption: 'Function',
          size: '30%',
          sortable: true,
        },
        {
          field: 'timeUsage',
          caption: 'Time Usage',
          size: '180px',
          render: (record) => {
            if (!record.timeUsage) {
              return '';
            }
            const percent = (record.timeUsage / this.model.totalTime()) * 100;
            return `${record.timeUsage.toFixed(6)}s (${percent.toFixed(2)}%)`;
          },
          sortable: true,
        },
        {
          field: 'calledCount',
          caption: 'Called Count',
          size: '100px',
          sortable: true,
        },
        {
          field: 'isUserDefined',
          caption: 'User Defined',
          size: '100px',
          sortable: true,
          render: (record) => (record.isUserDefined ? 'Yes' : 'No'),
        },
      ],
      onSearch: (event) => StatisticsTable.onSearch(event),
    });
    this.statsTable.refresh();
    // w2popup.lock('Analyzing time usage', true);
  }

  analyzeTimeUsage() {
    const records = this.model.records();
    const timeUsageMap = {};

    this.calculateTimeUsage(records, timeUsageMap);

    this.timeUsages = _.map(timeUsageMap, (timeUsage) => timeUsage);
    this.statsTable.add(this.timeUsages);
    this.statsTable.sort('timeUsage', 'desc');
    this.statsTable.refresh();
    // w2popup.unlock();
  }

  calculateTimeUsage(records, timeUsageMap) {
    _.each(records, (record) => {
      let timeUsage = timeUsageMap[record.function];
      if (!timeUsage) {
        timeUsage = {
          function: record.function,
          timeUsage: record.timeUsage,
          calledCount: 1,
          isUserDefined: record.isUserDefined,
        };
      } else {
        if (!StatisticsTable.isRecursiveCall(record)) {
          timeUsage.timeUsage += record.timeUsage;
        }
        timeUsage.calledCount += 1;
      }
      // eslint-disable-next-line no-param-reassign
      timeUsageMap[record.function] = timeUsage;
      if (record.w2ui.children.length > 0) {
        this.calculateTimeUsage(record.w2ui.children, timeUsageMap);
      }
    });
  }

  static isRecursiveCall(record) {
    const { caller } = record;
    if (!caller) {
      return false;
    }
    return StatisticsTable.isFuncSameWithCaller(caller, record.function);
  }

  static isFuncSameWithCaller(record, funcName) {
    if (record.function === funcName) {
      return true;
    }
    const { caller } = record;
    if (!caller) {
      return false;
    }
    return StatisticsTable.isFuncSameWithCaller(caller, funcName);
  }

  static onSearch(event) {
    _.each(event.searchData, (data) => {
      // eslint-disable-next-line no-param-reassign
      data.operator = 'contains';
    });
  }
}

module.exports = StatisticsTable;
