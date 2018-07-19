var express = require('express');
var router = express.Router();
var analytics = require('../model/analytics');

const Json2csvParser = require('json2csv').Parser;
const fs = require('fs');

/* GET users listing. */
router.get('/getTokenHistoryGrouped', function (req, res, next) {
  analytics.getTokenHistoryGrouped(req, res);
});

router.get('/getAddressTransactions', function (req, res, next) {
  // console.log(req.query);
  analytics.getAddressTransactions(req.query, (err, response) => {

    if (err) {
      res.status(404).json({
        success: false,
        msg: 'Something went Wrong!!',
        data: err
      });
    } else {
      const fields = ['date','count'];
      const json2csvParser = new Json2csvParser({
        fields
      });
      const keys = Object.keys(response);
      const values = Object.values(response);
      let csvData = [];
      let i=0;
      keys.forEach((key)=>{
        csvData.push({date:key,count:values[i]});
        i++;
      });
      const csv = json2csvParser.parse(csvData);
      let token = req.query.address || 'file';
      fs.writeFile(`${token}.csv`, csv, function (err) {
        if (err) throw err;
        // console.log('file saved');
        // res.status(200).json({success:true, msg:`Data for ${token}!!`, data:response.data.countTxs});
        res.attachment(`${token}.csv`);
        res.status(200).send(csv);

        fs.unlinkSync(`${token}.csv`);
      });
    }
  });
  res.status(200).json({success:true,msg:'Response will be emailed!'});
});

module.exports = router;
