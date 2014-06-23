/***
 *
 *  @link https://github.com/lev-savranskiy
 *
 * FileSubmit class for  Marionette.Layout
 *
 * - enable/disabled submit button on file input change
 * - submit form via XMLHttpRequest
 * - shows information about upload status
 *
 * WARNING
 * FileReader API used ==>  IE > 9   required
 * See http://caniuse.com/filereader for details


 * Template example

 <div>

 <form class="addForm"
 action="/serverpath"
 enctype="multipart/form-data;"
 method="POST">

 <h3>Select file to upload</h3>
 <h4  class="addInformer">
 <div  style="display: none;" class="alert-loading">
 loading...
 </div>
 <div style="display: none;" class="alert alert-success"></div>
 <div style="display: none;" class="alert alert-error"></div>

 </h4>

 <input type="file" class="addInput" name="addInput"/>
 <input type="submit"  value="Submit" class="addButton" disabled="true"/>
 </form>
 </div>

 expected JSON RESPONSE

 { "success": true, "message": "Upload successful: Some description goes here from server." }

 OR

 { "success": false, "message": "Upload error: Some description goes here from server." }



 */

Backbone.Marionette.Layout.FileSubmit = Backbone.Marionette.Layout.extend({


    onRender: function () {
        this.elId = "#" + this.id;
        var vw = this;

        //todo get rid of setTimeout
        setTimeout( function () {
            vw.addListenerToForm();
        });

    },

    getFileEl: function () {
        return $(this.elId + " .addInput");
    },

    getFilePath: function () {
        return this.getFileEl() ? this.getFileEl().val() : null;
    },

    getFormEl: function () {
        return  $(this.elId + " .addForm");
    },

    getBtnEl: function () {
        return $(this.elId + " .addButton");
    },

    getInformer: function (status) {
        return $(this.elId + " .alert-" + status);
    },

    toggleButton: function (disabled) {
        //console.log("toggleButton" , disabled);
        if (this.getBtnEl()) {
            this.getBtnEl().attr('disabled', disabled);
        }
    },

    addHandler: function (e) {
        e.preventDefault();
        this.sendData();
    },


    changeHandler: function (e) {
        this.toggleButton(!this.getFilePath());
    },


    addListenerToForm: function () {



        var vw = this;


        var dom = vw.getFileEl();

        if (!dom[0]) {
            alert('No addInput found in HTML');
        }

        var file = {
            dom: dom[0],
            binary: null
        };
        // We use the FileReader API to access our file content
        var reader = new FileReader();
        // Because de FileReader API is asynchronous, we need
        // to store it's result when it has finish to read the file
        reader.addEventListener("load", function () {
            file.binary = reader.result;
        });


        // At page load, if a file is already selected, we read it.
        if (file.dom.files[0]) {
            reader.readAsBinaryString(file.dom.files[0]);
        }

        // However, we will read the file once the user selected it.
        file.dom.addEventListener("change", function () {
            if (reader.readyState === FileReader.LOADING) {
                reader.abort();
            }

            reader.readAsBinaryString(file.dom.files[0]);
        });

        vw.file = file;

    },


    showInfo: function (obj) {

        var els = {};
        els.loading = this.getInformer("loading");
        els.error = this.getInformer("error");
        els.success = this.getInformer("success");

        if (!els.loading || !els.error || !els.success) {
            alert("ShowInfo not implemented!");
        } else {

            els.loading.hide();
            els.error.hide();
            els.success.hide();

            var text = null;
            var status =  obj.status;
            var responseText = obj.XHR && obj.XHR.responseText;


            if (responseText) {
                 text = "Error happened";
                try {
                    responseText = JSON.parse(responseText);
                    console.log("responseText", responseText);

                    if (responseText.success === true) {
                        status = "success";
                        text = "File was uploaded";
                    }

                    if (responseText.message) {
                        text = responseText.message;
                    }


                } catch (e) {
                    status = "error";
                    text = "Server returned data in wrong format. JSON  expected."
                }
            }

            var el = this.getInformer(status);

            if (el) {
                if (text){
                    el.text(text);
                }

                el.show();
            }
        }

    },


    sendData: function () {


        var vw = this;
        var file = this.file;


        this.showInfo({
            status: "loading"
        });


        // At first, if there is a file selected, we have to wait it is read
        // If it is not, we delay the execution of the function
        if (!file.binary && file.dom.files.length > 0) {
            setTimeout(this.sendData, 10);
            return;
        }

        // To construct our multipart form data request,
        // We need an HMLHttpRequest instance
        var XHR = new XMLHttpRequest();

        // We need a sperator to define each part of the request
        var boundary = "blob";

        // And we'll store our body request as a string.
        var data = "";

        // So, if the user has selected a file
        if (file.dom.files[0]) {
            // We start a new part in our body's request
            data += "--" + boundary + "\r\n";

            // We said it's form data (it could be something else)
            data += 'content-disposition: form-data; '
                // We define the name of the form data
                + 'name="' + file.dom.name + '"; '
                // We provide the real name of the file
                + 'filename="' + file.dom.files[0].name + '"\r\n';
            // We provide the mime type of the file
            data += 'Content-Type: ' + file.dom.files[0].type + '\r\n';

            // There is always a blank line between the meta-data and the data
            data += '\r\n';

            // We happen the binary data to our body's request
            data += file.binary + '\r\n';
        }

        // For text data, it's simpler
        // We start a new part in our body's request
        data += "--" + boundary + "\r\n";

        // We said it's form data and give it a name
        data += 'content-disposition: form-data; name="' + file.dom.name + '"\r\n';
        // There is always a blank line between the meta-data and the data
        data += '\r\n';

        // We happen the text data to our body's request
        data += file.dom.value + "\r\n";

        // Once we are done, we "close" the body's request
        data += "--" + boundary + "--";

        // We define what will happen if the data are successfully sent
        XHR.addEventListener('load', function (event) {

            vw.showInfo({
                status: "success",
                XHR: XHR
            });
        });

        // We define what will happen in case of error
        XHR.addEventListener('error', function (event) {

            vw.showInfo({
                status: "error",
                XHR: XHR
            });
        });

        // We setup our request
        XHR.open(this.method, this.getFormEl().attr("action"));


        // We add the required HTTP header to handle a multipart form data POST request
        XHR.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
        //Refused to set unsafe header!
        // XHR.setRequestHeader('Content-Length', data.length);


        //TODO Investigate
        // Due to Firefox's bug 416178, it's required to use sendAsBinary() instead of send()

        // And finally, We send our data.
        XHR.send(data);
    }


});
