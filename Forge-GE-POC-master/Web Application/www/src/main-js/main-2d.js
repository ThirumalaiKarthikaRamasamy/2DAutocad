import GEOMap from './GEOMap.js'
import Viewer2DWorkflow from './Viewer2DWorkflow.js'
import Global from './Global.js'

import Publish from './Publish.js'
  
 var _global = new Global();
 
var _GEOMap = new  GEOMap(_global);
var _Viewer2DWorkflow = new Viewer2DWorkflow(_global);
var _Publish = new Publish(_global);


$(document).ready (function () {  
   
     _GEOMap.iniNaviPanel();
     _Viewer2DWorkflow.initViewer();  
     _Publish.iniPulishPanel();

}); 
 