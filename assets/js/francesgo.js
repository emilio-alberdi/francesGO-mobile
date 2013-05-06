	//$("[id^=appFooter]").empty().append($('#footerNav'));


   	baseUrl = 'http://192.168.1.107:8080/francesGo2-portal/mobile/';
//   	baseUrl = 'https://bbvawebqa.bancofrances.com.ar/francesGo2-portal/mobile/';
//   	baseUrl = 'http://m.francesgo.com.ar/francesGo2-Portal/mobile/';
   	$( document ).bind( "mobileinit", function() {
	    // Make your jQuery Mobile framework configuration changes here!
   		$.support.cors = true;
	    $.mobile.allowCrossDomainPages = true;
	    $.mobile.page.prototype.options.addBackBtn = true;
		
	});
   	
   	if(navigator.geolocation){
   		
   		navigator.geolocation.getCurrentPosition(savePosition, displayError,{ maximumAge: 600000, timeout: 10000} );
   		
   	}

	Storage.prototype.setObject = function(key, value) {
		if (value) {
			this.setItem(key, JSON.stringify(value));	
		}	
	};

	Storage.prototype.getObject = function(key) {
	    var value = this.getItem(key);
	    try {
		    return value && JSON.parse(value);
	    }
	    catch (e) {
	    	console.log('parse error', e);
	    }
	};
	
	function UserPreferences() {
		this.theme = '';	
		this.latitude = 0;
		this.longitude = 0;
	}
	
	function displayError(error) {
		var errors = {
			 1:'La aplicación no tiene los permisos para acceder al GPS',
			 2:'La posición actual no se encuentra disponible',
			 3:'GPS desactivado. Por favor activelo'
		};
		console.log(errors[error.code]);
		alert(errors[error.code]);
	}
	
	function savePosition(position) {
			
		console.log('save user position');
		
		Preferences.get().latitude = position.coords.latitude;
		
		Preferences.get().longitude = position.coords.longitude;
		
		Preferences.update();
	}
	
	function Preferences() {
		
	}
	
	
	Preferences.userPreferences;

	Preferences.update = function() {
		if(supportLocalStorage()){
			localStorage.setObject('preferences', Preferences.userPreferences);
		}
	};

	Preferences.load = function() {
		if(supportLocalStorage()){
			Preferences.userPreferences = localStorage.getObject('preferences');
		}
	
		if (!Preferences.userPreferences) {
			Preferences.userPreferences = new UserPreferences();	
		}
		
		return Preferences.userPreferences;
	};

	Preferences.get = function() {
		
		if (!Preferences.userPreferences) {
			return Preferences.load();
		}
		
		return Preferences.userPreferences;
	};
	
	
	function PersistService(options) {
		this.options = options;
		
		if (!options.remoteService) {
			this.remoteService = new RemoteService(options);
		}
		else {
			this.remoteService = options.remoteService ;
		}
		
		this.remoteService.add(this);
		
		this.collectionCache = {};
		
		this.lastUpdate = null;
	}
	PersistService.prototype.sortCollection = function(collection) {
		if (this.options.sortFunction) {
			collection.sort(function (item1,item2){
				
				var nameA = item1.nombre.toUpperCase();
     		   
     		   	var nameB = item2.nombre.toUpperCase();
     		   
     		   return (nameA < nameB) ? -1 : (nameA > nameB) ? 1 : 0;
			});
		}
		else {
			collection.sort(function (item1, item2) {
				return item1.id - item2.id;
			});
		}
	};

	PersistService.prototype.getSort = function() {
		if (this.options.sortFunction) {
			return this.options.sortFunction;
		}
		else {
			var sort = function (item1, item2) {
				return item1.id - item2.id;
			};
			
			return sort;
		}
	};
	
	PersistService.prototype.getFilter = function() {

		if(supportLocalStorage()){
			return localStorage.getObject(this.options.name + "-filter");
		}else return null;
		
	};
	
	PersistService.prototype.loadCollection = function(data) {
		
		if (!data) {
			
			console.log('error load cant persist an empty collection: ');
				
			return;
		}
	
		console.log('load data: ', data);
		
		var collection = data;
		
		if (this.options.filterCollection) {
			collection =  this.options.filterCollection(data);
		}
		
		if (this.options.processData) {
			this.options.processData(collection);
		}
		
		if (this.options.appendFirst) {
			
			var persitedCollection;
			
			if(supportLocalStorage()){
				persitedCollection = localStorage.getObject(this.options.name);
			}
		
			if (!persitedCollection) {
				
				if(supportLocalStorage()){
					localStorage.setObject(this.options.name, collection);	
				}
			}
			else {
				
				collection =  collection.concat(persitedCollection);
		
				if(supportLocalStorage()){
					localStorage.setObject(this.options.name, collectionToConcat);	
				}
				
			}
			
		}
		else if (this.options.appendLast) {
			
			var filter = this.getFilter();
			
			if(filter && filter.numberLastIndex && filter.numberLastIndex > 50){
				
				var persitedCollection;

				var persitedCollectionConcat ;
				
				if(supportLocalStorage()){
				
					persitedCollection = localStorage.getObject(this.options.name);
					
					persitedCollectionConcat = localStorage.getObject(this.options.name+"-concat");
					
					if(persitedCollection && persitedCollectionConcat ){
						persitedCollection = persitedCollectionConcat ;
					}
				}
				
				if (!persitedCollection) {
					
					if(supportLocalStorage()){
						localStorage.setObject(this.options.name, collection);	
					}
				}
				else {
					
					var collectionToConcat = persitedCollection.concat(collection);
					
					if(supportLocalStorage()){
						localStorage.setObject(this.options.name+"-concat", collectionToConcat );	
						
					}
					
				}
			}else{
				if(supportLocalStorage()){
					localStorage.setObject(this.options.name, collection);
					
				}
			}
			
		}
		else if (this.options.merge) {
			
			var persistedCollection;
			var persistedCollectionConcat;
			
			if(supportLocalStorage()){
				
				persistedCollection = localStorage.getObject(this.options.name);
				
				
			}
			
			if (!persistedCollection) {
				if(supportLocalStorage()){
					localStorage.setObject(this.options.name, collection);	
				}
			}
			else {
				
				this.sortCollection(persistedCollection);
				
				this.sortCollection(collection);

				var list = []
				
				var counter = 0;
				
				for(var i=0; i< persistedCollection.length; i++) {
					
					var persistedItem = persistedCollection[i]
					
					if (counter >= collection.lehgth) {
						list.push(persistedItem);
						continue;
					}
					
					var item = collection[counter];
					
					var order = this.getSort(persistedItem, item);
					
					if (order < 0) {
						list.push(persistedItem);
					   
						continue;
						
					}
					
					if (order == 0) {
						if (this.option.mergeFunction) {
							list.push(this.option.mergeFunction(persistedItem, item));
						}
						else {
							list.push(item);
						}
					}
					
					while (order > 0 && counter < collection.length) {
						
						list.push(item);
						   
						counter++;
						
						item = collection[counter];
						
						order = this.getSort(persistedItem, item);
					}
					
				}
				
				if(supportLocalStorage()){
					
					localStorage.setObject(this.options.name, collection);	
				}
				
			}
		
		}	
		else {
			if(supportLocalStorage()){
				localStorage.setObject(this.options.name, collection);
				
			}
		}
		
		if (this.options.maxItems && this.options.maxItems < collection.length) {
			
			if(supportLocalStorage()){
				localStorage.setObject(this.options.name, collection.slice(0, this.options.maxItems));
			}
			
		}
		
		var expirationDays = null;
		
		if (this.options.expirationDays) {
			
			expirationDays =  new Date();
			expirationDays.setHours(0);
			expirationDays.setMinutes(0);
			expirationDays.setSeconds(0);
			
			expirationDays.setTime(expirationDays.getTime() + this.options.expirationDays * 86400000 );
		
		}
		
		if(supportLocalStorage()){
			localStorage.setObject(this.options.name + '-metadata', {lastUpdate:new Date(), expirationDate:expirationDays});
			
		}
		
		console.log('store data: ', collection);
		
		return collection;

	};
	
	PersistService.prototype.loadData = function(processCollection, persistService,data) {
		
		try {
			var result =  persistService.loadCollection(data);
			
			if (!result) {
				console.log('Collection is empty ', this.options.name);
				return;
			}
			
			this.createCache(result);
			
			if (processCollection){
			
				processCollection(result);
			}
			
		}
		catch (e) {
			console.log('error', e);
		}
	};
	
    PersistService.prototype.remove = function() {
		
		try {
			localStorage.removeItem(this.options.name);
			
		}
		catch (e) {
			console.log('error', e);
		}
	}

	PersistService.prototype.createCache = function(collection) {
		
		var getById = function(item) {
			try {
				return parseInt(item.id);
			}
			catch (e) {
			} 
			return item.id;
		};
		
		if (this.options.getByIdFunction) {
			getById = this.options.getByIdFunction
		}
		
		this.collectionCache = {};
		
		var persistService = this;
		
		collection.forEach(function(item){
		
			persistService.collectionCache[getById(item)] = item;
			
		});
//		persistService.collectionCache.init = true;
	};
	
	PersistService.prototype.getById = function(id) {
		
		var value;
		
		
		if (this.collectionCache || !this.collectionCache.isEmptyObject()) {
			value =  this.collectionCache[id]
		}
		
		if (value) {
			return value;
		}
		else {

			var collection;
			if(supportLocalStorage()){
				collection = localStorage.getObject(this.options.name);
				
			}
			
			if (!collection) {
				
				
				return;
			}
			
			this.createCache(collection);
			
			return this.collectionCache[id];
			
		}
		
	};
	
	PersistService.prototype.update = function(item) {
		
		var getById = function(item) {
			return item.id;
		};
		
		if (this.options.getByIdFunction) {
			getById = this.options.getByIdFunction;
		}
		
		if (this.collectionCache) {
		
			this.collectionCache[getById(item)] = item
		}
		else {

			var collection;
			if(supportLocalStorage()){
				collection = localStorage.getObject(this.options.name);
			}
			
			this.createCache(collection)
			
			this.collectionCache[getById(item)] = item;
			
		}
		
		var list = []
		
		for (property in this.collectionCache) {
		
			if(this.collectionCache.hasOwnProperty(property)) {
				list.push(this.collectionCache[property]);	
			}
			
		}
		
			
		this.sortCollection(list);
		
		if(supportLocalStorage()){
			localStorage.setObject(this.options.name, list);
		}
	}
	

	PersistService.prototype.getFilteredCollection = function(filter, processCollection) {

		if(supportLocalStorage()){
			localStorage.setObject(this.options.name + "-filter", filter);
			
		}
		
		var persistService = this;
		
		console.log('collection: ' + this.options.name + " filter: ", filter );
		
		var callback = function (data) {
			var collection;
			
			var collectionConcat;
			
			$.mobile.loading('hide');
			
			if(supportLocalStorage()){
				collection = localStorage.getObject(persistService.options.name);
				
			}
			
			if(supportLocalStorage()){
				collectionConcat = localStorage.getObject(persistService.options.name+"-concat");
				
			}
			
			if(filter && filter.numberLastIndex > 50){
				collection = persistService.options.filterCollection(data);
			}
			
			processCollection(collection)
		}
		
		this.remoteService.callFilter(filter, callback);
	
		
	}
	PersistService.prototype.forceReloadCollection = function() {
		this.remove();
		if (this.getFilter()) {
			this.getFilteredCollection(this.getFilter(), function(collection) {})
		}
		else {
			this.getCollection(function(collection) {})
		}
	}
	
	PersistService.prototype.reloadCollection = function(){
		
		if(this.getFilter()){
			this.getFilteredCollection(this.getFilter(), function(collection){})
		}else{
			this.getCollection(function(collection){})
		}
	}

	
	PersistService.prototype.getCollection = function(processCollection) {
		
		var collection ;
		if(supportLocalStorage()){
			collection = localStorage.getObject(this.options.name);
			
		}
		var collectionConcat;
		if(supportLocalStorage()){
			collectionConcat = localStorage.getObject(this.options.name+"-concat");
		}
		
		
		if(collection && collectionConcat){
			collection = collectionConcat;
		}
		
		
		var metadataCollection;
		if(supportLocalStorage()){
			metadataCollection = localStorage.getObject(this.options.name + "-metadata");
			
		}
		
		var expired = false;
		
		if (collection  && this.options.expirationDays) {
			expired = !metadataCollection.expirationDate || metadataCollection.expirationDate < new Date()  
		}
		
		var persistService = this;
		
		if (!collection || expired) {
			
			console.log('collection: ' + this.options.name + " not found" );
			
			
			var callback = function (data) {
		
				if(supportLocalStorage()){
					var collection = localStorage.getObject(persistService.options.name);
					
				}
				
				processCollection(collection)
			}
			
			
			if (this.options.filter ) {
			
				if(supportLocalStorage()){
					var filter = localStorage.getObject(this.options.name + "-filter");
					
				}
				
				if (!filter) {
					filter = this.options.emptyFilter();
				}
				else if (this.options.updateFilter) {
					this.options.updateFilter(filter);
				}	
				console.log('collection: ' + this.options.name + " filter: ", filter );
				
				this.remoteService.callFilter(filter, callback);	
			}
			else {
				this.remoteService.call(callback);	
			}
			
			
		}
		else if (processCollection){
		
			console.log('collection: ' + this.options.name + " " + collection.length);
			
			this.createCache(collection)
			
			processCollection(collection)
		}	
		
		
	}
	
	function RemoteService(options) {
		this.options = options;
		this.services = []; 
	}
	
	RemoteService.prototype.add = function(service) {
		
		this.services.push(service)
	
	}
	
	RemoteService.prototype.call = function(processCollection) {
		
		var services = this.services;
		
		var callback = function (data) {
			try {
				
				$.mobile.loading('hide');				
				
				services.forEach(function(persistService) {
					
					persistService.loadCollection(data)	
					
				})
			
				processCollection();
				
			}
			catch(e) {
				console.log('error', e);
			}
		}
		
		$.mobile.loading('show');
		
		$.ajax({url:this.options.service, type:'POST', cache: false, success: callback, error: function(jqXHR, textStatus, errorThrown) {
			  
			try{
				
				console.log(textStatus, errorThrown);
				
				alert("error " + this.options.service + " " + textStatus  + " "+ errorThrown );
				
				$.mobile.loading('hide');
				
				if(navigator.onLine){
					alert('Error on service ' + this.options.service + " " + textStatus  + " "+ errorThrown )
				}else{
					alert("Su dispositivo no esta conectado a internet, por favor verifique la conectividad");
				}
			}catch(e){
				alert("error on call: " + e);
				
				$.mobile.loading('hide');
				
			}
			  
		}});
		
	}
	

	RemoteService.prototype.callFilter = function(data, processCollection) {
		
		var services = this.services;
		
		var callback = function (data) {
			try {
				
				$.mobile.loading('hide');
				
				services.forEach(function(persistService) {
					
					persistService.loadCollection(data) ;
					
				})
			
				processCollection(data);
				
			}
			catch(e) {
				alert('error en callFilter '+ e);
				console.log('error ', e);
			}
		}
		
		try{

			var path = this.options.service;

			if(data.zonas){
				data.zonas = data.zonas.toString(); 
			}
			if(data.rubros){
				data.rubros = data.rubros.toString();
			}

			checkNavigator(path, data, processCollection, services);

			$.mobile.loading('show');
			
			$.ajax({url:this.options.service, type:'POST', data:data,cache: false, success: callback, error: function(jqXHR, textStatus, errorThrown) {
				
				try{
					$.mobile.loading('hide');
					
					if(navigator.onLine){
						alert('Error on service ' + this.options.service + " " + textStatus  + " "+ errorThrown )
					}else{
						alert("Su dispositivo no esta conectado a internet, por favor verifique la conectividad");
					}
				}catch(e){
					alert("Error en el servicio, por favor intente nuevamente mas tarde ");
					$.mobile.loading('hide');
				}
			}});
			
			
		}catch(e){
			console.log('error ' + e);
			
			$.mobile.loading('hide');
		}
	}

