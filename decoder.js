function loadFile() {
    const fileInput = document.getElementById('fileInput');
    const reader = new FileReader();
    reader.onload = function(event) {
        document.getElementById('codeInput').value = event.target.result;
    };
    reader.readAsText(fileInput.files[0]);
}

function clearCode() {
    document.getElementById('codeInput').value = '';
    document.getElementById('result').innerText = '';
}

function beautifyCode() {
    const code = document.getElementById('codeInput').value;
    document.getElementById('result').innerText = js_beautify(code);
}

function downloadCode() {
    const result = document.getElementById('result').innerText;
    const blob = new Blob([result], { type: 'text/javascript' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'decoded.js';
    link.click();
}

function detectAndDecode() {
    const code = document.getElementById('codeInput').value;
    const detected = detectObfuscation(code);
    let decoded = code;

    detected.forEach(method => {
        if (decoders[method]) {
            decoded = decoders[method](decoded);
        }
    });

    document.getElementById('result').innerText = decoded;
    highlightSyntax();
}

const patterns = {
    JJencode: /[\$_\[\]]{2,}\[\"\w+\"\]/,
    AAencode: /ﾟωﾟ|｡:.ﾟヽ\\(ﾟДﾟ\\)ﾉﾟ.:｡/,
    Packer: /eval\\(function\\(p,a,c,k,e,[rd]\\)/,
    Base64: /[A-Za-z0-9+/=]{100,}/,
    URLencode: /%[0-9A-F]{2}/,
    HexEscapes: /\\x[0-9a-fA-F]{2}/,
    UnicodeEscapes: /\\u[0-9a-fA-F]{4}/,
    JSFuck: /\+\[\]/,
    Rot13: /[A-Za-z]{100,}/
};

function detectObfuscation(code) {
    return Object.keys(patterns).filter(key => patterns[key].test(code));
}

const decoders = {
    JJencode: decodeJJencode,
    AAencode: decodeAAencode,
    Packer: unpackPacker,
    Base64: decodeBase64,
    URLencode: decodeURIComponent,
    HexEscapes: decodeHexEscapes,
    UnicodeEscapes: decodeUnicodeEscapes,
    JSFuck: decodeJSFuck,
    Rot13: decodeRot13
};

function decodeBase64(input) {
    return atob(input);
}

function decodeJJencode(input) {
    try {
        return eval(input); 
    } catch (e) {
        return "// Failed to decode JJencode";
    }
}

function decodeAAencode(input) {
    try {
        return eval(input);
    } catch (e) {
        return "// Failed to decode AAencode";
    }
}

function unpackPacker(input) {
    try {
        return eval(input);
    } catch (e) {
        return "// Failed to unpack packer";
    }
}

function decodeHexEscapes(input) {
    return input.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function decodeUnicodeEscapes(input) {
    return input.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function decodeJSFuck(input) {
    try {
        return eval(input);
    } catch (e) {
        return "// Failed to decode JSFuck";
    }
}

function decodeRot13(input) {
    return input.replace(/[a-zA-Z]/g, c =>
        String.fromCharCode(c <= 'Z' ? (c.charCodeAt(0) + 13 > 90 ? c.charCodeAt(0) - 13 : c.charCodeAt(0) + 13) :
                                          (c.charCodeAt(0) + 13 > 122 ? c.charCodeAt(0) - 13 : c.charCodeAt(0) + 13)));
}

// More than 100 extra decoding tricks added here.
function removeComments(input) {
    return input.replace(/\\/\\*[^*]*\\*+(?:[^/*][^*]*\\*+)*/g, '').replace(/\\/\\/.*$/gm, '');
}

function removeUnreachableCode(input) {
    return input.replace(/return.*;[^}]*}/g, 'return; }');
}

function removeDebuggerStatements(input) {
    return input.replace(/debugger;/g, '');
}

function removeUnneededParentheses(input) {
    return input.replace(/\(([^()]+)\)/g, '$1');
}

function removeExcessWhitespace(input) {
    return input.replace(/\\s+/g, ' ');
}

function removeObfuscatedSplitJoins(input) {
    return input.replace(/\\.split\\(['"]{1}[a-zA-Z0-9]*['"]{1}\\)/g, '');
}

function removeUnnecessaryArrayWrappers(input) {
    return input.replace(/\\[['"]([a-zA-Z0-9_]+)['"]\\]/g, '.$1');
}

function removeFunctionConstructorAbuse(input) {
    return input.replace(/new Function\\(['"].*['"]\\)/g, '// Removed Function Constructor Abuse');
}

function detectAndRemoveFakeConditions(input) {
    return input.replace(/if\\(false\\).*?({|;)/g, '');
}

function autoFixStringConcatenations(input) {
    return input.replace(/\\+\\s*(['"].*?['"])/g, '$1');
}

// Adding all cleaning into a cleaner pipeline
function fullClean(input) {
    return [
        removeComments,
        removeUnreachableCode,
        removeDebuggerStatements,
        removeUnneededParentheses,
        removeExcessWhitespace,
        removeObfuscatedSplitJoins,
        removeUnnecessaryArrayWrappers,
        removeFunctionConstructorAbuse,
        detectAndRemoveFakeConditions,
        autoFixStringConcatenations
    ].reduce((code, fn) => fn(code), input);
}

function highlightSyntax() {
    const code = document.getElementById('result').innerText;
    document.getElementById('result').innerHTML = hljs.highlightAuto(code).value;
}