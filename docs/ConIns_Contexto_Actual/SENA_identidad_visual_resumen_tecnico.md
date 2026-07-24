# Resumen Técnico – Manual de Identidad Visual SENA 2024

> Documento de referencia para implementación de estilos, tipografía, paleta de colores e identidad visual en el proyecto. Generado a partir del Manual de Identidad Visual SENA 2024.

---

## 1. TIPOGRAFÍA

### Fuente principal — Work Sans
Tipografía institucional oficial para todos los marcos comunicacionales del SENA.

| Peso | Uso recomendado |
|------|----------------|
| Light | Cuerpo de texto extenso |
| Regular / Italic | Texto general |
| Medium / SemiBold | Subtítulos, énfasis moderado |
| **Bold / Extrabold** | **Títulos, llamadas a la acción** |
| Black | Titulares de gran tamaño |

**Pesos NO recomendados:** Thin, ExtraLight (incumplen criterios de accesibilidad en colores claros).

- Disponible en Google Fonts: `https://fonts.google.com/specimen/Work+Sans`
- Las variaciones de línea fina deben usarse **únicamente en negro** para garantizar accesibilidad.

### Fuente secundaria — Calibri
Para boletines internos, divulgación de servicios y contenido web.

| Peso | Uso |
|------|-----|
| Light / Light Italic | Texto complementario |
| Regular / Italic | Cuerpo general |
| **Bold / Bold Italic** | Énfasis, titulares secundarios |

**Especificaciones documentales con Calibri:**
- Titular boletín prensa: Calibri Bold 16pt, centrado, máx. 100 caracteres
- Destacado: Calibri Italic 12pt (sin negrita), máx. 200 caracteres, justificado
- Cuerpo: Calibri Regular 12pt, justificado
- Subtítulos audiovisuales: Calibri Regular 40pt, interlineado 40pt, sombra negra

### Fuente para eventos — Josefin Sans Bold
Únicamente para identificadores de eventos y campañas de corta vigencia (versión vertical).

---

## 2. PALETA DE COLORES

### Color principal

| Nombre | HEX | RGB | CMYK |
|--------|-----|-----|------|
| **Verde institucional SENA** | `#39A900` | R:57 G:169 B:0 | C:75% M:0% Y:100% K:0% |

> Este es el color exclusivo del logosímbolo. Solo puede aplicarse en versión verde, blanco o negro. **Nunca en otros colores.**

### Colores secundarios

| Nombre | HEX | RGB | CMYK | Uso |
|--------|-----|-----|------|-----|
| Verde oscuro | `#007832` | R:0 G:120 B:150 | C:88% M:27% Y:100% K:14% | Fondos, textos, elementos complementarios |
| Azul oscuro / Navy | `#00304D` | R:0 G:48 B:77 | C:100% M:77% Y:43% K:42% | Fondos formales, contraste |
| Violeta | `#71277A` | R:113 G:39 B:122 | C:68% M:98% Y:11% K:2% | Estrategia CampeSENA, acento |
| Azul claro / Cyan | `#50E5F9` | R:80 G:229 B:249 | C:55% M:0% Y:11% K:0% | Acento digital, íconos |
| Amarillo | `#FDC300` | R:253 G:195 B:0 | C:0% M:25% Y:94% K:0% | Estrategia Full Popular, acento |

### Neutros y base

| Nombre | HEX | RGB | Uso |
|--------|-----|-----|-----|
| Blanco | `#FFFFFF` | R:255 G:255 B:255 | Fondo principal, logo en negativo |
| Negro | `#000000` | R:0 G:0 B:0 | Texto, logo en negativo |
| Gris claro | `#F6F6F6` | R:246 G:246 B:246 | Fondos alternativos, separadores |

### Variaciones tonales por color

Cada color de la paleta dispone de una escala tonal completa (más oscuro → base → más claro). Usar para estados hover, fondos alternativos, jerarquía visual y accesibilidad.

