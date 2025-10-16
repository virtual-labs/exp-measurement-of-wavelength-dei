// Fraunhofer Diffraction: Single-Slit and Circular Aperture
// Original Java-Applet (11.10.2003) converted to JavaScript
// Updated UI: 2023

// ****************************************************************************
// * Author: Walter Fendt (www.walter-fendt.de)                               *
// * This program may be used and distributed for non-commercial purposes,     *
// * as long as this notice is not removed.                                    *
// **************************************************************************** 

// Language-dependent texts are stored in a separate file (e.g., singleslit_de.js).

// Colors:

var colorBackground1 = "#1f2937";                          // Background color for experiment setup (gray-800)
var colorBackground2 = "#111827";                          // Background color for experiment result (gray-900)
var colorSingleSlit = "#4b5563";                           // Color for single slit (gray-600)
var colorIntensityMax = "#0ea5e9";                         // Color for maximum intensity (cyan-500)
var colorIntensityMid = "#a855f7";                         // Color for medium intensity (purple-500)
var colorIntensityLow = "#6366f1";                         // Color for low intensity (indigo-500)

// Other Constants:

var DEG = Math.PI/180;                                     // 1 degree (radians)
var MAX = 90;                                              // Maximum angle (degrees)
var RAD = 200;                                             // Radius of observation screen
var FONT = "normal normal bold 14px 'Inter', sans-serif";  // Font
var zoomLevel = 1.0;                                       // Zoom level (1.0 = normal)
var apertureType = "single-slit";                          // Aperture type (single-slit or circular)

// Attribute:

var canvas, ctx;                                           // Zeichenfläche, Grafikkontext
var width, height;                                         // Abmessungen der Zeichenfläche (Pixel)
var ip1, ip2, ip3;                                         // Eingabefelder
var sl1, sl2, sl3;                                         // Schieberegler
var ch1, ch2;                                              // Auswahlfelder
var op;                                                    // Ausgabefeld
var rb1, rb2;                                              // Radiobuttons

var uM, vM;                                                // Ursprung (Pixel)
var lambda;                                                // Wellenlänge (m)
var b;                                                     // Spaltbreite (m)
var alpha;                                                 // Winkel (Bogenmaß)
var minAlpha;                                              // Winkel für verdeckten Teil des Beobachtungsschirms (Bogenmaß)
var theta, phi;                                            // Azimut- und Höhenwinkel (Bogenmaß)
var a1, a2, b1, b2, b3;                                    // Koeffizienten für Projektion
var poly1, poly2, poly3, slit;                             // Arrays für Polygonecken

// Element der Schaltfläche (aus HTML-Datei):
// id ..... ID im HTML-Befehl
// text ... Text (optional)

function getElement (id, text) {
  var e = document.getElementById(id);                     // Element
  if (text) e.innerHTML = text;                            // Text festlegen, falls definiert
  return e;                                                // Rückgabewert
  } 

// Start:

function start () {
  canvas = getElement("cv");                               // Drawing area
  width = canvas.width; height = canvas.height;            // Dimensions (pixels)
  ctx = canvas.getContext("2d");                           // Graphics context
  getElement("ip1a",text01);                               // Explanatory text (wavelength)
  ip1 = getElement("ip1b");                                // Input field (wavelength)
  getElement("ip1c",nanometer);                            // Unit (wavelength)
  sl1 = getElement("sl1");                                 // Slider (wavelength)
  getElement("ip2a",text02);                               // Explanatory text (slit width)
  ip2 = getElement("ip2b");                                // Input field (slit width)
  getElement("ip2c",nanometer);                            // Unit (slit width)
  sl2 = getElement("sl2");                                 // Slider (slit width)
  getElement("ip3a",text03);                               // Explanatory text (angle)
  ip3 = getElement("ip3b");                                // Input field (angle)
  getElement("ip3c",degree);                               // Unit (angle)
  sl3 = getElement("sl3");                                 // Slider (angle)
  getElement("ch1a",text04);                               // Explanatory text (maxima)
  ch1 = getElement("ch1b");                                // Selection field (maxima)  
  getElement("ch2a",text05);                               // Explanatory text (minima)
  ch2 = getElement("ch2b");                                // Selection field (minima)
  getElement("op1a",text06);                               // Explanatory text (relative intensity)
  op = getElement("op1b");                                 // Output field (relative intensity)  
  rb1 = getElement("rb1");                                 // Radio button (diffraction pattern)
  getElement("lb1",text07);                                // Explanatory text (diffraction pattern)
  rb2 = getElement("rb2");                                 // Radio button (intensity distribution)
  getElement("lb2",text08);                                // Explanatory text (intensity distribution)
  rb1.checked = true;                                      // Initially diffraction pattern selected
  getElement("author",author);                             // Author (and translator)
  
  // Initialize aperture type dropdown
  const apertureDropdown = getElement("aperture-type");
  if (apertureDropdown) {
    apertureDropdown.onchange = function() {
      apertureType = this.value;
      reaction(true);
    };
  }
  
  // Initialize zoom buttons
  const zoomInBtn = getElement("zoom-in");
  const zoomOutBtn = getElement("zoom-out");
  if (zoomInBtn) {
    zoomInBtn.onclick = function() {
      zoomLevel = Math.min(zoomLevel + 0.2, 2.0); // Max zoom: 2x
      canvas.classList.add('zoom-in');
      setTimeout(() => canvas.classList.remove('zoom-in'), 300);
      reaction(true);
    };
  }
  if (zoomOutBtn) {
    zoomOutBtn.onclick = function() {
      zoomLevel = Math.max(zoomLevel - 0.2, 0.5); // Min zoom: 0.5x
      canvas.classList.add('zoom-out');
      setTimeout(() => canvas.classList.remove('zoom-out'), 300);
      reaction(true);
    };
  }
  
  uM = width/2; vM = height/2;                            // Origin (pixels) - centered
  lambda = 600*1e-9;                                       // Initial value wavelength (m)
  b = 1000*1e-9;                                           // Initial value slit width (m)
  alpha = 0;                                               // Initial value angle (radians)
  theta = 200*DEG; phi = 40*DEG;                           // Azimuth and elevation angle (radians)
  calcCoeff();                                             // Calculate coefficients for projection
  setPolygons();                                           // Prepare arrays for polygon corners      
  updateInput(true,true,true);                             // Update input fields
  updateWavelengthColor();                                 // Initialize wavelength color
  reaction(true);                                          // Calculations, output, drawing
  focus(ip1);                                              // Focus for first input field
  
  ip1.onkeydown = reactionEnter;                           // Reaktion auf Enter-Taste (Eingabe Wellenlänge)
  ip2.onkeydown = reactionEnter;                           // Reaktion auf Enter-Taste (Eingabe Spaltbreite)
  ip3.onkeydown = reactionEnter;                           // Reaktion auf Enter-Taste (Eingabe Winkel)
  ip1.onblur = reactionBlur;                               // Reaktion auf Verlust des Fokus (Eingabe Wellenlänge)
  ip2.onblur = reactionBlur;                               // Reaktion auf Verlust des Fokus (Eingabe Spaltabstand)
  ip3.onblur = reactionBlur;                               // Reaktion auf Verlust des Fokus (Eingabe Winkel)
  sl1.onchange = reactionSlider1;                          // Reaktion auf Schieberegler (Wellenlänge)
  sl1.onclick = reactionSlider1;                           // Reaktion auf Schieberegler (Wellenlänge)
  sl2.onchange = reactionSlider2;                          // Reaktion auf Schieberegler (Spaltbreite)
  sl2.onclick = reactionSlider2;                           // Reaktion auf Schieberegler (Spaltbreite)
  sl3.onchange = reactionSlider3;                          // Reaktion auf Schieberegler (Winkel)
  sl3.onclick = reactionSlider3;                           // Reaktion auf Schieberegler (Winkel)
  ch1.onchange = reactionSelect1;                          // Reaktion auf Auswahlfeld (Maximum)
  ch1.onclick = reactionSelect1;                           // Reaktion auf Auswahlfeld (Maximum)
  ch2.onchange = reactionSelect2;                          // Reaktion auf Auswahlfeld (Minimum)
  ch2.onclick = reactionSelect2;                           // Reaktion auf Auswahlfeld (Minimum)
  rb1.onclick = reactionRadio;                             // Reaktion auf Radiobutton (Beugungsmuster)
  rb2.onclick = reactionRadio;                             // Reaktion auf Radiobutton (Intensitätsverteilung)
  } // Ende start
  
