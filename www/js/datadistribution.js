var lon = -123.123518;
var lat = 49.276020;

$(document).ready(function() {

  dataDist.init({
	      server: "https://demos-safe-software.fmecloud.com", //Change this to your FME server name
	      token: "568c604bc1f235bbe137c514e7c61a8436043070"     });  //Change this to your FME Server Token
		});


  /*$.getJSON("https://demos.fmeserver.com.s3.amazonaws.com/server-demo-config.json", function(config) {
    dataDist.init({
      host: config.initObject.server,
      token: config.initObject.token
      });
    });
  }); */


var dataDist = (function () {

  // privates
  var repository = 'Demos';
  var workspaceName = 'LidarDataDownload.fmw';
  var host;
  var token;

  /**
   * Run when the page loads. Callback from the FMEServer API. JSON returned from
   * the REST API parsed and a HTML published parameter form dynamically created.
   * @param  {JSON} json Returned from the Rest API callback
   */
  function buildParams(json){

    var parameters = $('<div id="parameters" />');
    parameters.insertBefore('#submit');

    // Generates standard form elelemts from
    // the getWorkspaceParameters() return json object
    FMEServer.generateFormItems('parameters', json);

    // Add styling classes to all the select boxes
    var selects = parameters.children('select');
    for(var i = 0; i < selects.length; i++) {
        selects[i].setAttribute('class', 'input-customSize');
    }

    // Remove the auto generated GEOM element and label
    $("#parameters .GEOM").remove();
    $("#parameters .THIN_RATE input").val(10);

  }

  /**
   * Builds up the URL and query parameters.
   * @param  {Form} formInfo Published parameter form Object.
   * @return {String} The full URL.
   */
  function buildURL(formInfo){
    var str = '';
    str = host + '/fmedatadownload/' + repository + '/' + workspaceName + '?';
    var elem = formInfo[0];
    for(var i = 0; i < elem.length; i++) {
      if(elem[i].type !== 'submit') {

        if(elem[i].type === "checkbox" && elem[i].checked) {
          str += elem[i].name + "=" + elem[i].value + "&";
        } else if(elem[i].type !== "checkbox") {
          str += elem[i].name + "=" + elem[i].value + "&";
        }
      }
    }
    str = str.substring(0, str.length - 1);
    return str;
  }


  /**
   * Run on Submit click. Callback for the FMESERVER API.
   * from the translation which is displayed in a panel.
   * @param  {JSON} result JSON returned by the data download service call.
   */
  function displayResult(result){

    var resultText = result.serviceResponse.statusInfo.status;
       var featuresWritten = result.serviceResponse.fmeTransformationResult.fmeEngineResponse.numFeaturesOutput;
       var resultUrl = '';

       if(resultText == 'success'){
         if (featuresWritten != 0){
           resultUrl = result.serviceResponse.url;
  				 $('#successMessage').html('<p>Your request has been successfully processed. <br/ > Click this link to download your data: <a href="' + resultUrl + '"> Download Data </a>');
  				 $('#successModal').modal({show:true});
         }
         else {
  				 $('#errorMessage').text('No output dataset was produced by FME, because no features were found in the selected area.');
  				 $('#errorModal').modal({
  					show: true
  				});
  			 }
       }
       else{
  			 $('#errorMessage').html('<p> The following error occurred while processing your request: <br/><br/>' + result.serviceResponse.statusInfo.message + '</p>');
  			 $('#errorModal').modal({
  				show: true
  			});
  		 }
  }


  /**
   * ----------PUBLIC METHODS----------
   */
  return {

    init : function(params) {
      var self = this;
      host = params.server;
      token = params.token;
      hostVisible = params.hostVisible;

      //initialize map and drawing tools
      mapManager = new GoogleMapsManager();
      polygonControl = new GoogleMapsPolygonDrawTools(mapManager.myGoogleMap);

      // show boundaries for point clouds
      mapManager.myGoogleMap.data.loadGeoJson('js/LidarBoundaries.json');

      FMEServer.init({
        server : host,
        token : token
      });

      //set up parameters on page
      FMEServer.getWorkspaceParameters(repository, workspaceName, buildParams);

      $('#geom').change(function(){
        dataDist.updateQuery();
      });
    },

    /**
     * Called by the form when the user clicks on submit.
     * @param  {Form} formInfo Published parameter form Object.
     * @return {Boolean} Returning false prevents a new page loading.
     */
    orderData : function(formInfo){
      var params = '';
      var elem = formInfo.elements;
      for(var i = 0; i < elem.length; i++) {
        if(elem[i].type !== 'submit') {
          if(elem[i].type === "checkbox" && elem[i].checked) {
            params += elem[i].name + "=" + elem[i].value + "&";
          } else if(elem[i].type !== "checkbox") {
            params += elem[i].name + "=" + elem[i].value + "&";
          }
        }
      }
      params = params.substr(0, params.length-1);
      $('#results').html('').addClass('loading');
      FMEServer.runDataDownload(repository, workspaceName, params, displayResult);
      return false;
    },

    /**
     * Updates the URL text, called when a form item changes.
     */
    updateQuery : function(){
      var queryStr = buildURL($('#fmeForm'));
      $('#query-panel-results').text(queryStr);
    }
  };
}());
