﻿//=============================================================================

var EU_PTR_SIZE				= 4;
var EU_INT_SIZE				= 4;
var EU_DWORD_SIZE			= 4;
var EU_BOOL_SIZE			= 4;

var EU_TRUE 				= 1;
var EU_FALSE 				= 0;

//=============================================================================

var XMLHTTPProxyService = "";
var XMLHTTPDirectAccess = false;
var XMLHTTPDirectAccessAddresses = [];

//=============================================================================

function EUSignCPException(errorCode, message, messageEx) {
	this.errorCode = errorCode;
	this.message = message;
	this.messageEx = messageEx || '';
	
	this.toString = function() {
		return this.message + "(" + errorCode + ")";
	};
	
	this.GetErrorCode = function() {
		return this.errorCode;
	};
	
	this.GetMessage = function() {
		return this.message;
	};
	
	this.toStringEx = function() {
		return this.toString() + 
			((this.messageEx != '') ? 
				". " + this.messageEx : '');
	};
	
	this.GetMessageEx = function() {
		return this.messageEx;
	};
}

//=============================================================================

function EUPointerConstructor(size, isArray, moduleFreeFunc, context) {
	this.ptr = Module._malloc(size);
	Module.setValue(this.ptr, 0);

	this.isArray = isArray;
	if (isArray) {
		this.lengthPtr = Module._malloc(EU_PTR_SIZE);
		Module.setValue(this.lengthPtr, 0);
	} else {
		this.lengthPtr = 0;
	}

	this.moduleFreeFunc = moduleFreeFunc;
	this.context = context;

	this.toPtr = function() {
		var pPtr = 0;
		try {
			pPtr = Module.getValue(this.ptr, "i8*");
		} catch(e) {
			this.raiseError(e);
		}

		this.free();

		return pPtr;
	};
	this.toNumber = function() {
		var number = null;
		try {
			number = Module.getValue(this.ptr, "i32");
		} catch(e) {
			this.raiseError(e);
		}

		this.free();

		return number;
	};
	this.toBoolean = function() {
		return (this.toNumber() != EU_FALSE);
	};
	this.toString = function(checkEmpty, encoder) {
		var string = null;
		try {
			var strPtr = this.toPtr();
			if (strPtr | 0) {
				string = encoder ? 
						encoder.decodePointer(strPtr) : 
						CP1251PointerToUTF8(strPtr);
				if (context != null)
					Module._EUCtxFreeMemory(context|0, strPtr);
				else
					Module._EUFreeMemory(strPtr);
			}
			
			if (checkEmpty) {
				if (string == "")
					throw "Decoded string is empty";
			}
		} catch(e) {
			this.raiseError(e);
		}

		this.free();

		return string;
	};
	this.toStringArray = function(encoder) {
		var strings = null;
		try {
			var strPtr = this.toPtr();
			if (strPtr | 0) {
				strings = [];
				while (1) {
					var str = encoder ? 
						encoder.decodePointer(strPtr) : 
						CP1251PointerToUTF8(strPtr);
					strings.push(str);
					while (HEAPU8[(strPtr|0)] != 0)
						strPtr += 1;

					if (HEAPU8[((strPtr + 1)|0)] == 0)
						break;

					strPtr = ((strPtr + 1)|0);
				}

				if (context != null)
					Module._EUCtxFreeMemory(context|0, strPtr);
				else
					Module._EUFreeMemory(strPtr);
			}
		} catch(e) {
			this.raiseError(e);
		}

		this.free();

		return strings;
	};
	this.toArray = function() {
		var array = null;
		try {
			var arrPtr = Module.getValue(this.ptr, "i8*");
			var arrLength = Module.getValue(this.lengthPtr, "i32");
			var arrBuffer = new ArrayBuffer(arrLength);

			array = new Uint8Array(arrBuffer);
			array.set(new Uint8Array(Module.HEAPU8.buffer, arrPtr, arrLength));

			if (context != null)
				Module._EUCtxFreeMemory(context|0, arrPtr|0);
			else
				Module._EUFreeMemory(arrPtr|0);
		} catch(e) {
			this.raiseError(e);
		}

		this.free();

		return array;
	};
	this.toArrayOfByteArrays = function(count) {
		if (count == 0)
			return [];
		
		var array = [];
		try {
			var arraysPtr = Module.getValue(this.ptr, "i32*");
			var arraysLengthsPtr = Module.getValue(this.lengthPtr, "i32");
			
			for (var i = 0; i < count; i++) {
				var pCurPtr = (arraysPtr + i * EU_PTR_SIZE) | 0;
				var arrPtr = Module.getValue(pCurPtr, "i8*");
				var arrLength = Module.getValue(
					arraysLengthsPtr + i * EU_INT_SIZE, "i32*");

				var arrBuffer = new ArrayBuffer(arrLength);

				var tmpArr = new Uint8Array(arrBuffer);
				tmpArr.set(new Uint8Array(Module.HEAPU8.buffer, arrPtr, arrLength));
				array.push(tmpArr);
			}

			Module._EUFreeCertificatesArray(
				count, arraysPtr, arraysLengthsPtr);
		} catch(e) {
			this.raiseError(e);
		}

		this.free();

		return array;
	};
	this.free = function() {
		try {
			if (this.moduleFreeFunc != null)
				this.moduleFreeFunc(this);

			if (this.ptr != 0)
				Module._free(this.ptr);
			if (this.lengthPtr != 0)
				Module._free(this.lengthPtr);
		} catch (e) {}

		this.ptr = 0;
		this.lengthPtr = 0;
		this.moduleFreeFunc = null;
	};
	this.raiseError = function(msg) {
		var error = EU_ERROR_JS_LIBRARY_ERROR;
		var message = EU_ERRORS_STRINGS[Module.errorLangCode][error];

		this.free();

		throw new EUSignCPException(error, message, msg);
	};
}

function EUPointer(context) {
	if (context === undefined)
		context = null;

	return new EUPointerConstructor(EU_PTR_SIZE, false, null, context);
}

function EUPointerBool() {
	return new EUPointerConstructor(EU_BOOL_SIZE, false, null, null);
}

function EUPointerInt() {
	return new EUPointerConstructor(EU_INT_SIZE, false, null, null);
}

function EUPointerDWORD() {
	return new EUPointerConstructor(EU_DWORD_SIZE, false, null, null);
}

function EUPointerArray(context) {
	if (context === undefined)
		context = null;

	return new EUPointerConstructor(EU_PTR_SIZE, true, null, context);
}

function EUPointerStaticArray(array) {
	var arrayLength = array.length;
	var pPtr = new EUPointerConstructor(
		arrayLength, false, null, null);

	try {
		Module.writeArrayToMemory(array, pPtr.ptr | 0);
		pPtr.toArray = function() {
			var array = null;
			try {
				var arrBuffer = new ArrayBuffer(arrayLength);
				array = new Uint8Array(arrBuffer);
				array.set(new Uint8Array(Module.HEAPU8.buffer, this.ptr, arrayLength));
			} catch (e) {
			}

			this.free();

			return array;
		};
	} catch (e) {
		pPtr.raiseError(e);
		return null;
	}

	return pPtr;
}

function EUPointerCertOwnerInfo(context) {
	if (context === undefined)
		context = null;

	return new EUPointerConstructor(
			EU_CERT_OWNER_INFO_SIZE, false, 
			function (pPtr) {
				if ((pPtr.ptr | 0) != 0)
				{
					if (context != null)
					{
						Module._EUCtxFreeCertOwnerInfo(
							context | 0, pPtr.ptr);
					}
					else
						Module._EUFreeCertOwnerInfo(pPtr.ptr);
				}
			}, 
			context);
}

function EUPointerSignerInfo(context) {
	if (context === undefined)
		context = null;

	return new EUPointerConstructor(
			EU_SIGN_INFO_SIZE, false, 
			function (pPtr) {
				if ((pPtr.ptr | 0) != 0)
				{
					if (context != null)
					{
						Module._EUCtxFreeSignInfo(
							context | 0, pPtr.ptr);
					}
					else
						Module._EUFreeSignInfo(pPtr.ptr);
				}
			},
			context);
}

function EUPointerSenderInfo(context) {
	if (context === undefined)
		context = null;

	return new EUPointerConstructor(
			EU_SENDER_INFO_SIZE, false, 
			function (pPtr) {
				if ((pPtr.ptr | 0) != 0)
				{
					if (context != null)
					{
						Module._EUCtxFreeSenderInfo(
							context | 0, pPtr.ptr);
					}
					else
						Module._EUFreeSenderInfo(pPtr.ptr);
				}
			}, 
			context);
}

function EUPointerCertificateInfo() {
	return new EUPointerConstructor(
			EU_CERT_INFO_SIZE, false, 
			function (pPtr) {
				if ((pPtr.ptr | 0) != 0)
					Module._EUFreeCertificateInfo(pPtr.ptr);
			},
			null);
}

function EUPointerKeyMedia(typeIndex, devIndex, password) {
	var pPtr = new EUPointerConstructor(
			EU_KEY_MEDIA_SIZE, false, null, null);

	try {
		var pCurPtr = pPtr.ptr | 0;
		
		Module.setValue(pCurPtr, typeIndex | 0, "i32");
		pCurPtr+= EU_INT_SIZE;
		Module.setValue(pCurPtr, devIndex | 0, "i32");
		pCurPtr+= EU_INT_SIZE;
		
		var strArr = UTF8ToCP1251Array(password);
		if (strArr.length > EU_PASS_MAX_LENGTH)
			throw { message: "Invalid parameter"};
		Module.writeArrayToMemory(strArr, pCurPtr);
	} catch (e) {
		pPtr.raiseError(e);
		return null;
	}

	return pPtr;
}

function EUPointerEndUserInfo(euInfo) {
	var pPtr = new EUPointerConstructor(
			EU_USER_INFO_SIZE, false, null, null);

	try {
		var pCurPtr = pPtr.ptr | 0;

		var SetString = function(str, strMaxLength) {
			var strArr = UTF8ToCP1251Array(str);
			if (strArr.length > strMaxLength) {
				throw { message: "Invalid parameter"};
			}

			Module.writeArrayToMemory(strArr, pCurPtr);
			pCurPtr += strMaxLength;
		};

		Module.setValue(pCurPtr, euInfo.GetVersion() | 0, "i32");
		pCurPtr += EU_INT_SIZE;

		SetString(euInfo.GetCommonName(), EU_COMMON_NAME_MAX_LENGTH);
		SetString(euInfo.GetLocality(), EU_LOCALITY_MAX_LENGTH);
		SetString(euInfo.GetState(), EU_STATE_MAX_LENGTH);
		SetString(euInfo.GetOrganization(), EU_ORGANIZATION_MAX_LENGTH);
		SetString(euInfo.GetOrgUnit(), EU_ORG_UNIT_MAX_LENGTH);
		SetString(euInfo.GetTitle(), EU_TITLE_MAX_LENGTH);
		SetString(euInfo.GetStreet(), EU_STREET_MAX_LENGTH);
		SetString(euInfo.GetPhone(), EU_PHONE_MAX_LENGTH);
		SetString(euInfo.GetSurname(), EU_SURNAME_MAX_LENGTH);
		SetString(euInfo.GetGivenname(), EU_GIVENNAME_MAX_LENGTH);
		SetString(euInfo.GetEMail(), EU_EMAIL_MAX_LENGTH);
		SetString(euInfo.GetDNS(), EU_ADDRESS_MAX_LENGTH);
		SetString(euInfo.GetEDRPOUCode(), EU_EDRPOU_MAX_LENGTH);
		SetString(euInfo.GetDRFOCode(), EU_DRFO_MAX_LENGTH);
		SetString(euInfo.GetNBUCode(), EU_NBU_MAX_LENGTH);
		SetString(euInfo.GetSPFMCode(), EU_SPFM_MAX_LENGTH);
		SetString(euInfo.GetOCode(), EU_O_CODE_MAX_LENGTH);
		SetString(euInfo.GetOUCode(), EU_OU_CODE_MAX_LENGTH);
		SetString(euInfo.GetUserCode(), EU_USER_CODE_MAX_LENGTH);
		SetString(euInfo.GetUPN(), EU_UPN_MAX_LENGTH);
		SetString(euInfo.GetUNZR(), EU_UNZR_MAX_LENGTH);
		SetString(euInfo.GetCountry(), EU_COUNTRY_MAX_LENGTH);
	} catch (e) {
		pPtr.raiseError(e);
		return null;
	}

	return pPtr;
}

function EUPointerMemory(size) {
	return new EUPointerConstructor(
			size, false, null, null);
}

function EUArrayFromArrayOfArray(array) {
	this.count = array.length;
	this.arraysPtr = 0;
	this.arraysLengthPtr = 0;

	try {
		this.arraysPtr = Module._malloc(EU_PTR_SIZE * array.length);
		this.arraysLengthPtr = Module._malloc(EU_INT_SIZE * array.length);

		for (var i = 0; i < array.length; i++) {
			Module.setValue((this.arraysPtr + i * EU_PTR_SIZE) | 0, 0);
		}

		for (var i = 0; i < array.length; i++) {
			var pCurPtr = (this.arraysPtr + i * EU_PTR_SIZE) | 0;

			var buffer = _malloc(array[i].length);
			Module.writeArrayToMemory(array[i], buffer);

			setValue(pCurPtr, buffer, "i32*");
			setValue(this.arraysLengthPtr + i * EU_INT_SIZE,
				array[i].length, "i32");
		}
	} catch (e) {
		this.free();
	}

	this.free = function() {
		if (this.arraysPtr == 0)
			return;

		try {
			for (var i = 0; i < this.count; i++) {
				var pCurPtr = Module.getValue(
					(this.arraysPtr + i * EU_PTR_SIZE) | 0, "i32*");
				if (pCurPtr != 0)
					Module._free(pCurPtr);
			}

			Module._free(this.arraysPtr);
			Module._free(this.arraysLengthPtr);
		} catch (e) {}
		
		this.count = 0;
		this.arraysPtr = 0;
		this.arraysLengthPtr = 0;
	};
}

function EUPointerIntArray(array) {
	var pPtr = new EUPointerConstructor(
			EU_INT_SIZE * array.length, false, null, null);

	try {
		var pCurPtr = pPtr.ptr | 0;
		
		for (var i = 0; i < array.length; i++) {
			Module.setValue(pCurPtr, array[i] | 0, "i32");
			pCurPtr+= EU_INT_SIZE;
		}
	} catch (e) {
		pPtr.raiseError(e);
		return null;
	}

	return pPtr;
}

function EUPointerSystemtime(date) {
	var pPtr = new EUPointerConstructor(
			EU_SYSTEMTIME_SIZE, false, null, null);

	try {
		DateToSystemTime(date, pPtr.ptr | 0);
	} catch (e) {
		pPtr.raiseError(e);
		return null;
	}

	return pPtr;
}

function IntFromBool(boolValue) {
	return (boolValue == true) ? 1 : 0;
}

function ParseServersArray(serversArray) {
	var servers = {
		addresses: [],
		ports:[]
	};

	var length = serversArray.length;
	for (var i = 0; i < length; i++) {
		var res = serversArray[i].split(":");
		if (res.length == 2) {
			servers.addresses.push(res[0]);
			servers.ports.push(res[1]);
		} else {
			servers.addresses.push(serversArray[i]);
			servers.ports.push("80");
		}
	}

	return servers;
}

function IsFileSyncSupported() {
	try {
		return (!!FileReaderSync);
	}
	catch (e) {
		return false;
	}
}

function IsFileASyncSupported() {
	try {
		return (!!FileReader);
	}
	catch (e) {
		return false;
	}
}

function MakeUID(length)
{
	var uid = "";
	var uid_chars = 
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (var i=0; i < length; i++ ) {
		uid += uid_chars.charAt(Math.floor(
			Math.random() * uid_chars.length));
	}

	return uid;
}

//=============================================================================

var EU_MODULE_INITIALIZE_ON_LOAD = 
	((typeof EU_MODULE_INITIALIZE_ON_LOAD) != 'undefined') ? 
		EU_MODULE_INITIALIZE_ON_LOAD : true;

//-----------------------------------------------------------------------------

function EUSignCPModuleInitialize() {
	Module.setStatus.last = null;
	Module['setStatus']('(ініціалізація...)');
	setTimeout(function() {
		var isInitialized = false;
		try {
			var error = Module._EUInitialize();
			if (error != EU_ERROR_NONE)
				Module.setStatus('(не ініціалізовано)');
			else {
				Module.setStatus('(ініціалізовано)');
				isInitialized = true;
			}
		} catch(e) {
			Module.setStatus('(не ініціалізовано)');
		}
		
		try {
			if (typeof(EUSignCPModuleInitialized) == "function")
				EUSignCPModuleInitialized(isInitialized);
		} catch (e) {
		}
	}, 100);
}

//-----------------------------------------------------------------------------

/* These constants are specified by compiler and cannot be changed */
var EU_LIBRARY_SERVICE_MEMORY_MB = 1;
var EU_MEMORY_GROWING_STEP_MB = 16;
var EU_MAX_LIBRARY_STACK_MB = EU_MEMORY_GROWING_STEP_MB * 8;
var EU_TOTAL_MEMORY_MB = EU_MAX_LIBRARY_STACK_MB + EU_MAX_DATA_SIZE_MB * 8;
if (EU_MAX_DATA_SIZE_MB > (EU_MAX_LIBRARY_STACK_MB - 
		EU_LIBRARY_SERVICE_MEMORY_MB)) {
	throw 'The EU_MAX_DATA_SIZE_MB (' + EU_MAX_DATA_SIZE_MB + 
		' MB) constant is too big. Please set it less then ' + 
		(EU_MAX_LIBRARY_STACK_MB - EU_LIBRARY_SERVICE_MEMORY_MB)+ ' MB';
}

if (EU_TOTAL_MEMORY_MB < EU_MAX_LIBRARY_STACK_MB)
	EU_TOTAL_MEMORY_MB = EU_MAX_LIBRARY_STACK_MB + EU_MEMORY_GROWING_STEP_MB;
if ((EU_TOTAL_MEMORY_MB % EU_MEMORY_GROWING_STEP_MB) != 0) {
	EU_TOTAL_MEMORY_MB = Math.ceil(EU_TOTAL_MEMORY_MB / 
		EU_MEMORY_GROWING_STEP_MB) * EU_MEMORY_GROWING_STEP_MB;
}

//-----------------------------------------------------------------------------

var Module = {
	preRun: [],
	postRun: [
		function() {
			setTimeout(function() {
				try {
					if (typeof(EUSignCPModuleLoaded) == "function")
						EUSignCPModuleLoaded();
						
					if (EU_MODULE_INITIALIZE_ON_LOAD)
						EUSignCPModuleInitialize();
				} catch (e) {
				}
			}, 100);
		}
	],
	print: (function() {
		return function(text) {
			if (typeof EU_LOG_EVENTS != 'undefined' && 
					EU_LOG_EVENTS) {
				console.log(text);
			}
		};
	})(),
	printErr: function(text) {
		if (typeof EU_LOG_EVENTS != 'undefined' &&
			EU_LOG_EVENTS) {
			if (console.error)
				console.error(text);
			else
				console.log(text);
		}
	},
	setStatus: function(text) {
		if (text == '')
			return;

		try {
			if (!Module.setStatus.last) 
				Module.setStatus.last = { time: Date.now(), text: '' };

			if (text === Module.setStatus.text)
				return;

			var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
			var now = Date.now();
			if (m && now - Date.now() < 30)
				return; 

			var statusElement = document.getElementById('status');
			var progressElement = document.getElementById('progress');
			if (!statusElement || !progressElement)
				return;

			if (m) {
				text = m[1];
				progressElement.value = parseInt(m[2])*100;
				progressElement.max = parseInt(m[4])*100;
				progressElement.hidden = false;
				statusElement.hidden = false;
			} else {
				progressElement.value = 0;
				progressElement.max = 100;
				progressElement.hidden = true;
			}

			statusElement.innerHTML = text;
		} catch(e) {}
	},
	totalDependencies: 0,
	monitorRunDependencies: function(left) {
		this.totalDependencies = Math.max(this.totalDependencies, left);
		Module.setStatus(left ? 
			'Підготовка... (' + (this.totalDependencies-left) + 
				'/' + this.totalDependencies + ')' :
			'Всі завантаження завершено.');
	},
	errorLangCode: EU_DEFAULT_LANG,
	MAX_DATA_SIZE: EU_MAX_DATA_SIZE_MB * EU_ONE_MB,
	TOTAL_MEMORY: EU_TOTAL_MEMORY_MB * EU_ONE_MB
};

//=============================================================================

