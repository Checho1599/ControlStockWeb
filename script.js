// ============================================
// CONTROL DE STOCK - Fábrica de Aberturas
// CON VALORIZACIÓN Y GRÁFICOS
// ============================================

class StockViewer {
    constructor() {
        this.productos = [];
        this.productosFiltrados = [];
        this.precios = {};
        this.ordenActual = { columna: 'codigo', ascendente: true };
        this.productoSeleccionado = null;
        this.archivoStock = 'Stock.xlsx';
        this.archivoPrecios = 'productos.xlsx';
        this.carpetaImagenes = 'images/';
        this.graficos = {};
        this.ordenValorizacion = { columna: 'valorTotal', ascendente: false };
        this.inicializar();
    }

    async inicializar() {
        console.log('🚀 Iniciando Stock Viewer...');
        this.cargarEventos();
        
        await this.cargarPrecios();
        await this.cargarDatosStock();
        this.aplicarPrecios();
        
        this.actualizarUI();
        
        if (this.productos.length > 0) {
            this.seleccionarProducto(this.productos[0]);
        }
    }

    // ==========================================
    // CARGA DE PRECIOS
    // ==========================================

    async cargarPrecios() {
        try {
            console.log('📄 Cargando precios desde productos.xlsx...');
            const response = await fetch(this.archivoPrecios);
            
            if (!response.ok) {
                console.warn('⚠️ No se encontró productos.xlsx');
                return;
            }

            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(primeraHoja);

            jsonData.forEach(row => {
                const codigo = String(row['codigo'] || row['Código'] || row['CODIGO'] || '').trim();
                if (!codigo) return;
                
                let precio = row['PRECIO UNITARIO'] || row['Precio'] || row['PRECIO'] || 0;
                
                if (typeof precio === 'string') {
                    if (precio.startsWith('=')) {
                        precio = 0;
                    } else {
                        precio = parseFloat(precio.replace(/,/g, '').replace(/\./g, '')) || 0;
                    }
                }
                
                precio = parseFloat(precio) || 0;
                
                if (codigo && precio > 0) {
                    this.precios[codigo] = precio;
                    const codigoLimpio = codigo.replace(/^0+/, '');
                    if (codigoLimpio !== codigo) {
                        this.precios[codigoLimpio] = precio;
                    }
                }
            });

            console.log(`✅ ${Object.keys(this.precios).length} precios cargados`);
            
        } catch (error) {
            console.warn('⚠️ Error al cargar precios:', error.message);
        }
    }

    // ==========================================
    // CARGA DE STOCK
    // ==========================================

    async cargarDatosStock() {
        try {
            const datosCache = this.cargarDesdeCache();
            if (datosCache && datosCache.length > 0) {
                this.productos = datosCache;
                console.log(`📦 ${this.productos.length} productos cargados del caché`);
                return;
            }

            console.log('📄 Cargando stock desde Stock.xlsx...');
            const response = await fetch(this.archivoStock);
            
            if (!response.ok) {
                console.warn('⚠️ No se encontró Stock.xlsx, usando datos de ejemplo');
                this.cargarDatosEjemplo();
                return;
            }

            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(primeraHoja);

            this.productos = jsonData.map(row => {
                const codigo = String(row['codigo'] || row['Código'] || row['CODIGO'] || '').trim();
                const producto = String(row['producto'] || row['Producto'] || row['PRODUCTO'] || '').trim();
                const color = String(row['color'] || row['Color'] || row['COLOR'] || '').trim();
                const cantidad = parseFloat(row['cantidad'] || row['Cantidad'] || row['CANTIDAD'] || 0);
                const stockMinimo = parseFloat(row['stock_minimo'] || row['Stock Mínimo'] || row['STOCK_MINIMO'] || 0);
                const faltante = parseFloat(row['faltante'] || row['Faltante'] || row['FALTANTE'] || 0);
                const ubicacion = String(row['ubicacion'] || row['Ubicación'] || row['UBICACION'] || '').trim();

                if (!codigo || !producto) {
                    return null;
                }

                return {
                    codigo: codigo,
                    producto: producto,
                    color: color || 'Sin color',
                    stock: isNaN(cantidad) ? 0 : cantidad,
                    stock_minimo: isNaN(stockMinimo) ? 0 : stockMinimo,
                    faltante: isNaN(faltante) ? Math.max(0, (stockMinimo || 0) - (cantidad || 0)) : faltante,
                    ubicacion: ubicacion || 'Sin ubicación',
                    precio: 0
                };
            }).filter(p => p !== null);

            console.log(`✅ ${this.productos.length} productos procesados desde Stock.xlsx`);
            this.guardarEnCache();

        } catch (error) {
            console.error('❌ Error al cargar datos:', error);
            this.cargarDatosEjemplo();
        }
    }