// Neuer Eintrag in Auswahlfeld:
// ch ... Auswahlfeld
// w .... Winkel (Bogenmaß)
// k .... Ordnung des Maximums oder Minimums



function addNewOption (ch, w, k) {
  if (isNaN(w)) return;                                    // Falls Winkel nicht definiert, abbrechen
  var s = ToString(w/DEG,1,true)+degreeUnicode;            // Zeichenkette (Winkel im Gradmaß)
  if (k != 0) s += " ("+symbolOrder+" = "+k+")";           // Ordnung in Klammer hinzufügen
  var o = document.createElement("option");                // Neues option-Element
  o.text = s;                                              // Text übernehmen
  ch.add(o);                                               // Element zum Auswahlfeld hinzufügen
  }
      
// Reaktion auf Tastendruck (nur auf Enter-Taste):
// Seiteneffekt lambda, b, alpha 
  
function reactionEnter (e) {
  var enter = (e.key == "Enter" || e.code == "Enter");     // Flag für Enter-Taste
  if (enter) reaction(true);                               // Falls Enter-Taste, Eingabe, Berechnungen, Ausgabe und neu zeichnen                             
  }
  
// Reaktion auf Verlust des Fokus:

function reactionBlur () {
  reaction(true);                                          //  Eingabe, Berechnungen, Ausgabe, neu zeichnen
  }
  
// Fokus für Eingabefeld, Cursor am Ende:
// ip ... Eingabefeld
  
function focus (ip) {
  ip.focus();                                              // Fokus für Eingabefeld
  var n = ip.value.length;                                 // Länge der Zeichenkette
  ip.setSelectionRange(n,n);                               // Cursor setzen
  }
  
// Reaction to slider for wavelength:
// Side effect lambda, b, alpha

function reactionSlider1 () {
  lambda = (38+Number(sl1.value))*1e-8;                    // Wavelength (m)
  updateInput(true,false,false);                           // Update input field
  updateWavelengthColor();                                 // Update wavelength color
  reaction(true);                                          // Process data, calculate, output, redraw
  }
  
// Update the wavelength slider thumb color based on current wavelength
function updateWavelengthColor() {
  const wavelengthNm = lambda * 1e9;
  let color;
  
  // Set color based on wavelength range
  if (wavelengthNm < 450) {
    color = '#6a11cb'; // Violet/Blue
  } else if (wavelengthNm < 500) {
    color = '#2575fc'; // Cyan/Greenish Blue
  } else if (wavelengthNm < 570) {
    color = '#38ef7d'; // Green
  } else if (wavelengthNm < 590) {
    color = '#fffb00'; // Yellow
  } else if (wavelengthNm < 620) {
    color = '#ff9900'; // Orange
  } else {
    color = '#ff0000'; // Red
  }
  
  // Apply color to slider thumb
  sl1.style.color = color;
  
  // Update wavelength display with color
  if (ip1) {
    ip1.style.color = color;
    ip1.style.textShadow = `0 0 5px ${color}40`;
  }
}
  
// Reaktion auf Schieberegler für Spaltbreite:
// Seiteneffekt lambda, b, alpha

function reactionSlider2 () {
  b = (5+Number(sl2.value))*1e-7;                          // Spaltbreite (m)
  updateInput(false,true,false);                           // Eingabefeld aktualisieren
  reaction(true);                                          // Daten übernehmen, rechnen, Ausgabe, neu zeichnen
  }
  
// Reaktion auf Schieberegler für Winkel:
// Seiteneffekt lambda, b, alpha

function reactionSlider3 () {
  alpha = Number(sl3.value)*DEG;                           // Winkel (Bogenmaß)
  updateInput(false,false,true);                           // Eingabefeld aktualisieren
  reaction(true);                                          // Daten übernehmen, rechnen, Ausgabe, neu zeichnen
  }
  
// Reaktion auf Auswahlfeld für Maxima:
// Seiteneffekt lambda, b, alpha

function reactionSelect1 () {
  var k = ch1.selectedIndex;                               // Ordnung des Maximums
  alpha = maximum(k);                                      // Winkel (Bogenmaß)
  updateInput(false,false,true);                           // Eingabefeld aktualisieren
  reaction(false);                                         // Daten übernehmen, rechnen, Ausgabe, neu zeichnen
  }
  
// Reaktion auf Auswahlfeld für Minima:
// Seiteneffekt lambda, b, alpha

