/**
 * Medical Trip Hub — Modal Drawers & Accessibility Coordinator
 */

import { appState, notifyStateChange } from '../core/state.js';
import { MermaidManager } from '../core/mermaid-manager.js';
import { DATABASE_TABLES, DATABASE_SCHEMA_METRICS } from '../data/database-preview.js';
import { GLOSSARY_CATEGORIES, GLOSSARY_TERMS } from '../data/glossary.js';

export class DrawerController {
    static activeDbTableId = "tbl-pacientes";
    static dbSearchQuery = "";
    static activeGlossaryCatId = "cat-all";
    static glossarySearchQuery = "";

    static init() {
        // Enlazar botones de apertura de la barra superior
        document.getElementById('btnGlossary')?.addEventListener('click', () => {
            this.renderGlossary();
            this.openDrawer('glossaryDrawerOverlay');
        });
        document.getElementById('btnRoi')?.addEventListener('click', () => this.openDrawer('execDrawerOverlay'));
        document.getElementById('btnDb')?.addEventListener('click', () => {
            this.renderDatabaseInspector();
            this.openDrawer('dbDrawerOverlay');
        });
        document.getElementById('btnA11y')?.addEventListener('click', () => this.openDrawer('a11yDrawerOverlay'));
        document.getElementById('btnTheme')?.addEventListener('click', () => this.toggleTheme());

        // Enlazar botones de cierre en cada drawer
        document.getElementById('close-glossary-btn')?.addEventListener('click', () => this.closeDrawer('glossaryDrawerOverlay'));
        document.getElementById('close-exec-btn')?.addEventListener('click', () => this.closeDrawer('execDrawerOverlay'));
        document.getElementById('close-db-btn')?.addEventListener('click', () => this.closeDrawer('dbDrawerOverlay'));
        document.getElementById('close-a11y-btn')?.addEventListener('click', () => this.closeDrawer('a11yDrawerOverlay'));
        document.getElementById('close-diag-btn')?.addEventListener('click', () => this.closeDrawer('diagDrawerOverlay'));

        // Cierre al hacer clic en el backdrop
        document.querySelectorAll('.drawer-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.style.display = 'none';
                }
            });
        });

        // Controles de Accesibilidad
        document.getElementById('btnFontNormal')?.addEventListener('click', (e) => this.setFontSize('normal', e.currentTarget));
        document.getElementById('btnFontLarge')?.addEventListener('click', (e) => this.setFontSize('large', e.currentTarget));
        document.getElementById('btnFontXLarge')?.addEventListener('click', (e) => this.setFontSize('xlarge', e.currentTarget));

        document.getElementById('btnContrastNormal')?.addEventListener('click', (e) => this.setHighContrast(false, e.currentTarget));
        document.getElementById('btnContrastHigh')?.addEventListener('click', (e) => this.setHighContrast(true, e.currentTarget));

        document.getElementById('btnDyslexiaOff')?.addEventListener('click', (e) => this.setDyslexiaFont(false, e.currentTarget));
        document.getElementById('btnDyslexiaOn')?.addEventListener('click', (e) => this.setDyslexiaFont(true, e.currentTarget));

        // Tecla Escape para cerrar todos los drawers abiertos
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.drawer-overlay').forEach(d => d.style.display = 'none');
            }
        });

        // Renderizado inicial del explorador de BD
        this.renderDatabaseInspector();
    }

    static renderDatabaseInspector() {
        const container = document.getElementById('dbInspectorContent');
        if (!container) return;

        const activeTable = DATABASE_TABLES.find(t => t.id === this.activeDbTableId) || DATABASE_TABLES[0];

        // 1. Banner de Estadísticas 3NF
        let html = `
            <div class="db-stats-banner">
                <div class="db-stat-item">
                    <div class="db-stat-val">${DATABASE_SCHEMA_METRICS.totalTables}</div>
                    <div class="db-stat-lbl">Tablas 3NF</div>
                </div>
                <div class="db-stat-item">
                    <div class="db-stat-val">${DATABASE_SCHEMA_METRICS.totalPatients}</div>
                    <div class="db-stat-lbl">Pacientes</div>
                </div>
                <div class="db-stat-item">
                    <div class="db-stat-val">${DATABASE_SCHEMA_METRICS.totalOcelEvents.toLocaleString()}</div>
                    <div class="db-stat-lbl">Eventos OCEL</div>
                </div>
                <div class="db-stat-item">
                    <div class="db-stat-val" style="color: var(--emerald);">100% Sound</div>
                    <div class="db-stat-lbl">Integridad FK</div>
                </div>
            </div>
        `;

        // 2. Tabs Selector de Tablas
        html += `<div class="db-tabs-nav" role="tablist">`;
        DATABASE_TABLES.forEach(tbl => {
            const isActive = tbl.id === activeTable.id;
            html += `
                <button class="db-tab-btn ${isActive ? 'active' : ''}" data-tbl-id="${tbl.id}" role="tab" aria-selected="${isActive}">
                    <i class="fa-solid ${tbl.icon}"></i>
                    <span>${tbl.label}</span>
                    <span class="db-tab-count">${tbl.badge}</span>
                </button>
            `;
        });
        html += `</div>`;

        // 3. Barra de Búsqueda Rápida
        html += `
            <div class="db-search-bar">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" id="dbSearchInput" placeholder="Filtrar en tabla ${activeTable.name}..." value="${this.dbSearchQuery}">
            </div>
        `;

        // 4. Filtrar filas
        const q = this.dbSearchQuery.toLowerCase().trim();
        const filteredRows = activeTable.rows.filter(row => {
            if (!q) return true;
            return row.some(cell => String(cell).toLowerCase().includes(q));
        });

        // 5. Tabla HTML
        html += `
            <div class="db-table-wrapper">
                <table class="db-table">
                    <thead>
                        <tr>
                            ${activeTable.columns.map(col => `<th>${col}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (filteredRows.length === 0) {
            html += `<tr><td colspan="${activeTable.columns.length}" style="text-align:center; padding: 20px; color: var(--text-subtle);">No se encontraron coincidencias para "${this.dbSearchQuery}"</td></tr>`;
        } else {
            filteredRows.forEach(row => {
                html += `<tr>`;
                row.forEach((cell, idx) => {
                    const str = String(cell);
                    let formatted = str;

                    if (str.startsWith('ENT-PAX') || str.startsWith('EMP-') || str.startsWith('PROV-') || str.startsWith('PLT-')) {
                        formatted = `<span class="db-pill db-pill-uuid">${str}</span>`;
                    } else if (str.startsWith('[COORD]') || str.startsWith('[DIR-MED]') || str.startsWith('[COM-INT]') || str.startsWith('[MED]') || str.startsWith('[DRV]') || str.startsWith('[GUIA]')) {
                        formatted = `<span class="db-pill db-pill-role">${str}</span>`;
                    } else if (str === 'COMPLETADO' || str.includes('Convenio') || str.includes('Sound')) {
                        formatted = `<span class="db-pill db-pill-status"><i class="fa-solid fa-circle-check"></i> ${str}</span>`;
                    } else if (str.includes('$') || str.includes('USD') || str.includes('COP') || str.includes('%')) {
                        formatted = `<span class="db-pill db-pill-money">${str}</span>`;
                    }

                    html += `<td>${formatted}</td>`;
                });
                html += `</tr>`;
            });
        }

        html += `
                    </tbody>
                </table>
            </div>
            <div style="font-size: 0.72rem; color: var(--text-subtle); display: flex; justify-content: space-between; align-items: center;">
                <span>Mostrando <strong>${filteredRows.length}</strong> de <strong>${activeTable.rows.length}</strong> filas en vista previa</span>
                <span>Esquema: <code>data/medicaltrip_master.db</code> (SQLite 3NF)</span>
            </div>
        `;

        container.innerHTML = html;

        // Enlazar eventos de tabs
        container.querySelectorAll('.db-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('data-tbl-id');
                if (targetId) {
                    this.activeDbTableId = targetId;
                    this.dbSearchQuery = "";
                    this.renderDatabaseInspector();
                }
            });
        });

        // Enlazar input de búsqueda
        const searchInput = container.querySelector('#dbSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.dbSearchQuery = e.target.value;
                // Prevenir pérdida de foco renderizando solo el wrapper de tabla o re-renderizando con restore cursor
                this.renderDatabaseTableOnly(activeTable);
            });
        }
    }

    static renderDatabaseTableOnly(activeTable) {
        const q = this.dbSearchQuery.toLowerCase().trim();
        const filteredRows = activeTable.rows.filter(row => {
            if (!q) return true;
            return row.some(cell => String(cell).toLowerCase().includes(q));
        });

        const tableWrapper = document.querySelector('.db-table-wrapper');
        if (!tableWrapper) return;

        let tableHtml = `
            <table class="db-table">
                <thead>
                    <tr>
                        ${activeTable.columns.map(col => `<th>${col}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
        `;

        if (filteredRows.length === 0) {
            tableHtml += `<tr><td colspan="${activeTable.columns.length}" style="text-align:center; padding: 20px; color: var(--text-subtle);">No se encontraron coincidencias para "${this.dbSearchQuery}"</td></tr>`;
        } else {
            filteredRows.forEach(row => {
                tableHtml += `<tr>`;
                row.forEach((cell) => {
                    const str = String(cell);
                    let formatted = str;

                    if (str.startsWith('ENT-PAX') || str.startsWith('EMP-') || str.startsWith('PROV-') || str.startsWith('PLT-')) {
                        formatted = `<span class="db-pill db-pill-uuid">${str}</span>`;
                    } else if (str.startsWith('[COORD]') || str.startsWith('[DIR-MED]') || str.startsWith('[COM-INT]') || str.startsWith('[MED]') || str.startsWith('[DRV]') || str.startsWith('[GUIA]')) {
                        formatted = `<span class="db-pill db-pill-role">${str}</span>`;
                    } else if (str === 'COMPLETADO' || str.includes('Convenio') || str.includes('Sound')) {
                        formatted = `<span class="db-pill db-pill-status"><i class="fa-solid fa-circle-check"></i> ${str}</span>`;
                    } else if (str.includes('$') || str.includes('USD') || str.includes('COP') || str.includes('%')) {
                        formatted = `<span class="db-pill db-pill-money">${str}</span>`;
                    }

                    tableHtml += `<td>${formatted}</td>`;
                });
                tableHtml += `</tr>`;
            });
        }

        tableHtml += `</tbody></table>`;
        tableWrapper.innerHTML = tableHtml;
    }

    static renderGlossary() {
        const container = document.getElementById('glossaryContent');
        if (!container) return;

        // 1. Tabs de Categorías del Glosario
        let html = `<div class="db-tabs-nav" role="tablist">`;
        GLOSSARY_CATEGORIES.forEach(cat => {
            const isActive = cat.id === this.activeGlossaryCatId;
            html += `
                <button class="db-tab-btn ${isActive ? 'active' : ''}" data-cat-id="${cat.id}" role="tab" aria-selected="${isActive}">
                    <i class="fa-solid ${cat.icon}"></i>
                    <span>${cat.label}</span>
                </button>
            `;
        });
        html += `</div>`;

        // 2. Barra de Búsqueda de Términos
        html += `
            <div class="db-search-bar">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" id="glossarySearchInput" placeholder="Buscar término, acrónimo, rol (ej: PAX, COORD, DTW, CUPS)..." value="${this.glossarySearchQuery}">
            </div>
            <div id="glossaryCardsContainer"></div>
        `;

        container.innerHTML = html;

        // Renderizar las tarjetas
        this.renderGlossaryCardsOnly();

        // Enlazar eventos de tabs de categorías
        container.querySelectorAll('.db-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetCat = e.currentTarget.getAttribute('data-cat-id');
                if (targetCat) {
                    this.activeGlossaryCatId = targetCat;
                    this.renderGlossary();
                }
            });
        });

        // Enlazar input de búsqueda
        const searchInput = container.querySelector('#glossarySearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.glossarySearchQuery = e.target.value;
                this.renderGlossaryCardsOnly();
            });
        }
    }

    static renderGlossaryCardsOnly() {
        const container = document.getElementById('glossaryCardsContainer');
        if (!container) return;

        const q = this.glossarySearchQuery.toLowerCase().trim();
        const filteredTerms = GLOSSARY_TERMS.filter(item => {
            const matchesCat = (this.activeGlossaryCatId === 'cat-all') || (item.category === this.activeGlossaryCatId);
            if (!matchesCat) return false;
            if (!q) return true;
            return item.term.toLowerCase().includes(q) ||
                   item.title.toLowerCase().includes(q) ||
                   item.meaning.toLowerCase().includes(q) ||
                   item.origin.toLowerCase().includes(q);
        });

        if (filteredTerms.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px; color: var(--text-subtle);">
                    <i class="fa-solid fa-circle-question" style="font-size: 2rem; margin-bottom: 8px;"></i>
                    <p>No se encontraron términos para "<strong>${this.glossarySearchQuery}</strong>".</p>
                </div>
            `;
            return;
        }

        let html = `<div class="glossary-grid">`;
        filteredTerms.forEach(t => {
            html += `
                <div class="glossary-card">
                    <div class="glossary-card-header">
                        <div class="glossary-term-wrap">
                            <span class="glossary-term-code">${t.term}</span>
                            <span class="glossary-term-title">${t.title}</span>
                        </div>
                        <span class="flow-badge ${t.badgeClass}">${t.badge}</span>
                    </div>
                    <div class="glossary-term-origin"><i class="fa-solid fa-circle-info"></i> ${t.origin}</div>
                    <div class="glossary-term-meaning">${t.meaning}</div>
                    <div class="glossary-example-box">
                        <strong>💡 Ejemplo real:</strong> ${t.example}
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        container.innerHTML = html;
    }

    static openDrawer(drawerId) {
        const el = document.getElementById(drawerId);
        if (el) el.style.display = 'flex';
    }

    static closeDrawer(drawerId) {
        const el = document.getElementById(drawerId);
        if (el) el.style.display = 'none';
    }

    static closeAllDrawers() {
        document.querySelectorAll('.drawer-overlay').forEach(d => d.style.display = 'none');
    }

    static setFontSize(size, btn) {
        document.documentElement.setAttribute('data-font-size', size);
        document.querySelectorAll('#btnFontNormal, #btnFontLarge, #btnFontXLarge').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        notifyStateChange('fontSize', size);
    }

    static setHighContrast(enable, btn) {
        document.documentElement.setAttribute('data-contrast', enable ? 'high' : 'normal');
        document.querySelectorAll('#btnContrastNormal, #btnContrastHigh').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        notifyStateChange('highContrast', enable);
    }

    static setDyslexiaFont(enable, btn) {
        document.documentElement.setAttribute('data-dyslexia', enable ? 'true' : 'false');
        document.querySelectorAll('#btnDyslexiaOff, #btnDyslexiaOn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        notifyStateChange('dyslexiaFont', enable);
    }

    static toggleTheme() {
        const root = document.documentElement;
        const current = root.getAttribute('data-theme') || 'light';
        const next = current === 'light' ? 'dark' : 'light';
        root.setAttribute('data-theme', next);

        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.className = next === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
        }

        notifyStateChange('theme', next);
        MermaidManager.init(next);
        MermaidManager.renderAll();
    }
}

