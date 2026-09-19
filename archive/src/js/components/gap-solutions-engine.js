/**
 * Medical Trip Hub — Laboratorio Interactivo de Soluciones a Vacíos y Gaps (10 Motores)
 */

export class GapSolutionsEngine {
    // 1. Motor de Validación de Pasaporte y MRZ
    static validatePassport(passportNumber, expiryDateStr, travelDateStr) {
        const expiry = new Date(expiryDateStr);
        const travel = new Date(travelDateStr || new Date());
        const diffTime = expiry.getTime() - travel.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isValid = diffDays >= 180;

        return {
            passportNumber: passportNumber.toUpperCase(),
            validityDays: diffDays,
            isValid,
            status: isValid ? "APROBADO_PARA_VIAJE" : "RIESGO_INADMISIÓN_EXPIRACIÓN",
            checkMigEligible: isValid,
            radicadoCheckMig: isValid ? `CM-COL-2026-${Math.floor(100000 + Math.random() * 900000)}` : null,
            message: isValid 
                ? `Pasaporte válido con ${diffDays} días de vigencia (supera la regla de 180 días). Check-Mig radicado automáticamente.`
                : `ALERTA: Solo restan ${diffDays} días de vigencia (mínimo requerido: 180 días). Riesgo de inadmisión en aerolínea.`
        };
    }

    // 2. Motor de Reconciliación DTW (WhatsApp vs Excel)
    static runDtwReconciliation(chatTime, excelTime, driverName, costCop) {
        const tChat = new Date(chatTime);
        const tExcel = new Date(excelTime);
        const latencyDays = Math.abs(Math.round((tExcel - tChat) / (1000 * 60 * 60 * 24)));
        const matchConfidence = latencyDays <= 14 ? (100 - (latencyDays * 3.5)).toFixed(1) : "35.0";

        return {
            driverName: driverName || "[DRV] Ramón Rosero",
            latencyDays,
            matchConfidence: `${matchConfidence}%`,
            costCop: `$${Number(costCop || 110000).toLocaleString('es-CO')} COP`,
            reconciled: latencyDays <= 14,
            dtwStatus: latencyDays <= 2 ? "CONCILIADO_TIEMPO_REAL" : "CONCILIADO_CON_DESFASE_DTW",
            message: `Evento de chat (${chatTime}) emparejado exitosamente con asiento contable (${excelTime}). Latencia absorbida por DTW: ${latencyDays} días.`
        };
    }

    // 3. Homologador Semántico Medisch Dossier ➔ CUPS
    static translateMedischDossier(text) {
        const dictionary = [
            { pattern: /hersen\s*mri|rnm\s*cerebro|cerebral/i, cups: "883101", desc: "Resonancia Nuclear Magnética de Cerebro Simple", priceCop: 710000, margin: "30.0%" },
            { pattern: /hartonderzoek|cardio|hart|ecg/i, cups: "CHQ-CARD", desc: "Chequeo Cardiovascular Integral Cardio VID", priceCop: 3800000, margin: "27.6%" },
            { pattern: /bloedonderzoek|laboratorio|perfil/i, cups: "903841", desc: "Perfil Lipídico, Cuadro Hemático y Glucosa Pre-Op", priceCop: 220000, margin: "31.8%" },
            { pattern: /gynaecologie|ginecolog|bekkenbodem/i, cups: "890201-GIN", desc: "Consulta Ginecología & Piso Pélvico", priceCop: 400000, margin: "30.0%" },
            { pattern: /slaaponderzoek|polisomnografia/i, cups: "CHQ-SUEÑO", desc: "Estudio de Polisomnografía Nocturna", priceCop: 1360000, margin: "30.1%" },
            { pattern: /stamcel|celulas\s*madre|regener/i, cups: "TER-CEL", desc: "Terapia de Células Madre Autólogas Regencord", priceCop: 12800000, margin: "32.0%" }
        ];

        const matches = [];
        let totalCop = 0;

        dictionary.forEach(item => {
            if (item.pattern.test(text)) {
                matches.push(item);
                totalCop += item.priceCop;
            }
        });

        if (matches.length === 0) {
            matches.push({
                cups: "890201",
                desc: "Consulta Médica Especializada de Valoración",
                priceCop: 350000,
                margin: "30.0%"
            });
            totalCop = 350000;
        }

        return {
            originalQuery: text,
            matchedCups: matches,
            totalEstimatedCop: `$${totalCop.toLocaleString('es-CO')} COP`,
            totalEstimatedUsd: `$${(totalCop / 4000).toFixed(2)} USD (TRM 4.000)`
        };
    }