function reactionSelect2 () {
  var k = ch2.selectedIndex+1;                             // Ordnung des Minimums 
  alpha = Math.asin(k*lambda/b);                           // Winkel (Bogenmaß)
  updateInput(false,false,true);                           // Eingabefeld aktualisieren
  reaction(false);                                         // Daten übernehmen, rechnen, Ausgabe, neu zeichnen
  }
  
// Reaktion auf Radiobuttons:
// Seiteneffekt lambda, d, alpha

function reactionRadio () {
  reaction(false);                                         // Daten übernehmen, rechnen, Ausgabe, neu zeichnen
  }

// Umwandlung einer Zahl in eine Zeichenkette:
// n ..... Gegebene Zahl
// d ..... Zahl der Stellen
// fix ... Flag für Nachkommastellen (im Gegensatz zu gültigen Ziffern)

function ToString (n, d, fix) {
  var s = (fix ? n.toFixed(d) : n.toPrecision(d));         // Zeichenkette mit Dezimalpunkt
  if (n == 1000) s = "1000";                               // Ausnahme, um "1,00e+3" zu verhindern
  return s.replace(".",decimalSeparator);                  // Eventuell Punkt durch Komma ersetzen
  }
  
// Eingabe einer Zahl
// ef .... Eingabefeld
// d ..... Zahl der Stellen
// fix ... Flag für Nachkommastellen (im Gegensatz zu gültigen Ziffern)
// min ... Minimum des erlaubten Bereichs
// max ... Maximum des erlaubten Bereichs
// Rückgabewert: Zahl oder NaN
  
function inputNumber (ef, d, fix, min, max) {
  var s = ef.value;                                        // Zeichenkette im Eingabefeld
  s = s.replace(",",".");                                  // Eventuell Komma in Punkt umwandeln
  var n = Number(s);                                       // Umwandlung in Zahl, falls möglich
  if (isNaN(n)) n = 0;                                     // Sinnlose Eingaben als 0 interpretieren 
  if (n < min) n = min;                                    // Falls Zahl zu klein, korrigieren
  if (n > max) n = max;                                    // Falls Zahl zu groß, korrigieren
  ef.value = ToString(n,d,fix);                            // Eingabefeld eventuell korrigieren
  return n;                                                // Rückgabewert
  }
   
// Gesamte Eingabe:
// Seiteneffekt lambda, b, alpha, Wirkung auf Eingabefelder und Schieberegler

function input () {
  var ae = document.activeElement;                         // Aktives Element
  lambda = 1e-9*inputNumber(ip1,0,true,380,780);           // Wellenlänge (nm -> m)
  b = 1e-9*inputNumber(ip2,0,true,500,5000);               // Spaltbreite (nm -> m)
  alpha = DEG*inputNumber(ip3,1,true,0,90);                // Winkel (Gradmaß -> Bogenmaß)
  updateSliders();                                         // Schieberegler aktualisieren
  if (ae == ip1) focus(ip2);                               // Fokus für nächstes Eingabefeld
  if (ae == ip2) focus(ip3);                               // Fokus für nächstes Eingabefeld
  if (ae == ip3) ip3.blur();                               // Fokus abgeben
  }
  
// Aktualisierung der Eingabefelder:
// i1 ... Flag für Aktualisierung der Wellenlänge
// i2 ... Flag für Aktualisierung der Spaltbreite
// i3 ... Flag für Aktualisierung des Winkels

function updateInput (i1, i2, i3) {
  if (i1) ip1.value = ToString(1e9*lambda,0,true);         // Wellenlänge (nm)
  if (i2) ip2.value = ToString(1e9*b,0,true);              // Spaltbreite (nm)
  if (i3) ip3.value = ToString(alpha/DEG,1,true);          // Winkel (Grad)
  }
  
// Aktualisierung der Schieberegler:

function updateSliders () {
  sl1.value = Math.round(1e8*lambda-38);                   // Schieberegler Wellenlänge
  sl2.value = Math.round(1e7*b-5);                         // Schieberegler Spaltbreite
  sl3.value = Math.round(alpha/DEG);                       // Schieberegler Winkel
  }
  
// Auswahlfelder für Maxima und Minima aktualisieren:
    
function updateMaxMin () {
  while (ch1.length > 0) ch1.remove(0);                    // Liste der Maxima leeren
  addNewOption(ch1,0,0);                                   // Maximum 0. Ordnung hinzufügen
  var maxK = Math.floor(b/lambda+0.5);                     // Maximale Ordnung eines Maximums (eventuell etwas zu groß)
  for (var k=1; k<=maxK; k++) {                            // Für alle Maxima ab 1. Ordnung ...
    var w = maximum(k);                                    // Winkel (Bogenmaß)
    if (w < 0) break;                                      // Bei sinnlosem Wert abbrechen
    addNewOption(ch1,w,k);                                 // Neuen Eintrag zur Liste hinzufügen
    }
  ch1.selectedIndex = 0;                                   // Maximum 0. Ordnung auswählen
  while (ch2.length > 0) ch2.remove(0);                    // Liste der Minima leeren
  maxK = Math.floor(b/lambda);                             // Maximale Ordnung eines Minimums
  for (k=1; k<=maxK; k++)                                  // Für alle Minima ... 
    addNewOption(ch2,Math.asin(Math.min(k*lambda/b,1)),k); // Neuen Eintrag zur Liste hinzufügen
  ch2.selectedIndex = 0;                                   // Minimum 1. Ordnung auswählen
  }
  
// Update output field:

function updateOutput () {
  var i = 0;
  if (apertureType === "circular") {
    // For circular aperture, use Airy pattern formula
    var x = 2*Math.PI*b*Math.sin(alpha)/lambda;  // x = ka*sin(θ) where k=2π/λ and a=b/2 (aperture radius)
    if (x === 0) {
      i = 1;  // At center, intensity is maximum
    } else {
      // Approximation of [2*J₁(x)/x]² using first few terms
      var j1 = 0.5 - Math.pow(x,2)/16 + Math.pow(x,4)/384 - Math.pow(x,6)/18432;
      i = Math.pow(2*j1/x, 2);
    }
  } else {
    // Default single-slit pattern: [sin(u)/u]²
    i = intensity(alpha);
  }
  op.innerHTML = ToString(i,4,true);        // Relative intensity
  }
  
// Input, calculations, output, redraw:
// mm ... Flag for updating selection fields for maxima/minima
// Side effect lambda, b, alpha  
   
function reaction (mm) {
  input();                                                 // Input
  if (mm) updateMaxMin();                                  // Update selection fields for maxima/minima if needed
  updateOutput();                                          // Update output
  updateSlit();                                            // Update polygon corners for slit
  paint();                                                 // Redraw
  }  
  
