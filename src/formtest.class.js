var FormTest = new Class({
	Implements: [Events, Options],

	options: {
		lang: 'en',
		defaultVal: 'required',
		error: {
			elem: 'span',
			msgClass: 'error',
			position: 'after',
			failOnFirst: true,
			prefixLabel: false,
			markLabel: 'labelError',
			markField: 'fieldError',
			customReport: null
		},
		validateOnBlur: true
	},

	initialize: function (form, options) {
		this.form = $(form);
		
		this.fields = {};

		this.setOptions(options);

		this.form.addEvent('submit', this.validateForm.bind(this));
	},

	/**
	 * Validated the entire form
	 */
	validateForm: function (e) {
		if(!this.validateFields()) {
			e.stop();
		}
	},

	/**
	 * Validated all fields
	 */
	validateFields: function () {
		var result = [];
		var i = 0;
		
		Object.each(this.fields, function (field) {
			result[i] = this.validateField(field);
			i++;
		}, this);

		result = result.every(function (res) {return res;});
		return result;
	},

	/**
	 * Validates a field against any validators set
	 */
	validateField: function (field) {
		var result = true;

		if (field['required'] || this.getValidator(field['elem'], 'isSet').test()) {
			var loop = 'map';

			if (this.options.error.failOnFirst)
				loop = 'every';

			if (typeOf(field) === 'string') {
				field = this.fields[field];
			}

			var result = field['vals'][loop](function (val) {
				if (val.test) {
					var test = val.test();

					if (!test) {
						this.reportError(val);
					} else {
						this.clearError(val);
					}
				
					return test;
				}
				return true;
			}.bind(this));

			if (!this.options.error.failOnFirst) {
				result = result.every(function (res) {
					return res;
				});
			}
		}

		return result;
	},

	reportError: function (val) {
		var opt = this.options;
		var fieldH = this.fields[val['field'].get('name').toString()];

		var errStr = this.buildError(val);

		if (!fieldH['reported']) {
			var opt = this.options;
			var field = val['field'];
			var error = new Element(opt.error.elem, {html: errStr, 'class': opt.error.msgClass});

			// If option markField is set add class to field
			if (opt.error.markField) {
				field.addClass(opt.error.markField);
			}

			// If option markLabel is set add class to label
			if (opt.error.markLabel) {
				var label = this.getFieldLabel(field);
				if (label)
					label.addClass(opt.error.markLabel);
			}

			// Inject error
			error.inject(typeOf(field) === 'array' ? field[field.length-1] : field, opt.error.position);
			fieldH['reported'] = error;
		} else {
			// Update error message
			fieldH['reported'].set('html', errStr);
		}
	},

	clearError: function(val) {
		var opt = this.options;
		var fieldH = this.fields[val.get('field').get('name').toString()];
		var field = fieldH['elem'];
		var error = fieldH['reported'];
		if (error) {
			// Remove error message from DOM and hash
			error.destroy();
			fieldH.erase('reported');

			if (opt.error.markField) {
				field.removeClass(opt.error.markField);
			}

			if (opt.error.markLabel) {
				this.getFieldLabel(field).removeClass(opt.error.markLabel)
			}
		}
	},

	buildError: function (val) {
		var opt = this.options;
		var errLang = FormTest.lang[opt.lang];
		var errS = errLang[val.name];
		var errSN = ''; // New error string

		// Setup preFix and post fix variables, if users has set prefixLabel, the error message will be prefixed with
		// text from the fields label
		var preFix = (opt.error.prefixLabel) ? '<strong>"'+this.getFieldLabel(val.field).get('text')+'"</strong> ' : errLang.preFix;
		var postFix = errLang.postFix;

		if (Object.getLength(val.errorH) > 0) {
			var errH = val.errorH;

			errH.each(function (err, key) {
				var pReg = new RegExp('([^\{^\}]*)\{([^%]*)(%'+key+')([^}]*)\}([^\{^\}]*)');
				var parts = errS.match(pReg);

				errSN+= parts[1]+parts[2];

				if (typeOf(err) !== 'array')
					err = [].include(err);

				err.each(function (err, i) {
					if (i > 0)
						errSN+= ', ';

					switch (typeOf(err)) {
						case 'element':
							errSN+= 'elem';
						break;
						default:
							errSN+= err;
						break;
					}
				});

				errSN+= parts[4]+parts[5];
			});
		} else {
			errSN+= errS;
		}

		// Build error string with preFix and postFix
		errSN = preFix+errSN+postFix;

		return errSN;
	},

	getFieldLabel: function (field) {
		field = (typeOf(field) === 'array') ? field[0] : field;
		var label = $$('[for='+field.get('id')+']')[0];

		if (!label) {
			label = $$('.label-'+field.get('id'))[0];
		}

		return label;
	},

	addVal: function () {
		var field = arguments[0];
		var validators = arguments[1];

		// If field is undefined return
		if (!field)
			return;

		// If field is string assume its the name of the field
		if (typeOf(field) === 'string') {
			field = this.form.getElements('[name='+field+']');

			if (field.length === 1)
				field = field[0];
		}

		var fieldName = field.get('name');

		// Get existing field hash or create a new one
		var fieldHash = (this.fields[fieldName]) ? this.fields[fieldName] : {
			elem: field,
			vals: []
		};

		// If validators are undefined use default
		if (!validators)
			validators = this.options.defaultVal;

		// Make validators an array if not already
		if (typeOf(validators) !== 'array')
			validators = [].include(validators);

		// Loop through validators adding them to the field hash
		validators.each(function (val) {
			var valHash = fieldHash['vals'];
			var val = this.getValidator(field, val);
			valHash.include(val);

			fieldHash['vals'] = valHash;

			if (val['name'] === 'required') {
				fieldHash['required'] = true;
			}
		}.bind(this));

		this.fields[fieldName] = fieldHash;

		if (this.options.validateOnBlur) {
			field.addEvent('blur', this.validateField.pass(fieldHash, this));
		}
	},

	addVals: function (val) {
		val.each(function (val) {
			this.addVal(val);
		}.bind(this));
	},

	getValidator: function (field, validator) {
		var retVal = null;
		var valName = validator;
		var self = this;

		if (typeOf(validator) === 'object') {
			valName = validator.name;
		}

		var vals = {
			'isSet': {
				test: function() {
					if (typeOf(field) === 'array') {
						return field.some(function(field){return field.get('checked')});
					} else {
						return field.get('value').length > 0;
					}
				}
			},
			'required': {
				test: function () {
					return vals['isSet'].test();
				}
			},
			'requires': {
				test: function () {
					var result = true;

					if (typeOf(validator.require) !== 'array') {
						validator.require = [].include(validator.require);
					}

					result = validator.require.every(function (require) {
						return self.validateField(require);
					});

					if (!result) {
						this.errorH.set('require', validator.require);
					}

					return result;
				}
			},
			'length': {
				test: function () {
					this.errorH.empty();

					var result = true;

					var fieldLen = field.get('value').length;

					if (validator.max && fieldLen > validator.max) {
						result = false;
						this.errorH.set('max', validator.max);
					}

					if (validator.min && fieldLen < validator.min) {
						result = false;
						this.errorH.set('min', validator.min);
					}

					return result;
				}
			},
			'isEmail': {
				test: function() {
					return field.get('value').test(/^([a-zA-Z0-9\+_\-]+)(\.[a-zA-Z0-9\+_\-]+)*@([a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,6}$/);
				}
			},
			'isUrl': {
				test: function() {
					return field.get('value').test(/^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/);
				}
			},
			'isAlphaNum': {
				test: function () {
					return field.get('value').test(/^[a-zA-Z0-9]+$/);
				}
			},
			'isNumber': {
				test: function() {
					return field.get('value').test(/^\-?[0-9]+(\.[0-9]+)?$/);
				}
			},
			'isInt': {
				test: function() {
					return field.get('value').test(/^[0-9]+$/);
				}
			},
			'isFloat': {
				test: function() {
					return field.get('value').test(/^[0-9]+\.[0-9]+$/);
				}
			},
			'isValue': {
				test: function () {
					var result = true;

					var fieldValue = field.get('value');

					if (typeOf(validator.value) !== 'array') {
						validator.value = [].include(validator.value);
					}

					result = validator.value.some(function (value) {
						return value.toString() === fieldValue;
					});

					if (!result) {
						this.errorH.set('0', validator.value);
					}

					return result;
				}
			},
			'match': {
				test: function () {
					var result = true;

					if (typeOf(validator.match) !== 'array') {}

					return result;
				}
			},
			'isDate': {
				test: function () {
					var result = true;

					result = field.get('value').test(/^([0-3]?[0-9])([\.\/])([0|1]?[0-9])([\.\/])([19|20]{2}[\d]{2})$/);

					return result;
				}
			},
			'isExt': {
				test: function () {
					var result = true;

					var fieldValue = field.get('value');

					var isExt = null;
					var notExt = null;

					if (validator.is && FormTest.extensions[validator.is]) {
						isExt = FormTest.extensions[validator.is];

						result = isExt.some(function (ext) {
							var regexp = new RegExp('\.'+ext+'$');
							return fieldValue.test(regexp);
						});
					}

					if (validator.not && FormTest.extension[validator.not]) {
						notExt = FormTest.extensions[validator.not];

						result = notExt.some(function (ext) {
							var regexp = new RegExp('\.'+ext+'$');
							return !fieldValue.test(regexp);
						});
					}

					return result;
				}
			}
		};

		if (vals[valName]) {
			retVal = Object.merge({
				name: valName,
				field: field,
				errorH: {}
			}, vals[valName]);

			return retVal;
		} else {
			return null;
		}
	}
});


FormTest.extensions = {
	'image': ['png', 'jpg', 'jpeg', 'tiff', 'gif'],
	'doc': ['doc', 'txt', 'pdf']
};


FormTest.lang = {
	'en': {
		'preFix': 'This field ',
		'postFix': '!',
		'required': 'is required',
		'match': 'must match <strong>{%match}</strong>',
		'diff': 'must <strong>NOT</strong> match <strong>{%diff}</strong>',
		'length': '{must be <strong>at least %min</strong> characters long}{must be <strong>no more than %max</strong> characters long}',
		'requires': 'requires <strong>{%requires}</strong>{ to be %1 just}',
		'isEmail': 'is <strong>NOT</strong> a valid email address',
		'isUrl': 'requires a valid URL',
		'isAlphaNum': 'must contain only alphanumeric characters',
		'isNumber': 'is not a valid number',
		'isInt': 'is not a valid integer',
		'isFloat': 'is not a valid float',
		'isValue': 'must be <strong>{%0}</strong>',
		'isExt': 'this file is not an accepted format',
		'isDate': 'must be a valid date ie DD/MM/YYYY'
	}
};