function supportLocalStorage(){
	if(localStorage){
		return true;
	}else{
		alert('no soporta localStorage');
		return false;
	}
}
	
function checkNavigator(path, postData, processCollection, services){
		
	var ua = navigator.userAgent;

	if (ua.indexOf("BlackBerry") >= 0) {
        if (ua.indexOf("Version/") >= 0) { // ***User Agent in BlackBerry 6 and BlackBerry 7
            Verposition = ua.indexOf("Version/") + 8;
            TotLenght = ua.length;
        }
        else {// ***User Agent in BlackBerry Device Software 4.2 to 5.0
            var SplitUA = ua.split("/");
            callFilterForBlackBerry(path,postData,processCollection, services);
            return ;
        }
    }

}


function isBlackBerry(){
	var ua = navigator.userAgent;

	var blackberry ;
	if (ua.indexOf("BlackBerry") >= 0) {
		blackberry = true;
	}else{
		
		blackberry = false;
	}
	
	return blackberry;
}
	
function callFilterForBlackBerry(path, postData, processCollection,services){
		try{
			var req = createXMLHTTPObject();
			
			if (!req){
				alert('Objeto xml no soportado por el browser');
				return;
			}
			
			var method = (postData) ? "POST" : "GET";
			
			req.overrideMimeType('application/json');

			$.mobile.loading('show');
			
			req.open(method,path,true);
			
			if (postData){
				req.setRequestHeader('Content-type','application/x-www-form-urlencoded');
			}
			req.onreadystatechange = function () {
				processCall(req,services,processCollection);
			};
			
			req.send(postData);
			}catch(e){
				console.log('error ' + e);
			}
	}
	
	function createXMLHTTPObject(){
		
		var xmlhttp=null;
		
		if (window.XMLHttpRequest) {
		
			xmlhttp=new XMLHttpRequest();
		  
		}else if (window.ActiveXObject) {
		  
			xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
		  
		}else{
			  alert('Por favor verifique el navegador que esta usando. En caso de ser necesario actualicelo a la ultima version')
		}
		
		return xmlhttp;
	}
	
