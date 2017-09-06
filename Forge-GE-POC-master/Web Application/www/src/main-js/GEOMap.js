 
export default class GEOMap {

    constructor (global) {

        //super()

        this._global = global;

        this._Map = null;
        this.mapMouseMoveHandler = null;
        this.mapViewChangeHandler = null;
        this.mapCenter = null;
        this.mapZoomLevel = 1; 
     } 

    GEOAddress()
    {   
        var _this = this;
         Microsoft.Maps.loadModule('Microsoft.Maps.Search', 
             { callback: _this.searchModuleLoaded });
    }  

    searchModuleLoaded = () =>
    {   
        var _this = this;
        var search = new Microsoft.Maps.Search.SearchManager(_this._Map);
        var address = $("#address").val();
        search.geocode({where:address, count:10, callback:_this.geocodeCallback}); 
    }

    geocodeCallback = (geocodeResult, userData) =>
    {
        console.log('geocodeCallback');
        if(geocodeResult.results.length > 0)
        {
            var width = Number($("#geowidth").val())==0?1:Number($("#geowidth").val()); 
            var height = Number($("#geowidth").val())==0?1:Number($("#geowidth").val()); 

            var location = geocodeResult.results[0].location;
            var viewRect = new Microsoft.Maps.LocationRect(
                new Microsoft.Maps.Location(location.latitude,location.longitude), 
                width/111.0,height/111.0);

            this._Map.setView({bounds: viewRect});

            var center = this._Map.getCenter();

            //Add a pin to the center of the map, using a custom icon
            //var pin = new Microsoft.Maps.Pushpin(center,
            //    {icon: './images/BluePushpin.png', width: 50, height: 50, draggable: true}); 

            //this._Map.entities.push(pin);
        }
        else
        {
            alert('no result!');
        } 
    } 

    resetMapViewEvent = (e) =>
    {
        this._Map.setView({center:this.mapCenter,
                           zoom:this.mapZoomLevel});
        e.Handled = true;
    } 
    

    iniNaviPanel()
    { 
        var _this = this;
        console.log('Initialize GEO Panel');
        //map
        this._Map = new Microsoft.Maps.Map(document.getElementById("mapDiv"), 
                                    {credentials:"AsytZYNn8sAluh0CG6aBiYA26qL3Cod9MxiadFTrIVKi_kGvB9AN7D3mwJFTbz3v",
                                    showBreadcrumb:true});

        this._global.setMap(this._Map);

        var viewRect = Microsoft.Maps.LocationRect.fromCorners(
            new Microsoft.Maps.Location(37.48,-122.25), 
            new Microsoft.Maps.Location(37.40,-122.00)); 

        this._Map.setView({bounds: viewRect});

        $("#btn-get-address").click(function(evt){ 
            _this.GEOAddress();
        });  

        $("#btn-location").click(function(evt){ 
                var long = Number($("#longitude").val())==0?120:Number($("#longitude").val()); 
                var lati = Number($("#latitude").val())==0?-40:Number($("#latitude").val());        

                var width = Number($("#geowidth").val())==0?1:Number($("#geowidth").val()); 
                var height = Number($("#geowidth").val())==0?1:Number($("#geowidth").val()); 

                // It is a GEO 'rectangle' area. Some addtional algorism is required to have a precie
                // ratio of width and height. currently, hard-coded with 111.0 which is for the location
                // of equator. 
                //will modify in the future
                var viewRect = new Microsoft.Maps.LocationRect(
                    new Microsoft.Maps.Location(lati,long), width/111.0,height/111.0);

                _this._Map.setView({bounds: viewRect});
            });  

        $('#lockMap').click(function(evt){

            if ( this.checked ) {
                 _this.mapCenter = _this._Map.getCenter();
                _this.mapZoomLevel = _this._Map.getZoom();
                _this.mapViewChangeHandler = Microsoft.Maps.Events.addHandler(_this._Map,"viewchangeend", _this.resetMapViewEvent);

            }else
            { 
                Microsoft.Maps.Events.removeHandler( _this.mapViewChangeHandler); 
                 _this.mapViewChangeHandler = null;
                 _this.mapCenter = null;
                 _this.mapZoomLevel = 1; 
            }
        });
    }

    
    // update map with the saved view state
    updateMap(viewState){

        // map center
        var mapCenter = viewState.GEOCenter;
        
        //map range
        var viewRect = Microsoft.Maps.LocationRect.fromCorners(
            new Microsoft.Maps.Location(viewState.GEOCorner[0].latitude,
                                        viewState.GEOCorner[0].longitude),
            new Microsoft.Maps.Location(viewState.GEOCorner[1].latitude,
                                        viewState.GEOCorner[1].longitude));
        // update the view
        this._Map.setView({bounds: viewRect});
    } 
} 