var EUSignCP = NewClass({
	"Vendor": "JSC IIT",
	"ClassVersion": "1.3.70",
	"ClassName": "EUSignCP",
	"BaseLibraryVersion": "1.3.1.168",
	"errorLangCode": EU_DEFAULT_LANG,
	"privKeyOwnerInfo": null,
	"isFileSyncAPISupported": false,
	"isFileASyncAPISupported": false,
	"stringEncoder": new StringEncoder("UTF-8", false),
	"fieldsEncoder": new LibraryStringEncoder(1251)
},
function() {
},
{
//-----------------------------------------------------------------------------
	_GetFileSignTimeInfoSync: function(signIndex, signedFile) {
		if (!EUFS.link(signedFile)) {
			this.RaiseError(EU_ERROR_JS_READ_FILE);
		}

		var pTimeInfoPtr = EUPointer();
		var error;

		try {
			error = Module.ccall('EUGetFileSignTimeInfo',
				'number',
				['number', 'array', 'number'],
				[signIndex, 
					UTF8ToCP1251Array(EUFS.getFilePath(signedFile)),
					pTimeInfoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pTimeInfoPtr.free();
			EUFS.unlink(signedFile);

			this.RaiseError(error);
		}

		EUFS.unlink(signedFile);

		var timeInfoPtr, timeInfo;

		timeInfoPtr = pTimeInfoPtr.toPtr();
		timeInfo = new EndUserTimeInfo(timeInfoPtr);
		Module._EUFreeTimeInfo(timeInfoPtr);

		return timeInfo;
	},
//-----------------------------------------------------------------------------
	GetErrorDescription: function(errorCode, langCode) {
		try {
			if ((errorCode & EU_ERROR_JS_ERRORS) == EU_ERROR_JS_ERRORS){
				if (arguments.length == 2) {
					return EU_ERRORS_STRINGS[langCode][errorCode];
				} else {
					return EU_ERRORS_STRINGS[this.errorLangCode][errorCode];
				}
			}

			var strPtr = 0;

			if (arguments.length == 2) {
				strPtr = Module._EUGetErrorLangDesc(
					errorCode, langCode);
			} else {
				strPtr = Module._EUGetErrorLangDesc(
					errorCode, this.errorLangCode);
			}

			return CP1251PointerToUTF8(strPtr);
		} catch (e) {
			return null;
		}
	},
	MakeError: function(errorCode) {
		var errorMsg = this.GetErrorDescription(errorCode);
		if (errorMsg == null)
			errorMsg = '';

		return new EUSignCPException(errorCode, errorMsg, '');
	},
	RaiseError: function(errorCode) {
		throw this.MakeError(errorCode);
	},
//-----------------------------------------------------------------------------
	GetVersion: function() {
		return this.ClassVersion + '(' + this.BaseLibraryVersion + ')';
	},
//-----------------------------------------------------------------------------
	Initialize: function() {
		var error;

		try {
			this.isFileSyncAPISupported =
				IsFileSyncSupported() & EUFS.staticInit();
			this.isFileASyncAPISupported = IsFileASyncSupported();

			error = Module._EUInitialize();
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE)
			this.RaiseError(error);

		return EU_ERROR_NONE;
	},
	Finalize: function() {
		var error;

		try {
			Module._EUFinalize();
			error = EU_ERROR_NONE;
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		this.privKeyOwnerInfo = null;

		if (error != EU_ERROR_NONE)
			this.RaiseError(error);

		return EU_ERROR_NONE;
	},
	IsInitialized: function() {
		var isInitialized;
		
		try {
			isInitialized = 
				(Module._EUIsInitialized() != EU_FALSE);
		} catch (e) {
			isInitialized = false;
		}
		
		return isInitialized;
	},
	SetErrorMessageLanguage: function(langCode) {
		if (typeof langCode == 'string') {
			langCode = langCode.toLocaleLowerCase();
			switch (langCode) {
				case 'en':
					langCode = EU_EN_LANG;
					break;
				case 'ru':
					langCode = EU_RU_LANG;
					break;
					
				case 'uk':
				case 'ua':
				default:
					langCode = EU_UA_LANG;
					break;
			}
		}
		this.errorLangCode = langCode;
		Module.errorLanguage = langCode;
	},
	GetErrorDesc: function (errorCode, langCode) {
		var errorDesc = this.GetErrorDescription(errorCode, langCode);

		if (errorDesc == null)
			this.RaiseError(EU_ERROR_JS_LIBRARY_LOAD);

		return errorDesc;
	},
//-----------------------------------------------------------------------------
	CheckMaxDataSize: function(data) {
		var length = (typeof data == 'number') ? 
			data : data.length;
		if (length > Module.MAX_DATA_SIZE)
			this.RaiseError(EU_ERROR_BAD_PARAMETER);
	},
	Base64Encode: function(data) {
		this.CheckMaxDataSize(data);

		var strPtr = EUPointer();
		var error;

		try {
			error = Module.ccall('EUBASE64Encode',
				'number',
				['array', 'number', 'number'],
				[data, data.length, strPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			strPtr.free();
			this.RaiseError(error);
		}
		
		return strPtr.toString();
	}, 
	Base64Decode: function(data) {
		this.CheckMaxDataSize(data);

		var arrPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUBASE64Decode',
				'number',
				['array', 'number', 'number'],
				[StringToCString(data),
					arrPtr.ptr, arrPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			arrPtr.free();
			this.RaiseError(error);
		}
		
		return arrPtr.toArray();
	},
	SetJavaStringCompliant: function(compliant) {
		this.stringEncoder = new StringEncoder(
			this.stringEncoder.charset,
			compliant);
	},
	SetCharset: function(charset) {
		try {
			var encoder = new StringEncoder(
				charset,
				this.stringEncoder.javaCompliant);
			this.stringEncoder = encoder;
		} catch (e) {
			this.RaiseError(EU_ERROR_BAD_PARAMETER);
		}
	},
	GetCharset: function() {
		if (this.stringEncoder == null)
			this.RaiseError(EU_ERROR_BAD_PARAMETER);

		return this.stringEncoder.charset;
	},
	StringToArray: function(data) {
		try {
			return this.stringEncoder.encode(data);
		} catch (e) {
			this.RaiseError(EU_ERROR_BAD_PARAMETER);
		}
	},
	ArrayToString: function(data) {
		try {
			return this.stringEncoder.decode(data);
		} catch (e) {
			this.RaiseError(EU_ERROR_BAD_PARAMETER);
		}
	},
	ReadFile: function(file, onSuccess, onError) {
		var useASyncAPI = (arguments.length == 3);

		if (file == null) {
			if (useASyncAPI) {
				onError(this.MakeError(EU_ERROR_BAD_PARAMETER));
				return;
			}

			this.RaiseError(EU_ERROR_BAD_PARAMETER);
			return;
		}

		if (!this.isFileSyncAPISupported && 
			!this.isFileASyncAPISupported) {
			if (useASyncAPI) {
				onError(this.MakeError(EU_ERROR_NOT_SUPPORTED));
				return;
			}

			this.RaiseError(EU_ERROR_NOT_SUPPORTED);
			return;
		}

		if (useASyncAPI) {
			var pThis = this;
			var _onSuccess = function(evt) {
				if (evt.target.readyState != FileReader.DONE)
					return;

				try {
					var loadedFile = new EndUserFile();

					loadedFile.SetTransferableObject({
						'file': file,
						'data': new Uint8Array(evt.target.result)
					});

					onSuccess(loadedFile);
				} catch (e) {
					onError(pThis.MakeError(EU_ERROR_JS_READ_FILE));
				}
			};

			var _onError = function(e) {
				onError(pThis.MakeError(EU_ERROR_JS_READ_FILE));
			};

			var fileReader = new FileReader();
			fileReader.onloadend = _onSuccess;
			fileReader.onerror = _onError;
			fileReader.readAsArrayBuffer(file);
			return;
		}

		try {
			var fileReader = new FileReaderSync();
			var fileData = fileReader.readAsArrayBuffer(file);
			var loadedFile = new EndUserFile();

			loadedFile.SetTransferableObject({
				'file': file, 'data': new Uint8Array(fileData)
			});

			return loadedFile;
		} catch (e) {
			this.RaiseError(EU_ERROR_JS_READ_FILE);
		}
	},
	ReadFiles: function (files, onSuccess, onError) {
		var useASyncAPI = (arguments.length == 3);

		if (files.length <= 0) {
			if (useASyncAPI) {
				onError(this.MakeError(EU_ERROR_BAD_PARAMETER));
				return;
			}
			
			this.RaiseError(EU_ERROR_BAD_PARAMETER);
			return;
		}

		if (useASyncAPI) {
			var curIndex = 0;
			var processedFiles = [];

			var pThis = this;
			var _onSuccess = function(readedFile) {
				processedFiles.push(readedFile);
				curIndex++;
				
				if (curIndex < files.length) {
					pThis.ReadFile(files[curIndex], _onSuccess, onError);
					return;
				}

				onSuccess(processedFiles);
			};

			pThis.ReadFile(files[curIndex], _onSuccess, onError);
			return;
		}
		
		var processedFiles = [];
		for (var i = 0; i < files.length; i++) {
			processedFiles.push(this.ReadFile(files[i]));
		}

		return processedFiles;
	},
	LoadDataFromServer: function(path, onSuccess, onError, asByteArray) {
		var pThis = this;
		try {
			var httpRequest;
			var url;

			if (XMLHttpRequest)
				httpRequest = new XMLHttpRequest();
			else
				httpRequest = new ActiveXObject("Microsoft.XMLHTTP");

			httpRequest.onload = function() {
				if (httpRequest.readyState != 4)
					return;

				if (httpRequest.status == 200) {
					if (asByteArray) {
						onSuccess(new Uint8Array(this.response));
					} else {
						onSuccess(httpRequest.responseText);
					}
				}
				else {
					onError(pThis.MakeError(EU_ERROR_DOWNLOAD_FILE));
				}
			};

			httpRequest.onerror = function() {
				onError(pThis.MakeError(EU_ERROR_DOWNLOAD_FILE));
			};

			if (path.indexOf('http://') != 0 && 
					path.indexOf('https://') != 0 &&
					path.indexOf('/') == 0) {
				if (!location.origin) {
					location.origin = location.protocol + 
						"//" + location.hostname + 
						(location.port ? ':' + location.port: '');
				}

				url = location.origin + path;
			} else {
				url = path;
			}

			httpRequest.open("GET", url, true);
			if (asByteArray)
				httpRequest.responseType = 'arraybuffer';
			httpRequest.send();
		} catch (e) {
			onError(pThis.MakeError(EU_ERROR_DOWNLOAD_FILE));
		}
	},
//-----------------------------------------------------------------------------
	DoesNeedSetSettings: function() {
		try {
			return (Module._EUDoesNeedSetSettings() != EU_FALSE);
		} catch (e) {
			this.RaiseError(EU_ERROR_UNKNOWN);
		}
	},
	SetXMLHTTPProxyService: function(proxyServicePath) {
		XMLHTTPProxyService = proxyServicePath;
	},
	SetXMLHTTPDirectAccess: function(directAccess) {
		XMLHTTPDirectAccess = directAccess;
	},
	AddXMLHTTPDirectAccessAddress: function(address) {
		XMLHTTPDirectAccessAddresses.push(address);
	},
	InitializeMandatorySettings: function() {
		var fs = this.CreateFileStoreSettings();
		this.SetFileStoreSettings(fs);

		var proxy = this.CreateProxySettings();
		this.SetProxySettings(proxy);

		var tsp = this.CreateTSPSettings();
		this.SetTSPSettings(tsp);
		
		var ocsp = this.CreateOCSPSettings();
		this.SetOCSPSettings(ocsp);
		
		var ldap = this.CreateLDAPSettings();
		this.SetLDAPSettings(ldap);	
	},
	CreateFileStoreSettings:function() {
		return EndUserFileStoreSettings("/certificates", 
			false, false, false, false, false, false, 3600);
	},
	SetFileStoreSettings: function(settings) {
		var error;
		
		try {
			error = Module.ccall('EUSetFileStoreSettings',
				'number',
				['array', 'number', 'number', 'number', 'number',
					'number', 'number', 'number'],
				[UTF8ToCP1251Array(settings.path),
					IntFromBool(settings.checkCRLs),
					IntFromBool(settings.autoRefresh),
					IntFromBool(settings.ownCRLsOnly),
					IntFromBool(settings.fullAndDeltaCRLs),
					IntFromBool(settings.autoDownloadCRLs),
					IntFromBool(settings.saveLoadedCerts),
					settings.expireTime]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE)
			this.RaiseError(error);
	},
	CreateProxySettings:function() {
		return EndUserProxySettings(false, true,
			"", "3128", "", "", false);
	},
	SetProxySettings:function(settings) {
		var error;
		
		try {
			error = Module.ccall('EUSetProxySettings',
				'number',
				['number', 'number', 'array', 'array',
					'array', 'array', 'number'],
				[IntFromBool(settings.useProxy),
					IntFromBool(settings.anonymous),
					StringToCString(settings.address),
					StringToCString(settings.port),
					StringToCString(settings.user),
					StringToCString(settings.password),
					IntFromBool(settings.savePassword)]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE)
			this.RaiseError(error);
	},
	CreateTSPSettings:function() {
		return EndUserTSPSettings(false,
			"", "80");
	},
	SetTSPSettings:function(settings) {
		var error;
		
		try {
			error = Module.ccall('EUSetTSPSettings',
				'number',
				['number', 'array', 'array'],
				[IntFromBool(settings.getStamps),
					StringToCString(settings.address),
					StringToCString(settings.port)]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE)
			this.RaiseError(error);
	},
	CreateOCSPSettings:function() {
		return EndUserOCSPSettings(false, false,
			"", "80");
	},
	SetOCSPSettings:function(settings) {
		var error;
		
		try {
			error = Module.ccall('EUSetOCSPSettings',
				'number',
				['number', 'number', 'array', 'array'],
				[IntFromBool(settings.useOCSP),
					IntFromBool(settings.beforeStore),
					StringToCString(settings.address),
					StringToCString(settings.port)]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE)
			this.RaiseError(error);
	},
	CreateCMPSettings:function() {
		return EndUserCMPSettings(false, "", "80", "");
	},
	SetCMPSettings:function(settings) {
		var error;
		
		try {
			error = Module.ccall('EUSetCMPSettings',
				'number',
				['number', 'array', 'array', 'array'],
				[IntFromBool(settings.useCMP),
					StringToCString(settings.address),
					StringToCString(settings.port),
					UTF8ToCP1251Array(settings.commonName)]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE)
			this.RaiseError(error);
	},
	CreateLDAPSettings:function() {
		return EndUserLDAPSettings(false, "", "80",
			true, "", "");
	},
	SetLDAPSettings:function(settings) {
		var error;
		
		try {
			error = Module.ccall('EUSetLDAPSettings',
				'number',
				['number', 'array', 'array',
					'number', 'array', 'array'],
				[IntFromBool(settings.useLDAP),
					StringToCString(settings.address),
					StringToCString(settings.port),
					IntFromBool(settings.anonymous),
					StringToCString(settings.user),
					StringToCString(settings.password)]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE)
			this.RaiseError(error);
	},
	CreateModeSettings:function() {
		return EndUserModeSettings(false);
	},
	SetModeSettings:function(settings) {
		var error;
		
		try {
			error = Module.ccall('EUSetModeSettings',
				'number',
				['number'],
				[IntFromBool(settings.offlineMode)]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE)
			this.RaiseError(error);
	},
	CreateOCSPAccessInfoModeSettings:function() {
		return EndUserOCSPAccessInfoModeSettings(false);
	},
	SetOCSPAccessInfoModeSettings:function(settings) {
		var error;
		
		try {
			error = Module.ccall('EUSetOCSPAccessInfoModeSettings',
				'number',
				['number'],
				[IntFromBool(settings.enabled)]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE)
			this.RaiseError(error);
	},
	CreateOCSPAccessInfoSettings:function() {
		return EndUserOCSPAccessInfoSettings("", "", "");
	},
	SetOCSPAccessInfoSettings:function(settings) {
		var error;
		
		try {
			error = Module.ccall('EUSetOCSPAccessInfoSettings',
				'number',
				['array', 'array', 'array'],
				[UTF8ToCP1251Array(settings.issuerCN),
					StringToCString(settings.address),
					StringToCString(settings.port)]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE)
			this.RaiseError(error);
	},
	SetRuntimeParameter: function(name, value) {
		var error;
		if (typeof value != 'boolean' && typeof value != 'number') {
			this.RaiseError(EU_ERROR_BAD_PARAMETER);
		}
		
		if (typeof value == 'boolean')
			value = IntFromBool(value);

		var intPtr = EUPointerInt();

		try {
			Module.setValue(intPtr.ptr,
				value | 0, "i32");

			error = Module.ccall('EUSetRuntimeParameter',
				'number',
				['array', 'number', 'number'],
				[UTF8ToCP1251Array(name), 
					intPtr.ptr, EU_INT_SIZE]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
			intPtr.free();
		}

		if (error != EU_ERROR_NONE) {
			this.RaiseError(error);
		}

		if (name == EU_STRING_ENCODING_PARAMETER) {
			this.fieldsEncoder = new LibraryStringEncoder(value);
		}

		intPtr.free();
	},
	SetOCSPResponseExpireTime:function(expireTime) {
		var error;
		
		try {
			error = Module.ccall('EUSetOCSPResponseExpireTime',
				'number',
				['number'],
				[expireTime]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE)
			this.RaiseError(error);
	},
	CreateTSLSettings:function() {
		return new EndUserTSLSettings(false, false, "");
	},
	SetTSLSettings: function(settings) {
		var error;
		
		try {
			error = Module.ccall('EUSetTSLSettings',
				'number',
				['number', 'number', 'array'],
				[IntFromBool(settings.useTSL),
					IntFromBool(settings.autoDownloadTSL),
					UTF8ToCP1251Array(settings.tslAddress)]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE)
			this.RaiseError(error);
	},
//-----------------------------------------------------------------------------
	SaveCertificate: function(certificate) {
		var error;

		this.CheckMaxDataSize(certificate);

		try {
			error = Module.ccall('EUSaveCertificate',
				'number',
				['array', 'number'],
				[certificate, certificate.length]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE)
			this.RaiseError(error);
	},
	SaveCertificates: function(certificates) {
		var error;

		this.CheckMaxDataSize(certificates);

		try {
			error = Module.ccall('EUSaveCertificates',
				'number',
				['array', 'number'],
				[certificates, certificates.length]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE)
			this.RaiseError(error);
	},
	SaveCertificatesEx: function(certificates, trustedStore) {
		var error;

		this.CheckMaxDataSize(certificates);
		if (trustedStore)
			this.CheckMaxDataSize(trustedStore);

		try {
			error = Module.ccall('EUSaveCertificatesEx',
				'number',
				['array', 'number', 
					trustedStore ? 'array' : 'number', 'number'],
				[certificates, certificates.length,
					trustedStore ? trustedStore : 0, 
					trustedStore ? trustedStore.length : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE)
			this.RaiseError(error);
	},
	SaveCRL: function(isFullCRL, crl) {
		var error;

		this.CheckMaxDataSize(crl);

		try {
			error = Module.ccall('EUSaveCRL',
				'number',
				['number', 'array', 'number'],
				[IntFromBool(isFullCRL), 
					crl, crl.length]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE)
			this.RaiseError(error);
	},
	SaveTSL: function(tsl) {
		var error;

		this.CheckMaxDataSize(tsl);

		try {
			error = Module.ccall('EUSaveTSL',
				'number',
				['array', 'number'],
				[tsl, tsl.length]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE)
			this.RaiseError(error);
	},
	GetCertificate: function(issuer, serial, asBase64String) {
		var pPtr = asBase64String ? 
			EUPointer() : EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUGetCertificate',
				'number',
				['array', 'array', 'number', 'number', 'number'],
				[UTF8ToCP1251Array(issuer), 
				 UTF8ToCP1251Array(serial), 
					asBase64String ? pPtr.ptr : 0,
					!asBase64String ? pPtr.ptr : 0,
					!asBase64String ? pPtr.lengthPtr : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return pPtr.toString(true);
		else 
			return pPtr.toArray();
	},
	GetCertificates: function() {
		var pPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUGetCertificates',
				'number',
				['number', 'number'],
				[pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		return pPtr.toArray();
	},
	GetCertificatesByKeyInfo: function(keyInfo, cmpServers) {
		this.CheckMaxDataSize(keyInfo);

		var pPtr = EUPointerArray();
		var error;

		var servers = ParseServersArray(cmpServers);
		var addressesArray = intArrayFromStrings(servers.addresses);
		var portsArray = intArrayFromStrings(servers.ports);

		try {
			error = Module.ccall('EUGetCertificatesByKeyInfo',
				'number',
				['array', 'number', 'array', 'array', 'number', 'number'],
				[keyInfo, keyInfo.length, 
					addressesArray, portsArray,
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		return pPtr.toArray();
	},
	ParseCertificate: function(certificate) {
		this.CheckMaxDataSize(certificate);

		var infoPtr = EUPointerCertificateInfo();
		var error;

		try {
			error = Module.ccall('EUParseCertificate',
				'number',
				['array', 'number', 'number'],
				[certificate, certificate.length, infoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			infoPtr.free();
			this.RaiseError(error);
		}

		var info = new EndUserCertificateInfo(infoPtr.ptr);
		infoPtr.free();

		return info;
	},
	ParseCertificateEx: function(certificate) {
		this.CheckMaxDataSize(certificate);

		var pPtr = EUPointer();
		var error;

		try {
			error = Module.ccall('EUParseCertificateEx',
				'number',
				['array', 'number', 'number'],
				[certificate, certificate.length, pPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		var infoPtr = pPtr.toPtr();
		var info = new EndUserCertificateInfoEx(
			infoPtr, this.fieldsEncoder);
		Module._EUFreeCertificateInfoEx(infoPtr);

		return info;
	},
	GetCRInfo: function(request) {
		this.CheckMaxDataSize(request);

		var pPtr = EUPointer();
		var error;

		try {
			error = Module.ccall('EUGetCRInfo',
				'number',
				['array', 'number', 'number'],
				[request, request.length, pPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		var infoPtr = pPtr.toPtr();
		var info = new EndUserRequestInfo(infoPtr);
		Module._EUFreeCRInfo(infoPtr);

		return info;
	},
	CheckCertificate: function(certificate) {
		this.CheckMaxDataSize(certificate);

		var infoPtr = EUPointerCertificateInfo();
		var error;

		try {
			error = Module.ccall('EUCheckCertificate',
				'number',
				['array', 'number'],
				[certificate, certificate.length]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			infoPtr.free();
			this.RaiseError(error);
		}

		return true;
	},
	EnumCertificatesEx: function(
		subjectType, subjectSubType, 
		certKeyType, keyUsage, index) {
		var pCertInfoExPtr = EUPointer();
		var certArrPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUEnumCertificatesEx',
				'number',
				['number', 'number', 'number', 'number', 
					'number', 'number', 'number', 'number'],
				[subjectType, subjectSubType,
					certKeyType, keyUsage,
					index, pCertInfoExPtr.ptr, 
					certArrPtr.ptr, certArrPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pCertInfoExPtr.free();
			certArrPtr.free();

			if (error == EU_WARNING_END_OF_ENUM)
				return null;

			this.RaiseError(error);
		}

		var certInfoExPtr, certInfoEx;

		certInfoExPtr = pCertInfoExPtr.toPtr();
		certInfoEx = new EndUserCertificateInfoEx(
			certInfoExPtr, this.fieldsEncoder);
		Module._EUFreeCertificateInfoEx(certInfoExPtr);

		return new EndUserCertificate(certInfoEx, certArrPtr.toArray());
	},
//-----------------------------------------------------------------------------
	IsPrivateKeyReaded: function() {
		var error = EU_ERROR_NONE;
		var isReaded;
		
		try {
			isReaded = (Module._EUIsPrivateKeyReaded() != EU_FALSE);
			error = EU_ERROR_NONE;
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
			isReaded = false;
		}
		
		if (error != EU_ERROR_NONE) {
			this.RaiseError(error);
		}

		return isReaded;
	},
	ReadPrivateKeyBinary: function(privateKey, password) {
		this.CheckMaxDataSize(privateKey);

		var infoPtr = EUPointerCertOwnerInfo();
		var error;

		try {
			error = Module.ccall('EUReadPrivateKeyBinary',
				'number',
				['array', 'number', 'array', 'number'],
				[privateKey, privateKey.length,
					UTF8ToCP1251Array(password), infoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			infoPtr.free();
			this.RaiseError(error);
		}

		this.privKeyOwnerInfo = new EndUserOwnerInfo(infoPtr.ptr);
		infoPtr.free();

		return this.privKeyOwnerInfo;
	},
	ResetPrivateKey: function() {
		try {
			Module.ccall('EUResetPrivateKey', "",
				[], []);
		} catch (e) {
		}

		this.privKeyOwnerInfo = null;
	},
	GetPrivateKeyOwnerInfo: function() {
		var error = EU_ERROR_NONE;
		try {
			if (Module._EUIsPrivateKeyReaded() == EU_FALSE) {
				this.privKeyOwnerInfo = null;
				error = EU_ERROR_UNKNOWN;
			}
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			this.RaiseError(error);
		}
		
		return this.privKeyOwnerInfo;
	},
	GetKeyInfoBinary: function (privateKey, password) {
		this.CheckMaxDataSize(privateKey);

		var arrPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUGetKeyInfoBinary',
				'number',
				['array', 'number', 'array', 'number', 'number'],
				[privateKey, privateKey.length, 
					UTF8ToCP1251Array(password), 
					arrPtr.ptr, arrPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			arrPtr.free();
			this.RaiseError(error);
		}

		return arrPtr.toArray();
	},
	EnumOwnCertificates: function(index) {
		var pPtr = EUPointer();
		var error;

		try {
			error = Module.ccall('EUEnumOwnCertificates',
				'number',
				['number', 'number'],
				[index, pPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			
			if (error == EU_WARNING_END_OF_ENUM)
				return null;

			this.RaiseError(error);
		}

		var infoPtr = pPtr.toPtr();
		var info = new EndUserCertificateInfoEx(
			infoPtr, this.fieldsEncoder);
		Module._EUFreeCertificateInfoEx(infoPtr);

		return info;
	},
	GetOwnCertificate: function(keyType, keyUsage) {
		var pThis = this;
		var index = 0;
		var certInfoEx = null;
		while (true) {
			certInfoEx = pThis.EnumOwnCertificates(index);
			if (certInfoEx == null)
				break;

			if ((certInfoEx.GetPublicKeyType() == keyType) && 
				((certInfoEx.GetKeyUsageType() & keyUsage) == keyUsage))
			{
				break;
			}

			index++;
		}
	
		if (certInfoEx == null)
			return null;
		
		var cert = pThis.GetCertificate(
			certInfoEx.GetIssuer(), certInfoEx.GetSerial())

		return new EndUserCertificate(certInfoEx, cert);
	},
	GeneratePrivateKey: function(password,
		uaKeysType, uaDSKeysSpec, useDSKeyAsKEP, uaKEPKeysSpec,
		internationalKeysType, internationalKeysSpec, 
		userInfo, extKeyUsages) {
		return this.GeneratePrivateKey2(password,
			uaKeysType, uaDSKeysSpec, useDSKeyAsKEP, uaKEPKeysSpec,
			internationalKeysType, internationalKeysSpec, 0,
			userInfo, extKeyUsages);
	},
	GeneratePrivateKey2: function(password,
		uaKeysType, uaDSKeysSpec, useDSKeyAsKEP, uaKEPKeysSpec,
		internationalKeysType, rsaKeysSpec, ecdsaKeysSpec,
		userInfo, extKeyUsages) {
		var error;

		var kmPtr = EUPointerKeyMedia(0, 0, password);
		if (kmPtr == null)
			this.RaiseError(EU_ERROR_BAD_PARAMETER);

		var userInfoPtr = null;
		if (userInfo != null) {
			userInfoPtr = EUPointerEndUserInfo(userInfo);
			if (userInfoPtr == null) {
				kmPtr.free();
				this.RaiseError(EU_ERROR_BAD_PARAMETER);
			}
		}

		var pkPtr = EUPointerArray();
		var pkInfoPtr = EUPointerArray();

		var uaReqPtr = null, uaReqNamePtr = null, 
			uaKEPReqPtr = null, uaKEPReqNamePtr = null;
		if (uaKeysType != EU_KEYS_TYPE_NONE) {
			uaReqPtr = EUPointerArray();
			uaReqNamePtr = EUPointerMemory(EU_PATH_MAX_LENGTH);

			if (!useDSKeyAsKEP) {
				uaKEPReqPtr = EUPointerArray();
				uaKEPReqNamePtr = EUPointerMemory(EU_PATH_MAX_LENGTH);
			}
		}

		var rsaReqPtr = null, rsaReqNamePtr = null;
		if (internationalKeysType & EU_KEYS_TYPE_RSA_WITH_SHA) {
			rsaReqPtr = EUPointerArray();
			rsaReqNamePtr = EUPointerMemory(EU_PATH_MAX_LENGTH);
		}

		var ecdsaReqPtr = null, ecdsaReqNamePtr = null;
		if (internationalKeysType & EU_KEYS_TYPE_ECDSA_WITH_SHA) {
			ecdsaReqPtr = EUPointerArray();
			ecdsaReqNamePtr = EUPointerMemory(EU_PATH_MAX_LENGTH);
		}
		
		var _free = function() {
			kmPtr.free();
			pkPtr.free();
			pkInfoPtr.free();
			if (userInfoPtr != null)
				userInfoPtr.free();
			if (uaReqPtr != null)
				uaReqPtr.free();
			if (uaReqNamePtr != null)
				uaReqNamePtr.free();
			if (uaKEPReqPtr != null)
				uaKEPReqPtr.free();
			if (uaKEPReqNamePtr != null)
				uaKEPReqNamePtr.free();
			if (rsaReqPtr != null)
				rsaReqPtr.free();
			if (rsaReqNamePtr != null)
				rsaReqNamePtr.free();
			if (ecdsaReqPtr != null)
				ecdsaReqPtr.free();
			if (ecdsaReqNamePtr != null)
				ecdsaReqNamePtr.free();
		};

		try {
			error = Module.ccall('EUGeneratePrivateKey2',
				'number',
				['number', 'number', 
				 'number', 'number', 'number', 'number',
				  'number', 'number', 'number', 'number', 'number',
				  'number', 
				  (extKeyUsages != null) ? 'array' : 'number',
				  'number', 'number',
				  'number', 'number',
				  'number', 'number', 'number',
				  'number', 'number', 'number',
				  'number', 'number', 'number',
				  'number', 'number', 'number'],
				[kmPtr.ptr, EU_FALSE, 
				 uaKeysType, uaDSKeysSpec, uaKEPKeysSpec, null,
				 internationalKeysType, rsaKeysSpec, null, ecdsaKeysSpec, null,
				 (userInfo != null) ? 
					userInfoPtr.ptr : null, 
				 (extKeyUsages != null) ? 
					UTF8ToCP1251Array(extKeyUsages) : null,
				 pkPtr.ptr, pkPtr.lengthPtr,
				 pkInfoPtr.ptr, pkInfoPtr.lengthPtr,
				 (uaReqPtr != null) ? uaReqPtr.ptr : null,
				 (uaReqPtr != null) ? uaReqPtr.lengthPtr : null,
				 (uaReqNamePtr != null) ? uaReqNamePtr.ptr : null, 
				 (uaKEPReqPtr != null) ? uaKEPReqPtr.ptr : null,
				 (uaKEPReqPtr != null) ? uaKEPReqPtr.lengthPtr : null,
				 (uaKEPReqNamePtr != null) ? uaKEPReqNamePtr.ptr : null,
				 (rsaReqPtr != null) ? rsaReqPtr.ptr : null,
				 (rsaReqPtr != null) ? rsaReqPtr.lengthPtr : null,
				 (rsaReqNamePtr != null) ? rsaReqNamePtr.ptr : null,
				 (ecdsaReqPtr != null) ? ecdsaReqPtr.ptr : null,
				 (ecdsaReqPtr != null) ? ecdsaReqPtr.lengthPtr : null,
				 (ecdsaReqNamePtr != null) ? ecdsaReqNamePtr.ptr : null]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			_free();
			this.RaiseError(error);
		}

		var _toString = function(strPtr) {
			var str = CP1251PointerToUTF8(strPtr);
			var lastInd = str.lastIndexOf("/");
			if (lastInd < 0)
				return str;

			return str.substring(lastInd + 1, str.length);
		};
		
		var euPrivateKey = new EndUserPrivateKey(
			pkPtr.toArray(), pkInfoPtr.toArray(),
			(uaReqPtr != null) ? uaReqPtr.toArray() : null,
			(uaReqNamePtr != null) ? _toString(uaReqNamePtr.ptr) : null,
			(uaKEPReqPtr != null) ? uaKEPReqPtr.toArray() : null,
			(uaKEPReqNamePtr != null) ? _toString(uaKEPReqNamePtr.ptr) : null,
			(rsaReqPtr != null) ? rsaReqPtr.toArray() : null,
			(rsaReqNamePtr != null) ? _toString(rsaReqNamePtr.ptr) : null,
			(ecdsaReqPtr != null) ? ecdsaReqPtr.toArray() : null,
			(ecdsaReqNamePtr != null) ? _toString(ecdsaReqNamePtr.ptr) : null);

		_free();

		return euPrivateKey;
	},
	MakeNewCertificate: function(privateKey, password,
		uaKeysType, uaDSKeysSpec, useDSKeyAsKEP, uaKEPKeysSpec,
		internationalKeysType, internationalKeysSpec, 
		newPrivateKeyPassword) {
		this.CheckMaxDataSize(privateKey);
		
		var pkPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUMakeNewCertificate',
				'number',
				['number', 'array', 'number', 'array',
				  'number', 'number', 'number', 
				  'number', 'number',
				  'number', 'number', 'number',
				  'number', 'array',
				  'number', 'number'],
				[null, privateKey, privateKey.length, UTF8ToCP1251Array(password),
				 uaKeysType, uaDSKeysSpec, IntFromBool(useDSKeyAsKEP), 
				 uaKEPKeysSpec, null,
				 internationalKeysType, internationalKeysSpec, null,
				 null, UTF8ToCP1251Array(newPrivateKeyPassword), 
				 pkPtr.ptr, pkPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pkPtr.free();
			this.RaiseError(error);
		}

		return pkPtr.toArray();
	},
	ChangeSoftwarePrivateKeyPassword: function(
		privateKey, oldPassword, newPassword) {
		this.CheckMaxDataSize(privateKey);

		var arrPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUChangeSoftwarePrivateKeyPassword',
				'number',
				['array', 'number', 'array', 'array', 'number', 'number'],
				[privateKey, privateKey.length, 
					UTF8ToCP1251Array(oldPassword), 
					UTF8ToCP1251Array(newPassword), 
					arrPtr.ptr, arrPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			arrPtr.free();
			this.RaiseError(error);
		}

		return arrPtr.toArray();
	},
	EnumJKSPrivateKeys: function(container, index) {
		this.CheckMaxDataSize(container);

		var keyAliasPtr = EUPointer();
		var error;

		try {
			error = Module.ccall('EUEnumJKSPrivateKeys',
				'number',
				['array', 'number',  'number', 'number'],
				[container, container.length,
					index, keyAliasPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			keyAliasPtr.free();
			this.RaiseError(error);
		}

		return keyAliasPtr.toString();
	},
	GetJKSPrivateKey: function(container, keyAlias) {
		this.CheckMaxDataSize(container);

		var keyPtr = EUPointerArray();
		var certsCountPtr = EUPointerDWORD();
		var certsPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUGetJKSPrivateKey',
				'number',
				['array', 'number',  'array', 
					'number', 'number', 'number', 'number', 'number'],
				[container, container.length,
					UTF8ToCP1251Array(keyAlias), 
					keyPtr.ptr, keyPtr.lengthPtr, certsCountPtr.ptr,
					certsPtr.ptr, certsPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			keyPtr.free();
			certsCountPtr.free();
			certsPtr.free();
			this.RaiseError(error);
		}

		var count = certsCountPtr.toNumber();

		return new EndUserJKSPrivateKey(
			keyPtr.toArray(), 
			certsPtr.toArrayOfByteArrays(count));
	},
	ChangeOwnCertificatesStatus: function(requestType, revocationReason) {
		var error;

		try {
			error = Module.ccall('EUChangeOwnCertificatesStatus',
				'number',
				['number', 'number'],
				[requestType, revocationReason]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			this.RaiseError(error);
		}
	},
	CtxReadPrivateKeyBinary: function(context, privateKey, password) {
		this.CheckMaxDataSize(privateKey);

		var pkCtxPtr = EUPointer(); 
		var infoPtr = EUPointerCertOwnerInfo(context.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxReadPrivateKeyBinary',
				'number',
				['number', 'array', 'number', 'array', 'number', 'number'],
				[context.GetContext(), privateKey, privateKey.length,
					UTF8ToCP1251Array(password), 
					pkCtxPtr.ptr, infoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pkCtxPtr.free();
			infoPtr.free();
			this.RaiseError(error);
		}

		var privateKeyContext = new EndUserPrivateKeyContext(
			pkCtxPtr.toPtr(), new EndUserOwnerInfo(infoPtr.ptr));
		infoPtr.free();

		return privateKeyContext;
	},
	CtxFreePrivateKey: function(privateKeyContext) {
		try {
			Module._EUCtxFreePrivateKey(
				privateKeyContext.GetContext()|0);
		} catch (e) {
		}
	},
	CtxGetOwnCertificate: function(
		privateKeyContext, certKeyType, keyUsage) {
		var pkCtx = privateKeyContext.GetContext();
		var pCertInfoExPtr = EUPointer();
		var certArrPtr = EUPointerArray(pkCtx);
		var error;

		try {
			error = Module.ccall('EUCtxGetOwnCertificate',
				'number',
				['number', 'number', 'number', 
					'number', 'number', 'number'],
				[pkCtx, certKeyType, keyUsage, pCertInfoExPtr.ptr,
					certArrPtr.ptr, certArrPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pCertInfoExPtr.free();
			certArrPtr.free();

			this.RaiseError(error);
		}

		var certInfoExPtr, certInfoEx;

		certInfoExPtr = pCertInfoExPtr.toPtr();
		certInfoEx = new EndUserCertificateInfoEx(
			certInfoExPtr, this.fieldsEncoder);
		Module._EUCtxFreeCertificateInfoEx(pkCtx|0, certInfoExPtr);

		return new EndUserCertificate(certInfoEx, certArrPtr.toArray());
	},
	CtxEnumOwnCertificates: function(privateKeyContext, index) {
		var pkCtx = privateKeyContext.GetContext();
		var pCertInfoExPtr = EUPointer();
		var certArrPtr = EUPointerArray(pkCtx);
		var error;

		try {
			error = Module.ccall('EUCtxEnumOwnCertificates',
				'number',
				['number', 'number', 'number', 'number', 'number'],
				[pkCtx, index, pCertInfoExPtr.ptr, 
					certArrPtr.ptr, certArrPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pCertInfoExPtr.free();
			certArrPtr.free();

			if (error == EU_WARNING_END_OF_ENUM)
				return null;

			this.RaiseError(error);
		}

		var certInfoExPtr, certInfoEx;

		certInfoExPtr = pCertInfoExPtr.toPtr();
		certInfoEx = new EndUserCertificateInfoEx(
			certInfoExPtr, this.fieldsEncoder);
		Module._EUCtxFreeCertificateInfoEx(pkCtx|0, certInfoExPtr);

		return new EndUserCertificate(certInfoEx, certArrPtr.toArray());
	},
	CtxEnumPrivateKeyInfo: function(privateKeyContext, index) {
		var dwordKeyTypePtr = EUPointerDWORD();
		var dwordKeyUsagePtr = EUPointerDWORD();
		var dwordKeyIDsCountPtr = EUPointerDWORD();
		var keyIDsPtr = EUPointer(privateKeyContext.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxEnumPrivateKeyInfo',
				'number',
				['number', 'number',
					'number', 'number', 'number', 'number'],
				[privateKeyContext.GetContext() | 0, index,
					dwordKeyTypePtr.ptr, dwordKeyUsagePtr.ptr, 
					dwordKeyIDsCountPtr.ptr, keyIDsPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			dwordKeyTypePtr.free();
			dwordKeyUsagePtr.free();
			dwordKeyIDsCountPtr.free();
			keyIDsPtr.free();
			
			if (error == EU_WARNING_END_OF_ENUM)
				return null;
			
			this.RaiseError(error);
		}

		var keyType = dwordKeyTypePtr.toNumber();
		var keyUsage = dwordKeyUsagePtr.toNumber();
		var keyIDsCount = dwordKeyIDsCountPtr.toNumber();
		var keyIDs = keyIDsPtr.toStringArray();
		if (keyIDsCount != keyIDs.length)
			this.RaiseError(EU_ERROR_BAD_PARAMETER);

		return EndUserPrivateKeyInfo(
			keyType, keyUsage, keyIDs);
	},
	CtxExportPrivateKeyContainer: function(privateKeyContext, 
		password, keyID, asBase64String) {
		var pPtr = EUPointerArray(
			privateKeyContext.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxExportPrivateKeyContainer',
				'number',
				['number', 'array', 'array', 
					'number', 'number'],
				[privateKeyContext.GetContext(), 
					UTF8ToCP1251Array(password),
					UTF8ToCP1251Array(keyID),
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else
			return pPtr.toArray();
	},
	CtxExportPrivateKeyPFXContainer: function(privateKeyContext,
		password, exportCerts, trustedKeyIDs, keyIDs, asBase64String) {
		var pPtr = EUPointerArray(
			privateKeyContext.GetContext());
		var error;

		var trustedKeyIDsArray = [];
		for (var i = 0; i < trustedKeyIDs.length; i++) {
			trustedKeyIDsArray.push(IntFromBool(exportCerts));
		}
		
		try {
			var trustedKeyIDsPtr = 
				EUPointerIntArray(trustedKeyIDsArray);
			error = Module.ccall('EUCtxExportPrivateKeyPFXContainer',
				'number',
				['number', 'array', 'number', 'number', 'number', 
					'array', 'number', 'number'],
				[privateKeyContext.GetContext(), 
					UTF8ToCP1251Array(password),
					IntFromBool(exportCerts),
					keyIDs.length,
					trustedKeyIDsPtr.ptr,
					intArrayFromStrings(keyIDs),
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else
			return pPtr.toArray();
	},
	CtxGetCertificateFromPrivateKey: function(
		privateKeyContext, keyID) {
		var pCertInfoExPtr = EUPointer();
		var certArrPtr = EUPointerArray(
			privateKeyContext.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxGetCertificateFromPrivateKey',
				'number',
				['number', 'array', 
					'number', 'number', 'number'],
				[privateKeyContext.GetContext(), 
					UTF8ToCP1251Array(keyID),
					pCertInfoExPtr.ptr, 
					certArrPtr.ptr, certArrPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pCertInfoExPtr.free();
			certArrPtr.free();

			this.RaiseError(error);
		}

		var certInfoExPtr, certInfoEx;

		certInfoExPtr = pCertInfoExPtr.toPtr();
		certInfoEx = new EndUserCertificateInfoEx(
			certInfoExPtr, this.fieldsEncoder);
		Module._EUCtxFreeCertificateInfoEx(
			privateKeyContext.GetContext()|0, certInfoExPtr);

		return new EndUserCertificate(certInfoEx, certArrPtr.toArray());
	},
	CtxChangeOwnCertificatesStatus: function(
		privateKeyContext, requestType, revocationReason) {
		var error;

		try {
			error = Module.ccall('EUCtxChangeOwnCertificatesStatus',
				'number',
				['number', 'number', 'number'],
				[privateKeyContext.GetContext(), 
					requestType, revocationReason]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			this.RaiseError(error);
		}
	},
	CtxGetOwnEUserParams: function(privateKeyContext) {
		var pPtr = EUPointer();
		var error;

		try {
			error = Module.ccall('EUCtxGetOwnEUserParams',
				'number',
				['number', 'number'],
				[privateKeyContext.GetContext(), pPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		var paramsPtr = pPtr.toPtr();
		var info = new EndUserParams(paramsPtr);

		Module._EUCtxFreeEUserParams(
			privateKeyContext.GetContext() | 0, paramsPtr);

		return info;
	},
	CtxModifyOwnEUserParams: function(
		privateKeyContext, phone, email) {
		var pPtr = EUPointer();
		var error;

		try {
			error = Module.ccall('EUCtxModifyOwnEUserParams',
				'number',
				['number', 'array', 'array'],
				[privateKeyContext.GetContext(),
					UTF8ToCP1251Array(phone), 
					UTF8ToCP1251Array(email)]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}
	},
	CtxMakeDeviceCertificate: function(
		privateKeyContext, deviceName, 
		uaRequest, uaKEPRequest, 
		internationalRequest, ecdsaRequest,
		cmpAddress, cmpPort) {
		var pkCtx = privateKeyContext.GetContext();
		var uaCertPtr = null, uaKEPCertPtr = null, 
			intCertPtr = null, ecdsaCertPtr = null;
		
		if (uaRequest != null)
			uaCertPtr = EUPointerArray(pkCtx);
		if (uaKEPRequest != null)
			uaKEPCertPtr = EUPointerArray(pkCtx);
		if (internationalRequest != null)
			intCertPtr = EUPointerArray(pkCtx);
		if (ecdsaRequest != null)
			ecdsaCertPtr = EUPointerArray(pkCtx);

		try {
			error = Module.ccall('EUCtxMakeDeviceCertificate',
				'number',
				['number', 'array', 
				(uaRequest != null) ? 'array' : 'number', 'number', 
				(uaKEPRequest != null) ? 'array' : 'number', 'number',
				(internationalRequest != null) ? 'array' : 'number', 'number', 
				(ecdsaRequest != null) ? 'array' : 'number', 'number',
				(cmpAddress != null) ? 'array' : 'number', 
				(cmpPort != null) ? 'array' : 'number', 
				'number', 'number', 'number', 'number',
				'number', 'number', 'number', 'number'],
				[pkCtx, UTF8ToCP1251Array(deviceName),
					(uaRequest != null) ? uaRequest : 0,
					(uaRequest != null) ? uaRequest.length : 0,
					(uaKEPRequest != null) ? uaKEPRequest : 0,
					(uaKEPRequest != null) ? uaKEPRequest.length : 0,
					(internationalRequest != null) ? 
						internationalRequest : 0,
					(internationalRequest != null) ? 
						internationalRequest.length : 0,
					(ecdsaRequest != null) ? ecdsaRequest : 0,
					(ecdsaRequest != null) ? ecdsaRequest.length : 0,
					(cmpAddress != null) ? UTF8ToCP1251Array(cmpAddress) : 0,
					(cmpPort != null) ? UTF8ToCP1251Array(cmpPort) : 0,
					(uaCertPtr != null) ? uaCertPtr.ptr : 0,
					(uaCertPtr != null) ? uaCertPtr.lengthPtr : 0,
					(uaKEPCertPtr != null) ? uaKEPCertPtr.ptr : 0,
					(uaKEPCertPtr != null) ? uaKEPCertPtr.lengthPtr : 0,
					(intCertPtr != null) ? intCertPtr.ptr : 0,
					(intCertPtr != null) ? intCertPtr.lengthPtr : 0,
					(ecdsaCertPtr != null) ? ecdsaCertPtr.ptr : 0,
					(ecdsaCertPtr != null) ? ecdsaCertPtr.lengthPtr : 0	
				]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			if (uaCertPtr != null)
				uaCertPtr.free();
			if (uaKEPCertPtr != null)
				uaKEPCertPtr.free();
			if (intCertPtr != null)
				intCertPtr.free();
			if (ecdsaCertPtr != null)
				ecdsaCertPtr.free();
			this.RaiseError(error);
		}
		
		var certificates = [];
		if (uaCertPtr != null)
			certificates.push(uaCertPtr.toArray());
		if (uaKEPCertPtr != null)
			certificates.push(uaKEPCertPtr.toArray());
		if (intCertPtr != null)
			certificates.push(intCertPtr.toArray());
		if (ecdsaCertPtr != null)
			certificates.push(ecdsaCertPtr.toArray());

		return certificates;
	},
	CtxMakeNewOwnCertificateWithCR: function(
		privateKeyContext, uaRequest, uaKEPRequest, 
		rsaRequest, ecdsaRequest) {
		var pkCtx = privateKeyContext.GetContext();

		try {
			error = Module.ccall('EUCtxMakeNewOwnCertificateWithCR',
				'number',
				['number',
				(uaRequest != null) ? 'array' : 'number', 'number', 
				(uaKEPRequest != null) ? 'array' : 'number', 'number',
				(rsaRequest != null) ? 'array' : 'number', 'number', 
				(ecdsaRequest != null) ? 'array' : 'number', 'number'],
				[pkCtx,
					(uaRequest != null) ? uaRequest : 0,
					(uaRequest != null) ? uaRequest.length : 0,
					(uaKEPRequest != null) ? uaKEPRequest : 0,
					(uaKEPRequest != null) ? uaKEPRequest.length : 0,
					(rsaRequest != null) ? rsaRequest : 0,
					(rsaRequest != null) ? rsaRequest.length : 0,
					(ecdsaRequest != null) ? ecdsaRequest : 0,
					(ecdsaRequest != null) ? ecdsaRequest.length : 0
				]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			this.RaiseError(error);
		}
	},
//-----------------------------------------------------------------------------
	HashData: function(data, asBase64String) {
		if ((typeof data) == 'string')
			data = this.StringToArray(data);

		this.CheckMaxDataSize(data);

		var pPtr = asBase64String ? 
			EUPointer() : EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUHashData',
				'number',
				['array', 'number', 'number', 'number', 'number'],
				[data, data.length, 
					asBase64String ? pPtr.ptr : 0,
					!asBase64String ? pPtr.ptr : 0,
					!asBase64String ? pPtr.lengthPtr : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}
		
		if (asBase64String)
			return pPtr.toString(true);
		else 
			return pPtr.toArray();
	},
	CtxHashData: function(context, hashAlgo, 
		certificate, data, asBase64String) {
		if ((typeof data) == 'string')
			data = this.StringToArray(data);

		if (certificate != null)
			this.CheckMaxDataSize(certificate);

		var hashContext = null;

		try {
			var hash = null;
			var chunkMaxSize = EU_MAX_DATA_SIZE_MB;
			var offset = 0;

			hashContext =  this.CtxHashDataBegin(
				context, hashAlgo, certificate);

			while (true) {
				var chunkSize = (data.length - offset);
				if (chunkSize > chunkMaxSize)
					chunkSize = chunkMaxSize;
	
				var chunk = data.slice(
					offset, offset + chunkSize);
				this.CtxHashDataContinue(hashContext, chunk);
				offset += chunkSize;
				if (offset < data.length)
					continue;
				break;
			}

			hash = this.CtxHashDataEnd(
				hashContext, asBase64String);

			this.CtxFreeHash(hashContext);
			hashContext = null;

			return hash;
		} catch (e) {
			if (hashContext != null)
				this.CtxFreeHash(hashContext);
			throw e;
		}
	},
	CtxHashDataBegin: function(context, hashAlgo, certificate) {
		if (certificate != null)
			this.CheckMaxDataSize(certificate);

		var hashCtxPtr = EUPointer();
		var error;

		try {
			error = Module.ccall('EUCtxHashDataBegin',
				'number',
				['number', 'number', 
					certificate != null ? 'array' : 'number', 
					'number', 'number'],
				[context.GetContext(), hashAlgo, 
					(certificate != null) ? certificate : 0,
					(certificate != null) ? certificate.length : 0,
					hashCtxPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			hashCtxPtr.free();
			this.RaiseError(error);
		}

		return EndUserHashContext(hashCtxPtr.toPtr());
	},
	CtxHashDataContinue: function(hashContext, data) {
		if ((typeof data) == 'string')
			data = this.StringToArray(data);

		this.CheckMaxDataSize(data);

		var error;

		try {
			error = Module.ccall('EUCtxHashDataContinue',
				'number',
				['number', 'array', 'number'],
				[hashContext.GetContext(), data, data.length]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			this.RaiseError(error);
		}
	},
	CtxHashDataEnd: function(hashContext, asBase64String) {
		var pPtr = EUPointerArray(hashContext.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxHashDataEnd',
				'number',
				['number', 'number', 'number'],
				[hashContext.GetContext(), pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else
			return pPtr.toArray();
	},
	CtxFreeHash: function(hashContext) {
		try {
			Module._EUCtxFreeHash(hashContext.GetContext()|0);
		} catch (e) {
		}
	},
	CtxHashFile: function(context, hashAlgo, 
		certificate, file, onSuccess, onError, asBase64String) {
		var pThis = this;

		if (certificate != null)
			pThis.CheckMaxDataSize(certificate);

		if (pThis.isFileSyncAPISupported) {
			if (!EUFS.link(file)) {
				setTimeout(function() {
					onError(pThis.MakeError(EU_ERROR_JS_READ_FILE));
				}, 1);
				return;
			} 

			var pPtr = EUPointerArray(context.GetContext());
			var error;

			try {
				error = Module.ccall('EUCtxHashFile',
					'number',
					['number', 'number', 
						certificate != null ? 'array' : 'number', 'number',
						'array', 'number', 'number'],
					[context.GetContext(), hashAlgo, 
						(certificate != null) ? certificate : 0,
						(certificate != null) ? certificate.length : 0,
						UTF8ToCP1251Array(EUFS.getFilePath(file)),
						pPtr.ptr, pPtr.lengthPtr]);
			} catch (e) {
				error = EU_ERROR_UNKNOWN;
			}

			if (error != EU_ERROR_NONE) {
				EUFS.unlink(file);
				pPtr.free();

				setTimeout(function() {
					onError(pThis.MakeError(error));
				}, 1);
				return;
			}

			EUFS.unlink(file);

			try {
				var data = asBase64String ? 
					pThis.Base64Encode(pPtr.toArray()) : 
					pPtr.toArray();
				setTimeout(function() {
					onSuccess(data);
				}, 1);
			} catch (e) {
				setTimeout(function() {
					onError(e);
				}, 1);
			}
		} else {
			var _onSuccess = function(fileReaded) {
				try {
					var data = pThis.CtxHashData(
						context, hashAlgo, certificate, 
						fileReaded.data, asBase64String);

					onSuccess(data);
				} catch (e) {
					onError(e);
				}
			};

			pThis.ReadFile(file, _onSuccess, onError);
		}
	},
//-----------------------------------------------------------------------------
	CheckDataStruct: function(data) {
		this.CheckMaxDataSize(data);

		if ((typeof data) == 'string')
			data = this.Base64Decode(data);

		var error;

		try {
			error = Module.ccall('EUCheckDataStruct',
				'number',
				['array', 'number'],
				[data, data.length]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE)
			this.RaiseError(error);
	},
	CheckFileStruct: function(file, onSuccess, onError) {
		var pThis = this;

		if (pThis.isFileSyncAPISupported) {
			if (!EUFS.link(file)) {
				onError(pThis.MakeError(EU_ERROR_JS_READ_FILE));
				return;
			} 

			var error;

			try {
				error = Module.ccall('EUCheckFileStruct',
					'number',
					['array'],
					[UTF8ToCP1251Array(EUFS.getFilePath(file))]);
			} catch (e) {
				error = EU_ERROR_UNKNOWN;
			}

			if (error != EU_ERROR_NONE) {
				EUFS.unlink(file);

				onError(pThis.MakeError(error));
				return;
			}

			EUFS.unlink(file);

			onSuccess();
		} else {
			var _onSuccess = function(fileReaded) {
				try {
					pThis.CheckDataStruct(
						fileReaded.data);
					onSuccess();
				} catch (e) {
					onError(e);
				}
			};

			pThis.ReadFile(file, _onSuccess, onError);
		}
	},
	GetSignType: function(signIndex, sign) {
		this.CheckMaxDataSize(sign);

		var isSignStr = ((typeof sign) == 'string');
		var intPtr = EUPointerDWORD();
		var error;

		try {
			error = Module.ccall('EUGetSignType',
				'number',
				['number', 
					isSignStr ? 'array' : 'number',
					(!isSignStr) ? 'array' : 'number',
					'number', 'number'],
				[signIndex,
					isSignStr ? StringToCString(sign) : 0,
					!isSignStr ? sign : 0,
					!isSignStr ? sign.length : 0,
					intPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			intPtr.free();

			this.RaiseError(error);
		}

		return intPtr.toNumber();
	},
	GetFileSignType: function(signIndex, signedFile,
		onSuccess, onError) {
		var pThis = this;

		if (pThis.isFileSyncAPISupported) {
			if (!EUFS.link(signedFile)) {
				onError(pThis.MakeError(EU_ERROR_JS_READ_FILE));
				return;
			}
		
			var intPtr = EUPointerDWORD();
			var error;

			try {
				error = Module.ccall('EUGetFileSignType',
					'number',
					['number', 'array', 'number'],
					[signIndex, 
						UTF8ToCP1251Array(EUFS.getFilePath(signedFile)),
						intPtr.ptr]);
			} catch (e) {
				error = EU_ERROR_UNKNOWN;
			}

			if (error != EU_ERROR_NONE) {
				intPtr.free();
				EUFS.unlink(signedFile);

				onError(pThis.MakeError(error));
				return;
			}

			EUFS.unlink(signedFile);

			onSuccess(intPtr.toNumber());
		} else {
			var _onSuccess = function(fileReaded) {
				try {
					var signType = pThis.GetSignType(
						signIndex, fileReaded.data);
					onSuccess(signType);
				} catch (e) {
					onError(e);
				}
			};

			pThis.ReadFile(signedFile, _onSuccess, onError);
		}
	},
	IsDataInSignedDataAvailable: function(sign) {
		this.CheckMaxDataSize(sign);

		var isSignStr = ((typeof sign) == 'string');
		var intPtr = EUPointerInt();
		var error;

		try {
			error = Module.ccall('EUIsDataInSignedDataAvailable',
				'number',
				[isSignStr ? 'array' : 'number',
					(!isSignStr) ? 'array' : 'number',
					'number', 'number'],
				[isSignStr ? StringToCString(sign) : 0,
					!isSignStr ? sign : 0,
					!isSignStr ? sign.length : 0,
					intPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			intPtr.free();
			this.RaiseError(error);
		}

		return intPtr.toBoolean();
	},
	GetDataFromSignedData: function(signedData) {
		this.CheckMaxDataSize(signedData);

		var isSignStr = ((typeof signedData) == 'string');
		var arrPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUGetDataFromSignedData',
				'number',
				[isSignStr ? 'array' : 'number',
					(!isSignStr) ? 'array' : 'number',
					'number', 'number', 'number'],
				[isSignStr ? StringToCString(signedData) : 0,
					!isSignStr ? signedData : 0,
					!isSignStr ? signedData.length : 0, 
					arrPtr.ptr, arrPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			arrPtr.free();
			this.RaiseError(error);
		}

		return arrPtr.toArray();
	},
	GetSignTimeInfo: function(signIndex, sign) {
		this.CheckMaxDataSize(sign);

		var isSignStr = ((typeof sign) == 'string');
		var pTimeInfoPtr = EUPointer();
		var error;

		try {
			error = Module.ccall('EUGetSignTimeInfo',
				'number',
				['number', 
					isSignStr ? 'array' : 'number',
					(!isSignStr) ? 'array' : 'number',
					'number', 'number'],
				[signIndex,
					isSignStr ? StringToCString(sign) : 0,
					!isSignStr ? sign : 0,
					!isSignStr ? sign.length : 0,
					pTimeInfoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pTimeInfoPtr.free();

			this.RaiseError(error);
		}

		var timeInfoPtr, timeInfo;

		timeInfoPtr = pTimeInfoPtr.toPtr();
		timeInfo = new EndUserTimeInfo(timeInfoPtr);
		Module._EUFreeTimeInfo(timeInfoPtr);

		return timeInfo;
	},
	GetFileSignTimeInfo: function(signIndex, signedFile, 
		onSuccess, onError) {
		var pThis = this;

		if (pThis.isFileSyncAPISupported) {
			try {
				var timeInfo = pThis._GetFileSignTimeInfoSync(
					signIndex, signedFile);
				onSuccess(timeInfo);
				return;
			} catch (e) {
				onError(e);
				return;
			}
		} else {
			var _onSuccess = function(fileReaded) {
				try {
					var signTimeInfo = pThis.GetSignTimeInfo(
						signIndex, fileReaded.data);
					onSuccess(signTimeInfo);
				} catch (e) {
					onError(e);
				}
			};

			pThis.ReadFile(signedFile, _onSuccess, onError);
		}
	},
	SignData: function(data, asBase64String) {
		if ((typeof data) == 'string')
			data = this.StringToArray(data);

		this.CheckMaxDataSize(data);

		var pPtr = asBase64String ? 
			EUPointer() : EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUSignData',
				'number',
				['array', 'number', 'number', 'number', 'number'],
				[data, data.length, 
					asBase64String ? pPtr.ptr : 0,
					!asBase64String ? pPtr.ptr : 0,
					!asBase64String ? pPtr.lengthPtr : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return pPtr.toString(true);
		else 
			return pPtr.toArray();
	},
	VerifyData: function(data, sign) {
		if ((typeof data) == 'string')
			data = this.StringToArray(data);

		this.CheckDataStruct(sign);

		this.CheckMaxDataSize(data);
		this.CheckMaxDataSize(sign);

		var isSignStr = ((typeof sign) == 'string');
		var infoPtr = EUPointerSignerInfo();
		var signTimeInfo = null;
		var error;

		try {
			error = Module.ccall('EUVerifyData',
				'number',
				['array', 'number', 
					isSignStr ? 'array' : 'number',
					(!isSignStr) ? 'array' : 'number',
					'number', 'number'],
				[data, data.length,
					isSignStr ? StringToCString(sign) : 0,
					!isSignStr ? sign : 0,
					!isSignStr ? sign.length : 0,
					infoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			infoPtr.free();
			this.RaiseError(error);
		}

		try {
			signTimeInfo = this.GetSignTimeInfo(0, sign);
		} catch (e) {
			infoPtr.free();
			throw e;
		}
		
		var info = new EndUserSignInfo(infoPtr.ptr, 
			data, signTimeInfo);
		infoPtr.free();

		return info;
	},
	VerifyDataOnTimeEx: function(data, signIndex, sign, 
		onTime, offline, noCRL) {
		if ((typeof data) == 'string')
			data = this.StringToArray(data);

		this.CheckDataStruct(sign);

		this.CheckMaxDataSize(data);
		this.CheckMaxDataSize(sign);

		var isSignStr = ((typeof sign) == 'string');
		var onTimePtr = (onTime != null) ? 
			EUPointerSystemtime(onTime) : 0;
		var infoPtr = EUPointerSignerInfo();
		var signTimeInfo = null;
		var error;

		try {
			error = Module.ccall('EUVerifyDataOnTimeEx',
				'number',
				['array', 'number', 'number',
					isSignStr ? 'array' : 'number',
					!isSignStr ? 'array' : 'number', 'number',
					'number', 'number', 'number', 'number'],
				[data, data.length, signIndex,
					isSignStr ? StringToCString(sign) : 0,
					!isSignStr ? sign : 0,
					!isSignStr ? sign.length : 0,
					(onTime != null) ? onTimePtr.ptr : 0, 
					IntFromBool(offline), IntFromBool(noCRL),
					infoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (onTime != null)
			onTimePtr.free();

		if (error != EU_ERROR_NONE) {
			infoPtr.free();
			this.RaiseError(error);
		}

		try {
			signTimeInfo = this.GetSignTimeInfo(signIndex, sign);
		} catch (e) {
			infoPtr.free();
			throw e;
		}
		
		var info = new EndUserSignInfo(infoPtr.ptr, 
			data, signTimeInfo);
		infoPtr.free();

		return info;
	},
	SignDataInternal: function(appendCert, data, asBase64String) {
		if ((typeof data) == 'string')
			data = this.StringToArray(data);

		this.CheckMaxDataSize(data);

		var pPtr = asBase64String ? 
			EUPointer() : EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUSignDataInternal',
				'number',
				['number', 'array', 'number', 
					'number', 'number', 'number'],
				[IntFromBool(appendCert),
					data, data.length, 
					asBase64String ? pPtr.ptr : 0,
					!asBase64String ? pPtr.ptr : 0,
					!asBase64String ? pPtr.lengthPtr : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return pPtr.toString(true);
		else 
			return pPtr.toArray();
	},
	VerifyDataInternal: function(sign) {
		this.CheckMaxDataSize(sign);

		this.CheckDataStruct(sign);

		var isSignStr = ((typeof sign) == 'string');
		var infoPtr = EUPointerSignerInfo();
		var arrPtr = EUPointerArray();
		var signTimeInfo = null;
		var error;

		try {
			error = Module.ccall('EUVerifyDataInternal',
				'number',
				[isSignStr ? 'array' : 'number',
					(!isSignStr) ? 'array' : 'number',
					'number', 'number', 'number', 'number'],
				[isSignStr ? StringToCString(sign) : 0,
					!isSignStr ? sign : 0,
					!isSignStr ? sign.length : 0, 
					arrPtr.ptr, arrPtr.lengthPtr, infoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			infoPtr.free();
			arrPtr.free();
			this.RaiseError(error);
		}

		try {
			signTimeInfo = this.GetSignTimeInfo(0, sign);
		} catch (e) {
			infoPtr.free();
			arrPtr.free();
			throw e;
		}

		var info = new EndUserSignInfo(infoPtr.ptr, 
			arrPtr.toArray(), signTimeInfo);
		infoPtr.free();

		return info;
	},
	VerifyDataInternalOnTimeEx: function(signIndex, sign,
		onTime, offline, noCRL) {
		this.CheckMaxDataSize(sign);

		this.CheckDataStruct(sign);

		var isSignStr = ((typeof sign) == 'string');
		var onTimePtr = (onTime != null) ? 
			EUPointerSystemtime(onTime) : 0;
		var infoPtr = EUPointerSignerInfo();
		var arrPtr = EUPointerArray();
		var signTimeInfo = null;
		var error;

		try {
			error = Module.ccall('EUVerifyDataInternalOnTimeEx',
				'number',
				['number', 
					isSignStr ? 'array' : 'number',
					(!isSignStr) ? 'array' : 'number', 'number',
					'number', 'number', 'number',
					'number', 'number', 'number'],
				[signIndex, isSignStr ? StringToCString(sign) : 0,
					!isSignStr ? sign : 0,
					!isSignStr ? sign.length : 0, 
					(onTime != null) ? onTimePtr.ptr : 0,
					IntFromBool(offline), IntFromBool(noCRL),
					arrPtr.ptr, arrPtr.lengthPtr, infoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (onTime != null)
			onTimePtr.free();

		if (error != EU_ERROR_NONE) {
			infoPtr.free();
			arrPtr.free();
			this.RaiseError(error);
		}
		
		try {
			signTimeInfo = this.GetSignTimeInfo(signIndex, sign);
		} catch (e) {
			infoPtr.free();
			arrPtr.free();
			throw e;
		}

		var info = new EndUserSignInfo(infoPtr.ptr, 
			arrPtr.toArray(), signTimeInfo);
		infoPtr.free();

		return info;
	},
	SignHash: function (hash, asBase64String) {
		this.CheckMaxDataSize(hash);

		var isHashStr = ((typeof hash) == 'string');
		var pPtr = asBase64String ? 
			EUPointer() : EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUSignHash',
				'number',
				[isHashStr ? 'array' : 'number',
					!isHashStr ? 'array' : 'number', 'number', 
					'number', 'number', 'number'],
				[isHashStr ? StringToCString(hash) : 0, 
					!isHashStr ? hash : 0, 
					!isHashStr ? hash.length : 0, 
					asBase64String ? pPtr.ptr : 0,
					!asBase64String ? pPtr.ptr : 0,
					!asBase64String ? pPtr.lengthPtr : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return pPtr.toString(true);
		else 
			return pPtr.toArray();
	},
	VerifyHash: function (hash, sign) {
		this.CheckMaxDataSize(hash);
		this.CheckMaxDataSize(sign);

		this.CheckDataStruct(sign);

		var isHashStr = ((typeof hash) == 'string');
		var isSignStr = ((typeof sign) == 'string');
		var infoPtr = EUPointerSignerInfo();
		var signTimeInfo = null;
		var error;

		try {
			error = Module.ccall('EUVerifyHash',
				'number',
				[isHashStr ? 'array' : 'number',
					!isHashStr ? 'array' : 'number', 'number',
					isSignStr ? 'array' : 'number',
					!isSignStr ? 'array' : 'number',
					'number', 'number'],
				[isHashStr ? StringToCString(hash) : 0, 
					!isHashStr ? hash : 0, 
					!isHashStr ? hash.length : 0,
					isSignStr ? StringToCString(sign) : 0,
					!isSignStr ? sign : 0,
					!isSignStr ? sign.length : 0,
					infoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			infoPtr.free();
			this.RaiseError(error);
		}

		try {
			signTimeInfo = this.GetSignTimeInfo(0, sign);
		} catch (e) {
			infoPtr.free();
			throw e;
		}

		var info = new EndUserSignInfo(infoPtr.ptr, 
			null, signTimeInfo);
		infoPtr.free();

		return info;
	},
	VerifyHashOnTimeEx: function (hash, signIndex, sign, 
		onTime, offline, noCRL) {
		this.CheckMaxDataSize(hash);
		this.CheckMaxDataSize(sign);

		this.CheckDataStruct(sign);
		
		var isHashStr = ((typeof hash) == 'string');
		var isSignStr = ((typeof sign) == 'string');
		var infoPtr = EUPointerSignerInfo();
		var onTimePtr = (onTime != null) ? 
			EUPointerSystemtime(onTime) : 0;
		var signTimeInfo = null;
		var error;

		try {
			error = Module.ccall('EUVerifyHashOnTimeEx',
				'number',
				[isHashStr ? 'array' : 'number',
					!isHashStr ? 'array' : 'number', 'number',
					'number',
					isSignStr ? 'array' : 'number',
					!isSignStr ? 'array' : 'number', 'number', 
					'number', 'number', 'number', 'number'],
				[isHashStr ? StringToCString(hash) : 0, 
					!isHashStr ? hash : 0, 
					!isHashStr ? hash.length : 0,
					signIndex,
					isSignStr ? StringToCString(sign) : 0,
					!isSignStr ? sign : 0,
					!isSignStr ? sign.length : 0,
					(onTime != null) ? onTimePtr.ptr : 0,
					IntFromBool(offline), IntFromBool(noCRL),
					infoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (onTime != null)
			onTimePtr.free();

		if (error != EU_ERROR_NONE) {
			infoPtr.free();
			this.RaiseError(error);
		}

		try {
			signTimeInfo = this.GetSignTimeInfo(signIndex, sign);
		} catch (e) {
			infoPtr.free();
			throw e;
		}

		var info = new EndUserSignInfo(infoPtr.ptr, 
			null, signTimeInfo);
		infoPtr.free();

		return info;
	},
	SignHashRSA: function (hash, asBase64String) {
		this.CheckMaxDataSize(hash);

		var isHashStr = ((typeof hash) == 'string');
		var pPtr = asBase64String ? 
			EUPointer() : EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUSignHashRSA',
				'number',
				[isHashStr ? 'array' : 'number',
					!isHashStr ? 'array' : 'number', 'number', 
					'number', 'number', 'number'],
				[isHashStr ? StringToCString(hash) : 0, 
					!isHashStr ? hash : 0, 
					!isHashStr ? hash.length : 0, 
					asBase64String ? pPtr.ptr : 0,
					!asBase64String ? pPtr.ptr : 0,
					!asBase64String ? pPtr.lengthPtr : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return pPtr.toString(true);
		else 
			return pPtr.toArray();
	},
	SignDataRSA: function(data, appendCert, 
		externalSgn, asBase64String) {
		if ((typeof data) == 'string')
			data = this.StringToArray(data);

		this.CheckMaxDataSize(data);

		var pPtr = asBase64String ? 
			EUPointer() : EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUSignDataRSA',
				'number',
				['array', 'number', 'number', 'number', 
					'number', 'number', 'number'],
				[data, data.length, 
					IntFromBool(appendCert),
					IntFromBool(externalSgn),
					asBase64String ? pPtr.ptr : 0,
					!asBase64String ? pPtr.ptr : 0,
					!asBase64String ? pPtr.lengthPtr : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return pPtr.toString(true);
		else 
			return pPtr.toArray();
	},
	IsDataInSignedFileAvailable: function(signedFile, onSuccess, onError) {
		var pThis = this;

		if (pThis.isFileSyncAPISupported) {
			if (!EUFS.link(signedFile)) {
				onError(pThis.MakeError(EU_ERROR_JS_READ_FILE));
				return;
			}

			var intPtr = EUPointerInt();
			var error;

			try {
				error = Module.ccall('EUIsDataInSignedFileAvailable',
					'number',
					['array', 'number'],
					[UTF8ToCP1251Array(EUFS.getFilePath(signedFile)),
						intPtr.ptr]);
			} catch (e) {
				error = EU_ERROR_UNKNOWN;
			}

			if (error != EU_ERROR_NONE) {
				intPtr.free();
				EUFS.unlink(signedFile);

				onError(pThis.MakeError(error));
				return;
			}

			EUFS.unlink(signedFile);

			onSuccess(intPtr.toBoolean());
		} else {
			var _onSuccess = function(fileReaded) {
				try {
					var isAvailable = pThis.IsDataInSignedDataAvailable(
						fileReaded.data);
					onSuccess(isAvailable);
				} catch (e) {
					onError(e);
				}
			};

			pThis.ReadFile(signedFile, _onSuccess, onError);
		}
	},
	GetDataFromSignedFile: function(signedFile, onSuccess, onError) {
		var pThis = this;

		if (pThis.isFileSyncAPISupported) {
			var file = signedFile.name + MakeUID(10);

			if (!EUFS.link(signedFile)) {
				onError(pThis.MakeError(EU_ERROR_JS_READ_FILE));
				return;
			} 

			if (!EUFS.link(file)) {
				EUFS.unlink(signedFile);

				onError(pThis.MakeError(EU_ERROR_JS_READ_FILE));
				return;
			} 

			var error;

			try {
				error = Module.ccall('EUGetDataFromSignedFile',
					'number',
					['array', 'array'],
					[UTF8ToCP1251Array(EUFS.getFilePath(signedFile)),
						UTF8ToCP1251Array(EUFS.getFilePath(file))]);
			} catch (e) {
				error = EU_ERROR_UNKNOWN;
			}

			if (error != EU_ERROR_NONE) {
				EUFS.unlink(file);
				EUFS.unlink(signedFile);

				onError(pThis.MakeError(error));
				return;
			}

			var data = EUFS.readFileAsUint8Array(file);

			EUFS.unlink(file);
			EUFS.unlink(signedFile);

			onSuccess(data);
		} else {
			var _onSuccess = function(fileReaded) {
				try {
					var data = pThis.GetDataFromSignedData(
						fileReaded.data);

					onSuccess(data);
				} catch (e) {
					onError(e);
				}
			};

			pThis.ReadFile(signedFile, _onSuccess, onError);
		}
	},
	VerifyFileWithExternalSign: function(file, fileWithSign, onSuccess, onError) {
		var pThis = this;

		if (pThis.isFileSyncAPISupported) {
			if (!EUFS.link(file)) {
				onError(pThis.MakeError(EU_ERROR_JS_READ_FILE));
				return;
			}

			if (!EUFS.link(fileWithSign)) {
				EUFS.unlink(file);

				onError(pThis.MakeError(EU_ERROR_JS_READ_FILE));
				return;
			}

			var infoPtr = EUPointerSignerInfo();
			var timeInfo = null;
			var error;

			try {
				error = Module.ccall('EUCheckFileStruct',
					'number',
					['array'],
					[UTF8ToCP1251Array(EUFS.getFilePath(fileWithSign))]);
				if (error == EU_ERROR_NONE) {
					error = Module.ccall('EUVerifyFile',
						'number',
						['array', 'array', 'number'],
						[UTF8ToCP1251Array(EUFS.getFilePath(fileWithSign)), 
							UTF8ToCP1251Array(EUFS.getFilePath(file)), infoPtr.ptr]);
				}
			} catch (e) {
				error = EU_ERROR_UNKNOWN;
			}

			if (error != EU_ERROR_NONE) {
				EUFS.unlink(fileWithSign);
				EUFS.unlink(file);

				onError(pThis.MakeError(error));
				return;
			}

			EUFS.unlink(fileWithSign);
			EUFS.unlink(file);

			try {
				timeInfo = pThis._GetFileSignTimeInfoSync(
					0, fileWithSign);
			} catch (e) {
				onError(e);
				return;
			}

			var info = new EndUserSignInfo(infoPtr.ptr, 
				null, timeInfo);
			infoPtr.free();

			onSuccess(info);
		} else {
			var _onSuccess= function(files) {
				try {
					var info = pThis.VerifyData(
						files[0].data, files[1].data);
					info.data = null;

					onSuccess(info);
				} catch (e) {
					onError(e);
				}
			};

			pThis.ReadFiles([file, fileWithSign], 
				_onSuccess, onError);
		}
	},
	VerifyFileWithInternalSign: function(signedFile, dataFile, onSuccess, onError) {
		var pThis = this;

		if (pThis.isFileSyncAPISupported) {
			var file;

			file = (dataFile != null) ? 
				dataFile : 
				(signedFile.name + MakeUID(10));

			if (!EUFS.link(file, (dataFile == null))) {
				onError(pThis.MakeError(EU_ERROR_JS_READ_FILE));
				return;
			}

			if (!EUFS.link(signedFile)) {
				EUFS.unlink(file);

				onError(pThis.MakeError(EU_ERROR_JS_READ_FILE));
				return;
			}

			var infoPtr = EUPointerSignerInfo();
			var timeInfo;
			var error;

			try {
				error = Module.ccall('EUCheckFileStruct',
					'number',
					['array'],
					[UTF8ToCP1251Array(EUFS.getFilePath(signedFile))]);
				if (error == EU_ERROR_NONE) {
					error = Module.ccall('EUVerifyFile',
						'number',
						['array', 'array', 'number'],
						[UTF8ToCP1251Array(EUFS.getFilePath(signedFile)),
							UTF8ToCP1251Array(EUFS.getFilePath(file)),
							infoPtr.ptr]);
				}
			} catch (e) {
				error = EU_ERROR_UNKNOWN;
			}

			if (error != EU_ERROR_NONE) {
				EUFS.unlink(signedFile);
				EUFS.unlink(file);

				onError(pThis.MakeError(error));
				return;
			}

			var data = (dataFile != null) ?
				EUFS.readFileAsUint8Array(file) :
				null;

			EUFS.unlink(file);
			EUFS.unlink(signedFile);

			try {
				timeInfo = pThis._GetFileSignTimeInfoSync(
					0, signedFile);
			} catch (e) {
				onError(e);
				return;
			}

			var info = new EndUserSignInfo(infoPtr.ptr, 
				data, timeInfo);
			infoPtr.free();

			onSuccess(info);
		} else {
			var _onSuccess = function(fileReaded) {
				try {
					var info = pThis.VerifyDataInternal(fileReaded.data);
					
					if (dataFile == null)
						info.data = null;

					onSuccess(info);
				} catch (e) {
					onError(e);
				}
			};

			pThis.ReadFile(signedFile, _onSuccess, onError);
		}
	},
	VerifyFileOnTimeEx: function(signIndex, fileWithSign, 
		file, onTime, offline, noCRL, onSuccess, onError) {
		var pThis = this;

		var internal = (file == null) || (typeof file === 'string');

		if (pThis.isFileSyncAPISupported) {
			var dataFile = (file != null) ?
				file :
				(fileWithSign.name + MakeUID(10));
			
			if (internal) {
				if (!EUFS.link(dataFile, (file == null))) {
					onError(pThis.MakeError(EU_ERROR_JS_READ_FILE));
					return;
				}
			} else {
				if (!EUFS.link(dataFile)) {
					onError(pThis.MakeError(EU_ERROR_JS_READ_FILE));
					return;
				}
			}

			if (!EUFS.link(fileWithSign)) {
				EUFS.unlink(dataFile);

				onError(pThis.MakeError(EU_ERROR_JS_READ_FILE));
				return;
			}

			var onTimePtr = (onTime != null) ? 
				EUPointerSystemtime(onTime) : 0;
			var infoPtr = EUPointerSignerInfo();
			var timeInfo;
			var error;

			try {
				error = Module.ccall('EUCheckFileStruct',
					'number',
					['array'],
					[UTF8ToCP1251Array(EUFS.getFilePath(fileWithSign))]);
				if (error == EU_ERROR_NONE) {
					error = Module.ccall('EUVerifyFileOnTimeEx',
						'number',
						['number', 'array', 'array', 
						'number', 'number', 'number',
						'number'],
						[signIndex, 
							UTF8ToCP1251Array(EUFS.getFilePath(fileWithSign)), 
							UTF8ToCP1251Array(EUFS.getFilePath(dataFile)),
							(onTime != null) ? onTimePtr.ptr : 0,
							IntFromBool(offline), IntFromBool(noCRL),
							infoPtr.ptr]);
				}
			} catch (e) {
				error = EU_ERROR_UNKNOWN;
			}

			if (onTime != null)
				onTimePtr.free();
			
			if (error != EU_ERROR_NONE) {
				EUFS.unlink(fileWithSign);
				EUFS.unlink(dataFile);

				onError(pThis.MakeError(error));
				return;
			}

			var data = (internal && (file != null)) ?
				EUFS.readFileAsUint8Array(dataFile) :
				null;

			EUFS.unlink(fileWithSign);
			EUFS.unlink(dataFile);
			
			try {
				timeInfo = pThis._GetFileSignTimeInfoSync(
					signIndex, fileWithSign);
			} catch (e) {
				onError(e);
				return;
			}

			var info = new EndUserSignInfo(infoPtr.ptr, 
				data, timeInfo);
			infoPtr.free();

			onSuccess(info);
		} else {
			var _onSuccess= function(files) {
				try {
					var info;

					if (internal) {
						info = pThis.VerifyDataInternalOnTimeEx(
							signIndex, files[0].data,
							onTime, offline, noCRL);
						if (file == null)
							info.data = null;
					} else {
						info = pThis.VerifyDataOnTimeEx(
							files[0].data, signIndex, files[1].data,
							onTime, offline, noCRL);
						info.data = null;
					}

					onSuccess(info);
				} catch (e) {
					onError(e);
				}
			};

			var files = [];
			if (!internal)
				files.push(file);
			files.push(fileWithSign);

			pThis.ReadFiles(files, 
				_onSuccess, onError);
		}
	},
	CreateEmptySign: function (data, asBase64String) {
		var isInternalSign = (data != null);
		if (isInternalSign)
			this.CheckMaxDataSize(data);
		if (isInternalSign) {
			if ((typeof data) == 'string')
				data = this.StringToArray(data);
		}

		var signPtr = asBase64String ? 
			EUPointer() : EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUCreateEmptySign',
				'number',
				[isInternalSign ? 'array' : 'number', 'number',
					'number', 'number', 'number'],
				[isInternalSign ? data : 0, 
					isInternalSign ? data.length : 0,
					asBase64String ? signPtr.ptr : 0,
					!asBase64String ? signPtr.ptr : 0,
					!asBase64String ? signPtr.lengthPtr : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			signPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return signPtr.toString(true);
		else
			return signPtr.toArray();
	},
	CreateSigner: function (hash, asBase64String) {
		this.CheckMaxDataSize(hash);

		var isHashStr = ((typeof hash) == 'string');
		var signerPtr = asBase64String ? 
			EUPointer() : EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUCreateSigner',
				'number',
				[isHashStr ? 'array' : 'number', 
					!isHashStr ? 'array' : 'number', 'number',
					'number', 'number', 'number'],
				[isHashStr ? StringToCString(hash) : 0, 
					!isHashStr ? hash : 0,
					!isHashStr ? hash.length : 0,
					asBase64String ? signerPtr.ptr : 0,
					!asBase64String ? signerPtr.ptr : 0,
					!asBase64String ? signerPtr.lengthPtr : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			signerPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return signerPtr.toString(true);
		else
			return signerPtr.toArray();
	},
	CreateSignerBeginEx: function (signerCert, 
		hash, noSigningTime, noContentTimeStamp) {
		this.CheckMaxDataSize(signerCert);
		this.CheckMaxDataSize(hash);

		if ((typeof hash) == 'string')
			hash = this.Base64Decode(hash);

		var pSignerPtr = EUPointerArray();
		var pAttrsHashPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUCreateSignerBeginEx',
				'number',
				['array', 'number', 'array', 'number',
					'number', 'number',
					'number', 'number', 'number', 'number'],
				[signerCert, signerCert.length, hash, hash.length,
					IntFromBool(noSigningTime),
					IntFromBool(noContentTimeStamp),
					pSignerPtr.ptr, pSignerPtr.lengthPtr,
					pAttrsHashPtr.ptr, pAttrsHashPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pSignerPtr.free();
			pAttrsHashPtr.free();
			this.RaiseError(error);
		}

		return new EndUserSigner(
			pSignerPtr.toArray(), pAttrsHashPtr.toArray());
	},
	CreateSignerEnd: function (
		unsignedSigner, signature, asBase64String) {
		this.CheckMaxDataSize(unsignedSigner);
		this.CheckMaxDataSize(signature);

		if ((typeof unsignedSigner) == 'string')
			unsignedSigner = this.Base64Decode(unsignedSigner);

		if ((typeof signature) == 'string')
			signature = this.Base64Decode(signature);

		var pPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUCreateSignerEnd',
				'number',
				['array', 'number', 'array', 'number',
					'number', 'number'],
				[unsignedSigner, unsignedSigner.length,
					signature, signature.length,
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	AppendSigner: function (signer, certificate, prevSign, asBase64String) {
		this.CheckMaxDataSize(signer);
		if (certificate != null)
			this.CheckMaxDataSize(certificate);
		this.CheckMaxDataSize(prevSign);

		var isSignerStr = ((typeof signer) == 'string');
		var isPrevSignStr = ((typeof prevSign) == 'string');
		var signPtr = asBase64String ? 
			EUPointer() : EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUAppendSigner',
				'number',
				[isSignerStr ? 'array' : 'number',
					!isSignerStr ? 'array' : 'number', 'number',
					certificate != null ? 'array' : 'number', 'number',
					isPrevSignStr ? 'array' : 'number', 
					!isPrevSignStr ? 'array' : 'numer', 'number',
					'number', 'number', 'number'],
				[isSignerStr ? StringToCString(signer) : 0, 
					!isSignerStr ? signer : 0,
					!isSignerStr ? signer.length : 0,
					(certificate != null) ? certificate : 0,
					(certificate != null) ? certificate.length : 0,
					isPrevSignStr ? StringToCString(prevSign) : 0, 
					!isPrevSignStr ? prevSign : 0,
					!isPrevSignStr ? prevSign.length : 0,
					asBase64String ? signPtr.ptr : 0,
					!asBase64String ? signPtr.ptr : 0,
					!asBase64String ? signPtr.lengthPtr : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			signPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return signPtr.toString(true);
		else
			return signPtr.toArray();
	},
	GetSigner: function(signIndex, sign, asBase64String) {
		this.CheckMaxDataSize(sign);

		var isSignStr = ((typeof sign) == 'string');
		var signerPtr = asBase64String ? 
			EUPointer() : EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUGetSigner',
				'number',
				['number', 
					isSignStr ? 'array' : 'number', 
					!isSignStr ? 'array' : 'number', 'number',
					'number', 'number', 'number'],
				[signIndex, 
					isSignStr ? StringToCString(sign) : 0,
					!isSignStr ? sign : 0,
					!isSignStr ? sign.length : 0,
					asBase64String ? signerPtr.ptr : 0,
					!asBase64String ? signerPtr.ptr : 0,
					!asBase64String ? signerPtr.lengthPtr : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			signerPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return signerPtr.toString(true);
		else
			return signerPtr.toArray();
	},
	AppendValidationDataToSigner: function (prevSigner, certificate, asBase64String) {
		this.CheckMaxDataSize(prevSigner);
		if (certificate != null)
			this.CheckMaxDataSize(certificate);

		var isPrevSignerStr = ((typeof prevSigner) == 'string');
		var signerPtr = asBase64String ? 
			EUPointer() : EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUAppendValidationDataToSigner',
				'number',
				[isPrevSignerStr ? 'array' : 'number',
					!isPrevSignerStr ? 'array' : 'number', 'number',
					certificate != null ? 'array' : 'number', 'number', 
					'number', 'number', 'number'],
				[isPrevSignerStr ? StringToCString(prevSigner) : 0, 
					!isPrevSignerStr ? prevSigner : 0,
					!isPrevSignerStr ? prevSigner.length : 0,
					(certificate != null) ? certificate : 0,
					(certificate != null) ? certificate.length : 0,
					asBase64String ? signerPtr.ptr : 0,
					!asBase64String ? signerPtr.ptr : 0,
					!asBase64String ? signerPtr.lengthPtr : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			signerPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return signerPtr.toString(true);
		else
			return signerPtr.toArray();
	},
	RawSignData: function(data, asBase64String) {
		if ((typeof data) == 'string')
			data = this.StringToArray(data);

		this.CheckMaxDataSize(data);

		var pPtr = asBase64String ? 
			EUPointer() : EUPointerArray();
		var error;

		try {
			error = Module.ccall('EURawSignData',
				'number',
				['array', 'number', 'number', 'number', 'number'],
				[data, data.length, 
					asBase64String ? pPtr.ptr : 0,
					!asBase64String ? pPtr.ptr : 0,
					!asBase64String ? pPtr.lengthPtr : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return pPtr.toString(true);
		else 
			return pPtr.toArray();
	},
	RawVerifyDataEx: function(cert, data, sign) {
		if ((typeof data) == 'string')
			data = this.StringToArray(data);

		if (cert != null)
			this.CheckMaxDataSize(cert);

		this.CheckMaxDataSize(data);
		this.CheckMaxDataSize(sign);

		var isSignStr = ((typeof sign) == 'string');
		var infoPtr = EUPointerSignerInfo();
		var error;

		try {
			error = Module.ccall('EURawVerifyDataEx',
				'number',
				[cert ? 'array' : 'numer', 'number',
					'array', 'number', 
					isSignStr ? 'array' : 'number',
					!isSignStr ? 'array' : 'number',
					'number', 'number'],
				[(cert != null) ? cert : 0,
					(cert != null) ? cert.length : 0, 
					data, data.length,
					isSignStr ? StringToCString(sign) : 0,
					!isSignStr ? sign : 0,
					!isSignStr ? sign.length : 0,
					infoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			infoPtr.free();
			this.RaiseError(error);
		}

		var info = new EndUserSignInfo(infoPtr.ptr, data);
		infoPtr.free();

		return info;
	},
	RawSignHash: function (hash, asBase64String) {
		this.CheckMaxDataSize(hash);

		var isHashStr = ((typeof hash) == 'string');
		var pPtr = asBase64String ? 
			EUPointer() : EUPointerArray();
		var error;

		try {
			error = Module.ccall('EURawSignHash',
				'number',
				[isHashStr ? 'array' : 'number',
					!isHashStr ? 'array' : 'number', 'number', 
					'number', 'number', 'number'],
				[isHashStr ? StringToCString(hash) : 0, 
					!isHashStr ? hash : 0, 
					!isHashStr ? hash.length : 0, 
					asBase64String ? pPtr.ptr : 0,
					!asBase64String ? pPtr.ptr : 0,
					!asBase64String ? pPtr.lengthPtr : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return pPtr.toString(true);
		else 
			return pPtr.toArray();
	},
	RawVerifyHash: function (hash, sign) {
		this.CheckMaxDataSize(hash);
		this.CheckMaxDataSize(sign);

		var isHashStr = ((typeof hash) == 'string');
		var isSignStr = ((typeof sign) == 'string');
		var infoPtr = EUPointerSignerInfo();
		var error;

		try {
			error = Module.ccall('EURawVerifyHash',
				'number',
				[isHashStr ? 'array' : 'number',
					!isHashStr ? 'array' : 'number', 'number',
					isSignStr ? 'array' : 'number', 
					!isSignStr ? 'array' : 'number', 'number', 'number'],
				[isHashStr ? StringToCString(hash) : 0, 
					!isHashStr ? hash : 0, 
					!isHashStr ? hash.length : 0,
					isSignStr ? StringToCString(sign) : 0,
					!isSignStr ? sign : 0,
					!isSignStr ? sign.length : 0,
					infoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			infoPtr.free();
			this.RaiseError(error);
		}

		var info = new EndUserSignInfo(infoPtr.ptr, null);
		infoPtr.free();

		return info;
	},
	CtxSignHash: function (privateKeyContext, signAlgo, 
		hashContext, appendCert, asBase64String) {
		var pPtr = EUPointerArray(
			privateKeyContext.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxSignHash',
				'number',
				['number', 'number', 'number', 'number',
					'number', 'number'],
				[privateKeyContext.GetContext(), signAlgo,
					hashContext.GetContext(), 
					IntFromBool(appendCert),
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	CtxVerifyHash: function (hashContext, signIndex, sign) {
		this.CheckDataStruct(sign);

		this.CheckMaxDataSize(sign);

		if ((typeof sign) == 'string')
			sign = this.Base64Decode(sign);

		var infoPtr = EUPointerSignerInfo(
			hashContext.GetContext());
		var signTimeInfo = null;
		var error;

		try {
			error = Module.ccall('EUCtxVerifyHash',
				'number',
				['number', 'number', 'array', 'number', 'number'],
				[hashContext.GetContext(), signIndex,
					sign, sign.length, infoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			infoPtr.free();
			this.RaiseError(error);
		}

		try {
			signTimeInfo = this.GetSignTimeInfo(signIndex, sign);
		} catch (e) {
			infoPtr.free();
			throw e;
		}
		
		var info = new EndUserSignInfo(infoPtr.ptr, 
			null, signTimeInfo);
		infoPtr.free();

		return info;
	},
	CtxSignHashValue: function (privateKeyContext, signAlgo, 
		hash, appendCert, asBase64String) {
		if ((typeof hash) == 'string')
			hash = this.Base64Decode(hash);

		var pPtr = EUPointerArray(
			privateKeyContext.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxSignHashValue',
				'number',
				['number', 'number', 'array', 'number', 'number',
					'number', 'number'],
				[privateKeyContext.GetContext(), signAlgo,
					hash, hash.length, IntFromBool(appendCert),
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	CtxVerifyHashValue: function (context, hash, signIndex, sign) {
		this.CheckDataStruct(sign);
		
		this.CheckMaxDataSize(hash);
		this.CheckMaxDataSize(sign);

		if ((typeof hash) == 'string')
			hash = this.Base64Decode(hash);

		if ((typeof sign) == 'string')
			sign = this.Base64Decode(sign);

		var infoPtr = EUPointerSignerInfo(context.GetContext());
		var signTimeInfo = null;
		var error;

		try {
			error = Module.ccall('EUCtxVerifyHashValue',
				'number',
				['number', 'array', 'number', 'number',
					'array', 'number', 'number'],
				[context.GetContext(), hash, hash.length, signIndex,
					sign, sign.length, infoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			infoPtr.free();
			this.RaiseError(error);
		}

		try {
			signTimeInfo = this.GetSignTimeInfo(signIndex, sign);
		} catch (e) {
			infoPtr.free();
			throw e;
		}
		
		var info = new EndUserSignInfo(infoPtr.ptr, 
			null, signTimeInfo);
		infoPtr.free();

		return info;
	},
	CtxSignData: function(privateKeyContext, signAlgo, 
		data, external, appendCert, asBase64String) {
		if ((typeof data) == 'string')
			data = this.StringToArray(data);

		this.CheckMaxDataSize(data);

		var pPtr = EUPointerArray(
			privateKeyContext.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxSignData',
				'number',
				['number', 'number', 'array', 'number',
					'number', 'number', 'number', 'number'],
				[privateKeyContext.GetContext(), signAlgo,
					data, data.length, IntFromBool(external),
					IntFromBool(appendCert),
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	CtxVerifyData: function(context, data, signIndex, sign) {
		if ((typeof data) == 'string')
			data = this.StringToArray(data);

		this.CheckDataStruct(sign);

		this.CheckMaxDataSize(data);
		this.CheckMaxDataSize(sign);

		if ((typeof sign) == 'string')
			sign = this.Base64Decode(sign);

		var infoPtr = EUPointerSignerInfo(context.GetContext());
		var signTimeInfo = null;
		var error;

		try {
			error = Module.ccall('EUCtxVerifyData',
				'number',
				['number', 'array', 'number', 
					'number', 'array', 'number', 'number'],
				[context.GetContext(), data, data.length,
					signIndex, sign, sign.length,
					infoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			infoPtr.free();
			this.RaiseError(error);
		}

		try {
			signTimeInfo = this.GetSignTimeInfo(signIndex, sign);
		} catch (e) {
			infoPtr.free();
			throw e;
		}
		
		var info = new EndUserSignInfo(infoPtr.ptr, 
			data, signTimeInfo);
		infoPtr.free();

		return info;
	},
	CtxVerifyDataInternal: function(context, signIndex, sign) {
		this.CheckMaxDataSize(sign);

		if ((typeof sign) == 'string')
			sign = this.Base64Decode(sign);

		this.CheckDataStruct(sign);

		var arrPtr = EUPointerArray(context.GetContext());
		var infoPtr = EUPointerSignerInfo(context.GetContext());
		var signTimeInfo = null;
		var error;

		try {
			error = Module.ccall('EUCtxVerifyDataInternal',
				'number',
				['number', 'number', 'array', 'number',
					'number', 'number', 'number'],
				[context.GetContext(), signIndex, sign, sign.length,
					arrPtr.ptr, arrPtr.lengthPtr, infoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			arrPtr.free();
			infoPtr.free();
			this.RaiseError(error);
		}

		try {
			signTimeInfo = this.GetSignTimeInfo(signIndex, sign);
		} catch (e) {
			arrPtr.free();
			infoPtr.free();
			throw e;
		}
		
		var info = new EndUserSignInfo(infoPtr.ptr, 
			arrPtr.toArray(), signTimeInfo);
		infoPtr.free();

		return info;
	},
	CtxSignFile: function(privateKeyContext, signAlgo, 
		file, external, appendCert, fileWithSign, 
		onSuccess, onError) {
		var pThis = this;

		if (pThis.isFileSyncAPISupported) {
			var signFile;

			signFile = (fileWithSign != null) ? 
				fileWithSign : 
				(file.name + MakeUID(10));

			if (!EUFS.link(signFile, (signFile == null))) {
				onError(pThis.MakeError(EU_ERROR_JS_READ_FILE));
				return;
			}

			if (!EUFS.link(file)) {
				EUFS.unlink(signFile);

				onError(pThis.MakeError(EU_ERROR_JS_READ_FILE));
				return;
			}

			var error;

			try {
				error = Module.ccall('EUCtxSignFile',
					'number',
					['number', 'number', 'array', 
						'number', 'number', 'array'],
					[privateKeyContext.GetContext(), signAlgo,
						UTF8ToCP1251Array(EUFS.getFilePath(file)),
						IntFromBool(external), IntFromBool(appendCert),
						UTF8ToCP1251Array(EUFS.getFilePath(signFile))]);
			} catch (e) {
				error = EU_ERROR_UNKNOWN;
			}

			if (error != EU_ERROR_NONE) {
				EUFS.unlink(file);
				EUFS.unlink(signFile);

				onError(pThis.MakeError(error));
				return;
			}

			var sign = (file != null) ?
				EUFS.readFileAsUint8Array(signFile) :
				null;

			EUFS.unlink(signFile);
			EUFS.unlink(file);

			onSuccess(sign);
		} else {
			var _onSuccess = function(fileReaded) {
				try {
					var signedData; 

					signedData = pThis.CtxSignData(
						privateKeyContext, signAlgo, 
						fileReaded.data, external, appendCert);

					onSuccess(signedData);
				} catch (e) {
					onError(e);
				}
			};

			pThis.ReadFile(file, _onSuccess, onError);
		}
	},
	CtxIsAlreadySigned: function(privateKeyContext, signAlgo, sign) {
		this.CheckMaxDataSize(sign);

		if ((typeof sign) == 'string')
			sign = this.Base64Decode(sign);

		var intPtr = EUPointerInt();
		var error;

		try {
			error = Module.ccall('EUCtxIsAlreadySigned',
				'number',
				['number', 'number', 'array', 'number', 'number'],
				[privateKeyContext.GetContext(), signAlgo,
					sign, sign.length, intPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			intPtr.free();
			this.RaiseError(error);
		}

		return intPtr.toBoolean();
	},
	CtxAppendSignHash: function (privateKeyContext, signAlgo, 
		hashContext, previousSign, appendCert, asBase64String) {
		this.CheckMaxDataSize(previousSign);

		if ((typeof previousSign) == 'string')
			previousSign = this.Base64Decode(previousSign);

		this.CheckDataStruct(previousSign);

		var pPtr = EUPointerArray(
			privateKeyContext.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxAppendSignHash',
				'number',
				['number', 'number', 'number', 'array', 'number',
					'number', 'number', 'number'],
				[privateKeyContext.GetContext(), signAlgo,
					hashContext.GetContext(),
					previousSign, previousSign.length,
					IntFromBool(appendCert),
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	CtxAppendSignHashValue: function (privateKeyContext, signAlgo, 
		hash, previousSign, appendCert, asBase64String) {
		this.CheckMaxDataSize(hash);
		this.CheckMaxDataSize(previousSign);

		if ((typeof hash) == 'string')
			hash = this.Base64Decode(hash);

		if ((typeof previousSign) == 'string')
			previousSign = this.Base64Decode(previousSign);

		this.CheckDataStruct(previousSign);

		var pPtr = EUPointerArray(privateKeyContext.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxAppendSignHashValue',
				'number',
				['number', 'number', 'array', 'number', 
					'array', 'number', 'number', 'number', 'number'],
				[privateKeyContext.GetContext(), signAlgo,
					hash, hash.length, 
					previousSign, previousSign.length, 
					IntFromBool(appendCert),
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	CtxAppendSign: function(privateKeyContext, signAlgo, 
		data, previousSign, appendCert, asBase64String) {
		if ((data != null) && (typeof data) == 'string')
			data = this.StringToArray(data);

		if (data != null)
			this.CheckMaxDataSize(data);
		this.CheckMaxDataSize(previousSign);

		if ((typeof previousSign) == 'string')
			previousSign = this.Base64Decode(previousSign);

		this.CheckDataStruct(previousSign);

		var pPtr = EUPointerArray(privateKeyContext.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxAppendSign',
				'number',
				['number', 'number', 
					data ? 'array' : 'number', 'number',
					'array', 'number', 'number', 'number', 'number'],
				[privateKeyContext.GetContext(), signAlgo,
					(data != null) ? data : 0,
					(data != null) ? data.length : 0,
					previousSign, previousSign.length,
					IntFromBool(appendCert),
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	CtxCreateEmptySign: function(context, signAlgo, 
		data, certificate, asBase64String) {
		if ((data != null) && (typeof data) == 'string')
			data = this.StringToArray(data);

		if (data != null)
			this.CheckMaxDataSize(data);
		this.CheckMaxDataSize(certificate);

		var pPtr = EUPointerArray(context.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxCreateEmptySign',
				'number',
				['number', 'number', 
					data ? 'array' : 'number', 'number',
					'array', 'number', 'number', 'number'],
				[context.GetContext(), signAlgo,
					(data != null) ? data : 0,
					(data != null) ? data.length : 0,
					certificate, certificate.length,
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	CtxCreateSigner: function(privateKeyContext, signAlgo, 
		hash, asBase64String) {
		this.CheckMaxDataSize(hash);

		if ((typeof hash) == 'string')
			hash = this.Base64Decode(hash);

		var pPtr = EUPointerArray(privateKeyContext.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxCreateSigner',
				'number',
				['number', 'number', 'array', 'number',
					'number', 'number'],
				[privateKeyContext.GetContext(), signAlgo,
					hash, hash.length,
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	CtxAppendSigner: function(context, signAlgo, 
		signer, certificate, previousSign, asBase64String) {
		this.CheckMaxDataSize(signer);
		if (certificate != null)
			this.CheckMaxDataSize(certificate);
		this.CheckMaxDataSize(previousSign);

		if ((typeof signer) == 'string')
			signer = this.Base64Decode(signer);

		if ((typeof previousSign) == 'string')
			previousSign = this.Base64Decode(previousSign);

		var pPtr = EUPointerArray(context.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxAppendSigner',
				'number',
				['number', 'number', 'array', 'number',
					certificate != null ? 'array' : 'number',
					'number', 'array', 'number',
					'number', 'number'],
				[context.GetContext(), signAlgo,
					signer, signer.length,
					(certificate != null) ? certificate : 0,
					(certificate != null) ? certificate.length : 0,
					previousSign, previousSign.length,
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	CtxGetSignValue: function(privateKeyContext, signAlgo, 
		hash, asBase64String) {
		this.CheckMaxDataSize(hash);

		if ((typeof hash) == 'string')
			hash = this.Base64Decode(hash);

		var pPtr = EUPointerArray(privateKeyContext.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxGetSignValue',
				'number',
				['number', 'number', 'array', 'number',
					'number', 'number'],
				[privateKeyContext.GetContext(), signAlgo,
					hash, hash.length,
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	CtxGetSignsCount: function(context, sign) {
		this.CheckMaxDataSize(sign);

		if ((typeof sign) == 'string')
			sign = this.Base64Decode(sign);

		var intPtr = EUPointerDWORD();
		var error;

		try {
			error = Module.ccall('EUCtxGetSignsCount',
				'number',
				['number', 'array', 'number', 'number'],
				[context.GetContext(), sign, sign.length,
					intPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			intPtr.free();
			this.RaiseError(error);
		}

		return intPtr.toNumber();
	},
	CtxGetSignerInfo: function(context, signIndex, sign) {
		this.CheckMaxDataSize(sign);

		if ((typeof sign) == 'string')
			sign = this.Base64Decode(sign);

		var pCertInfoExPtr = EUPointer();
		var certArrPtr = EUPointerArray(context.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxGetSignerInfo',
				'number',
				['number', 'number', 'array', 'number',
					'number', 'number', 'number'],
				[context.GetContext(), signIndex, sign, sign.length,
					pCertInfoExPtr.ptr, 
					certArrPtr.ptr, certArrPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pCertInfoExPtr.free();
			certArrPtr.free();

			this.RaiseError(error);
		}

		var certInfoExPtr, certInfoEx;

		certInfoExPtr = pCertInfoExPtr.toPtr();
		certInfoEx = new EndUserCertificateInfoEx(
			certInfoExPtr, this.fieldsEncoder);
		Module._EUCtxFreeCertificateInfoEx(
			context.GetContext()|0, certInfoExPtr);

		return new EndUserCertificate(certInfoEx, certArrPtr.toArray());
	},
	CtxGetFileSignsCount: function(context, signFile, 
		onSuccess, onError) {
		var pThis = this;

		if (pThis.isFileSyncAPISupported) {
			if (!EUFS.link(signFile)) {
				onError(pThis.MakeError(EU_ERROR_JS_READ_FILE));
				return;
			}

			var intPtr = EUPointerDWORD();
			var error;
			try {
				error = Module.ccall('EUCtxGetFileSignsCount',
					'number',
					['number',
						'array', 'number'],
					[context.GetContext(),  
						UTF8ToCP1251Array(EUFS.getFilePath(signFile)),
						intPtr.ptr]);
			} catch (e) {
				error = EU_ERROR_UNKNOWN;
			}

			if (error != EU_ERROR_NONE) {
				intPtr.free();

				onError(pThis.MakeError(error));
				return;
			}

			EUFS.unlink(signFile);

			onSuccess(intPtr.toNumber());
		} else {
			var _onSuccess = function(fileReaded) {
				try {
					var signsCount; 

					signsCount = pThis.CtxGetSignsCount(
						context, fileReaded.data);

					onSuccess(signsCount);
				} catch (e) {
					onError(e);
				}
			};

			pThis.ReadFile(signFile, _onSuccess, onError);
		}
	},
	CtxGetFileSignerInfo: function(context, signIndex, signFile, 
		onSuccess, onError) {
		var pThis = this;

		if (pThis.isFileSyncAPISupported) {
			if (!EUFS.link(signFile)) {
				onError(pThis.MakeError(EU_ERROR_JS_READ_FILE));
				return;
			}

			var pCertInfoExPtr = EUPointer();
			var certArrPtr = EUPointerArray(context.GetContext());
			var error;
			try {
				error = Module.ccall('EUCtxGetFileSignerInfo',
					'number',
					['number', 'number', 'array',
						'number', 'number', 'number'],
					[context.GetContext(), signIndex, 
						UTF8ToCP1251Array(EUFS.getFilePath(signFile)),
						pCertInfoExPtr.ptr, 
						certArrPtr.ptr, certArrPtr.lengthPtr]);
			} catch (e) {
				error = EU_ERROR_UNKNOWN;
			}

			if (error != EU_ERROR_NONE) {
				EUFS.unlink(signFile);
				pCertInfoExPtr.free();
				certArrPtr.free();

				onError(pThis.MakeError(error));
				return;
			}

			EUFS.unlink(signFile);

			var certInfoExPtr, certInfoEx;

			certInfoExPtr = pCertInfoExPtr.toPtr();
			certInfoEx = new EndUserCertificateInfoEx(
				certInfoExPtr, this.fieldsEncoder);
			Module._EUCtxFreeCertificateInfoEx(
				context.GetContext()|0, certInfoExPtr);

			onSuccess(new EndUserCertificate(certInfoEx, certArrPtr.toArray()));
		} else {
			var _onSuccess = function(fileReaded) {
				try {
					var signerInfo; 

					signerInfo = pThis.CtxGetSignerInfo(
						context, signIndex, fileReaded.data);

					onSuccess(signerInfo);
				} catch (e) {
					onError(e);
				}
			};

			pThis.ReadFile(signFile, _onSuccess, onError);
		}
	},
	CtxVerifyFile: function(context, signIndex, fileWithSign, 
		file, onSuccess, onError) {
		var pThis = this;

		var internal = (file == null) || (typeof file === 'string');

		if (pThis.isFileSyncAPISupported) {
			var dataFile = (file != null) ?
				file :
				(fileWithSign.name + MakeUID(10));

			if (internal) {
				if (!EUFS.link(dataFile, (file == null))) {
					onError(pThis.MakeError(EU_ERROR_JS_READ_FILE));
					return;
				}
			} else {
				if (!EUFS.link(dataFile)) {
					onError(pThis.MakeError(EU_ERROR_JS_READ_FILE));
					return;
				}
			}

			if (!EUFS.link(fileWithSign)) {
				EUFS.unlink(dataFile);

				onError(pThis.MakeError(EU_ERROR_JS_READ_FILE));
				return;
			}

			var infoPtr = EUPointerSignerInfo();
			var timeInfo;
			var error;

			try {
				error = Module.ccall('EUCheckFileStruct',
					'number',
					['array'],
					[UTF8ToCP1251Array(EUFS.getFilePath(fileWithSign))]);
				if (error == EU_ERROR_NONE) {
					error = Module.ccall('EUCtxVerifyFile',
						'number',
						['number', 'number', 'array', 'array', 'number'],
						[context.GetContext(), signIndex, 
							UTF8ToCP1251Array(EUFS.getFilePath(fileWithSign)), 
							UTF8ToCP1251Array(EUFS.getFilePath(dataFile)), 
							infoPtr.ptr]);
				}
			} catch (e) {
				error = EU_ERROR_UNKNOWN;
			}

			if (error != EU_ERROR_NONE) {
				EUFS.unlink(fileWithSign);
				EUFS.unlink(dataFile);

				onError(pThis.MakeError(error));
				return;
			}

			var data = (internal && (file != null)) ?
				EUFS.readFileAsUint8Array(dataFile) :
				null;

			EUFS.unlink(fileWithSign);
			EUFS.unlink(dataFile);
			
			try {
				timeInfo = pThis._GetFileSignTimeInfoSync(
					signIndex, fileWithSign);
			} catch (e) {
				onError(e);
				return;
			}

			var info = new EndUserSignInfo(infoPtr.ptr, 
				data, timeInfo);
			infoPtr.free();

			onSuccess(info);
		} else {
			var _onSuccess= function(files) {
				try {
					var info;

					if (internal) {
						info = pThis.CtxVerifyDataInternal(
							context, signIndex, files[0].data);
						if (file == null)
							info.data = null;
					} else {
						info = pThis.CtxVerifyData(
							context, files[0].data, 
							signIndex, files[1].data);
						info.data = null;
					}

					onSuccess(info);
				} catch (e) {
					onError(e);
				}
			};

			var files = [];
			if (!internal)
				files.push(file);
			files.push(fileWithSign);

			pThis.ReadFiles(files, 
				_onSuccess, onError);
		}
	},
	GetTSPByAccessInfo: function(
		hashAlgo, hash, accessInfo, accessInfoPort, 
		asBase64String) {
		this.CheckMaxDataSize(hash);

		var isHashStr = ((typeof hash) == 'string');
		var pPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUGetTSPByAccessInfo',
				'number',
				['number', 
					isHashStr ? 'array' : 'number',
					!isHashStr ? 'array' : 'number', 'number',
					accessInfo ? 'array' : 'number',
					accessInfoPort ? 'array' : 'number',
					'number', 'number'],
				[hashAlgo,
					isHashStr ? StringToCString(hash) : 0, 
					!isHashStr ? hash : 0, 
					!isHashStr ? hash.length : 0, 
					accessInfo ? UTF8ToCP1251Array(accessInfo) : 0,
					accessInfoPort ? UTF8ToCP1251Array(accessInfoPort) : 0,
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	CheckTSP: function(
		tsp, hashAlgo, hash) {
		var error;

		this.CheckMaxDataSize(tsp);
		tsp = ((typeof tsp) == 'string') ?
			this.Base64Decode(tsp) : tsp;

		if (hash) {
			this.CheckMaxDataSize(hash);
			hash = ((typeof hash) == 'string') ?
				this.Base64Decode(hash) : hash;
		}

		try {
			error = Module.ccall('EUCheckTSP',
				'number',
				['array', 'number',
					'number', 'number',
					hash ? 'array' : 'number', 'number'],
				[tsp, tsp.length,
					hashAlgo, 0, 
					hash ? hash : 0, 
					hash ? hash.length : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			this.RaiseError(error);
		}
	},
//-----------------------------------------------------------------------------
	IsEnvelopedData: function(enveloped) {
		this.CheckMaxDataSize(enveloped);

		if ((typeof enveloped) == 'string')
			enveloped = this.Base64Decode(enveloped);

		var isEnveloped = false;
		var error;

		try {
			isEnveloped = (Module.ccall('EUIsEnvelopedData',
				'number',
				['array', 'number'],
				[enveloped, enveloped.length]) != EU_FALSE);
			error = EU_ERROR_NONE;
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			this.RaiseError(error);
		}

		return isEnveloped;
	},
	EnvelopDataEx: function (recipientCertIssuers, recipientCertSerials, 
		signData, data, asBase64String) {
		if ((typeof data) == 'string')
			data = this.StringToArray(data);

		this.CheckMaxDataSize(data);

		var envDataPtr = asBase64String ? 
			EUPointer() : EUPointerArray();
		var issuers = intArrayFromStrings(recipientCertIssuers);
		var serials = intArrayFromStrings(recipientCertSerials);
		var error;

		try {
			error = Module.ccall('EUEnvelopDataEx',
				'number',
				['array', 'array', 'number', 
					data ? 'array' : 'number', 'number', 
					'number', 'number', 'number'],
				[issuers, serials, IntFromBool(signData),
					(data != null) ? data : 0,
					data != null ? data.length : 0,
					asBase64String ? envDataPtr.ptr : 0,
					!asBase64String ? envDataPtr.ptr : 0,
					!asBase64String ? envDataPtr.lengthPtr : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			envDataPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return envDataPtr.toString(true);
		else
			return envDataPtr.toArray();
	},
	DevelopData: function(data) {
		this.CheckMaxDataSize(data);

		var isDataStr = ((typeof data) == 'string');
		var devDataPtr = EUPointerArray();
		var infoPtr = EUPointerSenderInfo();
		var error;

		try {
			error = Module.ccall('EUDevelopData',
				'number',
				[isDataStr ? 'array' : 'number',
					!isDataStr ? 'array' : 'number',
					'number', 'number', 'number', 'number'],
				[isDataStr ? StringToCString(data)  : 0,
					!isDataStr ? data : 0,
					!isDataStr ? data.length : 0,
					devDataPtr.ptr, devDataPtr.lengthPtr, infoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			devDataPtr.free();
			infoPtr.free();
			this.RaiseError(error);
		}

		var info = new EndUserSenderInfo(infoPtr.ptr, devDataPtr.toArray());
		devDataPtr.free();

		return info;
	},
	EnvelopDataToRecipientsWithDynamicKey: function(
		recipientCertificates, signData, appendCert, data, asBase64String) {
		if ((typeof data) == 'string')
			data = this.StringToArray(data);

		this.CheckMaxDataSize(data);

		var envDataPtr = asBase64String ? 
			EUPointer() : EUPointerArray();

		var recipientCertsArray = 
			new EUArrayFromArrayOfArray(recipientCertificates);
		var error;

		try {
			error = Module.ccall('EUEnvelopDataToRecipientsWithDynamicKey',
				'number',
				['number', 'number', 'number', 'number', 'number', 
					'array', 'number', 'number', 'number', 'number'],
				[recipientCertsArray.count,
					recipientCertsArray.arraysPtr,
					recipientCertsArray.arraysLengthPtr,
					IntFromBool(signData),
					IntFromBool(appendCert),
					data, data.length, 
					asBase64String ? envDataPtr.ptr : 0,
					!asBase64String ? envDataPtr.ptr : 0,
					!asBase64String ? envDataPtr.lengthPtr : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			recipientCertsArray.free();
			envDataPtr.free();
			this.RaiseError(error);
		}

		recipientCertsArray.free();

		if (asBase64String)
			return envDataPtr.toString(true);
		else
			return envDataPtr.toArray();
	},
	EnvelopDataRSAEx: function (contentEncAlgoType, 
		recipientCertIssuers, recipientCertSerials, 
		signData, data, asBase64String) {
		if ((typeof data) == 'string')
			data = this.StringToArray(data);

		this.CheckMaxDataSize(data);

		var envDataPtr = asBase64String ? 
			EUPointer() : EUPointerArray();
		var issuers = intArrayFromStrings(recipientCertIssuers);
		var serials = intArrayFromStrings(recipientCertSerials);
		var error;

		try {
			error = Module.ccall('EUEnvelopDataRSAEx',
				'number',
				['number', 'array', 'array', 'number', 
					data ? 'array' : 'number', 'number', 
					'number', 'number', 'number'],
				[contentEncAlgoType, issuers, serials, IntFromBool(signData),
					(data != null) ? data : 0,
					data != null ? data.length : 0,
					asBase64String ? envDataPtr.ptr : 0,
					!asBase64String ? envDataPtr.ptr : 0,
					!asBase64String ? envDataPtr.lengthPtr : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			envDataPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return envDataPtr.toString(true);
		else
			return envDataPtr.toArray();
	},
	CtxEnvelopData: function (privateKeyContext,
		recipientCertificates, recipientAppendType,
		signData, appendCert, data, asBase64String) {
		if ((typeof data) == 'string')
			data = this.StringToArray(data);

		this.CheckMaxDataSize(data);

		var pPtr = EUPointerArray(privateKeyContext.GetContext());
		var recipientCertsArray = 
			new EUArrayFromArrayOfArray(recipientCertificates);
		var error;

		try {
			error = Module.ccall('EUCtxEnvelopData',
				'number',
				['number', 'number', 'number', 'number',
					'number', 'number', 'number',
					'array', 'number', 'number', 'number'],
				[privateKeyContext.GetContext(),
					recipientCertsArray.count,
					recipientCertsArray.arraysPtr,
					recipientCertsArray.arraysLengthPtr,
					recipientAppendType, 
					IntFromBool(signData), IntFromBool(appendCert),
					data, data.length, pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			recipientCertsArray.free();
			pPtr.free();
			this.RaiseError(error);
		}

		recipientCertsArray.free();
		
		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	CtxDevelopData: function (privateKeyContext,
		data, senderCert) {
		this.CheckMaxDataSize(data);
		if (senderCert != null)
			this.CheckMaxDataSize(senderCert);

		var isEnvDataStr = ((typeof data) == 'string');
		var devDataPtr = EUPointerArray(privateKeyContext.GetContext());
		var infoPtr = EUPointerSenderInfo();
		var error;

		try {
			error = Module.ccall('EUCtxDevelopData',
				'number',
				['number', 
					isEnvDataStr ? 'array' : 'number', 
					!isEnvDataStr ? 'array' : 'number', 'number',
					senderCert ? 'array' : 'number', 'number',
					'number', 'number', 'number'],
				[privateKeyContext.GetContext(),
					isEnvDataStr ? StringToCString(data)  : 0,
					!isEnvDataStr ? data : 0,
					!isEnvDataStr ? data.length : 0,
					(senderCert != null) ? senderCert : 0,
					(senderCert != null) ? senderCert.length : 0,
					devDataPtr.ptr, devDataPtr.lengthPtr, infoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			devDataPtr.free();
			infoPtr.free();
			this.RaiseError(error);
		}
		
		var info = new EndUserSenderInfo(infoPtr.ptr, devDataPtr.toArray());
		devDataPtr.free();

		return info;
	},
	CtxEnvelopDataWithDynamicKey: function (privateKeyContext,
		recipientCertificates, recipientAppendType,
		signData, appendCert, data, asBase64String) {
		if ((typeof data) == 'string')
			data = this.StringToArray(data);

		this.CheckMaxDataSize(data);

		var pPtr = EUPointerArray(privateKeyContext.GetContext());
		var recipientCertsArray = 
			new EUArrayFromArrayOfArray(recipientCertificates);
		var error;

		try {
			error = Module.ccall('EUCtxEnvelopDataWithDynamicKey',
				'number',
				['number', 'number', 'number', 'number',
					'number', 'number', 'number',
					'array', 'number', 'number', 'number'],
				[privateKeyContext.GetContext(),
					recipientCertsArray.count,
					recipientCertsArray.arraysPtr,
					recipientCertsArray.arraysLengthPtr,
					recipientAppendType, 
					IntFromBool(signData), IntFromBool(appendCert),
					data, data.length, pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			recipientCertsArray.free();
			pPtr.free();
			this.RaiseError(error);
		}

		recipientCertsArray.free();
		
		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	CtxGetSenderInfo: function(context, data, recipientCert) {
		this.CheckMaxDataSize(data);

		if ((typeof data) == 'string')
			data = this.Base64Decode(data);

		var isDynamicKeyPtr = EUPointerInt();
		var pCertInfoExPtr = EUPointer();
		var certArrPtr = EUPointerArray(context.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxGetSenderInfo',
				'number',
				['number', 'array', 'number', 'array', 'number',
					'number', 'number', 'number', 'number'],
				[context.GetContext(), data, data.length,
					recipientCert, recipientCert.length,
					isDynamicKeyPtr.ptr, pCertInfoExPtr.ptr,
					certArrPtr.ptr, certArrPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			isDynamicKeyPtr.free();
			pCertInfoExPtr.free();
			certArrPtr.free();

			this.RaiseError(error);
		}

		var certInfoExPtr, certInfoEx;

		certInfoExPtr = pCertInfoExPtr.toPtr();
		certInfoEx = new EndUserCertificateInfoEx(
			certInfoExPtr, this.fieldsEncoder);
		Module._EUCtxFreeCertificateInfoEx(
			context.GetContext()|0, certInfoExPtr);

		return EndUserSenderInfoEx(
			isDynamicKeyPtr.toBoolean(),
			certInfoEx, certArrPtr.toArray());
	},
	CtxGetRecipientsCount: function(context, envelopedData) {
		this.CheckMaxDataSize(envelopedData);

		if ((typeof envelopedData) == 'string')
			envelopedData = this.Base64Decode(envelopedData);

		var intPtr = EUPointerDWORD();
		var error;

		try {
			error = Module.ccall('EUCtxGetRecipientsCount',
				'number',
				['number', 'array', 'number', 'number'],
				[context.GetContext(), envelopedData,
					envelopedData.length, intPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			intPtr.free();

			this.RaiseError(error);
		}

		return intPtr.toNumber();
	},
	CtxGetRecipientInfo: function(context, 
		recipientIndex, envelopedData) {
		this.CheckMaxDataSize(envelopedData);

		if ((typeof envelopedData) == 'string')
			envelopedData = this.Base64Decode(envelopedData);

		var infoTypePtr = EUPointerDWORD();
		var pIssuerPtr = EUPointer(context.GetContext());
		var pSerialPtr = EUPointer(context.GetContext());
		var pPublicKeyIDPtr = EUPointer(context.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxGetRecipientInfo',
				'number',
				['number', 'number', 'array', 'number',
					'number', 'number', 'number', 'number'],
				[context.GetContext(), recipientIndex,
					envelopedData, envelopedData.length,
					infoTypePtr.ptr,
					pIssuerPtr.ptr, pSerialPtr.ptr,
					pPublicKeyIDPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			infoTypePtr.free();
			pIssuerPtr.free();
			pSerialPtr.free();
			pPublicKeyIDPtr.free();

			this.RaiseError(error);
		}

		return EndUserRecipientInfo(
			infoTypePtr.toNumber(),
			pIssuerPtr.toString(), pSerialPtr.toString(),
			pPublicKeyIDPtr.toString());
	},
	AppendRecipient: function (prevEnvData,
		recipient, asBase64String) {
		this.CheckMaxDataSize(prevEnvData);
		this.CheckMaxDataSize(recipient);

		var isPrevEnvDataStr = ((typeof prevEnvData) == 'string');
		var isRecipientStr = ((typeof recipient) == 'string');
		var envDataPtr = asBase64String ? 
			EUPointer() : EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUAppendRecipient',
				'number',
				[isPrevEnvDataStr ? 'array' : 'number', 
					!isPrevEnvDataStr ? 'array' : 'number', 'number',
					isRecipientStr ? 'array' : 'number', 
					!isRecipientStr ? 'array' : 'number', 'number',
					'number', 'number', 'number'],
				[isPrevEnvDataStr ? StringToCString(prevEnvData)  : 0,
					!isPrevEnvDataStr ? prevEnvData : 0,
					!isPrevEnvDataStr ? prevEnvData.length : 0,
					isRecipientStr ? StringToCString(recipient)  : 0,
					!isRecipientStr ? recipient : 0,
					!isRecipientStr ? recipient.length : 0,
					asBase64String ? envDataPtr.ptr : 0,
					!asBase64String ? envDataPtr.ptr : 0,
					!asBase64String ? envDataPtr.lengthPtr : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			envDataPtr.free();
			this.RaiseError(error);
		}
		
		if (asBase64String)
			return envDataPtr.toString(true);
		else
			return envDataPtr.toArray();
	},
	GetRecipient: function (envData,
		recipientCert, asBase64String) {
		this.CheckMaxDataSize(envData);
		this.CheckMaxDataSize(recipientCert);

		var isEnvDataStr = ((typeof envData) == 'string');
		var recipientPtr = asBase64String ? 
			EUPointer() : EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUGetRecipient',
				'number',
				[isEnvDataStr ? 'array' : 'number', 
					!isEnvDataStr ? 'array' : 'number', 'number',
					'array', 'number',
					'number', 'number', 'number'],
				[isEnvDataStr ? StringToCString(envData)  : 0,
					!isEnvDataStr ? envData : 0,
					!isEnvDataStr ? envData.length : 0,
					recipientCert, recipientCert.length,
					asBase64String ? recipientPtr.ptr : 0,
					!asBase64String ? recipientPtr.ptr : 0,
					!asBase64String ? recipientPtr.lengthPtr : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			recipientPtr.free();
			this.RaiseError(error);
		}
		
		if (asBase64String)
			return recipientPtr.toString(true);
		else
			return recipientPtr.toArray();
	},
	PasswordRecipientDevelopData: function(
		envData, passwordRecipient, password) {
		this.CheckMaxDataSize(envData);
		this.CheckMaxDataSize(passwordRecipient);

		var isEnvDataStr = ((typeof envData) == 'string');
		var isPasswordRecipientStr = 
			((typeof passwordRecipient) == 'string');
		var devDataPtr = EUPointerArray();
		var infoPtr = EUPointerSenderInfo();
		var error;

		try {
			error = Module.ccall('EUPasswordRecipientDevelopData',
				'number',
				[isEnvDataStr ? 'array' : 'number',
					!isEnvDataStr ? 'array' : 'number', 'number',
					isPasswordRecipientStr ? 'array' : 'number',
					!isPasswordRecipientStr ? 'array' : 'number', 'number',
					'array', 'number', 'number', 'number'],
				[isEnvDataStr ? StringToCString(envData)  : 0,
					!isEnvDataStr ? envData : 0,
					!isEnvDataStr ? envData.length : 0,
					isPasswordRecipientStr ? 
						StringToCString(passwordRecipient)  : 0,
					!isPasswordRecipientStr ? passwordRecipient : 0,
					!isPasswordRecipientStr ? passwordRecipient.length : 0,
					UTF8ToCP1251Array(password),
					devDataPtr.ptr, devDataPtr.lengthPtr, infoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			devDataPtr.free();
			infoPtr.free();
			this.RaiseError(error);
		}

		var info = new EndUserSenderInfo(infoPtr.ptr, devDataPtr.toArray());
		devDataPtr.free();

		return info;
	},
//-----------------------------------------------------------------------------
	ClientSessionCreateStep1: function(expireTime) {
		var pPtr = EUPointer();
		var error;

		var dataPtr = EUPointerArray();

		try {
			error = Module.ccall('EUClientSessionCreateStep1',
				'number',
				['number', 'number', 'number', 'number'],
				[expireTime, pPtr.ptr, dataPtr.ptr, dataPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			dataPtr.free();
			this.RaiseError(error);
		}

		return new EndUserSession(pPtr.toPtr(),
			dataPtr.toArray());
	},
	ServerSessionCreateStep1: function(expireTime, clientData) {
		var pPtr = EUPointer();
		var error;

		var dataPtr = EUPointerArray();

		try {
			error = Module.ccall('EUServerSessionCreateStep1',
				'number',
				['number', 'array', 'number', 
					'number', 'number', 'number'],
				[expireTime, clientData, clientData.length, 
					pPtr.ptr, dataPtr.ptr, dataPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			dataPtr.free();
			this.RaiseError(error);
		}

		return new EndUserSession(pPtr.toPtr(),
			dataPtr.toArray());
	},
	ClientSessionCreateStep2: function(session, serverData) {
		var error;

		var dataPtr = EUPointerArray();

		try {
			error = Module.ccall('EUClientSessionCreateStep2',
				'number',
				['number', 'array', 'number', 
					'number', 'number'],
				[session.GetHandle()|0, serverData, serverData.length, 
					dataPtr.ptr, dataPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			dataPtr.free();
			this.RaiseError(error);
		}

		session.SetData(dataPtr.toArray());
	},
	ServerSessionCreateStep2: function(session, clientData) {
		var error;

		try {
			error = Module.ccall('EUServerSessionCreateStep2',
				'number',
				['number', 'array', 'number'],
				[session.GetHandle()|0, 
					clientData, clientData.length]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			this.RaiseError(error);
		}
	},
	SessionClose: function(session) {
		var error = EU_ERROR_NONE;

		try {
			Module.ccall('EUSessionDestroy',
				'number',
				['number'],
				[session.GetHandle()|0]);
			error = EU_ERROR_NONE;
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			this.RaiseError(error);
		}
	},
	SessionIsInitialized: function(session) {
		var isInitialized;
		var error = EU_ERROR_NONE;

		try {
			isInitialized = Module.ccall('EUSessionIsInitialized',
				'number',
				['number'],
				[session.GetHandle()|0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			this.RaiseError(error);
		}
		
		return (isInitialized != EU_FALSE);
	},
	SessionCheckCertificates: function(session) {
		var error = EU_ERROR_NONE;

		try {
			error = Module.ccall('EUSessionCheckCertificates',
				'number',
				['number'],
				[session.GetHandle()|0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			this.RaiseError(error);
		}
		
		return true;
	},
	SessionGetPeerCertificateInfo: function(session) {
		var infoPtr = EUPointerCertificateInfo();
		var error;

		try {
			error = Module.ccall('EUSessionGetPeerCertificateInfo',
				'number',
				['number', 'number'],
				[session.GetHandle()|0, infoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			infoPtr.free();
			this.RaiseError(error);
		}

		var info = new EndUserCertificateInfo(infoPtr.ptr);
		infoPtr.free();

		return info;
	},
	SessionSave: function(session) {
		var error;

		var dataPtr = EUPointerArray();

		try {
			error = Module.ccall('EUSessionSave',
				'number',
				['number', 'number', 'number'],
				[session.GetHandle()|0, 
					dataPtr.ptr, dataPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			dataPtr.free();
			this.RaiseError(error);
		}
		
		return dataPtr.toArray();
	},
	SessionLoad: function(sessionData) {
		var pPtr = EUPointer();
		var error;

		try {
			error = Module.ccall('EUSessionLoad',
				'number',
				['array', 'number', 'number'],
				[sessionData, sessionData.length, pPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		return new EndUserSession(pPtr.toPtr(), null);
	},
	ClientDynamicKeySessionCreate: function(
		expireTime, serverCertIssuer, serverCertSerial) {
		var isCertData = arguments.length == 2;

		var pPtr = EUPointer();
		var error;

		var dataPtr = EUPointerArray();

		try {
			error = Module.ccall('EUClientDynamicKeySessionCreate',
				'number',
				['number',
					isCertData ? 'number' : 'array', 
					isCertData ? 'number' : 'array', 
					isCertData ? 'array': 'number', 'number',
					'number', 'number', 'number'],
				[expireTime, 
					isCertData ? 0 : UTF8ToCP1251Array(serverCertIssuer), 
					isCertData ? 0 : UTF8ToCP1251Array(serverCertSerial),
					isCertData ? serverCertIssuer : 0,
					isCertData ? serverCertIssuer.length : 0,
					pPtr.ptr, dataPtr.ptr, dataPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			dataPtr.free();
			this.RaiseError(error);
		}

		return new EndUserSession(pPtr.toPtr(),
			dataPtr.toArray());
	},
	ServerDynamicKeySessionCreate: function(
		expireTime, clientData) {
		var pPtr = EUPointer();
		var error;

		try {
			error = Module.ccall('EUServerDynamicKeySessionCreate',
				'number',
				['number', 'array', 'number', 
					'number'],
				[expireTime, clientData, clientData.length, 
					pPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		return new EndUserSession(pPtr.toPtr(), null);
	},
	ClientDynamicKeySessionLoad: function(sessionData) {
		var pPtr = EUPointer();
		var error;

		try {
			error = Module.ccall('EUClientDynamicKeySessionLoad',
				'number',
				['array', 'number', 'number'],
				[sessionData, sessionData.length, pPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		return new EndUserSession(pPtr.toPtr(), null);
	},
	SessionEncrypt: function(session, data, asBase64String) {
		if ((typeof data) == 'string')
			data = this.StringToArray(data);

		this.CheckMaxDataSize(data);

		var pPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUSessionEncrypt',
				'number',
				['number', 'array', 'number', 'number', 'number'],
				[session.GetHandle()|0,
					data, data.length, pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	SessionDecrypt: function(session, encryptedData) {
		if ((typeof encryptedData) == 'string')
			encryptedData = this.Base64Decode(encryptedData);

		this.CheckMaxDataSize(encryptedData);

		var pPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUSessionDecrypt',
				'number',
				['number', 'array', 'number', 'number', 'number'],
				[session.GetHandle()|0,
					encryptedData, encryptedData.length, 
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		return pPtr.toArray();
	},
	SessionEncryptContinue: function(session, data, asBase64String) {
		if ((typeof data) == 'string')
			data = this.StringToArray(data);

		this.CheckMaxDataSize(data);

		var pPtr = EUPointerStaticArray(data);
		var error;

		try {
			error = Module.ccall('EUSessionEncryptContinue',
				'number',
				['number', 'number', 'number'],
				[session.GetHandle()|0, pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	SessionDecryptContinue: function(session, encryptedData) {
		if ((typeof encryptedData) == 'string')
			encryptedData = this.Base64Decode(encryptedData);

		this.CheckMaxDataSize(encryptedData);

		var pPtr = EUPointerStaticArray(encryptedData);
		var error;

		try {
			error = Module.ccall('EUSessionDecryptContinue',
				'number',
				['number', 'number', 'number'],
				[session.GetHandle()|0,
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		return pPtr.toArray();
	},
//-----------------------------------------------------------------------------
	CtxCreate: function() {
		var pPtr = EUPointer();
		var error;

		try {
			error = Module.ccall('EUCtxCreate',
				'number',
				['number'],
				[pPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}
		
		var context = new EndUserContext(pPtr.toPtr());

		return context;
	},
	CtxFree: function(context) {
		try {
			Module._EUCtxFree(context.GetContext()|0);
		} catch (e) {
		}
	},
	CtxSetParameter: function(context, name, value) {
		var error;
		var intPtr = EUPointerBool();
		if (typeof value != 'boolean') {
			this.RaiseError(EU_ERROR_BAD_PARAMETER);
		}
		
		try {
			Module.setValue(intPtr.ptr,
				IntFromBool(value) | 0, "i32");

			error = Module.ccall('EUCtxSetParameter',
				'number',
				['number', 'array', 'number', 'number'],
				[context.GetContext()|0, 
					UTF8ToCP1251Array(name), intPtr.ptr, EU_BOOL_SIZE]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
			intPtr.free();
		}

		if (error != EU_ERROR_NONE) {
			this.RaiseError(error);
		}

		intPtr.free();
	},
//-----------------------------------------------------------------------------
	ProtectDataByPassword: function(data, password, asBase64String) {
		if ((typeof data) == 'string')
			data = UTF8ToCP1251Array(data);

		this.CheckMaxDataSize(data);

		var protDataPtr = asBase64String ? 
			EUPointer() : EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUProtectDataByPassword',
				'number',
				['array', 'number', 
					password ? 'array' : 'number',
					'number', 'number', 'number'],
				[data, data.length, 
					(password != null) ? 
						UTF8ToCP1251Array(password) : 0,
					asBase64String ? protDataPtr.ptr : 0,
					!asBase64String ? protDataPtr.ptr : 0,
					!asBase64String ? protDataPtr.lengthPtr : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			protDataPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return protDataPtr.toString();
		else
			return protDataPtr.toArray();
	},
	UnprotectDataByPassword: function(data, password, asString) {
		this.CheckMaxDataSize(data);

		var isDataStr = ((typeof data) == 'string');
		var unprotDataPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUUnprotectDataByPassword',
				'number',
				[isDataStr ? 'array' : 'number',
					!isDataStr ? 'array' : 'number', 'number',
					password ? 'array' : 'number',
					'number', 'number'],
				[isDataStr ? StringToCString(data) : 0,
					!isDataStr ? data : 0,
					!isDataStr ? data.length : 0,
					(password != null) ? 
						UTF8ToCP1251Array(password) : 0,
					unprotDataPtr.ptr, unprotDataPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			unprotDataPtr.free();
			this.RaiseError(error);
		}

		if (asString) {
			return unprotDataPtr.toString();
		} else {
			return unprotDataPtr.toArray();
		}
	},
//-----------------------------------------------------------------------------
	QRCodeEncode: function(data, scale) {
		var arrPtr = null;
		var arrLenPtr = null;
		var imgArray = null;
		var error = EU_ERROR_NONE;

		this.CheckMaxDataSize(data);

		scale = scale || 1;

		var _free = function() {
			try {
				if (arrPtr != null)
					Module._free(arrPtr);

				if (arrLenPtr != null)
					Module._free(arrLenPtr);
			} catch (e) {
			}
		};

		try {
			arrPtr = Module._malloc(4);
			arrLenPtr = Module._malloc(4);

			Module.setValue(arrPtr, 0);
			Module.setValue(arrLenPtr, 0);

			var isSuccess = Module.ccall('QRCodeEncode',
				'number',
				['array', 'number', 'number', 'number', 'number'],
				[data, data.length, scale, arrPtr, arrLenPtr]);
			if (isSuccess) {
				var imgData = Module.getValue(arrPtr, "i8*");
				var imgDataLength = Module.getValue(arrLenPtr, "i32");
				var imgBuffer = new ArrayBuffer(imgDataLength);

				imgArray = new Uint8Array(imgBuffer);
				imgArray.set(new Uint8Array(
					Module.HEAPU8.buffer, imgData, imgDataLength));

				Module._QRCodeFreeMemory(imgData);
			} else {
				error = EU_ERROR_BAD_PARAMETER;
			}
			
			_free();
		} catch (e) {
			_free();
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE)
			this.RaiseError(error);

		return imgArray;
	},
//-----------------------------------------------------------------------------
	AppendTransportHeader: function(caType, fileName, 
		clientEMail, clientCert, data) {
		this.CheckMaxDataSize(data);

		var resultDataPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUAppendTransportHeader',
				'number',
				['array', 'array', 'array', 
					'array', 'number', 'array', 'number', 
					'number', 'number'],
				[UTF8ToCP1251Array(caType),
					UTF8ToCP1251Array(fileName),
					UTF8ToCP1251Array(clientEMail),
					clientCert, clientCert.length, 
					data, data.length,
					resultDataPtr.ptr, resultDataPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			resultDataPtr.free();
			this.RaiseError(error);
		}

		return resultDataPtr.toArray();
	},
//-----------------------------------------------------------------------------
	ParseTransportHeader: function(data) {
		if ((typeof data) == 'string')
			data = this.Base64Decode(data);

		this.CheckMaxDataSize(data);

		var intPtr = EUPointerDWORD();
		var resultDataPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUParseTransportHeader',
				'number',
				['array', 'number', 
					'number', 'number', 'number'],
				[data, data.length, intPtr.ptr,
					resultDataPtr.ptr, resultDataPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			intPtr.free();
			resultDataPtr.free();
			this.RaiseError(error);
		}

		return new EndUserTransportHeader(
			intPtr.toNumber(), resultDataPtr.toArray());
	},
//-----------------------------------------------------------------------------
	AppendCryptoHeader: function(caType, headerType, data) {
		this.CheckMaxDataSize(data);

		var resultDataPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUAppendCryptoHeader',
				'number',
				['array', 'number', 
					'array', 'number',
					'number', 'number'],
				[UTF8ToCP1251Array(caType), 
					headerType, data, data.length,
					resultDataPtr.ptr, resultDataPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			resultDataPtr.free();
			this.RaiseError(error);
		}

		return resultDataPtr.toArray();
	},
//-----------------------------------------------------------------------------
	ParseCryptoHeader: function(data) {
		if ((typeof data) == 'string')
			data = this.Base64Decode(data);

		this.CheckMaxDataSize(data);

		var caTypePtr = EUPointerMemory(EU_HEADER_MAX_CA_TYPE_SIZE + 1);
		var headerTypePtr = EUPointerDWORD();
		var headerSizePtr = EUPointerDWORD();
		var resultDataPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUParseCryptoHeader',
				'number',
				['array', 'number',
					'number', 'number', 'number', 
					'number', 'number'],
				[data, data.length, 
					caTypePtr.ptr, headerTypePtr.ptr, headerSizePtr.ptr,
					resultDataPtr.ptr, resultDataPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			caTypePtr.free();
			headerTypePtr.free();
			headerSizePtr.free();
			resultDataPtr.free();
			this.RaiseError(error);
		}

		var caType = CP1251PointerToUTF8(caTypePtr.ptr);
		caTypePtr.free();
		
		return new EndUserCryptoHeader(
			caType, headerTypePtr.toNumber(), 
			headerSizePtr.toNumber(),
			resultDataPtr.toArray());
	},
//-----------------------------------------------------------------------------
	SServerClientSignHashAsync: function(
		serverAddress, serverPort, clientID, originatorDescription,
		hashDescription, hash, signAlgorithmName) {
		var isPort = serverPort != null && serverPort != "";
		var isHashStr = ((typeof hash) == 'string');
		var pPtr = EUPointer();
		var error;

		try {
			error = Module.ccall('EUSServerClientSignHashAsync',
				'number',
				['array', 
					isPort ? 'array' : 'number', 'array', 
					originatorDescription ? 'array' : 'number', 
					'array', 
					isHashStr ? 'array' : 'number',
					(!isHashStr) ? 'array' : 'number',
						'number', 'array', 'number'],
				[UTF8ToCP1251Array(serverAddress),
					isPort ? UTF8ToCP1251Array(serverPort) : 0,
					UTF8ToCP1251Array(clientID),
					originatorDescription ? UTF8ToCP1251Array(originatorDescription) : 0,
					UTF8ToCP1251Array(hashDescription),
					isHashStr ? StringToCString(hash) : 0,
					!isHashStr ? hash : 0,
					!isHashStr ? hash.length : 0,
					UTF8ToCP1251Array(signAlgorithmName),
					pPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		return pPtr.toString(true);
	},
	SServerClientCheckSignHashStatus: function(
		serverAddress, serverPort, clientID, 
		operationID, asBase64String) {
		var isPort = serverPort != null && serverPort != "";
		var pPtr = asBase64String ? 
			EUPointer() : EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUSServerClientCheckSignHashStatus',
				'number',
				['array', 
					isPort ? 'array' : 'number', 'array', 'array', 
					'number', 'number', 'number'],
				[UTF8ToCP1251Array(serverAddress),
					isPort ? UTF8ToCP1251Array(serverPort) : 0,
					UTF8ToCP1251Array(clientID),
					UTF8ToCP1251Array(operationID),
					asBase64String ? pPtr.ptr : 0,
					!asBase64String ? pPtr.ptr : 0,
					!asBase64String ? pPtr.lengthPtr : 0]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		var sign = asBase64String ? 
			pPtr.toString(true) : pPtr.toArray();
		return sign && (sign.length > 0) ? sign : null;
	},
	SServerClientSignHashesAsync: function(
		serverAddress, serverPort, clientID, originatorDescription,
		operationDescription, hashesDescriptions, hashes, signAlgorithmName) {
		var isPort = serverPort != null && serverPort != "";
		var hashesDescr = hashesDescriptions != null ? 
			intArrayFromStrings(hashesDescriptions) : 0;
		var isHashesStr = (typeof hashes[0]) == 'string';
		var hashesValues = isHashesStr ? 
			intArrayFromStrings(hashes) : 
			new EUArrayFromArrayOfArray(hashes);
		
		var pPtr = EUPointer();
		var error;

		try {
			error = Module.ccall('EUSServerClientSignHashesAsync',
				'number',
				['array', 
					isPort ? 'array' : 'number', 'array', 
					originatorDescription ? 'array' : 'number', 
					'array', 
					hashesDescr ? 'array' : 'number',
					isHashesStr ? 'array' : 'number',
					'number', 'number', 'number',
					'array', 'number'],
				[UTF8ToCP1251Array(serverAddress),
					isPort ? UTF8ToCP1251Array(serverPort) : 0,
					UTF8ToCP1251Array(clientID),
					originatorDescription ? UTF8ToCP1251Array(originatorDescription) : 0,
					UTF8ToCP1251Array(operationDescription),
					hashesDescr ? hashesDescr : 0,
					isHashesStr ? hashesValues : 0,
					!isHashesStr ? hashesValues.count : 0,
					!isHashesStr ? hashesValues.arraysPtr : 0,
					!isHashesStr ? hashesValues.arraysLengthPtr : 0,
					UTF8ToCP1251Array(signAlgorithmName),
					pPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		return pPtr.toString(true);
	},
	SServerClientCheckSignHashesStatus: function(
		serverAddress, serverPort, clientID, operationID) {
		var isPort = serverPort != null && serverPort != "";
		var pPtr = EUPointer();
		var intPtr = EUPointerDWORD();
		var error;
		try {
			error = Module.ccall('EUSServerClientCheckSignHashesStatus',
				'number',
				['array', 
					isPort ? 'array' : 'number', 'array', 'array', 
					'number', 'number'],
				[UTF8ToCP1251Array(serverAddress),
					isPort ? UTF8ToCP1251Array(serverPort) : 0,
					UTF8ToCP1251Array(clientID),
					UTF8ToCP1251Array(operationID),
					pPtr.ptr, intPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			intPtr.free();
			this.RaiseError(error);
		}

		var itemsPtr = pPtr.toPtr();
		var itemsCount = intPtr.toNumber();
		var results = [];
		try {
			for (var i = 0; i < itemsCount; i++) {
				var pCurPtr = Module.getValue(
					(itemsPtr + i * EU_PTR_SIZE) | 0, "i8*");
				
				results.push(new EndUserSSSignHashResult(pCurPtr));
			}
		} catch (e) {
			Module._EUSServerClientFreeSignHashesResults(itemsPtr);
			this.RaiseError(EU_ERROR_UNKNOWN);
		}

		Module._EUSServerClientFreeSignHashesResults(itemsPtr);

		return results;
	},
	SServerClientGeneratePrivateKeyAsync: function(
		serverAddress, serverPort, clientID, 
		originatorDescription, privateKeyDescription, 
		uaAlgorithmName, uaDSKeyLength, useDSKeyAsKEP, uaKEPKeyLength,
		internationalAlgorithmName, internationalKeyLength) {
		var isPort = serverPort != null && serverPort != "";
		var isUAAlgorithmName = 
			((typeof uaAlgorithmName) == 'string');
		var isIntAlgorithmName = 
			((typeof internationalAlgorithmName) == 'string');
		var pPtr = EUPointer();
		var error;

		try {
			error = Module.ccall('EUSServerClientGeneratePrivateKeyAsync',
				'number',
				['array', 
					isPort ? 'array' : 'number', 'array', 
					originatorDescription ? 'array' : 'number',
					'array', 
					isUAAlgorithmName ? 'array' : 'number',
					'number', 'number', 'number',
					isIntAlgorithmName ? 'array' : 'number',
					'number', 'number'],
				[UTF8ToCP1251Array(serverAddress),
					isPort ? UTF8ToCP1251Array(serverPort) : 0,
					UTF8ToCP1251Array(clientID),
					originatorDescription ? UTF8ToCP1251Array(originatorDescription) : 0,
					UTF8ToCP1251Array(privateKeyDescription),
					isUAAlgorithmName ? 
						UTF8ToCP1251Array(uaAlgorithmName) : 0,
					uaDSKeyLength, 
					useDSKeyAsKEP ? 1 : 0,
					uaKEPKeyLength, 
					isIntAlgorithmName ? 
						UTF8ToCP1251Array(internationalAlgorithmName) : 0,
					internationalKeyLength,
					pPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		return pPtr.toString(true);
	},
	SServerClientCheckGeneratePrivateKeyStatus: function(
		serverAddress, serverPort, clientID, operationID) {
		var isPort = serverPort != null && serverPort != "";
		var uaReqPtr = EUPointerArray();
		var uaReqNamePtr = EUPointerMemory(EU_PATH_MAX_LENGTH);
		var uaKEPReqPtr = EUPointerArray();
		var uaKEPReqNamePtr = EUPointerMemory(EU_PATH_MAX_LENGTH);
		var intReqPtr = EUPointerArray();
		var intReqNamePtr = EUPointerMemory(EU_PATH_MAX_LENGTH);
		var error;

		var _free = function() {
			uaReqPtr.free();
			uaReqNamePtr.free();
			uaKEPReqPtr.free();
			uaKEPReqNamePtr.free();
			intReqPtr.free();
			intReqNamePtr.free();
		};

		try {
			error = Module.ccall(
				'EUSServerClientCheckGeneratePrivateKeyStatus',
				'number',
				['array', 
					isPort ? 'array' : 'number', 
					'array', 'array', 
					'number', 'number', 'number',
					'number', 'number', 'number',
					'number', 'number', 'number'],
				[UTF8ToCP1251Array(serverAddress),
					isPort ? UTF8ToCP1251Array(serverPort) : 0,
					UTF8ToCP1251Array(clientID),
					UTF8ToCP1251Array(operationID),
					uaReqPtr.ptr, uaReqPtr.lengthPtr,
					uaReqNamePtr.ptr, 
					uaKEPReqPtr.ptr, uaKEPReqPtr.lengthPtr, 
					uaKEPReqNamePtr.ptr,
					intReqPtr.ptr, intReqPtr.lengthPtr, 
					intReqNamePtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			_free();
			this.RaiseError(error);
		}

		var _toString = function(strPtr) {
			var str = CP1251PointerToUTF8(strPtr);
			var lastInd = str.lastIndexOf("/");
			if (lastInd < 0)
				return str;

			return str.substring(lastInd + 1, str.length);
		};
		
		var _toArray = function(arrPtr) {
			var arr = arrPtr.toArray();
			return (arr && (arr.length > 0)) ? arr : null;
		};

		var uaReq = _toArray(uaReqPtr);
		var uaReqName = _toString(uaReqNamePtr.ptr);
		var uaKEPReq = _toArray(uaKEPReqPtr);
		var uaKEPReqName = _toString(uaKEPReqNamePtr.ptr);
		var intReq = _toArray(intReqPtr);
		var intReqName = _toString(intReqNamePtr.ptr);

		if ((uaReq == null) && 
			(uaKEPReq == null) && 
			(intReq == null)) {
			return null;
		}

		var euPrivateKey = new EndUserPrivateKey(
			null, null, uaReq, uaReqName, 
			uaKEPReq, uaKEPReqName, 
			intReq, intReqName, null, null);

		_free();

		return euPrivateKey;
	},
	ASiCGetASiCType: function(asicData) {
		this.CheckMaxDataSize(asicData);

		if ((typeof asicData) == 'string')
			asicData = this.Base64Decode(asicData);

		var intPtr = EUPointerDWORD();
		var error;

		try {
			error = Module.ccall('EUASiCGetASiCType',
				'number',
				['array', 'number', 'number'],
				[asicData, asicData.length, intPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			intPtr.free();
			this.RaiseError(error);
		}

		return intPtr.toNumber();
	},
	ASiCGetSignType: function(asicData) {
		this.CheckMaxDataSize(asicData);

		if ((typeof asicData) == 'string')
			asicData = this.Base64Decode(asicData);

		var intPtr = EUPointerDWORD();
		var error;

		try {
			error = Module.ccall('EUASiCGetSignType',
				'number',
				['array', 'number', 'number'],
				[asicData, asicData.length, intPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			intPtr.free();
			this.RaiseError(error);
		}

		return intPtr.toNumber();
	},
	ASiCGetSignsCount: function(asicData) {
		this.CheckMaxDataSize(asicData);

		if ((typeof asicData) == 'string')
			asicData = this.Base64Decode(asicData);

		var intPtr = EUPointerDWORD();
		var error;

		try {
			error = Module.ccall('EUASiCGetSignsCount',
				'number',
				['array', 'number', 'number'],
				[asicData, asicData.length, intPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			intPtr.free();
			this.RaiseError(error);
		}

		return intPtr.toNumber();
	},
	ASiCGetSignerInfo: function(signIndex, asicData) {
		this.CheckMaxDataSize(asicData);

		if ((typeof asicData) == 'string')
			asicData = this.Base64Decode(asicData);

		var pCertInfoExPtr = EUPointer();
		var certArrPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUASiCGetSignerInfo',
				'number',
				['number', 'array', 'number',
					'number', 'number', 'number'],
				[signIndex, asicData, asicData.length,
					pCertInfoExPtr.ptr, 
					certArrPtr.ptr, certArrPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pCertInfoExPtr.free();
			certArrPtr.free();

			this.RaiseError(error);
		}

		var certInfoExPtr, certInfoEx;

		certInfoExPtr = pCertInfoExPtr.toPtr();
		certInfoEx = new EndUserCertificateInfoEx(
			certInfoExPtr, this.fieldsEncoder);
		Module._EUFreeCertificateInfoEx(certInfoExPtr);

		return new EndUserCertificate(certInfoEx, certArrPtr.toArray());
	},
	ASiCGetSignTimeInfo: function(signIndex, asicData) {
		this.CheckMaxDataSize(asicData);

		if ((typeof asicData) == 'string')
			asicData = this.Base64Decode(asicData);

		var pTimeInfoPtr = EUPointer();
		var error;

		try {
			error = Module.ccall('EUASiCGetSignTimeInfo',
				'number',
				['number', 'array', 'number', 'number'],
				[signIndex, asicData, asicData.length,
					pTimeInfoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pTimeInfoPtr.free();

			this.RaiseError(error);
		}

		var timeInfoPtr, timeInfo;

		timeInfoPtr = pTimeInfoPtr.toPtr();
		timeInfo = new EndUserTimeInfo(timeInfoPtr);
		Module._EUFreeTimeInfo(timeInfoPtr);

		return timeInfo;
	},
	ASiCGetSignReferences: function(signIndex, asicData) {
		this.CheckMaxDataSize(asicData);

		if ((typeof asicData) == 'string')
			asicData = this.Base64Decode(asicData);

		var pPtr = EUPointer();
		var error;

		try {
			error = Module.ccall('EUASiCGetSignReferences',
				'number',
				['number', 'array', 'number', 'number'],
				[signIndex, asicData, asicData.length,
					pPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();

			this.RaiseError(error);
		}
		
		return pPtr.toStringArray(this.fieldsEncoder);
	},
	ASiCGetReference: function(asicData, referenceName) {
		this.CheckMaxDataSize(asicData);
		
		if ((typeof asicData) == 'string')
			asicData = this.Base64Decode(asicData);

		var arrPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUASiCGetReference',
				'number',
				['array', 'number', 'array', 'number', 'number'],
				[asicData, asicData.length, 
					this.fieldsEncoder.encode(referenceName),
					arrPtr.ptr, arrPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			arrPtr.free();
			this.RaiseError(error);
		}

		return arrPtr.toArray();
	},
	ASiCSignData: function(asicType, signType, 
		signLevel, references, asBase64String) {
		var refNames = [];
		var refData = [];
		var refDataSize = 0;
		for (var i = 0; i < references.length; i++) {
			refNames.push(references[i].GetName());
			refData.push(references[i].GetData());
			refDataSize += references[i].GetData().length;
		}

		this.CheckMaxDataSize(refDataSize);
		
		var refNamesString = intArrayFromStrings(
			refNames, this.fieldsEncoder);
		var refDataArray = new EUArrayFromArrayOfArray(refData);

		var pPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUASiCSignData',
				'number',
				['number', 'number', 'number', 
					'array', 'number', 'number', 
					'number', 'number'],
				[asicType, signType, signLevel, 
					refNamesString, refDataArray.arraysPtr, 
					refDataArray.arraysLengthPtr,
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	ASiCAppendSign: function(signLevel, referencesNames,
		asicData, asBase64String) {
		this.CheckMaxDataSize(asicData);

		if ((typeof asicData) == 'string')
			asicData = this.Base64Decode(asicData);

		var refNamesString = referencesNames != null ? 
			intArrayFromStrings(referencesNames, this.fieldsEncoder) : 
			0;

		var pPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUASiCAppendSign',
				'number',
				['number', 
					refNamesString ? 'array' : 'number',
					'array', 'number', 
					'number', 'number'],
				[signLevel,
					refNamesString,
					asicData, asicData.length,
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	ASiCVerifyData: function(signIndex, asicData) {
		this.CheckMaxDataSize(asicData);
		
		if ((typeof asicData) == 'string')
			asicData = this.Base64Decode(asicData);

		var infoPtr = EUPointerSignerInfo();
		var signTimeInfo = null;
		var error;

		try {
			error = Module.ccall('EUASiCVerifyData',
				'number',
				['number', 'array', 'number', 
					'number'],
				[signIndex, asicData, asicData.length,
					infoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			infoPtr.free();
			this.RaiseError(error);
		}

		try {
			signTimeInfo = this.ASiCGetSignTimeInfo(
				signIndex, asicData);
		} catch (e) {
			infoPtr.free();
			throw e;
		}
		
		var info = new EndUserSignInfo(infoPtr.ptr, 
			null, signTimeInfo);
		infoPtr.free();

		return info;
	},
	CtxASiCSignData: function(pkContext,
		signAlgo, asicType, signType, 
		signLevel, references, asBase64String) {
		var refNames = [];
		var refData = [];
		var refDataSize = 0;
		for (var i = 0; i < references.length; i++) {
			refNames.push(references[i].GetName());
			refData.push(references[i].GetData());
			refDataSize += references[i].GetData().length;
		}

		this.CheckMaxDataSize(refDataSize);
		
		var refNamesString = intArrayFromStrings(
			refNames, this.fieldsEncoder);
		var refDataArray = new EUArrayFromArrayOfArray(refData);

		var pPtr = EUPointerArray(
			pkContext.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxASiCSignData',
				'number',
				['number', 'number', 
					'number', 'number', 'number', 
					'array', 'number', 'number', 
					'number', 'number'],
				[pkContext.GetContext(), signAlgo,
					asicType, signType, signLevel, 
					refNamesString, refDataArray.arraysPtr, 
					refDataArray.arraysLengthPtr,
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	CtxASiCAppendSign: function(pkContext,
		signAlgo, signLevel, referencesNames, asicData, 
		asBase64String) {
		this.CheckMaxDataSize(asicData);
		
		var refNamesString = referencesNames != null ? 
			intArrayFromStrings(referencesNames, this.fieldsEncoder) :
			0;

		var pPtr = EUPointerArray(
			pkContext.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxASiCAppendSign',
				'number',
				['number', 'number', 'number',
					refNamesString ? 'array' : 'number',
					'array', 'number', 
					'number', 'number'],
				[pkContext.GetContext(), signAlgo, signLevel, 
					refNamesString, 
					asicData, asicData.length,
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	ASiCGetSignLevel: function(signIndex, asicData) {
		this.CheckMaxDataSize(asicData);

		if ((typeof asicData) == 'string')
			asicData = this.Base64Decode(asicData);

		var intPtr = EUPointerDWORD();
		var error;

		try {
			error = Module.ccall('EUASiCGetSignLevel',
				'number',
				['number', 'array', 'number', 
					'number'],
				[signIndex, asicData, asicData.length, 
					intPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			intPtr.free();
			this.RaiseError(error);
		}

		return intPtr.toNumber();
	},
	CtxASiCGetSignerInfo: function(context, signIndex, asicData) {
		this.CheckMaxDataSize(asicData);

		if ((typeof asicData) == 'string')
			asicData = this.Base64Decode(asicData);

		var pCertInfoExPtr = EUPointer();
		var certArrPtr = EUPointerArray(context.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxASiCGetSignerInfo',
				'number',
				['number', 'number', 'array', 'number',
					'number', 'number', 'number'],
				[context.GetContext(), signIndex, 
					asicData, asicData.length,
					pCertInfoExPtr.ptr, 
					certArrPtr.ptr, certArrPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pCertInfoExPtr.free();
			certArrPtr.free();

			this.RaiseError(error);
		}

		var certInfoExPtr, certInfoEx;

		certInfoExPtr = pCertInfoExPtr.toPtr();
		certInfoEx = new EndUserCertificateInfoEx(
			certInfoExPtr, this.fieldsEncoder);
		Module._EUCtxFreeCertificateInfoEx(
			context.GetContext()|0, certInfoExPtr);

		return new EndUserCertificate(certInfoEx, certArrPtr.toArray());
	},
	ASiCIsAllContentCovered: function(signIndex, asicData) {
		this.CheckMaxDataSize(asicData);

		if ((typeof asicData) == 'string')
			asicData = this.Base64Decode(asicData);

		var intPtr = EUPointerInt();
		var error;

		try {
			error = Module.ccall('EUASiCIsAllContentCovered',
				'number',
				['number', 'array', 'number', 
					'number'],
				[signIndex, asicData, asicData.length, 
					intPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			intPtr.free();
			this.RaiseError(error);
		}

		return intPtr.toBoolean();
	},
	ASiCCreateEmptySign: function(asicType, signType, 
		references, asBase64String) {
		var refNames = [];
		var refData = [];
		var refDataSize = 0;
		for (var i = 0; i < references.length; i++) {
			refNames.push(references[i].GetName());
			refData.push(references[i].GetData());
			refDataSize += references[i].GetData().length;
		}

		this.CheckMaxDataSize(refDataSize);
		
		var refNamesString = intArrayFromStrings(
			refNames, this.fieldsEncoder);
		var refDataArray = new EUArrayFromArrayOfArray(refData);

		var pPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUASiCCreateEmptySign',
				'number',
				['number', 'number',
					'array', 'number', 'number', 
					'number', 'number'],
				[asicType, signType, 
					refNamesString, refDataArray.arraysPtr, 
					refDataArray.arraysLengthPtr,
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	ASiCCreateSignerBegin: function(
		signAlgo, asicType, signType,
		referencesNames, asicData) {
		this.CheckMaxDataSize(asicData);

		if ((typeof asicData) == 'string')
			asicData = this.Base64Decode(asicData);

		var refNamesString = referencesNames != null ? 
			intArrayFromStrings(referencesNames, this.fieldsEncoder) : 
			0;

		var pSignRefPtr = EUPointer();
		var pAttrsHashPtr = EUPointerArray();
		var pASiCDataPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUASiCCreateSignerBegin',
				'number',
				['number', 'number', 'number',
					refNamesString ? 'array' : 'number',
					'array', 'number', 
					'number', 
					'number', 'number',
					'number', 'number'],
				[signAlgo, asicType, signType,
					refNamesString,
					asicData, asicData.length,
					pSignRefPtr.ptr, 
					pAttrsHashPtr.ptr, pAttrsHashPtr.lengthPtr,
					pASiCDataPtr.ptr, pASiCDataPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pSignRefPtr.free();
			pAttrsHashPtr.free();
			pASiCDataPtr.free();
			this.RaiseError(error);
		}

		return new EndUserASiCSigner(
			pSignRefPtr.toString(false, this.fieldsEncoder), 
			pAttrsHashPtr.toArray(), pASiCDataPtr.toArray());
	},
	ASiCCreateSignerEnd: function(
		asicType, signType, signLevel,
		signatureReference, signature, 
		asicData, asBase64String) {
		this.CheckMaxDataSize(signature);
		this.CheckMaxDataSize(asicData);

		if ((typeof signature) == 'string')
			signature = this.Base64Decode(signature);
		if ((typeof asicData) == 'string')
			asicData = this.Base64Decode(asicData);

		var pPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUASiCCreateSignerEnd',
				'number',
				['number', 'number', 'number',
					'array', 'array', 'number', 
					'array', 'number',
					'number', 'number'],
				[asicType, signType, signLevel,
					this.fieldsEncoder.encode(signatureReference),
					signature, signature.length,
					asicData, asicData.length,
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	PDFGetSignType: function(signIndex, signedPDFData) {
		this.CheckMaxDataSize(signedPDFData);

		if ((typeof signedPDFData) == 'string')
			signedPDFData = this.Base64Decode(signedPDFData);

		var intPtr = EUPointerDWORD();
		var error;

		try {
			error = Module.ccall('EUPDFGetSignType',
				'number',
				['number', 'array', 'number', 
					'number'],
				[signIndex, signedPDFData, signedPDFData.length, 
					intPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			intPtr.free();
			this.RaiseError(error);
		}

		return intPtr.toNumber();
	},
	PDFGetSignsCount: function(signedPDFData) {
		this.CheckMaxDataSize(signedPDFData);

		if ((typeof signedPDFData) == 'string')
			signedPDFData = this.Base64Decode(signedPDFData);

		var intPtr = EUPointerDWORD();
		var error;

		try {
			error = Module.ccall('EUPDFGetSignsCount',
				'number',
				['array', 'number', 'number'],
				[signedPDFData, signedPDFData.length, intPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			intPtr.free();
			this.RaiseError(error);
		}

		return intPtr.toNumber();
	},
	PDFGetSignerInfo: function(signIndex, signedPDFData) {
		this.CheckMaxDataSize(signedPDFData);

		if ((typeof signedPDFData) == 'string')
			signedPDFData = this.Base64Decode(signedPDFData);

		var pCertInfoExPtr = EUPointer();
		var certArrPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUPDFGetSignerInfo',
				'number',
				['number', 'array', 'number',
					'number', 'number', 'number'],
				[signIndex, signedPDFData, signedPDFData.length,
					pCertInfoExPtr.ptr, 
					certArrPtr.ptr, certArrPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pCertInfoExPtr.free();
			certArrPtr.free();

			this.RaiseError(error);
		}

		var certInfoExPtr, certInfoEx;

		certInfoExPtr = pCertInfoExPtr.toPtr();
		certInfoEx = new EndUserCertificateInfoEx(
			certInfoExPtr, this.fieldsEncoder);
		Module._EUFreeCertificateInfoEx(certInfoExPtr);

		return new EndUserCertificate(certInfoEx, certArrPtr.toArray());
	},
	CtxPDFGetSignerInfo: function(context, signIndex, signedPDFData) {
		this.CheckMaxDataSize(signedPDFData);

		if ((typeof signedPDFData) == 'string')
			signedPDFData = this.Base64Decode(signedPDFData);

		var pCertInfoExPtr = EUPointer();
		var certArrPtr = EUPointerArray(context.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxPDFGetSignerInfo',
				'number',
				['number', 'number', 'array', 'number',
					'number', 'number', 'number'],
				[context.GetContext(), signIndex, 
					signedPDFData, signedPDFData.length,
					pCertInfoExPtr.ptr, 
					certArrPtr.ptr, certArrPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pCertInfoExPtr.free();
			certArrPtr.free();

			this.RaiseError(error);
		}

		var certInfoExPtr, certInfoEx;

		certInfoExPtr = pCertInfoExPtr.toPtr();
		certInfoEx = new EndUserCertificateInfoEx(
			certInfoExPtr, this.fieldsEncoder);
		Module._EUCtxFreeCertificateInfoEx(
			context.GetContext()|0, certInfoExPtr);

		return new EndUserCertificate(certInfoEx, certArrPtr.toArray());
	},
	PDFGetSignTimeInfo: function(signIndex, signedPDFData) {
		this.CheckMaxDataSize(signedPDFData);

		if ((typeof signedPDFData) == 'string')
			signedPDFData = this.Base64Decode(signedPDFData);

		var pTimeInfoPtr = EUPointer();
		var error;

		try {
			error = Module.ccall('EUPDFGetSignTimeInfo',
				'number',
				['number', 'array', 'number', 'number'],
				[signIndex, signedPDFData, signedPDFData.length,
					pTimeInfoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pTimeInfoPtr.free();

			this.RaiseError(error);
		}

		var timeInfoPtr, timeInfo;

		timeInfoPtr = pTimeInfoPtr.toPtr();
		timeInfo = new EndUserTimeInfo(timeInfoPtr);
		Module._EUFreeTimeInfo(timeInfoPtr);

		return timeInfo;
	},
	PDFSignData: function(pdfData, signType, asBase64String) {
		this.CheckMaxDataSize(pdfData);
		
		var pPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUPDFSignData',
				'number',
				['array', 'number', 'number', 
					'number', 'number'],
				[pdfData, pdfData.length, signType,
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	PDFVerifyData: function(signIndex, signedPDFData) {
		this.CheckMaxDataSize(signedPDFData);
		
		if ((typeof signedPDFData) == 'string')
			signedPDFData = this.Base64Decode(signedPDFData);

		var infoPtr = EUPointerSignerInfo();
		var signTimeInfo = null;
		var error;

		try {
			error = Module.ccall('EUPDFVerifyData',
				'number',
				['number', 'array', 'number', 
					'number'],
				[signIndex, signedPDFData, signedPDFData.length,
					infoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			infoPtr.free();
			this.RaiseError(error);
		}

		try {
			signTimeInfo = this.PDFGetSignTimeInfo(
				signIndex, signedPDFData);
		} catch (e) {
			infoPtr.free();
			throw e;
		}
		
		var info = new EndUserSignInfo(infoPtr.ptr, 
			null, signTimeInfo);
		infoPtr.free();

		return info;
	},
	CtxPDFSignData: function(pkContext,
		signAlgo, pdfData, signType, asBase64String) {
		this.CheckMaxDataSize(pdfData);

		var pPtr = EUPointerArray(
			pkContext.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxPDFSignData',
				'number',
				['number', 'number', 
					'array', 'number', 'number', 
					'number', 'number'],
				[pkContext.GetContext(), signAlgo,
					pdfData, pdfData.length, signType,
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	PDFCreateSignerBegin: function(signAlgo, pdfData) {
		this.CheckMaxDataSize(pdfData);
		
		var pSignRefPtr = EUPointer();
		var pAttrsHashPtr = EUPointerArray();
		var pPDFDataPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUPDFCreateSignerBegin',
				'number',
				['number', 'array', 'number', 'number',
					'number', 'number', 
					'number', 'number'],
				[signAlgo, pdfData, pdfData.length, pSignRefPtr.ptr, 
					pAttrsHashPtr.ptr, pAttrsHashPtr.lengthPtr,
					pPDFDataPtr.ptr, pPDFDataPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pSignRefPtr.free();
			pAttrsHashPtr.free();
			pPDFDataPtr.free();
			this.RaiseError(error);
		}

		return new EndUserPDFSigner(
			pSignRefPtr.toString(false, this.fieldsEncoder), 
			pAttrsHashPtr.toArray(), pPDFDataPtr.toArray());
	},
	PDFCreateSignerEnd: function(pdfData, signType, 
		signatureReference, signature, asBase64String) {
		this.CheckMaxDataSize(pdfData);
		this.CheckMaxDataSize(signature);

		if ((typeof pdfData) == 'string')
			pdfData = this.Base64Decode(pdfData);
		if ((typeof signature) == 'string')
			signature = this.Base64Decode(signature);
		
		var pPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUPDFCreateSignerEnd',
				'number',
				['array', 'number', 'number',
					'array', 'array', 'number',
					'number', 'number'],
				[pdfData, pdfData.length, signType,
					this.fieldsEncoder.encode(signatureReference), 
					signature, signature.length,
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	XAdESGetType: function(xadesData) {
		this.CheckMaxDataSize(xadesData);

		if ((typeof xadesData) == 'string')
			xadesData = this.Base64Decode(xadesData);

		var intPtr = EUPointerDWORD();
		var error;

		try {
			error = Module.ccall('EUXAdESGetType',
				'number',
				['array', 'number', 'number'],
				[xadesData, xadesData.length, intPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			intPtr.free();
			this.RaiseError(error);
		}

		return intPtr.toNumber();
	},
	XAdESGetSignsCount: function(xadesData) {
		this.CheckMaxDataSize(xadesData);

		if ((typeof xadesData) == 'string')
			xadesData = this.Base64Decode(xadesData);

		var intPtr = EUPointerDWORD();
		var error;

		try {
			error = Module.ccall('EUXAdESGetSignsCount',
				'number',
				['array', 'number', 'number'],
				[xadesData, xadesData.length, intPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			intPtr.free();
			this.RaiseError(error);
		}

		return intPtr.toNumber();
	},
	XAdESGetSignLevel: function(signIndex, xadesData) {
		this.CheckMaxDataSize(xadesData);

		if ((typeof xadesData) == 'string')
			xadesData = this.Base64Decode(xadesData);

		var intPtr = EUPointerDWORD();
		var error;

		try {
			error = Module.ccall('EUXAdESGetSignLevel',
				'number',
				['number', 'array', 'number', 
					'number'],
				[signIndex, xadesData, xadesData.length, 
					intPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			intPtr.free();
			this.RaiseError(error);
		}

		return intPtr.toNumber();
	},
	XAdESGetSignerInfo: function(signIndex, xadesData) {
		this.CheckMaxDataSize(xadesData);

		if ((typeof xadesData) == 'string')
			xadesData = this.Base64Decode(xadesData);

		var pCertInfoExPtr = EUPointer();
		var certArrPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUXAdESGetSignerInfo',
				'number',
				['number', 'array', 'number',
					'number', 'number', 'number'],
				[signIndex, xadesData, xadesData.length,
					pCertInfoExPtr.ptr, 
					certArrPtr.ptr, certArrPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pCertInfoExPtr.free();
			certArrPtr.free();

			this.RaiseError(error);
		}

		var certInfoExPtr, certInfoEx;

		certInfoExPtr = pCertInfoExPtr.toPtr();
		certInfoEx = new EndUserCertificateInfoEx(
			certInfoExPtr, this.fieldsEncoder);
		Module._EUFreeCertificateInfoEx(certInfoExPtr);

		return new EndUserCertificate(certInfoEx, certArrPtr.toArray());
	},
	XAdESGetSignTimeInfo: function(signIndex, xadesData) {
		this.CheckMaxDataSize(xadesData);

		if ((typeof xadesData) == 'string')
			xadesData = this.Base64Decode(xadesData);

		var pTimeInfoPtr = EUPointer();
		var error;

		try {
			error = Module.ccall('EUXAdESGetSignTimeInfo',
				'number',
				['number', 'array', 'number', 'number'],
				[signIndex, xadesData, xadesData.length,
					pTimeInfoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pTimeInfoPtr.free();

			this.RaiseError(error);
		}

		var timeInfoPtr, timeInfo;

		timeInfoPtr = pTimeInfoPtr.toPtr();
		timeInfo = new EndUserTimeInfo(timeInfoPtr);
		Module._EUFreeTimeInfo(timeInfoPtr);

		return timeInfo;
	},
	XAdESGetSignReferences: function(signIndex, xadesData) {
		this.CheckMaxDataSize(xadesData);

		if ((typeof xadesData) == 'string')
			xadesData = this.Base64Decode(xadesData);

		var pPtr = EUPointer();
		var error;

		try {
			error = Module.ccall('EUXAdESGetSignReferences',
				'number',
				['number', 'array', 'number', 'number'],
				[signIndex, xadesData, xadesData.length,
					pPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pPtr.free();

			this.RaiseError(error);
		}
		
		return pPtr.toStringArray(this.fieldsEncoder);
	},
	XAdESGetReference: function(xadesData, referenceName) {
		this.CheckMaxDataSize(xadesData);
		
		if ((typeof xadesData) == 'string')
			xadesData = this.Base64Decode(xadesData);

		var arrPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUXAdESGetReference',
				'number',
				['array', 'number', 'array', 'number', 'number'],
				[xadesData, xadesData.length, 
					this.fieldsEncoder.encode(referenceName),
					arrPtr.ptr, arrPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			arrPtr.free();
			this.RaiseError(error);
		}

		return arrPtr.toArray();
	},
	XAdESSignData: function(xadesType, signLevel, 
		references, asBase64String) {
		var refNames = [];
		var refData = [];
		var refDataSize = 0;
		for (var i = 0; i < references.length; i++) {
			refNames.push(references[i].GetName());
			refData.push(references[i].GetData());
			refDataSize += references[i].GetData().length;
		}

		this.CheckMaxDataSize(refDataSize);
		
		var refNamesString = intArrayFromStrings(
			refNames, this.fieldsEncoder);
		var refDataArray = new EUArrayFromArrayOfArray(refData);

		var pPtr = EUPointerArray();
		var error;

		try {
			error = Module.ccall('EUXAdESSignData',
				'number',
				['number', 'number', 
					'array', 'number', 'number', 
					'number', 'number'],
				[xadesType, signLevel, 
					refNamesString, refDataArray.arraysPtr, 
					refDataArray.arraysLengthPtr,
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	XAdESVerifyData: function(references, signIndex, xadesData) {
		var refNamesString = null;
		var refDataArray = null;

		if (references != null) {
			var refNames = [];
			var refData = [];
			var refDataSize = 0;
			for (var i = 0; i < references.length; i++) {
				refNames.push(references[i].GetName());
				refData.push(references[i].GetData());
				refDataSize += references[i].GetData().length;
			}

			this.CheckMaxDataSize(refDataSize);
		
			refNamesString = intArrayFromStrings(
				refNames, this.fieldsEncoder);
			refDataArray = new EUArrayFromArrayOfArray(refData);
		}

		this.CheckMaxDataSize(xadesData);
		
		if ((typeof xadesData) == 'string')
			xadesData = this.Base64Decode(xadesData);

		var infoPtr = EUPointerSignerInfo();
		var signTimeInfo = null;
		var error;

		try {
			error = Module.ccall('EUXAdESVerifyData',
				'number',
				[refNamesString != null ? 'array' : 'number', 
					'number', 'number', 
					'number', 'array', 'number', 
					'number'],
				[refNamesString, 
					refDataArray != null ? refDataArray.arraysPtr : 0, 
					refDataArray != null ? refDataArray.arraysLengthPtr : 0,
					signIndex, xadesData, xadesData.length,
					infoPtr.ptr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			infoPtr.free();
			this.RaiseError(error);
		}

		try {
			signTimeInfo = this.XAdESGetSignTimeInfo(
				signIndex, xadesData);
		} catch (e) {
			infoPtr.free();
			throw e;
		}
		
		var info = new EndUserSignInfo(infoPtr.ptr, 
			null, signTimeInfo);
		infoPtr.free();

		return info;
	},
	CtxXAdESSignData: function(pkContext,
		signAlgo, xadesType, 
		signLevel, references, asBase64String) {
		var refNames = [];
		var refData = [];
		var refDataSize = 0;
		for (var i = 0; i < references.length; i++) {
			refNames.push(references[i].GetName());
			refData.push(references[i].GetData());
			refDataSize += references[i].GetData().length;
		}

		this.CheckMaxDataSize(refDataSize);
		
		var refNamesString = intArrayFromStrings(
			refNames, this.fieldsEncoder);
		var refDataArray = new EUArrayFromArrayOfArray(refData);

		var pPtr = EUPointerArray(
			pkContext.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxXAdESSignData',
				'number',
				['number', 'number', 
					'number', 'number',
					'array', 'number', 'number', 
					'number', 'number'],
				[pkContext.GetContext(), signAlgo,
					xadesType, signLevel, 
					refNamesString, refDataArray.arraysPtr, 
					refDataArray.arraysLengthPtr,
					pPtr.ptr, pPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}
		
		if (error != EU_ERROR_NONE) {
			pPtr.free();
			this.RaiseError(error);
		}

		if (asBase64String)
			return this.Base64Encode(pPtr.toArray());
		else 
			return pPtr.toArray();
	},
	CtxXAdESGetSignerInfo: function(context, signIndex, xadesData) {
		this.CheckMaxDataSize(xadesData);

		if ((typeof xadesData) == 'string')
			xadesData = this.Base64Decode(xadesData);

		var pCertInfoExPtr = EUPointer();
		var certArrPtr = EUPointerArray(context.GetContext());
		var error;

		try {
			error = Module.ccall('EUCtxXAdESGetSignerInfo',
				'number',
				['number', 'number', 'array', 'number',
					'number', 'number', 'number'],
				[context.GetContext(), signIndex, 
					xadesData, xadesData.length,
					pCertInfoExPtr.ptr, 
					certArrPtr.ptr, certArrPtr.lengthPtr]);
		} catch (e) {
			error = EU_ERROR_UNKNOWN;
		}

		if (error != EU_ERROR_NONE) {
			pCertInfoExPtr.free();
			certArrPtr.free();

			this.RaiseError(error);
		}

		var certInfoExPtr, certInfoEx;

		certInfoExPtr = pCertInfoExPtr.toPtr();
		certInfoEx = new EndUserCertificateInfoEx(
			certInfoExPtr, this.fieldsEncoder);
		Module._EUCtxFreeCertificateInfoEx(
			context.GetContext()|0, certInfoExPtr);

		return new EndUserCertificate(certInfoEx, certArrPtr.toArray());
	}
});

//=============================================================================
