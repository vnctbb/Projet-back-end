'use strict'

const treatmentDataBase = require('module-database');

let dataBase;

treatmentDataBase.find({
  collection : 'events',
  done : (datas) => {
    dataBase = datas;
  }
});

exports = dataBase;