//-------------------------------------------------------------------------------------------------

// Koeffizienten für Projektion:
// Seiteneffekt a1, a2, b1, b2, b3
  
function calcCoeff () {
  a1 = -Math.sin(theta); a2 = Math.cos(theta);
  b1 = -Math.sin(phi)*a2; b2 = Math.sin(phi)*a1; b3 = Math.cos(phi);
  }
  
// Berechnung der waagrechten Bildschirmkoordinate:
// x, y, z ... Räumliche Koordinaten
  
function screenU (x, y) {
  return uM+a1*x+a2*y;
  }
  
// Berechnung der senkrechten Bildschirmkoordinate:
// x, y, z ... Räumliche Koordinaten
    
function screenV (x, y, z) {
  return vM-b1*x-b2*y-b3*z;
  }
  
// Setzen einer Polygonecke:
// p ......... Array für Polygonecken
// i ......... Index der Ecke
// x, y, z ... Räumliche Koordinaten
    
function setPoint (p, i, x, y, z) {
  p[i] = {u: screenU(x,y), v: screenV(x,y,z)};
  }
  
// Aktualisiserung des Spalts:
// Seiteneffekt slit
  
function updateSlit () {
  var c = b/2.4e-6;                                           // Hilfsgröße 
  var uu = Math.max(screenU(0,-c),uM+0.5);                    // Ecke rechts unten, waagrechte Koordinate (Pixel)
  var vv = screenV(0,-c,-30);                                 // Ecke rechts unten, senkrechte Koordinate (Pixel)
  slit[0] = {u: uu, v: vv};                                   // Ecke rechts unten
  vv = screenV(0,-c,30);                                      // Ecke rechts oben, senkrechte Koordinate (Pixel)
  slit[1] ={u: uu, v: vv};                                    // Ecke rechts oben
  uu = Math.min(screenU(0,c),uM-0.5);                         // Ecke links oben, waagrechte Koordinate (Pixel)  
  vv = screenV(0,c,30);                                       // Ecke links oben, senkrechte Koordinate (Pixel)
  slit[2] = {u: uu, v: vv};                                   // Ecke links oben
  vv = screenV(0,c,-30);                                      // Ecke links unten, waagrechte Koordinate (Pixel)
  slit[3] = {u: uu, v: vv};                                   // Ecke links unten
  }
  
// Festlegung der Polygone:
// Seiteneffekt poly1, poly2, poly3, minAlpha, slit
  
function setPolygons () {
  poly1 = new Array(4);                                    // Parallelogramm für Einfachspalt
  setPoint(poly1,0,0,50,50);                               // Ecke links oben
  setPoint(poly1,1,0,-50,50);                              // Ecke rechts oben
  setPoint(poly1,2,0,-50,-50);                             // Ecke rechts unten
  setPoint(poly1,3,0,50,-50);                              // Ecke links unten
  poly2 = new Array(4*MAX+2);                              // Polygon für Beobachtungsschirm
  for (var i=0; i<=2*MAX; i++) {                           // Für alle Ecken ...
    var w = (i-MAX)*DEG;                                   // Winkel (Bogenmaß)
    var cos = RAD*Math.cos(w), sin = RAD*Math.sin(w);      // Trigonometrische Werte
    setPoint(poly2,i,cos,sin,50);                          // Ecke am oberen Rand
    setPoint(poly2,4*MAX+1-i,cos,sin,-50);                 // Entsprechende Ecke am unteren Rand
    }
  minAlpha = Math.atan(a2/a1);                             // Winkel für verdeckten Teil (Bogenmaß)
  var i0 = Math.round(-minAlpha/DEG);                      // Entsprechender Index 
  poly3 = new Array((MAX-i0+1)*2);                         // Polygon für verdeckten Teil des Beobachtungsschirms
  for (i=0; i<=MAX-i0; i++) {                              // Für alle Ecken ...
    w = (i-MAX)*DEG;                                       // Winkel (Bogenmaß)
    cos = RAD*Math.cos(w); sin = RAD*Math.sin(w);          // Trigonometrische Werte
    setPoint(poly3,i,cos,sin,50);                          // Ecke am oberen Rand
    setPoint(poly3,2*(MAX-i0)+1-i,cos,sin,-50);            // Entsprechende Ecke am unteren Rand
    }
  slit = new Array(4);                                     // Parallelogramm für Spalt
  updateSlit();                                            // Ecken festlegen
  }
  
// Berechnung der relativen Amplitude (Maximalwert 1):
// x ... Winkel (Bogenmaß)
  
function amplitude (x) {
  if (x == 0) return 1;                                    // Rückgabewert für Maximum 0. Ordnung
  var c = Math.PI*b*Math.sin(x)/lambda;                    // Hilfsgröße
  return Math.sin(c)/c;                                    // Rückgabewert
  }
    
// Berechnung der relativen Intensität (Maximalwert 1):
// x ... Winkel (Bogenmaß)
  
function intensity (x) {
  var a = amplitude(x);                                    // Relative Amplitude
  return a*a;                                              // Rückgabewert
  }
  
// Genaue Berechnung eines Maximums (Intervallschachtelung):
// k ... Ordnung (0, 1, 2, 3, ...)
// Rückgabewert: Zugehöriger Winkel im Bogenmaß, bei Misserfolg -1
  
function maximum (k) {
  if (k == 0) return 0;                                    // Rückgabewert für Maximum 0. Ordnung
  var  l = k*Math.PI;                                      // Linker Rand des Intervalls 
  var r = (k+0.5)*Math.PI;                                 // Rechter Rand des Intervalls
  var m = (l+r)/2;                                         // Mitte des Intervalls
  while (r-l > 1e-10) {                                    // Solange Genauigkeit noch nicht ausreichend ...
    if (Math.tan(m) > m) r = m; else l = m;                // ... Intervall halbieren
    m = (l+r)/2;                                           // Mitte des neuen Intervalls
    }
  if (m*lambda > Math.PI*b) return -1;                     // Misserfolg (Maximum existiert nicht)
  return Math.asin(m*lambda/(Math.PI*b));                  // Normalfall
  }
  
// Hilfsroutine: Multiplikation mit 256, Umwandlung in zweistellige Hexadezimalzahl (Zeichenkette)
// z ... Gegebene Zahl

