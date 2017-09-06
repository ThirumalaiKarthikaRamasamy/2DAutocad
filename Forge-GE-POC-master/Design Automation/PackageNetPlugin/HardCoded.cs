using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PackageNetPlugin
{
    class HardCoded
    {
        public const double ModelCenterX = 407081.0000;
        public const double ModelCenterY = 161575.0000;
        public const double unitscale = 23590;

        double[] _component_ini_translation_forge_viewer = null;


        CommonPointCls[] _DWGCorners = new CommonPointCls[4];

        public HardCoded()
        {
            _component_ini_translation_forge_viewer =  new double[6] {3,3.2,5.5,3.2,4.8,3.5 };


            for (int i = 0; i < _DWGCorners.Length; ++i)
                _DWGCorners[i] = new CommonPointCls();

            //left top
            _DWGCorners[0].x = 344591.8983;
            _DWGCorners[0].y = 214429.0811;
            _DWGCorners[0].z = 0;

            //right top
            _DWGCorners[1].x = 485714.3320;
            _DWGCorners[1].y = 214429.0811;
            _DWGCorners[1].z = 0;

            //right bottom
            _DWGCorners[2].x = 485714.3320;
            _DWGCorners[2].y = 148461.0935;
            _DWGCorners[2].z = 0;

            //left bottom
            _DWGCorners[3].x = 344591.8983;
            _DWGCorners[3].y = 148461.0935;
            _DWGCorners[3].z = 0;
        }

        public CommonPointCls[] GetDWGCorner()
        {
            return _DWGCorners;
        }

        public double[] CompIniTrans()
        {
            return _component_ini_translation_forge_viewer;
        } 

    }
}