    // ==========================================
    // APLICAR PRECIOS
    // ==========================================

    aplicarPrecios() {
        let conPrecio = 0;
        let sinPrecio = 0;

        this.productos.forEach(p => {
            let precio = this.precios[p.codigo];
            
            if (!precio || precio === 0) {
                const codigoLimpio = p.codigo.replace(/^0+/, '');
                precio = this.precios[codigoLimpio];
            }
            
            if (!precio || precio === 0) {
                const codigoBase = p.codigo.substring(0, 5);
                for (const [key, value] of Object.entries(this.precios)) {
                    if (key.startsWith(codigoBase)) {
                        precio = value;
                        break;
                    }
                }
            }
            
            if (typeof precio !== 'number' || isNaN(precio) || precio <= 0) {
                p.precio = 0;
                sinPrecio++;
            } else {
                p.precio = precio;
                conPrecio++;
            }
        });

        console.log(`✅ ${conPrecio} productos con precio, ${sinPrecio} sin precio`);
    }

    // ==========================================
    // DATOS DE EJEMPLO
    // ==========================================

    cargarDatosEjemplo() {
        console.log('📋 Usando datos de ejemplo');
        this.productos = [
            { codigo: '112421000', producto: 'Marco Advance', color: 'BLANCO', stock: 41, stock_minimo: 20, faltante: 0, ubicacion: 'C5', precio: 0 },
            { codigo: '112424013', producto: 'Marco Advance', color: 'GOLDEN OAK', stock: 21, stock_minimo: 15, faltante: 0, ubicacion: 'A1', precio: 0 },
            { codigo: '112424103', producto: 'Marco Advance', color: 'NOGAL', stock: 26, stock_minimo: 15, faltante: 0, ubicacion: 'B3', precio: 0 },
            { codigo: '112423113', producto: 'Marco Advance', color: 'GRIS GRAFITO', stock: 21, stock_minimo: 15, faltante: 0, ubicacion: 'B4', precio: 0 },
            { codigo: '112423283', producto: 'Marco Advance', color: 'JET BLACK', stock: 9, stock_minimo: 0, faltante: 0, ubicacion: 'A2', precio: 0 },
            { codigo: '110301000', producto: 'Hoja Advance', color: 'BLANCO', stock: 8, stock_minimo: 20, faltante: 12, ubicacion: 'D7', precio: 0 },
        ];
        this.guardarEnCache();
    }

    // ==========================================
    // FORMATEO
    // ==========================================

    formatearUSD(valor) {
        if (valor === undefined || valor === null || isNaN(valor) || valor <= 0) {
            return 'U$S 0,00';
        }
        const partes = valor.toFixed(2).split('.');
        const parteEntera = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        const parteDecimal = partes[1];
        return 'U$S ' + parteEntera + ',' + parteDecimal;
    }

    // ==========================================
    // CACHÉ
    // ==========================================

