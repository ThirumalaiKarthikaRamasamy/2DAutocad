 

var jic = {
    compress: function(source_img_obj, quality, output_format){

        var mime_type = "image/jpeg";
        if(output_format!=undefined && output_format=="png"){
            mime_type = "image/png";
        }
        var cvs = document.createElement('canvas');
         cvs.width = source_img_obj.naturalWidth;
        cvs.height = source_img_obj.naturalHeight;
        var ctx = cvs.getContext("2d").drawImage(source_img_obj, 0, 0);
        var newImageData = cvs.toDataURL(mime_type, quality/100);
        var result_image_obj = new Image();
        result_image_obj.src = newImageData;
        return result_image_obj;
    }
}
 

$(document).ready (function () {
 

    $('#btnSubmmitStatus').click(function (evt) {

         
        var blob = document.getElementById('outImage').src ;

        var img = new Image();
        img.src = blob;

        var imgdata = jic.compress(img,1).src;
        var IoTJson = {blob:imgdata};


        $.ajax ({
            url: 'http://' + window.location.host + '/ForgeRoute/setImage',
            type: 'post',
            data: IoTJson,
            dataType:'json'
        }).done (function (data) {

            alert('upload done!');

        }).fail (function (xhr, ajaxOptions, thrownError) {

        }) ;
     });

    document.getElementById('mobilephoto').onchange = function (evt) {
        var tgt = evt.target || window.event.srcElement,
            files = tgt.files;

        // FileReader support
        if (FileReader && files && files.length) {
            var fr = new FileReader();
            fr.onload = function () {
                document.getElementById('outImage').src = fr.result;
                
            }
            fr.readAsDataURL(files[0]);
        }
        else {
            // Not supported
            alert('not supported!');
        }
    } 

}) ;


