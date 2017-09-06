using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;

using Autodesk.AutoCAD.ApplicationServices.Core;
using Autodesk.AutoCAD.EditorInput;

using Autodesk.AutoCAD.Runtime;
using Autodesk.AutoCAD.DatabaseServices;
using System.IO;
using Newtonsoft.Json;
using Autodesk.AutoCAD.ApplicationServices;

using RestSharp;
using Autodesk.AutoCAD.Geometry;
using AcAp = Autodesk.AutoCAD.ApplicationServices.Application;


[assembly: CommandClass(typeof(PackageNetPlugin.Class1))]

namespace PackageNetPlugin
{
   



    [Serializable]
    public class updateDataCls
    {
        // double values seperated by comma
        [JsonProperty("GEOCenter")]
        public MapPointCls GEOCenter { get; set; }
        [JsonProperty("GEOCorner")]
        // double values seperated by comma
        public MapPointCls[] GEOCorner { get; set; }

        //transformation array
        [JsonProperty("TransArray")]
        public TransformCls[] TransArray { get; set; }
    }

    [Serializable]
    public class MapPointCls
    {
        [JsonProperty("longitude")]
        public double longitude { get; set; }
        [JsonProperty("latitude")]
        public double latitude { get; set; }
    }

    [Serializable]
    public class CommonPointCls
    {
        [JsonProperty("x")]
        public double x { get; set; }
        [JsonProperty("y")]
        public double y { get; set; }
        [JsonProperty("z")]
        public double z { get; set; }
    }

    [Serializable]
    public class TransformCls
    {
        [JsonProperty("enthand")]
        public string enthand { get; set; }       
        [JsonProperty("matrix")]
        public double[] matrix { get; set; }

        //reserved for future
        [JsonProperty("dbid")]
        public string dbid { get; set; } 
        [JsonProperty("compname")]
        public string compname { get; set; } 
       
    }


    public class Class1
    {

        HardCoded oHard_Coded_Data= new HardCoded();

