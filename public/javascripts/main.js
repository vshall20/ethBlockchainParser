const BASE_URL = 'http://localhost:3000';
let address;
const INCREMENT = 100;
const BLOCK_LIMIT = 1000;
let startblock = 0;
let endblock = 999999;
let period;
let start = startblock;
let end = startblock + BLOCK_LIMIT;
let finalResult = {};

let headers = [];

function showAlert(message, time = 3000) {
    let alert = $('#alert')[0];
    alert.innerHTML = message;
    alert.style.display = 'block';
    setTimeout(function () {
        alert.style.display = 'none';
    }, time);
}
$(document).ready(function () {
    ($('.progress')[0]).style.display = 'none';
    $("#submit").click(function (e) {
        e.preventDefault();
        $("#submit").attr('disabled', true);
        $("#getall").attr('disabled', true);
        resetVariables();
        address = $('#address').val();
        if (address.length <= 0) {
            showAlert('Please Enter an Address');
            $("#submit").attr('disabled', false);
            $("#getall").attr('disabled', false);
        } else {
            ($('.progress')[0]).style.display = 'block';
            ($('.progress')[0]).style.width = `0%`;
            ($('.progress-text')[0]).innerHTML = `Downloading data....`;
            period = parseFloat($('#period').val());
            console.log(period);
            let url = BASE_URL + '/analytics/getBlocks';
            if (period > 0) {
                url = `${url}?period=${period}`
            }
            $.get(url, (data, status) => {
                if (status === "success") {
                    startblock = data.data.startblock;
                    endblock = data.data.endblock;
                    console.log(startblock);
                    console.log(endblock);
                    let start = startblock;
                    let end = startblock + BLOCK_LIMIT;
                    if (end > endblock) {
                        end = endblock;
                    }
                    downloadData(start, end);
                }
            });
        }
    });

    $("#getall").click(function (e) {
        e.preventDefault();
        $("#submit").attr('disabled', true);
        $("#getall").attr('disabled', true);
        resetVariables();
        ($('.progress')[0]).style.display = 'block';
        ($('.progress')[0]).style.width = `0%`;
        ($('.progress-text')[0]).innerHTML = `Downloading data....`;
        period = parseFloat($('#period').val());
        console.log(period);
        let url = BASE_URL + '/analytics/getBlocks';
        if (period > 0) {
            url = `${url}?period=${period}`
        }
        $.get(url, (data, status) => {
            if (status === "success") {
                startblock = parseInt(data.data.startblock);
                endblock = parseInt(data.data.endblock);
                console.log(startblock);
                console.log(endblock);
                let start = startblock;
                let end = startblock + BLOCK_LIMIT;
                if (end > endblock) {
                    end = endblock;
                }
                downloadAllData(start, end);
            }
        });
    });

});

function updateProgress(current) {
    let progress = ((startblock - current) / (startblock - endblock) * 100).toFixed(2);
    ($('.progress')[0]).style.display = 'block';
    ($('.progress')[0]).style.width = `${progress}%`;
    ($('.progress-text')[0]).innerHTML = `${progress}% Downloaded`;
}

function downloadData(start, end) {
    $.get(`${BASE_URL}/analytics/getBatchAddressTransactions?apikey=hoyinfree&address=${address}&startblock=${start}&endblock=${end}`,
        (data, status) => {
            // console.log(status);
            // console.log(data.data);
            if (status === 'success') {
                updateProgress(end);
                parseData(data.data);

                start = end + 1;
                end = start + INCREMENT;
                if (end > endblock) {
                    end = endblock;
                }
                if (start < endblock) {
                    downloadData(start, end);
                } else {
                    console.log('Download Complete');
                    JSONToCSVConvertor(finalResult, address);
                    resetVariables();
                }
            }
        })
}

function downloadAllData(start, end) {
    $.get(`${BASE_URL}/analytics/getAllAddressTransactions?apikey=hoyinfree&startblock=${start}&endblock=${end}`,
        (data, status) => {
            // console.log(status);
            // console.log(data.data);
            if (status === 'success') {
                updateProgress(end);
                parseAllData(data.data);

                start = end + 1;
                end = start + INCREMENT;
                if (end > endblock) {
                    end = endblock;
                }
                if (start < endblock) {
                    downloadAllData(start, end);
                } else {
                    console.log('Download Complete');
                    JSONToCSVConvertorAll(finalResult, "AllAddressData");
                    resetVariables();
                }
            }
        })
}

function resetVariables() {
    address = null;
    startblock = 0;
    endblock = 999999;
    period = null;
    start = startblock;
    end = startblock + BLOCK_LIMIT;
    finalResult = {};
    headers = [];
    $("#submit").attr('disabled', false);
    $("#getall").attr('disabled', false);
    ($('.progress')[0]).style.display = 'none';
}

