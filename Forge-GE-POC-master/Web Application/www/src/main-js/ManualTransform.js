
export default class ManualTransform {

    constructor (viewer,global) { 
        //super()

        this._viewer = viewer; 
        this._global = global;
      } 

     
    iniTransPanel()
    {
        var _this = this;
        $("#plant").click(function(evt){ 
             _this._global.setCurrentSelectedComp('plant');
        }); 

        $("#component1").click(function(evt){ 
            _this._global.setCurrentSelectedComp('component1');
         });

        $("#component2").click(function(evt){ 
             _this._global.setCurrentSelectedComp('component2');
        });  

        $("#btn-AddX").click(function(evt){
            var step = Number($("#transStep").val());  
            var currentSelComp =  _this._global.getCurrentSelectedComp();
            var models = _this._global.getModels();
                
            if( currentSelComp == 'plant'){
                _this.translateSceneWithStep(step,0);
            }else 
            {   
                models[currentSelComp].center.x += step;
                 _this.translateModelWithStep(models[currentSelComp],step,0);            
            }  

        }); 

        $("#btn-AddY").click(function(evt){ 
            var step = Number($("#transStep").val()); 
            var currentSelComp =  _this._global.getCurrentSelectedComp();
            var models = _this._global.getModels(); 
                
            if( currentSelComp == 'plant'){
                _this.translateSceneWithStep(0,step);
            }else 
            {  
                models[currentSelComp].center.y += step;

                _this.translateModelWithStep(models[currentSelComp],0,step); 
            }  
        }); 

        $("#btn-MinusX").click(function(evt){ 
            var step = Number($("#transStep").val());  
            var currentSelComp =  _this._global.getCurrentSelectedComp();
            var models = _this._global.getModels(); 
                
            if( currentSelComp == 'plant'){ 
                _this.translateSceneWithStep(-step,0);
            }else 
            { 
                models[currentSelComp].center.x -= step;
                _this.translateModelWithStep(models[currentSelComp],-step,0);
    
            }  
        }); 

        $("#btn-MinusY").click(function(evt){ 
            var step = Number($("#transStep").val());  
             var currentSelComp =  _this._global.getCurrentSelectedComp();
            var models = _this._global.getModels(); 
                
            if( currentSelComp == 'plant'){ 
                 _this.translateSceneWithStep(0,-step);
            }else 
            { 
                models[currentSelComp].center.y -= step;
                _this.translateModelWithStep(models[currentSelComp],0,-step);
                
            }  
        });  


        $("#btn-Clockwise").click(function(evt){ 
            var angle = Number($("#rotStep").val());  
            var currentSelComp =  _this._global.getCurrentSelectedComp();
            var models = _this._global.getModels(); 
    
            if(currentSelComp == 'plant'){
                 _this.rotateSceneWithStep(angle); 
            }
            else{ 
                _this._viewer.setActiveNavigationTool('pan');
                _this.rotateModelWithStep(models[currentSelComp],-angle);
            }
        });  

        $("#btn-antiClockwise").click(function(evt){ 
            var angle = Number($("#rotStep").val());  
            var currentSelComp =  _this._global.getCurrentSelectedComp();
            var models = _this._global.getModels(); 
    
            if(currentSelComp == 'plant'){
                 _this.rotateSceneWithStep(-angle); 
            }
            else{ 
                _this._viewer.setActiveNavigationTool('pan');
                _this.rotateModelWithStep(models[currentSelComp],angle);
            }
        });  

    }