        /// <summary>
        /// transform the components or add new components
        /// </summary>
        /// <param name="TransArray"></param>
        private void transformElements(TransformCls[] TransArray)
        {
            var doc = Autodesk.AutoCAD.ApplicationServices.Core.Application.DocumentManager.MdiActiveDocument;
            if (doc == null)
                return;
            var db = doc.Database;
            var ed = doc.Editor;


            //why I hard-coded? 
            double ModelCenterX = HardCoded.ModelCenterX;
            double ModelCenterY = HardCoded.ModelCenterY;

            //hard-coded for this model
            double unitscale = HardCoded.unitscale;

            //initial translation of components in Forge Viewer
            double[] oCompIniTrans = oHard_Coded_Data.CompIniTrans();


            using (Transaction acTrans = db.TransactionManager.StartTransaction())
            {
                BlockTable acBlkTable = acTrans.GetObject(db.BlockTableId, OpenMode.ForRead) as BlockTable;
                BlockTableRecord modelSpace = acTrans.GetObject(acBlkTable[BlockTableRecord.ModelSpace],
                                                                OpenMode.ForWrite) as BlockTableRecord;
                ObjectId blkRecId = acBlkTable["comp1"];

                foreach (TransformCls eachTans in TransArray)
                {
                    double[] m = eachTans.matrix;

                    //we have to modify the scale and translation because they are hard-coded for Forge Viewer 

                    m[12] *= unitscale;
                    m[13] *= unitscale;

                    //remove the scaling of the transform matrix.
                    http://adndevblog.typepad.com/autocad/2012/08/remove-scaling-from-transformation-matrix.html
                    Matrix3d transformMat3d = new Matrix3d(m);
                    Vector3d oX = new Vector3d(transformMat3d[0, 0], transformMat3d[0, 1], transformMat3d[0, 2]);
                    oX = oX.GetNormal();
                    Vector3d oY = new Vector3d(transformMat3d[1, 0], transformMat3d[1, 1], transformMat3d[1, 2]);
                    oY = oY.GetNormal();
                    Vector3d oZ = new Vector3d(transformMat3d[2, 0], transformMat3d[2, 1], transformMat3d[2, 2]);
                    oZ = oZ.GetNormal();

                    Matrix3d updatedTransformM = new Matrix3d(new double[] {
                          oX.X, -oX.Y, oX.Z,transformMat3d[0, 3],
                          -oY.X, oY.Y, oY.Z, transformMat3d[1, 3],
                          oZ.X, oZ.Y, oZ.Z, transformMat3d[2, 3],
                           transformMat3d[3, 0],transformMat3d[3, 1],transformMat3d[3, 2],transformMat3d[3, 3]
                    });

                    BlockReference acBlkRef = null;
                    if (eachTans.enthand == "-1")
                    {
                        //this is a new component
                        acBlkRef = new BlockReference(new Point3d(ModelCenterX, ModelCenterY, 0), blkRecId);

                        //add the new block reference
                        modelSpace.AppendEntity(acBlkRef);
                        acTrans.AddNewlyCreatedDBObject(acBlkRef, true);
                    }
                    else
                    {
                        //this is the default component in the template drawing
                        long ln = System.Convert.ToInt64(eachTans.enthand, 16);

                        //get the object id of the block reference
                        Handle hn = new Handle(ln);
                        ObjectId id = db.GetObjectId(false, hn, 0);
                        Entity acEnt =
                             acTrans.GetObject(id, OpenMode.ForWrite) as Entity;

                        acBlkRef = acEnt as BlockReference;

                    }

                    if (acBlkRef != null)
                    {
                        Point3d pos = acBlkRef.Position;

                        Extents3d extOld = acBlkRef.GeometricExtents;

                        var centerXOld = (extOld.MaxPoint.X + extOld.MinPoint.X) / 2.0;
                        var centerYOld = (extOld.MaxPoint.Y + extOld.MinPoint.Y) / 2.0;

                        Matrix3d transMat3d = Matrix3d.Displacement(new Vector3d(
                          pos.X,
                           pos.Y,
                           pos.Z));

                        acBlkRef.TransformBy(updatedTransformM);
                        acBlkRef.TransformBy(transMat3d);

                        Extents3d extNew = acBlkRef.GeometricExtents;

                        var centerXNew = (extNew.MaxPoint.X + extNew.MinPoint.X) / 2.0;
                        var centerYNew = (extNew.MaxPoint.Y + extNew.MinPoint.Y) / 2.0;
                         

                        double increX = 0, increY=0;

                        if (eachTans.compname == "component1")
                        {
                             increX = transformMat3d[3, 0] - oCompIniTrans[0] * unitscale;
                             increY = transformMat3d[3, 1] - oCompIniTrans[1] * unitscale;
                        }
                        else if (eachTans.compname == "component2")
                        {
                            increX = transformMat3d[3, 0] - oCompIniTrans[2] * unitscale;
                            increY = transformMat3d[3, 1] - oCompIniTrans[3] * unitscale;
                        }
                        else if (eachTans.compname.Contains("NewComp"))
                        { 
                            increX = transformMat3d[3, 0] - oCompIniTrans[4] * unitscale;
                            increY = transformMat3d[3, 1] - oCompIniTrans[5] * unitscale;
                        }
                        else
                        {

                        }
                            
                        transMat3d = Matrix3d.Displacement(new Vector3d(
                           increX, increY, 0));
                        acBlkRef.TransformBy(transMat3d); 
                    }

                }
                acTrans.Commit();
            }
          
        }


