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
      var button = e.target.closest && e.target.closest("button");
      if (!button) {
        // Un clic fuera del menú de celular lo cierra.
        if (document.body.classList.contains("demo-menu-open") && !e.target.closest("aside, header nav")) document.body.classList.remove("demo-menu-open");
        return;
      }

      // Selector de período del inicio del panel.
      if (button.closest('[aria-label="Período analizado"]') && D.area) {
        var key = { "7 días": "7d", "30 días": "30d", "Este mes": "mes", "13 semanas": "90d" }[button.textContent.trim()];
        if (key) location.href = root + D.view + D.area + "/p-" + key + "/#resultados";
        return;
      }

      // Pestañas (ficha del cliente): todas vienen en la página; se muestra la elegida.
      if (button.getAttribute("role") === "tab") {
        var list = button.closest('[role="tablist"]');
        list.querySelectorAll('[role="tab"]').forEach(function (t) {
          var on = t === button;
          t.setAttribute("aria-selected", String(on));
          t.setAttribute("data-state", on ? "active" : "inactive");
          if (on) t.setAttribute("data-active", "");
          else t.removeAttribute("data-active");
          var panel = document.getElementById(t.getAttribute("aria-controls"));
          if (panel) {
            panel.setAttribute("data-state", on ? "active" : "inactive");
            panel.hidden = false;
          }
        });
        return;
      }

      // Menú en celular: muestra la barra lateral del panel o los enlaces del sitio.
      var label = button.getAttribute("aria-label") || "";
      if (label.indexOf("Abrir menú") === 0) {
        document.body.classList.toggle("demo-menu-open");
        e.stopPropagation();
        return;
      }
      // Menú de usuario: en la copia lleva directo a "Mi cuenta".
      if (label.indexOf("Cuenta de ") === 0 && D.area) {
        location.href = root + D.view + D.area + "/cuenta/";
        return;
      }
      // Mostrar u ocultar una contraseña.
      if (label === "Mostrar contraseña" || label === "Ocultar contraseña") {
        var input = button.parentElement.querySelector("input");
        var show = input.type === "password";
        input.type = show ? "text" : "password";
        button.setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
        return;
      }
      // Mapa del pie de página: cambia la sucursal que se muestra.
      if (button.hasAttribute("data-map-src")) {
        var box = button.parentElement.parentElement;
        box.querySelector("iframe").src = button.getAttribute("data-map-src");
        box.querySelector("[data-map-caption]").textContent = button.getAttribute("data-map-caption-text");
        box.querySelector("[data-map-link]").href = button.getAttribute("data-map-directions");
        button.parentElement.querySelectorAll("button").forEach(function (b) {
          var on = b === button;
          b.setAttribute("aria-pressed", String(on));
          ["border-lime", "bg-lime", "font-medium", "text-ink"].forEach(function (c) {
            b.classList.toggle(c, on);
          });
          ["border-paper/20", "text-muted-dark"].forEach(function (c) {
            b.classList.toggle(c, !on);
          });
        });
        return;
      }
      // El cotizador y el botón de actualizar tienen su propio comportamiento o no hacen nada.
      if (button.closest("#cotizador") || button.type === "submit") return;
      say(button.textContent.indexOf("Buscar") >= 0 || label === "Buscar" ? "Demostración: el buscador necesita el sistema real." : OFF);
    },
    true,
  );

  // Al elegir una sección en el menú de celular, el menú se cierra.
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("aside a, header nav a")) document.body.classList.remove("demo-menu-open");
  });

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