function toHex (z) {
  if (z < 0) z = 0;                                        // Negative Zahl korrigieren
  if (z > 1) z = 1;                                        // Zahl über 1 korrigieren
  var n = Math.floor(256*z);                               // Multiplikation mit 256
  var hex = n.toString(16);                                // Umwandlung in Hexadezimalzahl (Zeichenkette)
  if (hex.length < 2) hex = "0"+hex;                       // Falls einstellig, führende Null hinzufügen
  if (hex.length > 2) hex = "ff";                          // Zu große Hexadezimalzahl verhindern
  return hex;                                              // Rückgabewert
  }
  
// Berechnung der RGB-Darstellung (Algorithmus von Bruton):
// lambda ... Wellenlänge (m)
// relInt ... relative Intensität (0 bis 1, optional, Defaultwert 1)
// Rückgabewert: Zeichenkette im Format "#rrggbb"
    
function rgb (lambda, relInt) {
  lambda *= 1e9;                                           // Umrechnung in nm
  if (relInt == undefined) relInt = 1;                     // Gegebenenfalls Defaultwert für relInt verwenden
  var r1 = 0, g1 = 0, b1 = 0;                              // Rot-, Grün- und Blau-Anteil (jeweils 0 bis 1)
  if (lambda >= 380 && lambda < 440) {
    r1 = (440-lambda)/60; g1 = 0; b1 = 1;
    }
  else if (lambda < 490) {
    r1 = 0; g1 = (lambda-440)/50; b1 = 1;
    }
  else if (lambda < 510) {
    r1 = 0; g1 = 1; b1 = (510-lambda)/20;
    }
  else if (lambda < 580) {
    r1 = (lambda-510)/70; g1 = 1; b1 = 0;
    }
  else if (lambda < 645) {
    r1 = 1; g1 = (645-lambda)/65; b1 = 0;
    }
  else if (lambda <= 780) {
    r1 = 1; g1 = 0; b1 = 0;
    }
  var f = 0;                                               // Faktor für Abschwächung am Rand
  if (lambda >= 380 && lambda < 420) 
    f = 0.3+0.7*(lambda-380)/40;
  else if (lambda < 700)
    f = 1;
  else if (lambda <= 780)
    f = 0.3+0.7*(780-lambda)/80;
  var gamma = 0.8;                                         // Exponent
  var r2 = relInt*Math.pow(f*r1,gamma);                    // Rot-Anteil unter Berücksichtigung der Intensität
  var g2 = relInt*Math.pow(f*g1,gamma);                    // Grün-Anteil unter Berücksichtigung der Intensität
  var b2 = relInt*Math.pow(f*b1,gamma);                    // Blau-Anteil unter Berücksichtigung der Intensität
  return "#"+toHex(r2)+toHex(g2)+toHex(b2);                // Rückgabewert
  }
  
// Berechnung der RGB-Darstellung (Variante: für kleinere Intensität aufgehellt)
// lambda ... Wellenlänge (m)
// relInt ... relative Intensität (0 bis 1, optional, Defaultwert 1)
// Rückgabewert: Zeichenkette im Format "#rrggbb"
    
function rgb2 (lambda, relInt) {
  var i = Math.pow(relInt,1/3);                            // Vergrößerte Intensität
  return rgb(lambda,i);                                    // Rückgabewert
  }

//-------------------------------------------------------------------------------------------------
  
// Neuer Pfad mit Standardwerten:
// w ... Liniendicke (optional, Defaultwert 1)

function newPath(w) {
  ctx.beginPath();                                         // Neuer Pfad
  ctx.strokeStyle = "#ffffff";                             // Linienfarbe schwarz
  ctx.lineWidth = (w ? w : 1);                             // Liniendicke
  }
  
// Linie zeichnen:
// x1, y1 ... Anfangspunkt
// x2, y2 ... Endpunkt
// c ........ Farbe (optional, Defaultwert schwarz)
// w ........ Liniendicke (optional, Defaultwert 1)

function line (x1, y1, x2, y2, c, w) {
  newPath();                                               // Neuer Grafikpfad (Standardwerte)
  if (w) ctx.lineWidth = w;                                // Liniendicke festlegen, falls angegeben
  if (c) ctx.strokeStyle = c;                              // Linienfarbe festlegen, falls angegeben
  ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);                    // Linie vorbereiten
  ctx.stroke();                                            // Linie zeichnen
  }
  
// Pfeil zeichnen:
// x1, y1 ... Anfangspunkt
// x2, y2 ... Endpunkt
// w ........ Liniendicke (optional)
// Zu beachten: Die Farbe wird durch ctx.strokeStyle bestimmt.

function arrow (x1, y1, x2, y2, w) {
  if (!w) w = 1;                                           // Falls Liniendicke nicht definiert, Defaultwert                          
  var dx = x2-x1, dy = y2-y1;                              // Vektorkoordinaten
  var length = Math.sqrt(dx*dx+dy*dy);                     // Länge
  if (length == 0) return;                                 // Abbruch, falls Länge 0
  dx /= length; dy /= length;                              // Einheitsvektor
  var s = 2.5*w+7.5;                                       // Länge der Pfeilspitze 
  var xSp = x2-s*dx, ySp = y2-s*dy;                        // Hilfspunkt für Pfeilspitze         
  var h = 0.5*w+3.5;                                       // Halbe Breite der Pfeilspitze
  var xSp1 = xSp-h*dy, ySp1 = ySp+h*dx;                    // Ecke der Pfeilspitze
  var xSp2 = xSp+h*dy, ySp2 = ySp-h*dx;                    // Ecke der Pfeilspitze
  xSp = x2-0.6*s*dx; ySp = y2-0.6*s*dy;                    // Einspringende Ecke der Pfeilspitze
  ctx.beginPath();                                         // Neuer Pfad
  ctx.lineWidth = w;                                       // Liniendicke
  ctx.moveTo(x1,y1);                                       // Anfangspunkt
  if (length < 5) ctx.lineTo(x2,y2);                       // Falls kurzer Pfeil, weiter zum Endpunkt, ...
  else ctx.lineTo(xSp,ySp);                                // ... sonst weiter zur einspringenden Ecke
  ctx.stroke();                                            // Linie zeichnen
  if (length < 5) return;                                  // Falls kurzer Pfeil, keine Spitze
  ctx.beginPath();                                         // Neuer Pfad für Pfeilspitze
  ctx.lineWidth = 1;                                       // Liniendicke zurücksetzen
  ctx.fillStyle = ctx.strokeStyle;                         // Füllfarbe wie Linienfarbe
  ctx.moveTo(xSp,ySp);                                     // Anfangspunkt (einspringende Ecke)
  ctx.lineTo(xSp1,ySp1);                                   // Weiter zum Punkt auf einer Seite
  ctx.lineTo(x2,y2);                                       // Weiter zur Spitze
  ctx.lineTo(xSp2,ySp2);                                   // Weiter zum Punkt auf der anderen Seite
  ctx.closePath();                                         // Zurück zum Anfangspunkt
  ctx.fill();                                              // Pfeilspitze zeichnen 
  }
  