function processCall(xml,services,processCollection){
		
		if (xml.readyState == 4 && (xml.status == 200 || window.location.href.indexOf ("http") == - 1)){
			
			$.mobile.loading('hide');
			
			var data = JSON.parse(xml.responseText);
			
			alert(data);
			
			try {
				
				services.forEach(function(persistService) {
					
					persistService.loadCollection(data) ;
					
				});
				processCollection();
			}
			catch(e) {
				console.log('error', e);
				alert('error', e);
			}
		}
	}
	
	console.log('start ');
	
	
	var remoteService = new RemoteService({service:  baseUrl + 'mobile-initialization.json'});
	
	var beneficiosPersistenceService = new PersistService({name:'beneficios', 
		       service:baseUrl + 'mobile-beneficios.json',
		       expirationDays:1,
		       filter:true,
		       emptyFilter:function() {
					var filter = {}
					
					filter.latitude = Preferences.get().latitude;
					filter.longitude = Preferences.get().longitude;
				   
					return filter;
			   },
			   updateFilter:function(filter) {
					filter.latitude = Preferences.get().latitude;
					filter.longitude = Preferences.get().longitude;
			   },
			   filterCollection:function(data) { return data.beneficios[0]},
			   appendLast:function(){}
			   
	});
	
	beneficiosPersistenceService.getLogo = function(beneficio) {
		var image = '';
		
		if (beneficio.logoSmall) {
			
			image = baseUrl + 'image-resources/'  + beneficio.logoSmall;
		
		}
		else if (beneficio.listaRubrosAsociados) {
			
			var rubros = beneficio.listaRubrosAsociados.split(",");
			
			if (rubros.length > 0) {
				
				var rubro = rubrosPersistenceService.getRubroPadre(parseInt(rubros[0]))
				
				if (rubro) {
					if(rubro.logoSmall){
						image = baseUrl + 'image-resources/'  + rubro.logoSmall;
					}
				}
				
			}
			
		}
	
		return image;
	}
	
	
	beneficiosPersistenceService.showBeneficio = function(beneficio) {
		
			var image = this.getLogo(beneficio);
		
			$("#ul-beneficios").append("" +
					"<li>" +
						"<a id='beneficio-" + beneficio.hash + "' >" +
								"<img  height='30' width='30' id='beneficio-" + beneficio.hash + "-logo' class='ui-li-icon' src='" + image + "' ></img> " +
								"<span class=''>" +
									"<h3 class='ui-li-heading'>" + beneficio.nombreComercio + "</h3>" +
									"<p id='beneficio-" + beneficio.hash + "-distance' class='ui-li-aside ui-li-desc'></p>" +
									"<p>" + beneficio.mensajeCorto  +"</p>" +
								"</span>" +
						"</a>" +
					"</li>")
			
			$("#beneficio-" + beneficio.hash ).data("beneficio", beneficio)

			$("#beneficio-" + beneficio.hash).click(function(e) {
				
				$.mobile.changePage("#ver-beneficio",  { transition: "slide"} );
				
				$("#ver-beneficio").trigger({type:"display-data", beneficio:$(this).data("beneficio")})
			})
			
			
			try {
				ensureGMaps(function () {
					try {
						if(beneficio.latitud != 0 || beneficio.longitud != 0){
							
							var currentPosition = new google.maps.LatLng(Preferences.get().latitude, Preferences.get().longitude);
							
							var sucursalPostion = new google.maps.LatLng(beneficio.latitud, beneficio.longitud);
							
							var distance = google.maps.geometry.spherical.computeDistanceBetween (currentPosition, sucursalPostion);
							
							distance = Math.ceil(distance/1000 )
							
							$("#beneficio-" + beneficio.hash + "-distance").text(distance + "km.")
						}
					}
					catch(e) {
						console.log("Comercio error " ,e)
					}
				
				})
				
			}
			catch(e) {
				console.log("Comercio error " ,e)
			}
			
	
   };
   var sucursalesPersistenceService = new PersistService({name:'sucursales', 
       service:baseUrl + 'mobile-sucursales.json',
       expirationDays:1,
       filter:true,
       emptyFilter:function() {
			var filter = {}
			
			filter.latitud = Preferences.get().latitude;
			filter.longitud = Preferences.get().longitude;
		   
			return filter;
	   },
	   updateFilter:function(filter) {
			filter.latitud = Preferences.get().latitude;
			filter.longitud = Preferences.get().longitude;
	   },
	   filterCollection:function(data) { return data.sucursales[0]},
	   appendLast:function(){}
	   
   });
  
   sucursalesPersistenceService.showSucursal = function(sucursal) {
			
				$("#ul-sucursales").append("<li><a id='" + sucursal.uri + "' ><h3>" + sucursal.codigo + " - "+ sucursal.nombre +"</h3><p id='" + sucursal.uri + "-distance' class='ui-li-aside ui-li-desc'></p><p>" + sucursal.domicilio  +"</p> </a></li>")
				
				$("#" + sucursal.uri).data("sucursal", sucursal)
				
				try {
					ensureGMaps(function () {
						var currentPosition = new google.maps.LatLng(Preferences.get().latitude, Preferences.get().longitude);
						
						var sucursalPostion = new google.maps.LatLng(sucursal.latitud, sucursal.longitud);
						
						var distance = google.maps.geometry.spherical.computeDistanceBetween (currentPosition, sucursalPostion);
						
						distance = Math.ceil(distance/1000 )
						
					//	console.log("Sucursal " + sucursal.nombre, distance)
						
						$("#" + sucursal.uri + "-distance").text(distance + "km");
					})
					
				}
				catch(e) {
					
				}
				
				
				$("#" + sucursal.uri).click(function(e) {
					
					$.mobile.changePage("#ver-sucursal", { transition: "slide"} )
					
					$("#ver-sucursal").trigger({type:"display-data", sucursal:$(this).data("sucursal")})
					
				})

			
	   };

	   var cajerosPersistenceService = new PersistService({name:'cajeros', 
	       service:baseUrl + 'mobile-cajeros.json',
	       expirationDays:1,
	       filter:true,
	       emptyFilter:function() {
				var filter = {}
				
				filter.latitud = Preferences.get().latitude;
				filter.longitud = Preferences.get().longitude;
			   
				return filter;
		   },
		   updateFilter:function(filter) {
				filter.latitud = Preferences.get().latitude;
				filter.longitud = Preferences.get().longitude;
		   },
		   filterCollection:function(data) { return data.cajeros[0]},
		   appendLast:function(){}
		   
	   });

		cajerosPersistenceService.showCajero = function(cajero) {
			
			$("#ul-cajeros").append("<li><a id='" + cajero.uri + "' ><h3>" +  ((cajero.sucursalBanco.id) ? cajero.sucursalBanco.id + " - " : "") +((cajero.sucursalBanco && cajero.sucursalBanco.nombre ) ? cajero.sucursalBanco.nombre : ' BBVA Frances') +  "</h3><p id='" + cajero.uri + "-distance' class='ui-li-aside ui-li-desc'></p><p>" + cajero.domicilio  + " (" + cajero.tipoCajeroBanco.descripcion + ") </p> </a></li>")
			
			$("#" + cajero.uri).data("cajero", cajero)
			
			try {
				ensureGMaps(function () {
					var currentPosition = new google.maps.LatLng(Preferences.get().latitude, Preferences.get().longitude);
					
					var cajeroPostion = new google.maps.LatLng(cajero.latitud, cajero.longitud);
					
					var distance = google.maps.geometry.spherical.computeDistanceBetween (currentPosition, cajeroPostion);
					
					distance = Math.ceil(distance/1000 )
					
					$("#" + cajero.uri + "-distance").text(distance + "km")
				})
				
			}
			catch(e) {
				
			}
			
			
			$("#" + cajero.uri).click(function(e) {
				
				$.mobile.changePage("#ver-cajero",  { transition: "slide"} )
				
				$("#ver-cajero").trigger({type:"display-data", cajero:$(this).data("cajero")})
				
			})

		
   };

	
	var rubrosPersistenceService = new PersistService({name:'rubros', 
													   remoteService:remoteService, 
													   merge:true,
													   filterCollection:function(data) { return data.rubros[0];},
													   processData:function(collection) {
														   collection.forEach(function(rubro) {
															   rubro.selected = false; 
														   });
														   
												       },
	                                                   mergeFunction:function(rubroPersistedItem,rubroItem) {
	                                                	   rubro.selected = rubroPersistedItem.selected;
	   													   return rubro;	
	                                                   },
	                                                   sortFunction:function(collection){
	                                                   }
													   
	});
	
	rubrosPersistenceService.subRubros = {}
	
	
	rubrosPersistenceService.createSubRubroList = function() {
		
		this.getCollection(function (rubros) {
			
			rubros.forEach(function(rubro) {
				
				if (!rubro.subRubros) {
					return;
				}
					
				rubro.subRubros.forEach(function (subRubro) {
					rubrosPersistenceService.subRubros[subRubro.id] = rubro.id
				})
				
				rubrosPersistenceService.subRubros.init = true;
					
			})
		
			
		}) 
		
	}

	rubrosPersistenceService.getRubroPadre = function(id) {
		
		if (!this.subRubros.init) {
			
			this.createSubRubroList()
		}
	
		var rubro = this.getById(id)
		
		if (rubro) {
			return rubro;
		}
		
		var rubroId =  this.subRubros[id]
		
		return this.getById(rubroId);
	}
	
	var zonasPersistenceService = new PersistService({name:'regionesOrdenables', 
		   											  remoteService:remoteService, 
													  merge:true,
													  filterCollection:function(data) { return data.regionesOrdenables[0]},
													  processData:function(collection) {
														   collection.splice(0,0, {id:-1, nombre:'Mi ubicacion'})
														   collection.forEach(function(zona) {
															   zona.selected = false;
															   zona.sucursalSelected = false; 
															   zona.cajerosSelected = false; 
																
														   });
													  },
												      mergeFunction:function(zonaPersistedItem,zonaItem) {
												        	zona.selected = zonaPersistedItem.selected;
												        	zona.sucursalSelected = zonaPersistedItem.sucursalSelected;
												        	zona.cajerosSelected = zonaPersistedItem.cajerosSelected;
															
												        	return zona;
												      }
													   
											});

	var tiposDocumentoPersistenceService = new PersistService({name:'tiposDocumento', 
			  remoteService:remoteService, 
	  	      filterCollection:function(data) { return data.tiposDocumento[0];}
		      });

	var operadoresTelefonicoPersistenceService = new PersistService({name:'operadoresTelefonico', 
		  remoteService:remoteService, 
	      filterCollection:function(data) { return data.operadoresTelefonico[0];}
	      });
	var tipoCajerosPersistenceService = new PersistService({name:'tipoCajeros', 
		  remoteService:remoteService, 
	      filterCollection:function(data) { return data.tipoCajeros[0];}
	      });

	var tipoSucursalPersistenceService = new PersistService({name:'tipoSucursal',
		  remoteService:remoteService,
		  filterCollection:function(data) { return data.tipoSucursal[0];}
		  });
	var codigosAreaCelularPersistenceService = new PersistService({name:'codigosAreaCelular', 
		  remoteService:remoteService, 
	      filterCollection:function(data) { return data.codigosAreaCelular[0];}
	      });	
	var bannersPersistenceService = new PersistService({name:'banners', 
		  service:baseUrl + 'mobile-banners.json',
		  filterCollection:function(data) { return data.banners[0];}
	      });	

	var campaniasPersistenceService = new PersistService({name:'campanias', 
	       service:baseUrl + 'mobile-campanias.json',
		   filterCollection:function(data) { return data.campanias[0];},			  
		   expirationDays:1,
		   processData:function(collection) {
			   collection.forEach(function(campania) {
				   campania.selected = false; 
			   });
		  },
		  getByIdFunction:function(campania) {
			  return campania.uri
		  }
    });
	

	var defaultMapConfig =  {
        'zoom' : 16,
        'mapTypeControl' : false,
        'navigationControl' : false,
        'streetViewControl' : false
    }
	
	function releaseData() {
			
		beneficiosPersistenceService.forceReloadCollection()
		sucursalesPersistenceService.forceReloadCollection()
		cajerosPersistenceService.forceReloadCollection()
		rubrosPersistenceService.remove();
		zonasPersistenceService.forceReloadCollection()
		bannersPersistenceService.forceReloadCollection()
		
	}
	
	function refreshMap(pageName){
		$('#'+ pageName).gmap('clear', 'markers');
		$('#'+ pageName).gmap('clear', 'listeners');
		$('#'+ pageName).gmap('clear' , 'directionsRenderer');
		var directionsRenderer = $('#' + pageName).gmap('get', 'services > DirectionsRenderer');
		if (directionsRenderer) {
			console.log("Ruta BORRADA OK")
			directionsRenderer.setMap(null);
			directionsRenderer.setPanel(null);
		}
	}
	function unCheckAll(idName){
		var idNameBox = idName.toLowerCase();
		
		$(".regionesOrdenables"+idName+"-update").each(function(){
			
			if(this.id != idNameBox+'-zona-undefined' && this.checked){

				this.checked = false;
				
				var checkBox = $("#"+ this.id); 
		
				checkBox.prop("checked",false).checkboxradio("refresh");

				var zonaMiUbicacion = zonasPersistenceService.getById(checkBox.prop('zonaId'))
				
				if(idName == 'Sucursal'){
					zonaMiUbicacion.sucursalSelected = checkBox.prop("checked")
				}
				if(idName == 'Cajero'){
					zonaMiUbicacion.cajeroSelected = checkBox.prop("checked")
				}else{
					zonaMiUbicacion.selected = checkBox.prop("checked")
				}
				
				zonasPersistenceService.update(zonaMiUbicacion)
				
			}
		});
	}
	
	function checkearActivos(idClass){
		
		var idCheckBox = idClass.toLowerCase();
		
		var statusTrue = false; 
		var statusFalse = false
		
		$(".regionesOrdenables"+idClass+"-update").each(function(){ 
			if(this.checked && this.id != idCheckBox+"-zona-undefined"){
				statusTrue = true; 
			}else
				statusFalse = false;
		});
		return (statusTrue == true) ? statusTrue : statusFalse
	}
	
	function registerGMapsToPage(pageName) {
		$("#" + pageName).live('pagebeforehide',function() {
			$('#'+ pageName + '-mapa').gmap('clear', 'markers');
		})

		$("#"+ pageName ).live('pageinit',function() {
			$('#'+ pageName + '-mapa').gmap(defaultMapConfig)
		})

		$('#'+ pageName).live("pageshow", function() {
			$('#'+ pageName + '-mapa').gmap('option', 'zoom', 16)
		    $('#'+ pageName + '-mapa').gmap('refresh');
		});		
		
	}
	
	function createMarker(beneficio){
		
		var imageIcon = beneficiosPersistenceService.getLogo(beneficio);
		
		var marker = {'position': new google.maps.LatLng(beneficio.latitud , beneficio.longitud), 'bounds': false}
			
		if (imageIcon) {
			
			
			var img = new Image();
			img.src = imageIcon;
			var ih=img.height; 
			var iw=img.width; 
			
			
			var maxWidth = 30, maxHeight = 30;
			if (iw > maxWidth || ih > maxHeight) {
				if (iw < ih) {
					ih = (ih * maxWidth) / iw;
					iw = maxWidth;
				}
				else {
					iw = (iw * maxHeight) / ih;
					ih = maxHeight;
				}
			}
			scale = new google.maps.Size(iw,ih) ; 
			var image = new google.maps.MarkerImage(imageIcon,null,null,null, scale);				
			marker.icon = image;
		}else{
			var img = new Image();
			
			img.src = baseUrl + 'assets/images/icons/pinFgo.png'
			
			var image = new google.maps.MarkerImage(img.src,null,null,null, null);		
			
			marker.icon = image
		}
		
		return marker;
	}

	function changeTheme(select) {
		
		Preferences.get().theme = $(select).val()
		
		Preferences.update();
		
		$("#theme-css").attr("href",'assets/stylesheets/css/themes/' + Preferences.get().theme.toLowerCase()   + '.css');
		
	}
	
	function generateBannerForBeneficios(){
		
		var page = $("#listar-beneficios");
		
		page.append('<div  data-role="footer"  ><img id="bannerImage"  /></div>').trigger('create');
	
			bannersPersistenceService.getCollection(function(collection) {
				
				if (!collection || collection.length == 0) {
					return;
				}
				
				var index=Math.floor(Math.random()*collection.length)
				
				var nombreArchivo = collection[index].nombreArchivo;
				
				var image = page.find('#bannerImage');
				
				image.attr("src", baseUrl + 'image-resources/' + nombreArchivo);
				
			});
	}
	
	
	function sendBeneficios(){

		console.log("start filter");

		$("#buscar-mas-beneficios").hide()
		
		$("#sin-resultados-beneficios").hide();
		
		$("#fin-beneficios").hide();
		
		var filter = {}
		
		filter.searchText = $("#buscar-beneficios-search").val();
		
		var patron = /\w/;
	    
		if(filter.searchText && filter.searchText.length > 0){
			
			if(!patron.test(filter.searchText)){
				
				$("#buscar-beneficios-search").css("border", "1px solid red");   
				
				alert('Ingresar solo letras o numeros');
				
				return;
			}
		}
	    
	    
		filter.numberFirstIndex = 1;
		filter.numberLastIndex = 50;
		
		rubrosPersistenceService.getCollection(function(collection) {
			
			filter.rubros = collection.filter(function(rubro) {
				return rubro.selected
			}).map(function(rubro) {
				return rubro.id
			})
		})
		
		
		zonasPersistenceService.getCollection(function(collection) {
			filter.zonas = collection.filter(function(zona) {
				return zona.selected && zona.id != -1
			}).map(function(zona) {
				return zona.id
			});
		})
		
		var currentLocation = zonasPersistenceService.getById(-1)
		
		if (currentLocation.selected) {
			filter.checkMiUbicacion = true;
		}else{
			filter.checkMiUbicacion = false;
		}
		
		filter.latitude = Preferences.get().latitude;
		filter.longitude = Preferences.get().longitude;
		
		beneficiosPersistenceService.getFilteredCollection(filter, function(collection) {
		
			$.mobile.changePage("#listar-beneficios" , { transition: "slide"} )
			
			$("#fin-beneficios").hide();
			
			$("#ul-beneficios").empty();
			
			collection.forEach(function(beneficio) {
				
				beneficiosPersistenceService.showBeneficio(beneficio);
				
			})
			
			if(collection.length == 0){
				$("#sin-resultados-beneficios").show();
			}else{
				if(collection.length == filter.numberLastIndex){
					$("#buscar-mas-beneficios").show();
				}else{
					$("#fin-beneficios").show();
				}
			}
			
			
			$("#ul-beneficios").listview('refresh');
			
			console.log('referesh');
			
				
		});	
	}
	
	function sendSucursales(){
		
		console.log("start filter");

		$("#fin-sucursales").hide();
		
		$("#buscar-mas-sucursales").hide()
		
		$("#sin-resultados-sucursales").hide();
		
		var filter = {}
		
		filter.numberFirstIndex = 1;
		
		filter.numberLastIndex = 50;
		
		var searchCode = $("#buscar-sucursal-nombre").val();
		
		if(searchCode && !isNaN(searchCode)){
			filter.searchCode = searchCode;
		}else
			filter.searchText = $("#buscar-sucursal-nombre").val();
		
		filter.tipoSucursal = $("#buscar-sucursales-tipoSucursal").val();
		
		zonasPersistenceService.getCollection(function(collection) {
			filter.zonas = collection.filter(function(zona) {
				return zona.sucursalSelected && zona.id != -1
			}).map(function(zona) {
				return zona.id
			})
		})
		
		var currentLocation = zonasPersistenceService.getById(-1)
		
		filter.checkMiUbicacion = false; 
		
		if (currentLocation.sucursalSelected) {
			filter.checkMiUbicacion = true;
		}
		
		filter.latitud = Preferences.get().latitude;
		
		filter.longitud = Preferences.get().longitude;

		$("#buscar-mas-sucursales").hide();
		$("#fin-sucursales").hide();
		
		sucursalesPersistenceService.getFilteredCollection(filter, function(collection) {

			$.mobile.changePage("#listar-sucursales" , { transition: "slide"} )
			
			$("#fin-sucursales").hide();

			$("#ul-sucursales").empty();
			
			$("#buscar-mas-sucursales").hide()

			collection.forEach(function(sucursal) {
				
				sucursalesPersistenceService.showSucursal(sucursal);
				
			})
			
			if(collection.length == 0){
				console.log("no hubo resultados de la busqueda")
				$("#sin-resultados-sucursales").show();
			}else{
				if(collection.length == filter.numberLastIndex){
					$("#buscar-mas-sucursales").show();
				}else{
					$("#fin-sucursales").show();
				}
			}
			
			
			$("#ul-sucursales").listview('refresh');
			
			console.log('referesh');

		});	
		
	}
	
	function sendCajeros(){

		console.log("start filter");
		
		$("#sin-resultados-cajeros").hide();
		$("#fin-cajeros").hide();
		$("#buscar-mas-cajeros").hide();
		
		var filter = {}
		
		filter.numberFirstIndex =1;
		filter.numberLastIndex = 50;
		
		zonasPersistenceService.getCollection(function(collection) {
			filter.zonas = collection.filter(function(zona) {
				return zona.cajeroSelected && zona.id != -1
			}).map(function(zona) {
				return zona.id
			})
		})
		
		var currentLocation = zonasPersistenceService.getById(-1)
		
		filter.checkMiUbicacion = false;
	
		if (currentLocation.cajeroSelected) {
					
			filter.checkMiUbicacion = true;
		}
		
		filter.latitud = Preferences.get().latitude;

		filter.longitud = Preferences.get().longitude;
		
		filter.tipoCajeros = $("#buscar-cajeros-tipoCajero-filter").val();
		
		
		$('#buscar-cajeros-tipoCajero-filter  > option[value="'+filter.tipoCajeros+'"]').attr('selected', 'selected');
		
		filter.tipoCajeroDescripcion = $('#buscar-cajeros-tipoCajero-filter option:selected').html();	
		
		filter.expendeDolares = $("#buscar-cajeros-expendeDolares").val();
		
		cajerosPersistenceService.getFilteredCollection(filter, function(collection) {
		
			$.mobile.changePage("#listar-cajeros" , { transition: "slide"} )
			
			$("#fin-cajeros").hide();
			
			$("#ul-cajeros").empty();
			
			if(collection.length == 0){
				$("#sin-resultados-cajeros").show();
			}else{
				if(collection.length == filter.numberLastIndex){
					$("#buscar-mas-cajeros").show();
				}else{
					$("#fin-cajeros").show();
				}
			}
			
			collection.forEach(function(cajero) {
	
				cajerosPersistenceService.showCajero(cajero);

			})
			
			$("#ul-cajeros").listview('refresh');

		});	

	}
	
	
	function francesGORegisterEvents() {

	registerGMapsToPage('object-mapa');
	registerGMapsToPage('objects-mapa');
	registerGMapsToPage('ver-sucursal');
	registerGMapsToPage('ver-cajero');
	registerGMapsToPage('ver-beneficio');
	
	
	$('#preferencias-eliminar-cache').click(function(e){
		 if (confirm('¿Esta seguro de eliminar la cache de la aplicacion?')) {
			 releaseData();
	     }else{
	    	 return;
	     }
	})
	
	if (Preferences.get().theme && Preferences.get().theme.length > 0) {
		$("#theme-css").attr("href",'assets/stylesheets/css/themes/' + Preferences.get().theme.toLowerCase()  + '.css')
		
		$("#preferencias-theme").val(Preferences.get().theme)
		
	}
	
		
	console.log('start francesGORegisterEvents ');
	
	$(".banner").live("pageinit", function(event) {
		
		var page = $(this).page()
		
		console.log("Creando el DIV para insertar el banner");
		
		page.append('<div  data-role="footer"  ><img id="bannerImage"  /></div>').trigger('create');
		
	})
	
	$(".banner").live("pageshow", function(event) {
		
		var page = $(this).page()
		
		
		bannersPersistenceService.getCollection(function(collection) {
			
			if (!collection || collection.length == 0) {
				return;
			}
			
			var index=Math.floor(Math.random()*collection.length)
			
			var nombreArchivo = collection[index].nombreArchivo;
			
			console.log("Buscando el div para la carga del banner");
			
			var image = page.find('#bannerImage');
			
			console.log("Div? "+ image);
			
			console.log("Cargando el banner con nombre " + nombreArchivo);
			
			image.attr("src", baseUrl + 'image-resources/' + nombreArchivo);
			
		});
	})

	$("#registracion-baja").bind('display-data',function(e) {
		
		tiposDocumentoPersistenceService.getCollection(function(tiposDocumento) {
			try {
				tiposDocumento.forEach(function (tipoDocumento) {
					if(tipoDocumento.id != 6 && tipoDocumento.id != 7){
						$("#registracion-baja-tiposDocumento").append("<option value='" + tipoDocumento.codigoAltamira + "'>" + tipoDocumento.descripcionLarga +"</option>")
					}
				})
				
				$("#registracion-baja-tiposDocumento").selectmenu('refresh', true);
				
			} catch (e) {
				console.log(e);
			}
		
		})

		
	})
	
	$("#registracion").bind('display-data',function(e) {
		

		operadoresTelefonicoPersistenceService.getCollection(function(operadoresTelefonico) {
			
			operadoresTelefonico.forEach(function (operadorTelefonico) {
				$("#registracion-operadorCelular").append("<option value='" + operadorTelefonico.codigo + "'>" + operadorTelefonico.nombre +"</option>")	
			})
			
			$("#registracion-operadorCelular").selectmenu('refresh', true);
			
		})
		
		tiposDocumentoPersistenceService.getCollection(function(tiposDocumento) {
			
			tiposDocumento.forEach(function (tipoDocumento) {
				if(tipoDocumento.id != 6 && tipoDocumento.id != 7){
					$("#registracion-tiposDocumento").append("<option value='" + tipoDocumento.codigoAltamira + "'>" + tipoDocumento.descripcionLarga +"</option>")
				}
			})

			$("#registracion-tiposDocumento").selectmenu('refresh', true);
	
		})
		
		rubrosPersistenceService.getCollection(function(collection) {
			
			collection.forEach(function(rubro) {
				
				$("#registracion-rubro").append("<option value='" + rubro.uri + "'>" + rubro.nombre +"</option>")
			});
			$("#registracion-rubro").selectmenu('refresh', true);
		})
		
		zonasPersistenceService.getCollection(function(collection) {
			collection.forEach(function(zona) {
				if(zona.id != -1){
					$("#registracion-regionesOrdenables").append("<option value='" + zona.uri + "'>" + zona.nombre +"</option>")
				}
			});
			$("#registracion-regionesOrdenables").selectmenu('refresh', true);
		})
		

		
	})
	
	$("#registracion-baja-confirmation-link").click(function(e){
		
		console.log("validate")
			
		 var emptyFields = $("#registracion-baja-form").find(":input.required,select.required").filter(function() {
		        return !$.trim($(this).val()).length;
		 });
		 
		 
	    if(emptyFields.length) {
	        emptyFields.css("border", "1px solid red");   
	        alert("Debe seleccionar los campos indicados");
	        return false;
	    }
	    
	    var tipoDni = parseInt($('#registracion-baja-tiposDocumento').val())
	    
	    if(tipoDni == -1){
	    	alert("Debe seleccionar un tipo de documento")
	    	$('#registracion-baja-tiposDocumento').css("border", "1px solid red");
			return false;
	    }
	    
	    var dni = parseInt($('#registracion-baja-dni').val());
		 
		 if(isNaN(dni)){
			 alert("El número de documento debe ser númerico");		
			 $('#registracion-dni').css("border", "1px solid red");
			 return false;
		 }
		 
		 if(!(/^([0-9])+$/.test(dni) && (dni.toString().length > 4 && dni.toString().length < 9))){
			 alert('El número de documento ingresado no es un número válido.');
			 $('#registracion-dni').css("border", "1px solid red");
			 return false;
		 }
		 
	});
	
	$("#registracion-baja-confirmacion-send-link").click(function(e){
		
		 var callback = function(data) {

			 $.mobile.loading('hide');

			 $.mobile.changePage("#baja-resultado" ,  { transition: "slide"} )
			 
			 if(data.message){
				 $("#baja-registracion-resultado-message").html("<h6>"+data.message+"</h6>");
			 }else{
				 $("#baja-registracion-resultado-message").html("<h6> Para confirmar la baja le enviaremos un SMS al número de celular registrado.</h6>");
				 
			 }
		 }
		 
		 $.mobile.loading('show');
		 
		 $.ajax({url:baseUrl + "mobile-registracion-baja.json", type:'POST', data:$('#registracion-baja-form').serialize(),cache: false, success: callback, error: function(jqXHR, textStatus, errorThrown) {
			 alert("error");
			 
			 $.mobile.loading('hide'); 

			 if(navigator.onLine){
				  alert('Error on service ' + this.options.service + " " + textStatus  + " "+ errorThrown )
			  }else{
				  alert("Su dispositivo no esta conectado a internet, por favor verifique la conectividad");
			  }
		
		 }})
		
		
	}) 
	
	$("#registracion-confirmation-send-link").click(function(e){
		
		
		var aceptaTerminosLegales = $("#aceptaTerminosLegales").is(':checked') ;
		
		if (!aceptaTerminosLegales) {
			alert("Debe aceptar los términos y condiciones")
			return;
		}
		
		 var callback = function(data) {
			 
			 $.mobile.loading('hide');
			 
			 $.mobile.changePage("#registracion-resultado" , { transition: "slide"} )

			 if(data.message){
				 $("#registracion-resultado-message").html("<h6>"+data.message+"</h6>");
			 }else{
				 $("#registracion-resultado-message").html("<h6> Para confirmar esta registración le enviaremos un SMS al número de celular registrado.</h6>");
				 
			 }
		 }
		 
		 $.mobile.loading('show');
		 
		 $.ajax({url:baseUrl + "mobile-registracion.json", type:'POST', data:$('#registracion-form').serialize(),cache: false, success: callback, error: function(jqXHR, textStatus, errorThrown) {

			 alert("error");
			 
			 $.mobile.loading('hide');
			 
			 if(navigator.onLine){
				  alert('Error on service ' + this.options.service + " " + textStatus  + " "+ errorThrown )
			  }else{
				  alert("Su dispositivo no esta conectado a internet, por favor verifique la conectividad");
			  }
		 }})
		 
			 
	});
	
	$("#registracion-baja").live('pageinit',function() {
		
		$("#registracion-baja").trigger("display-data")
		
				
	})
	
	$("#registracion").live('pageinit',function() {
		$("#registracion").trigger("display-data")
	})
	
	$("#registracion-confirmation-link").click(function() {
		
		 console.log("validate")
		
		 var emptyFields = $("#registracion-form").find(":input.required,select.required").filter(function() {
		        return !$.trim($(this).val()).length;
		 });
		 
		 
		 if(emptyFields.length) {
	        emptyFields.css("border", "1px solid red");   
	        alert("Debe seleccionar los campos indicados");
	        return false;
		 }
	    
		 var dni = parseInt($('#registracion-dni').val());
		 
		 if(isNaN(dni)){
			 alert("El número de documento debe ser númerico");		
			 $('#registracion-dni').css("border", "1px solid red");
			 return false;
		 }
		 
		 if(!(/^([0-9])+$/.test(dni) && (dni.toString().length > 4 && dni.toString().length < 9))){
			 alert('El número de documento ingresado no es un número válido.');
			 $('#registracion-dni').css("border", "1px solid red");
			 return false;
		 }
		 
		 var tipoDni = parseInt($('#registracion-tiposDocumento').val())

		 if(tipoDni == -1){
	    	alert("Debe seleccionar un tipo de documento")
	    	$('#registracion-baja-tiposDocumento').css("border", "1px solid red");
			return false;
		 }
		 
		 var nombre = $("#registracion-nombre").val();
			 
		 if(!/^[a-zA-Z0-9]+$/.test(nombre)){
			alert("El nombre debe contener solo letras");
			$('#registracion-nombre').css("border", "1px solid red");
			return false;
		 }
		 
		 var apellido = $("#registracion-apellido").val();
			 
		 if(!/^[a-zA-Z0-9]+$/.test(apellido)){
			alert("El apellido debe contener solo letras");
			$('#registracion-apellido').css("border", "1px solid red");
			return false;
		 }
		 
		 var codArea = $('#registracion-codigoAreaCelular').val();
		 
		 if(isNaN(parseInt(codArea))){
			 alert("El codigo de área debe ser númerico");		
			 $('#registracion-codigoAreaCelular').css("border", "1px solid red");
			 return false;
		 }

		 var numeroCelular = $('#registracion-numeroCelular').val();
		 
		 if(isNaN(parseInt(numeroCelular))){
			 alert("El número de celular debe ser númerico");		
			 $('#registracion-codigoAreaCelular').css("border", "1px solid red");
			 return false;
		 }
	    
		 var operadorCelular = parseInt($('#registracion-operadorCelular').val());
	
		if(operadorCelular == -1){
			alert("Debe seleccionar un operador celular")
	    	$('#registracion-operadorCelular').css("border", "1px solid red");
			return false;
		}
		
		var numeroCompleto = codArea + numeroCelular ;
		
		if(numeroCompleto.length != 10){
			alert("Ingrese un número de celular válido");
			$('#registracion-numeroCelular').css("border", "1px solid red");
			return false;
		}
		
		var rubros = $('#registracion-rubro').val();
		
		if(!rubros || rubros == null){
			alert("Debe seleccionar por lo menos un rubro")
	    	$('#registracion-rubro').css("border", "1px solid red");
			return false;
		}
		
		var zonas = $('#registracion-regionesOrdenables').val();
		
		if(!zonas || zonas == null){
			alert("Debe seleccionar por lo menos una zona")
	    	$('#registracion-regionesOrdenables').css("border", "1px solid red");
			return false;
		}
		
		
	})

	$("#buscar-beneficios").live('pageshow',function() {
		
		console.log("pageShow Beneficios");

		$("#fin-beneficios").hide();
		
		$("#sin-resultados-beneficios").hide();
		
		$("#rubros-filter").empty();
		
		$("#regionesOrdenables-filter").empty();
		
		var filter = beneficiosPersistenceService.getFilter();
		if (filter) {
			$("#buscar-beneficios-search").val(filter.searchText);
		}
	
		rubrosPersistenceService.getCollection(function(collection) {
		
		collection.forEach(function(rubro) {
			
			$("#rubros-filter").append("<input id='" + rubro.uri + "' type='checkbox' class='rubro-update' /><label for='" + rubro.uri + "'>" + rubro.nombre +"</label>")
		
			$("#" + rubro.uri).prop("rubroId", rubro.id);
		
			$("#" + rubro.uri).prop("checked", rubro.selected);
		
			$("#" + rubro.uri).click(function(e) {
				
				var checkbox = $("#" + e.target.id);
				
				var rubro = rubrosPersistenceService.getById(checkbox.prop('rubroId'))
				
				rubro.selected = checkbox.prop("checked")
				
				rubrosPersistenceService.update(rubro);
				
			})
		});
		try {
			$("#buscar-beneficios").trigger("create");
		}
		catch(e){
			
		}

	})
	
	zonasPersistenceService.getCollection(function(collection) {
		
		console.log("buscar-beneficios-regionesOrdenables-filter " , collection.length)

		collection.forEach(function(zona) {
			
			$("#regionesOrdenables-filter").append("<input id='beneficio-zona-" + zona.uri + "' type='checkbox' class='regionesOrdenablesBeneficio-update' /><label for='beneficio-zona-" + zona.uri + "'>" + zona.nombre +"</label>")
			
			$("#beneficio-zona-" + zona.uri).prop("zonaId", zona.id);
		
			$("#beneficio-zona-" + zona.uri).prop("checked", zona.selected);
			
			$("#beneficio-zona-" + zona.uri).click(function(e) {
				
				var checkbox = $("#" + e.target.id);
				
				var zona = zonasPersistenceService.getById(checkbox.prop('zonaId'))
				
				zona.selected = checkbox.prop("checked")
				
				zonasPersistenceService.update(zona);
				
				if(zona.id == -1){
					unCheckAll('Beneficio');
				}
				
				var checkBoxMiUbicacion = $("#beneficio-zona-undefined");
				
				if($(this).is(":checked")){
					if(checkBoxMiUbicacion.is(':checked') && e.target.id != "beneficio-zona-undefined"){
						
						checkBoxMiUbicacion.prop("checked",false).checkboxradio("refresh");
						
						$("#beneficio-zona-undefined").removeAttr('checked')
						
						var zonaMiUbicacion = zonasPersistenceService.getById(checkBoxMiUbicacion.prop('zonaId'))
						
						zonaMiUbicacion.selected = checkBoxMiUbicacion.prop("checked")
						
						zonasPersistenceService.update(zonaMiUbicacion)
					}
					
				}
			})
		});
		
		var checkbox = $("#beneficio-zona-undefined");
		
		var zona = zonasPersistenceService.getById(checkbox.prop('zonaId'));

		if(zona.id == -1){
			if(!checkearActivos("Beneficio")){
				
				checkbox.attr("checked","checked");
				
				zona.selected = checkbox.prop("checked")
				
				zonasPersistenceService.update(zona);
			}else{
				if(checkbox.is(':checked')){
					
					checkbox.prop("checked",false)
					
					$("#beneficio-zona-undefined").removeAttr('checked')
					
					var zonaMiUbicacion = zonasPersistenceService.getById(checkbox.prop('zonaId'))
					
					zonaMiUbicacion.selected = checkbox.prop("checked")
					
					zonasPersistenceService.update(zonaMiUbicacion)
				}	
			}
				
			
		}
		
		try{
			$("#buscar-beneficios").trigger("create");
		}
		catch(e){
			
		}

	})
	
	$('#buscar-beneficios-search').keypress(function(e) {
        if(e.which == 10 || e.which == 13) {
            sendBeneficios();
        }
    });
	
});
	$("#fin-beneficios").hide();
	
	$("#buscar-mas-beneficios").unbind();
	
	$("#buscar-mas-beneficios").die('click').live('click', function() {
	
		var filter = beneficiosPersistenceService.getFilter();
		
		if(filter){
			filter.numberFirstIndex += 50;
			filter.numberLastIndex += 50;
		}else{
			filter.numberFirstIndex = 1;
			filter.numberLastIndex = 50;
		} 
		
		beneficiosPersistenceService.getFilteredCollection(filter, function(collection) {
			
			collection.forEach(function(beneficio) {
	
				beneficiosPersistenceService.showBeneficio(beneficio);

			})
			
			$("#ul-beneficios").listview('refresh');
			
			if(collection.length < 50){
				
				$("#buscar-mas-beneficios").hide();
				
				$("#fin-beneficios").show();
			}

			console.log('refresh');
			
				
			$.mobile.loading('hide');
		});	
		

	});
	
	$("#buscar-beneficios-link").click(function(e) {
		
		try {
			
			
			sendBeneficios();
			
		}
		catch(e) {
			console.log("Error on seach", e)
		}
			
	})
	$("#beneficio-legales").bind('display-data',function(e) {
	
		var beneficio = e.beneficio;
		
		$("#beneficio-legales-comercio").text(beneficio.nombreComercio)
	
		$("#beneficio-legales-datos").text(beneficio.textoVigencia + beneficio.legales + beneficio.cft)
		
//		$("#back-legales").unbind();
		
		$("#back-legales").one("click" , function(event){
			
//			$("#beneficio-legales").unbind();
			
			$.mobile.changePage("#ver-beneficio", { transition: "slide" ,reverse: true} );
			
			$("#ver-beneficio").trigger({type:"display-data", beneficio: beneficio});
			
		})
//		$("#ver-beneficio-legales-link").unbind();
		
	});
	
	
	$('#ver-beneficio').live('pagebeforehide',function() {
		var pageName = 'ver-beneficio-mapa';
		refreshMap(pageName);
		console.log('destroy map')
		$('#ver-beneficio-mapa').gmap('destroy');
		$("#ver-beneficio-legales-link").unbind();
	})
	
	$("#ver-beneficio").bind('display-data',function(e) {
		
		var beneficio = e.beneficio;
		
		var distance;
		
		var directions = $('#ver-beneficio-mapa').gmap('get', 'services > DirectionsRenderer');
		
		if (directions) {
			
			console.log("Ruta al darle 'click' BORRADA OK")
		
			directions.setMap(null);
			
			directions.setPanel(null);
		}
		
		try {
			if(beneficio.latitud != 0 &&  beneficio.longitud != 0){
			
				var currentPosition = new google.maps.LatLng(Preferences.get().latitude, Preferences.get().longitude);
			
				var sucursalPostion = new google.maps.LatLng(beneficio.latitud, beneficio.longitud);
				
				distance = google.maps.geometry.spherical.computeDistanceBetween(currentPosition, sucursalPostion);
				
				distance = Math.ceil(distance/1000 )
				
				console.log('distance: ' + distance);
			}
			
		}
		catch(e) {
			console.log("Error", e);
		}
		
		var comercioLogo = beneficiosPersistenceService.getLogo(beneficio);
		
		if(!comercioLogo){
			if (beneficio.listaRubrosAsociados) {
				
				var rubros = beneficio.listaRubrosAsociados.split(",");
				
				var rubro = rubrosPersistenceService.getRubroPadre(parseInt(rubros[0]))
				
				if (rubro && rubro.logoSmall) {
					comercioLogo = rubro.logoSmall;
				}
				
			}
			
		}
		
		$("#beneficio-title").html("<span class='float-left'><img class= 'imgLogoFrances'src='assets/images/logo_francesGo.png'/></span>")
		
		$("#beneficio-title").append("<span class='float-left'><img width=30, height=30 class='comercioLogo'src='"+baseUrl + comercioLogo +"'/></span>")
		
		$("#beneficio-title").append("<span class='float'>" + beneficio.nombreComercio + "</span>")
		
		if(distance){
			$("#beneficio-title").append("<span class='float-rigth-beneficio'>" + distance +"km"+ "</span>")
		}
		
		$("#beneficio-descripcionPortal").text(beneficio.descripcionPortal)
		
		$("#beneficio-infoContacto").empty();
		
		if (beneficio.telefono1)  {
			$("#beneficio-infoContacto").text($("#beneficio-infoContacto").text() + beneficio.telefono1 + ' ')
		}
		if (beneficio.telefono2)  {
			$("#beneficio-infoContacto").text($("#beneficio-infoContacto").text() + beneficio.telefono2 + ' ')
		}
		if (beneficio.websiteVenta)  {
			$("#beneficio-infoContacto").text($("#beneficio-infoContacto").text() + beneficio.websiteVenta + ' ')
		}
		
		$("#beneficio-direccion").empty();
		
		$("#como-llegar-link").show();
		
		$('#ver-beneficio-mapa').show();
		
		if(!distance){
			$("#como-llegar-link").hide();
			$('#ver-beneficio-mapa').hide();
		}
			
		$('#ver-beneficio-mapa').gmap().one('init',function(event){

			$('#ver-beneficio-mapa').gmap('option', 'zoom', 15);
			
			$('#ver-beneficio-mapa').gmap('option', 'center', new google.maps.LatLng(beneficio.latitud , beneficio.longitud));

			$('#ver-beneficio-mapa').gmap('option', 'zoomControlOptions', { 'style': google.maps.ZoomControlStyle.SMALL, 'position': google.maps.ControlPosition.RIGHT_BOTTOM});
			
			if(isBlackBerry()){
				$('#ver-beneficio-mapa').gmap('option', 'panControl', true);
				
				$('#ver-beneficio-mapa').gmap('addControl', 'control', google.maps.ControlPosition.LEFT_TOP);
				
			}
			
		})
		
		
		if(beneficio.idShopping){
			$("#beneficio-direccion").append("Sucursal: " + beneficio.nombreSucursal +"  <p class='direccion'><strong>Dirección:</strong> " + beneficio.calle + " " + beneficio.numero +  ", " + beneficio.nombreLocalidad + ( (distance != undefined) ? "<span>(" + distance +" km)</span></p>" : "</p>") );
		}else
			$("#beneficio-direccion").append("<p class='direccion'><strong>Dirección:</strong> " + beneficio.calle + " " + beneficio.numero +  ", " + beneficio.nombreLocalidad + ( (distance != undefined) ? "<span>(" + distance +" km)</span></p>" : "</p>") );
		
		$('#ver-beneficio-mapa').gmap('clear' , 'markers');
		
		$('#ver-beneficio-mapa').gmap('clear' , 'overlays');
		
		var beneficioInfo = '<div id="infowindow_content"><div id="siteNotice"></div><h4 id="firstHeading" class="firstHeading">'+ beneficio.nombreComercio+'</h4><div id="bodyContent"><p>' + beneficio.descripcionPortal + '</p></div></div>'
	
		marker = createMarker(beneficio);
		
		$('#ver-beneficio-mapa').gmap('addMarker', marker).click(function() {
			$('#ver-beneficio-mapa').gmap('openInfoWindow', {'content': beneficioInfo}, this);
		});
		
		$('#ver-beneficio-mapa').gmap('option', 'center', new google.maps.LatLng(beneficio.latitud , beneficio.longitud));
	
//		$("#ver-beneficio-legales-link").unbind();
				
		$("#ver-beneficio-legales-link").one("click" , function(event) {
			
			$("#ver-beneficio-legales-link").unbind('click');
			
			$.mobile.changePage("#beneficio-legales", { transition: "slide"} )
			
			$("#beneficio-legales").trigger({type:"display-data", beneficio:beneficio})
			
			
		})
		
		$("#como-llegar-link").unbind();
		
		$("#como-llegar-link").one("click", function(){
		
			$("#como-llegar-link").unbind('click');
			
			var currentlatlng = new google.maps.LatLng(Preferences.get().latitude, Preferences.get().longitude);

			var currentMarker = {'position': currentlatlng, 'bounds' : true}

			var img = new Image();
			
			img.src = baseUrl + 'assets/images/icons/User_Icon_Map.png'
			
			var image = new google.maps.MarkerImage(img.src,null,null,null, null);		
			
			currentMarker.icon = image

			$('#ver-beneficio-mapa').gmap('addMarker', currentMarker).click(function() {
				
				$('#ver-beneficio-mapa').gmap('openInfoWindow', {'content': 'posicion actual'}, this);
			
			});

			var destino  = new google.maps.LatLng(beneficio.latitud , beneficio.longitud);
					$('#ver-beneficio-mapa').gmap('displayDirections',{
									'origin' : currentlatlng,
									'destination' : destino, 
									'travelMode' : google.maps.DirectionsTravelMode.DRIVING
								},{suppressMarkers: true},	function(result,status) {
										( status === 'OK' ) ? console.log('status OK ruta generada') : console.log('ruta no generada');
									}
						);
			$('#ver-beneficio-mapa').gmap('addShape', 'Circle', { 
				'strokeWeight': 0, 
				'fillColor': "#008595", 
				'fillOpacity': 0.25, 
				'bounds': true,
				'center': new google.maps.LatLng(beneficio.latitud,beneficio.longitud), 
				'radius': 15, 
				'clickable': false 
			});
			$("#como-llegar-link").unbind();
			
		});
	})

	$("#beneficios-mapa").click(function() {
		
		$("#objects-mapa").trigger({type:"display-data-beneficio",title:'Beneficios'})
		
		$.mobile.changePage("#objects-mapa", { transition: "slide"} )
		
	})
	
	$("#objects-mapa").live('pagebeforehide',function() {
		console.log('destroy map')
		$('#objects-mapa-mapa').gmap('destroy');
	})
	
	$("#objects-mapa").bind('display-data-beneficio',function(e) {
		
		console.log('objects mapa beneficios')
		if (e.title) {
			$("#objects-mapa-title").text(e.title)
		}
		
		$("#back-listar").unbind("click");
		
		$("#back-listar").click(function(){
			$.mobile.changePage("#listar-beneficios" ,{ transition: "slide" ,reverse: true} );
		})
		
		var zoom = $('#objects-mapa-mapa').gmap('option', 'zoom')
		
		console.log('zoom antes de cambiarlo: ' + zoom)
		
		$('#objects-mapa-mapa').gmap().one('init', function(event){
		
			console.log('entro al bind')
			
			$('#objects-mapa-mapa').gmap('option', 'zoom', 15);
			
			zoom = $('#objects-mapa-mapa').gmap('option', 'zoom');
			
			console.log('zoom despues de cambiarlo: '  + zoom);
			
			$('#objects-mapa-mapa').gmap('option', 'center', new google.maps.LatLng(Preferences.get().latitude, Preferences.get().longitude));
			
			$('#objects-mapa-mapa').gmap('option', 'zoomControlOptions', { 'style': google.maps.ZoomControlStyle.SMALL, 'position': google.maps.ControlPosition.RIGHT_BOTTOM });
		})		
			
		beneficiosPersistenceService.getCollection(function(collection) {
			collection.forEach(function(beneficio) {

				var distance;
				
				try{
					
					var currentPosition = new google.maps.LatLng(Preferences.get().latitude, Preferences.get().longitude);
					
					var sucursalPostion = new google.maps.LatLng(beneficio.latitud, beneficio.longitud);
					
					distance = google.maps.geometry.spherical.computeDistanceBetween(currentPosition, sucursalPostion);
					
					distance = Math.ceil(distance/1000 )
					
				}catch(e){
					console.log('error ' + e)
				}
				
				if(distance < 2){
					
					console.log('cargando el beneficio: ' + beneficio.nombreComercio)
					
					var beneficioInfo = '<div id="infowindow_content"><div id="siteNotice"></div><h4 id="firstHeading" class="firstHeading">'+ beneficio.nombreComercio+'</h4><div id="bodyContent"><p>' + beneficio.descripcionPortal + '</p></div></div>'
					
					var marker = createMarker(beneficio);
					
					marker.bounds = true;
					
					$('#objects-mapa-mapa').gmap('addMarker', marker).click(function() {
						$('#objects-mapa-mapa').gmap('openInfoWindow', {'content': beneficioInfo}, this);
					});
				}
					
			});
			
		});	
		
		var currentLatLng = new google.maps.LatLng(Preferences.get().latitude, Preferences.get().longitude)
		
		var currentMarker = {'position': currentLatLng,bounds: true}
		
		var img = new Image();
		
		img.src = baseUrl + 'assets/images/icons/User_Icon_Map.png'
		
		var image = new google.maps.MarkerImage(img.src,null,null,null, null);		
		
		currentMarker.icon = image;
		console.log("Current Position " + currentLatLng + "URL image: " + image.url);
			
			$('#objects-mapa-mapa').gmap('option', 'center', currentLatLng );
			$('#objects-mapa-mapa').gmap('addMarker',currentMarker).click(function() {

				$('#objects-mapa-mapa').gmap('openInfoWindow', {'content': 'posicion actual'}, this);
			
			});
			
	})

	$("#listar-beneficios").live('pageshow',function() {
		
		$("#ul-beneficios").empty();
		
		$("#sin-resultados-beneficios").hide();
		$("#buscar-mas-beneficios").hide();
		$("#fin-beneficios").hide();
		
		
		var filter = beneficiosPersistenceService.getFilter();
		
		if(filter){

			beneficiosPersistenceService.getCollection(function(collection) {
	
				collection.forEach(function(beneficio) {
					
					beneficiosPersistenceService.showBeneficio(beneficio);
				})
	
				if(collection.length == 0){
					$("#sin-resultados-beneficios").show();
				}else{
					if(collection.length == 50){
						$("#buscar-mas-beneficios").show();
					}else{
						$("#fin-beneficios").show();
					}
				}
				
				
				$("#ul-beneficios").listview('refresh');
	
			})
		}else{
			$("#buscar-mas-beneficios").hide();
			
			filter = {}
			
			filter.numberFirstIndex = 1;
			
			filter.numberLastIndex = 50;

			if(Preferences.get().latitude != 0 && Preferences.get().longitude != 0){
				
				filter.latitude = Preferences.get().latitude;
				
				filter.longitude = Preferences.get().longitude;

				filter.checkMiUbicacion = true;
			}else{
				filter.checkMiUbicacion = false;
			}
			
		
			beneficiosPersistenceService.getFilteredCollection(filter, function(collection) {
				
				$("#ul-beneficios").empty();
				
				$.mobile.loading('hide');
				
				collection.forEach(function(beneficio) {
					
					beneficiosPersistenceService.showBeneficio(beneficio);
					
				})
				
				if(collection.length == 0){
					$("#sin-resultados-beneficios").show();
				}else{
					if(collection.length == filter.numberLastIndex){
						$("#buscar-mas-beneficios").show();
					}else{
						$("#fin-beneficios").show();
					}
				} 
				
				//generateBannerForBeneficios();
				$("#ul-beneficios").listview('refresh');
			});
		}
		
	})

	
	$("#sucursales-mapa").click(function() {

		$("#objects-mapa").trigger({type:"display-data-sucursales",title:'Sucursales'})
		
		$.mobile.changePage("#objects-mapa" , { transition: "slide"} )
		
					
	})

	
	$("#objects-mapa").bind('display-data-sucursales',function(e) {
		
		$("#back-listar").unbind("click");
		
		if (e.title) {
			$("#objects-mapa-title").text(e.title)
		}
		$("#back-listar").click(function(){
			$.mobile.changePage("#listar-sucursales" , { transition: "slide"} );
		})	
		
		var zoom = $('#objects-mapa-mapa').gmap('option', 'zoom');
		
		console.log('zoom antes de cambiarlo: ' + zoom);
		
		$('#objects-mapa-mapa').gmap().one('init', function(event){
			
			console.log('entro al bind')
			
			$('#objects-mapa-mapa').gmap('option', 'zoom', 15);
			
			zoom = $('#objects-mapa-mapa').gmap('option', 'zoom');
			
			console.log('zoom despues de cambiarlo: '  + zoom);
			
			$('#objects-mapa-mapa').gmap('option', 'center', new google.maps.LatLng(Preferences.get().latitude, Preferences.get().longitude));
			
		})			
	
			sucursalesPersistenceService.getCollection(function(collection) {
				collection.forEach(function(sucursal) {
					
					var sucursalInfo = '<div id="infowindow_content"><div id="siteNotice"></div><h4 id="firstHeading" class="firstHeading">'+ sucursal.nombre+'</h4><div id="bodyContent"><p>' + sucursal.domicilio + '</p></div></div>'

					if(sucursal.tipoSucursal == 'P'){
						var marker = {'position': new google.maps.LatLng(sucursal.latitud , sucursal.longitud), 'bounds': false, icon:'assets/images/sucursal.gif'}
					}else
						var marker = {'position': new google.maps.LatLng(sucursal.latitud , sucursal.longitud), 'bounds': false, icon:'assets/images/sucursal-empresa.gif'}
					
						$('#objects-mapa-mapa').gmap('addMarker', marker).click(function() {
							$('#objects-mapa-mapa').gmap('openInfoWindow', {'content': sucursalInfo}, this);
						});
					
				});
				
			});	
			
			var currentLatLng = new google.maps.LatLng(Preferences.get().latitude, Preferences.get().longitude)
			
			var currentMarker = {'position': currentLatLng,bounds: true}
			
			var img = new Image();
			
			img.src = baseUrl + 'assets/images/icons/User_Icon_Map.png'
			
			var image = new google.maps.MarkerImage(img.src,null,null,null, null);		
			
			currentMarker.icon = image;
				
			$('#objects-mapa-mapa').gmap('option', 'center', currentLatLng );
			$('#objects-mapa-mapa').gmap('addMarker',currentMarker).click(function() {

				$('#objects-mapa-mapa').gmap('openInfoWindow', {'content': 'posicion actual'}, this);
			
			});
	})
	
	
	
	$("#object-mapa").bind('display-data-sucursal',function(e) {
	
		console.log("object-mapa init", e.title)
			
		if (e.title) {
			$("#object-mapa-title").text(e.title)
		}
		
		$('#object-mapa-mapa').gmap('clear', 'markers');
		
		var sucursal = e.sucursal;
		
		var sucursalInfo = '<div id="infowindow_content"><div id="siteNotice"></div><h4 id="firstHeading" class="firstHeading">'+sucursal.nombre+'</h4><div id="bodyContent"><p>' + sucursal.domicilio + '</p></div></div>'
		
		$('#object-mapa-mapa').gmap({ 'center': new google.maps.LatLng(sucursal.latitud , sucursal.longitud) })
		
		$('#object-mapa-mapa').gmap('addMarker', {'position':new google.maps.LatLng(sucursal.latitud , sucursal.longitud) , 'bounds': true,icon:'assets/images/sucursal.gif'}).click(function() {
			$('#object-mapa-mapa').gmap('openInfoWindow', {'content': sucursalInfo}, this);
		});
	
		$('#object-mapa-mapa').gmap('addShape', 'Circle', { 
			'strokeWeight': 0, 
			'fillColor': "#008595", 
			'fillOpacity': 0.25, 
			'center': new google.maps.LatLng(sucursal.latitud , sucursal.longitud), 
			'radius': 15, 
			'clickable': false 
		});
	
		$('#object-mapa-mapa').gmap('refresh')
	
		
	})
	
	$("#ver-sucursal").live('pagebeforehide',function() {
		var pageName = 'ver-sucursal-mapa';
		refreshMap(pageName);
		console.log('destroy map')
		$('#ver-sucursal-mapa').gmap('destroy');
	})	

	$("#ver-sucursal").bind('display-data',function(e) {
		
		var sucursal = e.sucursal;
		var distance;
		
		try {
			var currentPosition = new google.maps.LatLng(Preferences.get().latitude, Preferences.get().longitude);
			
			var sucursalPostion = new google.maps.LatLng(sucursal.latitud, sucursal.longitud);
			
			distance = google.maps.geometry.spherical.computeDistanceBetween (currentPosition, sucursalPostion);
			
			distance = Math.ceil(distance/1000 )
		}
		catch(e) {
			console.log("Error", e);
		}
		
		$("#ver-sucursal-title").html("<span class='float-left'><img class= 'imgLogoFrances'src='assets/images/logo_francesGo.png'/></span>")
		
		$("#ver-sucursal-title").append("<span class='float-sucursal-cajero' ><h1>" + sucursal.nombre + "</h1></span>")
		
		$("#ver-sucursal-title").append("<span class='rigth-sucursal'>" +distance+"KM"+"</span>")
	
		$("#ver-sucursal-domicilio").text(sucursal.domicilio)
		
		$("#ver-sucursal-tipoSucursal").text((sucursal.tipoSucursal == 'P')?'Personas':'Empresa')
		
		$("#ver-sucursal-atencionPublico").text(sucursal.horarioAtencion)

		$("#ver-sucursal-localidad").text(sucursal.localidad.nombre)
		
		$('#ver-sucursal-mapa').gmap('clear', 'markers');
		
		$('#ver-sucursal-mapa').gmap().one('init',function(event){

			$('#ver-sucursal-mapa').gmap('option', 'zoom', 15);
			
			$('#ver-sucursal-mapa').gmap('option', 'center', new google.maps.LatLng(sucursal.latitud , sucursal.longitud));
			
			$('#ver-sucursal-mapa').gmap('option', 'zoomControlOptions', { 'style': google.maps.ZoomControlStyle.SMALL, 'position': google.maps.ControlPosition.RIGHT_BOTTOM});
		
			if(isBlackBerry()){
				$('#ver-sucursal-mapa').gmap('option', 'panControl', true);
				
				$('#ver-sucursal-mapa').gmap('addControl', 'control', google.maps.ControlPosition.LEFT_TOP);
				
			}
		})
		
		var sucursalInfo = '<div id="infowindow_content"><div id="siteNotice"></div><h4 id="firstHeading" class="firstHeading">'+ sucursal.nombre+'</h4><div id="bodyContent"><p>' + sucursal.domicilio + '</p></div></div>'

		try{
			
			if(sucursal.tipoSucursal == 'P'){
				var marker = {'position': new google.maps.LatLng(sucursal.latitud , sucursal.longitud), 'bounds': true, icon:'assets/images/sucursal.gif'}
			}else
				var marker = {'position': new google.maps.LatLng(sucursal.latitud , sucursal.longitud), 'bounds': true, icon:'assets/images/sucursal-empresa.gif'}
			
		}catch(e){
			alert(e);
		}
		$('#ver-sucursal-mapa').gmap('addMarker', marker).click(function() {
			$('#ver-sucursal-mapa').gmap('openInfoWindow', {'content': sucursalInfo}, this);
		});
		
		
		$('#ver-sucursal-mapa').gmap('option', 'center', new google.maps.LatLng(sucursal.latitud , sucursal.longitud))
		
		$('#ver-sucursal-mapa').gmap('option', 'zoom' , 14);
		
		$("#ver-sucursal-mapa-link2,#ver-sucursal-mapa-link").click(function() {
			
			console.log("#object-mapa display sucursal")
		
			$.mobile.changePage("#object-mapa", { transition: "slide"} )
		
			$("#object-mapa").trigger({type:"display-data-sucursal", sucursal:sucursal, title:'Sucursal'})
		
			
		})
		$("#ver-sucursal-como-llegar-link").unbind();
		
		$("#ver-sucursal-como-llegar-link").one("click" , function(){
			
			var currentMarker = {'position':new google.maps.LatLng(Preferences.get().latitude, Preferences.get().longitude), 'bounds' : true}

			var img = new Image();
			
			img.src = baseUrl + 'assets/images/icons/User_Icon_Map.png'
			
			var image = new google.maps.MarkerImage(img.src,null,null,null, null);		
			
			currentMarker.icon = image;
			
			$('#ver-sucursal-mapa').gmap('addMarker', currentMarker).click(function() {
				
				$('#ver-sucursal-mapa').gmap('openInfoWindow', {'content': 'posicion actual'}, this);
			
			});
			var sucursal = e.sucursal;
			
			var destino  = new google.maps.LatLng(sucursal.latitud , sucursal.longitud);
			
			var currentlatlng = new google.maps.LatLng(Preferences.get().latitude, Preferences.get().longitude);
			
					$('#ver-sucursal-mapa').gmap('search',({'location': currentlatlng}),function(results,status){
							if ( status === 'OK' ) {
								var origin = results[0].formatted_address;
								$('#ver-sucursal-mapa').gmap('displayDirections',
											{
												'origin' : origin,
												'destination' : destino, 
												'travelMode' : google.maps.DirectionsTravelMode.DRIVING
											},
											{suppressMarkers: true},
											function(result,status) {
													( status === 'OK' ) ? console.log('status OK ruta generada') : console.log('ruta no generada');
									});
							}
							else {
								 alert("No se pudo localizar su ubicación actual ");
							 }
						}
					);
					
			$('#ver-sucursal-mapa').gmap('addShape', 'Circle', { 
				'strokeWeight': 0, 
				'fillColor': "#008595", 
				'fillOpacity': 0.25, 
				'bounds': true,
				'center': new google.maps.LatLng(sucursal.latitud,sucursal.longitud), 
				'radius': 15, 
				'clickable': false 
			});
		
		})
	})
		

	$("#listar-sucursales").live('pageshow',function() {

		var filter = sucursalesPersistenceService.getFilter();
		
		if(filter){
			sucursalesPersistenceService.getCollection(function(collection){
				
				$("#ul-sucursales").empty();
				
				$("#fin-sucursales").hide();

				collection.forEach(function(sucursal) {
					
					sucursalesPersistenceService.showSucursal(sucursal);

				})
				
				if(collection.length == 0){
					console.log("no hubo resultados de la busqueda")
					$("#sin-resultados-sucursales").show();
				}else{
					if(collection.length == filter.numberLastIndex){
						$("#buscar-mas-sucursales").show();
					}else{
						$("#fin-sucursales").show();
					}
				}
				
				$("#ul-sucursales").listview('refresh');

				$.mobile.loading('hide');
			})

		}else{
			$("#buscar-mas-sucursales").hide();
			filter = {}
			filter.numberFirstIndex = 1;
			filter.numberLastIndex = 50;
			filter.latitud = Preferences.get().latitude;
			filter.longitud = Preferences.get().longitude;
			filter.checkMiUbicacion = true;

			sucursalesPersistenceService.getFilteredCollection(filter, function(collection) {
				
				$("#ul-sucursales").empty();
				
				$("#fin-sucursales").hide();
				
				collection.forEach(function(sucursal) {
					
					sucursalesPersistenceService.showSucursal(sucursal);
					
				})
				
				if(collection.length == 0){
					console.log("no hubo resultados de la busqueda")
					$("#sin-resultados-sucursales").show();
				}else{
					if(collection.length == filter.numberLastIndex){
						$("#buscar-mas-sucursales").show();
					}else{
						$("#fin-sucursales").show();
					}
				}
				
				$("#ul-sucursales").listview('refresh');
				
				$.mobile.loading('hide');
			});
			
		}	
	});
	$("#buscar-sucursales").live('pageshow',function() {

		console.log("pageSow sucursales");
		
		$("#sin-resultados-sucursales").hide();
		
		$("#buscar-sucursales-regionesOrdenables-filter").empty();
		
		var filter = sucursalesPersistenceService.getFilter();
		
		if (filter) {
			$("#buscar-sucursales-name").val(filter.searchText);
		}
		
	zonasPersistenceService.getCollection(function(collection) {
			
			console.log("buscar-sucursales-regionesOrdenables-filter " , collection.length)
			
			collection.forEach(function(zona) {

				$("#buscar-sucursales-regionesOrdenables-filter").append("<input id='sucursal-zona-" + zona.uri + "' type='checkbox' class='regionesOrdenablesSucursal-update' /><label for='sucursal-zona-" + zona.uri + "'>" + zona.nombre +"</label>")
					
					console.log(zona.uri);
				
					$("#sucursal-zona-" + zona.uri).prop("zonaId", zona.id);
					
					$("#sucursal-zona-" + zona.uri).prop("checked", zona.sucursalSelected);
					
					$("#sucursal-zona-" + zona.uri).click(function(e) {
						
						var checkbox = $("#" + e.target.id);
						
						var zona = zonasPersistenceService.getById(checkbox.prop('zonaId'))
					
						zona.sucursalSelected = checkbox.prop("checked")
						
						zonasPersistenceService.update(zona);
						
						if(zona.id == -1){
							unCheckAll("Sucursal");
						}
						var checkBoxMiUbicacion = $("#sucursal-zona-undefined");
						
						if($(this).is(":checked")){
							if(checkBoxMiUbicacion.is(':checked') && e.target.id != "sucursal-zona-undefined"){
								
								checkBoxMiUbicacion.prop("checked",false).checkboxradio("refresh");
								
								$("#sucursal-zona-undefined").removeAttr('checked')
								
								var zonaMiUbicacion = zonasPersistenceService.getById(checkBoxMiUbicacion.prop('zonaId'))
								
								zonaMiUbicacion.sucursalSelected = checkBoxMiUbicacion.prop("checked")
								
								zonasPersistenceService.update(zonaMiUbicacion)
							}
							
						}
					})
				});
			
			var checkbox = $("#sucursal-zona-undefined");
			
			var zona = zonasPersistenceService.getById(checkbox.prop('zonaId'));

			if(zona.id == -1){
				if(!checkearActivos("Sucursal")){
					
					checkbox.attr("checked","checked");
					
					zona.sucursalSelected = checkbox.prop("checked")
					
					zonasPersistenceService.update(zona);
				}else{
					if(checkbox.is(':checked')){
						
						checkbox.prop("checked",false)
						
						$("#sucursal-zona-undefined").removeAttr('checked')
						
						var zonaMiUbicacion = zonasPersistenceService.getById(checkbox.prop('zonaId'))
						
						zonaMiUbicacion.sucursalSelected = checkbox.prop("checked")
						
						zonasPersistenceService.update(zonaMiUbicacion)
					}	
				}
					
				
			}

			
				try{
					$("#buscar-sucursales-regionesOrdenables-filter").trigger("create");
				}
				catch(e){
				}
		
			})
			$("#buscar-sucursales-tipoSucursal").html("<option value='P'> Personas </option>");
			$("#buscar-sucursales-tipoSucursal").append("<option value='E'> Empresas </option>");
			
			$('#buscar-sucursal-nombre').keypress(function(e) {
		        if(e.which == 10 || e.which == 13) {
		            sendSucursales();
		        }
		    });
			
	})
	
	$("#fin-sucursales").hide();
	
	$("#buscar-mas-sucursales").unbind();
	
	$("#buscar-mas-sucursales").die('click').live('click', function(){

		var filter = sucursalesPersistenceService.getFilter();
		
		if(filter){
			filter.numberFirstIndex += 50;
			filter.numberLastIndex += 50;
		}else{
			filter.numberFirstIndex = 1;
			filter.numberLastIndex = 50;
		} 
		
		sucursalesPersistenceService.getFilteredCollection(filter, function(collection) {
			
			collection.forEach(function(sucursal) {
	
				sucursalesPersistenceService.showSucursal(sucursal);

			})
			
			if(collection.length < 50){
				
				$("#buscar-mas-sucursales").hide();
				
				$("#fin-sucursales").show();
			}

			
			$("#ul-sucursales").listview('refresh');
			
			console.log('referesh');

			$.mobile.loading('hide');
		});	
		
		
		
	})

	$("#buscar-sucursales-link").click(function(e) {
		try {
				
			console.log('validate');
			
			var findText = $('#buscar-sucursal-nombre').val();
			
			
			sendSucursales();
		}catch(e) {
			console.log("Error on seach", e)
		}
			
	})
	
	$("#listar-cajeros").live('pageshow',function() {
		
		var filter = cajerosPersistenceService.getFilter();
		
		if(filter){
			cajerosPersistenceService.getCollection(function(collection) {
				
				$("#ul-cajeros").empty();
				$("#fin-cajeros").hide();
				
				collection.forEach(function(cajero) {
					
					cajerosPersistenceService.showCajero(cajero);
					
				})
				
				if(collection.length == 0){
					console.log("no hubo resultados de la busqueda")
					$("#sin-resultados-cajeros").show();
				}else{
					if(collection.length == filter.numberLastIndex){
						$("#buscar-mas-cajeros").show();
					}else{
						$("#fin-cajeros").show();
					}
				}
				
				$("#ul-cajeros").listview('refresh');
				
			})
		}else{
			$("#buscar-mas-cajeros").hide();
			filter = {}
			filter.numberFirstIndex = 1;
			filter.numberLastIndex = 50;
			filter.latitud = Preferences.get().latitude;
			filter.longitud = Preferences.get().longitude;
			filter.checkMiUbicacion = true;
			
			cajerosPersistenceService.getFilteredCollection(filter,function(collection) {
				
				$("#ul-cajeros").empty();
				$("#fin-cajeros").hide();
				
				collection.forEach(function(cajero) {
					
					cajerosPersistenceService.showCajero(cajero);
					
				})
				
				if(collection.length == 0){
					console.log("no hubo resultados de la busqueda")
					$("#sin-resultados-cajeros").show();
				}else{
					if(collection.length == filter.numberLastIndex){
						$("#buscar-mas-cajeros").show();
					}else{
						$("#fin-cajeros").show();
					}
				}
				
				
				$("#ul-cajeros").listview('refresh');
				
			})
		}
		
		
		$.mobile.loading('hide');
	})

	
	$("#fin-cajeros").hide();
	
	$("#buscar-mas-cajeros").unbind();
	
	$("#buscar-mas-cajeros").die('click').live('click', function(){

		var filter = cajerosPersistenceService.getFilter();
		
		if(filter){
			filter.numberFirstIndex +=50;
			filter.numberLastIndex += 50;
		}else{
			filter.numberFirstIndex =1;
			filter.numberLastIndex = 50;
		}
			
		
		cajerosPersistenceService.getFilteredCollection(filter, function(collection) {
			
			collection.forEach(function(cajero) {
	
				cajerosPersistenceService.showCajero(cajero);

			})
			
			if(collection.length < 50){
				
				$("#buscar-mas-cajeros").hide();
				
				$("#fin-cajeros").show();
			}

			$("#ul-cajeros").listview('refresh');

			$.mobile.loading('hide');
		});	
	})
	
	$("#buscar-cajeros-link").click(function(e) {
		
		try {
			sendCajeros();
		}catch(e) {
			console.log("Error on seach", e)
		}
			
	})

	$("#cajeros-mapa").click(function() {
		
		$("#objects-mapa").trigger({type:"display-data-cajeros",title:'Cajeros'})
		
		$.mobile.changePage("#objects-mapa", { transition: "slide"} )
					
	})

	
	$("#objects-mapa").bind('display-data-cajeros',function(e) {
		
		console.log("object-mapa init cajeros", e.title)
		
		$("#back-listar").unbind("click");
		
		if (e.title) {
			$("#objects-mapa-title").text(e.title)
		}
		
		$("#back-listar").click(function(){
			$.mobile.changePage("#listar-cajeros", { transition: "slide"} );
		})	
		
		var zoom = $('#objects-mapa-mapa').gmap('option', 'zoom');
		
		console.log('zoom antes de cambiarlo: ' + zoom);
		
		$('#objects-mapa-mapa').gmap().one('init', function(event){
			
			console.log('entro al bind')
			
			$('#objects-mapa-mapa').gmap('option', 'zoom', 15);
			
			zoom = $('#objects-mapa-mapa').gmap('option', 'zoom');
			
			console.log('zoom despues de cambiarlo: '  + zoom)
			
			$('#objects-mapa-mapa').gmap('option', 'center', new google.maps.LatLng(Preferences.get().latitude, Preferences.get().longitude));
		})			
		
			cajerosPersistenceService.getCollection(function(collection) {
				collection.forEach(function(cajero) {
					
					var cajeroInfo = '<div id="infowindow_content"><div id="siteNotice"></div><h4 id="firstHeading" class="firstHeading">'+ cajero.nombre+'</h4><div id="bodyContent"><p>' + cajero.domicilio + '</p></div></div>'
					
						$('#objects-mapa-mapa').gmap('addMarker', {'position': new google.maps.LatLng(cajero.latitud , cajero.longitud),bounds: false, icon:'assets/images/cajero.gif'}).click(function() {
							$('#objects-mapa-mapa').gmap('openInfoWindow', {'content': cajeroInfo}, this);
						});
					
				});
				
			});	
			var currentLatLng = new google.maps.LatLng(Preferences.get().latitude, Preferences.get().longitude)
			
			var currentMarker = {'position': currentLatLng,bounds: false}
			
			var img = new Image();
			
			img.src = baseUrl + 'assets/images/icons/User_Icon_Map.png'
			
			var image = new google.maps.MarkerImage(img.src,null,null,null, null);		
			
			currentMarker.icon = image;
			
			console.log("Current Position " + currentLatLng + "URL image: " + image.url);
					
			$('#objects-mapa-mapa').gmap('option', 'center', currentLatLng );
			
			$('#objects-mapa-mapa').gmap('addMarker',currentMarker).click(function() {
	
				$('#objects-mapa-mapa').gmap('openInfoWindow', {'content': 'posicion actual'}, this);
					
			});
	})
	
	
	
	$("#object-mapa").bind('display-data-cajero',function(e) {
	
		console.log("object-mapa init", e.title)
			
		if (e.title) {
			$("#object-mapa-title").text(e.title)
		}
		
		$('#object-mapa-mapa').gmap('clear', 'markers');
		
		var cajero = e.cajero;
		
		var cajeroInfo = '<div id="infowindow_content"><div id="siteNotice"></div><h4 id="firstHeading" class="firstHeading">'+cajero.codigoCajero + " " + ((cajero.sucursalBanco && cajero.sucursalBanco.nombre ) ? cajero.sucursalBanco.nombre : '')+'</h4><div id="bodyContent"><p>' + cajero.domicilio + '</p></div></div>'
		
		$('#object-mapa-mapa').gmap({ 'center': new google.maps.LatLng(cajero.latitud , cajero.longitud) })
		
		$('#object-mapa-mapa').gmap('addMarker', {'position':new google.maps.LatLng(cajero.latitud , cajero.longitud) , 'bounds': true,icon:'assets/images/cajero.gif'}).click(function() {
			$('#object-mapa-mapa').gmap('openInfoWindow', {'content': cajeroInfo}, this);
		});
	
		$('#object-mapa-mapa').gmap('addShape', 'Circle', { 
			'strokeWeight': 0, 
			'fillColor': "#008595", 
			'fillOpacity': 0.25, 
			'center': new google.maps.LatLng(cajero.latitud , cajero.longitud), 
			'radius': 15, 
			'clickable': false 
		});
	
		$('#object-mapa-mapa').gmap('refresh')
		
		
	})
	
	$("#ver-cajero").live('pagebeforehide',function() {

		var pageName = 'ver-cajero-mapa';
		
		refreshMap(pageName);
		
		console.log('destroy map')
		
		$('#ver-cajero-mapa').gmap('destroy');
	})	
	
	
	$("#ver-cajero").bind('display-data',function(e) {
		
		var cajero = e.cajero;
		var distance;
		
		try {
			var currentPosition = new google.maps.LatLng(Preferences.get().latitude, Preferences.get().longitude);
			
			var cajeroPostion = new google.maps.LatLng(cajero.latitud, cajero.longitud);
			
			distance = google.maps.geometry.spherical.computeDistanceBetween (currentPosition, cajeroPostion);
			
			distance = Math.ceil(distance/1000 )
		}
		catch(e) {
			console.log("Error", e);
		}
		
		$("#ver-cajero-title").html("<span class='float-left'><img class= 'imgLogoFrances'src='assets/images/logo_francesGo.png'/></span>")
		
		$("#ver-cajero-title").append("<span class='float-sucursal-cajero'><h1>" + ((cajero.sucursalBanco && cajero.sucursalBanco.nombre ) ? cajero.sucursalBanco.nombre : 'BBVA Frances') + "</h1></span>")
	
		$("#ver-cajero-title").append("<span class='rigth-sucursal'>" + distance +"km"+"</span>")
		
		$("#ver-cajero-domicilio").text(cajero.domicilio)
		
		$("#ver-cajero-tipoCajero").text(cajero.tipoCajeroBanco.descripcion)

		$('#ver-cajero-mapa').gmap('clear', 'markers');
		
		$('#ver-cajero-mapa').gmap().one('init',function(event){

			console.log('entro al bind')
			
			$('#ver-cajero-mapa').gmap('option', 'zoom', 15);
			
			$('#ver-cajero-mapa').gmap('option', 'center', new google.maps.LatLng(cajero.latitud , cajero.longitud));
			
			$('#ver-cajero-mapa').gmap('option', 'zoomControlOptions', { 'style': google.maps.ZoomControlStyle.SMALL, 'position': google.maps.ControlPosition.RIGHT_BOTTOM});
		
			if(isBlackBerry()){
				$('#ver-sucursal-mapa').gmap('option', 'panControl', true);
				
				$('#ver-sucursal-mapa').gmap('addControl', 'control', google.maps.ControlPosition.LEFT_TOP);
				
			}
		})
		
		var cajeroInfo = '<div id="infowindow_content"><div id="siteNotice"></div><h4 id="firstHeading" class="firstHeading">'+  cajero.codigoCajero + " " + ((cajero.sucursalBanco && cajero.sucursalBanco.nombre ) ? cajero.sucursalBanco.nombre : '') +'</h4><div id="bodyContent"><p>' + cajero.domicilio + '</p></div></div>'
	
		$('#ver-cajero-mapa').gmap('addMarker', {'position': new google.maps.LatLng(cajero.latitud , cajero.longitud), 'bounds': true,icon:'assets/images/cajero.gif'}).click(function() {
			$('#ver-cajero-mapa').gmap('openInfoWindow', {'content': cajeroInfo}, this);
		});
		
		
		$('#ver-cajero-mapa').gmap('option', 'center', new google.maps.LatLng(cajero.latitud , cajero.longitud))
		
		$('#ver-cajero-mapa').gmap('option', 'zoom', 14);
		
		$("#ver-cajero-mapa-link2,#ver-cajero-mapa-link").click(function() {
			
			console.log("#object-mapa display cajero")
		
			$.mobile.changePage("#object-mapa", { transition: "slide"} )
		
			$("#object-mapa").trigger({type:"display-data-cajero", cajero:cajero, title:'Cajero'})
		
			
		})
		$("#ver-cajero-como-llegar-link").unbind();
		
		$("#ver-cajero-como-llegar-link").one("click", function(){
			
			var currentMarker = {'position':new google.maps.LatLng(Preferences.get().latitude, Preferences.get().longitude), 'bounds' : true}

			var img = new Image();
			
			img.src = baseUrl + 'assets/images/icons/User_Icon_Map.png'
			
			var image = new google.maps.MarkerImage(img.src,null,null,null, null);		
			
			currentMarker.icon = image;
			
			$('#ver-cajero-mapa').gmap('addMarker', currentMarker).click(function() {
				
				$('#ver-cajero-mapa').gmap('openInfoWindow', {'content': 'posicion actual'}, this);
			
			});
			var cajero = e.cajero;
			
			var destino  = new google.maps.LatLng(cajero.latitud , cajero.longitud);
			
			var currentlatlng = new google.maps.LatLng(Preferences.get().latitude, Preferences.get().longitude);
			
					$('#ver-cajero-mapa').gmap('search',({'location': currentlatlng}),function(results,status){
							if ( status === 'OK' ) {
								var origin = results[0].formatted_address;
								$('#ver-cajero-mapa').gmap('displayDirections',
											{
												'origin' : origin,
												'destination' : destino, 
												'travelMode' : google.maps.DirectionsTravelMode.DRIVING
											},
											{suppressMarkers: true},
											function(result,status) {
													( status === 'OK' ) ? console.log('status OK ruta generada') : console.log('ruta no generada');
									});
							}
							else {
								 alert("No se pudo localizar su ubicación actual ");
							 }
						}
					);
					
			$('#ver-cajero-mapa').gmap('addShape', 'Circle', { 
				'strokeWeight': 0, 
				'fillColor': "#008595", 
				'fillOpacity': 0.25, 
				'bounds': true,
				'center': new google.maps.LatLng(cajero.latitud,cajero.longitud), 
				'radius': 15, 
				'clickable': false 
			});
		
		})
		
	})
	$("#buscar-cajeros").live('pageshow',function() {
		
		console.log("buscar-cajeros show")

		$("#fin-cajeros").hide();
		
		
		$("#buscar-cajeros-regionesOrdenables-filter").empty();
		
		
		var filter = cajerosPersistenceService.getFilter();
		
		$("#buscar-cajeros-tipoCajero-filter").empty();
		
		if(filter.tipoCajeros && filter.tipoCajeros != -1){
			
			$("#buscar-cajeros-tipoCajero-filter").append("<option data-placeholder='true' value='"+filter.tipoCajeros+"' >"+filter.tipoCajeroDescripcion+"</option>");
		}
		
		var tipoCajeroId = (filter.tipoCajeros) ? filter.tipoCajeros : -1; 
		
		if(tipoCajeroId != -1){
			$("#buscar-cajeros-tipoCajero-filter").append("<option data-placeholder='true' value='-1' >Ninguno</option>");
		}else{
			$("#buscar-cajeros-tipoCajero-filter").append("<option data-placeholder='true' value='-1' >Tipo Cajero</option>");
		}
		
		tipoCajerosPersistenceService.getCollection(function(tipoCajeros) {
			tipoCajeros.forEach(function (tipoCajero) {
				
				if(tipoCajero.id != tipoCajeroId ){
					$("#buscar-cajeros-tipoCajero-filter").append("<option value='" + tipoCajero.id + "'>" + tipoCajero.descripcion +"</option>")
				}
			})
			
			$("#buscar-cajeros-tipoCajero-filter").selectmenu('refresh', true);
			
			$("#buscar-cajeros-tipoCajero-filter").trigger("create");
		})
	
		
		zonasPersistenceService.getCollection(function(collection) {
	
			console.log("buscar-cajeros-regionesOrdenables-filter " , collection.length)
			
			
			collection.forEach(function(zona) {

				$("#buscar-cajeros-regionesOrdenables-filter").append("<input id='cajero-zona-" + zona.uri + "' type='checkbox' class='regionesOrdenablesCajero-update' /><label for='cajero-zona-" + zona.uri + "'>" + zona.nombre +"</label>")
					
					console.log(zona.uri)
					
					$("#cajero-zona-" + zona.uri).prop("zonaId", zona.id);
				
					$("#cajero-zona-" + zona.uri).prop("checked", zona.cajeroSelected);
					
					$("#cajero-zona-" + zona.uri).unbind()
					$("#cajero-zona-" + zona.uri).click(function(e) {
						
						var checkbox = $("#" + e.target.id);
						
						var zona = zonasPersistenceService.getById(checkbox.prop('zonaId'))
						
						zona.cajeroSelected = checkbox.prop("checked")
						
						zonasPersistenceService.update(zona);
						
						if(zona.id == -1){
							unCheckAll('Cajero');
						}
						
						var checkBoxMiUbicacion = $("#cajero-zona-undefined");
						
						if($(this).is(":checked")){
							if(checkBoxMiUbicacion.is(':checked') && e.target.id != "cajero-zona-undefined"){
								
								checkBoxMiUbicacion.prop("checked",false).checkboxradio("refresh");
								
								$("#cajero-zona-undefined").removeAttr('checked')
								
								var zonaMiUbicacion = zonasPersistenceService.getById(checkBoxMiUbicacion.prop('zonaId'))
								
								zonaMiUbicacion.cajeroSelected = checkBoxMiUbicacion.prop("checked")
								
								zonasPersistenceService.update(zonaMiUbicacion)
							}
							
						}
						
					})
					
			});
					
			var checkbox = $("#cajero-zona-undefined");
			
			var zona = zonasPersistenceService.getById(checkbox.prop('zonaId'));

			if(zona.id == -1){
				if(!checkearActivos("Cajero")){
					
					checkbox.attr("checked","checked");
					
					zona.cajeroSelected  = checkbox.prop("checked")
					
					zonasPersistenceService.update(zona);
				}else{
					if(checkbox.is(':checked')){
						
						checkbox.prop("checked",false)
						
						$("#cajero-zona-undefined").removeAttr('checked')
						
						var zonaMiUbicacion = zonasPersistenceService.getById(checkbox.prop('zonaId'))
						
						zonaMiUbicacion.cajeroSelected = checkbox.prop("checked")
						
						zonasPersistenceService.update(zonaMiUbicacion)
					}	
				}
					
				
			}
			
					try{
						$("#buscar-cajeros-regionesOrdenables-filter").trigger("create");
					}
					catch(e){
						
					}
				
			
		})

	});
	

//	$("#menu-principal").live('pagebeforehide',function()  {
//		
//		var filter = cajerosPersistenceService.getFilter();
//		
//		filter.tipoCajeros = -1;
//		
//		filter.tipoCajeroDescripcion = "Tipo Cajero";
//		
//		localStorage.setObject("cajeros-filter", filter);
//		
//		$.mobile.loading('hide')
//		
//	});

	
	$(document).ready(function(){
	   var s = document.createElement("script");
	   s.type = "text/javascript";
	   s.src  = "http://maps.google.com/maps/api/js?sensor=true&language=es&region=AR&callback=gmap_draw&libraries=geometry";
	  
	   window.gmap_draw = function(){
	     
		   var s = document.createElement("script");
		   s.type = "text/javascript";
		   s.src  = "assets/js/jquery.ui.map.full.min.js";
		   $("head").append(s);
		   $(document).trigger("google-loaded")
	   };
	   
	   $("head").append(s);
	   
	   	$("#buscar-mas-beneficios").hide();
	   	$("#buscar-mas-sucursales").hide();
	   	$("#buscar-mas-cajeros").hide();
	   	$("#sin-resultados-beneficios").hide();
	   	$("#sin-resultados-sucursales").hide();
	   	$("#sin-resultados-cajeros").hide();
	   	$("#fin-sucursales").hide();
	   	$("#fin-cajeros").hide();
	   	$("#fin-cajeros").hide();
	});
	
	$("#fin-beneficios").hide();
   	$("#fin-sucursales").hide();
   	$("#fin-cajeros").hide();
   	
   	$("#buscar-mas-beneficios").hide();
   	$("#buscar-mas-sucursales").hide();
   	$("#buscar-mas-cajeros").hide();
   	
	window.callbackList = [];
	
	window.ensureGMaps = function(callback) {
		try {
			if (google) {
				callback();
			}	
			else {
				callbackList.push(callback)
			}
		}
		catch(e){
			callbackList.push(callback)
		}
		
	}
	
	$(document).bind("google-loaded", function() {
		callbackList.forEach(function(callback) {
			callback();
		})
		
		callbackList = []
	});
	
	$.mobile.loading('show');
	
//	beneficiosPersistenceService.remove();
	
	rubrosPersistenceService.reloadCollection();
	
	zonasPersistenceService.reloadCollection();
	
	bannerCollection = localStorage.getObject('banners');
	
	if(bannerCollection){
		console.log('Banners al abrir la aplicacion: ' + bannerCollection.length );
		if(bannerCollection.length == 0){
			console.log('No habia banner cargados')
			bannersPersistenceService.forceReloadCollection();
			console.log('Banners luego de cargarlos: ' + bannerCollection.length );
		}
	}else{
		console.log('Nunca se cargo la colleccion de banners')
		bannersPersistenceService.forceReloadCollection();
	}
	
	setTimeout(function(){
		
		$('#boton-listar-beneficios').removeClass('ui-disabled')
		$('#boton-listar-sucursales').removeClass('ui-disabled')
		$('#boton-listar-cajeros').removeClass('ui-disabled')

		$.mobile.loading('hide');
	},2500);
	
}
	