        /// <summary>
        /// place the real GEO　map underlay
        /// </summary>
        /// <param name="centerPt"></param>
        /// <param name="sourceMapCorners"></param>
        private void buildGEOImage(MapPointCls centerPt, MapPointCls[] sourceMapCorners)
        {
            var doc = Autodesk.AutoCAD.ApplicationServices.Core.Application.DocumentManager.MdiActiveDocument;
            if (doc == null)
                return;
            var db = doc.Database;
            var ed = doc.Editor;

            double ModelCenterX = HardCoded.ModelCenterX;
            double ModelCenterY = HardCoded.ModelCenterY;


            //GEO location data of the corners
            //the source are two points. calculate the other two points
            //convert them to string

            string[] oMapCorners = new string[4];
            GEOConverter oGeoC = new GEOConverter();

            //left top
            DecimalLocation decimalLocation = new DecimalLocation
            {
                Latitude = (decimal)sourceMapCorners[0].latitude,
                Longitude = (decimal)sourceMapCorners[0].longitude
            };
            DmsLocation dmsLocation = oGeoC.Convert(decimalLocation);
            oMapCorners[0] = dmsLocation.ToString();

            //right top
            decimalLocation = new DecimalLocation
            {
                Latitude = (decimal)sourceMapCorners[0].latitude,
                Longitude = (decimal)sourceMapCorners[1].longitude
            };
            dmsLocation = oGeoC.Convert(decimalLocation);
            oMapCorners[1] = dmsLocation.ToString();

            //right bottom
            decimalLocation = new DecimalLocation
            {
                Latitude = (decimal)sourceMapCorners[1].latitude,
                Longitude = (decimal)sourceMapCorners[1].longitude
            };
            dmsLocation = oGeoC.Convert(decimalLocation);
            oMapCorners[2] = dmsLocation.ToString();

            //left bottom
            decimalLocation = new DecimalLocation
            {
                Latitude = (decimal)sourceMapCorners[1].latitude,
                Longitude = (decimal)sourceMapCorners[0].longitude
            };
            dmsLocation = oGeoC.Convert(decimalLocation);
            oMapCorners[3] = dmsLocation.ToString();
              

            //hard coded data of corners position in DWG
            CommonPointCls[] oDWGCorners = oHard_Coded_Data.GetDWGCorner();


            //create the text one by one
            using (Transaction acTrans = db.TransactionManager.StartTransaction())
            {
                BlockTable acBlkTable = acTrans.GetObject(db.BlockTableId, OpenMode.ForRead) as BlockTable;
                BlockTableRecord modelSpace = acTrans.GetObject(acBlkTable[BlockTableRecord.ModelSpace],
                                                                OpenMode.ForWrite) as BlockTableRecord;

                //place the position of each text
                for(int i = 0; i < oDWGCorners.Count<CommonPointCls>(); i++)
                {
                    DBText dt = new DBText();
                    dt.TextString = oMapCorners[i]; 

                    switch (i)
                    {
                        case 0:
                            //left top
                            dt.Justify = AttachmentPoint.BottomMid;
                            dt.Rotation = 45;
                            break;
                        case 1:
                            //right top
                            dt.Justify = AttachmentPoint.BottomMid;
                            dt.Rotation = -45;
                            break;
                        case 2:
                            //right bottom
                            dt.Justify = AttachmentPoint.TopMid;
                            dt.Rotation = 45;
                            break;
                        case 3:
                            //left bottom
                            dt.Justify = AttachmentPoint.TopMid;
                            dt.Rotation = -45;
                            break;

                    }

                    //align with the corner position
                    dt.AlignmentPoint = new Point3d(oDWGCorners[i].x, oDWGCorners[i].y, oDWGCorners[i].z);
                    dt.TransformBy(ed.CurrentUserCoordinateSystem);
                    dt.Color = Autodesk.AutoCAD.Colors.Color.FromRgb(0, 255, 255);
                    
                    modelSpace.AppendEntity(dt);
                    acTrans.AddNewlyCreatedDBObject(dt, true); 
                } 

                acTrans.Commit();
            }

             //!!! 
             return;

            //embed map underlay. not working with Design Automation 

            // from 
            //http://through-the-interface.typepad.com/through_the_interface/2014/06/attaching-geo-location-data-to-an-autocad-drawing-using-net.html 
            try
            {
                var gdId = db.GeoDataObject;
                //if a map data is available
                //will not happen with current drawing template

            }
            catch
            {
                //no GEO data

                var msId = SymbolUtilityServices.GetBlockModelSpaceId(db);

                var data = new GeoLocationData();
                data.BlockTableRecordId = msId;
                data.PostToDb();

                // We're going to define our geolocation in terms of
                // latitude/longitude using the Mercator projection
                // http://en.wikipedia.org/wiki/Mercator_projection

                data.CoordinateSystem = "WORLD-MERCATOR";
                data.TypeOfCoordinates = TypeOfCoordinates.CoordinateTypeLocal;

                //the two lines will cause GEOMapImage fail! strange!
                //data.HorizontalUnits = UnitsValue.Millimeters;
                //data.VerticalUnits = UnitsValue.Millimeters;
                 
                var geoPt = new Point3d(centerPt.longitude, centerPt.latitude, 0);

                // Transform from a geographic to a modelspace point
                // and add the information to our geolocation data
                var wcsPt = data.TransformFromLonLatAlt(geoPt);
                data.DesignPoint = new Point3d(ModelCenterX, ModelCenterY, 0);
                data.ReferencePoint = wcsPt;
                data.ScaleFactor = 7; //? useful? 

                ed.Command("_.GEOMAP", "_ROAD"); 
                 

                // then create the map image
                //createMapImage(data);
            }        
        }


