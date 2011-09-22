/* Created by: Mark Gerrard @ 10/10/2009 */
var LightBox = new Class({
	Implements: [Events, Options],

	options: {
		attr: 'rel',
		attrPrefix: 'lb',
		autoDetect: true,

		checkMediaSize: true,
		fixedSize: false,

		scroll: false,

		page: true,

		// Max width and height of media
		max: {
			x: 0,
			y: 0
		},

		// Center media
		center: {
			x: true,
			y: false
		},

		// Offset for positioning
		offset: {
			x: 0,
			y: 0
		},

		// Overlay opacity
		opacity: 0.6,

		// Events
		onOpen: $empty,
		onClose: $empty
	},

	initialize: function (options) {
		this.setOptions(options);

		this.gals = {active: null}; // Object containing gallery information

		if (this.options.fixedSize) {
			this.options.checkMediaSize = true;
		}

		this.media = null;
		this.isOpen = false;

		this.keyNav();

		this.prepHTML();

		this.prepElements();
	},

	keyNav: function () {
		$(window).addEvents({
			keydown: function (e) {
				if (this.isOpen) {
					if (['left', 'right', 'esc'].contains(e.key)) {
						e.stop();

						switch(e.key) {
							case 'left':
								this.prev();
							break;

							case 'right':
								this.next();
							break;

							case 'esc':
								this.close(e);
							break;
						}
					}
				}
			}.bind(this)
		}, this);

		if (this.options.scroll) {
			$(window).addEvent('scroll', function () {
				if (this.isOpen)
					this.positionLb();
			}.bind(this));
		}
	},

	prepHTML: function () {
		var o = this.options;
		this.overlay = new Element('div', {
			'class': 'lb-overlay',
			styles: {
				opacity: o.opacity,
				background: '#000',
				top: 0,
				left: 0,
				width: '100%',
				position: 'absolute',
				zIndex: 1000,
				display: 'none'
			},
			events: {
				click: this.close.bindWithEvent(this)
			}
		});

		this.cont = new Element('div', {
			'class': 'lb-cont',
			styles: {
				position: 'absolute',
				left: '50%',
				top: 0,
				zIndex: 1001,
				display: 'none'
			}
		});

		this.controls = new Element('div', {
			'class': 'controls'
		});

		$extend(this.controls, {
			prev: new Element('a', {
				text: 'Previous',
				'class': 'prev',
				href: '#',
				events: {
					click: function (e) {
						e.stop();

						this.prev();
					}.bind(this)
				}
			}),
			page: new Element('div', {
				'class': 'page'
			}),
			next: new Element('a', {
				text: 'Next',
				'class': 'next',
				href: '#',
				events: {
					click: function (e) {
						e.stop();
						this.next();
					}.bind(this)
				}
			}),
			close: new Element('a', {
				text: 'Close',
				'class': 'close',
				href: '#',
				events: {
					click: this.close.bindWithEvent(this)
				}
			})
		});

		this.title = new Element('p', {'class': 'title'});
		this.controls.adopt(this.controls.prev, this.controls.page, this.controls.next, this.controls.close);
		this.controls.inject(this.cont);

		this.mediaCont = new Element('div', {
			'class': 'lb-media',
			styles: {
				textAlign: 'center',
				overflow: 'hidden'
			}
		});
		this.mediaCont.inject(this.cont);

		this.loadingOverlay = new Element('div', {
			'class': 'lb-loading',
			styles: {
				width: '100%',
				height: '100%',
				position: 'absolute',
				top: 0,
				left: 0,
				opacity: 0.8,
				display: 'none'
			}
		});
		this.loadingOverlay.inject(this.cont, 'bottom');

		this.title.inject(this.mediaCont, 'bottom');

		this.overlay.inject($(document.body));
		this.cont.inject($(document.body));
	},

	prepElements: function () {
		var o = this.options;
		var elems = $(document.body).getElements('['+o.attr+'*='+o.attrPrefix+']'); // Get all elements
		var reg = new RegExp(o.attrPrefix+'\\[([0-9]+)\\]'); // RegExp used to test for galleries

		elems.each(function (elem) {
			var lb = {elem: elem, title: elem.get('title')};

			var attr = elem.get(o.attr);

			// Test if item belongs to gallery
			if (attr.test(reg)) {
				var gal = reg.exec(attr)[1];
				lb.gal = gal;

				if(!$defined(this.gals[lb.gal])) {
					this.gals[lb.gal] = {active: null, items: []};
				}

				lb.pos = this.gals[lb.gal].items.length;

				this.gals[lb.gal].items.include(lb);
			}

			lb.elem.addEvent('click', this.click.bindWithEvent(this, lb));
		}, this);
	},

	click: function (e, lb) {
		e.stop();
		this.loadLb(lb);
	},

	loadLb: function (lb) {
		var url;

		if ($type(lb) === 'string') {
			url = lb;
			this.controls.next.setStyle('display', 'none');
			this.controls.prev.setStyle('display', 'none');

			this.controls.page.setStyle('display', 'none');
			this.title.setStyle('display', 'none');
		} else {
			url = lb.elem.get('href');
			
			if ($defined(lb.gal)) {
				this.controls.next.setStyle('display', 'block');
				this.controls.prev.setStyle('display', 'block');

				this.gals.active = lb.gal;
				this.gals[this.gals.active].active = lb.pos;

				if (this.options.page) {
					this.controls.page.set('text', (lb.pos+1)+' of '+this.gals[lb.gal].items.length);
					this.controls.page.setStyle('display', 'block');
				}
			} else {
				this.controls.next.setStyle('display', 'none');
				this.controls.prev.setStyle('display', 'none');
			}
			this.title.set({
				styles: {display: 'block'},
				text: lb.title
			});
		}

		if (Browser.Engine.trident === true && Browser.Engine.version < 5) {
			$(document.body).getElements('select').setStyle('visibility', 'hidden');
		}

		this.loadMedia(url);
	},

	openLb: function () {
		if (!this.isOpen) {
			this.overlay.setStyles({
				display: 'block',
				width: '100%',
				height: window.getScrollSize().y
			});
			this.cont.setStyle('display', 'block');
			this.isOpen = true;

			this.fireEvent('open');
		}
	},

	close: function (e) {
		e.stop();

		if (Browser.Engine.trident === true && Browser.Engine.version < 5) {
			$(document.body).getElements('select').setStyle('visibility', 'visible');
		}

		this.overlay.setStyles({
			display: 'none'
		});
		this.cont.setStyle('display', 'none');

		this.isOpen = false;

		this.fireEvent('onClose');
	},

	next: function () {
		var aI = this.getNext();

		this.loadLb(aI);
	},

	getNext: function () {
		var aG = this.gals[this.gals.active];

		var i = aG.active+1;

		if (i >= aG.items.length) {
			i = 0;
		}

		return aG.items[i];
	},

	prev: function () {
		var aI = this.getPrev();

		this.loadLb(aI);
	},

	getPrev: function () {
		var aG = this.gals[this.gals.active];

		var i = aG.active-1;

		if (i < 0) {
			i = aG.items.length-1;
		}

		return aG.items[i];
	},

	positionLb: function (anim) {
		var o = this.options;

		if (o.checkMediaSize)
			this.checkSize(this.media);

		if (o.fixedSize) {
 			this.mediaCont.setStyles({
				width: (o.max.x) ? o.max.x : 'auto',
				height: (o.max.y > 0 ) ? o.max.y : 'auto'
			});
		}

		var size = this.cont.getSize();
		var winScroll = window.getScroll();
		var winSize = window.getSize();

		var styles = {};

		if (o.center.x)
			styles.marginLeft = -(size.x/2)+o.offset.x

		if (o.center.y)
			styles.top = ((winSize.y/2)+winScroll.y)-(size.y/2)+o.offset.y;
		else
			styles.top = winScroll.y+o.offset.y;

		if ($defined(anim) && anim) {
			var fx = new Fx.Morph(this.cont, {duration: 500});
			fx.start({top: styles.top});
			styles.top = null;
		}

		this.cont.setStyles(styles);
	},

	checkSize: function (media) {
		var o = this.options;
		var size = media.getSize();
		var max = window.getSize();

		if (o.max.x > 0) {max.x = o.max.x;}
		if (o.max.y > 0) {max.y = o.max.y;}

		if (max.x > 0 && size.x > max.x) {
			size.y = size.y/(size.x/max.x);
			size.x = max.x;
		}

		if (max.y > 0 && size.y > max.y) {
			size.x = size.x/(size.y/max.y);
			size.y = max.y;
		}

		// Vertically center
		if (o.fixedSize && o.max.y > 0 && size.y < max.y) {
			media.setStyle('margin-top', Math.floor((max.y-size.y)/2));
		}

		media.setStyles({
			width: size.x,
			height: size.y
		});
	},

	// Loads different media by checking extension
	loadMedia: function (url) {
		var ext = /\.(jpg|png|gif|tiff|jpeg)/.exec(url);

		this.loadingOverlay.setStyles({
			'display': 'block',
			width: this.cont.getSize().x,
			height: this.cont.getSize().y
		});

		if ($defined(ext)) {
			ext = ext[1];
			if (['jpg', 'png', 'gif', 'tiff', 'jpeg'].contains(ext)) {
				this.loadImage(url);
			}
		} else if (url.contains('youtube.com')) {
			this.loadYouTube(url);
		} else if (url.contains('vimeo.com')) {

		}
	},

	loadedMedia: function (media) {
		if ($defined(this.media))
			 this.media.destroy();

		$(document.body).setStyle('cursor', '');

		this.loadingOverlay.setStyle('display', 'none');

		this.media = media;
		this.media.setStyles({position: 'static', zIndex: 100, left: 0, top: 0});
		this.mediaCont.grab(this.media, 'top');

		this.openLb();
		this.positionLb();
	},

	// Handler for loading image files
	loadImage: function (url) {
		if (Browser.Engine.trident)
			url+= '?time='+new Date().getTime();
		
		var img = new Element('img', {
			src: url,
			styles: {
				position: 'absolute',
				left: -10000,
				top: -10000
			}
		});
		img.addEvent('load', this.loadedMedia.pass(img, this));

		img.inject($(document.body));
	},

	loadYouTube: function (url) {
		var id = /watch\?v=([^\&]+)/.exec(url);

		url = 'http://www.youtube.com/v/'+id[1];

		this.loadSwf(url);
	},

	loadSwf: function (url) {
		var cont = new Element('div', {
			styles: {
				position: 'absolute',
				left: -10000,
				top: -10000,
				width: 425,
				height: 344,
				margin: '0 auto'
			}
		});
		var swf = new Swiff(url, {
			width: '100%',
			height: '100%'
		});

		swf.inject(cont);
		cont.inject($(document.body));

		this.loadedMedia(cont);
	}
});