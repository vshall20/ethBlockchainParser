const axios = require('axios');
var Web3 = require('web3');
const myApiKey = ['hoyinfree'];
var helper = require('sendgrid').mail;
var transactions = require('./transactions');
const Json2csvParser = require('json2csv').Parser;
const fs = require('fs');
var _ = require('lodash');
let base_url = 'http://api.ethplorer.io'

let HTTPProvider = 'https://mainnet.infura.io/ueMsufJK5QxoaganeO6G';

var web3 = new Web3(new Web3.providers.HttpProvider(HTTPProvider));
// console.log(web3.currentProvider);

let maxThreads = 200;

let wallet = '';
var apidata = [];
var addressdata = {};
var analytics = {};

analytics.getTokenHistoryGrouped = function (req, res) {
    console.log(req.query);
    let token = req.query.token || '0xf230b790e05390fc8295f4d3f60332c93bed42e2';
    let apiKey = 'freekey';
    let period = req.query.period || 90;
    let userkey = req.query.apikey;
    console.log(userkey);
    if (userkey === undefined || userkey === null || myApiKey.indexOf(userkey) == -1) {
        console.log('Invalid key');
        return res.status(404).json({
            success: false,
            msg: 'Invalid API Key!!',
            data: null
        });
    }

    let url = `${base_url}/getTokenHistoryGrouped/${token}?apiKey=${apiKey}&period=${period}`;
    console.log(url);
    axios.get(url)
        .then(response => {
            console.log(response.data);
            if (response.data && response.data.countTxs && response.data.countTxs.length > 0) {
                response.data.countTxs.forEach(txn => {
                    let date = `${txn._id.year}/${txn._id.month}/${txn._id.day}`;
                    txn.date = date;
                    txn._id = null;
                    delete txn._id;
                });
                const data = response.data.countTxs;
                const fields = Object.keys(data[0]);
                const json2csvParser = new Json2csvParser({
                    fields
                });
                const csv = json2csvParser.parse(data);
                // console.log(csv);
                fs.writeFile(`${token}.csv`, csv, function (err) {
                    if (err) throw err;
                    // console.log('file saved');
                    // res.status(200).json({success:true, msg:`Data for ${token}!!`, data:response.data.countTxs});
                    res.attachment(`${token}.csv`);
                    res.status(200).send(csv);
                    // res.status(200).send('file.csv');
                    fs.unlinkSync(`${token}.csv`);
                });
            } else {
                res.status(404).json({
                    success: false,
                    msg: 'Something went Wrong!!',
                    data: null
                });
            } 
        })
        .catch(error => {  
            console.log(error);
            res.status(404).json({
                success: false,
                msg: 'Something went Wrong!!',
                data: error
            }); 
        });
}

analytics.getBlocks = function (query, callback) {

    let period = query.period || 90;
    axios.get(`https://api.etherscan.io/api?module=proxy&action=eth_blockNumber`)
        .then((response) => {
            let endblock = parseInt(response.data.result, 16);
            let startblock = endblock - (86400 * period) / 15;
            console.log(startblock + "  " + endblock);
            callback(null, {
                startblock,
                endblock
            });
        })
        .catch((err) => {
            callback(err);
        })
}

analytics.getAddressTransactions = async function (query, callback) {
    console.log(query);
    let address = query.address || '0x2a0c0dbecc7e4d658f48e01e3fa353f44050c208';
    let email = query.email || 'vishal.dharmawat@gmail.com';
    wallet = address;
    let period = query.period || 90;
    let userkey = query.apikey;
    console.log(userkey);
    if (userkey === undefined || userkey === null || myApiKey.indexOf(userkey) == -1) {
        console.log('Invalid key');
        return res.status(404).json({
            success: false,
            msg: 'Invalid API Key!!',
            data: null
        });
    }
    let root_url = 'http://api.etherscan.io/api?module=account&action=txlist&'
    // https://api.trustwalletapp.com/transactions?address=0x2a0c0dbecc7e4d658f48e01e3fa353f44050c208&limit=500&startBlock=4386700&endBlock=4747999
    // http://api.etherscan.io/api?module=account&action=txlist&address=0x2a0c0dbecc7e4d658f48e01e3fa353f44050c208&startblock=0&endblock=99999999&page=100&offset=1000&sort=asc
    await axios.get(`https://api.etherscan.io/api?module=proxy&action=eth_blockNumber`)
        .then((response) => {
            let endblock = query.endblock || parseInt(response.data.result, 16);
            let startblock = query.startblock || endblock - (86400 * period) / 15;
            console.log(startblock + "  " + endblock);
            var totalBlocks = endblock - startblock;
            console.log(totalBlocks);
            apidata = [];
            scanBlockRange(startblock, endblock, (err, res) => {
                // console.log(err);
                // console.log(apidata);
                let result = _.countBy(apidata, 'date')
                // console.log(result);
                sendCsvAsMail(query, result, email);
                // callback(null, res);
            });
        })
        .catch((error) => {
            console.log(error);
            callback(error);
        });
}

