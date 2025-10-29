# 🧪 Guía de Pruebas de Seguridad

## Instrucciones para Probar las Medidas de Seguridad Implementadas

Este documento proporciona casos de prueba específicos para verificar que todas las vulnerabilidades han sido corregidas.

---

## 🚀 Preparación

1. Inicia un servidor local:
   ```bash
   python3 -m http.server 8000
   ```

2. Abre tu navegador en: `http://localhost:8000/index.html`

3. Abre las DevTools del navegador (F12) para ver la consola

---

## ✅ Pruebas de Seguridad

### Prueba 1: Validación de Nombre del Jugador

#### Test 1.1: Caracteres HTML (XSS Básico)
**Objetivo:** Verificar que el código HTML no se ejecuta

**Pasos:**
1. En el campo de nombre, ingresa: `<script>alert('XSS')</script>`
2. Haz clic en "Empezar!"

**Resultado Esperado:**
- ❌ Debe mostrar un alert: "El nombre contiene caracteres no permitidos."
- ✅ El borde del input debe volverse rojo
- ✅ No debe permitir continuar al juego

---

#### Test 1.2: Inyección de Imagen con onerror
**Objetivo:** Verificar que eventos JavaScript no se ejecutan

**Pasos:**
1. Ingresa: `<img src=x onerror="alert('Hacked')">`
2. Intenta empezar el juego

**Resultado Esperado:**
- ❌ Debe rechazar la entrada
- ✅ Mensaje de error sobre caracteres no permitidos

---

#### Test 1.3: Nombre Muy Largo
**Objetivo:** Verificar límite de 50 caracteres

**Pasos:**
1. Ingresa un nombre de más de 50 caracteres: `AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`
2. Intenta empezar

**Resultado Esperado:**
- ❌ Debe mostrar: "El nombre no puede tener más de 50 caracteres."
- ✅ El input HTML tiene `maxlength="50"` que previene escribir más

---

#### Test 1.4: Nombre Vacío
**Objetivo:** Verificar que no se aceptan nombres vacíos

**Pasos:**
1. Deja el campo vacío o solo con espacios: `   `
2. Haz clic en "Empezar!"

**Resultado Esperado:**
- ❌ Debe mostrar: "El nombre no puede estar vacío."

---

#### Test 1.5: Caracteres Especiales Peligrosos
**Objetivo:** Verificar que se rechazan caracteres SQL/Path traversal

**Pasos:**
1. Prueba cada uno de estos:
   - `'; DROP TABLE users--`
   - `../../etc/passwd`
   - `<iframe src='javascript:alert(1)'>`
   - `javascript:alert('XSS')`

**Resultado Esperado:**
- ❌ Todos deben ser rechazados
- ✅ Mensaje: "El nombre contiene caracteres no permitidos."

---

#### Test 1.6: Nombre Válido con Acentos
**Objetivo:** Verificar que nombres legítimos funcionan

**Pasos:**
1. Ingresa: `José María Pérez`
2. Haz clic en "Empezar!"

**Resultado Esperado:**
- ✅ Debe aceptar el nombre
- ✅ Borde verde en el input
- ✅ Debe avanzar a la pantalla de selección de preguntas

---

#### Test 1.7: Validación en Tiempo Real
**Objetivo:** Verificar feedback visual inmediato

**Pasos:**
1. Comienza a escribir un nombre válido: `Juan`
   - ✅ Borde debe volverse verde
2. Agrega un carácter inválido: `Juan<`
   - ✅ Borde debe volverse rojo
   - ✅ Tooltip debe mostrar el error
3. Borra el carácter inválido
   - ✅ Borde debe volver a verde

---

### Prueba 2: Content Security Policy (CSP)

#### Test 2.1: Verificar CSP en Headers
**Objetivo:** Confirmar que CSP está activo