// Weißer Markierungspfeil (20 Pixel lang, nach unten):
// (x,y) ... Anfangspunkt (Pixel)
    
function arrowDown (x, y) {
  ctx.strokeStyle = "#000000";                             // Linienfarbe weiß
  arrow(x,y,x,y+20);                                       // Pfeil zeichnen
  }
  
// Ausgefülltes Rechteck:
// x ... Abstand vom linken Rand (Pixel)
// y ... Abstand vom oberen Rand (Pixel)
// w ... Breite (Pixel)
// h ... Höhe (Pixel)
// c ... Füllfarbe
// r ... Flag für Rand (optional, Defaultwert false)

function rectangle (x, y, w, h, c, r) {
  newPath();                                               // Neuer Grafikpfad (Standardwerte)                            
  ctx.fillStyle = c;                                       // Füllfarbe
  ctx.fillRect(x,y,w,h);                                   // Rechteck ausfüllen
  if (r) ctx.strokeRect(x,y,w,h);                          // Falls gewünscht, Rand zeichnen
  }
    
// Ausgefüllter Kreis mit schwarzem Rand:
// (x,y) ... Mittelpunkt (Pixel)
// r ....... Radius (Pixel)
// c ....... Füllfarbe

function circle (x, y, r, c) {
  newPath();                                               // Neuer Grafikpfad (Standardwerte)
  ctx.fillStyle = c;                                       // Füllfarbe
  ctx.arc(x,y,r,0,2*Math.PI,true);                         // Kreis vorbereiten
  ctx.fill();                                              // Kreis ausfüllen
  ctx.stroke();                                            // Rand zeichnen
  }
  
// Polygon zeichnen:
// p ... Array mit Koordinaten der Ecken
// c ... Füllfarbe
// b ... Flag für Rand

function drawPolygon (p, c, b) {
  newPath();                                               // Neuer Grafikpfad (Standardwerte)
  ctx.fillStyle = c;                                       // Füllfarbe
  ctx.moveTo(p[0].u,p[0].v);                               // Zur ersten Ecke
  for (var i=1; i<p.length; i++)                           // Für alle weiteren Ecken ... 
    ctx.lineTo(p[i].u,p[i].v);                             // Linie zum Grafikpfad hinzufügen
  ctx.closePath();                                         // Zurück zum Ausgangspunkt
  ctx.fill();                                              // Polygon ausfüllen
  if (b) ctx.stroke();                                     // Falls gewünscht, Rand zeichnen   
  }
  
// Linker Teil des Beobachtungsschirms (von vorne gesehen):
  	
function screenLeft () {
  drawPolygon(poly2,"#000000",true);                       // Ausgefülltes Polygon (schwarz)
  for (var i=-360; i<=360; i++) {                          // Für alle Indizes ...
    var w = i*DEG/4;                                       // Winkel (-90° bis +90°, Abstand 0,25°, Bogenmaß)
  	var x = RAD*Math.cos(w), y = RAD*Math.sin(w);          // Räumliche Koordinaten  
  	var u = screenU(x,y), v = screenV(x,y,0);              // Zugehörige Bildschirmkoordinaten (Pixel)
  	var c = rgb2(lambda,intensity(w));                     // RGB-Codierung im Format "#rrggbb"
  	line(u,v-1.5,u,v+1.5,c,1.5);                           // Teil des Beugungsmusters
  	}
  x = RAD*Math.cos(alpha); y = RAD*Math.sin(alpha);        // Räumliche Koordinaten für Markierungspfeile
  u = screenU(x,y); v = screenV(x,y,35);                   // Zugehörige Bildschirmkoordinaten (Pixel)
  arrowDown(u,v);                                          // Linker Markierungspfeil
  if (-alpha > minAlpha) {                                 // Falls rechter Markierungspfeil sichtbar ...
    u = screenU(x,-y); v = screenV(x,-y,35);               // Bildschirmkoordinaten (Pixel)
    arrowDown(u,v);                                        // Rechter Markierungspfeil
    }
  }
  
// Rechter Teil des Beobachtungsschirms (von hinten gesehen):
  	  
function screenRight () {
  drawPolygon(poly3,"#000000",true);                       // Ausgefülltes Polygon (schwarz)
  var x = RAD*Math.cos(minAlpha);                          // x-Koordinate für Grenze des sichtbaren Teils
  var y = RAD*Math.sin(minAlpha);                          // y-Koordinate für Grenze des sichtbaren Teils
  var u = screenU(x,y);                                    // Zugehörige waagrechte Bildschirmkoordinate (Pixel)
  ctx.fillStyle = colorBackground1;                        // Hintergrundfarbe als Füllfarbe
  ctx.fillRect(u,0,10,300);                                // Mögliche Ungenauigkeiten verdecken
  }
  	  
// Strahlen für die Maxima (nach dem Spalt):
  	
function raysMaxima () {
  var c = rgb(lambda);                                     // RGB-Codierung der Spektralfarbe
  var u = screenU(RAD,0), v = screenV(RAD,0,0);            // Bildschirmkoordinaten Mittelpunkt (Pixel)
  line(uM,vM,u,v,c,2);                                     // Lichtstrahl in der Mitte
  var maxK = Math.floor(b/lambda+0.5);                     // Maximale Ordnung eines Maximums (eventuell etwas zu groß)
  for (var k=1; k<=maxK; k++) {                            // Für alle Maxima ab 1. Ordnung ...
  	var w = maximum(k);                                    // Winkel (Bogenmaß)
  	if (w < 0) break;                                      // Bei sinnlosem Wert abbrechen
  	var x = RAD*Math.cos(w), y = RAD*Math.sin(w);          // Räumliche Koordinaten für linken Lichtstrahl
  	u = screenU(x,y); v = screenV(x,y,0);                  // Bildschirmkoordinaten für linken Lichtstrahl (Pixel)
  	line(uM,vM,u,v,c,2);                                   // Lichtstrahl links zeichnen
  	u = screenU(x,-y); v = screenV(x,-y,0);                // Bildschirmkoordinaten  für rechten Lichtstrahl (Pixel)
  	line(uM,vM,u,v,c,2);                                   // Lichtstrahl rechts zeichnen
  	}
  }
  
// Einfachspalt:
  	
