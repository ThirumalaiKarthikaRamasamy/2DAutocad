/////////////////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Xiaodong Liang 2017 - ADN/Forge of Autodesk
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////////////////

var express = require('express');
var request = require('request');
var router = express.Router();
var url = require('url');
var crypto = require('crypto');
var AdmZip = require('adm-zip');
var fs = require('fs');
var mkdirp = require('mkdirp');


fs.mkdir('items', function() {}); 

var config_design_auto = require('./config-design-auto');  
const _view2DStateJsonPrefix = './downloads/' + 'viewState2D-';
const _workItemStatusPrefix = './items/';

var siteUrl = '';
const _sourceDWG = 'https://s3-us-west-2.amazonaws.com/xiaodongforgetestio/xiaodong-test-Inserts-Source.dwg';
//const _inputViewStateForDA = siteUrl + 'designauto/getSavedView2DState/';
const _inputViewStateForDA = 'http://forge-ge-test.herokuapp.com/designauto/getSavedView2DState/';
const _downloadPath = './downloads/';
 
//********* DA Process*/ 

//download raw file
router.get('/downloadSavedView2DState/:filename', function (req, res) { 
     var filename =req.params.filename ;
     res.download(_inputViewStateForDA + filename+ '.json');
});

//get contents of a view state
router.get('/getSavedView2DState/:filename', function (req, res) { 
     var filename =req.params.filename ;
      fs.readFile(_view2DStateJsonPrefix + filename+ '.json', function(err, blob){
      if (err) {
        console.log(' Read File Failed: ' + filename + ' ' + err);
        res.send('failed');
      } else {
        console.log(' Read File Succeeded: ' + blob);
        res.send(blob);
      }
    });
});

//set a saved view stat, mainly for restore a state on client
router.get('/setSavedView2DState', function (req, res) { 

    //generate a random ID to identify this request
    var reqId = randomValueBase64(6);
    res.end(reqId);
    console.log('[Set Saved View 2D State]: ' + reqId);  

    //get submited parameters
    var args = url.parse(req.url, true).query;
 
    storeView2DState(reqId,args.viewstate);
});


//download an zip file of the result from DA
router.get('/downloadZip/:filename', function (req, res) {
    var filename =req.params.filename ;
    res.download(_downloadPath + filename);
}); 

//download the resport of DA (if a failed process)
router.get('/downloadReport/:filename', function (req, res) {
    var filename =req.params.filename ;
     res.download(_downloadPath + filename);
});  

//do the job of workitem
router.get('/submitworkitem2d', function (req, res) {

    //generate a random ID to identify this request
    var reqId = randomValueBase64(6);
    res.end(reqId);
    console.log('[Req: Submit Work Item]: ' + reqId);   

    siteUrl = 'http://' + req.get('host');
    console.log('   Site Url:　' +siteUrl);

    //get submited parameters
    var args = url.parse(req.url, true).query;
    //console.log('  State for Submit Work Item:　' + state);  

    //store the parameters to a file, indetified by request ID 
    storeView2DState(reqId,args.viewstate);

    //intial status of work item
    storeWorkItemStatus(reqId, 'InProgress...');  

  authorizeAndCall(function(design_automation_auth) { 
      //after getting valid token for design automation
      createWorkItem_Package2d(
          design_automation_auth,
          reqId,
          args); 
      });
});

router.get('/checkworkitem', function (req, res) {

   console.log('[Req: Check Work Item Status]');

    var args = url.parse(req.url, true).query;
      if (args.item) {
        fs.readFile('./items/' + args.item, function(err, blob){
          if (err) {
            console.log('   Chec Work Item File: ' + err);
            res.send( 'InProgress...');
          } else {
            console.log('   Returning item to caller (' + args.item + '): ' + blob);
            res.send(blob);
          }
        });
      }
});

module.exports = router;