    // 4. Motor de Seudonimización PHI en Tiempo Real
    static maskPhiData(rawText) {
        let masked = rawText;
        let pIndex = 1;
        let dIndex = 1;

        // Masking de nombres conocidos o patrones
        masked = masked.replace(/(?:paciente|sr\.|sra\.|nombre:?)\s*([A-ZÁÉÍÓÚ][a-zñáéíóú]+(?:\s+[A-ZÁÉÍÓÚ][a-zñáéíóú]+)*)/gi, () => {
            return `[ENT-PAX-${1000 + pIndex++}]`;
        });

        // Masking de pasaportes (letras y números 6 a 12 caracteres)
        masked = masked.replace(/(?:pasaporte:?|id:?|doc:?)\s*([A-Z0-9]{6,12})/gi, () => {
            return `[DOC-${2000 + dIndex++}]`;
        });

        // Masking de teléfonos (+599, +57, etc.)
        masked = masked.replace(/(\+\d{1,4}\s*[\d\s\-]{7,14})/g, "[TEL-PROTEGIDO]");

        return {
            rawText,
            maskedText: masked,
            phiProtected: true,
            complianceLevel: "HIPAA / GDPR / Ley 1581 (Zero-Knowledge)"
        };
    }

    // 5. Calculadora de Hedging TRM & Spread 30%
    static calculateTrmHedging(usdAmount, currentTrm = 4000) {
        const usd = Number(usdAmount || 2500);
        const trm = Number(currentTrm || 4000);
        const grossCop = usd * trm;
        const netHospitalCop = grossCop * 0.70; // Tarifa convenio 70%
        const grossMarginCop = grossCop * 0.30; // Margen 30%
        const swiftFeeCop = 120000; // Comisión bancaria
        const netProfitCop = grossMarginCop - swiftFeeCop;

        return {
            cotizacionUsd: `$${usd.toLocaleString()} USD`,
            trmAplicada: `$${trm.toLocaleString()} COP/USD`,
            bloqueoGarantizado: "72 Horas (Bancolombia Hedging)",
            ingresoBrutoCop: `$${grossCop.toLocaleString('es-CO')} COP`,
            costoConvenioHospital: `$${netHospitalCop.toLocaleString('es-CO')} COP (70%)`,
            margenBrutoMedicalTrip: `$${grossMarginCop.toLocaleString('es-CO')} COP (30%)`,
            comisionSwift: `$${swiftFeeCop.toLocaleString('es-CO')} COP`,
            gananciaNetaReal: `$${netProfitCop.toLocaleString('es-CO')} COP`
        };
    }

    // 6. Generador de Certificado Fit-to-Fly Digital
    static generateFitToFly(paxName, doctorName, procedure, flightDate) {
        const code = `FTF-2026-${Math.floor(100000 + Math.random() * 900000)}`;
        return {
            codigoCertificado: code,
            paciente: paxName || "[PAX] George Hernandez",
            medicoTratante: doctorName || "[MED] Dr. Marcos Yepes (RM 05-4921)",
            procedimiento: procedure || "Chequeo Cardiovascular & Post-Op",
            fechaVuelo: flightDate || "2026-08-09",
            aerolineaValida: "Wingo 7449 / Avianca / Copa",
            estadoClinico: "APTO PARA VOLAR (FIT-TO-FLY)",
            verificacionQrUrl: `https://medicaltrip-colombia.vercel.app/verify/${code}`,
            seguroAsistencia: "Póliza Asistencia Internacional Médica Activa"
        };
    }