        /// <summary>
        /// create map image 
        /// not working currently
        /// </summary>
        /// <param name="data"></param>
        private void createMapImage(GeoLocationData data)
        {
            var doc = Autodesk.AutoCAD.ApplicationServices.Core.Application.DocumentManager.MdiActiveDocument;
            if (doc == null)
                return;
            var db = doc.Database;
            var ed = doc.Editor;

            //now get an image

            var first = new Point2d(261290.0000,270952.5000);
            //second corner
            var second = new Point2d(568732.0000,76776.5000);

            ObjectId giId = ObjectId.Null;
            ObjectEventHandler handler =
              (s, e) =>
              {
                  if (e.DBObject is GeomapImage)
                  {
                      giId = e.DBObject.ObjectId;
                      ed.WriteMessage("\n map image objectid: " + giId);
                  }
              };

            // Simply call the GEOMAPIMAGE command with the two points
            db.ObjectAppended += handler;
            ed.Command("GEOMAPIMAGE", "V");
            db.ObjectAppended -= handler;

            if (giId == ObjectId.Null)
                return;

            // Open the entity and change some values
            try
            {
                using (var tr = doc.TransactionManager.StartTransaction())
                {
                    // Get each object and check if it's a GeomapImage
                    var gi =
                      tr.GetObject(giId, OpenMode.ForWrite) as GeomapImage;
                    if (gi != null)
                    {
                        // Let's adjust the brightmess/contrast/fade of the
                        // GeomapImage

                        gi.Brightness = 50;
                        gi.Contrast = 15;
                        gi.Fade = 0;

                        // And make sure it's at the right resolution and
                        // shows both aerial and road information

                        gi.Resolution = GeomapResolution.Optimal;
                        gi.MapType = GeomapType.Road;

                        gi.UpdateMapImage(true);

                        //keep map only
                        //data.EraseFromDb();
                    }

                    tr.Commit();
                }
            }
            catch (Autodesk.AutoCAD.Runtime.Exception)
            {
                ed.WriteMessage(
                  "\nUnable to update geomap image entity." +
                  "\nPlease check your internet connectivity and call " +
                  "GEOMAPIMAGEUPDATE."
                );
            }
        

    }
    
    /// <summary>
    /// export to DWG, DXF and PDF
    /// </summary>
    private void exportPackage()
    { 
        var doc = Autodesk.AutoCAD.ApplicationServices.Core.Application.DocumentManager.MdiActiveDocument;
        if (doc == null)
            return;
        var db = doc.Database;
        var ed = doc.Editor;

        var pr = ed.GetString("\nSpecify output folder");
        if (pr.Status != PromptStatus.OK)
            return;

        string outFolder = pr.StringResult;

        if (!String.IsNullOrEmpty(outFolder) || Directory.Exists(outFolder))
        {
            //save as to DWG
            var dwgOut = Path.Combine(outFolder, "updatedTrans.dwg");
            db.SaveAs(dwgOut, DwgVersion.Current);
            //save as to DXF
            var dxfOut = Path.Combine(outFolder, "updatedTrans.dxf");
            db.DxfOut(dxfOut, 16, DwgVersion.Current);


            //publish layout to PDF 
            ed.Command(new Object[] { "_tilemode", "0" });
            var pdfOut = Path.Combine(outFolder, "updatedTrans.pdf");
            ed.Command(new Object[] { "-export", "_pdf", "_all", pdfOut, "" });
        } 
    }

    /// <summary>
    /// main command 
    /// </summary>
    [CommandMethod("ForgeGE")]
    public void ForgeGE()
    {
        var doc = Autodesk.AutoCAD.ApplicationServices.Core.Application.DocumentManager.MdiActiveDocument;
        if (doc == null)
            return;
        var db = doc.Database;
        var ed = doc.Editor;

            //get updated data: transform data and GEO data
            var pfnr = ed.GetFileNameForOpen("\nSpecify Json File");
        if (pfnr.Status != PromptStatus.OK)
            return;

        var paramFile = pfnr.StringResult;

        //read the contents
        var contents = File.ReadAllText(paramFile);
        //ed.WriteMessage(contents.ToString());

        //parse string to json objects
        updateDataCls updatedDataList = JsonConvert.DeserializeObject<updateDataCls>(contents);

        //1. transform entities
        transformElements(updatedDataList.TransArray);
        //2. add GEO coordinates, build GEO Image
        buildGEOImage(updatedDataList.GEOCenter, updatedDataList.GEOCorner);
        //3. export to package
        exportPackage(); 
    } 
   }
}
