This is a POC project to verify the requirements of GE: 
=============================

[![.net](https://img.shields.io/badge/.net-4.5-green.svg)](http://www.microsoft.com/en-us/download/details.aspx?id=30653)
[![odata](https://img.shields.io/badge/odata-4.0-yellow.svg)](http://www.odata.org/documentation/)
[![ver](https://img.shields.io/badge/Design%20Automation%20API-2.0-blue.svg)](https://developer.autodesk.com/en/docs/design-automation/v2)
[![ver]( https://img.shields.io/badge/Forge%20Viewer-2.10-yellowgreen.svg)](https://developer.autodesk.com/en/docs/viewer/v2)
[![visual studio](https://img.shields.io/badge/Visual%20Studio-2015-orange.svg)](https://www.visualstudio.com/)
[![License](http://img.shields.io/:license-mit-red.svg)](http://opensource.org/licenses/MIT)

##Description

A web application that allows the user to make the layout of components of 2D drawing (transform), and update the source AutoCAD DWG file.  

##Dependencies
* Visual Studio 2012. 2013 or 2015. The latest test is on VS2015.
* Get your credentials (client key and client secret) of Forge at http://developer.autodesk.com 
* [ObjectARX SDK] (http://usa.autodesk.com/adsk/servlet/index?siteID=123112&id=773204). The SDK version depends on which AutoCAD version you want to test with the AppPackage locally. In current test, the version is AutoCAD 2016.

##Setup/Usage Instructions

###TestModelDrawing
* These are the test drawings. Please use other ways to translate these drawings to the format for Forge Viewer in advance.
* Main-Drawing.dwg: the main drawing that will be loaded in Forge Viewer firstly. After translating, get its urn, and replace this._mainID in [Global.js](Web Application\www\src\main-js\Global.js)
* Component1.dwg: the default component that will be loaded in Forge Viewer secondly. After translating, get its urn, and replace this._comp1ID in [Global.js](Web Application\www\src\main-js\Global.js)
* Component2.dwg: the default component that will be loaded in Forge Viewer thridly. After translating, get its urn, and replace this._comp2ID in [Global.js](Web Application\www\src\main-js\Global.js)
* Source-Template.dwg: the default template that contains main drawing and component1 (as a block) and component2 (asa block). This drawing does not require to be translated, but just upload it to a web driver. e.g. in my test, it locates at S3 of AWS: https://s3-us-west-2.amazonaws.com/xiaodongforgetestio/xiaodong-test-Inserts-Source.dwg. 

###Design Automation 
 * Firstly, test the workflow of package and work item by Windows console program [MyTestDesignAutomation](./Design Automation/MyTestDesignAutomation)
  * open the solution [PackageNetPlugin](./Design Automation/PackageNetPlugin)
  * Unzip [ObjectARX SDK] (http://usa.autodesk.com/adsk/servlet/index?siteID=123112&id=773204). Add AcCoreMgd, AcDbMgd from SDK/inc to the project * PackageNetPlugin*
  * Build project *CustomPlugin*. It is better to test with local AutoCAD to verify the custom command
  * Restore the packages of project **Client** by [NuGet](https://www.nuget.org/). The simplest way is to right click the project>>"Manage NuGet Packages for Solution" >> "Restore" (top right of dialog)
  * Add other references that are missing
  * Build [PackageNetPlugin](Design Automation/PackageNetPlugin). Open local AutoCAD, load this plugin. Run command ‘GetTransformByParam’, select any test json at the folder [Test-Json](./Test-Json). Input any export folder. An zip file will be produced within the export folder. The package will contain one DWG, one DXF and one PDF. 
  * Input your client key and client secret of Forge in [Credentials.cs](./Design Automation/MyTestDesignAutomation/Credentials.cs).
  * replace the path source template file in line 300 of VariousInputs.cs (after you uploaed it to a web driver). Make a public path just for easy test. You can also reuse my test file which locates on AWS
  * replace the transformation data json in line 309 of VariousInputs.cs (after you deployed Web Application to your website). you can also reuse my test file which locates on http://forge-ge-test.herokuapp.com.
  * Build the solution [MyTestDesignAutomation](./Design Automation/MyTestDesignAutomation) and run the solution
  * Verify the whole process is working, and whether a final package will be generated. The package will contain one DWG, one DXF and one PDF.  



###Test-Json
* Some json with GEO map info and transformation sample for local test

###Web Application
*  Input your client key and client secret of Forge in [Credentials.cs](./Web Application/Credentials.cs) and [Web Application](./Web Application/Routes/config-design-auto.js). They are same, but I have not yet merged the two files.
* Navigate to the folder and run **install** to download all the required dependencies:

    npm install
    
* By default, right after **install**, the build script should will run automatically, which will build the minified JavaScript files. If not (or to run in manually later), use the following:

    npm run build-prod
* check if [main-2d.min.js](Web Application\www\dist\main-2d) exists. 
* play most functionalities on localhost except [Publish] because it requires a dynamic link of the json of transformation data on the formal website (When Design Automation runs, it can only rechieve files that can be accessed in public domain.)
* depploy the web application to a formal website. e.g. the demo link is http://forge-ge-test.herokuapp.com/main-2d.html
* access the link in the browser.
  
# License

This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT).
Please see the [LICENSE](LICENSE) file for full details.


## Written by

[Xiaodong Liang](https://github.com/xiaodongliang/) [Forge Partner Development](http://forge.autodesk.com)


