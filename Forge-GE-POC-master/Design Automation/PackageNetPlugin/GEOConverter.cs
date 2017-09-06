using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PackageNetPlugin
{
    class DecimalLocation
    {
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }

        public override string ToString()
        {
            return string.Format("{0:f5}, {1:f5}",
                Latitude, Longitude);
        }
    }

    class DmsLocation
    {
        public DmsPoint Latitude { get; set; }
        public DmsPoint Longitude { get; set; }

        public override string ToString()
        {
            return string.Format("{0}, {1}",
                Latitude, Longitude);
        }
    }

    class DmsPoint
    {
        public int Degrees { get; set; }
        public int Minutes { get; set; }
        public int Seconds { get; set; }
        public PointType Type { get; set; }

        public override string ToString()
        {
            return string.Format("{0}° {1}' {2}\" {3}",
                Math.Abs(Degrees),
                Minutes,
                Seconds,
                Type == PointType.Lat
                    ? Degrees < 0 ? "S" : "N"
                    : Degrees < 0 ? "W" : "E");
        }
    }

    enum PointType
    {
        Lat,
        Lon
    }

    //class for convert the data between decimal and geo coordination
    class GEOConverter
    {

        public DecimalLocation Convert(DmsLocation dmsLocation)
        {
            if (dmsLocation == null)
            {
                return null;
            }

            return new DecimalLocation
            {
                Latitude = CalculateDecimal(dmsLocation.Latitude),
                Longitude = CalculateDecimal(dmsLocation.Longitude)
            };
        }

        public DmsLocation Convert(DecimalLocation decimalLocation)
        {
            if (decimalLocation == null)
            {
                return null;
            }

            return new DmsLocation
            {
                Latitude = new DmsPoint
                {
                    Degrees = ExtractDegrees(decimalLocation.Latitude),
                    Minutes = ExtractMinutes(decimalLocation.Latitude),
                    Seconds = ExtractSeconds(decimalLocation.Latitude),
                    Type = PointType.Lat
                },
                Longitude = new DmsPoint
                {
                    Degrees = ExtractDegrees(decimalLocation.Longitude),
                    Minutes = ExtractMinutes(decimalLocation.Longitude),
                    Seconds = ExtractSeconds(decimalLocation.Longitude),
                    Type = PointType.Lon
                }
            };
        }

        decimal CalculateDecimal(DmsPoint point)
        {
            if (point == null)
            {
                return default(decimal);
            }
            return point.Degrees + (decimal)point.Minutes / 60 + (decimal)point.Seconds / 3600;
        }

        int ExtractDegrees(decimal value)
        {
            return (int)value;
        }

        int ExtractMinutes(decimal value)
        {
            value = Math.Abs(value);
            return (int)((value - ExtractDegrees(value)) * 60);
        }

        int ExtractSeconds(decimal value)
        {
            value = Math.Abs(value);
            decimal minutes = (value - ExtractDegrees(value)) * 60;
            return (int)Math.Round((minutes - ExtractMinutes(value)) * 60);
        }
    }
}