    cargarDesdeCache() {
        try {
            const datos = localStorage.getItem('stockDatos');
            if (datos) {
                const parsed = JSON.parse(datos);
                if (parsed && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('Error al cargar caché:', e);
        }
        return null;
    }

    guardarEnCache() {
        try {
            localStorage.setItem('stockDatos', JSON.stringify(this.productos));
            localStorage.setItem('stockFecha', new Date().toISOString());
        } catch (e) {
            console.warn('Error al guardar caché:', e);
        }
    }

    actualizarFecha() {
        const fecha = localStorage.getItem('stockFecha');
        const el = document.getElementById('fechaActualizacion');
        if (fecha) {
            el.textContent = 'Actualizado: ' + new Date(fecha).toLocaleString('es-ES');
        } else {
            el.textContent = 'Actualizado: Sin datos';
        }
    }

    // ==========================================
    // RECARGAR DATOS
    // ==========================================

    async recargarDatos() {
        const btn = document.querySelector('.btn-reload');
        const textoOriginal = btn.textContent;
        btn.textContent = 'Cargando...';
        btn.disabled = true;

        try {
            localStorage.removeItem('stockDatos');
            localStorage.removeItem('stockFecha');
            this.precios = {};
            
            await this.cargarPrecios();
            await this.cargarDatosStock();
            this.aplicarPrecios();
            
            this.actualizarUI();
            
            if (this.productos.length > 0) {
                this.seleccionarProducto(this.productos[0]);
            }
            this.mostrarMensaje('✅ Datos recargados correctamente', 'success');
        } catch (error) {
            console.error('Error al recargar:', error);
            this.mostrarMensaje('❌ Error al recargar los datos', 'error');
        } finally {
            btn.textContent = textoOriginal;
            btn.disabled = false;
        }
    }

    // ==========================================
    // NAVEGACIÓN ENTRE PÁGINAS
    // ==========================================

    irAValorizacion() {
        document.getElementById('vistaStock').style.display = 'none';
        document.getElementById('vistaValorizacion').style.display = 'block';
        this.renderizarValorizacion();
    }

    volverAStock() {
        document.getElementById('vistaValorizacion').style.display = 'none';
        document.getElementById('vistaStock').style.display = 'block';
        this.actualizarTabla();
        this.actualizarContador();
    }

    // ==========================================
    // SELECCIÓN DE PRODUCTO CON PREVIEW
    // ==========================================

    seleccionarProducto(producto) {
        this.productoSeleccionado = producto;
        
        document.querySelectorAll('#productTableBody tr').forEach(row => {
            row.classList.remove('seleccionado');
        });
        
        if (producto) {
            const rows = document.querySelectorAll('#productTableBody tr');
            rows.forEach(row => {
                if (row.dataset.codigo === String(producto.codigo)) {
                    row.classList.add('seleccionado');
                }
            });
        }

        this.actualizarPreview(producto);
    }

    seleccionarProductoById(codigo) {
        const producto = this.productos.find(p => String(p.codigo) === String(codigo));
        if (producto) {
            this.seleccionarProducto(producto);
        }
    }

    actualizarPreview(producto) {
        const nombreEl = document.getElementById('previewNombre');
        const detalleEl = document.getElementById('previewDetalle');
        const stockEl = document.getElementById('previewStock');
        const precioEl = document.getElementById('previewPrecio');
        const valorEl = document.getElementById('previewValor');
        const imageContainer = document.getElementById('previewImage');

        if (!producto) {
            nombreEl.textContent = 'Selecciona un producto';
            detalleEl.innerHTML = '<span>Código: -</span><span>Color: -</span><span>Ubicación: -</span>';
            stockEl.textContent = 'Stock: -';
            precioEl.textContent = 'Precio: -';
            valorEl.textContent = 'Valor en stock: -';
            imageContainer.innerHTML = '<div class="no-image">📷<br>Sin imagen disponible</div>';
            return;
        }

        nombreEl.textContent = producto.producto + ' - ' + producto.color;
        detalleEl.innerHTML = 
            '<span>Código: ' + producto.codigo + '</span>' +
            '<span>Color: ' + producto.color + '</span>' +
            '<span>Ubicación: ' + (producto.ubicacion || '-') + '</span>';
        
        const claseStock = producto.stock === 0 ? 'stock-cero' : (producto.stock <= 5 ? 'stock-bajo' : 'stock-normal');
        stockEl.textContent = '📦 Stock: ' + producto.stock + ' unidades';
        stockEl.className = 'preview-stock ' + claseStock;
        
        const precioMostrar = (producto.precio && producto.precio > 0) ? this.formatearUSD(producto.precio) : 'Sin precio';
        precioEl.textContent = '💰 Precio: ' + precioMostrar;
        
        const valorStock = (producto.stock * (producto.precio || 0));
        valorEl.textContent = '💎 Valor en stock: ' + (valorStock > 0 ? this.formatearUSD(valorStock) : 'Sin valor');

        // Cargar imagen
        const codigoBase = String(producto.codigo).substring(0, 5);
        const rutaImagen = this.carpetaImagenes + codigoBase + '.jpg';
        
        imageContainer.innerHTML = '<img src="' + rutaImagen + '" onerror="mostrarSinImagen(this)" alt="' + producto.producto + '">';
    }

    // ==========================================
    // FILTROS DE STOCK
    // ==========================================

    aplicarFiltros() {
        const texto = document.getElementById('searchInput').value.toLowerCase().trim();
        const ubicacion = document.getElementById('filterUbicacion').value;
        const stockFilter = document.getElementById('filterStock').value;

        this.productosFiltrados = this.productos.filter(p => {
            if (texto) {
                const match = p.codigo.toLowerCase().includes(texto) ||
                             p.producto.toLowerCase().includes(texto) ||
                             p.color.toLowerCase().includes(texto) ||
                             (p.ubicacion && p.ubicacion.toLowerCase().includes(texto));
                if (!match) return false;
            }
            if (ubicacion && p.ubicacion !== ubicacion) return false;
            if (stockFilter === 'bajo' && (p.stock > 5 || p.stock === 0)) return false;
            if (stockFilter === 'cero' && p.stock > 0) return false;
            if (stockFilter === 'normal' && p.stock <= 5) return false;
            return true;
        });

        this.ordenarTabla(this.ordenActual.columna, false);
        this.actualizarContador();
        
        const datos = this.productosFiltrados.length > 0 ? this.productosFiltrados : this.productos;
        if (datos.length > 0) {
            this.seleccionarProducto(datos[0]);
        } else {
            this.seleccionarProducto(null);
        }
    }

    limpiarFiltros() {
        document.getElementById('searchInput').value = '';
        document.getElementById('filterUbicacion').value = '';
        document.getElementById('filterStock').value = 'todos';
        this.aplicarFiltros();
    }

    actualizarFiltrosUbicacion() {
        const select = document.getElementById('filterUbicacion');
        const ubicaciones = [...new Set(this.productos.map(p => p.ubicacion).filter(u => u && u.trim()))];
        ubicaciones.sort();
        
        select.innerHTML = '<option value="">📍 Todas las ubicaciones</option>';
        ubicaciones.forEach(u => {
            const option = document.createElement('option');
            option.value = u;
            option.textContent = u;
            select.appendChild(option);
        });
    }

    // ==========================================
    // ORDENAMIENTO DE STOCK
    // ==========================================

    ordenarTabla(columna, toggle = true) {
        if (toggle) {
            if (this.ordenActual.columna === columna) {
                this.ordenActual.ascendente = !this.ordenActual.ascendente;
            } else {
                this.ordenActual.columna = columna;
                this.ordenActual.ascendente = true;
            }
        }

        const datos = this.productosFiltrados.length > 0 ? this.productosFiltrados : this.productos;
        
        datos.sort((a, b) => {
            let valA = a[columna] !== undefined ? a[columna] : '';
            let valB = b[columna] !== undefined ? b[columna] : '';
            
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            
            if (valA < valB) return this.ordenActual.ascendente ? -1 : 1;
            if (valA > valB) return this.ordenActual.ascendente ? 1 : -1;
            return 0;
        });

        this.actualizarTabla();
    }

    // ==========================================
    // ACTUALIZACIÓN DE UI - STOCK
    // ==========================================

    actualizarUI() {
        this.productosFiltrados = [...this.productos];
        this.actualizarFiltrosUbicacion();
        this.ordenarTabla('codigo', false);
        this.actualizarEstadisticas();
        this.actualizarContador();
        this.actualizarFecha();
        this.guardarEnCache();
    }

    actualizarTabla() {
        const tbody = document.getElementById('productTableBody');
        const datos = this.productosFiltrados.length > 0 ? this.productosFiltrados : this.productos;

        if (datos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#999;">No se encontraron productos</td></tr>';
            return;
        }

        tbody.innerHTML = datos.map(p => {
            let clase = 'stock-normal';
            if (p.stock === 0) clase = 'stock-cero';
            else if (p.stock <= 5) clase = 'stock-bajo';

            const precioStr = (p.precio && p.precio > 0) ? this.formatearUSD(p.precio) : 'Sin precio';

            return '<tr class="' + clase + '" data-codigo="' + p.codigo + '" onclick="stockViewer.seleccionarProductoById(\'' + p.codigo + '\')">' +
                '<td><span style="font-family: monospace; font-size: 0.85em;">' + p.codigo + '</span></td>' +
                '<td><strong>' + p.producto + '</strong></td>' +
                '<td>' + p.color + '</td>' +
                '<td><strong>' + p.stock + '</strong></td>' +
                '<td class="' + (p.faltante > 0 ? 'faltante-positivo' : 'faltante-cero') + '">' + p.faltante + '</td>' +
                '<td>' + p.ubicacion + '</td>' +
                '<td>' + precioStr + '</td>' +
            '</tr>';
        }).join('');
    }

    actualizarEstadisticas() {
        const total = this.productos.length;
        const bajoStock = this.productos.filter(p => p.stock <= 5 && p.stock > 0).length;
        const sinStock = this.productos.filter(p => p.stock === 0).length;
        const ubicaciones = [...new Set(this.productos.map(p => p.ubicacion).filter(u => u && u.trim()))].length;
        const valorTotal = this.productos.reduce((sum, p) => sum + (p.stock * (p.precio || 0)), 0);

        document.getElementById('totalProductos').textContent = total;
        document.getElementById('stockBajo').textContent = bajoStock;
        document.getElementById('sinStock').textContent = sinStock;
        document.getElementById('totalUbicaciones').textContent = ubicaciones;
        document.getElementById('valorStock').textContent = this.formatearUSD(valorTotal);
    }

    actualizarContador() {
        const total = this.productos.length;
        const mostrados = this.productosFiltrados.length || total;
        const contador = document.getElementById('productosMostrados');
        if (mostrados === total || this.productosFiltrados.length === 0) {
            contador.textContent = 'Mostrando ' + total + ' productos';
        } else {
            contador.textContent = 'Mostrando ' + mostrados + ' de ' + total + ' productos';
        }
    }

    // ==========================================
    // ========== VALORIZACIÓN ==========
    // ==========================================

    renderizarValorizacion() {
        this.cargarOpcionesFiltrosValorizacion();
        this.aplicarFiltrosValorizacion();
    }

    cargarOpcionesFiltrosValorizacion() {
        const selectUbicacion = document.getElementById('vfUbicacion');
        const ubicaciones = [...new Set(this.productos.map(p => p.ubicacion).filter(u => u && u.trim()))];
        ubicaciones.sort();
        selectUbicacion.innerHTML = '<option value="">Todas</option>';
        ubicaciones.forEach(u => {
            const option = document.createElement('option');
            option.value = u;
            option.textContent = u;
            selectUbicacion.appendChild(option);
        });

        const selectColor = document.getElementById('vfColor');
        const colores = [...new Set(this.productos.map(p => p.color).filter(c => c && c.trim()))];
        colores.sort();
        selectColor.innerHTML = '<option value="">Todos</option>';
        colores.forEach(c => {
            const option = document.createElement('option');
            option.value = c;
            option.textContent = c;
            selectColor.appendChild(option);
        });

        const selectMaterial = document.getElementById('vfMaterial');
        const materiales = [...new Set(this.productos.map(p => p.producto).filter(m => m && m.trim()))];
        materiales.sort();
        selectMaterial.innerHTML = '<option value="">Todos</option>';
        materiales.forEach(m => {
            const option = document.createElement('option');
            option.value = m;
            option.textContent = m;
            selectMaterial.appendChild(option);
        });
    }

    aplicarFiltrosValorizacion() {
        const ubicacion = document.getElementById('vfUbicacion').value;
        const color = document.getElementById('vfColor').value;
        const material = document.getElementById('vfMaterial').value;
        const stockFilter = document.getElementById('vfStock').value;

        let datosFiltrados = this.productos.filter(p => {
            if (ubicacion && p.ubicacion !== ubicacion) return false;
            if (color && p.color !== color) return false;
            if (material && p.producto !== material) return false;
            if (stockFilter === 'bajo' && (p.stock > 5 || p.stock === 0)) return false;
            if (stockFilter === 'cero' && p.stock > 0) return false;
            if (stockFilter === 'normal' && p.stock <= 5) return false;
            return true;
        });

        this.renderizarValorizacionConFiltros(datosFiltrados);
    }

    limpiarFiltrosValorizacion() {
        document.getElementById('vfUbicacion').value = '';
        document.getElementById('vfColor').value = '';
        document.getElementById('vfMaterial').value = '';
        document.getElementById('vfStock').value = 'todos';
        this.aplicarFiltrosValorizacion();
    }

    renderizarValorizacionConFiltros(datos) {
        const totalValor = datos.reduce((sum, p) => sum + (p.stock * (p.precio || 0)), 0);
        const conPrecio = datos.filter(p => p.precio > 0).length;
        const sinPrecio = datos.length - conPrecio;
        const materiales = [...new Set(datos.map(p => p.producto))].length;

        document.getElementById('resumenTotal').textContent = this.formatearUSD(totalValor);
        document.getElementById('resumenConPrecio').textContent = conPrecio;
        document.getElementById('resumenSinPrecio').textContent = sinPrecio;
        document.getElementById('resumenMateriales').textContent = materiales;

        this.renderizarGraficos(datos);
        this.renderizarDetalleValorizacion(datos);
    }

    // ==========================================
    // GRÁFICOS
    // ==========================================

    renderizarGraficos(datos) {
        const materialData = this.agruparPor(datos, 'producto');
        this.crearGrafico('graficoMaterial', materialData, 'bar');

        const ubicacionData = this.agruparPor(datos, 'ubicacion');
        this.crearGrafico('graficoUbicacion', ubicacionData, 'doughnut');

        const colorData = this.agruparPor(datos, 'color');
        this.crearGrafico('graficoColor', colorData, 'pie');

        const distribucion = this.getDistribucionStock(datos);
        this.crearGrafico('graficoDistribucion', distribucion, 'doughnut');
    }

    agruparPor(datos, key) {
        const grupos = {};
        datos.forEach(p => {
            const grupo = p[key] || 'Sin definir';
            if (!grupos[grupo]) {
                grupos[grupo] = 0;
            }
            grupos[grupo] += p.stock * (p.precio || 0);
        });
        
        const sorted = Object.entries(grupos)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        const labels = sorted.map(item => item[0]);
        const values = sorted.map(item => item[1]);
        const colors = this.generarColores(labels.length);

        return { labels, values, colors };
    }

    getDistribucionStock(datos) {
        const bajo = datos.filter(p => p.stock > 0 && p.stock <= 5).length;
        const normal = datos.filter(p => p.stock > 5 && p.stock <= 20).length;
        const alto = datos.filter(p => p.stock > 20).length;
        const cero = datos.filter(p => p.stock === 0).length;

        return {
            labels: ['Sin Stock (0)', 'Stock Bajo (1-5)', 'Stock Normal (6-20)', 'Stock Alto (>20)'],
            values: [cero, bajo, normal, alto],
            colors: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff']
        };
    }

    generarColores(cantidad) {
        const colores = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
            '#F8C471', '#82E0AA', '#F1948A', '#85929E', '#73C6B6'
        ];
        return colores.slice(0, cantidad);
    }

    crearGrafico(id, data, tipo) {
        const ctx = document.getElementById(id).getContext('2d');
        
        if (this.graficos[id]) {
            this.graficos[id].destroy();
        }

        const colores = data.colors || this.generarColores(data.labels.length);
        const tieneDatos = data.values.some(v => v > 0);
        
        if (!tieneDatos || data.labels.length === 0) {
            this.graficos[id] = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Sin datos disponibles'],
                    datasets: [{
                        data: [0],
                        backgroundColor: ['#e0e0e0'],
                        borderColor: ['#ccc'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    },
                    scales: {
                        y: { beginAtZero: true, display: false },
                        x: { display: true }
                    }
                }
            });
            return;
        }

        this.graficos[id] = new Chart(ctx, {
            type: tipo,
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: colores,
                    borderColor: colores.map(c => c),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 10 },
                            boxWidth: 12,
                            padding: 8
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const porcentaje = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                                return context.parsed > 0 ? 
                                    context.label + ': ' + stockViewer.formatearUSD(context.parsed) + ' (' + porcentaje + '%)' :
                                    context.label + ': U$S 0,00 (0%)';
                            }
                        }
                    }
                },
                scales: tipo === 'bar' ? {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'U$S ' + value.toLocaleString('es-AR');
                            }
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 30,
                            font: { size: 9 }
                        }
                    }
                } : undefined
            }
        });
    }

    // ==========================================
    // DETALLE DE VALORIZACIÓN
    // ==========================================

    renderizarDetalleValorizacion(datos) {
        const tbody = document.getElementById('tablaValorizacionBody');
        
        const sorted = [...datos].sort((a, b) => (b.stock * (b.precio || 0)) - (a.stock * (a.precio || 0)));

        document.getElementById('detalleContador').textContent = 'Mostrando ' + sorted.length + ' productos';

        tbody.innerHTML = sorted.map(p => {
            const valorTotal = p.stock * (p.precio || 0);
            
            return '<tr>' +
                '<td><strong>' + p.producto + '</strong></td>' +
                '<td>' + p.color + '</td>' +
                '<td>' + p.ubicacion + '</td>' +
                '<td>' + p.stock + '</td>' +
                '<td>' + (p.precio > 0 ? this.formatearUSD(p.precio) : 'Sin precio') + '</td>' +
                '<td style="font-weight:bold; color:#1a237e;">' + this.formatearUSD(valorTotal) + '</td>' +
            '</tr>';
        }).join('');
    }

    // ==========================================
    // ORDENAMIENTO DE VALORIZACIÓN
    // ==========================================

    ordenarValorizacion(columna) {
        if (this.ordenValorizacion.columna === columna) {
            this.ordenValorizacion.ascendente = !this.ordenValorizacion.ascendente;
        } else {
            this.ordenValorizacion.columna = columna;
            this.ordenValorizacion.ascendente = false;
        }

        const tbody = document.getElementById('tablaValorizacionBody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        const datos = rows.map(row => {
            const cells = row.querySelectorAll('td');
            return {
                material: cells[0].textContent.trim(),
                color: cells[1].textContent.trim(),
                ubicacion: cells[2].textContent.trim(),
                cantidad: parseFloat(cells[3].textContent) || 0,
                precio: parseFloat(cells[4].textContent.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.')) || 0,
                valorTotal: parseFloat(cells[5].textContent.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.')) || 0,
                row: row
            };
        });

        const colMap = {
            'material': 'material',
            'color': 'color',
            'ubicacion': 'ubicacion',
            'cantidad': 'cantidad',
            'precio': 'precio',
            'precioPromedio': 'precio',
            'valorTotal': 'valorTotal'
        };

        const columnaReal = colMap[columna] || columna;

        datos.sort((a, b) => {
            let valA = a[columnaReal];
            let valB = b[columnaReal];
            
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            
            if (valA < valB) return this.ordenValorizacion.ascendente ? -1 : 1;
            if (valA > valB) return this.ordenValorizacion.ascendente ? 1 : -1;
            return 0;
        });

        datos.forEach(item => {
            tbody.appendChild(item.row);
        });
    }

    // ==========================================
    // MENSAJES
    // ==========================================

    mostrarMensaje(texto, tipo) {
        tipo = tipo || 'info';
        const toast = document.createElement('div');
        toast.style.cssText = '' +
            'position: fixed;' +
            'bottom: 20px;' +
            'right: 20px;' +
            'padding: 12px 24px;' +
            'border-radius: 8px;' +
            'color: white;' +
            'font-weight: 500;' +
            'z-index: 9999;' +
            'animation: slideUp 0.3s ease;' +
            'box-shadow: 0 4px 12px rgba(0,0,0,0.2);' +
            'max-width: 400px;';
        
        const colores = { success: '#4CAF50', error: '#f44336', warning: '#FF9800', info: '#2196F3' };
        toast.style.background = colores[tipo] || colores.info;
        toast.textContent = texto;

        document.body.appendChild(toast);
        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s';
            setTimeout(function() { toast.remove(); }, 500);
        }, 5000);
    }

    // ==========================================
    // EVENTOS
    // ==========================================

    cargarEventos() {
        document.getElementById('searchInput').addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                stockViewer.aplicarFiltros();
            }
        });
    }
}

// ==========================================
// FUNCIONES GLOBALES
// ==========================================

var stockViewer = new StockViewer();

window.aplicarFiltros = function() { stockViewer.aplicarFiltros(); };
window.limpiarFiltros = function() { stockViewer.limpiarFiltros(); };
window.recargarDatos = function() { stockViewer.recargarDatos(); };
window.ordenarTabla = function(columna) { stockViewer.ordenarTabla(columna); };
window.irAValorizacion = function() { stockViewer.irAValorizacion(); };
window.volverAStock = function() { stockViewer.volverAStock(); };
window.seleccionarProductoById = function(codigo) { stockViewer.seleccionarProductoById(codigo); };
window.aplicarFiltrosValorizacion = function() { stockViewer.aplicarFiltrosValorizacion(); };
window.limpiarFiltrosValorizacion = function() { stockViewer.limpiarFiltrosValorizacion(); };
window.ordenarValorizacion = function(columna) { stockViewer.ordenarValorizacion(columna); };

// Agregar estilo para animación de toasts
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

console.log('✅ Stock Viewer listo!');