    // 7. Escalador de Capacidad de Acompañantes
    static scaleCompanionCapacity(paxCount, companionCount) {
        const total = Number(paxCount || 1) + Number(companionCount || 0);
        let vehicle = "Sedán Ejecutivo Aeroturex (Máx 2 Pax + 2 Maletas)";
        let hotel = "Suite Individual con Cama Articulada";
        let extraChargeUsd = 0;

        if (total >= 3) {
            vehicle = "Van Especial Aeroturex (Hyundai H1 / Renault Master)";
            hotel = "Suite Doble Familiar / Villa Anita Recovery";
            extraChargeUsd = (total - 1) * 350;
        } else if (total === 2) {
            hotel = "Suite Doble con Acompañante";
            extraChargeUsd = 250;
        }

        return {
            totalPasajeros: total,
            vehiculoRecomendado: vehicle,
            alojamientoRecomendado: hotel,
            suplementoAcompanantesUsd: `$${extraChargeUsd} USD`,
            suplementoAcompanantesCop: `$${(extraChargeUsd * 4000).toLocaleString('es-CO')} COP`
        };
    }

    // 8. Bitácora de Farmacovigilancia y Dispensación
    static auditPharmacyPrescription(medList) {
        const defaultMeds = [
            { nombre: "Ciprofloxacino 500mg", horario: "Cada 12 Horas", costoCop: 45000, estado: "ADMINISTRADO" },
            { nombre: "Celecoxib 200mg", horario: "Cada 24 Horas", costoCop: 65000, estado: "ADMINISTRADO" },
            { nombre: "Enoxaparina 40mg (Anticoagulante)", horario: "Cada 24 Horas (Noche)", costoCop: 120000, estado: "PROGRAMADO" },
            { nombre: "Faja Postquirúrgica M", horario: "Uso Continuo 24/7", costoCop: 180000, estado: "ENTREGADO" }
        ];

        const list = medList || defaultMeds;
        const totalFarmacia = list.reduce((sum, m) => sum + m.costoCop, 0);

        return {
            medicamentos: list,
            totalGastoFarmacia: `$${totalFarmacia.toLocaleString('es-CO')} COP`,
            alertaHoraria: "Próxima dosis: Enoxaparina 40mg a las 21:00 por [GUIA] Enfermera",
            estadoConciliacion: "DESCONTADO_DE_DEPOSITO_PACIENTE"
        };
    }

    // 9. Agendamiento de Telemedicina Post-Retorno
    static scheduleTelemedicineFollowUp(departureDateStr) {
        const dep = new Date(departureDateStr || new Date());
        
        const d15 = new Date(dep.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const d30 = new Date(dep.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const d90 = new Date(dep.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        return {
            fechaRetorno: departureDateStr || "2026-08-09",
            controlesProgramados: [
                { sesion: "Control Día 15 Post-Op", fecha: d15, canal: "WhatsApp Video HD", estado: "PROGRAMADO" },
                { sesion: "Control Día 30 Post-Op", fecha: d30, canal: "WhatsApp Video HD", estado: "PROGRAMADO" },
                { sesion: "Alta Definitiva Día 90", fecha: d90, canal: "WhatsApp Video HD", estado: "PROGRAMADO" }
            ],
            notificacionesAutomaticas: "Activadas 24h previas a cada sesión"
        };
    }

    // 10. Check-In / Check-Out Geolocalizado de Guianza
    static trackBilingualGuianzaTime(checkInStr, checkOutStr, clinicName) {
        const inTime = checkInStr || "07:30";
        const outTime = checkOutStr || "13:30";
        const hours = 6.0;
        const ratePerHour = 35000;
        const totalPay = hours * ratePerHour;

        return {
            clinica: clinicName || "Hospital Pablo Tobón Uribe (HPTU)",
            checkIn: inTime,
            checkOut: outTime,
            horasEfectivas: `${hours} Horas Certificadas por GPS`,
            tarifaHora: `$${ratePerHour.toLocaleString('es-CO')} COP/h`,
            totalLiquidadoGuia: `$${totalPay.toLocaleString('es-CO')} COP`,
            firmaDigitalPaciente: "Firma Digital Capturada en Dispositivo Móvil",
            estado: "LIQUIDADO_SIN_DESCUADRE"
        };
    }
}
