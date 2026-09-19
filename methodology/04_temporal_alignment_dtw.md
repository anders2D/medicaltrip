# 04. Reconciliación Financiera y Alineamiento Temporal Dinámico (DTW)

## 1. El Desafío del Desfase Asimétrico (Temporal Entropy)
En la operación real de Medical Trip Colombia S.A.S.:
1. **En WhatsApp**: El conductor informa el servicio en tiempo real (ej. *Martes 15:27 pm: "Recogida de George Hernandez en Aeropuerto JMC"*).
2. **En Excel**: La factura o planilla de liquidación de transporte (`Liquidacion_transporte.xlsx`) se registra de forma consolidada varios días después (ej. *Viernes o Lunes siguiente*), a veces agrupando múltiples traslados bajo una sola cuenta de cobro o anticipo.

Un cruce de datos basado en marcas de tiempo exactas (`timestamp matching`) fracasa con un 100% de tasa de desalineación.

---

## 2. Algoritmo Dynamic Time Warping (DTW)

El algoritmo DTW alinea dos secuencias temporales:
- $X = (x_1, x_2, \dots, x_N)$: Secuencia cronológica de eventos operados en WhatsApp.
- $Y = (y_1, y_2, \dots, y_M)$: Secuencia de registros financieros en las hojas de Excel.

Se construye una matriz de costo acumulado $D \in \mathbb{R}^{N \times M}$ donde cada celda $D(i, j)$ representa el costo de emparejar el evento operativo $x_i$ con el registro contable $y_j$:

$$D(i, j) = d(x_i, y_j) + \min \begin{cases} D(i-1, j) & \text{(inserción / retraso administrativo)} \\ D(i, j-1) & \text{(consolidación anticipada)} \\ D(i-1, j-1) & \text{(alineación directa)} \end{cases}$$

### Función de Distancia Compuesta:
$$d(x_i, y_j) = w_1 \cdot |\text{dias}(t_i, t_j)| + w_2 \cdot (1 - \text{similitud\_pax}(x_i, y_j)) + w_3 \cdot |\text{monto\_estimado} - \text{monto\_liquidado}|$$

---

## 3. Restricción de Banda Sakoe-Chiba

Para evitar que el algoritmo empareje eventos de meses distintos de forma artificial, se aplica una **banda de restricción Sakoe-Chiba** con un radio $R = 7\text{ días}$:

$$|i - j| \le R$$

```mermaid
graph LR
    subgraph WhatsApp Timeline (Eventos Reales)
        W1[04-Ago: Solicitud Transporte] --> W2[05-Ago: Recogida Aeropuerto Ramón Rosero]
        W2 --> W3[07-Ago: Traslado Cita HPTU]
        W3 --> W4[10-Ago: Retorno Aeropuerto]
    end

    subgraph DTW Warping Path (Sakoe-Chiba Band)
        W2 -.->|Alineamiento Probabilístico DTW| E1
        W3 -.->|Alineamiento Probabilístico DTW| E1
        W4 -.->|Alineamiento Probabilístico DTW| E2
    end

    subgraph Excel Timeline (Liquidacion_transporte.xlsx)
        E1[08-Ago: Anticipo Aeroturex $300.000] --> E2[15-Ago: Liquidación Final RVA282 $450.000]
    end
```

---

## 4. Implementación en Python

```python
# dtw_reconciliation.py
import numpy as np
from fastdtw import fastdtw
from scipy.spatial.distance import euclidean

def compute_operational_financial_alignment(chat_events, excel_records, max_day_window=7):
    """
    Alinea la serie temporal de eventos de WhatsApp con los registros contables de Excel
    utilizando Dynamic Time Warping con ventana restringida.
    """
    # Vectorizar secuencias: [timestamp_epoch_days, pax_id_hash, service_type_id]
    seq_ops = np.array([[e['epoch_days'], e['pax_hash'], e['service_code']] for e in chat_events])
    seq_fin = np.array([[r['epoch_days'], r['pax_hash'], r['service_code']] for r in excel_records])

    # Ejecución FastDTW
    distance, warping_path = fastdtw(seq_ops, seq_fin, dist=euclidean, radius=max_day_window)
    
    reconciled_pairs = []
    for idx_ops, idx_fin in warping_path:
        reconciled_pairs.append({
            "event_whatsapp": chat_events[idx_ops],
            "record_excel": excel_records[idx_fin],
            "cost_distance": float(euclidean(seq_ops[idx_ops], seq_fin[idx_fin]))
        })
    
    return reconciled_pairs
```