    //translate component with step (x-y)
    translateModelWithStep(modelP,xStep,yStep){ 
   
        console.log('translating model:' + modelP.modelName);
        var fragCount =  modelP.model.getFragmentList().
            fragments.fragId2dbId.length
        for (var fragId = 0; fragId < fragCount; ++fragId) {
             var mesh = this._viewer.impl.getRenderProxy(
                modelP.model,
                fragId)

                var currentMatrix = mesh.matrixWorld; 
                

                currentMatrix.elements[12] += xStep;
                currentMatrix.elements[13] += yStep;  

                //JSON will stringfy FloatArray to the string like 
                //"matrix":{"0":0.11408573389053345,"1":-0.06232532113790512,"2":0,
                //so copy one by one
                for(var ii in currentMatrix.elements)
                    modelP.matrix[ii] = currentMatrix.elements[ii];   
            
            }
            this._viewer.impl.sceneUpdated(true)   ;     
   
        }
        
            //roate component with step 

       rotateModelWithStep(modelP,angle){ 
            var bbox = modelP.model.myData.bbox; 
            var center = modelP.center;

            var currentMatrix;                              
            var fragCount = modelP.model.getFragmentList().
                fragments.fragId2dbId.length
            for (var fragId = 0; fragId < fragCount; ++fragId) {
                var mesh = NOP_VIEWER.impl.getRenderProxy(
                    modelP.model,
                    fragId) 

                    currentMatrix = mesh.matrixWorld; 
                    var rotation =  new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), angle);
                    var trans = new THREE.Matrix4().makeTranslation(center.x,center.y,center.z);
                    currentMatrix.multiply(trans); 
                    currentMatrix.multiply(rotation); 
                    var trans = new THREE.Matrix4().makeTranslation(-center.x,-center.y,-center.z);
                    currentMatrix.multiply(trans);   

                    //modelP.matrix = currentMatrix.elements;
                    //JSON will stringfy FloatArray to the string like 
                    //"matrix":{"0":0.11408573389053345,"1":-0.06232532113790512,"2":0,
                    //so copy one by one
                    for(var ii in currentMatrix.elements)
                        modelP.matrix[ii] = currentMatrix.elements[ii]; 
            }
            this._viewer.impl.sceneUpdated(true)   
        }
    
        //translate scene (main drawing) with step (x-y)
      translateSceneWithStep(x,y){

             this._viewer.setActiveNavigationTool('pan');
            var distance = this._viewer.navigation.getEyeVector().length();
            this._viewer.navigation.panRelative(x,-y,distance); 
        }

        //rotate scene (main drawing) with step (x-y)

            rotateSceneWithStep(angle){
            
                 this._viewer.setActiveNavigationTool('worldup');

                var camera =  this._viewer.getCamera();
                var kHudFov = 30; 
                var myVec2   = new THREE.Vector3();

                var viewVec =  this._viewer.navigation.getEyeVector();
                var distance = (camera.near + camera.far) * 0.5;
                viewVec.normalize().multiplyScalar(distance);
                var myLookAtPoint = viewVec.add(camera.position);
                var kStableRollThreshold = 30.0 * Math.PI / 180.0; 
                var view = myVec2.copy(camera.position).sub(myLookAtPoint).normalize();

                var myRotate = new THREE.Quaternion();
                myRotate.setFromAxisAngle( view, angle );
                var up =   this._viewer.navigation.getWorldUpVector();
                var viewUpAngle = Math.abs(view.angleTo(up));
                if( viewUpAngle < kStableRollThreshold || (Math.PI - viewUpAngle) < kStableRollThreshold )
                {
                    up.copy(_viewer.navigation.getCameraUpVector());  // This is the actual camera up
                }
                up.applyQuaternion( myRotate );
                 this._viewer.navigation.setWorldUpVector(up,true);  

                var getRotation = function(vFrom, vTo) {
                var rotAxis = (new THREE.Vector3()).crossVectors(vTo, vFrom).normalize();  // not sure why this is backwards
                var rotAngle = Math.acos(vFrom.dot(vTo));
                return (new THREE.Matrix4()).makeRotationAxis(rotAxis, rotAngle);
                };

                var identityUp = new THREE.Vector3(0,1,0);
                camera.worldUpTransform = getRotation(identityUp, up); 
        }

}