**Pasos:**
1. Abre DevTools (F12)
2. Ve a la pestaña "Network"
3. Recarga la página
4. Haz clic en el documento HTML
5. Ve a la pestaña "Headers"

**Resultado Esperado:**
- ✅ Debe existir un header `Content-Security-Policy`
- ✅ O un meta tag en el HTML con la política

---

#### Test 2.2: Intentar Ejecutar Script Inline
**Objetivo:** Verificar que CSP bloquea scripts inline

**Pasos:**
1. Abre la consola del navegador
2. Ejecuta: `eval("alert('CSP Test')")`

**Resultado Esperado:**
- ❌ Debe mostrar error en consola
- ✅ Mensaje similar a: "Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source"

---

### Prueba 3: Validación de JSON de Preguntas

#### Test 3.1: JSON Válido
**Objetivo:** Verificar carga normal

**Pasos:**
1. Inicia el juego con un nombre válido
2. Observa la consola

**Resultado Esperado:**
- ✅ Mensaje en consola: "10 preguntas válidas cargadas y sanitizadas"
- ✅ Botones de preguntas se muestran correctamente

---

#### Test 3.2: JSON con Pregunta Inválida (Simulación)
**Objetivo:** Verificar que preguntas malformadas se omiten

**Pasos:**
1. Modifica temporalmente `questions.json` agregando una pregunta inválida:
```json
{
  "id": "invalid",
  "question": 123,
  "options": ["A", "B"],
  "answer": "C",
  "points": -10
}
```
2. Recarga la página
3. Observa la consola

**Resultado Esperado:**
- ⚠️ Warning en consola: "Pregunta inválida detectada y omitida"
- ✅ El juego continúa con las preguntas válidas

---

### Prueba 4: Sanitización de Opciones de Respuesta

#### Test 4.1: Verificar que innerHTML no se usa
**Objetivo:** Confirmar que las opciones usan textContent

**Pasos:**
1. Inicia el juego
2. Selecciona cualquier pregunta
3. Haz clic en "¡VAMOS!"
4. Inspecciona un botón de respuesta con DevTools
5. Busca en el código fuente de `script.js` la línea donde se crean las opciones

**Resultado Esperado:**
- ✅ El código debe usar `createElement` y `textContent`
- ✅ NO debe usar `innerHTML` para insertar las opciones
- ✅ Estructura: `<button><span class="answer-letter">A</span><span class="answer-text">Texto</span></button>`

---

### Prueba 5: Validación del Formulario Netlify

#### Test 5.1: Envío con Datos Válidos
**Objetivo:** Verificar que datos válidos se envían correctamente

**Pasos:**
1. Completa el juego con un nombre válido
2. En la pantalla de resultados, haz clic en "Guardar en el Ranking"
3. Observa la consola del navegador

**Resultado Esperado:**
- ✅ Mensaje: "Formulario enviado con éxito"
- ✅ Botón cambia a "¡Puntaje Guardado!"
- ✅ No hay errores en consola

---

#### Test 5.2: Verificar Sanitización en Formulario
**Objetivo:** Confirmar que los datos se sanitizan antes de enviar

**Pasos:**
1. Abre DevTools > Network
2. Completa el juego
3. Antes de enviar el formulario, inspecciona los campos ocultos:
   ```javascript
   console.log(document.getElementById('hiddenNameInput').value);
   console.log(document.getElementById('hiddenScoreInput').value);
   ```
4. Envía el formulario
5. Observa la petición POST en Network

**Resultado Esperado:**
- ✅ El nombre debe estar sanitizado (sin HTML)
- ✅ El puntaje debe ser un número entero positivo
- ✅ Los datos en la petición POST deben estar limpios

---

### Prueba 6: Pruebas de Integración Completas

#### Test 6.1: Flujo Completo con Nombre Válido
**Objetivo:** Verificar que el juego funciona normalmente con datos válidos

**Pasos:**
1. Ingresa nombre: `María González`
2. Completa todas las preguntas
3. Guarda el puntaje

