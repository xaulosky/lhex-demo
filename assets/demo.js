// Comportamiento mínimo de la copia de demostración. No hay servidor, así que:
// - los formularios y enlaces sin página avisan que la acción no está disponible;
// - ingresar o salir lleva a la portada donde se elige la vista;
// - el selector de período del panel navega entre las páginas ya guardadas;
// - el cotizador del sitio calcula en el navegador con las tasas del momento de la copia.
(function () {
  var D = window.__DEMO__ || {};
  var root = D.root || "./";

  var toast;
  var timer;
  function say(text) {
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "demo-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add("on");
    clearTimeout(timer);
    timer = setTimeout(function () {
      toast.classList.remove("on");
    }, 2600);
  }
  var OFF = "Demostración: esta acción no está disponible en la copia estática.";

  // En ingreso y registro el botón lleva a la portada aunque los campos estén vacíos.
  if (/\/(ingresar|registro)\/$/.test(location.pathname)) {
    document.querySelectorAll("form").forEach(function (form) {
      form.noValidate = true;
    });
  }

  document.addEventListener(
    "submit",
    function (e) {
      e.preventDefault();
      var form = e.target;
      var leaves = form.querySelector('[aria-label="Cerrar sesión"]') || /^\s*Salir\s*$/.test(form.textContent || "");
      var enters = /\/(ingresar|registro)\/$/.test(location.pathname);
      if (leaves || enters) location.href = root;
      else say(OFF);
    },
    true,
  );

  document.addEventListener(
    "click",
    function (e) {
      var off = e.target.closest && e.target.closest("a[data-demo-off]");
      if (off) {
        e.preventDefault();
        say(OFF);
        return;
      }
      // Selector de período del inicio del panel.
      var tab = e.target.closest && e.target.closest('[aria-label="Período analizado"] button');
      if (tab && D.area) {
        var key = { "7 días": "7d", "30 días": "30d", "Este mes": "mes", "13 semanas": "90d" }[tab.textContent.trim()];
        if (key) location.href = root + D.view + D.area + "/p-" + key + "/#resultados";
      }
    },
    true,
  );

  // Cotizador del sitio público.
  var box = document.getElementById("cotizador");
  if (box && D.rates && D.rates.length) {
    var foreign = box.querySelector("#q-foreign");
    var clp = box.querySelector("#q-clp");
    var select = box.querySelector("select");
    var tabs = box.querySelectorAll('[role="group"] button');
    var line = box.querySelector("p.px-1");
    var fmt0 = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });
    var fmt2 = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 });
    var buying = true;
    var edited = "foreign";

    function parse(v) {
      var n = Number(String(v).replace(/\./g, "").replace(",", "."));
      return isFinite(n) && n > 0 ? n : 0;
    }
    function rate() {
      for (var i = 0; i < D.rates.length; i++) if (D.rates[i].code === select.value) return D.rates[i];
      return D.rates[0];
    }
    function render() {
      var r = rate();
      var price = (buying ? r.sell : r.buy) || 1;
      if (edited === "foreign") {
        var a = parse(foreign.value);
        clp.value = a ? fmt0.format(a * price) : "";
      } else {
        var b = parse(clp.value);
        foreign.value = b ? fmt2.format(b / price) : "";
      }
      if (line) line.textContent = "1 " + r.code + " = " + price.toLocaleString("es-CL") + " CLP";
      box.querySelector('label[for="q-foreign"]').textContent = buying ? "Divisas que quieres comprar" : "Divisas que quieres vender";
      box.querySelector('label[for="q-clp"]').textContent = buying ? "Pesos chilenos que pagas" : "Pesos chilenos que recibes";
      tabs.forEach(function (t, i) {
        var on = (i === 0) === buying;
        t.setAttribute("aria-pressed", String(on));
        t.classList.toggle("bg-ink", on);
        t.classList.toggle("text-paper", on);
        t.classList.toggle("text-muted-foreground", !on);
      });
    }
    function clean(input) {
      input.value = input.value.replace(/[^\d.,]/g, "");
    }
    foreign.addEventListener("input", function () {
      clean(foreign);
      edited = "foreign";
      render();
    });
    clp.addEventListener("input", function () {
      clean(clp);
      edited = "clp";
      render();
    });
    select.addEventListener("change", render);
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () {
        buying = i === 0;
        render();
      });
    });
  }
})();