var groupBy = function (xs, key) {
    return xs.reduce(function (rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};

var getData = function (address, startblock, endblock, page, apidata, callback) {
    // http://api.etherscan.io/api?module=account&action=txlist&address=0xB64ef51C888972c908CFacf59B47C1AfBC0Ab8aC&startblock=5443006&endblock=5961406&sort=asc&page=1&offset=1000
    let root_url = 'http://api.etherscan.io/api?module=account&action=txlist&'
    let url = `${root_url}address=${address}&startblock=${startblock}&endblock=${endblock}&page=${page}&offset=100`;
    console.log(url);
    axios.get(url)
        .then((data) => {
            console.log('>>>>>>>>>>>>>Response...');
            console.log(data.data);
            if (data.data.status === "1") {
                page++;
                data.data.result.forEach(doc => {
                    let date = new Date(doc.timeStamp * 1000);
                    let obj = {
                        timestamp: doc.timeStamp,
                        date: `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`,
                        from: doc.from,
                        to: doc.to,
                        value: doc.value
                    }
                    apidata.push(obj)
                });
                getData(address, startblock, endblock, page, apidata, callback)
            } else {
                if (apidata.length == 0) {
                    callback(data.data, null);
                } else {
                    callback(null, apidata);
                }
            }
        })
        .catch((error) => {
            console.log('>>>>>>>>>>>>>Error...');
            callback(error, null);
        })
}

function scanTransactionCallback(txn, block) {
    //    console.log(JSON.stringify(block, null, 4));
    //    console.log(JSON.stringify(txn, null, 4));

    if (wallet === null) {
        let date = new Date(block.timestamp * 1000);
        let from = txn.from && txn.from.toLowerCase() || '0x0';
        let to = txn.to && txn.to.toLowerCase() || '0x0';
        let obj = {
            blockNumber: txn.blockNumber,
            timestamp: block.timestamp,
            date: `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`,
            week: `${date.getWeekNumber()}`,
            from: from,
            to: to,
            value: txn.value,
            txHash: txn.hash
        }
        let fromtransaction = new transactions({
            forAddress:from,
            blockNumber: obj.blockNumber,
            fromAddress: obj.from,
            toAddress: obj.to,
            transactionHash: obj.txHash,
            timestamp: obj.timestamp,
            value: obj.value,
            week: obj.week,
            date: obj.date
        });
        fromtransaction.save((err, trans) => {
            if (err) {
                console.log(err);
            } else {
                // console.log(trans);
            }
        });

        let totransaction = new transactions({
            forAddress:to,
            blockNumber: obj.blockNumber,
            fromAddress: obj.from,
            toAddress: obj.to,
            transactionHash: "to"+obj.txHash,
            timestamp: obj.timestamp,
            value: obj.value,
            week: obj.week,
            date: obj.date
        });
        totransaction.save((err, trans) => {
            if (err) {
                console.log(err);
            } else {
                // console.log(trans);
            }
        });

        if (addressdata[from] && addressdata[from].length > 0) {
            addressdata[from].push(obj);
        } else {
            addressdata[from] = [obj];
        }
        if (addressdata[to] && addressdata[to].length > 0) {
            addressdata[to].push(obj);
        } else {
            addressdata[to] = [obj];
        }
    } else if ((txn.to && txn.to.toLowerCase() === wallet.toLowerCase()) || (txn.from && txn.from.toLowerCase() === wallet.toLowerCase())) {
        let date = new Date(block.timestamp * 1000);
        let obj = {
            timestamp: block.timestamp,
            date: `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`,
            week: `Week ${date.getWeekNumber()}`,
            from: txn.from,
            to: txn.to,
            value: txn.value
        }
        apidata.push(obj);
    }
    // if (txn.to && txn.to.toLowerCase() === wallet.toLowerCase()) {

    //     // A transaction credited ether into this wallet
    //     console.log(`${block.timestamp} from ${txn.from}`);

    // } else if (txn.from && txn.from.toLowerCase() === wallet.toLowerCase()) {

    //     // A transaction debitted ether from this wallet
    //     console.log(`${block.timestamp}  to ${txn.to}`);

    // }
}

Date.prototype.getWeekNumber = function () {
    var d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
    var dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
};

function scanBlockCallback(block) {

    if (block && block.transactions) {
        for (var i = 0; i < block.transactions.length; i++) {
            var txn = block.transactions[i];
            scanTransactionCallback(txn, block);
        }
    } else {
        console.log('No Transactions...');
    }
}


function scanBlockRange(startingBlock, stoppingBlock, callback) {
    // If they didn't provide an explicit stopping block, then read
    // ALL of the blocks up to the current one.

    if (typeof stoppingBlock === 'undefined') {
        stoppingBlock = web3.eth.blockNumber;
    }

    // If they asked for a starting block that's after the stopping block,
    // that is an error (or they're waiting for more blocks to appear,
    // which hasn't yet happened).

    if (startingBlock > stoppingBlock) {
        return -1;
    }

    let blockNumber = startingBlock,
        gotError = false,
        numThreads = 0,
        startTime = new Date();

    function getPercentComplete(bn) {
        var t = stoppingBlock - startingBlock,
            n = bn - startingBlock;
        return Math.floor(n / t * 100, 2);
    }

    function exitThread() {
        if (--numThreads == 0) {
            var numBlocksScanned = 1 + stoppingBlock - startingBlock,
                stopTime = new Date(),
                duration = (stopTime.getTime() - startTime.getTime()) / 1000,
                blocksPerSec = Math.floor(numBlocksScanned / duration, 2),
                msg = `Scanned to block ${stoppingBlock} (${numBlocksScanned} in ${duration} seconds; ${blocksPerSec} blocks/sec).`;
            console.log(msg);
            if (callback) {
                callback(gotError, stoppingBlock);
            }
        }
        return numThreads;
    }

    function asyncScanNextBlock() {

        // If we've encountered an error, stop scanning blocks
        if (gotError) {
            return exitThread();
        }

        // If we've reached the end, don't scan more blocks
        if (blockNumber > stoppingBlock) {
            return exitThread();
        }

        // Scan the next block and assign a callback to scan even more
        // once that is done.
        var myBlockNumber = blockNumber++;

        // Write periodic status update so we can tell something is happening
        if (myBlockNumber % maxThreads == 0 || myBlockNumber == stoppingBlock) {
            var pctDone = getPercentComplete(myBlockNumber);
            console.log(`Scanning block ${myBlockNumber} - ${pctDone} %`);
        }

        // Async call to getBlock() means we can run more than 1 thread
        // at a time, which is MUCH faster for scanning.

        web3.eth.getBlock(myBlockNumber, true, (error, block) => {

            if (error) {
                // Error retrieving this block
                gotError = true;
                console.error("Error:", error);
            } else {
                scanBlockCallback(block);
                asyncScanNextBlock();
            }
        });
    }

    var nt;
    for (nt = 0; nt < maxThreads && startingBlock + nt <= stoppingBlock; nt++) {
        numThreads++;
        asyncScanNextBlock();
    }

    return nt; // number of threads spawned (they'll continue processing)
}


var sendCsvAsMail = function (query, response, email) {

    const fields = ['address','week', 'count'];
    const json2csvParser = new Json2csvParser({
        fields
    });
    console.log('******');
    console.log(response);
    const keys = Object.keys(response);
    const values = Object.values(response);
    let csvData = [];

    response.forEach((entry) => {
        csvData.push({
            address: entry.address,
            week: entry.week,
            count: entry.transaction_count
        });
    });
    const csv = json2csvParser.parse(csvData);
    console.log(csv);
    let token = 'file';
    fs.writeFile(`${token}.csv`, csv, function (err) {
        if (err) throw err;

        // fs.unlinkSync(`${token}.csv`);
    });
    //   console.log(csv);
    sendmail({
        from: 'report@hoyin.org',
        to: email,
        replyTo: 'vishal.dharmawat@gmail.com',
        subject: 'Report for ' + token,
        html: 'Please check the attachment..',
        attachments: [{ // utf-8 string as an attachment
            filename: `${token}.csv`,
            content: csv
        }]
    }, null);

}

function sendmail(obj) {

    var from_email = new helper.Email(obj.from);
    var to_email = new helper.Email(obj.to);
    var subject = obj.subject;
    var content = new helper.Content('text/html', obj.html);
    var mail = new helper.Mail(from_email, subject, to_email, content);
    obj.attachments.forEach((attachment) => {
        let att = new helper.Attachment();
        console.log(attachment.content);
        let content = new Buffer(attachment.content, 'utf-8').toString('base64');
        console.log(content);
        att.setContent(content);
        att.setDisposition('attachment');
        att.setContentId('myTempId');
        att.setFilename(attachment.filename);
        console.log(att);
        mail.addAttachment(att);
    });

    var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
    var request = sg.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: mail.toJSON(),
    });

    sg.API(request, function (error, response) {
        console.log(response.statusCode);
        console.log(response.body);
        console.log(response.headers);
    });

}