function parseData(data) {
    Object.entries(data).forEach(([key, value]) => {
        finalResult[key] = finalResult[key] ? finalResult[key] + value : value;
    });
}

function parseAllData(data) {
    Object.entries(data).forEach(([key, value]) => {
        let tempData = finalResult[key] || {};
        Object.entries(value).forEach(([key2, value2]) => {
            if(headers.indexOf(key2) == -1) {
                headers.push(key2);
            }
            tempData[key2] = tempData[key2] ? tempData[key2] + value2 : value2;
        });
        finalResult[key] = tempData;
    });
}

// 0x2a0c0dbecc7e4d658f48e01e3fa353f44050c208
function JSONToCSVConvertor(JSONData, ReportTitle) {
    //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
    var jsonData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
    console.log(jsonData);
    var CSV = '';
    //Set Report title in first row or line

    CSV += "Address: ," + ReportTitle + '\r\n\n';
    CSV += "Period: ," + period + " Day(s)" + '\r\n\n';
    CSV += "Start Block: ," + startblock + '\r\n\n';
    CSV += "End Block: ," + endblock + '\r\n\n';

    //This condition will generate the Label/Header
    var row = "";
    const fields = ['date', 'count'];
    //This loop will extract the label from 1st index of on array
    for (var index in fields) {

        //Now convert each value to string and comma-seprated
        row += fields[index] + ',';
    }

    row = row.slice(0, -1);

    //append Label row with line break
    CSV += row + '\r\n';

    console.log(CSV);
    Object.entries(jsonData).forEach(([key, value]) => {
        var row = '"' + key + '",' + '"' + value + '",';
        //add a line break after each row
        CSV += row + '\r\n';
    });

    if (CSV == '') {
        alert("Invalid data");
        return;
    }
    console.log(CSV);
    //Generate a file name
    var fileName = "";
    //this will remove the blank-spaces from the title and replace it with an underscore
    fileName += ReportTitle.replace(/ /g, "_");

    //Initialize file format you want csv or xls
    var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);

    // Now the little tricky part.
    // you can use either>> window.open(uri);
    // but this will not work in some browsers
    // or you will not get the correct file extension    

    //this trick will generate a temp <a /> tag
    var link = document.createElement("a");
    link.href = uri;

    //set the visibility hidden so it will not effect on your web-layout
    link.style = "visibility:hidden";
    link.download = fileName + ".csv";

    //this part will append the anchor tag and remove it after automatic click
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function JSONToCSVConvertorAll(JSONData, ReportTitle) {
    //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
    var jsonData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
    // console.log(jsonData);
    console.log(headers);
    var CSV = '';
    //Set Report title in first row or line
    // CSV += "Address: ," + ReportTitle + '\r\n\n';
    // CSV += "Period: ," + period + " Day(s)" + '\r\n\n';
    // CSV += "Start Block: ," + startblock + '\r\n\n';
    // CSV += "End Block: ," + endblock + '\r\n\n';

    //This condition will generate the Label/Header
    var row = "";
    headers.unshift('address');
    const fields = headers;
    //This loop will extract the label from 1st index of on array
    for (var index in fields) {

        //Now convert each value to string and comma-seprated
        row += fields[index] + ',';
    }

    row = row.slice(0, -1);

    //append Label row with line break
    CSV += row + '\r\n';

    // console.log(CSV);
    Object.entries(jsonData).forEach(([key, value]) => {
        var row = '"' + key + '",'
        Object.entries(value).forEach(([key2, value2]) => {
            row += '"' + value2 + '",';
        });
        //add a line break after each row
        CSV += row + '\r\n';
    });

    if (CSV == '') {
        alert("Invalid data");
        return;
    }
    // console.log(CSV);

    //Generate a file name
    var fileName = "";
    //this will remove the blank-spaces from the title and replace it with an underscore
    fileName += ReportTitle.replace(/ /g, "_");

    //Initialize file format you want csv or xls
    var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);

    // Now the little tricky part.
    // you can use either>> window.open(uri);
    // but this will not work in some browsers
    // or you will not get the correct file extension    

    //this trick will generate a temp <a /> tag
    var link = document.createElement("a");
    link.href = uri;

    //set the visibility hidden so it will not effect on your web-layout
    link.style = "visibility:hidden";
    link.download = fileName + ".csv";

    $('#result').jexcel({ csv:uri,csvHeaders:true, colWidths: [ 300, 80, 100 ] });


    //this part will append the anchor tag and remove it after automatic click
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
}
$('#download').on('click', function () {
    $('#result').jexcel('download');
})