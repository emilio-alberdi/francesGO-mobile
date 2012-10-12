
   


	//$("[id^=appFooter]").empty().append($('#footerNav'));
	
   	baseUrl = '';
//   	baseUrl = 'http://192.168.1.104:8080/francesGo2-portal/mobile/';
//   	baseUrl = 'https://bbvawebqa.bancofrances.com.ar/francesGo2-portal/mobile/';
   	baseUrl = 'https://m.francesgo.com.ar/francesGo2-Portal/mobile/';
   	$( document ).bind( "mobileinit", function() {
	    // Make your jQuery Mobile framework configuration changes here!

	    $.mobile.allowCrossDomainPages = true;
	    $.mobile.page.prototype.options.addBackBtn = true;
	});

	navigator.geolocation.getCurrentPosition(function(position){
		
		Preferences.get().latitude = position.coords.latitude;
		
		Preferences.get().longitude = position.coords.longitude;
	  
		Preferences.update();
    });  
		

	Storage.prototype.setObject = function(key, value) {
		if (value) {
			this.setItem(key, JSON.stringify(value));	
		}	
	}

	Storage.prototype.getObject = function(key) {
	    var value = this.getItem(key);
	    try {
		    return value && JSON.parse(value);
	    }
	    catch (e) {
	    	console.log('parse error', e)
	    }
	}
	
	function UserPreferences() {
		this.theme = '';	
		this.latitude = 0;
		this.longitude = 0;
	}
	
	
	function Preferences() {
		
	}
	
	
	Preferences.userPreferences;

	Preferences.update = function() {
		localStorage.setObject('preferences', Preferences.userPreferences)
	}

	Preferences.load = function() {
		
		Preferences.userPreferences = localStorage.getObject('preferences')
	
		if (!Preferences.userPreferences) {
			Preferences.userPreferences = new UserPreferences();	
		}
		
		return Preferences.userPreferences;
	}

	Preferences.get = function() {
		
		if (!Preferences.userPreferences) {
			return Preferences.load();
		}
		
		return Preferences.userPreferences;
	}
	
	
	function PersistService(options) {
		this.options = options;
		
		if (!options.remoteService) {
			this.remoteService = new RemoteService(options)
		}
		else {
			this.remoteService = options.remoteService 
		}
		
		this.remoteService.add(this)
		
		this.collectionCache = {};
		
		this.lastUpdate = null;
	}
	PersistService.prototype.sortCollection = function(collection) {
		if (this.options.sortFunction) {
			collection.sort(this.options.sortFunction);
		}
		else {
			collection.sort(function (item1, item2) {
				return item1.id - item2.id;
			})
		}
	}

	PersistService.prototype.getSort = function() {
		if (this.options.sortFunction) {
			return this.options.sortFunction
		}
		else {
			var sort = function (item1, item2) {
				return item1.id - item2.id;
			}
			
			return sort;
		}
	}
	
	PersistService.prototype.loadCollection = function(data) {
		
		if (!data) {
			
			console.log('error load cant persist an empty collection: ');
				
			return;
		}
	
		console.log('load data: ', data);
		
		var collection = data
		
		if (this.options.filterCollection) {
			collection =  this.options.filterCollection(data)
		}
		
		if (this.options.processData) {
			this.options.processData(collection)
		}
		
		if (this.options.appendFirst) {

			var persitedCollection = localStorage.getObject(this.options.name);
		
			if (!persitedCollection) {
				localStorage.setObject(this.options.name, collection);	
			}
			else {
				
				collection =  collection.concat(persitedCollection)
		
				localStorage.setObject(this.options.name, collection);	
				
			}
			
		}
		else if (this.options.appendLast) {

			var persitedCollection = localStorage.getObject(this.options.name);
		
			if (!persitedCollection) {
				localStorage.setObject(this.options.name, collection);	
			}
			else {
		
				collection =  persitedCollection.concat(collection)
		
				localStorage.setObject(this.options.name, collection);	
				
			}
			
		}
		else if (this.options.merge) {
			var persistedCollection = localStorage.getObject(this.options.name);
			
			if (!persistedCollection) {
				localStorage.setObject(this.options.name, collection);	
			}
			else {
				
				this.sortCollection(persistedCollection)
				
				this.sortCollection(collection)
				
				var list = []
				
				var counter = 0;
				
				for(var i=0; i< persistedCollection.length; i++) {
					
					var persistedItem = persistedCollection[i]
					
					if (counter >= collection.lehgth) {
						list.push(persistedItem)
						continue;
					}
					
					var item = collection[counter]
					
					var order = this.getSort(persistedItem, item)
					
					if (order < 0) {
						list.push(persistedItem)
					   
						continue;
						
					}
					
					if (order == 0) {
						if (this.option.mergeFunction) {
							list.push(this.option.mergeFunction(persistedItem, item))
						}
						else {
							list.push(item)
						}
					}
					
					while (order > 0 && counter < collection.length) {
						
						list.push(item)
						   
						counter++;
						
						item = collection[counter]
						
						order = this.getSort(persistedItem, item)
					}
					
				}
			
				localStorage.setObject(this.options.name, collection);	
				
			}
		
		}	
		else {
			localStorage.setObject(this.options.name, collection);
		}
		
		if (this.options.maxItems && this.options.maxItems < collection.length) {
			
			localStorage.setObject(this.options.name, collection.slice(0, this.options.maxItems));
			
		}
		
		var expirationDays = null
		
		if (this.options.expirationDays) {
			
			expirationDays =  new Date()
			expirationDays.setHours(0)
			expirationDays.setMinutes(0)
			expirationDays.setSeconds(0)
			
			expirationDays.setTime(expirationDays.getTime() + this.options.expirationDays * 86400000 )
		
		}
		
		localStorage.setObject(this.options.name + '-metadata', {lastUpdate:new Date(), expirationDate:expirationDays});
		
		console.log('store data: ', collection);
		
		return collection;

	}
	
	PersistService.prototype.loadData = function(processCollection, persistService,data) {
		
		try {
			var result =  persistService.loadCollection(data)
			
			if (!result) {
				console.log('Collection is empty ', this.options.name)
				return;
			}
			
			this.createCache(result)
			
			if (processCollection){
			
				processCollection(result)
			}
			
		}
		catch (e) {
			console.log('error', e);
		}
	}
	
    PersistService.prototype.remove = function() {
		
		try {
			localStorage.removeItem(this.options.name)
			
		}
		catch (e) {
			console.log('error', e);
		}
	}

	PersistService.prototype.createCache = function(collection) {
		
		var getById = function(item) {
			try {
				return parseInt(item.id)
			}
			catch (e) {
			} 
			return item.id
		}
		
		if (this.options.getByIdFunction) {
			getById = this.options.getByIdFunction
		}
		
		this.collectionCache = {}
		
		var persistService = this;
		
		collection.forEach(function(item){
		
			persistService.collectionCache[getById(item)] = item;
			
		});
		
		persistService.collectionCache.init = true;
	}
	
	PersistService.prototype.getById = function(id) {
		
		var value;
		
		
		if (this.collectionCache || !this.collectionCache.init) {
			value =  this.collectionCache[id]
		}
		
		if (value) {
			return value;
		}
		else {
		
			var collection = localStorage.getObject(this.options.name);
			
			if (!collection) {
				
				
				return;
			}
			
			this.createCache(collection)
			
			return this.collectionCache[id];
			
		}
		
	}
	
	PersistService.prototype.update = function(item) {
		
		var getById = function(item) {
			return item.id
		}
		
		if (this.options.getByIdFunction) {
			getById = this.options.getByIdFunction
		}
		
		if (this.collectionCache) {
		
			this.collectionCache[getById(item)] = item
		}
		else {
		
			var collection = localStorage.getObject(this.options.name);
			
			this.createCache(collection)
			
			this.collectionCache[getById(item)] = item;
			
		}
		
		var list = []
		
		for (property in this.collectionCache) {
		
			if(this.collectionCache.hasOwnProperty(property)) {
				list.push(this.collectionCache[property])	
			}
			
		}
		
		this.sortCollection(list)
		
		localStorage.setObject(this.options.name, list);
	}
	
	PersistService.prototype.getFilter = function() {

		return localStorage.getObject(this.options.name + "-filter");
		
	}	


	PersistService.prototype.getFilteredCollection = function(filter, processCollection) {

		localStorage.setObject(this.options.name + "-filter", filter);
		
		var persistService = this;
		
		console.log('collection: ' + this.options.name + " filter: ", filter );
		
		var callback = function (data) {
	
			var collection = localStorage.getObject(persistService.options.name);
			
			processCollection(collection)
		}
		
		this.remoteService.callFilter(filter, callback);
	
		
	}


	PersistService.prototype.forceReloadCollection = function() {
		this.remove()
		
		if (this.getFilter()) {
			this.getFilteredCollection(this.getFilter(), function(collection) {})
		}
		else {
			this.getCollection(function(collection) {})
		}
	}

	
	PersistService.prototype.getCollection = function(processCollection) {
		
		var collection = localStorage.getObject(this.options.name);

		var metadataCollection = localStorage.getObject(this.options.name + "-metadata");
		
		var expired = false;
		
		if (collection  && this.options.expirationDays) {
			expired = !metadataCollection.expirationDate || metadataCollection.expirationDate < new Date()  
		}
		
		var persistService = this;
		
		if (!collection || expired) {
			
			console.log('collection: ' + this.options.name + " not found" );
			
			
			var callback = function (data) {
		
				var collection = localStorage.getObject(persistService.options.name);
				
				processCollection(collection)
			}
			
			
			if (this.options.filter ) {
			
				var filter = localStorage.getObject(this.options.name + "-filter");
				
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
				
				services.forEach(function(persistService) {
					
					persistService.loadCollection(data)	
					
				})
			
				processCollection();
				
				$.mobile.hidePageLoadingMsg();
				
			}
			catch(e) {
				console.log('error', e);
			}
		}
		
		$.mobile.showPageLoadingMsg();
		
		$.ajax({url:this.options.service, type:'POST', cache: false, success: callback, error: function(jqXHR, textStatus, errorThrown) {
			  
			  console.log(textStatus, errorThrown);
			  
			  $.mobile.hidePageLoadingMsg();
			  
			  alert('Error on service ' + this.options.service + " " + textStatus  + " "+ errorThrown )
		}})
		
	}
	
	RemoteService.prototype.callFilter = function(data, processCollection) {
		
		var services = this.services;
		
		var callback = function (data) {
			try {
				
				services.forEach(function(persistService) {
					
					persistService.loadCollection(data)	
					
				})
			
				processCollection();
			}
			catch(e) {
				console.log('error', e);
			}
		}
	
		$.ajax({url:this.options.service, type:'POST', data:data,cache: false, success: callback, error: function(jqXHR, textStatus, errorThrown) {
			  console.log(textStatus, errorThrown);
		}})
		
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
			   filterCollection:function(data) { return data.beneficios[0]}
			   
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
					
					image = baseUrl + 'image-resources/'  + rubro.logoSmall;	
				}
				
			}
			
		}
	
		return image;
	}
	
	
	beneficiosPersistenceService.showBeneficio = function(beneficio) {
		
			var image = this.getLogo(beneficio);
		
			$("#ul-beneficios").append("<li><a id='beneficio-" + beneficio.hash + "' ><img  height='30' width='30' id='beneficio-" + beneficio.hash + "-logo' class='ui-li-icon' src='" + image + "' ></img> <span class=''><h3>" + beneficio.nombreComercio + "</h3><p id='beneficio-" + beneficio.hash + "-distance' class='ui-li-aside ui-li-desc'></p><p>" + beneficio.mensajeCorto  +"</p> </span></a></li>")
			$("#beneficio-" + beneficio.hash ).data("beneficio", beneficio)

			$("#beneficio-" + beneficio.hash).click(function(e) {
				
				$.mobile.changePage("#ver-beneficio")
				
				$("#ver-beneficio").trigger({type:"display-data", beneficio:$(this).data("beneficio")})
			})

			
			try {
				ensureGMaps(function () {
					try {
						var currentPosition = new google.maps.LatLng(Preferences.get().latitude, Preferences.get().longitude);
						
						var sucursalPostion = new google.maps.LatLng(beneficio.latitud, beneficio.longitud);
						
						var distance = google.maps.geometry.spherical.computeDistanceBetween (currentPosition, sucursalPostion);
						
						distance = Math.ceil(distance/1000 )
						
						console.log("Comercio " + beneficio.nombreComercio, distance)
						
						$("#beneficio-" + beneficio.hash + "-distance").text(distance + "km.")
							
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
	   filterCollection:function(data) { return data.sucursales[0]}
	   
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
						
						console.log("Sucursal " + sucursal.nombre, distance)
						
						$("#" + sucursal.uri + "-distance").text(distance + "km")
					})
					
				}
				catch(e) {
					
				}
				
				
				$("#" + sucursal.uri).click(function(e) {
					
					$.mobile.changePage("#ver-sucursal")
					
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
		   filterCollection:function(data) { return data.cajeros[0]}
		   
	   });

		cajerosPersistenceService.showCajero = function(cajero) {
//			+ cajero.codigoCajero + " " <p>" + cajero.localidad.nombre  +"</p>
			$("#ul-cajeros").append("<li><a id='" + cajero.uri + "' ><h3>" +  ((cajero.sucursalBanco.id) ? cajero.sucursalBanco.id + " - " : "") +((cajero.sucursalBanco && cajero.sucursalBanco.nombre ) ? cajero.sucursalBanco.nombre : ' BBVA Banco Frances') +  "</h3><p id='" + cajero.uri + "-distance' class='ui-li-aside ui-li-desc'></p><p>" + cajero.domicilio  + " (" + cajero.tipoCajeroBanco.descripcion + ") </p> </a></li>")
			
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
				
				$.mobile.changePage("#ver-cajero")
				
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
														   collection.splice(0,1, {id:-1, nombre:'Mi ubicacion'})
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
	
	/*
	var rubro = rubrosPersistenceService.getById(1)
	
	console.log('start 2', rubrosPersistenceService.getById(1));
	
	rubro.selected = true;
	
	rubrosPersistenceService.update(rubro)
	Preferences.get().theme = 'test'
	
	Preferences.update();
	
	console.log(Preferences.get().theme)
	*/


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
		rubrosPersistenceService.forceReloadCollection()
		zonasPersistenceService.forceReloadCollection()
		tiposDocumentoPersistenceService.forceReloadCollection()
		operadoresTelefonicoPersistenceService.forceReloadCollection()
		tipoCajerosPersistenceService.forceReloadCollection()
		codigosAreaCelularPersistenceService.forceReloadCollection()
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
	
	function registerGMapsToPage(pageName) {
		$("#" + pageName).live('pagebeforehide',function() {
			$('#'+ pageName + '-mapa').gmap('clear', 'markers');
		//	$('#'+ pageName + '-mapa').gmap('destroy');
		})

		$("#"+ pageName ).live('pageinit',function() {
			$('#'+ pageName + '-mapa').gmap(defaultMapConfig)
		})

		$('#'+ pageName).live("pageshow", function() {
			$('#'+ pageName + '-mapa').gmap('option', 'zoom', 16)
		    $('#'+ pageName + '-mapa').gmap('refresh');
		});		
		
	}


	function changeTheme(select) {
		
		Preferences.get().theme = $(select).val()
		
		Preferences.update();
		
		$("#theme-css").attr("href",'assets/stylesheets/css/themes/' + Preferences.get().theme.toLowerCase()   + '.css');
		
	}
	
	
	function francesGORegisterEvents() {

	registerGMapsToPage('object-mapa');
	registerGMapsToPage('objects-mapa');
	registerGMapsToPage('ver-sucursal');
	registerGMapsToPage('ver-cajero');
	registerGMapsToPage('ver-beneficio');
	
	$('#preferencias-eliminar-cache').click(releaseData)
	
	if (Preferences.get().theme && Preferences.get().theme.length > 0) {
		$("#theme-css").attr("href",'assets/stylesheets/css/themes/' + Preferences.get().theme.toLowerCase()  + '.css')
		
		$("#preferencias-theme").val(Preferences.get().theme)
		
	}
	
		
	console.log('start francesGORegisterEvents ');
	
	$(".banner").live("pageinit", function(event) {
		
		var page = $(this).page()
//		data-theme="b"
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
			
			var image = page.find('#bannerImage');
			
			console.log("Iniciando la carga del banner" + nombreArchivo);
			
			image.attr("src", baseUrl + 'image-resources/' + nombreArchivo);
			
		});
	})

	$("#ver-beneficio").live('pagebeforehide',function() {
		var pageName = 'ver-beneficio-mapa';
		refreshMap(pageName);
	})
		
	$("#registracion-baja").bind('display-data',function(e) {
		
		tiposDocumentoPersistenceService.getCollection(function(tiposDocumento) {
			try {
				tiposDocumento.forEach(function (tipoDocumento) {
					$("#registracion-baja-tiposDocumento").append("<option value='" + tipoDocumento.id + "'>" + tipoDocumento.descripcionLarga +"</option>")
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
				$("#registracion-tiposDocumento").append("<option value='" + tipoDocumento.codigoAltamira + "'>" + tipoDocumento.descripcionLarga +"</option>")
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
				$("#registracion-regionesOrdenables").append("<option value='" + zona.uri + "'>" + zona.nombre +"</option>")
			});
			$("#registracion-regionesOrdenables").selectmenu('refresh', true);
		})
		

		
	})

	
	$("#registracion-baja-confirmacion-link").click(function(e){
		
		 var callback = function(data) {
			 $.mobile.changePage("#registracion-resultado")
		
			 $.mobile.hidePageLoadingMsg();
			 
			 $("#registracion-resultado-message").text("Para confirmar la baja le enviaremos un SMS al n�mero de celular registrado.")
		 }
		 
		 $.mobile.showPageLoadingMsg();
		 
		 $.ajax({url:baseUrl + "mobile-registracion-baja.json", type:'POST', data:$('#registracion-baja-form').serialize(),cache: false, success: callback, error: function(jqXHR, textStatus, errorThrown) {
			  console.log(textStatus, errorThrown);
		
			  $.mobile.hidePageLoadingMsg();
				 
		 }})
		
		
	}) 
	
	$("#registracion-confirmation-send-link").click(function(e){
		
		
		var aceptaTerminosLegales = $("#aceptaTerminosLegales").is(':checked') ;
		
		if (!aceptaTerminosLegales) {
			alert("Debe aceptar los terminos y condiciones")
			return;
		}
		
		 var callback = function(data) {
			 
			 $.mobile.changePage("#registracion-resultado")
			 
			 $.mobile.hidePageLoadingMsg();
			 
			 $("#registracion-resultado-message").text(" Ha sido registrado satisfactoriamente. Le enviaremos un mensaje de bienvenida")
		 }
		 
		 $.mobile.showPageLoadingMsg();
		 
		 $.ajax({url:baseUrl + "mobile-registracion.json", type:'POST', data:$('#registracion-form').serialize(),cache: false, success: callback, error: function(jqXHR, textStatus, errorThrown) {
			 $.mobile.hidePageLoadingMsg();
			 console.log(textStatus, errorThrown);
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

	})

	
	$("#buscar-beneficios").live('pageinit',function() {
		
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
		collection.forEach(function(zona) {
			$("#regionesOrdenables-filter").append("<input id='" + zona.uri + "' type='checkbox' class='regionesOrdenables-update' /><label for='" + zona.uri + "'>" + zona.nombre +"</label>")
			
			$("#" + zona.uri).prop("zonaId", zona.id);
		
			$("#" + zona.uri).prop("checked", zona.selected);
		
			$("#" + zona.uri).click(function(e) {
				
				var checkbox = $("#" + e.target.id);
				
				var zona = zonasPersistenceService.getById(checkbox.prop('zonaId'))
				
				zona.selected = checkbox.prop("checked")
				
				zonasPersistenceService.update(zona);
				
			})
		});
		try{
			$("#buscar-beneficios").trigger("create");
		}
		catch(e){
			
		}

	})
	
	campaniasPersistenceService.getCollection(function(collection) {
		collection.forEach(function(campania) {
			$("#campanias-filter").append("<input id='" + campania.uri + "' type='checkbox' class='campanias-update' /><label for='" + campania.uri + "'>" + campania.nombre +"</label>")
			
			$("#" + campania.uri).prop("campaniaId", campania.uri);
		
			$("#" + campania.uri).prop("checked", campania.selected);
		
			$("#" + campania.uri).click(function(e) {
				
				var checkbox = $(this);
				
				var campania = campaniasPersistenceService.getById(checkbox.prop('campaniaId'))
				
				campania.selected = checkbox.prop("checked")
				
				campaniasPersistenceService.update(campania);
				
			})
		});

		try { 
			$("#buscar-beneficios").trigger("create");
		}
		catch(e){
			
		}
	})
	
	
});
	$("#buscar-beneficios-link").click(function(e) {
		
		try {

			console.log("start filter");
			
			var filter = {}
			
			filter.searchText = $("#buscar-beneficios-search").val();
			
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
				})
			})
			
			
			campaniasPersistenceService.getCollection(function(collection) {
					filter.campanias = collection.filter(function(campania) {
						return campania.selected
					}).map(function(campania) {
						return campania.uri
					})
			})
			
			var currentLocation = zonasPersistenceService.getById(-1)
			
			if (currentLocation.selected) {
				filter.latitude = Preferences.get().latitude;
				filter.longitude = Preferences.get().longitude;
			}
			
			
			beneficiosPersistenceService.getFilteredCollection(filter, function(collection) {
			
				$.mobile.changePage("#listar-beneficios")
				
				$("#ul-beneficios").empty();
				
				collection.forEach(function(beneficio) {
		
					beneficiosPersistenceService.showBeneficio(beneficio);

				})
				
				$("#ul-beneficios").listview('refresh');
				
				console.log('referesh');

			});	
			
		}
		catch(e) {
			console.log("Error on seach", e)
		}
			
	})
	
	$("#beneficio-legales").bind('display-data',function(e) {
	
		var beneficio = e.beneficio;
		
		$("#beneficio-legales-comercio").text(beneficio.nombreComercio)
	
		$("#beneficio-legales-datos").text(beneficio.textoVigencia + beneficio.legales + beneficio.cft)
		
		$("#back-legales").unbind();
		
		$("#back-legales").one("click" , function(event){
			
		
			
			$.mobile.changePage("#ver-beneficio");
			
			$("#ver-beneficio").trigger({type:"display-data", beneficio: beneficio});
			
			console.log("Cambiando a la vista del beneficio: " + beneficio.nombreComercio);
			
			
		})	
		
	});
	

	$("#ver-beneficio").bind('display-data',function(e) {
		
		console.log("Pagina 'ver-beneficio' nombre del comercio asociado al beneficio : " + e.beneficio.nombreComercio);
		
		var beneficio = e.beneficio;
		var distance;
		
		var directions = $('#ver-beneficio-mapa').gmap('get', 'services > DirectionsRenderer');
		if (directions) {
			console.log("Ruta al darle 'click' BORRADA OK")
			directions.setMap(null);
			directions.setPanel(null);
		}
		
		try {
			var currentPosition = new google.maps.LatLng(Preferences.get().latitude, Preferences.get().longitude);
			
			var sucursalPostion = new google.maps.LatLng(beneficio.latitud, beneficio.longitud);
			
			distance = google.maps.geometry.spherical.computeDistanceBetween (currentPosition, sucursalPostion);
			
			distance = Math.ceil(distance/1000 )
		}
		catch(e) {
			console.log("Error", e);
		}
//		if (beneficio.listaRubrosAsociados) {
//			
////			$("#beneficio-rubros").empty();
//			
//			var rubros = beneficio.listaRubrosAsociados.split(",");
//			
////			rubros.forEach(function(rubroId) {
//				
//				var rubro = rubrosPersistenceService.getRubroPadre(parseInt(rubros[0]))
//				
//				if (rubro && rubro.logoSmall) {
//					
//					$("#beneficio-title").html("<img alt='" + rubro.nombre + "' src='" + baseUrl + "image-resources/" + rubro.logoSmall + "' />")
//					
//				}
//				
////			})
//			
//			
//		}
		
		var comercioLogo = beneficiosPersistenceService.getLogo(beneficio);
		
		$("#beneficio-title").html("<span class='float-left'><img class= 'imgLogoFrances'src='assets/images/logo_francesGo.png'/></span>")
		
		$("#beneficio-title").append("<span class='float-left'><img width=30, height=30 class='comercioLogo'src='"+baseUrl + comercioLogo +"'/></span>")
		
		$("#beneficio-title").append("<span class='float'>" + beneficio.nombreComercio + "</span>")
		
		$("#beneficio-title").append("<span class='float-rigth-beneficio'>" + distance +"km"+ "</span>")
		
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
			
		if(beneficio.idShopping){
			$("#beneficio-direccion").append("Sucursal: " + beneficio.nombreSucursal +"  <p class='direccion'><strong>Dirección:</strong> " + beneficio.calle + " " + beneficio.numero +  ", " + beneficio.nombreLocalidad +"<span>(" + distance +" km)</span></p>");
		}else
			$("#beneficio-direccion").append("<p class='direccion'><strong>Dirección:</strong> " + beneficio.calle + " " + beneficio.numero +  ", " + beneficio.nombreLocalidad +"<span>(" + distance +" km)</span></p>");
		
			$('#ver-beneficio-mapa').gmap('clear' , 'markers');
			$('#ver-beneficio-mapa').gmap('clear' , 'overlays');
			
			
		
			var beneficioInfo = '<div id="infowindow_content"><div id="siteNotice"></div><h4 id="firstHeading" class="firstHeading">'+ beneficio.nombreComercio+'</h4><div id="bodyContent"><p>' + beneficio.descripcionPortal + '</p></div></div>'
		
				var imageIcon = beneficiosPersistenceService.getLogo(beneficio);
				
				var marker = {'position': new google.maps.LatLng(beneficio.latitud , beneficio.longitud), 'bounds': true}
				
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
				}
				
				
				
				$('#ver-beneficio-mapa').gmap('addMarker', marker).click(function() {
					$('#ver-beneficio-mapa').gmap('openInfoWindow', {'content': beneficioInfo}, this);
				});
				$('#ver-beneficio-mapa').gmap('option', 'zoom', 18);
				$('#ver-beneficio-mapa').gmap('option', 'center', new google.maps.LatLng(beneficio.latitud , beneficio.longitud));
		
		$("#ver-beneficio-legales-link").unbind();
				
		$("#ver-beneficio-legales-link").one("click" , function(event) {
	
			
			$.mobile.changePage("#beneficio-legales")
			
			$("#beneficio-legales").trigger({type:"display-data", beneficio:beneficio})
			
			
		})
		
		$("#ver-beneficio-mapa-link2,#ver-beneficio-mapa-link").click(function() {
			
			$.mobile.changePage("#object-mapa")
			
			$("#object-mapa").trigger({type:"display-data-beneficio", beneficio:beneficio, title:'Beneficio'})
				
		})
		$("#ver-beneficio-como-llegar-link").unbind();
		
		$("#ver-beneficio-como-llegar-link").one("click", function(){
		
			$("#ver-beneficio-como-llegar-link").unbind('click');
			
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
			$("#ver-beneficio-como-llegar-link").unbind();
			 
		});
		
	})
	$("#beneficios-mapa").unbind();
	
	$("#beneficios-mapa").one("click" , function() {
		
		$("#objects-mapa").trigger({type:"display-data-beneficio",title:'Beneficios'})
		
		$.mobile.changePage("#objects-mapa")
				
	})
	$("#objects-mapa").bind('display-data-beneficio',function(e) {
		if (e.title) {
			$("#objects-mapa-title").text(e.title)
		}
		$("#back-listar").unbind("click");
		
		$("#back-listar").click(function(){
			$.mobile.changePage("#listar-beneficios");
		})	
		
		$('#objects-mapa-mapa').gmap('clear', 'markers');
		$('#ver-beneficio-mapa').gmap('clear' , 'overlays');
		
		beneficiosPersistenceService.getCollection(function(collection) {
			collection.forEach(function(beneficio) {
	
				var beneficioInfo = '<div id="infowindow_content"><div id="siteNotice"></div><h4 id="firstHeading" class="firstHeading">'+ beneficio.nombreComercio+'</h4><div id="bodyContent"><p>' + beneficio.descripcionPortal + '</p></div></div>'
				
					var imageIcon = beneficiosPersistenceService.getLogo(beneficio);
					var marker = {'position': new google.maps.LatLng(beneficio.latitud , beneficio.longitud), bounds: false}
					
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
					}
					
					$('#objects-mapa-mapa').gmap('addMarker', marker).click(function() {
						$('#objects-mapa-mapa').gmap('openInfoWindow', {'content': beneficioInfo}, this);
					});
					
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
			
			$('#objects-mapa-mapa').gmap('option', 'zoom', 14);
	
	})

	$("#object-mapa").bind('display-data-beneficio',function(e) {
	
		if (e.title) {
			$("#object-mapa-title").text(e.title)
		}
		var beneficio = e.beneficio;
		
		var beneficioInfo = '<div id="infowindow_content"><div id="siteNotice"></div><h4 id="firstHeading" class="firstHeading">'+ beneficio.nombreComercio+'</h4><div id="bodyContent"><p>' + beneficio.descripcionPortal + '</p></div></div>'

		$('#object-mapa-mapa').gmap('clear', 'markers');
		
		$('#ver-beneficio-mapa').gmap({ 'center': beneficio.latitud + ','+ beneficio.longitud})
				
		var imageIcon = beneficiosPersistenceService.getLogo(beneficio);
		
		var marker = {'position': new google.maps.LatLng(beneficio.latitud , beneficio.longitud), 'bounds': true}
		
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
		}
		var currentMarker = {'position':new google.maps.LatLng(Preferences.get().latitude, Preferences.get().longitude), 'bounds' : true}
		
		$('#object-mapa-mapa').gmap('addMarker', currentMarker).click(function() {
			$('#object-mapa-mapa').gmap('openInfoWindow', {'content': 'posicion actual'}, this);
		});
		$('#object-mapa-mapa').gmap('addMarker', marker).click(function() {
			$('#object-mapa-mapa').gmap('openInfoWindow', {'content': beneficioInfo}, this);
		});
		
		$('#object-mapa-mapa').gmap('addShape', 'Circle', { 
			'strokeWeight': 0, 
			'fillColor': "#008595", 
			'fillOpacity': 0.25, 
			'bounds': true,
			'center': new google.maps.LatLng(beneficio.latitud,beneficio.longitud), 
			'radius': 15, 
			'clickable': false 
		});
		
		
	})
//TODO 
	$("#listar-beneficios").live('pageshow',function() {

		$("#ul-beneficios").empty();
		
		beneficiosPersistenceService.getCollection(function(collection) {
			
			if(collection.length > 50){
				collection.length = 50 ;
			}
			console.log("Largo de la collecion luego de modificarlo: " + collection.length );
			collection.forEach(function(beneficio) {
				
				beneficiosPersistenceService.showBeneficio(beneficio);
			})
			
			$("#ul-beneficios").listview('refresh');

		})
	})

	
	$("#buscar-sucursales-link").click(function(e) {
		
		try {

			console.log("start filter");
			
			var filter = {}
			var searchCode = $("#buscar-sucursal-nombre").val();
			if(!isNaN(searchCode)){
				filter.searchCode = searchCode;
			}else
			filter.searchText = $("#buscar-sucursal-nombre").val();

			zonasPersistenceService.getCollection(function(collection) {
				filter.zonas = collection.filter(function(zona) {
					return zona.sucursalSelected && zona.id != -1
				}).map(function(zona) {
					return zona.id
				})
			})
			
			var currentLocation = zonasPersistenceService.getById(-1)
			
			if (currentLocation.selected) {
				filter.latitud = Preferences.get().latitude;
				filter.longitud = Preferences.get().longitude;
			}
			
			
			sucursalesPersistenceService.getFilteredCollection(filter, function(collection) {
			
				$.mobile.changePage("#listar-sucursales")
				
				$("#ul-sucursales").empty();
				
				collection.forEach(function(sucursal) {
		
					sucursalesPersistenceService.showSucursal(sucursal);

				})
				
				$("#ul-sucursales").listview('refresh');
				
				console.log('referesh');

			});	
			
		}
		catch(e) {
			console.log("Error on seach", e)
		}
			
	})
	
	$("#sucursales-mapa").click(function() {

		$.mobile.changePage("#objects-mapa")
		
		$("#objects-mapa").trigger({type:"display-data-sucursales",title:'Sucursales'})
		
					
	})

	
	$("#objects-mapa").bind('display-data-sucursales',function(e) {
		$("#back-listar").unbind("click");
		
		console.log("object-mapa init", e.title)
		
		if (e.title) {
			$("#objects-mapa-title").text(e.title)
		}
		$("#back-listar").click(function(){
			$.mobile.changePage("#listar-sucursales");
		})	
		
		$('#objects-mapa-mapa').gmap('clear', 'markers');
		$('#ver-beneficio-mapa').gmap('clear' , 'overlays');
		
		sucursalesPersistenceService.getCollection(function(collection) {
			collection.forEach(function(sucursal) {
				
					var sucursalInfo = '<div id="infowindow_content"><div id="siteNotice"></div><h4 id="firstHeading" class="firstHeading">'+ sucursal.nombre+'</h4><div id="bodyContent"><p>' + sucursal.domicilio + '</p></div></div>'
					
//					$('#objects-mapa-mapa').gmap(defaultMapConfig).bind('init', function(ev, map) {
						$('#objects-mapa-mapa').gmap('addMarker', {'position': new google.maps.LatLng(sucursal.latitud , sucursal.longitud), bounds: false,icon:'assets/images/sucursal.gif'}).click(function() {
							$('#objects-mapa-mapa').gmap('openInfoWindow', {'content': sucursalInfo}, this);
						});
//					});
				
			});
			
		});	
		
		var currentLatLng = new google.maps.LatLng(Preferences.get().latitude, Preferences.get().longitude)
		
		var currentMarker = {'position': currentLatLng,bounds: true}
		
		var img = new Image();
		
		img.src = baseUrl + 'assets/images/icons/User_Icon_Map.png'
		
		var image = new google.maps.MarkerImage(img.src,null,null,null, null);		
		
		currentMarker.icon = image;
		console.log("Current Position " + currentLatLng + "URL image: " + image.url);
			
//			$('#objects-mapa-mapa').gmap().bind('init', function(ev,map) {
				$('#objects-mapa-mapa').gmap('option', 'center', currentLatLng );
				$('#objects-mapa-mapa').gmap('addMarker',currentMarker).click(function() {

					$('#objects-mapa-mapa').gmap('openInfoWindow', {'content': 'posicion actual'}, this);
				
				});
			
			$('#objects-mapa-mapa').gmap('option', 'zoom', 14);
//			});
		
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
		
		$("#ver-sucursal-title").append("<span><h1>" + sucursal.nombre + "</h1></span>")
		
		$("#ver-sucursal-title").append("<span class='rigth-sucursal'>" +distance+"KM"+"</span>")
	
		$("#ver-sucursal-domicilio").text(sucursal.domicilio)
		
		$("#ver-sucursal-tipoSucursal").text((sucursal.tipoSucursal == 'P')?'Personas':'Empresa')
		
		$("#ver-sucursal-atencionPublico").text(sucursal.horarioAtencion)
		
		$("#ver-sucursal-localidad").text(sucursal.localidad.nombre +", " + sucursal.localidad.provincia.nombre)
		
		$('#ver-sucursal-mapa').gmap('clear', 'markers');
		
		var sucursalInfo = '<div id="infowindow_content"><div id="siteNotice"></div><h4 id="firstHeading" class="firstHeading">'+ sucursal.nombre+'</h4><div id="bodyContent"><p>' + sucursal.domicilio + '</p></div></div>'
	
		$('#ver-sucursal-mapa').gmap('addMarker', {'position': new google.maps.LatLng(sucursal.latitud , sucursal.longitud), 'bounds': true,icon:'assets/images/sucursal.gif'}).click(function() {
			$('#ver-sucursal-mapa').gmap('openInfoWindow', {'content': sucursalInfo}, this);
		});
		
		
		$('#ver-sucursal-mapa').gmap('option', 'center', new google.maps.LatLng(sucursal.latitud , sucursal.longitud))
		
		$("#ver-sucursal-mapa-link2,#ver-sucursal-mapa-link").click(function() {
			
			console.log("#object-mapa display sucursal")
		
			$.mobile.changePage("#object-mapa")
		
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
								 alert("no se pudo localizar su ubicacion actual ");
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

		
		sucursalesPersistenceService.getCollection(function(collection) {

			$("#ul-sucursales").empty();
			
			collection.forEach(function(sucursal) {
	
				sucursalesPersistenceService.showSucursal(sucursal);

			})
			
			$("#ul-sucursales").listview('refresh');

		})
	})
	$("#buscar-sucursales").live('pageinit',function() {
		
		var filter = sucursalesPersistenceService.getFilter();
		
		if (filter) {
			$("#buscar-sucursales-name").val(filter.searchText);
		}
		
		zonasPersistenceService.getCollection(function(collection) {
			
			console.log("buscar-sucursales-regionesOrdenables-filter " , collection.length)
			
			collection.forEach(function(zona) {
				
				$("#buscar-sucursales-regionesOrdenables-filter").append("<input id='" + zona.uri + "' type='checkbox' class='regionesOrdenables-update' /><label for='" + zona.uri + "'>" + zona.nombre +"</label>")
					
					$("#" + zona.uri).prop("zonaId", zona.id);
					
					$("#" + zona.uri).prop("checked", zona.sucursalSelected);
	
					$("#" + zona.uri).click(function(e) {
						
						var checkbox = $("#" + e.target.id);
						
						var zona = zonasPersistenceService.getById(checkbox.prop('zonaId'))
						
						zona.sucursalSelected = checkbox.prop("checked")
						
						zonasPersistenceService.update(zona);
						
					})
				});
				try{
					$("#buscar-sucursales-regionesOrdenables-filter").trigger("create");
				}
				catch(e){
				}
		
			})
	})
	
	$("#listar-cajeros").live('pageshow',function() {
		
		cajerosPersistenceService.getCollection(function(collection) {

			$("#ul-cajeros").empty();
			
			collection.forEach(function(cajero) {
	
				cajerosPersistenceService.showCajero(cajero);

			})
			
			$("#ul-cajeros").listview('refresh');

		})
	})

	
	$("#buscar-cajeros-link").click(function(e) {
		
		try {

			console.log("start filter");
			
			var filter = {}
			
			
			zonasPersistenceService.getCollection(function(collection) {
				filter.zonas = collection.filter(function(zona) {
					return zona.cajeroSelected && zona.id != -1
				}).map(function(zona) {
					return zona.id
				})
			})
			
			var currentLocation = zonasPersistenceService.getById(-1)
			
			if (currentLocation.selected) {
				filter.latitud = Preferences.get().latitude;
				filter.longitud = Preferences.get().longitude;
			
			}
			
			filter.tipoCajeros = $("#buscar-cajeros-tipoCajero-filter").val();
			filter.expendeDolares = $("#buscar-cajeros-expendeDolares").val();
			
			cajerosPersistenceService.getFilteredCollection(filter, function(collection) {
			
				$.mobile.changePage("#listar-cajeros")
				
				$("#ul-cajeros").empty();
				
				collection.forEach(function(cajero) {
		
					cajerosPersistenceService.showCajero(cajero);

				})
				
				$("#ul-cajeros").listview('refresh');

			});	
			
		}
		catch(e) {
			console.log("Error on seach", e)
		}
			
	})

	$("#cajeros-mapa").click(function() {
		
		$("#objects-mapa").trigger({type:"display-data-cajeros",title:'Cajeros'})
		
		$.mobile.changePage("#objects-mapa")
					
	})

	
	$("#objects-mapa").bind('display-data-cajeros',function(e) {
		
		console.log("object-mapa init", e.title)
		$("#back-listar").unbind("click");
		
		if (e.title) {
			$("#objects-mapa-title").text(e.title)
		}
		
		$("#back-listar").click(function(){
			$.mobile.changePage("#listar-cajeros");
		})	
		
		$('#objects-mapa-mapa').gmap('clear', 'markers');
		$('#ver-beneficio-mapa').gmap('clear' , 'overlays');
		
		cajerosPersistenceService.getCollection(function(collection) {
			collection.forEach(function(cajero) {
				
					var cajeroInfo = '<div id="infowindow_content"><div id="siteNotice"></div><h4 id="firstHeading" class="firstHeading">'+ cajero.nombre+'</h4><div id="bodyContent"><p>' + cajero.domicilio + '</p></div></div>'
					
//					$('#objects-mapa-mapa').gmap(defaultMapConfig).bind('init', function(ev, map) {
						$('#objects-mapa-mapa').gmap('addMarker', {'position': new google.maps.LatLng(cajero.latitud , cajero.longitud),bounds: false, icon:'assets/images/cajero.gif'}).click(function() {
							$('#objects-mapa-mapa').gmap('openInfoWindow', {'content': cajeroInfo}, this);
						});
//					});
				
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
			
			$('#objects-mapa-mapa').gmap('option', 'zoom', 14);
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
		
//		 + cajero.codigoCajero + " "
		$("#ver-cajero-title").html("<span class='float-left'><img class= 'imgLogoFrances'src='assets/images/logo_francesGo.png'/></span>")
		
		$("#ver-cajero-title").append("<span><h1>" + ((cajero.sucursalBanco && cajero.sucursalBanco.nombre ) ? cajero.sucursalBanco.nombre : '') + "</h1></span>")
	
		$("#ver-cajero-title").append("<span class='rigth-sucursal'>" + distance +"km"+"</span>")
		
		$("#ver-cajero-domicilio").text(cajero.domicilio)
		
		$("#ver-cajero-tipoCajero").text(cajero.tipoCajeroBanco.descripcion)

//		$("#ver-cajero-expendeDolares").text((cajero.expendeDolares)? 'Si': 'No')
				
//		$("#ver-cajero-localidad").text(cajero.localidad.nombre +", " + cajero.localidad.provincia.nombre)
		
		
		$('#ver-cajero-mapa').gmap('clear', 'markers');
		
		var cajeroInfo = '<div id="infowindow_content"><div id="siteNotice"></div><h4 id="firstHeading" class="firstHeading">'+  cajero.codigoCajero + " " + ((cajero.sucursalBanco && cajero.sucursalBanco.nombre ) ? cajero.sucursalBanco.nombre : '') +'</h4><div id="bodyContent"><p>' + cajero.domicilio + '</p></div></div>'
	
		$('#ver-cajero-mapa').gmap('addMarker', {'position': new google.maps.LatLng(cajero.latitud , cajero.longitud), 'bounds': true,icon:'assets/images/cajero.gif'}).click(function() {
			$('#ver-cajero-mapa').gmap('openInfoWindow', {'content': cajeroInfo}, this);
		});
		
		
		$('#ver-cajero-mapa').gmap('option', 'center', new google.maps.LatLng(cajero.latitud , cajero.longitud))
		
		$("#ver-cajero-mapa-link2,#ver-cajero-mapa-link").click(function() {
			
			console.log("#object-mapa display cajero")
		
			$.mobile.changePage("#object-mapa")
		
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
								 alert("no se pudo localizar su ubicacion actual ");
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
	$("#buscar-cajeros").live('pageinit',function() {

		console.log("buscar-cajeros init")

		var filter = cajerosPersistenceService.getFilter();

		tipoCajerosPersistenceService.getCollection(function(tipoCajeros) {
			tipoCajeros.forEach(function (tipoCajero) {
				$("#buscar-cajeros-tipoCajero-filter").append("<option value='" + tipoCajero.id + "'>" + tipoCajero.descripcion +"</option>")
			})
	
			$("#buscar-cajeros-tipoCajero-filter").selectmenu('refresh', true);
			
			$("#buscar-cajeros-tipoCajero-filter").trigger("create");
		})
		
		zonasPersistenceService.getCollection(function(collection) {
	
			console.log("buscar-cajeros-regionesOrdenables-filter " , collection.length)
			
			collection.forEach(function(zona) {
	
				$("#buscar-cajeros-regionesOrdenables-filter").append("<input id='" + zona.uri + "' type='checkbox' class='regionesOrdenables-update' /><label for='" + zona.uri + "'>" + zona.nombre +"</label>")
					
					$("#" + zona.uri).prop("zonaId", zona.id);
				
					$("#" + zona.uri).prop("checked", zona.cajeroSelected);
				
					$("#" + zona.uri).click(function(e) {
						
						var checkbox = $("#" + e.target.id);
						
						var zona = zonasPersistenceService.getById(checkbox.prop('zonaId'))
						
						zona.cajeroSelected = checkbox.prop("checked")
						
						zonasPersistenceService.update(zona);
						
					})
			});
			try{
				$("#buscar-cajeros-regionesOrdenables-filter").trigger("create");
			}
			catch(e){
				
			}
		})

		
	});
	

	
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
	   
	   
	});
	
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
	
	

	beneficiosPersistenceService.getCollection(function(collection) {

		$("#ul-beneficios").empty();

		collection.forEach(function(beneficio) {

			beneficiosPersistenceService.showBeneficio(beneficio);
				
		})
		
		$("#ul-beneficios").listview('refresh');

	});
}
