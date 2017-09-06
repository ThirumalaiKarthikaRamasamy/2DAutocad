import ManualTransform from './ManualTransform.js' 

//Manual Transform needs Viewer object, so have to initialize this class
// when Viewer is ready.

var _ManualTransform = null;

export default class Viewer2DWorkflow {

    constructor (global) {

        //super()
        this._global = global;

        this._viewer = null;

         this._hardCoded = this._global.getHardCoded();  
 
     }  

     initViewer()
     {
        var _this = this;

        $.get('/api/token',function(tokenResponse) {

            var token  = JSON.parse(tokenResponse).access_token; 
            var options = {
                        env: 'AutodeskProduction',
                        accessToken: token,
                        classThis:_this
                    };
 
                 Autodesk.Viewing.Initializer(options, function onInitialized(){
                       //console.log(options.global);
                       Autodesk.Viewing.Document.load(
                           options.classThis._global.getMainID(),
                           options.classThis.onDocumentLoadSuccess_Maindoc, 
                           options.classThis.onDocumentLoadFailure);
                });

                // It looks the static function of Viewer does not support ES6

                // Autodesk.Viewing.Initializer = (options)=>{
                //     console.log(_this._global.getMainID());
                //     Autodesk.Viewing.Document.load(
                //         _this._global.getMainID(), 
                //         _this.onDocumentLoadSuccess_Maindoc,
                //         _this.onDocumentLoadFailure);
                //  };
        }); 
     }

     //although the workflow of main document and component1 or component2 are same
     // I did not find a nice way they could consume the same functions.
     /// so some functions for main document only

    //when the main document is loaded
    onDocumentLoadSuccess_Maindoc =doc => {
        // A document contains references to 3D and 2D viewables.
        var viewables = Autodesk.Viewing.Document.getSubItemsWithProperties(
            doc.getRootItem(), {'type':'geometry'}, true);
        if (viewables.length === 0) {
            console.error('Document contains no viewables.');
            return;
        }

        // Choose the first avialble viewables
        var initialViewable = viewables[0];
        var svfUrl = doc.getViewablePath(initialViewable);
        var modelOptions = {
            sharedPropertyDbPath: doc.getPropertyDbPath(),
            modelSpace:true
            
        };

        var viewerDiv = document.getElementById('viewer3D_Plan');
            this._viewer = new Autodesk.Viewing.Private.GuiViewer3D(viewerDiv,{
         });

        this._viewer.start(svfUrl, 
                        modelOptions,
                        this.onLoadModelSuccess_Maindoc, 
                        this.onLoadModelError); 
    }
    
    // when document failed to be loaded
    onDocumentLoadFailure = viewerErrorCode=> {
        console.error('onDocumentLoadFailure() - errorCode:' + viewerErrorCode);
    }
    
    //when the main model is loaded
    onLoadModelSuccess_Maindoc = model => {
        console.log('onLoadModelSuccess_Maindoc!'); 
        
        this._viewer.addEventListener(
            Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
            this.onGeometryLoaded_Main);  

    }

    //when a model failed to be loaded
    onLoadModelError = viewerErrorCode => {
            console.error('onLoadModelError() - errorCode:' + viewerErrorCode);
    }  

    //main document is loaded
    onGeometryLoaded_Main =event =>
    {
         this._viewer.removeEventListener(
            Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
            this.onGeometryLoaded_Main);
    
        this._viewer.impl.disableRollover(true);
        var model = event.model;
        var modelName = 'plant';
    
        var models = this._global.getModels();
         models['plant'] = 
            {
                modelName:modelName,
                urn:this._global.getMainID(),
                model:model,
                iniParam:this._hardCoded[modelName],
                increParam:{x:0,y:0,r:0,s:1},
                oriBox:model.myData.bbox,
                curBox:model.myData.bbox.clone(),
                center:{x:0,y:0} 
            }; 
        
        var models = this._global.setModels(models);

        $('#guiviewer3d-toolbar').css('opacity', '1');  

        //is this a saved view?
        var requestID = Autodesk.Viewing.Private.getParameterByName('savedID'); 
        if(requestID  != '')
        {
            //if this is from a saved view
            //try to get the saved view info
            var _this = this;
            $.get(
                window.location.origin + 
                    '/designauto/getSavedView2DState/' +
                    requestID,
                function(res) {

                    if (res === 'failed') {
                    //if nothing returned, go to the default route.
                    console.log('get such file failed:' + requestID);
                    console.log('use the default view state:'); 
                    
                    //only two default components
                    var prosArray = ['component1','component2'];
                    _this.globalPromise(prosArray);  
                    
                }
                else
                {  
                    //get saved view info
                    var json =  eval('(' + res + ')');  
                    //store with the global variable
                    var viewState = json; 
                    _this._global.setViewState(viewState);

                    var prosArray = [];
                    //push every component. will load them one by one by Promise
                    for(var index in viewState.TransArray){
                        prosArray.push(viewState.TransArray[index].compname);
                    }
                    //load the components
                    _this.globalPromise(prosArray); 
                    //update the map with the state
                    //updateMap(); 

                } 
            });
        }
        else
        {
            //only two default components

            var prosArray = ['component1','component2'];
                this.globalPromise(prosArray);  
        }

        //is it the best time to initialize manual transform class?

        _ManualTransform = new ManualTransform(this._viewer,this._global);
        _ManualTransform.iniTransPanel();

    }    