| Color base | Oscuro (aprox.) | Base oficial | Claro (aprox.) |
|------------|-----------------|--------------|----------------|
| Verde institucional | `#1a5200` | `#39A900` | `#a8e06b` |
| Verde oscuro | `#003d19` | `#007832` | `#4db87a` |
| Violeta | `#2e0033` | `#71277A` | `#c47fcc` |
| Navy / Azul oscuro | `#001520` | `#00304D` | `#4d85a8` |
| Cyan / Azul claro | `#006b7a` | `#50E5F9` | `#b8f5ff` |
| Amarillo | `#7a5c00` | `#FDC300` | `#ffe680` |
| Gris neutro | `#333333` | `#888888` | `#F6F6F6` |

> Los valores aproximados de variaciones tonales fueron extraídos visualmente del Manual. Para implementación precisa, usar como referencia y ajustar con herramienta de color si se requiere fidelidad exacta.

### Variables CSS sugeridas para el proyecto

```css
:root {
  /* Colores principales */
  --sena-green:        #39A900;
  --sena-green-dark:   #007832;
  --sena-navy:         #00304D;

  /* Colores secundarios */
  --sena-violet:       #71277A;
  --sena-cyan:         #50E5F9;
  --sena-yellow:       #FDC300;

  /* Neutros */
  --sena-white:        #FFFFFF;
  --sena-black:        #000000;
  --sena-gray-light:   #F6F6F6;

  /* Tipografía */
  --font-primary:      'Work Sans', sans-serif;
  --font-secondary:    'Calibri', 'Liberation Sans', sans-serif;
}
```

---

## 3. LOGOSÍMBOLO

### Descripción visual del logosímbolo
El logosímbolo SENA es el elemento principal de identidad. Combina un símbolo gráfico (figura humana estilizada en camino hacia el horizonte) con el logotipo tipográfico "SENA" construido en **Zurich Ultra Bold Extended**. La figura está compuesta por:
- **Círculo superior** — cabeza, sirve además como unidad de medida para el área de seguridad
- **Franja horizontal central** — contiene el logotipo "SENA" en mayúsculas
- **Estructura inferior en V** — piernas abiertas que sugieren movimiento y avance

### Versiones permitidas
| Versión | Fondo permitido |
|---------|----------------|
| Verde institucional | Blanco o negro |
| Blanco (negativo) | Fondos oscuros o fotografías con filtro |
| Negro | Fondos claros de bajo contraste |

### Tamaños mínimos de reproducción
- **Impreso:** 1 cm de ancho mínimo
- **Digital:** 50 px de ancho mínimo

### Área de seguridad
El espacio libre alrededor del logo se mide usando el **círculo superior del logosímbolo** como unidad de referencia. Ningún elemento puede invadir ese margen.

### Versión responsive
Cuando la legibilidad se ve afectada por el tamaño, se permite desagregar el logosímbolo del logotipo, siempre manteniendo sus proporciones originales.

### Usos incorrectos (prohibidos)
- Versiones anteriores o desactualizadas
- Distorsión o alteración de proporciones
- Rotación
- Degradados o rellenos especiales
- Modificar orden o proporción de elementos
- Agregar sombras, biseles, volumen o efectos
- Usar colores distintos a verde, blanco o negro
- Contenedores que no respeten el área de seguridad
- Logo verde sobre fondos de colores saturados distintos al blanco/negro
- Cambiar su tipografía

---

## 4. ARQUITECTURA DEL COLOR – CASOS DE USO

### Caso 1 – Comunicación institucional formal
- **80% blanco/gris claro + 20% verde**
- Para documentos, formatos, comunicaciones internas y externas de carácter institucional

### Caso 2 – Posicionamiento del color corporativo
- **80% verde + 20% blanco**
- Para piezas que impulsen la economía campesina o requieran fuerte presencia de marca
- Usar texto corto, tipografía de trazo grueso, tamaño generoso para accesibilidad

### Caso 3 – Fotografía predominante
- La fotografía ocupa el área principal
- Los elementos de color corporativo complementan
- El logo siempre en su variante correcta según contraste del fondo

---

## 5. ICONOGRAFÍA

- Los íconos deben ser **sin relleno**, compuestos únicamente por línea de contorno (*outline*)
- Mantener proporciones del trazo al escalar: 200%, 100%, 75%, 50%
- No distorsionar el grosor de la línea al cambiar tamaño

---

## 6. FOTOGRAFÍA