function singleSlit () {
  drawPolygon(poly1,colorSingleSlit,true);                 // Ausgefülltes Parallelogramm mit Rand
  drawPolygon(slit,"#000000",true);                        // Spalt
  }
  
// Lichtstrahl vor dem Spalt:
  	
function rayBefore () {
  var u = screenU(-200,0), v = screenV(-200,0,0);          // Koordinaten Lichtquelle (Pixel)
  line(uM,vM,u,v,rgb(lambda),4);                           // Lichtstrahl zeichnen
  }
  
// Horizontale Achse (Winkel):
// (u,v) ... Ursprung (Pixel)
// c ....... Farbe
    
function horAxis (u, v, c) {
  ctx.strokeStyle = c;                                     // Farbe übernehmen
  arrow(u,v,u+190,v,1.5);                                  // Waagrechte Achse rechts (Winkel)
  arrow(u,v,u-190,v,1.5);                                  // Waagrechte Achse links (Winkel)
  ctx.textAlign = "center";                                // Textausrichtung zentriert
  for (var i=-3; i<=3; i++) {                              // Für alle Ticks im Abstand 30° ...
    var u0 = u+55*i;                                       // Waagrechte Koordinate (Pixel)
    line(u0,v-3,u0,v+3,c);                                 // Tick zeichnen
    var s = ""+Math.abs(i)*30+degreeUnicode;               // Zeichenkette für Beschriftung
    ctx.fillText(s,u0,v+18);                               // Tick beschriften
    }
  }
  
// Beugungsmuster:
      
function patternDiffraction () {
  var uM = width/2, vM = 360;                              // Mittelpunkt Beugungsmuster (Pixel)
  var  w = 330;                                            // Breite (Pixel)
  var  pix = w/Math.PI;                                    // Umrechnungsfaktor
  rectangle(20,vM-40,width-40,100,"#000000");              // Hintergrund (schwarz)    
  for (var u=uM-w/2; u<=uM+w/2; u++) {                     // Von links nach rechts ...
    var x = (uM-u)/pix;                                    // Winkel (Bogenmaß)
    var c = rgb2(lambda,intensity(x));                     // Farbe
    line(u,vM-1.5,u,vM+1.5,c,1.5);                         // Teil des Beugungsmusters
    }
  var i = alpha*pix;                                       // Aktueller Winkel, umgerechnet in Pixel
  arrowDown(uM-i,vM-30);                                   // Linker Pfeil
  arrowDown(uM+i,vM-30);                                   // Rechter Pfeil
  horAxis(uM,vM+30,"#ffffff");                             // Winkelskala (Grad)
  }
    
// Intensitätsverteilung:
      
function distributionIntensity () {
  var uM = width/2, vM = 410;                              // Ursprung (Pixel)
  horAxis(uM,vM,"#000000");                                // Winkelskala (Grad)
  arrow(uM,vM+5,uM,vM-100,1.5);                            // Senkrechte Achse (Intensität)
  var w = 330;                                             // Breite (Pixel)
  var pixX = w/Math.PI, pixY = 80;                         // Umrechnungsfaktoren
  var u = uM-w/2;                                          // Waagrechte Koordinate Anfangspunkt (Pixel)
  var x = -Math.PI/2;                                      // Zugehöriger Winkel (-90°)
  var y = intensity(x);                                    // Zugehörige Intensität
  var v = vM-y*pixY;                                       // Senkrechte Koordinate Anfangspunkt (Pixel)
  newPath();                                               // Neuer Grafikpfad (Standardwerte)
  ctx.moveTo(u,v);                                         // Anfangspunkt für Polygonzug
  while (u < uM+w/2) {                                     // Solange rechter Rand noch nicht erreicht ...
  	u++;                                                   // Waagrechte Koordinate erhöhen
  	x = (u-uM)/pixX;                                       // Winkel (Bogenmaß) 
  	y = intensity(x);                                      // Relative Intensität
  	v = vM-y*pixY;                                         // Senkrechte Koordinate
  	ctx.lineTo(u,v);                                       // Linie zum Polygonzug hinzufügen
  	}
  ctx.stroke();  	                                       // Polygonzug zeichnen    
  var du = pixX*alpha;                                     // Waagrechte Koordinate (relativ zum Ursprung, Pixel)
  var v0 = vM-intensity(alpha)*pixY;                       // Senkrechte Koordinate (Pixel)
  circle(uM+du,v0,2.5,"#ff0000");                          // Markierung für aktuellen Winkel (rechts)
  circle(uM-du,v0,2.5,"#ff0000");                          // Markierung für aktuellen Winkel (links)
  }
    
// Graphics output:  

function paint () {
  // Clear canvas
  ctx.fillStyle = colorBackground1;                        // Background color for experiment setup
  ctx.fillRect(0,0,width,300);                             // Fill background
  
  // Apply zoom transformation
  ctx.save();                                              // Save current state
  ctx.translate(uM, vM);                                   // Translate to center
  ctx.scale(zoomLevel, zoomLevel);                         // Apply zoom
  ctx.translate(-uM, -vM);                                 // Translate back
  
  // Draw experiment components
  screenLeft();                                            // Left part of observation screen
  raysMaxima();                                            // Rays for maxima
  screenRight();                                           // Right part of observation screen
  
  // Draw aperture based on type
  if (apertureType === "circular") {
    drawCircularAperture();                                // Draw circular aperture
  } else {
    singleSlit();                                          // Draw single slit
  }
  
  rayBefore();                                             // Light ray before the aperture
  ctx.restore();                                           // Restore original state
  
  // Draw results section
  ctx.fillStyle = colorBackground2;                        // Background color for experiment result
  ctx.fillRect(0,300,width,height-300);                    // Fill background
  ctx.font = FONT;                                         // Font
  
  // Draw either diffraction pattern or intensity distribution
  if (rb1.checked) patternDiffraction();                   // Diffraction pattern
  else distributionIntensity();                            // Intensity distribution
  }
  
// Draw circular aperture:

function drawCircularAperture() {
  // Draw the opaque plate
  drawPolygon(poly1,colorSingleSlit,true);                 // Filled parallelogram with border
  
  // Calculate aperture position and size
  var apertureCenterU = uM;
  var apertureCenterV = vM;
  var apertureRadius = b * 1e6 / 2;                        // Convert from m to pixels with scaling
  
  // Draw the circular aperture (black circle in the plate)
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(apertureCenterU, apertureCenterV, apertureRadius, 0, 2*Math.PI);
  ctx.fill();
  
  // Draw border around the aperture
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(apertureCenterU, apertureCenterV, apertureRadius, 0, 2*Math.PI);
  ctx.stroke();
}
  
