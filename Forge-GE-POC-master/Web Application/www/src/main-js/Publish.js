 

export default class Publish {

    constructor (global) {

        //super() 
        this._global = global;

        this._spinner = undefined; 
      }  
        newPublish (){  

            this._global.updateViewState(); 

            //create spinner
            if ( this._spinner) {
                //spinner.spin($('#loading')[0]);
            } else {
            var opts = {
                    lines: 13 // The number of lines to draw
                    , length: 14 // The length of each line
                    , width: 14 // The line thickness
                    , radius: 24 // The radius of the inner circle
                    , scale: 1 // Scales overall size of the spinner
                    , corners: 1 // Corner roundness (0..1)
                    , color: '#f0f' // #rgb or #rrggbb or array of colors
                    , opacity: 0.25 // Opacity of the lines
                    , rotate: 0 // The rotation offset
                    , direction: 1 // 1: clockwise, -1: counterclockwise
                    , speed: 1 // Rounds per second
                    , trail: 60 // Afterglow percentage
                    , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
                    , zIndex: 2e9 // The z-index (defaults to 2000000000)
                    , className: 'spinner' // The CSS class to assign to the spinner
                    , top: '0' // Top position relative to parent
                    , left: '0' // Left position relative to parent
                    , shadow: false // Whether to render a shadow
                    , hwaccel: false // Whether to use hardware acceleration
                    , position: 'relative' // Element positioning
                    }
                
                this._spinner = new Spinner(opts);
            }

            var target = document.getElementById('loading')
             this._spinner.spin(target); 
            
            //prepare one upload   
            var viewStateStr = JSON.stringify(this._global.getViewState());  
            var args = {viewstate:viewStateStr};  

            console.log(args);
            
            //submit workitem 
            $('#btn-download').hide(); 
            $('#translateStatus').show(); 

            var _this = this;

            $.get(
                window.location.origin + '/designauto/submitworkitem2d?' + 
                        $.param(args),
                function(req, res) {
                    if (res === 'success') {
                        if (req !== '') {
                            _this.check(req, function(res2) {
                                if (res2.result) { 
                                     _this._spinner.stop();
                                    $('#btn-download').show();  
                                    _this.setLinkAndSizeTooltip('#btn-download',
                                            window.location.origin+'/designauto/downloadZip/' 
                                            +res2.result);
                                }
                                else
                                {
                                    
                                }
                            });
                        }
                    }
                }
            );
        } // end of new publish 

        setLinkAndSizeTooltip(id, url) {
        //findSize(url, function(size) 
        {
            var elem = $(id);
            elem.attr('onclick', 'window.location.href="' + url + '"');
        }
        //);
        }

        findSize(url, success) {
            var request;
            request = $.ajax({
                type: "HEAD",
                url: url,
                success: function () {
                success(request.getResponseHeader("Content-Length"));
                }
            });
        }

        //check the work item status
        check(id, fun) {
            var _this = this;
            setTimeout(
                function() {
                $.get(
                    window.location.origin + '/designauto/checkworkitem?item=' + id,
                    function(req, res) {
                    console.log('check workitem status:' + req + res);
                    if (req !== '') {
                        $('#translateStatus').text(req); 
                        if (req.contains('failed')) {
                             window.alert('Request failed, please check with admin or try again!');
                        } else if(req.contains('zip')){
                            fun({ result: req });
                        }
                        else{
                            _this.check(id, fun);
                        }
                    }
                    else{
                        check(id, fun);
                    }
                });
                },
                2000
            );
        } // end of newPublish 

        getShareURL(){
            
            this._global.updateViewState(); 

            //prepare one upload   
            var viewStateStr = JSON.stringify(this._global.getViewState());  
            var args = {viewstate:viewStateStr};  

            $.get(
                window.location.origin + '/designauto/setSavedView2DState?' + $.param(args),
                function(req, res) {
                    if (res === 'success') {
                        if (req !== '') {
                            window.open( window.location.origin+'/main-2d.html?savedID='+req);  
                        }
                        else
                        {
                            window.alert('Request failed, please check with admin or try again!');

                        }
                    }
                }
            );

        } // end of getShareURL


        iniPulishPanel()
        {  
            var _this = this;
            $("#btn-newPublish").click(function(evt){ 
                _this.newPublish (); 
            });  

            $("#btn-share").click(function(evt){ 
                _this.getShareURL (); 
            });  

            //translation process
            $('#btn-download').hide(); 
            //$('#translateStatus').hide(); 
        } // end of iniPulishPanel  

} 
 
 
 