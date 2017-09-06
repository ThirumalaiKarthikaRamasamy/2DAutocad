

export default class Global {

    constructor () {

        //super()  

        this._map = null;

        this._comp1ID = 'urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6eGlhb2RvbmctcGVyc2lzdGVudC1idWNrZXQtZ2UveGlhb2RvbmctdGVzdC1jb21wLXJvdC0xLmR3Zw';
        this._comp2ID = 'urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6eGlhb2RvbmctcGVyc2lzdGVudC1idWNrZXQtZ2UveGlhb2RvbmctdGVzdC1jb21wLXJvdC0yLmR3Zw';
        this._mainID = 'urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6eGlhb2RvbmctcGVyc2lzdGVudC1idWNrZXQtZ2UveGlhb2RvbmctdGVzdC1JbnNlcnRzLU1haW4tTm8tTWFwLmR3Zw';

        this._harded_scale = 0.13;

        this._currentSelectedComp = 'component1';

        //models array for manage the drawing of the components in Viewer
        this._models = new Array();
        
        // some hard_coded parameters for this specific drawing
        // s: scale
        // x,y,z: position of the component
        this._hard_code_param =  {
                'plant':{s:1,x:0,y:0,r:0},
                'component1':{s:0.130,x:3,y:3.2,r:0},
                'component2':{s:0.130,x:5.5,y:3.2,r:0}, 
                'NewComp':{s:0.130,x:4.8,y:3.5,r:0} }; 

        // View State 
        // GEOCenter: current GEO center point
        // GEO Corner: top left and bottom right point of GEO
        // GEOZoomLevel: current zoom level of GEO map
        // TransArray: current info of each component
        //             [ dbid: db id of an object in Forge Viewer. not use. preserved for future
        //               compname:   component name. default two are component1 and component2, 
        //                           the new component is named with random ID
        //                matrix: current transformation of the component  

        this._viewState =  {
                //longitude, latitude , altitude (not set in this version)
                 GEOCenter: {longitude:116.3, latitude:40},  
                  //two points: longitude, latitude, altitude (not set in this version)
                 GEOCorner: [{longitude:116.29154567718506, latitude:40.00821841917377},
                             {longitude:116.30845432281494, latitude:39.99178088873711}],                             
                 GEOZoomLevel: 7, //not used with AutoCAD GEOLocation in this version
                 TransArray:[
                        {
                            dbid:1111, //
                            compname:'component1',
                            enthand:'6666dcc6', 
                            matrix:[this._hard_code_param['component1'].s,0,0,0,0,
                                this._hard_code_param['component1'].s,0,0,0,0,
                                this._hard_code_param['component1'].s,
                                0,
                                this._hard_code_param['component1'].x,
                                this._hard_code_param['component1'].y,0,
                                1]  
                        },
                        {
                            dbid:2222, // not use. preserved for future
                            compname:'component2',
                            enthand:'6767256a',
                            matrix:[this._hard_code_param['component2'].s,0,0,0,0,
                                this._hard_code_param['component2'].s,0,0,0,0,
                                this._hard_code_param['component2'].s,
                                0,
                                this._hard_code_param['component2'].x,
                                this._hard_code_param['component2'].y,0,
                                1] 
                        }
                     ]};
     } 

    // update view state before publishing or saving
    updateViewState()
    {  
        var mapViewBound =  this._map.getBounds();
        var mapCenter =  mapViewBound.center;
        var mapH = mapViewBound.height;
        var mapW = mapViewBound.width; 

        this._viewState .GEOCenter = {longitude:mapCenter.longitude, 
                                latitude:mapCenter.latitude};

        //left-top corner and right-bottom corner
        this._viewState .GEOCorner = [{longitude:mapCenter.longitude - mapW/2.0, 
                            latitude: mapCenter.latitude + mapH/2.0},
                            {longitude:mapCenter.longitude + mapW/2.0, 
                            latitude: mapCenter.latitude - mapH/2.0}]                 
        this._viewState .GEOZoomLevel = this._map.getZoom();

        for(var eachCompName in this._models ){
            if(eachCompName != 'plant')
            {
                if(eachCompName == 'component1' )
                {
                    this._viewState.TransArray[0].matrix= this._models[eachCompName].matrix; 
                }
                else if(eachCompName == 'component2')
                {  
                    this._viewState.TransArray[1].matrix= this._models[eachCompName].matrix; 
                }
            
                else{
                    var lastSavedNewComp = 
                        this._viewState.TransArray.find(x=>x.compname == eachCompName);

                    if(lastSavedNewComp){
                        //the new componenets from the last saved view state
                        lastSavedNewComp.matrix= this._models[eachCompName].matrix; 
                    }
                    else
                    {
                        //newly added componenets
                        this._viewState.TransArray.push({
                            dbid: 0,
                            enthand: "-1",
                            compname: this._models[eachCompName].modelName, 
                            matrix: this._models[eachCompName].matrix
                        })
                    }
                } 
            }
            
        } 
    }// end of updateViewState

     getHardScale()
     {
        return this._harded_scale;
     } 

       getCurrentSelectedComp()
     {
        return this._currentSelectedComp;
     } 

     setCurrentSelectedComp(v)
     {
        this._currentSelectedComp =v;
     }
 
     getMap()
     {
        return this._map;
     } 

     setMap(v)
     {
       this._map =v;
     }


       getModels()
     {
        return this._models;
     } 

     setModels(v)
     {
        this._models =v;
     }

    getHardCoded()
     {
        return this._hard_code_param;
     } 

     setHardCoded(v)
     {
        this._hard_code_param =v;
     }

     getViewState()
     {
        return this._viewState;
     } 

     setViewState(v)
     {
        this._viewState = v;
     }

      getMainID()
     {
        return this._mainID;
     }  

      getComp1ID()
     {
        return this._comp1ID;
     } 
 

      getComp2ID()
     {
        return this._comp2ID;
     } 
 
} 
 
 
 