### Lineamientos editoriales
- Imágenes positivas que promuevan: emprendimiento, innovación, trabajo en equipo, talento regional
- Contraste estable y estética minimalista
- Frases cortas y contundentes
- Variedad de planos narrativos
- Imágenes reales (no ilustraciones como sustituto de fotografía)

### Usos prohibidos
- Imágenes con tratamiento negativo (invertidas)
- Tipografía sobre imagen con bajo contraste o legibilidad insuficiente

---

## 7. APLICACIONES DIGITALES

### Presentaciones
- Logo: esquina superior izquierda o según composición, respetando siempre el área de reserva
- Portada y cierre con templates institucionales (código GC-F-004)

### Contenido audiovisual
- Logo en esquina **superior derecha**: 53px del borde superior, 96px del borde derecho
- Tamaño del logo: **101px de ancho**
- Versiones: verde con fondo blanco o viceversa (blanco con fondo verde)
- Banners informativos: máximo 60 caracteres
- Subtítulos: Calibri Regular 40pt, interlineado 40pt, sombra negra

### E-cards / piezas digitales
- Ancho: **950px**
- Alto sugerido: **700px** (variable según contenido)
- Textos cortos con llamado a la acción claro

### Redes sociales
- Los logos de plataformas (Facebook, Instagram, etc.) **nunca en verde** — usar en blanco, negro o escala de grises
- URL del sitio web siempre en **minúscula**

---

## 8. MARCACIONES DE PROGRAMAS Y SERVICIOS

### Identificadores internos
- Formato: Logo SENA + línea vertical + nombre del programa en **Work Sans**
- Separación logo-línea: equivalente al tamaño del círculo superior del logosímbolo
- Si el nombre excede **25 caracteres**, se puede partir en más líneas
- Máximo **2 identificadores adicionales** junto al logo SENA; si son 3 o más, solo va el logo

---

## 9. COBRANDING

### Con entidades del Estado
- Disposición horizontal, separados por línea vertical
- Espacio entre logos = ancho del escudo de armas
- Si la campaña es del Gobierno o Ministerio de Trabajo: logo SENA al **final** (jerarquía institucional)

### Con empresas privadas
- Logo SENA siempre **primero** (posición prioritaria)
- En campañas SENA con apoyo de privados: logo SENA en parte superior, los demás en parte inferior

---

## 10. TOKENS DE DISEÑO ADICIONALES

```json
{
  "logo": {
    "min_width_print": "1cm",
    "min_width_digital": "50px",
    "audiovisual_width": "101px",
    "audiovisual_position": "top-right",
    "audiovisual_margin_top": "53px",
    "audiovisual_margin_right": "96px"
  },
  "typography": {
    "primary": "Work Sans",
    "secondary": "Calibri",
    "events": "Josefin Sans",
    "logotype": "Zurich Ultra Bold Extended"
  },
  "colors": {
    "brand_primary": "#39A900",
    "brand_secondary": ["#007832", "#00304D", "#71277A", "#50E5F9", "#FDC300"],
    "neutrals": ["#FFFFFF", "#000000", "#F6F6F6"]
  },
  "ecard": {
    "width": "950px",
    "height_suggested": "700px"
  },
  "press_release": {
    "headline_font": "Calibri Bold",
    "headline_size": "16pt",
    "headline_max_chars": 100,
    "body_font": "Calibri Regular",
    "body_size": "12pt",
    "body_alignment": "justified"
  }
}
```

---

## 11. FUENTES DE REFERENCIA Y RECURSOS OFICIALES

- **Sitio web oficial:** `www.sena.edu.co`
- **Línea de atención ciudadana:** 018000 91 02 70 (resto del país gratuita)
- **Bogotá:** 601 736 60 60
- **WhatsApp:** 316 876 02 55
- **Tipografía Work Sans:** disponible en Google Fonts (gratuita, licencia OFL)
- **Calibri:** incluida en Microsoft Office; alternativa web: Liberation Sans o similar
- Los archivos fuente (logos SVG/AI, plantillas, texturas) se encuentran en el SharePoint institucional del SENA

---

*Resumen generado a partir del Manual de Identidad Visual SENA 2024. Para usos institucionales oficiales, consultar el documento original y obtener los archivos fuente del equipo de comunicaciones de la Dirección General del SENA.*