function randomValueBase64 (len) {
  return crypto.randomBytes(Math.ceil(len * 3 / 4))
    .toString('base64')   // convert to base64 format
    .slice(0, len)        // return required number of characters
    .replace(/\+/g, '0')  // replace '+' with '0'
    .replace(/\//g, '0'); // replace '/' with '0'
}

function authorizeAndCall(success) {
  var params = {
    client_id: config_design_auto.credentials.consumerKey,
    client_secret: config_design_auto.credentials.consumerSecret,
    grant_type: 'client_credentials',
    scope: 'code:all'  
  }

    request.post(config_design_auto.baseUrl + config_design_auto.authUrl,
    { form: params },
    function (error, response, body) {
      if (error) {
        console.log(' Get Token Error: ' + error);
      }
      if (!error && response.statusCode == 200) {                

        var authResponse = JSON.parse(body);
        var auth = authResponse.token_type + ' ' + authResponse.access_token;

        console.log(' Get Token Succeeded: ' + auth);

        success(auth);
      } else {
        console.log(' Get Token  Unknown Status: ' + response.statusCode);        
      }
    }
  );
} 
function createWorkItem_Package2d(auth, reqId, args) {

      console.log(' Create WorkItem');

        //configure the work item
        var design_auto_params = {
        Arguments: {
          InputArguments: [
            {
              Name: 'HostDwg',
              Resource: _sourceDWG,
              StorageProvider: 'Generic'
            }, 
            {
              Name: 'transUrl',
              Resource: _inputViewStateForDA +reqId,
              StorageProvider: 'Generic' 
            } 
          ],
          OutputArguments: [
            {
              //will be a zip file
              Name: 'Result',
              StorageProvider: 'Generic',
              HttpVerb: 'POST',
              ResourceKind: 'ZipPackage'
            }
          ]
        },
        Id: '',
        ActivityId: config_design_auto.activityName
      }; 

  var postData = JSON.stringify(design_auto_params);
  
  var headers = {
    Authorization: auth,
    'Content-Type': 'application/json',
    'Content-Length': postData.length,
    Host: config_design_auto.hostName
  }

  console.log('  Creating work item (request length ' + postData.length + '): ' + postData);

  //submit the work item
  request.post({
    url: config_design_auto.baseUrl +config_design_auto.workItemsUrl,
    headers: headers,
    body: postData
  },
  function (error, response, body) {

    if (error) throw error;
    // Extract the Id and UserId from the WorkItem
    try {
      var workItem = JSON.parse(body);
      
      if (!workItem.Id) {
        console.log('   Problem with Request a Work Item: ' + workItem.Id);
        storeWorkItemStatus(reqId, 'Problem with Request a Work Item: ' + workItem.Id);
        return;
      }
      
      console.log(' Created work item (Id ' + workItem.Id + ')');
  
      // We're going to request the status for this WorkItem in a loop
      // We'll perform up to  100 checks, 2 seconds between each
  
      checkWorkItem(auth, workItem,
        function(remoteZip, report) {
            console.log(' Zip and Report');
            if (remoteZip) {
            downloadAndExtract(remoteZip, workItem.Id, reqId);
          }
          if (report) {
            downloadAndDisplay(report, workItem.Id);
          }
        },
        function (report) {
          console.log(' Only Report');
          storeWorkItemStatus(reqId, 'failed!report only!');
          if (report == 'Reached check limit') {
                storeWorkItemStatus(reqId, 'Reached check limit');
          }
          else
          { 
            downloadAndDisplay(report, workItem.Id);
          }
        }
      );
    }
    catch (ex) {
      console.log(' Problem with Request: ' + ex.toString());
      storeWorkItemStatus(reqId, 'exception:'+ ex.toString());
    }
  });
}

function checkWorkItem(auth, workItem, success, failure) {

  console.log(' Checking Work Item Status ' + workItem.Id);

  var checked = 0;
  
  var check = function() {
    setTimeout(
      function() {
        var url = config_design_auto.baseUrl +config_design_auto.workItemsUrl + 
        "(Id='" + workItem.Id + "')";
        
        request.get({
          url: url,
          headers: { Authorization: auth, Host: config_design_auto.hostName }
        },
        function (error, response, body) {
  
          if (error) throw error;
  
          if (response.statusCode == 200) {
            var workItem2 = JSON.parse(body);
  
            console.log('   Checked Status: ' + workItem2.Status);
  
            switch (workItem2.Status) {
              case 'InProgress':
              case 'Pending':
                if (checked < 100) {
                  checked++;
                  check();
                } else {
                  console.log(' Reached check limit.');
                  failure('Reached check limit');
                }
                break;
              case 'FailedDownload':
                failure(workItem2.StatusDetails.Report);
                break;
              case 'Succeeded':
                success(workItem2.Arguments.OutputArguments[0].Resource, 
                        workItem2.StatusDetails.Report);
                break;
              default:
                failure(workItem2.StatusDetails.Report);
            }
          }
        });
      },
      2000
    );
  }
  check();
}
 

function downloadAndExtract(remoteZip, workItemId, reqId) {

  var localRoot = _downloadPath + workItemId; 
  var localZip = localRoot + '.zip';

  console.log(' Downloading and Extracting Results ' + localZip);

  var r = request.get(remoteZip).pipe(fs.createWriteStream(localZip));
  r.on('finish',
    function() {
      //var zip = new AdmZip(localZip);
      //var entries = zip.getEntries(); 
      var success = true; 

      storeWorkItemStatus(reqId, success ? workItemId+'.zip' : 'download from Forge failed!');
    }
  );
} 

function downloadAndDisplay(report, workItemId) {
  
  console.log(' Downloading and Displaying Report');

  var localReport = _downloadPath + workItemId + ".txt"; 

  var r = request.get(report).pipe(fs.createWriteStream(localReport));
  r.on('finish',
    function() {
      console.log('   Report written to ' + localReport);
    }
  );
}

function unzipEntry(zip, file, path, entries) {
  
  if (entries.filter(function(val) { return val.entryName === file; }).length > 0) {
    zip.extractEntryTo(file, path, false, true);
    console.log('Extracted ' + path + '/' + file);
    return true;
  }
  return false;
}


//file storage
function storeWorkItemStatus(reqId, status) {
  try
  { 
      fs.openSync(_workItemStatusPrefix + reqId,'w');
      fs.writeFileSync(_workItemStatusPrefix + reqId, status);  
      console.log(' Store Work Item Status Done! ' + reqId);
  }
  catch (ex){
        console.log(' Store Work Item Status Failed! ' + reqId +  ' ' +  ex.toString()); 
  }

}

function storeView2DState(reqId, state) { 
  try
  { 
    fs.openSync(_view2DStateJsonPrefix + reqId + '.json','w');

    fs.writeFileSync(_view2DStateJsonPrefix + reqId + '.json', state); 
    console.log(' Store View 2D State Done!' + reqId);
  }
  catch (ex){
        console.log(' Store View 2D State Failed! ' + reqId +  ' ' +  ex.toString()); 
  }
  
}


//reserved for test only
router.get('/transformJson', function (req, res) { 
     res.download('./downloads/' + 'testTrans.json');
});
//reserved for test only
router.get('/transformJson2d', function (req, res) { 
      res.download('./downloads/' + 'testTrans2d.json');
}); 