**Resultado Esperado:**
- ✅ Todo funciona sin errores
- ✅ El nombre se muestra correctamente en el resultado
- ✅ El puntaje se calcula correctamente

---

#### Test 6.2: Intentar Múltiples Ataques XSS
**Objetivo:** Verificar defensa en profundidad

**Pasos:**
1. Intenta estos payloads en el nombre:
   ```
   <svg onload=alert('XSS')>
   "><script>alert('XSS')</script>
   '><script>alert(String.fromCharCode(88,83,83))</script>
   <img src=x onerror=alert('XSS')>
   <body onload=alert('XSS')>
   ```

**Resultado Esperado:**
- ❌ Todos deben ser rechazados
- ✅ Ninguno debe ejecutar código JavaScript
- ✅ Mensajes de error apropiados

---

## 🔍 Verificación en Código

### Checklist de Revisión Manual

Abre `script.js` y verifica:

- [ ] Línea ~8-15: Función `sanitizeHTML()` existe
- [ ] Línea ~17-40: Función `validatePlayerName()` existe
- [ ] Línea ~42-60: Función `validateQuestion()` existe
- [ ] Línea ~62-70: Función `sanitizeQuestion()` existe
- [ ] Línea ~130-160: `loadQuestions()` valida y sanitiza el JSON
- [ ] Línea ~173-195: `showQuestion()` usa `createElement` y `textContent`
- [ ] Línea ~239-260: `goToNextQuestion()` sanitiza datos antes de mostrar
- [ ] Línea ~277-310: `handleSubmit()` valida datos antes de enviar
- [ ] Línea ~308-330: Event listener valida nombre con `validatePlayerName()`

Abre `index.html` y verifica:

- [ ] Línea ~6: Meta tag CSP existe
- [ ] Línea ~15: Input tiene `maxlength="50"`
- [ ] Línea ~15: Input tiene `autocomplete="off"`

---

## 📊 Resultados Esperados

### ✅ Todas las Pruebas Deben Pasar

Si alguna prueba falla:
1. Revisa el código en la ubicación indicada
2. Verifica que los cambios se guardaron correctamente
3. Recarga la página con Ctrl+Shift+R (hard reload)
4. Limpia la caché del navegador si es necesario

---

## 🎯 Métricas de Éxito

- **0 vulnerabilidades XSS** detectadas
- **100% de validación** en inputs del usuario
- **CSP activo** y funcionando
- **Sanitización completa** de datos
- **Juego funcional** con datos legítimos

---

## 📝 Reporte de Pruebas

Usa esta plantilla para documentar tus resultados:

```
Fecha: ___________
Probador: ___________

| Test | Resultado | Notas |
|------|-----------|-------|
| 1.1 - XSS Básico | ✅ / ❌ | |
| 1.2 - Inyección Imagen | ✅ / ❌ | |
| 1.3 - Nombre Largo | ✅ / ❌ | |
| 1.4 - Nombre Vacío | ✅ / ❌ | |
| 1.5 - Caracteres Especiales | ✅ / ❌ | |
| 1.6 - Nombre Válido | ✅ / ❌ | |
| 1.7 - Validación Tiempo Real | ✅ / ❌ | |
| 2.1 - CSP Headers | ✅ / ❌ | |
| 2.2 - CSP Bloqueo | ✅ / ❌ | |
| 3.1 - JSON Válido | ✅ / ❌ | |
| 3.2 - JSON Inválido | ✅ / ❌ | |
| 4.1 - Sin innerHTML | ✅ / ❌ | |
| 5.1 - Envío Válido | ✅ / ❌ | |
| 5.2 - Sanitización Form | ✅ / ❌ | |
| 6.1 - Flujo Completo | ✅ / ❌ | |
| 6.2 - Múltiples XSS | ✅ / ❌ | |

Firma: ___________
```

---

**Última actualización:** 2025-10-29  
**Versión:** 1.0