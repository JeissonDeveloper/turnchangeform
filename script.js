// ============================================================================
// JS CONTROL DE TURNOS - RAMO (Lógica de firma original restaurada)
// ============================================================================

const URL_BUSQUEDA = "https://defaultaf5eb6a454944a9ea659b79c92301b.8e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/aed1a8e6527c409fa89020e534c2b5c5/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=eO1cDqSsJme9vmuEXbqUEC0sZqHjRmJHA_a0_nqgH1U";
const URL_ENVIO = "https://defaultaf5eb6a454944a9ea659b79c92301b.8e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/241ab4c9e8dd4b499963538107ded6ae/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=iOKsXvZTSJH4t6IdYRpY3v9ilpWpjChdJngf83FceoY";

let sigColab;
let enviandoFormulario = false;

function mostrarNotificacion(mensaje) {
    alert(mensaje); 
}

function mostrarPreview(datos) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal-preview-overlay';
        modal.innerHTML = `
            <div class="modal-preview-content">
                <h2 style="color:var(--primary); margin-top:0; font-size:1.2rem; text-transform:uppercase;">Confirmar Registro</h2>
                <div style="background:#f1f5f8; padding:15px; border-radius:8px; margin:15px 0; font-size:0.9rem; line-height:1.5;">
                    <p><strong>Colaborador:</strong> ${datos.nombre_colaborador}</p>
                    <p><strong>Cédula:</strong> ${datos.cedula}</p>
                    <p><strong>Área:</strong> ${datos.area}</p>
                    <p><strong>Equipo:</strong> ${datos.marca} ${datos.modelo}</p>
                    <p><strong>Serial:</strong> ${datos.serial}</p>
                </div>
                <div class="modal-preview-buttons" style="display:flex; justify-content:flex-end;">
                    <button id="btn-cancelar-preview">Cancelar</button>
                    <button id="btn-confirmar-preview" style="background:var(--success); color:white; margin-left:10px;">✓ Confirmar</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        document.getElementById('btn-cancelar-preview').onclick = () => { modal.remove(); resolve(false); };
        document.getElementById('btn-confirmar-preview').onclick = () => { modal.remove(); resolve(true); };
    });
}

function configurarFechaActual() {
    const ahora = new Date();
    const fechaColombia = new Date(ahora.toLocaleString("en-US", {timeZone: "America/Bogota"}));
    const año = fechaColombia.getFullYear();
    const mes = String(fechaColombia.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaColombia.getDate()).padStart(2, '0');
    
    document.getElementById("fecha").value = `${año}-${mes}-${dia}`;
}

document.addEventListener("DOMContentLoaded", () => {
    configurarFechaActual();
    
    const params = new URLSearchParams(window.location.search);
    if(params.get("serial")) {
        document.getElementById("serial").value = params.get("serial");
    }
    
    sigColab = setupCanvas("canvas_colaborador");
    cargarBorrador();
    
    document.getElementById('cedula').addEventListener("input", soloNumeros);
    document.getElementById("serial").addEventListener("input", serialValido);
});

window.buscarColaborador = async () => {
    const cedulaInput = document.getElementById("cedula");
    if(!cedulaInput.value) return;
    
    const cleanCedula = cedulaInput.value.trim();
    const msg = document.getElementById("msg-colaborador");
    
    msg.innerText = "Consultando base de datos..."; 
    msg.style.color = "var(--text-muted)";

    const urlSinCache = URL_BUSQUEDA + "&t=" + new Date().getTime();

    try {
        const resp = await fetch(urlSinCache, {
            method: "POST", 
            headers: {
                "Content-Type":"application/json",
                "Cache-Control": "no-cache, no-store, must-revalidate" 
            },
            body: JSON.stringify({ cedula: cleanCedula })
        });
        
        if (!resp.ok) throw new Error();
        const data = await resp.json();

        if (data && data.nombre_colaborador) {
            msg.innerText = "✅ Colaborador encontrado"; 
            msg.style.color = "var(--success)";
            document.getElementById('nombre_colaborador').value = data.nombre_colaborador;
            guardarBorrador(); 
        } else {
            msg.innerText = "❌ Cédula no registrada"; 
            msg.style.color = "var(--error)";
            document.getElementById('nombre_colaborador').value = "";
        }
    } catch (err) {
        msg.innerText = "❌ Error de conexión"; 
        msg.style.color = "var(--error)";
    }
};

// ============================================================================
// LÓGICA DE FIRMA ORIGINAL (Tomada textualmente del archivo funcional)
// ============================================================================
function setupCanvas(id) {
    const c = document.getElementById(id);
    const ctx = c.getContext("2d", { willReadFrequently: true }); 
    let drawing = false;
    let wasUsed = false;
    let imageData = null;
    let points = [];
    
    const resize = () => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        if (wasUsed && c.width > 0) imageData = ctx.getImageData(0, 0, c.width, c.height);
        
        c.width = c.offsetWidth * ratio;[cite: 6]
        c.height = 160 * ratio;[cite: 6]
        ctx.scale(ratio, ratio);[cite: 6]
        
        if (imageData) ctx.putImageData(imageData, 0, 0);[cite: 6]
    };
    
    new ResizeObserver(() => resize()).observe(c);[cite: 6]
    resize();[cite: 6]

    const drawLine = (p1, p2, pressure = 0.5) => {[cite: 6]
        const width = 1.5 + (pressure * 1.5);[cite: 6]
        ctx.strokeStyle = "rgba(10, 10, 10, 0.95)";[cite: 6]
        ctx.lineWidth = width;[cite: 6]
        ctx.lineCap = "round";[cite: 6]
        ctx.lineJoin = "round";[cite: 6]
        
        ctx.beginPath();[cite: 6]
        ctx.moveTo(p1.x, p1.y);[cite: 6]
        ctx.lineTo(p2.x, p2.y);[cite: 6]
        ctx.stroke();[cite: 6]
    };

    const getPos = (e) => {[cite: 6]
        const rect = c.getBoundingClientRect();[cite: 6]
        return { 
            x: e.clientX - rect.left,[cite: 6]
            y: e.clientY - rect.top,[cite: 6]
            pressure: e.pressure !== 0.5 && e.pressure > 0 ? e.pressure : 0.5 [cite: 6]
        };
    };

    const start = (e) => {[cite: 6]
        e.preventDefault();[cite: 6]
        drawing = true; wasUsed = true;[cite: 6]
        points = [getPos(e)];[cite: 6]
        c.classList.add('canvas-firmando');[cite: 6]
    };
    
    const move = (e) => {[cite: 6]
        if(!drawing) return;[cite: 6]
        e.preventDefault();[cite: 6]
        const currentPos = getPos(e);[cite: 6]
        points.push(currentPos);[cite: 6]
        
        if(points.length > 1) {[cite: 6]
            drawLine(points[points.length-2], currentPos, currentPos.pressure);[cite: 6]
        }
    };
    
    const end = (e) => {  [cite: 6]
        if (!drawing) return;[cite: 6]
        e.preventDefault();[cite: 6]
        drawing = false;[cite: 6]
        c.classList.remove('canvas-firmando');[cite: 6]
    };

    c.style.touchAction = "none";[cite: 6]
    c.addEventListener("pointerdown", start);[cite: 6]
    c.addEventListener("pointermove", move);[cite: 6]
    c.addEventListener("pointerup", end);[cite: 6]
    c.addEventListener("pointercancel", end);[cite: 6]
    c.addEventListener("pointerout", end);[cite: 6]
    
    return {
        c, ctx, 
        isSigned: () => wasUsed,[cite: 6]
        reset: () => { [cite: 6]
            wasUsed = false; drawing = false; imageData = null; points = [];[cite: 6]
            ctx.clearRect(0, 0, c.width, c.height);[cite: 6]
        }
    };
}

window.limpiarFirma = (quien) => { if(quien === 'colab') sigColab.reset(); };

document.getElementById("formulario").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (enviandoFormulario) return;

    if (!sigColab.isSigned()) {
        mostrarNotificacion("La firma manuscrita del colaborador es obligatoria para validar el acta.");
        return;
    }
    if (!document.getElementById("nombre_colaborador").value) {
        mostrarNotificacion("Por favor realice la búsqueda de la cédula para verificar el nombre del colaborador.");
        return;
    }

    const valInput = (id) => document.getElementById(id).value.trim();
    const valSelect = (name) => document.querySelector(`select[name="${name}"]`).value;

    const data = {
        fecha: valInput("fecha"),
        area: valInput("area"),
        cedula: valInput("cedula"),
        nombre_colaborador: valInput("nombre_colaborador"),
        marca: valInput("marca"),
        modelo: valInput("modelo"),
        serial: valInput("serial"),
        
        estado_terminal: valSelect("estado_terminal"), obs_terminal: valInput("obs_terminal"),
        estado_pantalla: valSelect("estado_pantalla"), obs_pantalla: valInput("obs_pantalla"),
        estado_bateria: valSelect("estado_bateria"), obs_bateria: valInput("obs_bateria"),
        estado_cargador: valSelect("estado_cargador"), obs_cargador: valInput("obs_cargador"),
        estado_cable: valSelect("estado_cable"), obs_cable: valInput("obs_cable"),
        estado_sim: valSelect("estado_sim"), obs_sim: valInput("obs_sim"),
        
        tipo_equipo: "Smartphone",
        entrega_estuche: "No", 
        estado_estuche: "Malo",
        firma_colaborador: sigColab.c.toDataURL().split(",")[1]
    };
    
    if (!(await mostrarPreview(data))) return;
    
    enviandoFormulario = true;
    const btnEnviar = document.querySelector('.btn-principal');
    document.getElementById("estado-envio").innerHTML = "Transmitiendo acta de turno, por favor espere...";
    btnEnviar.disabled = true;

    try {
        const resp = await fetch(URL_ENVIO, { 
            method: "POST", 
            headers: {"Content-Type":"application/json"}, 
            body: JSON.stringify(data) 
        });
        if(!resp.ok) throw new Error();
        
        document.getElementById("estado-envio").innerHTML = "✅ ¡Acta de Cambio de Turno registrada exitosamente!";
        document.getElementById("estado-envio").style.color = "green";
        
        setTimeout(() => {
            document.getElementById("formulario").reset();
            limpiarFirma('colab');
            configurarFechaActual();
            
            localStorage.removeItem('borrador_turno_ramo'); 
            
            enviandoFormulario = false; 
            btnEnviar.disabled = false;
            document.getElementById("estado-envio").innerHTML = "";
            document.getElementById("msg-colaborador").innerHTML = "";
        }, 2000);
        
    } catch(err) {
        document.getElementById("estado-envio").innerHTML = "❌ Error crítico al transmitir datos. Intente nuevamente.";
        document.getElementById("estado-envio").style.color = "var(--error)";
        enviandoFormulario = false; 
        btnEnviar.disabled = false;
    }
});

const soloNumeros = e => e.target.value = e.target.value.replace(/[^0-9]/g, "");
const serialValido = e => e.target.value = e.target.value.replace(/[^A-Za-z0-9\-_]/g, "").toUpperCase();

const guardarBorrador = () => {
    const datos = {};
    document.querySelectorAll('#formulario input[type="text"], #formulario select').forEach(el => {
        if (el.id) datos[el.id] = el.value;
    });
    localStorage.setItem('borrador_turno_ramo', JSON.stringify(datos));
};

const cargarBorrador = () => {
    const guardado = localStorage.getItem('borrador_turno_ramo');
    if (guardado) {
        try {
            const datos = JSON.parse(guardado);
            document.querySelectorAll('#formulario input[type="text"], #formulario select').forEach(el => {
                if (el.id && datos[el.id] !== undefined && !el.classList.contains('input-readonly')) {
                    el.value = datos[el.id];
                }
            });
        } catch(e) {
            console.error("Error al restaurar estado del formulario");
        }
    }
};

document.getElementById("formulario").addEventListener("input", guardarBorrador);
document.getElementById("formulario").addEventListener("change", guardarBorrador);
