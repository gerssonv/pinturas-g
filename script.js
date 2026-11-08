/* =========================================================
   PINTURAS G – lógica del cotizador
   ========================================================= */

/* ===== EDITA AQUÍ: número, precios y modelos ===== */

// WhatsApp: código de país (506) + número, sin "+" ni espacios
var WHATSAPP = "50687910035";

var VEHICLE = [
  { id: "small", label: "Pequeño", note: "Sedán, hatchback, compacto" },
  { id: "big",   label: "Grande",  note: "SUV, pickup, van" }
];

// Precios en colones. "price" tiene un valor para vehículo pequeño y otro para grande.
var SERVICES = [
  {
    id: "detail",
    label: "Detallado",
    note: "Limpieza y cuidado profundo",
    subTitle: "Tipo de detallado",
    subHint: "¿Qué parte quieres detallar?",
    subs: [
      { id: "int", label: "Interior", note: "Asientos, tapicería, tablero", price: { small: 6000,  big: 7000 } },
      { id: "ext", label: "Exterior", note: "Lavado y brillo de carrocería", price: { small: 6000,  big: 7000 } },
      { id: "tot", label: "Total",    note: "Interior y exterior",           price: { small: 10000, big: 12000 } }
    ]
  },
  {
    id: "paint",
    label: "Pintura",
    note: "Reparación y pintura de carrocería",
    subTitle: "Tipo de pintura",
    subHint: "¿El vehículo tiene golpes por reparar antes de pintar?",
    subs: [
      { id: "only",     label: "Solo pintura",       note: "La carrocería está lista" },
      { id: "straight", label: "Enderezado y pintura", note: "Se cotiza con fotos" }
    ]
  }
];

// Solo pintura, color liso. price: null = se cotiza con fotos
var PIECES = [
  { id: 1, label: "1 pieza",        price: 40000 },
  { id: 2, label: "2 piezas",       price: 70000 },
  { id: 3, label: "3 o más piezas", price: null }
];

// special: true = no tiene precio fijo, se cotiza con fotos
var FINISH = [
  { id: "solid",   label: "Color liso",         note: "Blanco, negro, rojo, gris...", special: false },
  { id: "special", label: "Metálico o perlado", note: "Se cotiza con fotos",          special: true }
];

// Lista de modelos (puedes agregar o quitar)
var MODELS = {
  "Toyota":     ["Yaris", "Corolla", "Rush", "RAV4", "Hilux", "Fortuner", "Prado"],
  "Hyundai":    ["Accent", "Elantra", "Creta", "Tucson", "Santa Fe"],
  "Nissan":     ["Versa", "Sentra", "Kicks", "X-Trail", "Frontier"],
  "Suzuki":     ["Alto", "Swift", "Celerio", "Vitara", "Jimny"],
  "Kia":        ["Picanto", "Rio", "Soul", "Seltos", "Sportage", "Sorento"],
  "Honda":      ["Fit", "Civic", "HR-V", "CR-V"],
  "Mazda":      ["2", "3", "CX-3", "CX-5"],
  "Mitsubishi": ["Mirage", "ASX", "Outlander", "L200", "Montero Sport"],
  "Ford":       ["Fiesta", "Escape", "Ranger"],
  "Chevrolet":  ["Spark", "Aveo", "Captiva"]
};

/* ===== FIN DE LO EDITABLE ===== */


// Lo que el cliente va eligiendo
var state = { vehicle: null, service: null, sub: null, pieces: null, finish: null };

function $(id) { return document.getElementById(id); }

// 40000 -> "₡40.000"
function money(n) {
  return "₡" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Crea los botones de una sección a partir de una lista
function fill(boxId, items, onPick) {
  var box = $(boxId);
  box.innerHTML = "";
  items.forEach(function (item) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "opt";
    b.setAttribute("aria-pressed", "false");
    b.innerHTML = item.label + (item.note ? "<small>" + item.note + "</small>" : "");
    b.onclick = function () {
      Array.prototype.forEach.call(box.children, function (c) { c.setAttribute("aria-pressed", "false"); });
      b.setAttribute("aria-pressed", "true");
      onPick(item);
    };
    box.appendChild(b);
  });
}

function hide(ids) { ids.forEach(function (id) { $(id).hidden = true; }); }

function show(id) {
  $(id).hidden = false;
  setTimeout(function () { $(id).scrollIntoView({ behavior: "smooth", block: "start" }); }, 50);
}

/* ---------- Pasos ---------- */

