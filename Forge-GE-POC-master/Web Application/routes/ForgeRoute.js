var express =require ('express') ;

var router =express.Router () ;

var url = require('url'); 

var fs = require('fs'); 
  
var transformArray = [];

router.get ('/getTransList', function (req, res) { 
    
     res.send (transformArray) ; 
    
});

var blob = null;
router.post ('/updateTransList', function (req, res) { 
 
    transformArray =  req.body.transList;
    console.log(transformArray);
    res.send ('ok') ;
});
 

module.exports =router ;