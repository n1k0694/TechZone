// Catálogo de ejemplo con imágenes
const productos = [
  { id: 1, nombre: "Teclado Mecánico RGB", precio: 45000, imagen: "img/teclado-rgb.png" },
  { id: 2, nombre: "Mouse Óptico Gamer", precio: 25000, imagen: "img/mouse.png" },
  { id: 3, nombre: "Auriculares Inalámbricos", precio: 60000, imagen: "img/audifonos.png" }
];

// Carrito con persistencia en cookies
let carrito = [];

// Función para leer cookies
function getCookie(nombre) {
  const valor = `; ${document.cookie}`;
  const partes = valor.split(`; ${nombre}=`);
  if (partes.length === 2) return decodeURIComponent(partes.pop().split(";").shift());
  return null;
}

// Recuperar carrito si existe en cookies
const carritoGuardado = getCookie("carrito");
if (carritoGuardado) {
  carrito = JSON.parse(carritoGuardado);
  actualizarCarrito();
}

// Función para agregar productos al carrito
function agregarCarrito(id) {
  const producto = productos.find(p => p.id === id);
  if (producto !== undefined) {
    carrito.push(producto);
    actualizarCarrito();
    // Guardar cookie con último producto agregado
    document.cookie = `ultimoProducto=${producto.nombre}; path=/`;
  }
}

// Función para actualizar la vista del carrito
function actualizarCarrito() {
  const listaCarrito = document.getElementById("listaCarrito");
  const totalCarrito = document.getElementById("totalCarrito");

  if (!listaCarrito || !totalCarrito) return;

  // Limpiar lista
  listaCarrito.innerHTML = "";

  let total = 0;

  carrito.forEach((p, index) => {
    total += p.precio;
    const item = document.createElement("li");
    item.className = "list-group-item d-flex justify-content-between align-items-center";
    item.innerHTML = `
      <div class="d-flex align-items-center">
        <img src="${p.imagen}" alt="${p.nombre}" style="width:50px; height:50px; object-fit:contain; margin-right:10px;">
        ${p.nombre} - $${p.precio.toLocaleString("es-CL", { minimumFractionDigits: 0 })}
      </div>
      <button class="btn btn-sm btn-danger" onclick="eliminarDelCarrito(${index})">X</button>
    `;
    listaCarrito.appendChild(item);
  });

  // Mostrar total con formato chileno y decimales
  totalCarrito.textContent = total.toLocaleString("es-CL", { minimumFractionDigits: 0 });

  // Guardar carrito completo en cookie (JSON) con duración de 7 días
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 7);
  document.cookie = `carrito=${encodeURIComponent(JSON.stringify(carrito))}; expires=${fecha.toUTCString()}; path=/`;
}

// Función para eliminar productos del carrito
function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
  actualizarCarrito();
}

// Renderizar catálogo dinámicamente al abrir el modal
const catalogoModal = document.getElementById("catalogoModal");
if (catalogoModal) {
  catalogoModal.addEventListener("show.bs.modal", () => {
    const catalogoDiv = document.getElementById("catalogo");
    catalogoDiv.innerHTML = ""; // limpiar contenido previo

    productos.forEach(p => {
      const card = `
        <div class="col-md-4 mb-3">
          <div class="card h-100 shadow-sm">
            <img src="${p.imagen}" class="card-img-top" alt="${p.nombre}" style="height:150px; object-fit:contain;">
            <div class="card-body text-center">
              <h5 class="card-title">${p.nombre}</h5>
              <p class="card-text">Precio: $${p.precio.toLocaleString("es-CL", { minimumFractionDigits: 0 })}</p>
              <button class="btn btn-primary" onclick="agregarCarrito(${p.id})">
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      `;
      catalogoDiv.innerHTML += card;
    });
  });
}

// Manejo del formulario de contacto (pagina3.html)
const contactForm = document.getElementById("contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const correo = document.getElementById("correo").value;
    const mensaje = document.getElementById("mensaje").value;

    // Validaciones estrictas
    if (nombre === "" || correo === "" || mensaje === "") {
      alert("Todos los campos son obligatorios");
      return;
    }

    // Validación de formato de correo
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexCorreo.test(correo)) {
      alert("El formato del correo no es válido");
      return;
    }

    // Simulación de envío con setTimeout
    setTimeout(() => {
      alert("Mensaje enviado correctamente (simulación local)");
      // Guardar cookie de sesión con el nombre del usuario
      document.cookie = `usuario=${nombre}; path=/`;
    }, 1000);

    // Resetear formulario
    contactForm.reset();
  });
}
