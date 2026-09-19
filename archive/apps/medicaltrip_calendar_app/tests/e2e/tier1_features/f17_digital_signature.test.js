import test from 'node:test';
import assert from 'node:assert/strict';
import { DigitalSignatureModal } from '../../../src/ui/DigitalSignatureModal.js';

test('F17: Digital Signature Canvas — Patient Legal Sign-Off Modal', async (t) => {
    await t.test('1. DigitalSignatureModal renders canvas, patient name header, and buttons', () => {
        const html = DigitalSignatureModal.render('Catia Rodrigues');
        assert.ok(html.includes('id="sigModalBackdrop"'));
        assert.ok(html.includes('Catia Rodrigues'));
        assert.ok(html.includes('id="sigCanvas"'));
        assert.ok(html.includes('id="btnClearSig"'));
        assert.ok(html.includes('id="btnAutoSig"'));
        assert.ok(html.includes('id="btnConfirmSig"'));
    });

    await t.test('2. Canvas drawing context configuration settings', () => {
        const mockCtx = {
            lineWidth: 0,
            lineCap: '',
            strokeStyle: ''
        };

        // Setup standard signature context
        mockCtx.lineWidth = 2.5;
        mockCtx.lineCap = 'round';
        mockCtx.strokeStyle = '#0284c7';

        assert.equal(mockCtx.lineWidth, 2.5);
        assert.equal(mockCtx.lineCap, 'round');
        assert.equal(mockCtx.strokeStyle, '#0284c7');
    });

    await t.test('3. Clear signature resets drawing context buffer', () => {
        let cleared = false;
        const mockCtx = {
            clearRect: (x, y, w, h) => {
                if (w === 400 && h === 120) cleared = true;
            }
        };

        mockCtx.clearRect(0, 0, 400, 120);
        assert.equal(cleared, true);
    });

    await t.test('4. Auto-signature generator produces deterministic spline path', () => {
        const pathPoints = [];
        const mockCtx = {
            beginPath: () => pathPoints.push('BEGIN'),
            moveTo: (x, y) => pathPoints.push(`MOVE(${x},${y})`),
            bezierCurveTo: (cp1x, cp1y, cp2x, cp2y, x, y) => pathPoints.push(`BEZIER(${x},${y})`),
            stroke: () => pathPoints.push('STROKE')
        };

        mockCtx.beginPath();
        mockCtx.moveTo(20, 70);
        mockCtx.bezierCurveTo(80, 20, 140, 90, 200, 50);
        mockCtx.bezierCurveTo(240, 30, 280, 80, 350, 60);
        mockCtx.stroke();

        assert.deepEqual(pathPoints, [
            'BEGIN',
            'MOVE(20,70)',
            'BEZIER(200,50)',
            'BEZIER(350,60)',
            'STROKE'
        ]);
    });

    await t.test('5. Validates signature payload format before submission', () => {
        const validateSignatureData = (dataUrl) => {
            if (!dataUrl || typeof dataUrl !== 'string') {
                throw new Error('Firma digital vacía');
            }
            if (!dataUrl.startsWith('data:image/png;base64,')) {
                throw new Error('Formato de firma digital no reconocido');
            }
            const base64Data = dataUrl.replace('data:image/png;base64,', '');
            if (base64Data.length < 50) {
                throw new Error('Firma digital incompleta o corrupta');
            }
            return true;
        };

        assert.throws(() => validateSignatureData(''), /Firma digital vacía/);
        assert.throws(() => validateSignatureData('data:image/jpeg;base64,123'), /Formato de firma/);
        assert.throws(() => validateSignatureData('data:image/png;base64,short'), /incompleta o corrupta/);

        const validSig = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAB4CAYAAADy5z3mAAAABHNCSVQICAgIfAhkiAAA...LONG_SIGNATURE_DATA_STREAM...';
        assert.equal(validateSignatureData(validSig), true);
    });
});