analytics.getBatchAddressTransactions = function (query, callback) {
    console.log(query);
    let address = query.address || '0x2a0c0dbecc7e4d658f48e01e3fa353f44050c208';
    wallet = address;
    // let page = query.page || 1;
    // let offset = query.offset || 500;
    let userkey = query.apikey;
    let startblock = query.startblock || 0;
    let endblock = query.endblock || 99999999;
    console.log(userkey);
    if (userkey === undefined || userkey === null || myApiKey.indexOf(userkey) == -1) {
        console.log('Invalid key');
        return callback({
            msg: 'Invalid API Key!!',
            data: null
        });
    }
    apidata = [];
    scanBlockRange(startblock, endblock, (err, res) => {
        let result = _.countBy(apidata, 'date')
        console.log(result);
        callback(null, result);
    });
}

analytics.getAllAddressTransactions = function (query, callback) {
    console.log(query);
    wallet = null;
    let userkey = query.apikey;
    let startblock = query.startblock || 0;
    let endblock = query.endblock || 99999999;
    console.log(userkey);
    if (userkey === undefined || userkey === null || myApiKey.indexOf(userkey) == -1) {
        console.log('Invalid key');
        return callback({
            msg: 'Invalid API Key!!',
            data: null
        });
    }
    addressdata = {};
    scanBlockRange(startblock, endblock, (err, res) => {
        // console.log(addressdata);

        /**
         * { 
    $group: { // each position and age group have an array of jerseys
      _id:   { position: "$position", ageGroup: "$ageGroup" }, 
      jerseys: { $push: "$$ROOT" } 
    } 
  }, 
  { 
    $group: { // for each age group, create an array of positions
      _id: { ageGroup: "$_id.ageGroup" }, 
      positions: { $push: { position: "$_id.position", jerseys:"$jerseys" } } 
    } 
  } 
         */
        let finalResult = {};
        // Object.entries(addressdata).forEach(([key, value]) => {
        //     let result = _.countBy(value, 'week') //week: `Week ${date.getWeekNumber()}`,
        //     finalResult[key] = result;
        // });
        // console.log(finalResult);
        callback(null, finalResult);
    });
}

analytics.getEmail = (query, callback) => {
    let email = query.email,
        start = query.startblock,
        end = query.endblock;
    
    let userkey = query.apikey;

    if (userkey === undefined || userkey === null || myApiKey.indexOf(userkey) == -1) {
        console.log('Invalid key');
        return callback({
            msg: 'Invalid API Key!!',
            data: null
        });
    }

    transactions.aggregate([
        {
            $group: {
                _id: {
                    address: "$forAddress",
                    week: "$week"
                },
                transaction_count: {
                    $sum: 1
                }
            }
        }, {
            $project: {
                _id:0,
                address:'$_id.address',
                week: '$_id.week',
                transaction_count: '$transaction_count'
            }
        }
    ], (err, trans) => {
        if (err || trans & trans.length == 0) {
            console.log(err);
            callback(err, null);
        } else {
            console.log(trans);
            sendCsvAsMail(null, trans, email)
            callback(null, 'Email');
        }
    })

}

module.exports = analytics;