    //get viewable from a document
    globalDocumentLoad = (doc,_onLoadModelSuccess,_onLoadModelError)=>
    {    
        var viewables = Autodesk.Viewing.Document.getSubItemsWithProperties(
                doc.getRootItem(), {'type':'geometry'}, true);
            if (viewables.length === 0) {
                console.error('Document contains no viewables.');
                return;
            }

            // Choose the first avialble viewables
            var initialViewable = viewables[0];
            var svfUrl = doc.getViewablePath(initialViewable); 
        
            var mat = new THREE.Matrix4();  

            mat.makeScale(this._global.getHardScale(),
                          this._global.getHardScale(),
                          1); 

            //input the transformation
            var loadOptions = {
                placementTransform: mat ,
                modelSpace:true,
                sharedPropertyDbPath: doc.getPropertyDbPath()
            };

             loadOptions.modelScale = this._global.getHardScale();  
         
            //load the model
            this._viewer.loadModel(svfUrl, 
                                    loadOptions,
                                    _onLoadModelSuccess,
                                    _onLoadModelError); 
    }

    //when the geometry of a model is loaded
    globalGeometryLoaded(modelName,model){ 
    

        var bbBox = model.myData.bbox; 

        var models = this._global.getModels();

        var hardcodedComName = modelName.contains('NewComp')?'NewComp':modelName; 
        
        //initial parameters for this model 
        models[modelName] =
            {
                modelName:modelName,
                urn:this._global.getComp1ID(),
                model:model,
                matrix:[1,0,0,0,0,
                        1,0,0,0,0,
                        1,
                        0,
                        this._hardCoded[hardcodedComName].x,
                        this._hardCoded[hardcodedComName].y,0,
                        1], 
                center:{x: (bbBox.max.x * this._hardCoded[hardcodedComName].s  + 
                            bbBox.min.x )/2.0 +this._hardCoded[hardcodedComName].x,
                        y: (bbBox.max.y  *this._hardCoded[hardcodedComName].s  + 
                            bbBox.min.y)/2.0 + this._hardCoded[hardcodedComName].y,
                        z:0} 
            };

             //adjust the position, rotation, and center of the model
            this.refreshWithSavedInfo(models[modelName]);    
        }  

        // load componenet with Promise
        globalPromise(proArray){

            var _this = this;
            var promises = [];
            
                for(var index in proArray){  
                    var promiseForDefaultComp = 
                        new Promise((resolve, reject)=>
                    { 
                        var modelName = proArray[index];
                         function _onDocumentLoadSuccess(doc) {
                                console.log('_onDocumentLoadSuccess()!');   
                                _this.globalDocumentLoad(doc,
                                                    _onLoadModelSuccess,
                                                    _onLoadModelError);  
                        };

                        function _onDocumentLoadFailure(viewerErrorCode) {
                            console.error('onDocumentLoadFailure() - errorCode:' + viewerErrorCode);
                        }

                        function _onLoadModelSuccess(model) {
                            console.log('_onLoadModelSuccess()!');  
                            _this._viewer.addEventListener(
                                Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
                                _onGeometryLoaded); 
                        };

                        function _onLoadModelError(viewerErrorCode) {
                            console.error('onLoadModelError() - errorCode:' + viewerErrorCode);
                            reject(modelName + ' loading failed!' + viewerErrorCode);
                        } 

                        function _onGeometryLoaded(evt){ 
                             _this.globalGeometryLoaded(modelName,evt.model);
                             _this._viewer.removeEventListener(
                                    Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
                                    _onGeometryLoaded); 

                            resolve(modelName + '  loaded!');  
                        }

                         Autodesk.Viewing.Document.load(
                            _this._global.getComp1ID(),
                            _onDocumentLoadSuccess,
                            _onDocumentLoadFailure );
                        
                    });

                    promises.push(promiseForDefaultComp);  
                }  

                //start promise
                Promise.all(promises).then(function(futures) {
                    console.log(futures);
                    //reset the position, rotation and center by the refreshed parameters 
                    _this.resetViewstate();  
                });
        }

        refreshWithSavedInfo(modelP){
            //if this is a newly added component in this view, nothing will happen
            //with this route because view state has not such component
            var viewState = this._global.getViewState();
            for(var index in viewState.TransArray){
                if(viewState.TransArray[index].compname == modelP.modelName){  
                    modelP.matrix = viewState.TransArray[index].matrix; 
                }
            } 
        }

            resetViewstate()
            {
                var models = this._global.getModels();
                for(var index in models){
                    if(index != 'plant')
                    {
                        var eachP = models[index];
                        this.resetModelTransform(eachP);  
                    }
                }   

                var cam = this._viewer.autocam;
                cam.resetHome(); 
            }  

            resetModelTransform(modelP){ 

                var fragCount = modelP.model.getFragmentList().
                    fragments.fragId2dbId.length
                for (var fragId = 0; fragId < fragCount; ++fragId) {
                    var mesh = this._viewer.impl.getRenderProxy(
                        modelP.model,
                        fragId)

                    var currentMatrix = mesh.matrixWorld; 
                    for(var index in currentMatrix.elements)
                    {
                        currentMatrix.elements[index] = modelP.matrix[index];
                    } 

                    mesh.material.modelScale =  0.13; 

                }
                 this._viewer.impl.sceneUpdated(true) ;    
             }  
}


   