// Paso 1: vehículo
fill("vehicle", VEHICLE, function (v) {
  state.vehicle = v; state.service = null; state.sub = null; state.pieces = null; state.finish = null;
  hide(["s-sub", "s-pieces", "s-finish", "s-sum"]);
  fill("service", SERVICES, pickService);
  show("s-service");
});

// Paso 2: servicio
function pickService(s) {
  state.service = s; state.sub = null; state.pieces = null; state.finish = null;
  hide(["s-pieces", "s-finish", "s-sum"]);
  $("subTitle").textContent = s.subTitle;
  $("subHint").textContent = s.subHint;
  fill("sub", s.subs, pickSub);
  show("s-sub");
}

// Paso 3: tipo de detallado / de pintura
function pickSub(x) {
  state.sub = x; state.pieces = null; state.finish = null;
  hide(["s-pieces", "s-finish", "s-sum"]);

  if (state.service.id === "paint" && x.id === "only") {
    fill("pieces", PIECES, function (p) {
      state.pieces = p; state.finish = null;
      hide(["s-finish", "s-sum"]);
      fill("finish", FINISH, function (f) { state.finish = f; showSummary(); });
      show("s-finish");
    });
    show("s-pieces");
  } else {
    showSummary(); // detallado, o enderezado y pintura
  }
}

/* ---------- Resumen ---------- */

function showSummary() {
  update();
  show("s-sum");
}

// Devuelve el precio, o null si hay que cotizar con fotos
function getPrice() {
  var s = state;
  if (s.service.id === "detail") return s.sub.price[s.vehicle.id];
  if (s.sub.id === "straight") return null;
  if (s.finish.special) return null;
  return s.pieces.price; // puede ser null (3 o más piezas)
}

function getModel() {
  var m = $("model").value;
  if (m === "other") return $("other").value.trim();
  return m;
}

function update() {
  var s = state;
  var price = getPrice();
  var needsPhotos = (price === null);

  // Filas del resumen
  var rows = [["Vehículo", s.vehicle.label], ["Servicio", s.service.label], [s.service.subTitle, s.sub.label]];
  if (s.pieces) rows.push(["Piezas", s.pieces.label]);
  if (s.finish) rows.push(["Color", s.finish.label]);
  $("rows").innerHTML = rows.map(function (r) {
    return "<li><span>" + r[0] + "</span><b>" + r[1] + "</b></li>";
  }).join("");

  // Precio y nota
  if (needsPhotos) {
    $("price").textContent = "Cotizar con fotos";
    $("note").textContent = "Este trabajo puede incluir más detalle. Envíanos fotos por WhatsApp y te damos el precio.";
    $("send").textContent = "Enviar fotos por WhatsApp";
  } else {
    $("price").textContent = money(price);
    $("note").textContent = "El precio se confirma al revisar el vehículo.";
    $("send").textContent = "Enviar cotización por WhatsApp";
  }

  // El nombre es obligatorio para poder enviar
  var name = $("name").value.trim();
  var send = $("send");
  $("warn").hidden = !!name;
  if (!name) {
    send.setAttribute("aria-disabled", "true");
    send.href = "#";
    return;
  }
  send.removeAttribute("aria-disabled");

  // Mensaje de WhatsApp
  var model = getModel();
  var text = "Hola, quiero cotizar con Pinturas G.\n" +
    "Nombre: " + name + "\n" +
    (model ? "Vehículo: " + model + "\n" : "") +
    "Tamaño: " + s.vehicle.label + "\n" +
    "Servicio: " + s.service.label + " (" + s.sub.label + ")\n" +
    (s.pieces ? "Piezas: " + s.pieces.label + "\n" : "") +
    (s.finish ? "Color: " + s.finish.label + "\n" : "") +
    (needsPhotos ? "Te enviaré fotos para cotizar." : "Precio: " + money(price));
  send.href = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(text);
}

/* ---------- Lista de modelos ---------- */

(function buildModels() {
  var sel = $("model");
  var html = '<option value="">Selecciona tu modelo</option>';
  Object.keys(MODELS).forEach(function (brand) {
    html += '<optgroup label="' + brand + '">';
    MODELS[brand].forEach(function (m) {
      html += "<option>" + brand + " " + m + "</option>";
    });
    html += "</optgroup>";
  });
  html += '<option value="other">Otro (escríbelo)</option>';
  sel.innerHTML = html;
})();

$("model").addEventListener("change", function () {
  $("otherWrap").hidden = ($("model").value !== "other");
  if (!$("s-sum").hidden) update();
});

["name", "other"].forEach(function (id) {
  $(id).addEventListener("input", function () { if (!$("s-sum").hidden) update(); });
});