document.addEventListener("DOMContentLoaded",start,false); // Nach dem Laden der HTML-Seite Methode start ausführen

// Javascript für HTML5-Apps (Physik englisch)
// 13.08.2014 - 11.02.2019

// Konstanten:

var language = "en";                                                 // Abkürzung für Sprache
var textPhysics = "Physics";                                         // Bezeichnung für Physik
var textCollection = "Physics Apps";                                 // Bezeichnung für Programmsammlung
var textTranslation = "Translation:";                                // Bezeichnung für Übersetzung
var textModification = "Last modification";                          // Bezeichnung für letzte Änderung

// Array der Monatsnamen:

var month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Logo Physik-Apps:

function logo (filename) {
  var t = document.createElement("div");                             // Neues div-Element (übergeordnet)
  t.setAttribute("id","Index");                                      // Attribut id setzen (Layout-Festlegung durch CSS-Datei)
  var t1 = document.createElement("div");                            // Neues div-Element (oben)
  t1.setAttribute("id","Index1");                                    // Attribut id setzen (Layout-Festlegung durch CSS-Datei)
  t.appendChild(t1);                                                 // div-Element hinzufügen
  var t2 = document.createElement("div");                            // Neues div-Element (unten)
  t2.setAttribute("id","Index2");                                    // Attribut id setzen (Layout-Festlegung durch CSS-Datei)
  t.appendChild(t2);                                                 // div-Element hinzufügen
  var a1 = document.createElement("a");                              // Neuer Link (für Logo)
  a1.setAttribute("href","index.html");                              // Adresse für Inhaltsverzeichnis
  var i = document.createElement("img");                             // Neues Bild (Logo Physik)
  i.setAttribute("src","../ph/javaphys.gif");                        // Pfadangabe (Bilddatei)
  i.setAttribute("alt",textPhysics);                                 // Alternativer Text
  a1.appendChild(i);                                                 // Bild zum Link hinzufügen
  t1.appendChild(a1);                                                // Link zum oberen div-Element hinzufügen
  var a2 = document.createElement("a");                              // Neuer Link (für Text)
  a2.setAttribute("href","index.html");                              // Adresse für Inhaltsverzeichnis
  a2.innerHTML = textCollection;                                     // Text für Link
  t2.appendChild(a2);                                                // Link zum unteren div-Element hinzufügen
  var body = document.getElementsByTagName("body")[0];               // Body-Element
  body.appendChild(t);                                               // Übergeordnetes div-Element hinzufügen
  }
 
// Datum nach dem Muster "January 1, 2000"
// d ... Tag (1 bis 31)
// m ... Monat (1 bis 12)
// y ... Jahr
  
function date (d, m, y) {
  return month[m-1]+" "+d+", "+y;
  }
  
// Daten am Ende der Seite (URL, Lizenz, letzte Änderung, Übersetzer)

function data (filename, d1, m1, y1, d2, m2, y2, trl) {
  var body = document.getElementsByTagName("body")[0];               // Body-Element
  var p = document.createElement("p");                               // Neuer Absatz
  p.setAttribute("class","Ende");                                    // Klasse (Layout-Festlegung durch CSS-Datei)
  var s = "URL: https://www.walter-fendt.de/html5/ph"+language+"/";  // Anfang der URL
  s += filename+"_"+language+".htm<br>";                             // URL vervollständigen, Zeilenumbruch
  s += "Walter Fendt, "+date(d1,m1,y1)+"<br>";                       // Autor, Datum, Zeilenumbruch
  if (trl) s += textTranslation+" "+trl+"<br>";                      // Ggf. Übersetzer, Zeilenumbruch
  s += textModification+": "+date(d2,m2,y2)+"<br>&nbsp;<br>";        // Datum der letzten Änderung, Zeilenumbruch
  var a = '<a rel="license" href="https://creativecommons.org/licenses/by-nc-sa/4.0/">';
  s += a+'<img alt="Creative Commons License" style="border-width:0" ';
  s += 'src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" /></a><br />';
  s += 'This work is licensed under a ';
  s += a+'Creative Commons Attribution-NonCommercial-ShareAlike ';
  s += '4.0 International License</a>.';
  p.innerHTML = s;                                                   // Inhalt des Absatzes
  body.appendChild(p);                                               // Absatz hinzufügen
  }
  
// Leere Zeile 
  
function emptyLine () {
  var e = document.createElement("div");                             // Neues Div-Element
  e.setAttribute("class","Abstand");                                 // Klasse (Layout-Festlegung durch CSS-Datei)
  e.innerHTML = "\u0020";                                            // Leerzeichen
  return e;                                                          // Rückgabewert
  }
  
// Seitenende insgesamt
// filename ..... Dateiname (ohne Erweiterungen)
// d1, m1, y1 ... Datum der Erstveröffentlichung
// d2, m2, y2 ... Datum der letzten Änderung

function endPage (filename, d1, m1, y1, d2, m2, y2, trl) {
  var body = document.getElementsByTagName("body")[0];               // Body-Element
  body.appendChild(emptyLine());                                     // Leere Zeile hinzufügen
  var hr = document.createElement("hr");                             // Trennstrich
  hr.setAttribute("class","Trennlinie");                             // Klasse (Layout-Festlegung durch CSS-Datei)
  body.appendChild(hr);                                              // Trennstrich hinzufügen
  body.appendChild(emptyLine());                                     // Leere Zeile hinzufügen
  logo(filename);                                                    // Logo
  data(filename,d1,m1,y1,d2,m2,y2,trl);                              // Daten am Ende (URL, Autor, Übersetzer, letzte Änderung, Lizenz)
  }

// Beugung von Licht am Einfachspalt, englische Texte
// Letzte Änderung 08.12.2017

// Texte in HTML-Schreibweise:

var text01 = "Wavelength:";
var text02 = "Width of slit:";
var text03 = "Angle:";
var text04 = "Maxima:";
var text05 = "Minima:";
var text06 = "Relative intensity:";
var text07 = "Diffraction pattern";
var text08 = "Intensity profile";

var author = " ";

// Symbole und Einheiten:

var decimalSeparator = ".";                                // Dezimaltrennzeichen (Komma/Punkt) 

var nanometer = "nm";
var degree = "&deg;";

// Texte in Unicode-Schreibweise:

var symbolOrder = "k";                                     // Symbol für Ordnung eines Maximums oder Minimums
var degreeUnicode = "\u00B0";
  
  
  //Your JavaScript goes in here
